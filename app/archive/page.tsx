"use client";

import { useReminders } from "@/lib/hooks";
import ReminderCard from "@/components/ReminderCard";

export default function Archive() {
  const { reminders, loaded, remove, toggleComplete } = useReminders();
  const done = reminders
    .filter((r) => r.completed)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  if (!loaded) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Archive</h1>
      {done.length === 0 ? (
        <div className="glass-card p-10 text-center text-zinc-500">
          <p className="text-4xl">🗄️</p>
          <p className="mt-2 text-sm">Completed reminders land here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {done.map((r) => (
            <ReminderCard key={r.id} reminder={r} onDelete={remove} onToggleComplete={toggleComplete} />
          ))}
        </div>
      )}
    </div>
  );
}
