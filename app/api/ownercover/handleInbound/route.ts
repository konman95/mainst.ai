import { NextResponse } from "next/server";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../../../../lib/firebaseServer";
import { resolveUid } from "../../../../lib/firebaseAuth";
import {
  addAction,
  addAudit,
  getOwnerCoverSettings
} from "../../../../lib/devStore";

const DEFAULT_SETTINGS = {
  mode: "monitor",
  confidenceThreshold: 0.85,
  restrictedTopics: ["billing", "complaints", "legal"]
};

function isQuietHours(settings: typeof DEFAULT_SETTINGS) {
  if (!settings.quietHoursEnabled) return false;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = settings.quietHoursStart.split(":").map(Number);
  const [endH, endM] = settings.quietHoursEnd.split(":").map(Number);
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  if (start < end) return current >= start && current < end;
  return current >= start || current < end;
}

function decideAction(settings: typeof DEFAULT_SETTINGS, text: string) {
  const lower = text.toLowerCase();
  const restricted = settings.restrictedTopics.some(topic => lower.includes(topic));
  const quiet = isQuietHours(settings);
  const confidence = restricted ? 0.6 : 0.9;
  const action =
    settings.mode === "off"
      ? "monitor"
      : settings.mode === "monitor"
        ? "await-approval"
        : confidence >= settings.confidenceThreshold && !restricted && !quiet
          ? "auto-send"
          : "await-approval";
  return { action, confidence, restricted: restricted || quiet, quietHours: quiet };
}

export async function POST(request: Request) {
  const { uid } = await resolveUid(request.headers.get("authorization"));
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const text = String(body?.text || "");

  const settings =
    uid === "dev"
      ? getOwnerCoverSettings()
      : await (async () => {
          const settingsRef = doc(db, "ownerCoverSettings", uid);
          const settingsSnap = await getDoc(settingsRef);
          return settingsSnap.exists()
            ? { ...DEFAULT_SETTINGS, ...settingsSnap.data() }
            : DEFAULT_SETTINGS;
        })();

  const decision = decideAction(settings as typeof DEFAULT_SETTINGS, text);

  if (uid === "dev") {
    addAction({
      action: decision.action,
      confidence: decision.confidence,
      restricted: decision.restricted,
      response: "Draft response created by Owner Cover.",
      reason: decision.restricted
        ? "Restricted topic or quiet hours require approval."
        : decision.confidence < settings.confidenceThreshold
          ? "Confidence below threshold."
          : "Within guardrails.",
      message: text,
      status: decision.action === "auto-send" ? "sent" : "queued"
    });
    addAudit({
      uid,
      type: "owner-cover",
      message: text,
      response: "Draft response created by Owner Cover.",
      decision: decision.action,
      confidence: decision.confidence
    });
  } else {
    await addDoc(collection(db, "ownerCoverEvents"), {
      uid,
      timestamp: Date.now(),
      incoming: body,
      settings,
      ...decision
    });
    await addDoc(collection(db, "actionQueue"), {
      uid,
      status: decision.action === "auto-send" ? "sent" : "queued",
      action: decision.action,
      confidence: decision.confidence,
      restricted: decision.restricted,
      reason: decision.restricted
        ? "Restricted topic or quiet hours require approval."
        : decision.confidence < settings.confidenceThreshold
          ? "Confidence below threshold."
          : "Within guardrails.",
      message: text,
      response: "Draft response created by Owner Cover.",
      createdAt: Date.now()
    });
    await addDoc(collection(db, "auditEvents"), {
      uid,
      type: "owner-cover",
      message: text,
      response: "Draft response created by Owner Cover.",
      decision: decision.action,
      confidence: decision.confidence,
      createdAt: Date.now()
    });
  }

  return NextResponse.json({
    ok: true,
    ...decision,
    summary: "Inbound handled by Owner Cover.",
    incoming: body
  });
}
