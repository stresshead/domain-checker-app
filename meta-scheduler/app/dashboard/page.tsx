import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/DashboardClient";

export default async function Dashboard() {
  const session = await getSession();
  if (!session) redirect("/");

  const account = await prisma.account.findUnique({
    where: { id: session.accountId },
    include: {
      groups: true,
      posts: {
        include: { group: true },
        orderBy: { scheduledAt: "asc" },
      },
    },
  });

  if (!account) redirect("/");

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Meta Group Scheduler</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Signed in as <strong>{account.name}</strong>
          </span>
          <a
            href="/api/auth/logout"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Sign out
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6 space-y-8">
        <DashboardClient
          groups={account.groups}
          initialPosts={account.posts.map((p) => ({
            ...p,
            scheduledAt: p.scheduledAt.toISOString(),
            postedAt: p.postedAt?.toISOString() ?? null,
            createdAt: p.createdAt.toISOString(),
          }))}
        />
      </main>
    </div>
  );
}
