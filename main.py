from __future__ import annotations

import os
import time
import uuid
import json
import base64
import urllib.request
import urllib.error
import urllib.parse

try:
    from dotenv import load_dotenv
    load_dotenv(".env.local")
except Exception:
    pass
from typing import Any, Dict, List, Optional, Literal

from fastapi import FastAPI, HTTPException, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from huggingface_hub import InferenceClient

# ============================================================
# ENV
# ============================================================
HF_TOKEN = os.getenv("HF_TOKEN", "")
HF_MODEL = os.getenv("HF_MODEL", "mistralai/Mistral-7B-Instruct-v0.2")

FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

CRON_SECRET = os.getenv("CRON_SECRET", "change-me")
SAVED_MINUTES_PER_ACTION = int(os.getenv("SAVED_MINUTES_PER_ACTION", "2"))
ALLOW_DEV_TOKENS = os.getenv("ALLOW_DEV_TOKENS", "true").lower() == "true"
ENFORCE_FIREBASE_AUTH = os.getenv("ENFORCE_FIREBASE_AUTH", "false").lower() == "true"
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "no-reply@mainst.ai")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "")

hf_client = InferenceClient(model=HF_MODEL, token=HF_TOKEN) if HF_TOKEN else None

_firestore = None
_firebase_auth = None


def init_firestore():
    global _firestore, _firebase_auth
    try:
        import firebase_admin
        from firebase_admin import credentials, auth
        from google.cloud import firestore

        if not firebase_admin._apps:
            if GOOGLE_APPLICATION_CREDENTIALS and os.path.exists(GOOGLE_APPLICATION_CREDENTIALS):
                cred = credentials.Certificate(GOOGLE_APPLICATION_CREDENTIALS)
                firebase_admin.initialize_app(
                    cred,
                    {"projectId": FIREBASE_PROJECT_ID} if FIREBASE_PROJECT_ID else None,
                )
            else:
                firebase_admin.initialize_app(
                    options={"projectId": FIREBASE_PROJECT_ID} if FIREBASE_PROJECT_ID else None
                )
        _firebase_auth = auth
        _firestore = firestore.Client(project=FIREBASE_PROJECT_ID) if FIREBASE_PROJECT_ID else firestore.Client()
    except Exception as e:
        _firestore = None
        _firebase_auth = None
        print("Firebase/Firestore not initialized. DEV fallback mode.")
        print("Reason:", repr(e))


init_firestore()

DEV_DB: Dict[str, Any] = {"users": {}}

# ============================================================
# AUTH
# ============================================================


class AuthedUser(BaseModel):
    uid: str
    email: Optional[str] = None


def get_user(authorization: Optional[str] = Header(default=None)) -> AuthedUser:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Authorization must be: Bearer <token>")
    token = parts[1].strip()

    # DEV: Bearer dev-<uid>
    if _firebase_auth is None:
        if ENFORCE_FIREBASE_AUTH:
            raise HTTPException(status_code=503, detail="Firebase Admin not configured")
        if token.startswith("dev-"):
            if not ALLOW_DEV_TOKENS:
                raise HTTPException(status_code=401, detail="Dev tokens are disabled")
            uid = token.replace("dev-", "", 1)
            ensure_user(uid)
            ensure_workspace_member(uid)
            return AuthedUser(uid=uid)
        raise HTTPException(status_code=401, detail="Firebase Admin not configured. Use Bearer dev-<uid> in DEV.")

    try:
        decoded = _firebase_auth.verify_id_token(token)
        user = AuthedUser(uid=decoded["uid"], email=decoded.get("email"))
        ensure_user(user.uid)
        ensure_workspace_member(user.uid, user.email)
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Firebase ID token")


# ============================================================
# MODELS
# ============================================================
Channel = Literal["webchat", "email", "sms"]


class BusinessProfile(BaseModel):
    business_name: str = "Main St AI Business"
    services: List[str] = []
    service_area: str = ""
    hours: str = "Mon-Fri 9am-5pm"
    pricing_notes: str = ""
    policies: str = ""
    tone: str = "professional, concise, friendly"


class OwnerCoverSettings(BaseModel):
    mode: Literal["off", "monitor", "autosend"] = "autosend"
    confidence_threshold: float = 0.70
    money_requires_approval: bool = True
    quiet_hours_enabled: bool = False
    quiet_hours_start: str = "21:00"
    quiet_hours_end: str = "08:00"
    minutesPerAction: int = Field(default=2, ge=1, le=30)
    autosend_topics: List[str] = Field(default_factory=lambda: ["hours", "services", "booking", "pricing_basic", "status", "default"])
    escalation_topics: List[str] = Field(default_factory=lambda: ["complaint", "legal", "refund"])
    follow_up_enabled: bool = True
    follow_up_after_hours: int = 24
    templates: Dict[str, str] = Field(default_factory=lambda: {
        "default": "Thanks for reaching out! Can you share a little more detail so I can help you best?",
        "escalation": "Thanks for the message. I am looping in the owner to make sure this is handled correctly.",
        "after_hours": "Thanks for reaching out! We are currently away. We will respond as soon as we are back in business hours.",
        "follow_up": "Just checking in. Did you still want help with this?"
    })


class BillingSettings(BaseModel):
    plan: Literal["core", "pro", "enterprise"] = "pro"
    billing_email: str = "owner@mainst.ai"
    payment_method: str = "Visa •••• 4242"
    seats: int = Field(default=3, ge=1, le=250)


class Integration(BaseModel):
    id: Literal["webchat", "email", "sms"]
    name: str
    status: Literal["connected", "pending", "disconnected"] = "disconnected"
    description: str = ""
    last_sync: str = ""


class TeamMember(BaseModel):
    id: str
    name: str
    email: str
    role: Literal["Owner", "Manager", "Agent"] = "Agent"
    status: Literal["Active", "Invited"] = "Active"
    uid: Optional[str] = None


class AccessConfig(BaseModel):
    role: Literal["Owner", "Manager", "Agent"] = "Owner"
    workspace_id: str = "primary"
    effective_role: Optional[Literal["Owner", "Manager", "Agent"]] = None


class Workspace(BaseModel):
    id: str
    name: str
    created_ts: float = Field(default_factory=lambda: time.time())


class WorkspaceMember(BaseModel):
    id: str
    name: str
    email: str
    role: Literal["Owner", "Manager", "Agent"] = "Agent"
    status: Literal["Active", "Invited"] = "Active"
    uid: Optional[str] = None


class AutomationRule(BaseModel):
    id: str
    name: str
    trigger: str
    action: str
    status: Literal["active", "paused"] = "active"
    risk: Literal["low", "medium", "high"] = "medium"


class Guardrail(BaseModel):
    id: str
    label: str
    description: str
    enabled: bool = True


class SecurityPolicy(BaseModel):
    id: str
    name: str
    description: str
    enabled: bool = True


class Notification(BaseModel):
    id: str
    title: str
    detail: str
    severity: Literal["low", "medium", "high"] = "low"
    status: Literal["new", "acknowledged", "resolved"] = "new"
    ts: float = Field(default_factory=lambda: time.time())
    tags: List[str] = Field(default_factory=list)
    link: Optional[str] = None
    action_id: Optional[str] = None
    decision_id: Optional[str] = None


class NotificationRouting(BaseModel):
    email_enabled: bool = True
    sms_enabled: bool = False
    email: str = "owner@mainst.ai"
    sms: str = ""
    min_severity: Literal["low", "medium", "high"] = "high"


class WorkspaceSelect(BaseModel):
    id: str


class Contact(BaseModel):
    id: str
    name: str = ""
    phone: str = ""
    email: str = ""
    tags: List[str] = []
    lead_status: str = "new"
    notes: str = ""
    last_touch_ts: float = 0.0
    last_inbound_ts: float = 0.0
    last_outbound_ts: float = 0.0


