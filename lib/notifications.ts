"use client";

import { Reminder } from "./types";
import { loadReminders, saveReminders } from "./storage";

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

export function timeRemaining(dueDate: string): string {
  const ms = new Date(dueDate).getTime() - Date.now();
  if (ms <= 0) return "overdue";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function showNotification(reminder: Reminder) {
  const body = `${reminder.course} — due in ${timeRemaining(reminder.dueDate)}`;
  const url = `/reminder/${reminder.id}`;
  // Prefer the service worker so the notification survives tab focus changes
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((reg) =>
        reg.showNotification(reminder.name, {
          body,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: `reminder-${reminder.id}`,
          data: { url },
        })
      )
      .catch(() => new Notification(reminder.name, { body }));
  } else {
    const n = new Notification(reminder.name, { body });
    n.onclick = () => window.open(url, "_blank");
  }
}

/**
 * Scan all reminders; fire any notification whose offset window has been
 * crossed and hasn't fired yet. Called on load and every minute.
 */
export function checkAndNotify(): void {
  if (typeof window === "undefined") return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const reminders = loadReminders();
  const now = Date.now();
  let changed = false;

  for (const r of reminders) {
    if (r.completed) continue;
    const due = new Date(r.dueDate).getTime();
    for (const offset of r.notifyOffsets) {
      const triggerAt = due - offset * 60000;
      // fire if we've passed the trigger time but the reminder isn't due yet
      if (now >= triggerAt && now < due && !r.firedNotifications.includes(offset)) {
        showNotification(r);
        r.firedNotifications.push(offset);
        changed = true;
        break; // one notification per reminder per check
      }
    }
  }
  if (changed) saveReminders(reminders);
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startNotificationLoop() {
  if (intervalId) return;
  checkAndNotify();
  intervalId = setInterval(checkAndNotify, 60_000);
}

export async function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch {
    // service worker is progressive enhancement only
  }
}
