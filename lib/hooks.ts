"use client";

import { useCallback, useEffect, useState } from "react";
import { Reminder, Settings } from "./types";
import { loadReminders, saveReminders, loadSettings, saveSettings } from "./storage";

/** Shared reminder state backed by localStorage, synced across components. */
export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setReminders(loadReminders());
    setLoaded(true);
    const onStorage = () => setReminders(loadReminders());
    window.addEventListener("storage", onStorage);
    window.addEventListener("qr:reminders-changed", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("qr:reminders-changed", onStorage);
    };
  }, []);

  const update = useCallback((next: Reminder[]) => {
    setReminders(next);
    saveReminders(next);
    window.dispatchEvent(new Event("qr:reminders-changed"));
  }, []);

  const upsert = useCallback(
    (reminder: Reminder) => {
      const current = loadReminders();
      const idx = current.findIndex((r) => r.id === reminder.id);
      const stamped = { ...reminder, updatedAt: new Date().toISOString() };
      const next =
        idx === -1 ? [...current, stamped] : current.map((r) => (r.id === reminder.id ? stamped : r));
      update(next);
    },
    [update]
  );

  const remove = useCallback(
    (id: string) => update(loadReminders().filter((r) => r.id !== id)),
    [update]
  );

  const toggleComplete = useCallback(
    (id: string) => {
      const next = loadReminders().map((r) =>
        r.id === id
          ? { ...r, completed: !r.completed, updatedAt: new Date().toISOString() }
          : r
      );
      update(next);
    },
    [update]
  );

  return { reminders, loaded, upsert, remove, toggleComplete, replaceAll: update };
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const update = useCallback((next: Settings) => {
    setSettings(next);
    saveSettings(next);
    document.documentElement.classList.toggle("dark", next.darkMode);
  }, []);

  return { settings, update };
}
