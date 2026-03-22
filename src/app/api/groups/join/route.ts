import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { inviteCode } = body;

  if (!inviteCode?.trim()) {
    return NextResponse.json({ error: "Invite code required" }, { status: 400 });
  }

  const group = await db.group.findUnique({
    where: { inviteCode: inviteCode.trim() },
  });

  if (!group) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  // Check if already a member
  const existing = await db.groupMember.findUnique({
    where: {
      groupId_userId: { groupId: group.id, userId: session.user.id },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 409 });
  }

  await db.groupMember.create({
    data: { groupId: group.id, userId: session.user.id },
  });

  return NextResponse.json(group);
}
