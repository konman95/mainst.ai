import { NextResponse } from "next/server";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../lib/firebaseServer";
import { resolveUid } from "../../../lib/firebaseAuth";
import { getProfile, setProfile } from "../../../lib/devStore";

const DEFAULT_PROFILE = {
  name: "",
  services: "",
  hours: "",
  serviceArea: "",
  pricingNotes: "",
  policies: "",
  tone: "Calm, professional, concise.",
  updatedAt: Date.now()
};

export async function GET(request: Request) {
  const { uid } = await resolveUid(request.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (uid === "dev") {
    return NextResponse.json(getProfile());
  }

  const ref = doc(db, "businessProfiles", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, DEFAULT_PROFILE);
    return NextResponse.json(DEFAULT_PROFILE);
  }
  return NextResponse.json(snap.data());
}

export async function POST(request: Request) {
  const { uid } = await resolveUid(request.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const next = {
    ...DEFAULT_PROFILE,
    ...body,
    updatedAt: Date.now()
  };

  if (uid === "dev") {
    return NextResponse.json(setProfile(next));
  }

  const ref = doc(db, "businessProfiles", uid);
  await setDoc(ref, next, { merge: true });
  return NextResponse.json(next);
}
