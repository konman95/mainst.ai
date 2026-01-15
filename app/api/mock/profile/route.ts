import { NextResponse } from "next/server";
import { getProfile, setProfile } from "../../../../lib/devStore";

export async function GET() {
  return NextResponse.json(getProfile());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json(setProfile(body));
}
