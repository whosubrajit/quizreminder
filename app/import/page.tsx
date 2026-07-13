"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useReminders } from "@/lib/hooks";
import { createReminder } from "@/lib/storage";
import { KEYWORDS } from "@/lib/types";

interface CalEvent {
  uid: string;
  summary: string;
  start: string;
  location: string;
  description: string;
  calendar: string;
  matched: boolean;
}

function guessType(text: string): "quiz" | "assignment" | "exam" | "other" {
  const t = text.toLowerCase();
  if (t.includes("quiz")) return "quiz";
  if (/(exam|midterm|final|test)/.test(t)) return "exam";
  if (/(assignment|homework|project|due)/.test(t)) return "assignment";
  return "other";
}

export default function ImportPage() {
  const router = useRouter();
  const { reminders, upsert } = useReminders();
  const [appleId, setAppleId] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<CalEvent[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const fetchEvents = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/caldav", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appleId, appPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Import failed");
      setEvents(json.events);
      // pre-select keyword matches
      setSelected(new Set(json.events.filter((ev: CalEvent) => ev.matched).map((ev: CalEvent) => ev.uid)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const importSelected = () => {
    const existing = new Set(reminders.map((r) => r.notes));
    let count = 0;
    for (const ev of events || []) {
      if (!selected.has(ev.uid)) continue;
      const marker = `[caldav:${ev.uid}]`;
      if (existing.has(marker)) continue; // skip already-imported
      const r = createReminder({
        name: ev.summary,
        course: ev.calendar,
        dueDate: ev.start,
        type: guessType(`${ev.summary} ${ev.description}`),
        location: ev.location || undefined,
        notes: marker,
      });
      r.source = "caldav";
      upsert(r);
      count++;
    }
    alert(`Imported ${count} reminder${count === 1 ? "" : "s"}.`);
    router.push("/");
  };

  const visible = events?.filter((ev) => showAll || ev.matched) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Import from Apple Calendar</h1>

      {!events && (
        <form onSubmit={fetchEvents} className="glass-card space-y-4">
          <p className="text-sm text-zinc-500">
            Connects to iCloud via CalDAV and finds events matching keywords like{" "}
            {KEYWORDS.slice(0, 5).join(", ")}… Your credentials are used for this request only
            and never stored.
          </p>
          <div>
            <label className="label" htmlFor="im-id">Apple ID</label>
            <input id="im-id" className="input" type="email" value={appleId}
              onChange={(e) => setAppleId(e.target.value)} placeholder="you@icloud.com" required />
          </div>
          <div>
            <label className="label" htmlFor="im-pw">App-specific password</label>
            <input id="im-pw" className="input" type="password" value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)} placeholder="xxxx-xxxx-xxxx-xxxx" required />
            <p className="mt-1 text-xs text-zinc-500">
              Generate one at{" "}
              <a className="text-indigo-500 underline" href="https://account.apple.com/account/manage"
                target="_blank" rel="noreferrer">
                account.apple.com
              </a>{" "}
              → Sign-In and Security → App-Specific Passwords. Your main Apple ID password will not work.
            </p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Connecting to iCloud…" : "Fetch events (next 60 days)"}
          </button>
        </form>
      )}

      {events && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              {events.filter((e) => e.matched).length} likely matches · {events.length} total events
            </p>
            <label className="flex items-center gap-1.5 text-xs">
              <input type="checkbox" className="accent-indigo-600" checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)} />
              Show all events
            </label>
          </div>
          <div className="space-y-2">
            {visible.length === 0 && (
              <div className="glass-card p-6 text-center text-sm text-zinc-500">
                No matching events found. Try “Show all events”.
              </div>
            )}
            {visible.map((ev) => (
              <label key={ev.uid} className="glass-card flex cursor-pointer items-start gap-3 p-4 transition-all hover:border-indigo-300 dark:hover:border-indigo-700">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-indigo-600"
                  checked={selected.has(ev.uid)}
                  onChange={(e) => {
                    const next = new Set(selected);
                    e.target.checked ? next.add(ev.uid) : next.delete(ev.uid);
                    setSelected(next);
                  }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {ev.matched && "🎯 "}{ev.summary}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {ev.calendar} · {new Date(ev.start).toLocaleString(undefined, {
                      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                    })}
                    {ev.location && ` · ${ev.location}`}
                  </p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => { setEvents(null); setSelected(new Set()); }}>
              Back
            </button>
            <button className="btn-primary flex-1" disabled={selected.size === 0} onClick={importSelected}>
              Import {selected.size} selected
            </button>
          </div>
        </>
      )}
    </div>
  );
}
