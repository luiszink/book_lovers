import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseClippings } from "@/lib/parser/clippings-parser";
import { ImportResult } from "@/types";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const content = await file.text();
  const clippings = parseClippings(content);

  const result: ImportResult = {
    booksCreated: 0,
    highlightsCreated: 0,
    notesCreated: 0,
    duplicatesSkipped: 0,
  };

  // Group clippings by book
  const bookMap = new Map<string, typeof clippings>();
  for (const clip of clippings) {
    const key = `${clip.bookTitle}|||${clip.author ?? ""}`;
    if (!bookMap.has(key)) bookMap.set(key, []);
    bookMap.get(key)!.push(clip);
  }

  for (const [, clips] of bookMap) {
    const first = clips[0];

    // Upsert book
    let book = await db.book.findFirst({
      where: { title: first.bookTitle, author: first.author },
    });

    if (!book) {
      book = await db.book.create({
        data: { title: first.bookTitle, author: first.author },
      });
      result.booksCreated++;

      // Fetch cover from Google Books API (fire-and-forget, no API key needed)
      try {
        const query = encodeURIComponent(
          `intitle:${first.bookTitle}${first.author ? `+inauthor:${first.author}` : ""}`
        );
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1&fields=items/volumeInfo/imageLinks`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (res.ok) {
          const data = await res.json();
          const thumbnail: string | undefined =
            data?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
          if (thumbnail) {
            // Use HTTPS instead of HTTP for the cover URL
            const coverUrl = thumbnail.replace(/^http:\/\//, "https://");
            await db.book.update({ where: { id: book.id }, data: { coverUrl } });
            book = { ...book, coverUrl };
          }
        }
      } catch {
        // Cover fetch is optional — ignore errors
      }
    }

    // Track previously created highlights for note-linking
    let lastHighlight: { id: string; location: string | null } | null = null;

    for (const clip of clips) {
      if (clip.type === "BOOKMARK") continue;

      // Check for duplicate by location (preferred) or text prefix
      const existing = clip.location
        ? await db.highlight.findFirst({
            where: {
              bookId: book.id,
              userId: session.user.id,
              location: clip.location,
              type: clip.type,
            },
          })
        : await db.highlight.findFirst({
            where: {
              bookId: book.id,
              userId: session.user.id,
              text: clip.text.slice(0, 500),
              type: clip.type,
            },
          });

      if (existing) {
        result.duplicatesSkipped++;
        if (clip.type === "HIGHLIGHT") {
          lastHighlight = { id: existing.id, location: existing.location };
        }
        continue;
      }

      // Link note to previous highlight if same location
      let linkedHighlightId: string | null = null;
      if (
        clip.type === "NOTE" &&
        lastHighlight &&
        clip.location &&
        lastHighlight.location === clip.location
      ) {
        linkedHighlightId = lastHighlight.id;
      }

      const created = await db.highlight.create({
        data: {
          bookId: book.id,
          userId: session.user.id,
          text: clip.text,
          type: clip.type,
          page: clip.page,
          location: clip.location,
          kindleTimestamp: clip.timestamp,
          linkedHighlightId,
        },
      });

      if (clip.type === "HIGHLIGHT") {
        lastHighlight = { id: created.id, location: created.location };
        result.highlightsCreated++;
      } else {
        result.notesCreated++;
      }
    }
  }

  return NextResponse.json(result);
}
