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

    const contentType = res.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error("API did not return JSON. Check the route or deployment.");
    }

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