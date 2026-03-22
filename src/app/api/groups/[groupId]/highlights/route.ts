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
  const { highlightId } = await req.json();

  if (!highlightId) {
    return NextResponse.json({ error: "highlightId required" }, { status: 400 });
  }

  const membership = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const highlight = await db.highlight.findFirst({
    where: {
      id: highlightId,
      userId: session.user.id,
      type: "HIGHLIGHT",
    },
    select: { id: true },
  });

  if (!highlight) {
    return NextResponse.json({ error: "Highlight not found" }, { status: 404 });
  }

  await db.groupHighlight.upsert({
    where: { groupId_highlightId: { groupId, highlightId } },
    update: {},
    create: { groupId, highlightId },
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
  const { highlightId } = await req.json();

  const membership = await db.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
  });

  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.groupHighlight.deleteMany({ where: { groupId, highlightId } });

  return NextResponse.json({ ok: true });
}
