"use client";

import { useMemo, useState } from "react";
import { Reminder, Priority } from "@/lib/types";
import { useReminders } from "@/lib/hooks";
import ReminderCard from "@/components/ReminderCard";
import ReminderForm from "@/components/ReminderForm";

type SortKey = "date" | "priority" | "course";
const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export default function Dashboard() {
  const { reminders, loaded, upsert, remove, toggleComplete } = useReminders();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Reminder | undefined>();
  const [sort, setSort] = useState<SortKey>("date");
  const [courseFilter, setCourseFilter] = useState("");

  const active = useMemo(() => {
    let list = reminders.filter((r) => !r.completed);
    if (courseFilter) list = list.filter((r) => r.course === courseFilter);
    return [...list].sort((a, b) => {
      if (sort === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (sort === "course") return a.course.localeCompare(b.course);
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [reminders, sort, courseFilter]);

  const courses = useMemo(
    () => Array.from(new Set(reminders.filter((r) => !r.completed).map((r) => r.course))).sort(),
    [reminders]
  );

  if (!loaded) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Upcoming</h1>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(undefined);
            setShowForm(true);
          }}
        >
          + Add reminder
        </button>
      </div>

      {showForm && (
        <ReminderForm
          initial={editing}
          onSave={(r) => {
            upsert(r);
            setShowForm(false);
            setEditing(undefined);
          }}
          onCancel={() => {
            setShowForm(false);
            setEditing(undefined);
          }}
        />
      )}

      {active.length > 0 && (
        <div className="flex gap-2">
          <select className="input !w-auto text-xs" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="date">Sort: Due date</option>
            <option value="priority">Sort: Priority</option>
            <option value="course">Sort: Course</option>
          </select>
          <select className="input !w-auto text-xs" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {active.length === 0 && !showForm ? (
        <div className="glass-card p-10 text-center text-zinc-500">
          <p className="text-4xl animate-bounce">🎉</p>
          <p className="mt-4 text-lg font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Nothing due!</p>
          <p className="mt-1 text-sm">
            Add a reminder manually or import from your calendar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((r) => (
            <ReminderCard
              key={r.id}
              reminder={r}
              onEdit={(rem) => {
                setEditing(rem);
                setShowForm(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onDelete={remove}
              onToggleComplete={toggleComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
