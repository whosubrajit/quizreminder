"use client";

import Link from "next/link";
import { useState } from "react";
import { Reminder, PRIORITY_COLORS } from "@/lib/types";
import { timeRemaining } from "@/lib/notifications";
import PassPreview from "./PassPreview";
import { useSettings } from "@/lib/hooks";

interface Props {
  reminder: Reminder;
  onEdit?: (r: Reminder) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

const TYPE_ICONS: Record<string, string> = {
  quiz: "📝",
  assignment: "📚",
  exam: "🎓",
  other: "📌",
};

export default function ReminderCard({ reminder, onEdit, onDelete, onToggleComplete }: Props) {
  const [showPass, setShowPass] = useState(false);
  const { settings } = useSettings();
  const overdue = !reminder.completed && new Date(reminder.dueDate) < new Date();

  return (
    <div className="glass-card relative overflow-hidden group">
      <div className="flex items-start gap-3">
        <button
          aria-label={reminder.completed ? "Mark incomplete" : "Mark complete"}
          onClick={() => onToggleComplete(reminder.id)}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
            reminder.completed
              ? "border-teal-500 bg-teal-500 text-white shadow-md shadow-teal-500/20"
              : "border-zinc-300 hover:border-teal-400 hover:bg-teal-50 dark:border-zinc-600 dark:hover:bg-teal-500/10"
          }`}
        >
          {reminder.completed && <span className="block text-sm leading-none drop-shadow-sm">✓</span>}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/reminder/${reminder.id}`}
              className={`truncate font-medium hover:underline ${reminder.completed ? "line-through text-zinc-400" : ""}`}
            >
              {TYPE_ICONS[reminder.type]} {reminder.name}
            </Link>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase text-white"
              style={{ backgroundColor: PRIORITY_COLORS[reminder.priority] }}
            >
              {reminder.priority}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-zinc-500">
            {reminder.course} ·{" "}
            {new Date(reminder.dueDate).toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
            {!reminder.completed && (
              <span className={`ml-2 font-medium ${overdue ? "text-red-500" : "text-indigo-500"}`}>
                {overdue ? "⚠ overdue" : `⏳ ${timeRemaining(reminder.dueDate)}`}
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-8">
        {!reminder.completed && (
          <a
            className="btn-ghost !px-2.5 !py-1 text-xs"
            href={`/api/calendar/${reminder.id}?data=${encodeURIComponent(JSON.stringify(reminder))}`}
          >
            🗓️ Add to Calendar
          </a>
        )}
        {onEdit && (
          <button className="btn-ghost !px-2.5 !py-1 text-xs" onClick={() => onEdit(reminder)}>
            Edit
          </button>
        )}
        <button className="btn-danger !px-2.5 !py-1 text-xs" onClick={() => onDelete(reminder.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}
