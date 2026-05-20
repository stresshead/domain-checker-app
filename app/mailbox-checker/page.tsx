"use client";

import { useEffect, useState } from "react";

interface Seed {
  provider: string;
  address: string;
}

interface CheckResult {
  provider: string;
  address: string;
  placement: "inbox" | "spam" | "not_found" | "error";
  folder?: string;
  error?: string;
}

const PLACEMENT_STYLES: Record<CheckResult["placement"], string> = {
  inbox: "bg-green-100 text-green-800 border-green-200",
  spam: "bg-red-100 text-red-800 border-red-200",
  not_found: "bg-yellow-100 text-yellow-800 border-yellow-200",
  error: "bg-slate-100 text-slate-600 border-slate-200",
};

const PLACEMENT_LABELS: Record<CheckResult["placement"], string> = {
  inbox: "Inbox",
  spam: "Spam / Junk",
  not_found: "Not found",
  error: "Error",
};

const PROVIDER_ICONS: Record<string, string> = {
  Gmail: "G",
  Outlook: "O",
  Yahoo: "Y",
};

export default function MailboxChecker() {
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [subject, setSubject] = useState("");
  const [sender, setSender] = useState("");
  const [results, setResults] = useState<CheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [seedsLoading, setSeedsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mailbox-seeds")
      .then((r) => r.json())
      .then((data) => setSeeds(data.seeds || []))
      .finally(() => setSeedsLoading(false));
  }, []);

  async function copySeeds() {
    const text = seeds.map((s) => s.address).join(", ");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function runCheck() {
    if (!subject.trim()) return;
    setLoading(true);
    setResults([]);
    setError("");

    try {
      const res = await fetch("/api/mailbox-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), sender: sender.trim() || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Check failed");
      }

      setResults(data.results || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inboxCount = results.filter((r) => r.placement === "inbox").length;
  const spamCount = results.filter((r) => r.placement === "spam").length;
  const hasResults = results.length > 0;

  return (
    <main className="min-h-screen bg-white p-8 text-slate-900">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Mailbox Deliverability Checker</h1>
          <p className="mt-2 text-slate-500">
            Send a test email to the seed addresses below, then check where it landed.
          </p>
        </div>

        {/* Step 1 — seed addresses */}
        <section className="space-y-3">
          <h2 className="font-semibold text-slate-700">
            Step 1 — Send your email to these seed addresses
          </h2>

          {seedsLoading ? (
            <div className="text-slate-400 text-sm">Loading seed addresses…</div>
          ) : seeds.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">No seed mailboxes configured.</p>
              <p className="mt-1">
                Set the following environment variables and restart the server:
              </p>
              <ul className="mt-2 space-y-1 font-mono text-xs">
                <li>SEED_GMAIL_EMAIL / SEED_GMAIL_PASSWORD</li>
                <li>SEED_OUTLOOK_EMAIL / SEED_OUTLOOK_PASSWORD</li>
                <li>SEED_YAHOO_EMAIL / SEED_YAHOO_PASSWORD</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
                {seeds.map((seed) => (
                  <div
                    key={seed.address}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {PROVIDER_ICONS[seed.provider] ?? seed.provider[0]}
                      </span>
                      <span className="text-sm font-medium text-slate-700">
                        {seed.provider}
                      </span>
                    </div>
                    <span className="font-mono text-sm text-slate-500">
                      {seed.address}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={copySeeds}
                className="text-sm text-slate-500 hover:text-slate-800 underline underline-offset-2"
              >
                {copied ? "Copied!" : "Copy all addresses"}
              </button>
            </div>
          )}
        </section>

        {/* Step 2 — check */}
        <section className="space-y-4">
          <h2 className="font-semibold text-slate-700">
            Step 2 — Enter your email details and check results
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">
                Subject line <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Your weekly update"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">
                Sender email (optional — narrows the search)
              </label>
              <input
                type="email"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="e.g. hello@yourcompany.com"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <button
              onClick={runCheck}
              disabled={loading || !subject.trim() || seeds.length === 0}
              className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white disabled:opacity-40"
            >
              {loading ? "Checking mailboxes…" : "Check deliverability"}
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <section className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="font-semibold text-slate-700">Results</h2>
              <span className="text-sm text-green-700 font-medium">
                {inboxCount}/{results.length} inbox
              </span>
              {spamCount > 0 && (
                <span className="text-sm text-red-700 font-medium">
                  {spamCount} spam
                </span>
              )}
            </div>

            <div className="space-y-2">
              {results.map((result) => (
                <div
                  key={result.provider}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 ${PLACEMENT_STYLES[result.placement]}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/60 text-xs font-bold">
                      {PROVIDER_ICONS[result.provider] ?? result.provider[0]}
                    </span>
                    <div>
                      <div className="text-sm font-medium">{result.provider}</div>
                      <div className="text-xs opacity-70">{result.address}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {PLACEMENT_LABELS[result.placement]}
                    </div>
                    {result.folder && result.placement !== "inbox" && (
                      <div className="text-xs opacity-60">{result.folder}</div>
                    )}
                    {result.error && (
                      <div className="text-xs opacity-70">{result.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
