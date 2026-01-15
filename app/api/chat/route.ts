import { NextResponse } from "next/server";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  limit
} from "firebase/firestore";
import { db } from "../../../lib/firebaseServer";
import { resolveUid } from "../../../lib/firebaseAuth";
import { addAudit, addMessage, getProfile, listMessages } from "../../../lib/devStore";

function buildPrompt(params: {
  message: string;
  profile?: any;
  history?: { role: string; content: string }[];
  contact?: any;
}) {
  const profile = params.profile || {};
  const lines = [
    "You are Main St AI, a calm, professional front-desk assistant for a small business.",
    "You respond clearly, avoid hype, and keep answers concise and helpful.",
    "If the user asks about pricing, ask a clarifying question instead of inventing numbers.",
    "Never claim actions you did not take.",
    "",
    `Business name: ${profile.name || "Main St AI client"}`,
    `Services: ${profile.services || "Not provided"}`,
    `Hours: ${profile.hours || "Not provided"}`,
    `Service area: ${profile.serviceArea || "Not provided"}`,
    `Pricing notes: ${profile.pricingNotes || "Not provided"}`,
    `Policies: ${profile.policies || "Not provided"}`,
    `Tone guidance: ${profile.tone || "Calm, professional, concise."}`
  ];

  if (params.contact) {
    lines.push(
      "",
      `Contact name: ${params.contact.name || "Unknown"}`,
      `Contact email: ${params.contact.email || "Unknown"}`,
      `Contact phone: ${params.contact.phone || "Unknown"}`,
      `Contact notes: ${params.contact.notes || "None"}`,
      `Lead status: ${params.contact.status || "Unknown"}`
    );
  }

  if (params.history && params.history.length) {
    lines.push("", "Conversation history:");
    params.history.forEach(entry => {
      lines.push(`${entry.role.toUpperCase()}: ${entry.content}`);
    });
  }

  lines.push("", `Customer message: ${params.message}`, "Assistant response:");
  return lines.join("\n");
}

export async function POST(request: Request) {
  const { uid } = await resolveUid(request.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const message = String(body?.message || "").trim();
  const conversationId = String(body?.conversationId || `${uid}-default`);

  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const profile =
    uid === "dev"
      ? getProfile()
      : await (async () => {
          const ref = doc(db, "businessProfiles", uid);
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            await setDoc(ref, {
              name: "Main St AI client",
              services: "",
              hours: "",
              serviceArea: "",
              pricingNotes: "",
              policies: "",
              tone: "Calm, professional, concise.",
              updatedAt: Date.now()
            });
            return {
              name: "Main St AI client",
              services: "",
              hours: "",
              serviceArea: "",
              pricingNotes: "",
              policies: "",
              tone: "Calm, professional, concise."
            };
          }
          return snap.data();
        })();

  const history =
    uid === "dev"
      ? listMessages(conversationId).slice(-6).map(m => ({ role: m.role, content: m.content }))
      : await (async () => {
          const convoRef = doc(db, "conversations", conversationId);
          await setDoc(
            convoRef,
            { uid, updatedAt: Date.now(), channel: "web" },
            { merge: true }
          );
          const messagesRef = collection(convoRef, "messages");
          const q = query(messagesRef, orderBy("createdAt", "desc"), limit(6));
          const snap = await getDocs(q);
          return snap.docs
            .map(docSnap => ({
              role: docSnap.data().role,
              content: docSnap.data().content,
              createdAt: docSnap.data().createdAt
            }))
            .sort((a, b) => a.createdAt - b.createdAt);
        })();

  const token = process.env.HF_TOKEN;
  const model = process.env.HF_MODEL || "mistralai/Mistral-7B-Instruct-v0.2";

  if (!token) {
    const fallback = "Thanks for reaching out. How can I help you today?";
    if (uid === "dev") {
      addMessage(conversationId, "user", message);
      addMessage(conversationId, "assistant", fallback);
      addAudit({
        uid,
        type: "chat",
        message,
        response: fallback,
        decision: "sent"
      });
    }
    return NextResponse.json({
      reply: fallback,
      model: "mock",
      warning: "HF_TOKEN is not configured."
    });
  }

  const prompt = buildPrompt({ message, profile, history });
  const maxTokens = 180;
  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: maxTokens,
        temperature: 0.3,
        return_full_text: false
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Hugging Face error");
    return NextResponse.json({ error: errorText }, { status: 502 });
  }

  const data = await response.json();
  const reply =
    Array.isArray(data) && data[0]?.generated_text
      ? String(data[0].generated_text).trim()
      : typeof data?.generated_text === "string"
        ? data.generated_text.trim()
        : "";

  const finalReply = reply || "Thanks for reaching out. How can I help you today?";

  if (uid === "dev") {
    addMessage(conversationId, "user", message);
    addMessage(conversationId, "assistant", finalReply);
    addAudit({
      uid,
      type: "chat",
      message,
      response: finalReply,
      decision: "sent"
    });
  } else {
    const convoRef = doc(db, "conversations", conversationId);
    await setDoc(convoRef, { uid, updatedAt: Date.now(), channel: "web" }, { merge: true });
    const messagesRef = collection(convoRef, "messages");
    await addDoc(messagesRef, {
      role: "user",
      content: message,
      createdAt: Date.now()
    });
    await addDoc(messagesRef, {
      role: "assistant",
      content: finalReply,
      createdAt: Date.now()
    });
    await addDoc(collection(db, "auditEvents"), {
      uid,
      type: "chat",
      message,
      response: finalReply,
      decision: "sent",
      createdAt: Date.now()
    });
  }

  return NextResponse.json({
    reply: finalReply,
    model,
    conversationId
  });
}
