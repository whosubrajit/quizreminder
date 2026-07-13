import { NextRequest, NextResponse } from "next/server";
import { writeUserData } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { token, reminders, passDesign } = await req.json();
    if (!token || typeof token !== "string" || !Array.isArray(reminders)) {
      return NextResponse.json({ error: "token and reminders required" }, { status: 400 });
    }
    writeUserData(token, {
      reminders,
      passDesign: passDesign || "event",
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, count: reminders.length });
  } catch (e) {
    return NextResponse.json({ error: "sync failed" }, { status: 500 });
  }
}
