"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/lib/hooks";
import { PassDesign, DEFAULT_OFFSETS } from "@/lib/types";
import PassPreview from "@/components/PassPreview";
import { createReminder } from "@/lib/storage";
import { requestNotificationPermission } from "@/lib/notifications";

const DESIGNS: { id: PassDesign; name: string; blurb: string }[] = [
  { id: "airline", name: "Airline Ticket", blurb: "Formal, dense grid — great for exams" },
  { id: "colorful", name: "Colorful Stack", blurb: "Playful multi-color cards" },
  { id: "event", name: "Event Ticket", blurb: "Dark premium look (recommended)" },
];

const OFFSET_CHOICES = [
  { label: "1 week before", minutes: 7 * 24 * 60 },
  { label: "1 day before", minutes: 24 * 60 },
  { label: "6 hours before", minutes: 6 * 60 },
  { label: "1 hour before", minutes: 60 },
  { label: "15 minutes before", minutes: 15 },
];

export default function Settings() {
  const { settings, update } = useSettings();
  const [feedUrl, setFeedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (settings) setFeedUrl(`${window.location.origin}/api/feed/${settings.feedToken}`);
    if ("Notification" in window) setPermission(Notification.permission);
  }, [settings]);

  if (!settings) return null;

  // sample reminder for the design previews
  const sample = createReminder({
    name: "Midterm Exam",
    course: "CS 201",
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    priority: "high",
    type: "exam",
    location: "Hall B",
  });

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">Settings</h1>

      <section>
        <h2 className="font-semibold">Wallet pass design</h2>
        <p className="mt-1 text-sm text-zinc-500">
          New passes use your chosen design. You can change it anytime.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {DESIGNS.map((d) => (
            <button
              key={d.id}
              onClick={() => update({ ...settings, passDesign: d.id })}
              className={`glass-card !p-4 text-left transition-all hover:-translate-y-1 ${
                settings.passDesign === d.id
                  ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/10"
                  : "hover:border-indigo-300 dark:hover:border-indigo-700"
              }`}
            >
              <PassPreview reminder={sample} design={d.id} />
              <p className="mt-2 text-sm font-medium">
                {settings.passDesign === d.id && "✓ "}{d.name}
              </p>
              <p className="text-xs text-zinc-500">{d.blurb}</p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold">Notifications</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Status:{" "}
          <span className={permission === "granted" ? "text-teal-600" : "text-amber-600"}>
            {permission}
          </span>
          {permission !== "granted" && (
            <button
              className="btn-ghost ml-2 !px-2 !py-0.5 text-xs"
              onClick={async () => setPermission(await requestNotificationPermission())}
            >
              Request permission
            </button>
          )}
        </p>
        <p className="mt-3 text-sm text-zinc-500">Default reminder times for new reminders:</p>
        <div className="mt-2 space-y-1.5">
          {OFFSET_CHOICES.map((o) => (
            <label key={o.minutes} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-indigo-600"
                checked={settings.notifyOffsets.includes(o.minutes)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...settings.notifyOffsets, o.minutes].sort((a, b) => b - a)
                    : settings.notifyOffsets.filter((m) => m !== o.minutes);
                  update({ ...settings, notifyOffsets: next.length ? next : DEFAULT_OFFSETS });
                }}
              />
              {o.label}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold">Apple Calendar sync (.ics feed)</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Subscribe once and every reminder appears in your iPhone/Mac Calendar automatically.
        </p>
        <div className="mt-3 flex gap-2">
          <input className="input flex-1 font-mono text-xs" readOnly value={feedUrl} />
          <button
            className="btn-primary shrink-0"
            onClick={async () => {
              await navigator.clipboard.writeText(feedUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-zinc-500">
          <li>On iPhone: Settings → Apps → Calendar → Calendar Accounts → Add Account → Other → Add Subscribed Calendar</li>
          <li>Paste the URL above and tap Next → Save</li>
          <li>On Mac: Calendar app → File → New Calendar Subscription</li>
        </ol>
        <p className="mt-2 text-xs text-amber-600">
          Note: the feed only reflects reminders synced from this browser. Open the app after
          changes so the feed stays current.
        </p>
      </section>

    </div>
  );
}
