import { NextRequest, NextResponse } from "next/server";
import { findReminder } from "@/lib/store";
import { generatePass, hasRealCerts } from "@/lib/pass/generate";
import type { PassDesign } from "@/lib/types";

export const dynamic = "force-dynamic";

const DESIGNS: PassDesign[] = ["airline", "colorful", "event"];

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
  const queryDesign = req.nextUrl.searchParams.get("design") as PassDesign | null;
  const design = queryDesign && DESIGNS.includes(queryDesign) ? queryDesign : found.data.passDesign;

  const reminder = found.reminder;
  const passSlotUrl = "https://api.passslot.com/v1/templates/5525897345105920/pass";
  const apiKey = "aOOucvsRlDxrUphjZNhoklOXyhWxnMMyCeZfOGFShItCfJBguZqULSyLCaFkpWgJ";

  const passSlotData = {
    eventName: reminder.name,
    course: reminder.course,
    date: new Date(reminder.dueDate).toLocaleString(undefined, {
      weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
    })
  };

  try {
    const passSlotResponse = await fetch(passSlotUrl, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(apiKey + ":").toString("base64"),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(passSlotData)
    });

    if (passSlotResponse.ok) {
      const json = await passSlotResponse.json();
      if (json.url) {
        return NextResponse.redirect(json.url);
      }
    }
  } catch (error) {
    console.error("PassSlot generation failed:", error);
  }

  // Fallback to mock pass if PassSlot fails
  const { buffer, signed } = await generatePass(found.reminder, design, req.nextUrl.origin);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename="${found.reminder.course}-${design}.pkpass"`,
      "X-Pass-Signed": String(signed),
      "Cache-Control": "no-cache",
    },
  });
}

export async function HEAD() {
  // lets the client know whether real signing is configured
  return new NextResponse(null, { headers: { "X-Pass-Signed": String(hasRealCerts()) } });
}
