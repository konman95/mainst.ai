import { NextResponse } from "next/server";
import { addContact, getContacts } from "./store";

export async function GET() {
  return NextResponse.json(getContacts());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const contact = addContact(body);
  return NextResponse.json(contact, { status: 201 });
}
