import { NextResponse } from "next/server";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../lib/firebaseServer";
import { resolveUid } from "../../../lib/firebaseAuth";
import { addContact, listContacts } from "../../../lib/devStore";

export async function GET(request: Request) {
  const { uid } = await resolveUid(request.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (uid === "dev") {
    return NextResponse.json(listContacts());
  }

  const q = query(collection(db, "contacts"), where("uid", "==", uid));
  const snap = await getDocs(q);
  const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { uid } = await resolveUid(request.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim();
  const phone = String(body?.phone || "").trim();
  const notes = String(body?.notes || "").trim();
  const tags = Array.isArray(body?.tags)
    ? body.tags.map((tag: any) => String(tag).trim()).filter(Boolean)
    : [];
  const status = String(body?.status || "new").trim();

  if (uid === "dev") {
    const contact = addContact({ name, email, phone, notes, tags, status });
    return NextResponse.json(contact, { status: 201 });
  }

  const docRef = await addDoc(collection(db, "contacts"), {
    uid,
    name,
    email,
    phone,
    notes,
    tags,
    status,
    lastContact: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  return NextResponse.json(
    { id: docRef.id, uid, name, email, phone, notes, tags, status },
    { status: 201 }
  );
}
