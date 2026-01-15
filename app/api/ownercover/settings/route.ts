import { NextResponse } from "next/server";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebaseServer";
import { resolveUid } from "../../../../lib/firebaseAuth";
import { getOwnerCoverSettings, setOwnerCoverSettings } from "../../../../lib/devStore";

const DEFAULT_SETTINGS = {
  mode: "monitor",
  confidenceThreshold: 0.85,
  restrictedTopics: ["billing", "complaints", "legal"],
  quietHoursStart: "20:00",
  quietHoursEnd: "07:00",
  quietHoursEnabled: false
};

export async function GET(request: Request) {
  const { uid } = await resolveUid(request.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (uid === "dev") {
    return NextResponse.json(getOwnerCoverSettings());
  }

  const ref = doc(db, "ownerCoverSettings", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, DEFAULT_SETTINGS);
    return NextResponse.json(DEFAULT_SETTINGS);
  }
  return NextResponse.json(snap.data());
}

export async function POST(request: Request) {
  const { uid } = await resolveUid(request.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const next = {
    ...DEFAULT_SETTINGS,
    ...body
  };

  if (uid === "dev") {
    return NextResponse.json(setOwnerCoverSettings(next));
  }

  const ref = doc(db, "ownerCoverSettings", uid);
  await setDoc(ref, next, { merge: true });
  return NextResponse.json(next);
}
