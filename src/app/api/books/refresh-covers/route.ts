import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all books without cover that belong to the user's highlights
  const books = await db.book.findMany({
    where: {
      coverUrl: null,
      highlights: { some: { userId: session.user.id } },
    },
    select: { id: true, title: true, author: true },
  });

  let updated = 0;

  for (const book of books) {
    try {
      const query = encodeURIComponent(
        `intitle:${book.title}${book.author ? `+inauthor:${book.author}` : ""}`
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
          const coverUrl = thumbnail.replace(/^http:\/\//, "https://");
          await db.book.update({ where: { id: book.id }, data: { coverUrl } });
          updated++;
        }
      }
    } catch {
      // Skip failed books
    }
  }

  return NextResponse.json({ total: books.length, updated });
}
