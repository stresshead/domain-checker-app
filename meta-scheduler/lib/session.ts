import { cookies } from "next/headers";
import { createHmac, randomBytes } from "crypto";

const SESSION_COOKIE = "ms_session";
const SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-me";

function sign(payload: string): string {
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verify(token: string): string | null {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = token.slice(0, lastDot);
  const expected = sign(payload);
  return token === expected ? payload : null;
}

export async function getSession(): Promise<{ accountId: string } | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const payload = verify(raw);
  if (!payload) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}

export async function setSession(accountId: string): Promise<void> {
  const payload = Buffer.from(JSON.stringify({ accountId })).toString(
    "base64url"
  );
  const token = sign(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export function generateState(): string {
  return randomBytes(16).toString("hex");
}
