import type { Reminder } from "./types";

function icsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Fold lines at 75 octets per RFC 5545 */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = " " + rest.slice(74);
  }
  out.push(rest);
  return out.join("\r\n");
}

export function generateIcsFeed(reminders: Reminder[], baseUrl: string): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//QuizReminder//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold("X-WR-CALNAME:Quiz & Assignment Reminders"),
    "X-WR-TIMEZONE:UTC",
  ];

  for (const r of reminders) {
    if (r.completed) continue;
    const start = icsDate(r.dueDate);
    lines.push(
      "BEGIN:VEVENT",
      fold(`UID:${r.id}@quizreminder`),
      `DTSTAMP:${icsDate(r.updatedAt)}`,
      `DTSTART:${start}`,
      `DTEND:${start}`,
      fold(`SUMMARY:${escapeText(`${r.type === "quiz" ? "📝" : "📚"} ${r.name} (${r.course})`)}`),
      fold(`DESCRIPTION:${escapeText(r.notes || `${r.type} for ${r.course} — priority ${r.priority}`)}`),
      fold(`URL:${baseUrl}/reminder/${r.id}`),
      `CATEGORIES:${escapeText(r.course)}`,
      `PRIORITY:${r.priority === "high" ? 1 : r.priority === "medium" ? 5 : 9}`
    );
    if (r.location) lines.push(fold(`LOCATION:${escapeText(r.location)}`));
    // mirror the in-app notification offsets as calendar alarms
    for (const offset of r.notifyOffsets) {
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        fold(`DESCRIPTION:${escapeText(r.name)} due soon`),
        `TRIGGER:-PT${offset}M`,
        "END:VALARM"
      );
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
