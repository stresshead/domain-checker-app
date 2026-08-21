import { type NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");

  const posts = await prisma.post.findMany({
    where: {
      accountId: session.accountId,
      ...(status ? { status } : {}),
    },
    include: { group: true },
    orderBy: { scheduledAt: "asc" },
  });

  return Response.json({ posts });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { message, groupId, scheduledAt } = body;

  if (!message?.trim() || !groupId || !scheduledAt) {
    return Response.json({ error: "message, groupId and scheduledAt are required" }, { status: 400 });
  }

  const scheduledDate = new Date(scheduledAt);
  if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    return Response.json({ error: "scheduledAt must be a future date" }, { status: 400 });
  }

  const group = await prisma.group.findFirst({
    where: { id: groupId, accountId: session.accountId },
  });
  if (!group) return Response.json({ error: "Group not found" }, { status: 404 });

  const post = await prisma.post.create({
    data: {
      message: message.trim(),
      groupId,
      accountId: session.accountId,
      scheduledAt: scheduledDate,
      status: "pending",
    },
    include: { group: true },
  });

  return Response.json({ post }, { status: 201 });
}
