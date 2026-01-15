import { NextResponse } from "next/server";
import { getSettings } from "../store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const settings = getSettings();
  const text = String(body?.text || "");
  const lower = text.toLowerCase();
  const restricted = settings.restrictedTopics.some(topic => lower.includes(topic));
  const confidence = restricted ? 0.6 : 0.9;
  const action =
    settings.mode === "off"
      ? "monitor"
      : settings.mode === "monitor"
        ? "await-approval"
        : confidence >= settings.confidenceThreshold && !restricted
          ? "auto-send"
          : "await-approval";

  return NextResponse.json({
    ok: true,
    action,
    confidence,
    restricted,
    summary: "Inbound handled by Owner Cover mock flow.",
    incoming: body
  });
}
