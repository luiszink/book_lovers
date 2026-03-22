import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;
  const { bookId } = await req.json();

  if (!bookId) {
    return NextResponse.json({ error: "bookId required" }, { status: 400 });
  }

  // Verify membership
  const membership = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Check book exists
  const book = await db.book.findUnique({ where: { id: bookId } });
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  // Add (idempotent — ignore if already exists)
  await db.groupBook.upsert({
    where: { groupId_bookId: { groupId, bookId } },
    update: {},
    create: { groupId, bookId },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;
  const { bookId } = await req.json();

  // Only owner can remove books
  const membership = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
  });

  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.groupBook.deleteMany({ where: { groupId, bookId } });

  return NextResponse.json({ ok: true });
}
