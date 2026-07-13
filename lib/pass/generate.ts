import crypto from "crypto";
import JSZip from "jszip";
import type { Reminder, PassDesign } from "../types";
import { buildPassContent } from "./designs";

/**
 * Generates a .pkpass file.
 *
 * Real signing requires Apple Developer credentials, provided via env vars:
 *   PASS_TYPE_ID       e.g. pass.com.yourname.quizreminder
 *   PASS_TEAM_ID       your 10-char Apple team ID
 *   PASS_CERT_PEM      Pass Type ID certificate (PEM, base64-encoded)
 *   PASS_KEY_PEM       private key (PEM, base64-encoded)
 *   PASS_KEY_PASSPHRASE (optional)
 *   PASS_WWDR_PEM      Apple WWDR G4 intermediate cert (PEM, base64-encoded)
 *
 * Without them we fall back to an UNSIGNED pass package (mock mode) —
 * structurally identical, but iOS will refuse to install it.
 */

// 29x29 solid dark-slate PNG (minimum viable icon; replace with real art)
const ICON_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAYAAABWk2cPAAAAKklEQVRIS+3NMQEAAAgDoJnc6BpjDzRgcnUqIiIiIiIiIiIiIiIiIvIZWXlmHR2wm3+RAAAAAElFTkSuQmCC",
  "base64"
);

export function hasRealCerts(): boolean {
  return Boolean(
    process.env.PASS_TYPE_ID &&
      process.env.PASS_TEAM_ID &&
      process.env.PASS_CERT_PEM &&
      process.env.PASS_KEY_PEM &&
      process.env.PASS_WWDR_PEM
  );
}

function passJson(reminder: Reminder, design: PassDesign, baseUrl: string) {
  const content = buildPassContent(reminder, design);
  return {
    formatVersion: 1,
    passTypeIdentifier: process.env.PASS_TYPE_ID || "pass.com.example.quizreminder",
    teamIdentifier: process.env.PASS_TEAM_ID || "MOCKTEAMID",
    serialNumber: reminder.id,
    ...content,
    barcodes: [
      {
        format: "PKBarcodeFormatQR",
        message: `${baseUrl}/reminder/${reminder.id}`,
        messageEncoding: "iso-8859-1",
        altText: reminder.course,
      },
    ],
  };
}

/** Signed pass via passkit-generator (only when real certs are configured). */
async function generateSigned(reminder: Reminder, design: PassDesign, baseUrl: string): Promise<Buffer> {
  const { PKPass } = await import("passkit-generator");
  const decoded = (v: string) => Buffer.from(v, "base64").toString("utf8");
  const json = passJson(reminder, design, baseUrl);

  const pass = new PKPass(
    {
      "pass.json": Buffer.from(JSON.stringify(json)),
      "icon.png": ICON_PNG,
      "icon@2x.png": ICON_PNG,
      "logo.png": ICON_PNG,
    },
    {
      wwdr: decoded(process.env.PASS_WWDR_PEM!),
      signerCert: decoded(process.env.PASS_CERT_PEM!),
      signerKey: decoded(process.env.PASS_KEY_PEM!),
      signerKeyPassphrase: process.env.PASS_KEY_PASSPHRASE,
    }
  );
  return pass.getAsBuffer();
}

/** Unsigned mock pass: correct structure + manifest, no signature file. */
async function generateMock(reminder: Reminder, design: PassDesign, baseUrl: string): Promise<Buffer> {
  const zip = new JSZip();
  const files: Record<string, Buffer> = {
    "pass.json": Buffer.from(JSON.stringify(passJson(reminder, design, baseUrl), null, 2)),
    "icon.png": ICON_PNG,
    "icon@2x.png": ICON_PNG,
    "logo.png": ICON_PNG,
  };
  const manifest: Record<string, string> = {};
  for (const [name, buf] of Object.entries(files)) {
    zip.file(name, buf);
    manifest[name] = crypto.createHash("sha1").update(buf).digest("hex");
  }
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  zip.file(
    "MOCK_SIGNING_README.txt",
    "This pass is unsigned (no Apple Wallet certificate configured).\n" +
      "Set PASS_TYPE_ID, PASS_TEAM_ID, PASS_CERT_PEM, PASS_KEY_PEM and PASS_WWDR_PEM\n" +
      "to produce installable passes. See README.md."
  );
  return zip.generateAsync({ type: "nodebuffer" });
}

export async function generatePass(
  reminder: Reminder,
  design: PassDesign,
  baseUrl: string
): Promise<{ buffer: Buffer; signed: boolean }> {
  if (hasRealCerts()) {
    return { buffer: await generateSigned(reminder, design, baseUrl), signed: true };
  }
  return { buffer: await generateMock(reminder, design, baseUrl), signed: false };
}
