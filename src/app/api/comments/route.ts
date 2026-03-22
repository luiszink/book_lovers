import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const userSelect = { id: true, name: true, image: true } as const;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const highlightId = searchParams.get("highlightId");

  if (!highlightId) {
    return NextResponse.json({ error: "highlightId required" }, { status: 400 });
  }

  // Load all comments flat (including nested) — client builds the tree
  const comments = await db.comment.findMany({
    where: { highlightId },
    include: {
      user: { select: userSelect },
      votes: { select: { userId: true, value: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Transform to include score + current user's vote
  const result = comments.map((c) => ({
    id: c.id,
    text: c.text,
    parentId: c.parentId,
    createdAt: c.createdAt,
    user: c.user,
    score: c.votes.reduce((sum, v) => sum + v.value, 0),
    userVote: c.votes.find((v) => v.userId === session.user!.id)?.value ?? 0,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { highlightId, text, parentId } = body;

  if (!highlightId || !text?.trim()) {
    return NextResponse.json(
      { error: "highlightId and text required" },
      { status: 400 }
    );
  }

  // If replying, verify parent exists and belongs to same highlight
  if (parentId) {
    const parent = await db.comment.findUnique({ where: { id: parentId } });
    if (!parent || parent.highlightId !== highlightId) {
      return NextResponse.json({ error: "Invalid parent" }, { status: 400 });
    }
  }

  const comment = await db.comment.create({
    data: {
      highlightId,
      userId: session.user.id,
      text: text.trim(),
      parentId: parentId ?? null,
    },
    include: { user: { select: userSelect } },
  });

  return NextResponse.json({
    ...comment,
    score: 0,
    userVote: 0,
  });
}
