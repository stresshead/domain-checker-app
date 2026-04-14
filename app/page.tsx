"use client";

import { useState } from "react";

export default function Home() {
  const [niche, setNiche] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateIdeas = async () => {
    if (!niche.trim()) return;

    setLoading(true);
    setResults([]);
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ niche }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResults(data.domains || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate domain ideas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">Domain Idea Checker</h1>

        <p className="text-slate-600">
          Enter a niche and generate AI-powered domain ideas.
        </p>

        <div className="space-y-3">
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="e.g. keto recipes"
            className="w-full rounded-lg border border-slate-300 px-4 py-3"
          />

          <button
            onClick={generateIdeas}
            className="rounded-lg bg-black px-5 py-3 text-white disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate ideas"}
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {results.map((domain) => (
            <div
              key={domain}
              className="rounded-lg border border-slate-200 px-4 py-3"
            >
              {domain}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}