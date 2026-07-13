import fs from "fs";
import path from "path";
import type { Reminder, PassDesign } from "./types";

/**
 * Simple file-backed store keyed by feed token. Fine for local/single-server
 * use; swap for Vercel KV / Redis / a database in serverless production
 * (the filesystem there is ephemeral).
 */
const DATA_DIR = path.join(process.cwd(), "data");

export interface UserData {
  reminders: Reminder[];
  passDesign: PassDesign;
  updatedAt: string;
}

function fileFor(token: string): string {
  // sanitize: tokens are uuids; strip anything path-like
  const safe = token.replace(/[^a-zA-Z0-9-]/g, "");
  return path.join(DATA_DIR, `${safe}.json`);
}

export function readUserData(token: string): UserData | null {
  try {
    return JSON.parse(fs.readFileSync(fileFor(token), "utf8"));
  } catch {
    return null;
  }
}

export function writeUserData(token: string, data: UserData): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(fileFor(token), JSON.stringify(data, null, 2));
}

/** Find a reminder by id across all stored users (for pass generation). */
export function findReminder(id: string): { reminder: Reminder; data: UserData } | null {
  try {
    for (const f of fs.readdirSync(DATA_DIR)) {
      if (!f.endsWith(".json")) continue;
      const data: UserData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf8"));
      const reminder = data.reminders.find((r) => r.id === id);
      if (reminder) return { reminder, data };
    }
  } catch {
    /* no data dir yet */
  }
  return null;
}
