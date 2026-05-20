export async function GET() {
  const seeds: { provider: string; address: string }[] = [];

  if (process.env.SEED_GMAIL_EMAIL) {
    seeds.push({ provider: "Gmail", address: process.env.SEED_GMAIL_EMAIL });
  }
  if (process.env.SEED_OUTLOOK_EMAIL) {
    seeds.push({ provider: "Outlook", address: process.env.SEED_OUTLOOK_EMAIL });
  }
  if (process.env.SEED_YAHOO_EMAIL) {
    seeds.push({ provider: "Yahoo", address: process.env.SEED_YAHOO_EMAIL });
  }

  return Response.json({ seeds });
}
