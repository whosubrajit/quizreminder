"use client";

import { useState } from "react";
import { Reminder, Priority, ReminderType } from "@/lib/types";
import { createReminder } from "@/lib/storage";

interface Props {
  initial?: Reminder;
  onSave: (reminder: Reminder) => void;
  onCancel: () => void;
}

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ReminderForm({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [course, setCourse] = useState(initial?.course ?? "");
  const [dueDate, setDueDate] = useState(
    initial ? toLocalInputValue(initial.dueDate) : ""
  );
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [type, setType] = useState<ReminderType>(initial?.type ?? "assignment");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !course || !dueDate) return;
    const iso = new Date(dueDate).toISOString(); // local input → UTC storage
    const reminder = initial
      ? { ...initial, name, course, dueDate: iso, priority, type, location, notes }
      : createReminder({ name, course, dueDate: iso, priority, type, location, notes });
    // if the due date moved, allow notifications to re-fire
    if (initial && initial.dueDate !== iso) reminder.firedNotifications = [];
    onSave(reminder);
  };

  return (
    <form onSubmit={submit} className="glass-card space-y-4 shadow-lg shadow-indigo-500/5 dark:shadow-indigo-500/5">
      <h2 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">{initial ? "Edit reminder" : "New reminder"}</h2>
      <div>
        <label className="label" htmlFor="rf-name">Name</label>
        <input id="rf-name" className="input" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chapter 5 Quiz" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="rf-course">Course</label>
          <input id="rf-course" className="input" value={course} onChange={(e) => setCourse(e.target.value)}
            placeholder="e.g. CS 201" required />
        </div>
        <div>
          <label className="label" htmlFor="rf-due">Due date &amp; time</label>
          <input id="rf-due" className="input" type="datetime-local" value={dueDate}
            onChange={(e) => setDueDate(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="rf-type">Type</label>
          <select id="rf-type" className="input" value={type} onChange={(e) => setType(e.target.value as ReminderType)}>
            <option value="quiz">Quiz</option>
            <option value="assignment">Assignment</option>
            <option value="exam">Exam</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="rf-priority">Priority</label>
          <select id="rf-priority" className="input" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="rf-location">Location (optional)</label>
        <input id="rf-location" className="input" value={location} onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Room 204" />
      </div>
      <div>
        <label className="label" htmlFor="rf-notes">Notes (optional)</label>
        <textarea id="rf-notes" className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">{initial ? "Save changes" : "Add reminder"}</button>
      </div>
    </form>
  );
}
