"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSettings } from "@/lib/hooks";

const LINKS = [
  { href: "/", label: "Dashboard", icon: "📋" },
  { href: "/import", label: "Import", icon: "📥" },
  { href: "/archive", label: "Archive", icon: "🗄️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Nav() {
  const pathname = usePathname();
  const { settings, update } = useSettings();

  const toggleDarkMode = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!settings) return;
    const nextMode = !settings.darkMode;

    if (!document.startViewTransition) {
      update({ ...settings, darkMode: nextMode });
      if (nextMode) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      update({ ...settings, darkMode: nextMode });
      if (nextMode) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      document.documentElement.animate(
        {
          clipPath: settings.darkMode ? clipPath.reverse() : clipPath,
        },
        {
          duration: 600,
          easing: "ease-in-out",
          pseudoElement: settings.darkMode
            ? "::view-transition-old(root)"
            : "::view-transition-new(root)",
        }
      );
    });
  };

  return (
    <nav className="glass-nav flex items-center justify-between">
      <Link href="/" className="text-xl font-bold tracking-tight bg-gradient-to-br from-indigo-600 to-purple-500 bg-clip-text text-transparent drop-shadow-sm dark:from-indigo-400 dark:to-purple-400">
        📚 Quiz Reminder
      </Link>
      <div className="flex items-center gap-1">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-xl px-3 py-2 text-sm transition-all duration-300 ${
              pathname === l.href
                ? "bg-indigo-100 font-semibold text-indigo-700 shadow-sm dark:bg-indigo-500/20 dark:text-indigo-300"
                : "font-medium text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
            }`}
            title={l.label}
          >
            <span className="sm:hidden text-lg">{l.icon}</span>
            <span className="hidden sm:inline">{l.label}</span>
          </Link>
        ))}
        <button
          onClick={toggleDarkMode}
          className="ml-2 flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-900 transition-all dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
          aria-label="Toggle Dark Mode"
        >
          {settings?.darkMode ? "☀️" : "🌙"}
        </button>
      </div>
    </nav>
  );
}
