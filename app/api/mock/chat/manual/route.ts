import { NextResponse } from "next/server";
import { addAudit, addMessage } from "../../../../../lib/devStore";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const conversationId = String(body?.conversationId || "dev-default");
  const responseText = String(body?.response || "").trim();
  if (!responseText) {
    return NextResponse.json({ error: "Response is required." }, { status: 400 });
  }

  addMessage(conversationId, "assistant", responseText);
  addAudit({
    uid: "dev",
    type: "chat",
    message: "Manual reply sent",
    response: responseText,
    decision: "manual"
  });

  return NextResponse.json({ ok: true });
}