class Thread(BaseModel):
    id: str
    contact_id: str
    channel: Channel
    created_ts: float = Field(default_factory=lambda: time.time())
    last_message_ts: float = Field(default_factory=lambda: time.time())


class Message(BaseModel):
    id: str
    role: Literal["user", "assistant", "system"]
    text: str
    ts: float = Field(default_factory=lambda: time.time())


class InboundMessage(BaseModel):
    contact_id: str
    channel: Channel = "webchat"
    text: str
    ts: float = Field(default_factory=lambda: time.time())


class ChatRequest(BaseModel):
    message: str
    contact_id: Optional[str] = None
    thread_id: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    thread_id: str


class Decision(BaseModel):
    id: str
    uid: str
    contact_id: str
    thread_id: str
    channel: Channel
    intent: str
    risk: float
    confidence: float
    decision: Literal["send", "queue", "block"]
    reason: str
    draft: str
    created_ts: float = Field(default_factory=lambda: time.time())


class ActionQueueItem(BaseModel):
    id: str
    decision_id: str
    status: Literal["needs_approval", "approved", "sent", "blocked", "error"] = "needs_approval"
    contact_id: str
    thread_id: str
    channel: Channel
    draft: str
    reason: str
    confidence: float
    created_ts: float = Field(default_factory=lambda: time.time())
    sent_ts: Optional[float] = None


class Outcome(BaseModel):
    id: str
    contact_id: str
    thread_id: str
    type: Literal[
        "won",
        "lost",
        "resolved",
        "satisfied",
        "unsatisfied",
        "owner_intervened",
        "follow_up_success",
        "follow_up_failed",
    ]
    note: str = ""
    ts: float = Field(default_factory=lambda: time.time())


# ============================================================
# FIRESTORE HELPERS (with DEV fallback)
# ============================================================
def fs_doc(path: str):
    return _firestore.document(path)


def fs_col(path: str):
    return _firestore.collection(path)


def root_path(uid: str, subpath: str = "") -> str:
    base = f"users/{uid}"
    return f"{base}/{subpath}" if subpath else base


def get_root_scope(uid: str) -> Dict[str, Any]:
    u = DEV_DB["users"].setdefault(uid, {})
    return u.setdefault("_root", {})


def get_access_config(uid: str) -> AccessConfig:
    return get_root_cfg(uid, "access", AccessConfig, AccessConfig())


def require_role(user: AuthedUser, allowed: List[str]):
    access = get_access_config(user.uid)
    role = get_workspace_role(user.uid, access.workspace_id)
    if _firestore is None and role == "Agent" and "Owner" in allowed and ALLOW_DEV_TOKENS:
        return access
    if role not in allowed:
        raise HTTPException(status_code=403, detail="Insufficient role for this action")
    return access


def ensure_workspace_member(uid: str, email: Optional[str] = None):
    ws_id = get_workspace_id(uid)
    members = get_workspace_members(uid, ws_id)
    if not members:
        owner = WorkspaceMember(
            id="member-owner",
            name="Owner",
            email=email or "",
            role="Owner",
            status="Active",
            uid=uid,
        )
        set_workspace_members(uid, ws_id, [owner.model_dump()])
        return
    for member in members:
        if member.get("uid") == uid:
            return
    if email:
        updated = []
        activated = False
        for member in members:
            if member.get("email") and member.get("email") == email and member.get("status") == "Invited":
                updated.append({**member, "uid": uid, "status": "Active"})
                activated = True
            else:
                updated.append(member)
        if activated:
            set_workspace_members(uid, ws_id, updated)


def get_workspace_id(uid: str) -> str:
    cfg = get_access_config(uid)
    return cfg.workspace_id or "primary"


def scoped_path(uid: str, subpath: str = "") -> str:
    ws = get_workspace_id(uid)
    base = f"users/{uid}/workspaces/{ws}"
    return f"{base}/{subpath}" if subpath else base


def scoped_path_for(uid: str, ws_id: str, subpath: str = "") -> str:
    base = f"users/{uid}/workspaces/{ws_id}"
    return f"{base}/{subpath}" if subpath else base


def get_ws_scope(uid: str) -> Dict[str, Any]:
    u = DEV_DB["users"].setdefault(uid, {})
    workspaces = u.setdefault("_workspaces", {})
    ws = get_workspace_id(uid)
    return workspaces.setdefault(ws, {})


def get_ws_scope_for(uid: str, ws_id: str) -> Dict[str, Any]:
    u = DEV_DB["users"].setdefault(uid, {})
    workspaces = u.setdefault("_workspaces", {})
    return workspaces.setdefault(ws_id, {})


def fs_doc_uid(uid: str, subpath: str):
    return fs_doc(scoped_path(uid, subpath))


def fs_col_uid(uid: str, subpath: str):
    return fs_col(scoped_path(uid, subpath))


def fs_doc_ws(uid: str, ws_id: str, subpath: str):
    return fs_doc(scoped_path_for(uid, ws_id, subpath))


def fs_col_ws(uid: str, ws_id: str, subpath: str):
    return fs_col(scoped_path_for(uid, ws_id, subpath))


def ensure_user(uid: str):
    if _firestore is None:
        DEV_DB["users"].setdefault(uid, {})
        return
    ref = fs_doc(root_path(uid))
    if not ref.get().exists:
        ref.set({"created_ts": time.time()})


def get_root_cfg(uid: str, name: str, model_cls, default_obj):
    if _firestore is None:
        u = get_root_scope(uid)
        raw = u.get(name)
        return model_cls(**raw) if raw else default_obj
    ref = fs_doc(root_path(uid, f"config/{name}"))
    snap = ref.get()
    if snap.exists:
        return model_cls(**snap.to_dict())
    ref.set(default_obj.model_dump())
    return default_obj


def set_root_cfg(uid: str, name: str, obj):
    if _firestore is None:
        u = get_root_scope(uid)
        u[name] = obj.model_dump()
        return
    fs_doc(root_path(uid, f"config/{name}")).set(obj.model_dump())


def get_cfg(uid: str, name: str, model_cls, default_obj):
    if _firestore is None:
        u = get_ws_scope(uid)
        raw = u.get(name)
        return model_cls(**raw) if raw else default_obj
    ref = fs_doc_uid(uid, f"config/{name}")
    snap = ref.get()
    if snap.exists:
        return model_cls(**snap.to_dict())
    ref.set(default_obj.model_dump())
    return default_obj


def set_cfg(uid: str, name: str, obj):
    if _firestore is None:
        u = get_ws_scope(uid)
        u[name] = obj.model_dump()
        return
    fs_doc_uid(uid, f"config/{name}").set(obj.model_dump())


def write_doc(uid: str, path: str, data: Dict[str, Any]):
    if _firestore is None:
        u = get_ws_scope(uid)
        u.setdefault("_docs", {})[path] = data
        return
    fs_doc_uid(uid, path).set(data)


def add_doc(uid: str, path: str, data: Dict[str, Any]):
    if _firestore is None:
        u = get_ws_scope(uid)
        u.setdefault("_cols", {}).setdefault(path, []).append(data)
        return
    fs_col_uid(uid, path).add(data)


def inc_stat(uid: str, key: str, amount: int = 1):
    day = time.strftime("%Y%m%d")
    doc_path = f"stats/daily_{day}"
    if _firestore is None:
        u = get_ws_scope(uid)
        stats = u.setdefault(doc_path, {})
        stats[key] = int(stats.get(key, 0)) + amount
        return
    ref = fs_doc_uid(uid, doc_path)
    ref.set({key: amount, "day": day}, merge=True)


def get_business_profile(uid: str) -> BusinessProfile:
    return get_cfg(uid, "businessProfile", BusinessProfile, BusinessProfile())


