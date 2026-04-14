"use client";

import { useState } from "react";

export default function Home() {
  const [niche, setNiche] = useState("");
  const [results, setResults] = useState<string[]>([]);

  const generateIdeas = async () => {
    if (!niche.trim()) return;

    const clean = niche.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    const words = clean.split(" ").filter(Boolean);
    const root = words[0] || "brand";
    const second = words[1] || "hub";

    const ideas = [
      `${root}${second}.com`,
      `${root}hub.com`,
      `${root}lab.com`,
      `${root}works.com`,
      `${root}daily.com`,
      `get${root}.com`,
      `try${root}.com`,
      `${root}base.com`,
      `${root}flow.com`,
      `${second}${root}.com`,
    ];

    setResults([...new Set(ideas)]);
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Domain Idea Checker</h1>
        <p className="text-slate-600">
          Enter a niche and generate some starter domain ideas.
        </p>

        <div className="space-y-3">
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="e.g. keto recipes"
            className="w-full border border-slate-300 rounded-lg px-4 py-3"
          />

          <button
            onClick={generateIdeas}
            className="bg-black text-white px-5 py-3 rounded-lg"
          >
            Generate ideas
          </button>
        </div>

        <div className="space-y-2">
          {results.map((domain) => (
            <div
              key={domain}
              className="border border-slate-200 rounded-lg px-4 py-3"
            >
              {domain}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}