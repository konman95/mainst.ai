import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebaseServer";
import { resolveUid } from "../../../../lib/firebaseAuth";
import { updateAction } from "../../../../lib/devStore";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { uid } = await resolveUid(request.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const status = String(body?.status || "");
  if (!status) return NextResponse.json({ error: "Status is required." }, { status: 400 });

  if (uid === "dev") {
    const updated = updateAction(id, status as any);
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(updated);
  }

  const ref = doc(db, "actionQueue", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (snap.data()?.uid !== uid) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await updateDoc(ref, { status });
  return NextResponse.json({ id, ...snap.data(), status });
}
