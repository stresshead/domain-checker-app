import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getOAuthUrl } from "@/lib/meta";
import { generateState } from "@/lib/session";

export async function GET() {
  const state = generateState();
  const store = await cookies();
  store.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });
  redirect(getOAuthUrl(state));
}
