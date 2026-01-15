module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/lib/devStore.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addAction",
    ()=>addAction,
    "addAudit",
    ()=>addAudit,
    "addContact",
    ()=>addContact,
    "addMessage",
    ()=>addMessage,
    "getConversation",
    ()=>getConversation,
    "getOwnerCoverSettings",
    ()=>getOwnerCoverSettings,
    "getProfile",
    ()=>getProfile,
    "listActions",
    ()=>listActions,
    "listAudit",
    ()=>listAudit,
    "listContacts",
    ()=>listContacts,
    "listMessages",
    ()=>listMessages,
    "removeContact",
    ()=>removeContact,
    "setOwnerCoverSettings",
    ()=>setOwnerCoverSettings,
    "setProfile",
    ()=>setProfile,
    "updateAction",
    ()=>updateAction,
    "updateContact",
    ()=>updateContact
]);
const devProfile = {
    name: "Main St AI",
    services: "Lead response, scheduling, and front-desk coverage",
    hours: "Mon–Fri, 9am–6pm",
    serviceArea: "Local service area",
    pricingNotes: "Pricing varies by service tier; ask clarifying questions.",
    policies: "No legal or refund decisions without owner approval.",
    tone: "Calm, professional, concise.",
    updatedAt: Date.now()
};
let contacts = [];
let conversations = [];
let actions = [];
let audit = [];
let ownerCoverSettings = {
    mode: "monitor",
    confidenceThreshold: 0.85,
    restrictedTopics: [
        "billing",
        "complaints",
        "legal"
    ],
    quietHoursStart: "20:00",
    quietHoursEnd: "07:00",
    quietHoursEnabled: false
};
function makeId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function getProfile() {
    return devProfile;
}
function setProfile(next) {
    Object.assign(devProfile, next, {
        updatedAt: Date.now()
    });
    return devProfile;
}
function listContacts() {
    return contacts;
}
function addContact(input) {
    const now = Date.now();
    const contact = {
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
function updateContact(id, input) {
    const idx = contacts.findIndex((c)=>c.id === id);
    if (idx === -1) return null;
    contacts[idx] = {
        ...contacts[idx],
        ...input,
        updatedAt: Date.now()
    };
    return contacts[idx];
}
function removeContact(id) {
    const before = contacts.length;
    contacts = contacts.filter((c)=>c.id !== id);
    return contacts.length < before;
}
function getConversation(id) {
    let convo = conversations.find((c)=>c.id === id);
    if (!convo) {
        convo = {
            id,
            uid: "dev",
            messages: [],
            updatedAt: Date.now()
        };
        conversations.push(convo);
    }
    return convo;
}
function addMessage(conversationId, role, content) {
    const convo = getConversation(conversationId);
    const message = {
        role,
        content,
        createdAt: Date.now()
    };
    convo.messages.push(message);
    convo.updatedAt = Date.now();
    return message;
}
function listMessages(conversationId) {
    return getConversation(conversationId).messages;
}
function addAction(entry) {
    const action = {
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
function listActions() {
    return actions;
}
function updateAction(id, status) {
    const idx = actions.findIndex((a)=>a.id === id);
    if (idx === -1) return null;
    actions[idx] = {
        ...actions[idx],
        status
    };
    return actions[idx];
}
function addAudit(event) {
    const entry = {
        ...event,
        id: makeId(),
        createdAt: Date.now()
    };
    audit.unshift(entry);
    return entry;
}
function listAudit() {
    return audit;
}
function getOwnerCoverSettings() {
    return ownerCoverSettings;
}
function setOwnerCoverSettings(next) {
    ownerCoverSettings = {
        ...ownerCoverSettings,
        ...next
    };
    return ownerCoverSettings;
}
}),
"[project]/app/api/mock/profile/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$devStore$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/devStore.ts [app-route] (ecmascript)");
;
;
async function GET() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$devStore$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getProfile"])());
}
async function POST(request) {
    const body = await request.json().catch(()=>({}));
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$devStore$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setProfile"])(body));
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__8400a409._.js.map