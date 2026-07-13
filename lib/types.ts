export type Priority = "high" | "medium" | "low";
export type ReminderType = "quiz" | "assignment" | "exam" | "other";
export type PassDesign = "airline" | "colorful" | "event";

export interface Reminder {
  id: string;
  name: string;
  course: string;
  dueDate: string; // ISO string
  priority: Priority;
  type: ReminderType;
  notes?: string;
  location?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  /** which notification offsets (in minutes before due) have already fired */
  firedNotifications: number[];
  /** minutes before due date to notify */
  notifyOffsets: number[];
  source: "manual" | "caldav";
}

export interface Settings {
  passDesign: PassDesign;
  notifyOffsets: number[]; // default offsets for new reminders, minutes
  darkMode: boolean;
  feedToken: string;
}

export const DEFAULT_OFFSETS = [24 * 60, 6 * 60, 60]; // 1 day, 6 hours, 1 hour

export const PRIORITY_COLORS: Record<Priority, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#14b8a6",
};

export const KEYWORDS = [
  "quiz",
  "assignment",
  "exam",
  "test",
  "midterm",
  "final",
  "homework",
  "project",
  "due",
];
