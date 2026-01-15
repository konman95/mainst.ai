import { NextResponse } from "next/server";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebaseServer";
import { resolveUid } from "../../../../lib/firebaseAuth";
import { addAudit, addMessage } from "../../../../lib/devStore";

export async function POST(request: Request) {
  const { uid } = await resolveUid(request.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const conversationId = String(body?.conversationId || `${uid}-default`);
  const responseText = String(body?.response || "").trim();
  if (!responseText) {
    return NextResponse.json({ error: "Response is required." }, { status: 400 });
  }

  if (uid === "dev") {
    addMessage(conversationId, "assistant", responseText);
    addAudit({
      uid,
      type: "chat",
      message: "Manual reply sent",
      response: responseText,
      decision: "manual"
    });
    return NextResponse.json({ ok: true });
  }

  const convoRef = doc(db, "conversations", conversationId);
  await setDoc(convoRef, { uid, updatedAt: Date.now(), channel: "web" }, { merge: true });
  const messagesRef = collection(convoRef, "messages");
  await addDoc(messagesRef, {
    role: "assistant",
    content: responseText,
    createdAt: Date.now()
  });
  await addDoc(collection(db, "auditEvents"), {
    uid,
    type: "chat",
    message: "Manual reply sent",
    response: responseText,
    decision: "manual",
    createdAt: Date.now()
  });

  return NextResponse.json({ ok: true });
}
