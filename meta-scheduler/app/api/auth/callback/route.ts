import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { exchangeCodeForToken, getMe, getUserGroups } from "@/lib/meta";
import { setSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    redirect("/?error=auth_denied");
  }

  const store = await cookies();
  const savedState = store.get("oauth_state")?.value;
  store.delete("oauth_state");

  if (!code || !state || state !== savedState) {
    redirect("/?error=invalid_state");
  }

  try {
    const { access_token, expires_in } = await exchangeCodeForToken(code);
    const me = await getMe(access_token);

    const tokenExpiry = expires_in
      ? new Date(Date.now() + expires_in * 1000)
      : null;

    const account = await prisma.account.upsert({
      where: { facebookId: me.id },
      update: { accessToken: access_token, tokenExpiry, name: me.name },
      create: {
        facebookId: me.id,
        name: me.name,
        email: me.email,
        accessToken: access_token,
        tokenExpiry,
      },
    });

    const { data: groups } = await getUserGroups(access_token);
    for (const g of groups) {
      await prisma.group.upsert({
        where: { id: g.id },
        update: { name: g.name },
        create: { id: g.id, name: g.name, accountId: account.id },
      });
    }

    await setSession(account.id);
  } catch {
    redirect("/?error=auth_failed");
  }

  redirect("/dashboard");
}
