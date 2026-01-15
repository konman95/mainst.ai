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
"[project]/app/api/mock/contacts/store.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addContact",
    ()=>addContact,
    "getContacts",
    ()=>getContacts,
    "removeContact",
    ()=>removeContact,
    "updateContact",
    ()=>updateContact
]);
const seed = [
    {
        id: "1",
        name: "Alice Johnson",
        email: "alice@example.com"
    },
    {
        id: "2",
        name: "Bob Lee",
        email: "bob@example.com"
    }
];
let store = null;
function ensureStore() {
    if (!store) store = seed.map((contact)=>({
            ...contact
        }));
    return store;
}
function getContacts() {
    return ensureStore();
}
function addContact(body) {
    const contact = {
        id: String(Date.now()),
        ...body
    };
    ensureStore().push(contact);
    return contact;
}
function updateContact(id, body) {
    const data = ensureStore();
    const idx = data.findIndex((contact)=>contact.id === id);
    if (idx === -1) return null;
    data[idx] = {
        ...data[idx],
        ...body
    };
    return data[idx];
}
function removeContact(id) {
    const data = ensureStore();
    const idx = data.findIndex((contact)=>contact.id === id);
    if (idx === -1) return false;
    data.splice(idx, 1);
    return true;
}
}),
"[project]/app/api/mock/contacts/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$mock$2f$contacts$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/api/mock/contacts/store.ts [app-route] (ecmascript)");
;
;
async function GET() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json((0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$mock$2f$contacts$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getContacts"])());
}
async function POST(request) {
    const body = await request.json().catch(()=>({}));
    const contact = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$api$2f$mock$2f$contacts$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addContact"])(body);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(contact, {
        status: 201
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__2f3a7b2b._.js.map