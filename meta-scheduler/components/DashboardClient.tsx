"use client";

import { useState } from "react";

type Group = { id: string; name: string };

type Post = {
  id: string;
  message: string;
  groupId: string;
  group: Group;
  status: string;
  scheduledAt: string;
  postedAt: string | null;
  errorMsg: string | null;
  createdAt: string;
};

export function DashboardClient({
  groups,
  initialPosts,
}: {
  groups: Group[];
  initialPosts: Post[];
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [message, setMessage] = useState("");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, groupId, scheduledAt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to schedule post");
      setPosts((prev) => [data.post, ...prev].sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      ));
      setMessage("");
      setScheduledAt("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  async function refreshGroups() {
    const res = await fetch("/api/groups", { method: "POST" });
    if (!res.ok) return;
    window.location.reload();
  }

  const pending = posts.filter((p) => p.status === "pending");
  const done = posts.filter((p) => p.status !== "pending");

  const minDateTime = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

  return (
    <div className="space-y-8">
      {/* Schedule a post */}
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Schedule a post</h2>

        {groups.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              No groups found. Make sure your Meta App has{" "}
              <code>publish_to_groups</code> permission and you admin at least
              one group.
            </p>
            <button
              onClick={refreshGroups}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Refresh groups
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Group</label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="What do you want to post?"
                className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Schedule for
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={minDateTime}
                className="rounded-lg border px-3 py-2 text-sm"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Scheduling…" : "Schedule post"}
            </button>
          </form>
        )}
      </section>

      {/* Pending posts */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Upcoming ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-500">No scheduled posts yet.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>

      {/* Past posts */}
      {done.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">History ({done.length})</h2>
          <div className="space-y-3">
            {done.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PostCard({
  post,
  onDelete,
}: {
  post: Post;
  onDelete?: (id: string) => void;
}) {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    posted: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-500">
              {post.group.name}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[post.status] ?? "bg-gray-100 text-gray-700"}`}
            >
              {post.status}
            </span>
          </div>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">
            {post.message}
          </p>
          {post.errorMsg && (
            <p className="mt-1 text-xs text-red-600">{post.errorMsg}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-gray-500">
            {post.status === "posted" && post.postedAt
              ? `Posted ${fmt(post.postedAt)}`
              : `Scheduled ${fmt(post.scheduledAt)}`}
          </p>
          {onDelete && post.status === "pending" && (
            <button
              onClick={() => onDelete(post.id)}
              className="mt-1 text-xs text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
