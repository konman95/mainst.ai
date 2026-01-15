import { NextResponse } from "next/server";
import { collection, doc, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../../../lib/firebaseServer";
import { resolveUid } from "../../../../lib/firebaseAuth";
import { listMessages } from "../../../../lib/devStore";

export async function GET(request: Request) {
  const { uid } = await resolveUid(request.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId") || `${uid}-default`;

  if (uid === "dev") {
    return NextResponse.json(listMessages(conversationId));
  }

  const convoRef = doc(db, "conversations", conversationId);
  const messagesRef = collection(convoRef, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  const data = snap.docs.map(docSnap => docSnap.data());
  return NextResponse.json(data);
}
