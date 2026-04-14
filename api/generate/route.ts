import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { niche } = await req.json();

    const prompt = `
Generate 10 short, brandable .com domain names for: ${niche}

Rules:
- Only return domain names
- No numbering
- No explanation
- One per line
`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const text = response.output_text || "";

    const domains = text
      .split("\n")
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => d.replace(/\s+/g, ""));

    return Response.json({ domains });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}