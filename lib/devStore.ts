type BusinessProfile = {
  name: string;
  services: string;
  hours: string;
  serviceArea: string;
  pricingNotes: string;
  policies: string;
  tone: string;
  updatedAt: number;
};

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  tags: string[];
  status: string;
  lastContact: number | null;
  createdAt: number;
  updatedAt: number;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

type Conversation = {
  id: string;
  uid: string;
  messages: Message[];
  updatedAt: number;
};

type Action = {
  id: string;
  uid: string;
  status: "queued" | "sent" | "approved" | "denied";
  action: string;
  confidence: number;
  restricted: boolean;
  response: string;
  reason: string;
  message: string;
  createdAt: number;
};

type AuditEvent = {
  id: string;
  uid: string;
  type: "chat" | "owner-cover";
  message: string;
  response: string;
  intent?: string;
  confidence?: number;
  decision?: string;
  createdAt: number;
};

type OwnerCoverSettings = {
  mode: "off" | "monitor" | "auto";
  confidenceThreshold: number;
  restrictedTopics: string[];
  quietHoursStart: string;
  quietHoursEnd: string;
  quietHoursEnabled: boolean;
};


const devProfile: BusinessProfile = {
  name: "Main St AI",
  services: "Lead response, scheduling, and front-desk coverage",
  hours: "Mon–Fri, 9am–6pm",
  serviceArea: "Local service area",
  pricingNotes: "Pricing varies by service tier; ask clarifying questions.",
  policies: "No legal or refund decisions without owner approval.",
  tone: "Calm, professional, concise.",
  updatedAt: Date.now()
};

let contacts: Contact[] = [];
let conversations: Conversation[] = [];
let actions: Action[] = [];
let audit: AuditEvent[] = [];
let ownerCoverSettings: OwnerCoverSettings = {
  mode: "monitor",
  confidenceThreshold: 0.85,
  restrictedTopics: ["billing", "complaints", "legal"],
  quietHoursStart: "20:00",
  quietHoursEnd: "07:00",
  quietHoursEnabled: false
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getProfile() {
  return devProfile;
}

export function setProfile(next: Partial<BusinessProfile>) {
  Object.assign(devProfile, next, { updatedAt: Date.now() });
  return devProfile;
}

export function listContacts() {
  return contacts;
}

export function addContact(input: Partial<Contact>) {
  const now = Date.now();
  const contact: Contact = {
    id: makeId(),
    name: String(input.name || ""),
    email: String(input.email || ""),
    phone: String(input.phone || ""),
    notes: String(input.notes || ""),
    tags: Array.isArray(input.tags) ? input.tags : [],
    status: String(input.status || "new"),
    lastContact: null,
    createdAt: now,
    updatedAt: now
  };
  contacts.unshift(contact);
  return contact;
}

export function updateContact(id: string, input: Partial<Contact>) {
  const idx = contacts.findIndex(c => c.id === id);
  if (idx === -1) return null;
  contacts[idx] = {
    ...contacts[idx],
    ...input,
    updatedAt: Date.now()
  };
  return contacts[idx];
}

export function removeContact(id: string) {
  const before = contacts.length;
  contacts = contacts.filter(c => c.id !== id);
  return contacts.length < before;
}

export function getConversation(id: string) {
  let convo = conversations.find(c => c.id === id);
  if (!convo) {
    convo = { id, uid: "dev", messages: [], updatedAt: Date.now() };
    conversations.push(convo);
  }
  return convo;
}

export function addMessage(conversationId: string, role: Message["role"], content: string) {
  const convo = getConversation(conversationId);
  const message = { role, content, createdAt: Date.now() };
  convo.messages.push(message);
  convo.updatedAt = Date.now();
  return message;
}

export function listMessages(conversationId: string) {
  return getConversation(conversationId).messages;
}

export function addAction(entry: Omit<Action, "id" | "createdAt" | "status"> & { status?: Action["status"] }) {
  const action: Action = {
    id: makeId(),
    uid: "dev",
    status: entry.status || "queued",
    action: entry.action,
    confidence: entry.confidence,
    restricted: entry.restricted,
    response: entry.response,
    reason: entry.reason,
    message: entry.message,
    createdAt: Date.now()
  };
  actions.unshift(action);
  return action;
}

export function listActions() {
  return actions;
}

export function updateAction(id: string, status: Action["status"]) {
  const idx = actions.findIndex(a => a.id === id);
  if (idx === -1) return null;
  actions[idx] = { ...actions[idx], status };
  return actions[idx];
}

export function addAudit(event: Omit<AuditEvent, "id" | "createdAt">) {
  const entry: AuditEvent = { ...event, id: makeId(), createdAt: Date.now() };
  audit.unshift(entry);
  return entry;
}

export function listAudit() {
  return audit;
}

export function getOwnerCoverSettings() {
  return ownerCoverSettings;
}

export function setOwnerCoverSettings(next: Partial<OwnerCoverSettings>) {
  ownerCoverSettings = { ...ownerCoverSettings, ...next };
  return ownerCoverSettings;
}
