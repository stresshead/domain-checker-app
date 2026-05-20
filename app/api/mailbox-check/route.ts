import { ImapFlow } from "imapflow";

interface SeedConfig {
  provider: string;
  host: string;
  port: number;
  email: string;
  password: string;
}

interface CheckResult {
  provider: string;
  address: string;
  placement: "inbox" | "spam" | "not_found" | "error";
  folder?: string;
  error?: string;
}

const IMAP_CONFIGS: Record<string, { host: string; port: number }> = {
  gmail: { host: "imap.gmail.com", port: 993 },
  outlook: { host: "outlook.office365.com", port: 993 },
  yahoo: { host: "imap.mail.yahoo.com", port: 993 },
};

const SPAM_FOLDER_NAMES = [
  "[Gmail]/Spam",
  "Junk",
  "Junk Email",
  "Spam",
  "Bulk Mail",
];

function getSeedConfigs(): SeedConfig[] {
  const configs: SeedConfig[] = [];

  if (process.env.SEED_GMAIL_EMAIL && process.env.SEED_GMAIL_PASSWORD) {
    configs.push({
      provider: "Gmail",
      host: IMAP_CONFIGS.gmail.host,
      port: IMAP_CONFIGS.gmail.port,
      email: process.env.SEED_GMAIL_EMAIL,
      password: process.env.SEED_GMAIL_PASSWORD,
    });
  }

  if (process.env.SEED_OUTLOOK_EMAIL && process.env.SEED_OUTLOOK_PASSWORD) {
    configs.push({
      provider: "Outlook",
      host: IMAP_CONFIGS.outlook.host,
      port: IMAP_CONFIGS.outlook.port,
      email: process.env.SEED_OUTLOOK_EMAIL,
      password: process.env.SEED_OUTLOOK_PASSWORD,
    });
  }

  if (process.env.SEED_YAHOO_EMAIL && process.env.SEED_YAHOO_PASSWORD) {
    configs.push({
      provider: "Yahoo",
      host: IMAP_CONFIGS.yahoo.host,
      port: IMAP_CONFIGS.yahoo.port,
      email: process.env.SEED_YAHOO_EMAIL,
      password: process.env.SEED_YAHOO_PASSWORD,
    });
  }

  return configs;
}

async function checkMailbox(
  config: SeedConfig,
  subject: string,
  senderFilter: string | undefined
): Promise<CheckResult> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: true,
    auth: { user: config.email, pass: config.password },
    logger: false,
  });

  try {
    await client.connect();

    const foldersToCheck = [
      "INBOX",
      ...SPAM_FOLDER_NAMES,
    ];

    for (const folder of foldersToCheck) {
      let lock;
      try {
        lock = await client.getMailboxLock(folder);
      } catch {
        continue;
      }

      try {
        const searchCriteria: Record<string, unknown> = { subject };
        if (senderFilter) {
          searchCriteria.from = senderFilter;
        }

        const messages = await client.search(searchCriteria);
        const found = Array.isArray(messages) ? messages.length > 0 : false;

        if (found) {
          const isInbox = folder === "INBOX";
          return {
            provider: config.provider,
            address: config.email,
            placement: isInbox ? "inbox" : "spam",
            folder,
          };
        }
      } finally {
        lock.release();
      }
    }

    return {
      provider: config.provider,
      address: config.email,
      placement: "not_found",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Connection failed";
    return {
      provider: config.provider,
      address: config.email,
      placement: "error",
      error: message,
    };
  } finally {
    await client.logout().catch(() => {});
  }
}

export async function POST(req: Request) {
  let subject: string;
  let sender: string | undefined;

  try {
    const body = await req.json();
    subject = body?.subject;
    sender = body?.sender;

    if (!subject || typeof subject !== "string") {
      return Response.json(
        { error: "subject is required" },
        { status: 400 }
      );
    }
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const configs = getSeedConfigs();

  if (configs.length === 0) {
    return Response.json(
      { error: "No seed mailboxes configured. Set SEED_GMAIL_EMAIL, SEED_GMAIL_PASSWORD etc. in your environment." },
      { status: 503 }
    );
  }

  const results = await Promise.all(
    configs.map((config) => checkMailbox(config, subject, sender))
  );

  return Response.json({ results });
}
