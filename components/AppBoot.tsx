"use client";

import { useEffect, useState } from "react";
import {
  registerServiceWorker,
  requestNotificationPermission,
  startNotificationLoop,
} from "@/lib/notifications";

/** One-time boot: service worker, notification permission banner, notify loop. */
export default function AppBoot() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    registerServiceWorker();
    if ("Notification" in window && Notification.permission === "default") {
      setShowBanner(true);
    }
    startNotificationLoop();
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:max-w-sm sm:rounded-xl sm:border">
      <p className="text-sm font-medium">Enable notifications?</p>
      <p className="mt-1 text-xs text-zinc-500">
        Get alerts 1 day, 6 hours and 1 hour before each deadline.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          className="btn-primary flex-1"
          onClick={async () => {
            await requestNotificationPermission();
            setShowBanner(false);
            startNotificationLoop();
          }}
        >
          Enable
        </button>
        <button className="btn-ghost" onClick={() => setShowBanner(false)}>
          Not now
        </button>
      </div>
    </div>
  );
}
