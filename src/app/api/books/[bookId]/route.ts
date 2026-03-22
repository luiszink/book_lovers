import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookId } = await params;

  const book = await db.book.findUnique({
    where: { id: bookId },
    include: {
      highlights: {
        where: { userId: session.user.id },
        include: {
          linkedNotes: true,
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  return NextResponse.json(book);
}
