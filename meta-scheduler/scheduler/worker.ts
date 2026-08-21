import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function publishDuePosts() {
  const now = new Date();
  const due = await prisma.post.findMany({
    where: {
      status: "pending",
      scheduledAt: { lte: now },
    },
    include: { account: true },
  });

  if (due.length === 0) return;
  console.log(`[scheduler] ${due.length} post(s) to publish`);

  for (const post of due) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${post.groupId}/feed`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: post.message,
            access_token: post.account.accessToken,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json() as { error?: { message?: string } };
        throw new Error(err.error?.message ?? "Post failed");
      }

      const { id: metaPostId } = await res.json() as { id: string };

      await prisma.post.update({
        where: { id: post.id },
        data: { status: "posted", postedAt: new Date(), metaPostId },
      });

      console.log(`[scheduler] posted ${post.id} -> meta id ${metaPostId}`);
    } catch (e) {
      const msg = (e as Error).message;
      console.error(`[scheduler] failed ${post.id}: ${msg}`);
      await prisma.post.update({
        where: { id: post.id },
        data: { status: "failed", errorMsg: msg },
      });
    }
  }
}

// Check every minute
cron.schedule("* * * * *", () => {
  publishDuePosts().catch((e) => console.error("[scheduler] unhandled:", e));
});

console.log("[scheduler] running — checking for due posts every minute");

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
