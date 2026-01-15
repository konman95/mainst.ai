import { NextResponse } from "next/server";
import { listMessages } from "../../../../../lib/devStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId") || "dev-default";
  return NextResponse.json(listMessages(conversationId));
}