def get_owner_cover(uid: str) -> OwnerCoverSettings:
    return get_cfg(uid, "ownerCover", OwnerCoverSettings, OwnerCoverSettings())


def default_integrations() -> List[Integration]:
    return [
        Integration(
            id="webchat",
            name="Web Chat",
            status="connected",
            description="On-site widget and Smart Chat routing.",
            last_sync="Live",
        ),
        Integration(
            id="email",
            name="Email Relay",
            status="pending",
            description="Route inbound emails into Owner Cover.",
            last_sync="Awaiting verification",
        ),
        Integration(
            id="sms",
            name="SMS Outbound",
            status="disconnected",
            description="Send replies to leads via text.",
            last_sync="Not configured",
        ),
    ]


def default_team() -> List[TeamMember]:
    return [
        TeamMember(id="owner", name="Owner", email="owner@mainst.ai", role="Owner", status="Active"),
        TeamMember(id="ops", name="Operations Lead", email="ops@mainst.ai", role="Manager", status="Active"),
    ]


def default_rules() -> List[AutomationRule]:
    return [
        AutomationRule(
            id="rule-hours",
            name="After-hours routing",
            trigger="Inbound outside business hours",
            action="Queue for approval + after-hours response",
            status="active",
            risk="low",
        ),
        AutomationRule(
            id="rule-pricing",
            name="Pricing intent",
            trigger="Customer asks about pricing",
            action="Send approved range + request one detail",
            status="active",
            risk="medium",
        ),
        AutomationRule(
            id="rule-complaint",
            name="Complaint escalation",
            trigger="Complaint or refund keywords",
            action="Escalate to owner + draft response",
            status="active",
            risk="high",
        ),
    ]


def default_guardrails() -> List[Guardrail]:
    return [
        Guardrail(
            id="gr-confidence",
            label="Minimum confidence",
            description="Block auto-send if confidence drops below 0.70.",
            enabled=True,
        ),
        Guardrail(
            id="gr-money",
            label="Money approval",
            description="Require approval for pricing, invoices, or refunds.",
            enabled=True,
        ),
        Guardrail(
            id="gr-legal",
            label="Legal escalation",
            description="Escalate legal or complaint language immediately.",
            enabled=True,
        ),
        Guardrail(
            id="gr-quiet",
            label="Quiet hours",
            description="Prevent auto-send outside business hours.",
            enabled=False,
        ),
    ]


def default_security_policies() -> List[SecurityPolicy]:
    return [
        SecurityPolicy(
            id="mfa",
            name="Multi-factor enforcement",
            description="Require MFA for owners and managers.",
            enabled=True,
        ),
        SecurityPolicy(
            id="ip",
            name="IP allowlist",
            description="Restrict logins to trusted networks.",
            enabled=False,
        ),
        SecurityPolicy(
            id="export",
            name="Weekly audit export",
            description="Send encrypted audit bundle to the owner.",
            enabled=True,
        ),
        SecurityPolicy(
            id="retention",
            name="90-day data retention",
            description="Auto-archive conversations after 90 days.",
            enabled=False,
        ),
    ]


def default_alerts() -> List[Notification]:
    return [
        Notification(
            id="alert-weekly",
            title="Weekly report ready",
            detail="Operator summary is ready to download.",
            severity="low",
            status="resolved",
            tags=["report"],
            link="/outcomes",
        )
    ]


def default_workspaces() -> List[Workspace]:
    return [
        Workspace(id="primary", name="Primary Workspace"),
        Workspace(id="hq", name="Main Office"),
    ]


def default_members(uid: str) -> List[WorkspaceMember]:
    return [
        WorkspaceMember(
            id="member-owner",
            name="Owner",
            email="",
            role="Owner",
            status="Active",
            uid=uid,
        )
    ]


