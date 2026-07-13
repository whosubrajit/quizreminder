"use client";

import { Reminder, PassDesign, PRIORITY_COLORS } from "@/lib/types";

interface Props {
  reminder: Reminder;
  design: PassDesign;
}

function fmt(iso: string, opts: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleString(undefined, opts);
}

/** Visual mockup of the .pkpass so users can preview before adding. */
export default function PassPreview({ reminder, design }: Props) {
  const date = fmt(reminder.dueDate, { weekday: "short", month: "short", day: "numeric" });
  const time = fmt(reminder.dueDate, { hour: "numeric", minute: "2-digit" });
  const pColor = PRIORITY_COLORS[reminder.priority];

  if (design === "airline") {
    return (
      <div className="w-full max-w-xs overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-4 text-white shadow-lg">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-blue-200">
          <span>Quiz Reminder</span>
          <span>{reminder.course}</span>
        </div>
        <p className="mt-2 truncate text-lg font-bold">{reminder.name}</p>
        <div className="my-3 border-t border-dashed border-blue-300/50" />
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ["DATE", date],
            ["BOARDING", time],
            ["GATE", reminder.location || "TBD"],
            ["SEAT", reminder.course.slice(0, 3).toUpperCase()],
            ["CLASS", reminder.priority.toUpperCase()],
            ["STATUS", "ON TIME"],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-[9px] text-blue-200">{label}</p>
              <p className="truncate text-xs font-semibold">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-center rounded-lg bg-white p-2">
          <QrPlaceholder />
        </div>
      </div>
    );
  }

  if (design === "colorful") {
    const stack = ["#18181b", "#ec4899", "#22c55e", "#eab308"];
    return (
      <div className="relative w-full max-w-xs" style={{ paddingBottom: 18 }}>
        {stack.map((c, i) => (
          <div
            key={c}
            className="absolute inset-x-0 h-full rounded-2xl"
            style={{ backgroundColor: c, top: (i + 1) * 4.5, transform: `scale(${1 - (i + 1) * 0.03})` }}
          />
        ))}
        <div
          className="relative rounded-2xl p-4 text-white shadow-lg"
          style={{ backgroundColor: pColor }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
              {reminder.course}
            </span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase">
              {reminder.priority}
            </span>
          </div>
          <p className="mt-2 truncate text-lg font-extrabold">{reminder.name}</p>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-[9px] uppercase opacity-80">⏰ Due</p>
              <p className="text-sm font-bold">{date} · {time}</p>
            </div>
            <div className="rounded-lg bg-white p-1.5">
              <QrPlaceholder size={36} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // event (default)
  return (
    <div className="w-full max-w-xs overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-950 p-4 text-zinc-50 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-zinc-400">Quiz Reminder</span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white"
          style={{ backgroundColor: pColor }}
        >
          {reminder.priority}
        </span>
      </div>
      <div className="my-4 text-center text-4xl">
        {reminder.type === "quiz" ? "📝" : reminder.type === "exam" ? "🎓" : "📚"}
      </div>
      <p className="truncate text-center text-lg font-bold">{reminder.name}</p>
      <p className="text-center text-xs text-zinc-400">{reminder.course}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-zinc-800/80 p-2 text-center">
          <p className="text-[9px] uppercase" style={{ color: pColor }}>Due date</p>
          <p className="text-xs font-semibold">{date}</p>
        </div>
        <div className="rounded-lg bg-zinc-800/80 p-2 text-center">
          <p className="text-[9px] uppercase" style={{ color: pColor }}>Time</p>
          <p className="text-xs font-semibold">{time}</p>
        </div>
      </div>
      <div className="mt-3 flex justify-center rounded-lg bg-white p-2">
        <QrPlaceholder />
      </div>
    </div>
  );
}

/** Deterministic pseudo-QR block pattern (visual placeholder only). */
function QrPlaceholder({ size = 48 }: { size?: number }) {
  const n = 9;
  const cells: boolean[] = [];
  let seed = 41;
  for (let i = 0; i < n * n; i++) {
    seed = (seed * 31 + 7) % 97;
    cells.push(seed % 2 === 0);
  }
  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, width: size, height: size }}
    >
      {cells.map((on, i) => (
        <div key={i} style={{ backgroundColor: on ? "#000" : "#fff" }} />
      ))}
    </div>
  );
}
