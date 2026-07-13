import { NextRequest, NextResponse } from "next/server";
import { findReminder } from "@/lib/store";
import { generateIcsFeed } from "@/lib/ics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  let found = findReminder(params.id);
  
  const encodedData = req.nextUrl.searchParams.get("data");
  if (!found && encodedData) {
    try {
      const reminder = JSON.parse(decodeURIComponent(encodedData));
      if (reminder && reminder.id) {
        found = { reminder, data: { passDesign: "event", reminders: [reminder], updatedAt: new Date().toISOString() } };
      }
    } catch (e) {
      console.error("Failed to parse fallback data", e);
    }
  }

  if (!found) {
    return NextResponse.json(
      { error: "reminder not found — open the app once so it can sync" },
      { status: 404 }
    );
  }

  const ics = generateIcsFeed([found.reminder], req.nextUrl.origin);
  
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${found.reminder.course.replace(/\s+/g, "_")}.ics"`,
      "Cache-Control": "no-cache",
    },
  });
}
