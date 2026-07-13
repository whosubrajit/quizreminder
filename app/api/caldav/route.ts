import { NextRequest, NextResponse } from "next/server";
import { KEYWORDS } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Fetches events from the user's iCloud calendar via CalDAV.
 * Credentials are used for this single request and never stored.
 * The password must be an app-specific password (appleid.apple.com →
 * Sign-In and Security → App-Specific Passwords).
 */
export async function POST(req: NextRequest) {
  let body: { appleId?: string; appPassword?: string; daysAhead?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const { appleId, appPassword, daysAhead = 60 } = body;
  if (!appleId || !appPassword) {
    return NextResponse.json({ error: "appleId and appPassword required" }, { status: 400 });
  }

  try {
    const { createDAVClient } = await import("tsdav");
    const ICAL = (await import("ical.js")).default;

    const client = await createDAVClient({
      serverUrl: "https://caldav.icloud.com",
      credentials: { username: appleId, password: appPassword },
      authMethod: "Basic",
      defaultAccountType: "caldav",
    });

    const calendars = await client.fetchCalendars();
    const now = new Date();
    const end = new Date(now.getTime() + daysAhead * 86400000);

    const events: {
      uid: string;
      summary: string;
      start: string;
      location: string;
      description: string;
      calendar: string;
      matched: boolean;
    }[] = [];

    for (const cal of calendars) {
      const objects = await client.fetchCalendarObjects({
        calendar: cal,
        timeRange: { start: now.toISOString(), end: end.toISOString() },
      });
      for (const obj of objects) {
        if (!obj.data) continue;
        try {
          const comp = new ICAL.Component(ICAL.parse(obj.data));
          for (const vevent of comp.getAllSubcomponents("vevent")) {
            const event = new ICAL.Event(vevent);
            const startDate = event.startDate?.toJSDate();
            if (!startDate || startDate < now || startDate > end) continue;
            const text = `${event.summary || ""} ${event.description || ""}`.toLowerCase();
            events.push({
              uid: event.uid || `${cal.displayName}-${startDate.getTime()}`,
              summary: event.summary || "(untitled)",
              start: startDate.toISOString(),
              location: event.location || "",
              description: event.description || "",
              calendar: String(cal.displayName || "Calendar"),
              matched: KEYWORDS.some((k) => text.includes(k)),
            });
          }
        } catch {
          // skip unparseable objects
        }
      }
    }

    events.sort((a, b) => a.start.localeCompare(b.start));
    return NextResponse.json({ events });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "CalDAV request failed";
    const auth = /401|unauthor/i.test(msg);
    return NextResponse.json(
      {
        error: auth
          ? "iCloud sign-in failed. Make sure you're using an app-specific password, not your Apple ID password."
          : msg,
      },
      { status: auth ? 401 : 502 }
    );
  }
}
