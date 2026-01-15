import { NextResponse } from "next/server";
import { getSettings, setSettings } from "../store";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json(setSettings(body));
}
