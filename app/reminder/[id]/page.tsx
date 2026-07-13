"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReminders, useSettings } from "@/lib/hooks";
import { timeRemaining } from "@/lib/notifications";
import { PRIORITY_COLORS } from "@/lib/types";
import PassPreview from "@/components/PassPreview";
import ReminderForm from "@/components/ReminderForm";

export default function ReminderDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { reminders, loaded, upsert, remove, toggleComplete } = useReminders();
  const { settings } = useSettings();
  const [editing, setEditing] = useState(false);

  if (!loaded || !settings) return null;
  const reminder = reminders.find((r) => r.id === id);

  if (!reminder) {
    return (
      <div className="glass-card p-10 text-center text-zinc-500">
        <p>Reminder not found (it may exist in a different browser).</p>
        <button className="btn-primary mt-4" onClick={() => router.push("/")}>Go to dashboard</button>
      </div>
    );
  }

  if (editing) {
    return (
      <ReminderForm
        initial={reminder}
        onSave={(r) => { upsert(r); setEditing(false); }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const overdue = !reminder.completed && new Date(reminder.dueDate) < new Date();

  return (
    <div className="space-y-5">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase text-white"
            style={{ backgroundColor: PRIORITY_COLORS[reminder.priority] }}
          >
            {reminder.priority} priority
          </span>
          <span className="text-xs uppercase text-zinc-400">{reminder.type}</span>
        </div>
        <h1 className={`mt-3 text-2xl font-bold ${reminder.completed ? "line-through text-zinc-400" : ""}`}>
          {reminder.name}
        </h1>
        <p className="text-zinc-500">{reminder.course}</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Due</dt>
            <dd className="font-medium">
              {new Date(reminder.dueDate).toLocaleString(undefined, {
                weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
              })}
            </dd>
          </div>
          {!reminder.completed && (
            <div className="flex justify-between">
              <dt className="text-zinc-500">Time remaining</dt>
              <dd className={`font-medium ${overdue ? "text-red-500" : "text-indigo-500"}`}>
                {overdue ? "Overdue" : timeRemaining(reminder.dueDate)}
              </dd>
            </div>
          )}
          {reminder.location && (
            <div className="flex justify-between">
              <dt className="text-zinc-500">Location</dt>
              <dd className="font-medium">{reminder.location}</dd>
            </div>
          )}
          {reminder.notes && !reminder.notes.startsWith("[caldav:") && (
            <div>
              <dt className="text-zinc-500">Notes</dt>
              <dd className="mt-1">{reminder.notes}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-zinc-500">Source</dt>
            <dd>{reminder.source === "caldav" ? "Apple Calendar import" : "Added manually"}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => toggleComplete(reminder.id)}>
            {reminder.completed ? "Mark incomplete" : "✓ Mark done"}
          </button>
          <button className="btn-ghost" onClick={() => setEditing(true)}>Edit</button>
          <button
            className="btn-danger"
            onClick={() => {
              if (confirm("Delete this reminder?")) {
                remove(reminder.id);
                router.push("/");
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {!reminder.completed && (
        <div>
          <h2 className="mb-3 font-semibold">Wallet pass</h2>
          <PassPreview reminder={reminder} design={settings.passDesign} />
          <a className="btn-primary mt-3" href={`/api/pass/${reminder.id}?design=${settings.passDesign}`}>
             Add to Apple Wallet
          </a>
        </div>
      )}
    </div>
  );
}
