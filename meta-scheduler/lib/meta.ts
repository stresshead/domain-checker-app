const GRAPH_BASE = "https://graph.facebook.com/v21.0";

export function getOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: `${process.env.APP_URL}/api/auth/callback`,
    scope: "publish_to_groups,groups_access_member_info",
    state,
    response_type: "code",
  });
  return `https://www.facebook.com/dialog/oauth?${params}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in?: number;
}> {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: `${process.env.APP_URL}/api/auth/callback`,
    code,
  });
  const res = await fetch(`${GRAPH_BASE}/oauth/access_token?${params}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Token exchange failed");
  }
  return res.json();
}

export async function getMe(
  accessToken: string
): Promise<{ id: string; name: string; email?: string }> {
  const params = new URLSearchParams({
    fields: "id,name,email",
    access_token: accessToken,
  });
  const res = await fetch(`${GRAPH_BASE}/me?${params}`);
  if (!res.ok) throw new Error("Failed to fetch user profile");
  return res.json();
}

export async function getUserGroups(
  accessToken: string
): Promise<{ data: { id: string; name: string }[] }> {
  const params = new URLSearchParams({
    fields: "id,name",
    access_token: accessToken,
  });
  const res = await fetch(`${GRAPH_BASE}/me/groups?${params}`);
  if (!res.ok) throw new Error("Failed to fetch groups");
  return res.json();
}

export async function postToGroup(
  groupId: string,
  message: string,
  accessToken: string
): Promise<{ id: string }> {
  const res = await fetch(`${GRAPH_BASE}/${groupId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: accessToken }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Post failed");
  }
  return res.json();
}
