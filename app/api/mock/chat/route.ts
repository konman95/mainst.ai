import { NextResponse } from "next/server";

function classify(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("price") || lower.includes("cost")) {
    return { intent: "Pricing", confidence: 0.92 };
  }
  if (lower.includes("hours") || lower.includes("open")) {
    return { intent: "Hours", confidence: 0.9 };
  }
  if (lower.includes("complaint") || lower.includes("refund")) {
    return { intent: "Complaint", confidence: 0.75 };
  }
  return { intent: "General", confidence: 0.82 };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const message = String(body?.message || "");
  const { intent, confidence } = classify(message);
  const reply =
    intent === "Pricing"
      ? "Thanks for asking! Pricing depends on your service needs. If you can share a few details, I can give a clear range."
      : intent === "Hours"
        ? "We are open Monday through Friday from 9am to 6pm. If you need a different time, I can check availability."
        : intent === "Complaint"
          ? "I’m sorry that happened. I’ve flagged this for review and will connect you with an owner for a quick resolution."
          : "Thanks for reaching out. I can help with details or connect you to the right person. What can I assist with?";

  return NextResponse.json({
    reply,
    intent,
    confidence,
    safe: intent !== "Complaint"
  });
}
