import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const books = await db.book.findMany({
    where: {
      highlights: { some: { userId: session.user.id } },
    },
    select: {
      id: true,
      title: true,
      author: true,
      coverUrl: true,
      createdAt: true,
      _count: { select: { highlights: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(books);
}
