"use client";

import { Reminder, Settings, DEFAULT_OFFSETS, PassDesign } from "./types";

const REMINDERS_KEY = "qr.reminders";
const SETTINGS_KEY = "qr.settings";

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function loadReminders(): Reminder[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(REMINDERS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveReminders(reminders: Reminder[]) {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  // fire-and-forget server sync so the .ics feed + passes stay current
  syncToServer(reminders);
}

export function loadSettings(): Settings {
  const defaults: Settings = {
    passDesign: "event",
    notifyOffsets: DEFAULT_OFFSETS,
    darkMode: false,
    feedToken: uuid(),
  };
  if (typeof window === "undefined") return defaults;
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    const merged = { ...defaults, ...stored };
    if (!stored.feedToken) localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function createReminder(
  data: Partial<Reminder> & Pick<Reminder, "name" | "course" | "dueDate">
): Reminder {
  const now = new Date().toISOString();
  const settings = loadSettings();
  return {
    id: uuid(),
    priority: "medium",
    type: "assignment",
    completed: false,
    createdAt: now,
    updatedAt: now,
    firedNotifications: [],
    notifyOffsets: settings.notifyOffsets,
    source: "manual",
    ...data,
  };
}

export async function syncToServer(reminders: Reminder[]) {
  try {
    const settings = loadSettings();
    await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: settings.feedToken,
        passDesign: settings.passDesign,
        reminders,
      }),
    });
  } catch {
    // offline is fine; localStorage is the source of truth
  }
}
