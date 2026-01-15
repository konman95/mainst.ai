import { NextRequest, NextResponse } from "next/server";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebaseServer";
import { resolveUid } from "../../../../lib/firebaseAuth";
import { removeContact, updateContact } from "../../../../lib/devStore";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { uid } = await resolveUid(request.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (uid === "dev") {
    const body = await request.json().catch(() => ({}));
    const updates = {
      ...(body?.name !== undefined ? { name: String(body.name).trim() } : {}),
      ...(body?.email !== undefined ? { email: String(body.email).trim() } : {}),
      ...(body?.phone !== undefined ? { phone: String(body.phone).trim() } : {}),
      ...(body?.notes !== undefined ? { notes: String(body.notes).trim() } : {}),
      ...(body?.status !== undefined ? { status: String(body.status).trim() } : {}),
      ...(body?.tags !== undefined
        ? {
            tags: Array.isArray(body.tags)
              ? body.tags.map((tag: any) => String(tag).trim()).filter(Boolean)
              : []
          }
        : {})
    };
    const updated = updateContact(id, updates as any);
    if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(updated);
  }

  const ref = doc(db, "contacts", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (snap.data()?.uid !== uid) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const updates = {
    ...(body?.name !== undefined ? { name: String(body.name).trim() } : {}),
    ...(body?.email !== undefined ? { email: String(body.email).trim() } : {}),
    ...(body?.phone !== undefined ? { phone: String(body.phone).trim() } : {}),
    ...(body?.notes !== undefined ? { notes: String(body.notes).trim() } : {}),
    ...(body?.status !== undefined ? { status: String(body.status).trim() } : {}),
    ...(body?.tags !== undefined
      ? {
          tags: Array.isArray(body.tags)
            ? body.tags.map((tag: any) => String(tag).trim()).filter(Boolean)
            : []
        }
      : {}),
    updatedAt: Date.now()
  };

  await updateDoc(ref, updates);
  return NextResponse.json({ id, ...snap.data(), ...updates });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { uid } = await resolveUid(request.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (uid === "dev") {
    const removed = removeContact(id);
    if (!removed) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  }
  const ref = doc(db, "contacts", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (snap.data()?.uid !== uid) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await deleteDoc(ref);
  return NextResponse.json({ ok: true });
}
