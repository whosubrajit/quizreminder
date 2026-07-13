import { NextRequest, NextResponse } from "next/server";
import { readUserData } from "@/lib/store";
import { generateIcsFeed } from "@/lib/ics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const data = readUserData(params.token);
  if (!data) {
    return NextResponse.json({ error: "unknown feed" }, { status: 404 });
  }
  const baseUrl = req.nextUrl.origin;
  const ics = generateIcsFeed(data.reminders, baseUrl);
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="quiz-reminders.ics"',
      "Cache-Control": "no-cache",
    },
  });
}
