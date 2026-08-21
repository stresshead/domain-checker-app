import { type NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const post = await prisma.post.findFirst({
    where: { id, accountId: session.accountId },
  });
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });
  if (post.status !== "pending") {
    return Response.json({ error: "Only pending posts can be deleted" }, { status: 400 });
  }

  await prisma.post.delete({ where: { id } });
  return Response.json({ ok: true });
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await request.json();

  const post = await prisma.post.findFirst({
    where: { id, accountId: session.accountId },
  });
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });
  if (post.status !== "pending") {
    return Response.json({ error: "Only pending posts can be edited" }, { status: 400 });
  }

  const updates: { message?: string; scheduledAt?: Date } = {};
  if (body.message?.trim()) updates.message = body.message.trim();
  if (body.scheduledAt) {
    const d = new Date(body.scheduledAt);
    if (isNaN(d.getTime()) || d <= new Date()) {
      return Response.json({ error: "scheduledAt must be a future date" }, { status: 400 });
    }
    updates.scheduledAt = d;
  }

  const updated = await prisma.post.update({
    where: { id },
    data: updates,
    include: { group: true },
  });
  return Response.json({ post: updated });
}
