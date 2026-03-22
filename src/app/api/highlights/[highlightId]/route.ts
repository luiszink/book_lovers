import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ highlightId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { highlightId } = await params;

  const highlight = await db.highlight.findUnique({
    where: { id: highlightId },
    include: {
      book: { select: { id: true, title: true, author: true, coverUrl: true } },
      linkedNotes: { select: { id: true, text: true } },
    },
  });

  if (!highlight) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Load neighboring highlights (2 before + 2 after by importedAt)
  const [before, after] = await Promise.all([
    db.highlight.findMany({
      where: {
        bookId: highlight.bookId,
        userId: highlight.userId,
        type: "HIGHLIGHT",
        importedAt: { lt: highlight.importedAt },
      },
      orderBy: { importedAt: "desc" },
      take: 2,
      select: { id: true, text: true, page: true, location: true, importedAt: true },
    }),
    db.highlight.findMany({
      where: {
        bookId: highlight.bookId,
        userId: highlight.userId,
        type: "HIGHLIGHT",
        importedAt: { gt: highlight.importedAt },
      },
      orderBy: { importedAt: "asc" },
      take: 2,
      select: { id: true, text: true, page: true, location: true, importedAt: true },
    }),
  ]);

  const wordCount = highlight.text.trim().split(/\s+/).length;

  return NextResponse.json({
    ...highlight,
    wordCount,
    neighborHighlights: {
      before: before.reverse(),
      after,
    },
  });
}
