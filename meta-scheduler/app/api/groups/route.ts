import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getUserGroups } from "@/lib/meta";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const account = await prisma.account.findUnique({
    where: { id: session.accountId },
    include: { groups: true },
  });
  if (!account) return Response.json({ error: "Account not found" }, { status: 404 });

  return Response.json({ groups: account.groups });
}

export async function POST() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const account = await prisma.account.findUnique({ where: { id: session.accountId } });
  if (!account) return Response.json({ error: "Account not found" }, { status: 404 });

  try {
    const { data: groups } = await getUserGroups(account.accessToken);
    for (const g of groups) {
      await prisma.group.upsert({
        where: { id: g.id },
        update: { name: g.name },
        create: { id: g.id, name: g.name, accountId: account.id },
      });
    }
    const updated = await prisma.group.findMany({ where: { accountId: account.id } });
    return Response.json({ groups: updated });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
