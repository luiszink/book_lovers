import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const highlights = await db.highlight.findMany({
    where: {
      userId: session.user.id,
      type: "HIGHLIGHT",
    },
    select: {
      id: true,
      text: true,
      page: true,
      location: true,
      importedAt: true,
      bookId: true,
      book: {
        select: {
          id: true,
          title: true,
          author: true,
          coverUrl: true,
        },
      },
      _count: { select: { comments: true } },
    },
    orderBy: { importedAt: "desc" },
  });

  return NextResponse.json(highlights);
}
