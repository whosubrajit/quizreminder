import { NextRequest, NextResponse } from "next/server";
import { findReminder } from "@/lib/store";
import { generatePass, hasRealCerts } from "@/lib/pass/generate";
import type { PassDesign } from "@/lib/types";

export const dynamic = "force-dynamic";

const DESIGNS: PassDesign[] = ["airline", "colorful", "event"];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const found = findReminder(params.id);
  if (!found) {
    return NextResponse.json(
      { error: "reminder not found — open the app once so it can sync" },
      { status: 404 }
    );
  }
  const queryDesign = req.nextUrl.searchParams.get("design") as PassDesign | null;
  const design = queryDesign && DESIGNS.includes(queryDesign) ? queryDesign : found.data.passDesign;

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
