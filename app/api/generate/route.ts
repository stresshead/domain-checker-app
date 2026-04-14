import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const niche = body?.niche;

    if (!niche || typeof niche !== "string") {
      return Response.json({ error: "Niche is required" }, { status: 400 });
    }

    const prompt = `
Generate 10 short, brandable .com domain names for this niche: ${niche}

Rules:
- Return only domain names
- No numbering
- No explanation
- One per line
- Keep them short and brandable
`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const text = response.output_text || "";

    const domains = text
      .split("\\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^\\d+\\.\\s*/, ""))
      .map((line) => line.replace(/\\s+/g, ""))
      .filter((line) => line.includes("."));

    return Response.json({ domains });
  } catch (error: any) {
    console.error("OpenAI route error:", error);

    return Response.json(
      {
        error:
          error?.message ||
          error?.error?.message ||
          "Unknown server error",
      },
      { status: 500 }
    );
  }
}