def get_list_cfg(uid: str, name: str, default_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if _firestore is None:
        u = get_ws_scope(uid)
        if name not in u:
            u[name] = {"items": default_items}
        return list(u.get(name, {}).get("items", default_items))
    ref = fs_doc_uid(uid, f"config/{name}")
    snap = ref.get()
    if snap.exists:
        data = snap.to_dict() or {}
        return list(data.get("items", []))
    ref.set({"items": default_items})
    return default_items


def set_list_cfg(uid: str, name: str, items: List[Dict[str, Any]]):
    if _firestore is None:
        u = get_ws_scope(uid)
        u[name] = {"items": items}
        return
    fs_doc_uid(uid, f"config/{name}").set({"items": items})


def get_root_list_cfg(uid: str, name: str, default_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if _firestore is None:
        u = get_root_scope(uid)
        if name not in u:
            u[name] = {"items": default_items}
        return list(u.get(name, {}).get("items", default_items))
    ref = fs_doc(root_path(uid, f"config/{name}"))
    snap = ref.get()
    if snap.exists:
        data = snap.to_dict() or {}
        return list(data.get("items", []))
    ref.set({"items": default_items})
    return default_items


def set_root_list_cfg(uid: str, name: str, items: List[Dict[str, Any]]):
    if _firestore is None:
        u = get_root_scope(uid)
        u[name] = {"items": items}
        return
    fs_doc(root_path(uid, f"config/{name}")).set({"items": items})


def get_list_cfg_ws(uid: str, ws_id: str, name: str, default_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if _firestore is None:
        u = get_ws_scope_for(uid, ws_id)
        if name not in u:
            u[name] = {"items": default_items}
        return list(u.get(name, {}).get("items", default_items))
    ref = fs_doc_ws(uid, ws_id, f"config/{name}")
    snap = ref.get()
    if snap.exists:
        data = snap.to_dict() or {}
        return list(data.get("items", []))
    ref.set({"items": default_items})
    return default_items


def set_list_cfg_ws(uid: str, ws_id: str, name: str, items: List[Dict[str, Any]]):
    if _firestore is None:
        u = get_ws_scope_for(uid, ws_id)
        u[name] = {"items": items}
        return
    fs_doc_ws(uid, ws_id, f"config/{name}").set({"items": items})


def get_workspace_members(uid: str, ws_id: str) -> List[Dict[str, Any]]:
    if _firestore is None:
        u = get_ws_scope_for(uid, ws_id)
        if "members" not in u:
            u["members"] = {"items": [m.model_dump() for m in default_members(uid)], "uids": [uid]}
        return list(u.get("members", {}).get("items", []))
    ref = fs_doc_ws(uid, ws_id, "config/members")
    snap = ref.get()
    if snap.exists:
        return list((snap.to_dict() or {}).get("items", []))
    items = [m.model_dump() for m in default_members(uid)]
    set_workspace_members(uid, ws_id, items)
    return items


def set_workspace_members(uid: str, ws_id: str, items: List[Dict[str, Any]]):
    if _firestore is None:
        u = get_ws_scope_for(uid, ws_id)
        u["members"] = {"items": items, "uids": [m.get("uid") for m in items if m.get("uid")]}
        return
    ref = fs_doc_ws(uid, ws_id, "config/members")
    ref.set({
        "items": items,
        "uids": [m.get("uid") for m in items if m.get("uid")]
    })


def get_workspace_role(uid: str, ws_id: Optional[str]) -> str:
    access = get_access_config(uid)
    workspace_id = ws_id or access.workspace_id or "primary"
    members = get_workspace_members(uid, workspace_id)
    for member in members:
        if member.get("uid") == uid:
            return member.get("role") or access.role
    if members:
        return "Agent"
    return access.role


def get_workspaces(uid: str) -> List[Dict[str, Any]]:
    return get_root_list_cfg(uid, "workspaces", [w.model_dump() for w in default_workspaces()])


def set_workspaces(uid: str, items: List[Dict[str, Any]]):
    set_root_list_cfg(uid, "workspaces", items)


def ensure_firebase_configured():
    if ENFORCE_FIREBASE_AUTH and _firebase_auth is None:
        raise RuntimeError("Firebase Admin not configured while ENFORCE_FIREBASE_AUTH is true.")


ensure_firebase_configured()


def add_notification(uid: str, alert: Dict[str, Any]):
    base = get_list_cfg(uid, "notifications", [n.model_dump() for n in default_alerts()])
    payload = {**alert}
    payload.setdefault("ts", time.time())
    payload.setdefault("tags", [])
    payload.setdefault("link", None)
    payload.setdefault("action_id", None)
    payload.setdefault("decision_id", None)
    updated = upsert_alert(base, payload)
    set_list_cfg(uid, "notifications", updated)
    deliver_notification(uid, payload)


def severity_rank(level: str) -> int:
    return {"low": 1, "medium": 2, "high": 3}.get(level, 1)


def deliver_notification(uid: str, alert: Dict[str, Any]):
    try:
        routing = get_cfg(uid, "notificationRouting", NotificationRouting, NotificationRouting())
    except Exception:
        return

    if alert.get("status") != "new":
        return

    if severity_rank(alert.get("severity", "low")) < severity_rank(routing.min_severity):
        return

    subject = f"Main St AI Alert: {alert.get('title', 'Notification')}"
    body = alert.get("detail", "")
    link = alert.get("link")
    if link:
        body = f"{body}\n\nOpen: {link}"

    if routing.email_enabled and routing.email and SENDGRID_API_KEY:
        send_email(routing.email, subject, body)

    if routing.sms_enabled and routing.sms and TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER:
        send_sms(routing.sms, f"{alert.get('title', 'Alert')}: {alert.get('detail', '')}")


def send_email(to_email: str, subject: str, content: str):
    payload = {
        "personalizations": [{"to": [{"email": to_email}]}],
        "from": {"email": SENDGRID_FROM_EMAIL},
        "subject": subject,
        "content": [{"type": "text/plain", "value": content}],
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request("https://api.sendgrid.com/v3/mail/send", data=data, method="POST")
    req.add_header("Authorization", f"Bearer {SENDGRID_API_KEY}")
    req.add_header("Content-Type", "application/json")
    try:
        urllib.request.urlopen(req, timeout=8)
    except Exception as exc:
        print("SendGrid error:", repr(exc))


def send_sms(to_number: str, body: str):
    url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
    payload = urllib.parse.urlencode({
        "To": to_number,
        "From": TWILIO_FROM_NUMBER,
        "Body": body,
    }).encode("utf-8")
    req = urllib.request.Request(url, data=payload, method="POST")
    token = base64.b64encode(f"{TWILIO_ACCOUNT_SID}:{TWILIO_AUTH_TOKEN}".encode("utf-8")).decode("utf-8")
    req.add_header("Authorization", f"Basic {token}")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    try:
        urllib.request.urlopen(req, timeout=8)
    except Exception as exc:
        print("Twilio error:", repr(exc))


def get_contact(uid: str, contact_id: str) -> Optional[Contact]:
    if _firestore is None:
        u = get_ws_scope(uid)
        raw = u.get(f"contacts/{contact_id}")
        return Contact(**raw) if raw else None
    snap = fs_doc_uid(uid, f"contacts/{contact_id}").get()
    return Contact(**snap.to_dict()) if snap.exists else None


def upsert_contact(uid: str, c: Contact):
    if _firestore is None:
        u = get_ws_scope(uid)
        u[f"contacts/{c.id}"] = c.model_dump()
        return
    fs_doc_uid(uid, f"contacts/{c.id}").set(c.model_dump())


def upsert_thread(uid: str, t: Thread):
    if _firestore is None:
        u = get_ws_scope(uid)
        u[f"threads/{t.id}"] = t.model_dump()
        return
    fs_doc_uid(uid, f"threads/{t.id}").set(t.model_dump())


def save_message(uid: str, thread_id: str, msg: Message):
    if _firestore is None:
        u = get_ws_scope(uid)
        u.setdefault(f"threads/{thread_id}/messages", []).append(msg.model_dump())
        return
    fs_doc_uid(uid, f"threads/{thread_id}/messages/{msg.id}").set(msg.model_dump())


def audit(uid: str, payload: Dict[str, Any]):
    payload = {**payload, "ts": time.time()}
    add_doc(uid, "auditLog", payload)


def list_dev_docs(u: Dict[str, Any], prefix: str) -> List[Dict[str, Any]]:
    out = []
    for key, value in u.items():
        if key.startswith(prefix):
            out.append(value)
    return out


def list_action_queue_items(uid: str) -> List[Dict[str, Any]]:
    if _firestore is None:
        u = get_ws_scope(uid)
        return list_dev_docs(u, "actionQueue/")
    docs = fs_col_uid(uid, "actionQueue").stream()
    return [d.to_dict() for d in docs]


# ============================================================
# INTENT + RISK (cheap classifier)
# ============================================================
def classify_intent(text: str) -> Dict[str, Any]:
    t = text.lower()
    mentions_money = any(k in t for k in ["price", "cost", "how much", "$", "payment", "invoice", "refund", "chargeback"])
    booking = any(k in t for k in ["book", "schedule", "appointment", "availability"])
    hours = any(k in t for k in ["hours", "open", "close", "when are you open"])
    services = any(k in t for k in ["services", "do you", "offer", "can you"])
    legal = any(k in t for k in ["lawsuit", "attorney", "legal", "sue"])
    complaint = any(k in t for k in ["complaint", "angry", "bad service", "refund", "chargeback"])
    status = any(k in t for k in ["status", "update", "where is", "eta", "when will"])

    if legal:
        intent = "legal"
    elif complaint:
        intent = "complaint"
    elif booking:
        intent = "booking"
    elif mentions_money:
        intent = "pricing_basic"
    elif hours:
        intent = "hours"
    elif services:
        intent = "services"
    elif status:
        intent = "status"
    else:
        intent = "default"

    risk = 0.15
    if intent in ["legal"]:
        risk = 0.95
    elif intent in ["complaint"]:
        risk = 0.80
    elif mentions_money:
        risk = 0.55
    elif intent in ["booking"]:
        risk = 0.25
    return {"intent": intent, "risk": risk, "mentions_money": mentions_money}


# ============================================================
# AI GENERATION (HF + fallbacks)
# ============================================================
def hf_reply(bp: BusinessProfile, oc: OwnerCoverSettings, contact: Contact, inbound: str, mode: str) -> Optional[str]:
    if hf_client is None:
        return None

    system = f"""You are Main St AI - a front-office operator for a small business.

Business:
- Name: {bp.business_name}
- Services: {", ".join(bp.services) if bp.services else "N/A"}
- Service area: {bp.service_area or "N/A"}
- Hours: {bp.hours}
- Pricing notes: {bp.pricing_notes or "N/A"}
- Policies: {bp.policies or "N/A"}
Tone: {bp.tone}

Operating Rules:
- Be concise and professional.
- Ask at most ONE follow-up question.
- Never claim actions were performed unless you explicitly did them.
- For booking: ask for preferred day/time; reference hours.
- For pricing: give a general range using pricing notes; request one detail.
- For complaints/legal/refunds: respond calmly and escalate to owner; ask for details and best contact method.
Mode: {mode}

Customer context:
- Name: {contact.name or "Unknown"}
- Lead status: {contact.lead_status}
"""

    try:
        resp = hf_client.chat_completion(
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": inbound},
            ],
            max_tokens=320,
            temperature=0.4,
        )
        out = (resp.choices[0].message.content or "").strip()
        return out if out else None
    except Exception as e:
        print("HF error:", repr(e))
        return None


def fallback_reply(bp: BusinessProfile, oc: OwnerCoverSettings, intent: str) -> str:
    if intent in ["legal", "complaint"]:
        return oc.templates["escalation"]
    if intent == "booking":
        return f"We can get you scheduled. What day/time works best? Our hours are {bp.hours}."
    if intent == "hours":
        return f"Our hours are: {bp.hours}."
    if intent == "services":
        return f"We can help with that. We offer: {', '.join(bp.services) if bp.services else 'a range of services'}. What are you trying to accomplish?"
    if intent == "pricing_basic":
        pricing = bp.pricing_notes or "Pricing depends on scope - share one detail and I will estimate it."
        return f"Pricing info: {pricing}. What exactly do you need done?"
    if intent == "status":
        return "Thanks for checking in. Can you share your name/order/job info so I can look into the status?"
    return oc.templates["default"]


# ============================================================
# DECISION CORE (the brain)
# ============================================================
def decision_core(
    uid: str,
    inbound: InboundMessage,
    bp: BusinessProfile,
    oc: OwnerCoverSettings,
    contact: Contact,
    thread_id: str,
) -> Decision:
    cls = classify_intent(inbound.text)
    intent = cls["intent"]
    risk = float(cls["risk"])
    mentions_money = bool(cls["mentions_money"])

    draft = hf_reply(bp, oc, contact, inbound.text, mode="ownercover") or fallback_reply(bp, oc, intent)

    confidence = 0.82 if intent in ["hours", "services", "booking", "status", "pricing_basic"] else 0.62
    if intent in ["complaint"]:
        confidence = 0.72
    if intent in ["legal"]:
        confidence = 0.55

    if oc.mode == "off":
        decision = "queue"
        reason = "Owner Cover is OFF"
    elif oc.mode == "monitor":
        decision = "queue"
        reason = "Monitor mode"
    else:
        if confidence < oc.confidence_threshold:
            decision = "queue"
            reason = f"Low confidence ({confidence:.2f})"
        elif intent in oc.escalation_topics or intent in ["legal", "complaint"]:
            decision = "queue"
            reason = "Escalation topic"
        elif oc.money_requires_approval and mentions_money:
            decision = "queue"
            reason = "Money-related message requires approval"
        elif intent in oc.autosend_topics:
            decision = "send"
            reason = "Allowed autosend topic"
        else:
            decision = "queue"
            reason = "Not in autosend topics"

    d = Decision(
        id=str(uuid.uuid4()),
        uid=uid,
        contact_id=inbound.contact_id,
        thread_id=thread_id,
        channel=inbound.channel,
        intent=intent,
        risk=risk,
        confidence=confidence,
        decision=decision,
        reason=reason,
        draft=draft,
    )
    return d


# ============================================================
# APP
# ============================================================
app = FastAPI(title="Main St AI Platform", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "ok": True,
        "firestore": _firestore is not None,
        "firebase_admin_auth": _firebase_auth is not None,
        "hf_configured": bool(HF_TOKEN),
        "hf_model": HF_MODEL,
        "ts": time.time(),
    }


# ============================================================
# CONFIG
# ============================================================
@app.get("/config/businessProfile", response_model=BusinessProfile)
def get_bp(user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    return get_business_profile(user.uid)


@app.post("/config/businessProfile", response_model=BusinessProfile)
def set_bp(bp: BusinessProfile, user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    set_cfg(user.uid, "businessProfile", bp)
    audit(user.uid, {"type": "businessProfile_update", "bp": bp.model_dump()})
    return bp


@app.get("/profile", response_model=BusinessProfile)
def get_profile_alias(user: AuthedUser = Depends(get_user)):
    return get_bp(user)


@app.post("/profile", response_model=BusinessProfile)
def set_profile_alias(bp: BusinessProfile, user: AuthedUser = Depends(get_user)):
    return set_bp(bp, user)


@app.get("/ownercover/settings", response_model=OwnerCoverSettings)
def get_oc(user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    return get_owner_cover(user.uid)


@app.post("/ownercover/settings", response_model=OwnerCoverSettings)
def set_oc(oc: OwnerCoverSettings, user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    set_cfg(user.uid, "ownerCover", oc)
    audit(user.uid, {"type": "ownerCover_update", "oc": oc.model_dump()})
    if oc.mode != "autosend":
        add_notification(
            user.uid,
            {
                "id": "alert-ownercover-mode",
                "title": "Owner Cover not in Auto-Send",
                "detail": f"Owner Cover is {oc.mode}. Approvals are required.",
                "severity": "medium",
                "status": "new" if oc.mode == "off" else "acknowledged",
                "ts": time.time(),
                "tags": ["ownercover", "mode"],
            },
        )
    return oc


@app.get("/billing", response_model=BillingSettings)
def get_billing(user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner"])
    return get_cfg(user.uid, "billing", BillingSettings, BillingSettings())


@app.post("/billing", response_model=BillingSettings)
def set_billing(payload: BillingSettings, user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner"])
    set_cfg(user.uid, "billing", payload)
    audit(user.uid, {"type": "billing_update"})
    return payload


@app.get("/integrations")
def get_integrations(user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner", "Manager"])
    items = get_list_cfg(
        user.uid, "integrations", [i.model_dump() for i in default_integrations()]
    )
    return items


@app.post("/integrations")
def set_integrations(items: List[Integration], user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner", "Manager"])
    payload = [i.model_dump() for i in items]
    set_list_cfg(user.uid, "integrations", payload)
    audit(user.uid, {"type": "integrations_update", "count": len(payload)})
    return payload


@app.get("/team")
def get_team(user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner", "Manager"])
    items = get_list_cfg(user.uid, "team", [t.model_dump() for t in default_team()])
    return items


@app.post("/team")
def set_team(items: List[TeamMember], user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner", "Manager"])
    payload = [t.model_dump() for t in items]
    set_list_cfg(user.uid, "team", payload)
    audit(user.uid, {"type": "team_update", "count": len(payload)})
    return payload


@app.get("/access", response_model=AccessConfig)
def get_access(user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    access = get_root_cfg(user.uid, "access", AccessConfig, AccessConfig())
    access.effective_role = get_workspace_role(user.uid, access.workspace_id)
    return access


@app.post("/access", response_model=AccessConfig)
def set_access(payload: AccessConfig, user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner"])
    set_root_cfg(user.uid, "access", payload)
    audit(user.uid, {"type": "access_update", "role": payload.role})
    return payload


@app.get("/workspaces")
def list_workspaces(user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    access = get_access_config(user.uid)
    items = get_workspaces(user.uid)
    return {"current": access.workspace_id, "items": items}


@app.post("/workspaces")
def update_workspaces(items: List[Workspace], user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner", "Manager"])
    payload = [w.model_dump() for w in items]
    set_workspaces(user.uid, payload)
    access = get_access_config(user.uid)
    ids = {row.get("id") for row in payload}
    if access.workspace_id not in ids and payload:
        access.workspace_id = payload[0].get("id") or "primary"
        set_root_cfg(user.uid, "access", access)
    audit(user.uid, {"type": "workspaces_update", "count": len(payload)})
    return {"current": access.workspace_id, "items": payload}


@app.post("/workspaces/select")
def select_workspace(payload: WorkspaceSelect, user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner", "Manager"])
    access = get_access_config(user.uid)
    access.workspace_id = payload.id
    set_root_cfg(user.uid, "access", access)
    audit(user.uid, {"type": "workspace_selected", "workspace": payload.id})
    return {"current": access.workspace_id}


@app.get("/workspaces/members")
def list_workspace_members(workspace_id: Optional[str] = Query(default=None), user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner", "Manager"])
    ws_id = workspace_id or get_workspace_id(user.uid)
    return get_workspace_members(user.uid, ws_id)


@app.post("/workspaces/members")
def set_workspace_members_endpoint(
    items: List[WorkspaceMember],
    workspace_id: Optional[str] = Query(default=None),
    user: AuthedUser = Depends(get_user),
):
    ensure_user(user.uid)
    require_role(user, ["Owner", "Manager"])
    ws_id = workspace_id or get_workspace_id(user.uid)
    payload = [m.model_dump() for m in items]
    set_workspace_members(user.uid, ws_id, payload)
    audit(user.uid, {"type": "workspace_members_update", "count": len(payload), "workspace": ws_id})
    return payload


# ============================================================
# AUTOMATION STUDIO
# ============================================================
@app.get("/automation/rules")
def get_rules(user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner", "Manager"])
    return get_list_cfg(user.uid, "automationRules", [r.model_dump() for r in default_rules()])


@app.post("/automation/rules")
def set_rules(items: List[AutomationRule], user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner", "Manager"])
    payload = [r.model_dump() for r in items]
    set_list_cfg(user.uid, "automationRules", payload)
    audit(user.uid, {"type": "automation_rules_update", "count": len(payload)})
    return payload


@app.get("/automation/guardrails")
def get_guardrails(user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner", "Manager"])
    return get_list_cfg(user.uid, "guardrails", [g.model_dump() for g in default_guardrails()])


@app.post("/automation/guardrails")
def set_guardrails(items: List[Guardrail], user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner", "Manager"])
    payload = [g.model_dump() for g in items]
    set_list_cfg(user.uid, "guardrails", payload)
    audit(user.uid, {"type": "guardrails_update", "count": len(payload)})
    return payload


# ============================================================
# SECURITY + COMPLIANCE
# ============================================================
@app.get("/security/policies")
def get_security_policies(user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner"])
    return get_list_cfg(
        user.uid, "securityPolicies", [p.model_dump() for p in default_security_policies()]
    )


@app.post("/security/policies")
def set_security_policies(items: List[SecurityPolicy], user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner"])
    payload = [p.model_dump() for p in items]
    set_list_cfg(user.uid, "securityPolicies", payload)
    audit(user.uid, {"type": "security_policies_update", "count": len(payload)})
    return payload


@app.get("/security/logs")
def get_security_logs(user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner"])
    return [
        {"id": "log-1", "event": "Action queue accessed", "status": "resolved", "ts": "Today · 3:42 PM"},
        {"id": "log-2", "event": "Guardrail update", "status": "resolved", "ts": "Today · 2:58 PM"},
        {"id": "log-3", "event": "Login from new device", "status": "monitoring", "ts": "Yesterday · 8:11 PM"},
    ]


# ============================================================
# NOTIFICATIONS
# ============================================================
def upsert_alert(base: List[Dict[str, Any]], alert: Dict[str, Any]) -> List[Dict[str, Any]]:
    ids = {row.get("id") for row in base}
    if alert.get("id") in ids:
        return [
            {**row, **alert} if row.get("id") == alert.get("id") else row
            for row in base
        ]
    return [alert, *base]


@app.get("/notifications")
def get_notifications(user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    base = get_list_cfg(user.uid, "notifications", [n.model_dump() for n in default_alerts()])
    now = time.time()

    action_items = list_action_queue_items(user.uid)
    pending = [a for a in action_items if a.get("status") == "needs_approval"]
    if pending:
        oldest = min(a.get("created_ts", now) for a in pending)
        age_min = int((now - oldest) // 60)
        severity = "high" if age_min >= 30 else "medium"
        oldest_id = min(pending, key=lambda row: row.get("created_ts", now)).get("id")
        base = upsert_alert(
            base,
            {
                "id": "alert-queue",
                "title": "Approval queue backlog",
                "detail": f"{len(pending)} actions waiting. Oldest at {age_min} minutes.",
                "severity": severity,
                "status": "new",
                "ts": now,
                "tags": ["sla", "queue", "approval"],
                "link": "/action-queue",
                "action_id": oldest_id,
            },
        )

    oc = get_owner_cover(user.uid)
    if oc.mode != "autosend":
        base = upsert_alert(
            base,
            {
                "id": "alert-cover",
                "title": "Owner Cover not in Auto-Send",
                "detail": f"Owner Cover is {oc.mode}. Approvals are required.",
                "severity": "medium",
                "status": "acknowledged" if oc.mode == "monitor" else "new",
                "ts": now,
                "tags": ["ownercover", "mode"],
                "link": "/owner-cover",
            },
        )

    set_list_cfg(user.uid, "notifications", base)
    return base


@app.get("/notifications/routing", response_model=NotificationRouting)
def get_notification_routing(user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner", "Manager"])
    return get_cfg(user.uid, "notificationRouting", NotificationRouting, NotificationRouting())


@app.post("/notifications/routing", response_model=NotificationRouting)
def set_notification_routing(payload: NotificationRouting, user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner", "Manager"])
    set_cfg(user.uid, "notificationRouting", payload)
    audit(user.uid, {"type": "notification_routing_update"})
    return payload


class NotificationUpdate(BaseModel):
    id: str
    status: Literal["new", "acknowledged", "resolved"]


@app.post("/notifications")
def update_notifications(payload: NotificationUpdate, user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner", "Manager"])
    base = get_list_cfg(user.uid, "notifications", [n.model_dump() for n in default_alerts()])
    updated = []
    for row in base:
        if row.get("id") == payload.id:
            updated.append({**row, "status": payload.status, "ts": time.time()})
        else:
            updated.append(row)
    set_list_cfg(user.uid, "notifications", updated)
    audit(user.uid, {"type": "notification_update", "id": payload.id, "status": payload.status})
    return updated


# ============================================================
# CONTACTS
# ============================================================
@app.get("/contacts")
def list_contacts(user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    if _firestore is None:
        u = get_ws_scope(user.uid)
        return list_dev_docs(u, "contacts/")
    docs = fs_col_uid(user.uid, "contacts").stream()
    return [d.to_dict() for d in docs]


@app.post("/contacts")
def create_contact(payload: Contact, user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    if not payload.id:
        payload.id = str(uuid.uuid4())
    upsert_contact(user.uid, payload)
    return payload


# ============================================================
# THREADS + MESSAGES
# ============================================================
@app.get("/threads")
def list_threads(contact_id: Optional[str] = Query(default=None), user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    if _firestore is None:
        u = get_ws_scope(user.uid)
        threads = list_dev_docs(u, "threads/")
        if contact_id:
            threads = [t for t in threads if t.get("contact_id") == contact_id]
        return threads
    col = fs_col_uid(user.uid, "threads")
    if contact_id:
        docs = col.where("contact_id", "==", contact_id).stream()
    else:
        docs = col.stream()
    return [d.to_dict() for d in docs]


@app.get("/threads/{thread_id}/messages")
def list_messages(thread_id: str, user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    if _firestore is None:
        u = get_ws_scope(user.uid)
        return u.get(f"threads/{thread_id}/messages", [])
    docs = fs_col_uid(user.uid, f"threads/{thread_id}/messages").order_by("ts").stream()
    return [d.to_dict() for d in docs]


# ============================================================
# CHAT (owner chat)
# ============================================================
@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    bp = get_business_profile(user.uid)
    oc = get_owner_cover(user.uid)

    contact_id = req.contact_id or "owner"
    contact = get_contact(user.uid, contact_id) or Contact(id=contact_id, name="Owner")
    upsert_contact(user.uid, contact)

    thread_id = req.thread_id or f"thread-{contact_id}-webchat"
    thread = Thread(id=thread_id, contact_id=contact_id, channel="webchat")
    upsert_thread(user.uid, thread)

    msg_in = Message(id=str(uuid.uuid4()), role="user", text=req.message)
    save_message(user.uid, thread_id, msg_in)

    draft = hf_reply(bp, oc, contact, req.message, mode="chat") or fallback_reply(bp, oc, "default")
    msg_out = Message(id=str(uuid.uuid4()), role="assistant", text=draft)
    save_message(user.uid, thread_id, msg_out)

    inc_stat(user.uid, "chat_messages", 1)
    audit(user.uid, {"type": "chat", "thread_id": thread_id, "in": req.message, "out": draft})

    return ChatResponse(reply=draft, thread_id=thread_id)


@app.get("/chat/history")
def chat_history(conversationId: str = Query(default=""), user: AuthedUser = Depends(get_user)):
    thread_id = conversationId or "thread-owner-webchat"
    return list_messages(thread_id, user)


@app.post("/chat/manual")
def chat_manual(payload: Dict[str, Any], user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    thread_id = payload.get("conversationId") or payload.get("thread_id") or "thread-owner-webchat"
    response = str(payload.get("response") or "").strip()
    if not response:
        raise HTTPException(400, "response is required")
    msg_out = Message(id=str(uuid.uuid4()), role="assistant", text=response)
    save_message(user.uid, thread_id, msg_out)
    audit(user.uid, {"type": "chat_manual", "thread_id": thread_id, "out": response})
    return {"ok": True}


# ============================================================
# OWNER COVER INBOUND (customers/leads)
# ============================================================
@app.post("/ownercover/handleInbound")
def ownercover_handle_inbound(inbound: InboundMessage, user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    bp = get_business_profile(user.uid)
    oc = get_owner_cover(user.uid)

    contact = get_contact(user.uid, inbound.contact_id)
    if not contact:
        contact = Contact(id=inbound.contact_id, last_touch_ts=inbound.ts, last_inbound_ts=inbound.ts)
    contact.last_touch_ts = inbound.ts
    contact.last_inbound_ts = inbound.ts
    upsert_contact(user.uid, contact)

    thread_id = f"thread-{inbound.contact_id}-{inbound.channel}"
    thread = Thread(id=thread_id, contact_id=inbound.contact_id, channel=inbound.channel, last_message_ts=inbound.ts)
    upsert_thread(user.uid, thread)

    msg_in = Message(id=str(uuid.uuid4()), role="user", text=inbound.text, ts=inbound.ts)
    save_message(user.uid, thread_id, msg_in)

    d = decision_core(user.uid, inbound, bp, oc, contact, thread_id)

    write_doc(user.uid, f"decisions/{d.id}", d.model_dump())
    inc_stat(user.uid, "decisions_made", 1)

    if d.decision == "send":
        msg_out = Message(id=str(uuid.uuid4()), role="assistant", text=d.draft)
        save_message(user.uid, thread_id, msg_out)
        contact.last_outbound_ts = time.time()
        upsert_contact(user.uid, contact)

        action = ActionQueueItem(
            id=str(uuid.uuid4()),
            decision_id=d.id,
            status="sent",
            contact_id=d.contact_id,
            thread_id=d.thread_id,
            channel=d.channel,
            draft=d.draft,
            reason=d.reason,
            confidence=d.confidence,
            sent_ts=time.time(),
        )
        write_doc(user.uid, f"actionQueue/{action.id}", action.model_dump())
        inc_stat(user.uid, "autosent", 1)
        inc_stat(user.uid, "minutes_saved", oc.minutesPerAction or SAVED_MINUTES_PER_ACTION)

        audit(user.uid, {"type": "ownercover_sent", "decision": d.model_dump(), "action": action.model_dump()})
        return {"status": "sent", "thread_id": thread_id, "decision_id": d.id, "action_id": action.id}

    action = ActionQueueItem(
        id=str(uuid.uuid4()),
        decision_id=d.id,
        status="needs_approval",
        contact_id=d.contact_id,
        thread_id=d.thread_id,
        channel=d.channel,
        draft=d.draft,
        reason=d.reason,
        confidence=d.confidence,
    )
    write_doc(user.uid, f"actionQueue/{action.id}", action.model_dump())
    inc_stat(user.uid, "queued", 1)
    audit(user.uid, {"type": "ownercover_queued", "decision": d.model_dump(), "action": action.model_dump()})

    if d.intent in oc.escalation_topics or d.intent in ["legal", "complaint"]:
        add_notification(
            user.uid,
            {
                "id": f"alert-escalation-{d.id}",
                "title": "Escalation queued",
                "detail": f"{d.intent.title()} intent routed for approval.",
                "severity": "high",
                "status": "new",
                "ts": time.time(),
                "tags": ["escalation", f"intent:{d.intent}"],
                "link": "/action-queue",
                "action_id": action.id,
                "decision_id": d.id,
            },
        )
    elif "Low confidence" in d.reason:
        add_notification(
            user.uid,
            {
                "id": f"alert-confidence-{d.id}",
                "title": "Low confidence queued",
                "detail": f"Confidence {d.confidence:.2f} below threshold.",
                "severity": "medium",
                "status": "new",
                "ts": time.time(),
                "tags": ["confidence", "queue"],
                "link": "/action-queue",
                "action_id": action.id,
                "decision_id": d.id,
            },
        )

    return {"status": "queued", "thread_id": thread_id, "decision_id": d.id, "action_id": action.id, "reason": d.reason}


# ============================================================
# DECISIONS / ACTION QUEUE / AUDIT
# ============================================================
@app.get("/decisions")
def list_decisions(contact_id: Optional[str] = Query(default=None), user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    if _firestore is None:
        u = get_ws_scope(user.uid)
        rows = list_dev_docs(u, "decisions/")
        if contact_id:
            rows = [r for r in rows if r.get("contact_id") == contact_id]
        return rows
    docs = fs_col_uid(user.uid, "decisions").stream()
    rows = [d.to_dict() for d in docs]
    if contact_id:
        rows = [r for r in rows if r.get("contact_id") == contact_id]
    return rows


@app.get("/actionQueue")
def list_action_queue(user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner", "Manager"])
    if _firestore is None:
        u = get_ws_scope(user.uid)
        return list_dev_docs(u, "actionQueue/")
    docs = fs_col_uid(user.uid, "actionQueue").stream()
    return [d.to_dict() for d in docs]


@app.get("/auditLog")
def list_audit_log(user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    if _firestore is None:
        u = get_ws_scope(user.uid)
        return u.setdefault("_cols", {}).get("auditLog", [])
    docs = fs_col_uid(user.uid, "auditLog").stream()
    return [d.to_dict() for d in docs]


# ============================================================
# ACTION QUEUE CONTROL (approve + send)
# ============================================================
class ApproveRequest(BaseModel):
    action_id: str
    approve: bool


@app.post("/actionQueue/approve")
def approve_action(req: ApproveRequest, user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner", "Manager"])

    if _firestore is None:
        raw = get_ws_scope(user.uid).get(f"actionQueue/{req.action_id}")
        if not raw:
            raise HTTPException(404, "Action not found")
        action = ActionQueueItem(**raw)
    else:
        snap = fs_doc_uid(user.uid, f"actionQueue/{req.action_id}").get()
        if not snap.exists:
            raise HTTPException(404, "Action not found")
        action = ActionQueueItem(**snap.to_dict())

    if action.status != "needs_approval":
        return {"status": "noop", "message": f"Action already {action.status}"}

    if not req.approve:
        action.status = "blocked"
        write_doc(user.uid, f"actionQueue/{action.id}", action.model_dump())
        inc_stat(user.uid, "blocked", 1)
        audit(user.uid, {"type": "action_blocked", "action": action.model_dump()})
        return {"status": "blocked", "action_id": action.id}

    action.status = "approved"
    write_doc(user.uid, f"actionQueue/{action.id}", action.model_dump())

    msg_out = Message(id=str(uuid.uuid4()), role="assistant", text=action.draft, ts=time.time())
    save_message(user.uid, action.thread_id, msg_out)

    action.status = "sent"
    action.sent_ts = time.time()
    write_doc(user.uid, f"actionQueue/{action.id}", action.model_dump())

    inc_stat(user.uid, "approved_sent", 1)
    inc_stat(user.uid, "minutes_saved", oc.minutesPerAction or SAVED_MINUTES_PER_ACTION)
    audit(user.uid, {"type": "action_approved_sent", "action": action.model_dump()})
    return {"status": "sent", "action_id": action.id, "thread_id": action.thread_id}


# ============================================================
# OUTCOMES (learning loop)
# ============================================================
@app.post("/outcomes")
def record_outcome(outcome: Outcome, user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    oid = outcome.id or str(uuid.uuid4())
    payload = {**outcome.model_dump(), "id": oid}
    write_doc(user.uid, f"outcomes/{oid}", payload)
    inc_stat(user.uid, f"outcome_{outcome.type}", 1)
    audit(user.uid, {"type": "outcome_recorded", "outcome": payload})
    return {"ok": True, "id": oid}


@app.get("/outcomes")
def list_outcomes(contact_id: Optional[str] = Query(default=None), user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    if _firestore is None:
        u = get_ws_scope(user.uid)
        rows = list_dev_docs(u, "outcomes/")
        if contact_id:
            rows = [r for r in rows if r.get("contact_id") == contact_id]
        return rows
    docs = fs_col_uid(user.uid, "outcomes").stream()
    rows = [d.to_dict() for d in docs]
    if contact_id:
        rows = [r for r in rows if r.get("contact_id") == contact_id]
    return rows


# ============================================================
# DASHBOARD SUMMARY (proof of value)
# ============================================================
@app.get("/dashboard/summary")
def dashboard_summary(period: Optional[str] = Query(default=None, alias="range"), user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    if period == "week":
        total = 0
        now = time.time()
        for i in range(7):
            day = time.strftime("%Y%m%d", time.localtime(now - i * 86400))
            if _firestore is None:
                u = get_ws_scope(user.uid)
                stats = u.get(f"stats/daily_{day}", {})
            else:
                snap = fs_doc_uid(user.uid, f"stats/daily_{day}").get()
                stats = snap.to_dict() if snap.exists else {}
            total += int(stats.get("minutes_saved", 0))
        return {"range": "week", "minutes_saved": total}

    day = time.strftime("%Y%m%d")
    if _firestore is None:
        u = get_ws_scope(user.uid)
        stats = u.get(f"stats/daily_{day}", {})
    else:
        snap = fs_doc_uid(user.uid, f"stats/daily_{day}").get()
        stats = snap.to_dict() if snap.exists else {}
    return {"day": day, "stats": stats}


def get_workspace_stats(uid: str, ws_id: str, day: str) -> Dict[str, Any]:
    if _firestore is None:
        u = get_ws_scope_for(uid, ws_id)
        return u.get(f"stats/daily_{day}", {})
    snap = fs_doc_ws(uid, ws_id, f"stats/daily_{day}").get()
    return snap.to_dict() if snap.exists else {}


@app.get("/org/summary")
def org_summary(period: Optional[str] = Query(default=None, alias="range"), user: AuthedUser = Depends(get_user)):
    ensure_user(user.uid)
    require_role(user, ["Owner", "Manager"])
    workspaces = get_workspaces(user.uid)
    day = time.strftime("%Y%m%d")
    totals: Dict[str, int] = {}

    def add_stats(stats: Dict[str, Any]):
        for key, value in stats.items():
            if isinstance(value, (int, float)):
                totals[key] = int(totals.get(key, 0)) + int(value)

    if period == "week":
        week_totals: Dict[str, int] = {}
        now = time.time()
        for i in range(7):
            target_day = time.strftime("%Y%m%d", time.localtime(now - i * 86400))
            for ws in workspaces:
                stats = get_workspace_stats(user.uid, ws.get("id", "primary"), target_day)
                for key, value in stats.items():
                    if isinstance(value, (int, float)):
                        week_totals[key] = int(week_totals.get(key, 0)) + int(value)
        return {"range": "week", "totals": week_totals, "workspaces": workspaces}

    workspace_stats = []
    for ws in workspaces:
        ws_id = ws.get("id", "primary")
        stats = get_workspace_stats(user.uid, ws_id, day)
        workspace_stats.append({"id": ws_id, "name": ws.get("name", ws_id), "stats": stats})
        add_stats(stats)

    return {"day": day, "totals": totals, "workspaces": workspace_stats}


# ============================================================
# CRON / BACKGROUND INTELLIGENCE
# ============================================================
@app.post("/cron/run")
def cron_run(secret: str = Header(default=""), user: AuthedUser = Depends(get_user)):
    if secret != CRON_SECRET:
        raise HTTPException(403, "Bad cron secret")

    ensure_user(user.uid)
    bp = get_business_profile(user.uid)
    oc = get_owner_cover(user.uid)

    if not oc.follow_up_enabled:
        return {"ok": True, "message": "follow_up disabled"}

    now = time.time()
    follow_after = oc.follow_up_after_hours * 3600

    targets: List[Contact] = []
    if _firestore is None:
        u = get_ws_scope(user.uid)
        for k, v in u.items():
            if k.startswith("contacts/"):
                c = Contact(**v)
                if c.last_inbound_ts > 0 and (now - c.last_inbound_ts) > follow_after and c.last_outbound_ts < c.last_inbound_ts:
                    targets.append(c)
    else:
        from google.cloud.firestore import FieldFilter
        contacts_ref = fs_col_uid(user.uid, "contacts")
        cutoff = now - follow_after
        try:
            docs = (
                contacts_ref
                .where(filter=FieldFilter("last_inbound_ts", ">", 0))
                .where(filter=FieldFilter("last_inbound_ts", "<", cutoff))
                .stream()
            )
            for d in docs:
                c = Contact(**d.to_dict())
                if c.last_outbound_ts < c.last_inbound_ts:
                    targets.append(c)
        except Exception as e:
            return {"ok": True, "message": f"Firestore follow-up query failed: {repr(e)}"}

    sent = 0
    queued = 0
    for c in targets[:50]:
        inbound = InboundMessage(contact_id=c.id, channel="webchat", text=oc.templates["follow_up"], ts=now)
        thread_id = f"thread-{c.id}-webchat"
        thread = Thread(id=thread_id, contact_id=c.id, channel="webchat", last_message_ts=now)
        upsert_thread(user.uid, thread)

        d = Decision(
            id=str(uuid.uuid4()),
            uid=user.uid,
            contact_id=c.id,
            thread_id=thread_id,
            channel="webchat",
            intent="follow_up",
            risk=0.20,
            confidence=0.85,
            decision="send" if oc.mode == "autosend" else "queue",
            reason="Proactive follow-up",
            draft=oc.templates["follow_up"],
        )
        write_doc(user.uid, f"decisions/{d.id}", d.model_dump())

        if d.decision == "send":
            msg_out = Message(id=str(uuid.uuid4()), role="assistant", text=d.draft, ts=now)
            save_message(user.uid, thread_id, msg_out)
            c.last_outbound_ts = now
            upsert_contact(user.uid, c)
            sent += 1
            inc_stat(user.uid, "followups_sent", 1)
            inc_stat(user.uid, "minutes_saved", oc.minutesPerAction or SAVED_MINUTES_PER_ACTION)
        else:
            action = ActionQueueItem(
                id=str(uuid.uuid4()),
                decision_id=d.id,
                status="needs_approval",
                contact_id=c.id,
                thread_id=thread_id,
                channel="webchat",
                draft=d.draft,
                reason="Follow-up requires approval (mode not autosend)",
                confidence=0.85,
            )
            write_doc(user.uid, f"actionQueue/{action.id}", action.model_dump())
            queued += 1
            inc_stat(user.uid, "followups_queued", 1)

    audit(user.uid, {"type": "cron_run", "sent": sent, "queued": queued})
    return {"ok": True, "sent": sent, "queued": queued}
