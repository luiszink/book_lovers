import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { commentId } = await params;
  const body = await req.json();
  const value = body.value as number;

  if (value !== 1 && value !== -1 && value !== 0) {
    return NextResponse.json({ error: "value must be 1, -1, or 0" }, { status: 400 });
  }

  // Remove vote
  if (value === 0) {
    await db.commentVote.deleteMany({
      where: { commentId, userId: session.user.id },
    });
  } else {
    // Upsert vote
    await db.commentVote.upsert({
      where: { commentId_userId: { commentId, userId: session.user.id } },
      update: { value },
      create: { commentId, userId: session.user.id, value },
    });
  }

  // Return updated score
  const votes = await db.commentVote.findMany({ where: { commentId } });
  const score = votes.reduce((sum, v) => sum + v.value, 0);
  const userVote = votes.find((v) => v.userId === session.user!.id)?.value ?? 0;

  return NextResponse.json({ score, userVote });
}
