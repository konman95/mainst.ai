import { NextResponse } from "next/server";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "../../../lib/firebaseServer";
import { resolveUid } from "../../../lib/firebaseAuth";
import { listActions } from "../../../lib/devStore";

export async function GET(request: Request) {
  const { uid } = await resolveUid(request.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (uid === "dev") {
    return NextResponse.json(listActions());
  }

  const q = query(
    collection(db, "actionQueue"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json(data);
}
