(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/auth.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clearAuth",
    ()=>clearAuth,
    "getAuth",
    ()=>getAuth,
    "setAuth",
    ()=>setAuth
]);
const KEY = "mainstai_auth";
function setAuth(a) {
    localStorage.setItem(KEY, JSON.stringify(a));
}
function getAuth() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        localStorage.removeItem(KEY);
        return null;
    }
}
function clearAuth() {
    localStorage.removeItem(KEY);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "api",
    ()=>api
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-client] (ecmascript)");
;
const BASE = ("TURBOPACK compile-time value", "https://klg2lvsn-8000.use.devtunnels.ms") || (("TURBOPACK compile-time truthy", 1) ? "/api" : "TURBOPACK unreachable");
const USE_MOCK = (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_USE_MOCK || "false") === "true";
function isMockEnabled() {
    if ("TURBOPACK compile-time truthy", 1) {
        const runtime = localStorage.getItem("USE_MOCK");
        if (runtime === "true") return true;
        if (runtime === "false") return false;
    }
    return USE_MOCK;
}
const MOCK_PATHS = [
    "/health",
    "/contacts",
    "/chat",
    "/ownercover",
    "/profile"
];
function buildUrl(path) {
    if (isMockEnabled() && MOCK_PATHS.some((p)=>path === p || path.startsWith(`${p}/`))) {
        return `/api/mock${path}`;
    }
    return BASE + path;
}
async function req(path, body, method) {
    const auth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuth"])();
    const devFallback = ("TURBOPACK compile-time value", "object") !== "undefined" && !auth?.token ? "dev-guest" : undefined;
    let res;
    try {
        res = await fetch(buildUrl(path), {
            method: method || (body ? "POST" : "GET"),
            headers: {
                "Content-Type": "application/json",
                ...auth?.token ? {
                    Authorization: `Bearer ${auth.token}`
                } : devFallback ? {
                    Authorization: `Bearer ${devFallback}`
                } : {}
            },
            body: body ? JSON.stringify(body) : undefined
        });
    } catch (e) {
        throw new Error("Network error: " + (e?.message || String(e)));
    }
    if (!res.ok) {
        const text = await res.text().catch(()=>`HTTP ${res.status}`);
        throw new Error(text);
    }
    try {
        return await res.json();
    } catch (e) {
        return null;
    }
}
const api = {
    health: ()=>req("/health"),
    chat: (b)=>req("/chat", b),
    chatManual: (b)=>req("/chat/manual", b),
    chatHistory: (conversationId)=>req(`/chat/history?conversationId=${encodeURIComponent(conversationId)}`),
    ownerGet: ()=>req("/ownercover/settings"),
    ownerSet: (b)=>req("/ownercover/settings", b),
    ownerInbound: (b)=>req("/ownercover/handleInbound", b),
    profileGet: ()=>req("/profile"),
    profileSet: (b)=>req("/profile", b, "POST"),
    billingGet: ()=>req("/billing"),
    billingSet: (b)=>req("/billing", b, "POST"),
    integrationsGet: ()=>req("/integrations"),
    integrationsSet: (b)=>req("/integrations", b, "POST"),
    teamGet: ()=>req("/team"),
    teamSet: (b)=>req("/team", b, "POST"),
    accessGet: ()=>req("/access"),
    accessSet: (b)=>req("/access", b, "POST"),
    workspaces: ()=>req("/workspaces"),
    workspacesSet: (b)=>req("/workspaces", b, "POST"),
    workspacesSelect: (id)=>req("/workspaces/select", {
            id
        }, "POST"),
    workspacesMembers: (workspaceId)=>req(workspaceId ? `/workspaces/members?workspace_id=${encodeURIComponent(workspaceId)}` : "/workspaces/members"),
    workspacesMembersSet: (items, workspaceId)=>req(workspaceId ? `/workspaces/members?workspace_id=${encodeURIComponent(workspaceId)}` : "/workspaces/members", items, "POST"),
    automationRules: ()=>req("/automation/rules"),
    automationRulesSet: (b)=>req("/automation/rules", b, "POST"),
    automationGuardrails: ()=>req("/automation/guardrails"),
    automationGuardrailsSet: (b)=>req("/automation/guardrails", b, "POST"),
    securityPolicies: ()=>req("/security/policies"),
    securityPoliciesSet: (b)=>req("/security/policies", b, "POST"),
    securityLogs: ()=>req("/security/logs"),
    notifications: ()=>req("/notifications"),
    notificationsUpdate: (b)=>req("/notifications", b, "POST"),
    notificationsRouting: ()=>req("/notifications/routing"),
    notificationsRoutingSet: (b)=>req("/notifications/routing", b, "POST"),
    contacts: ()=>req("/contacts"),
    createContact: (b)=>req("/contacts", b, "POST"),
    updateContact: (id, b)=>req(`/contacts/${id}`, b, "PUT"),
    deleteContact: (id)=>req(`/contacts/${id}`, undefined, "DELETE"),
    decisions: (contactId)=>req(contactId ? `/decisions?contact_id=${encodeURIComponent(contactId)}` : "/decisions"),
    actionQueue: ()=>req("/actionQueue"),
    approveAction: (actionId, approve)=>req("/actionQueue/approve", {
            action_id: actionId,
            approve
        }, "POST"),
    audit: ()=>req("/auditLog"),
    outcomes: (contactId)=>req(contactId ? `/outcomes?contact_id=${encodeURIComponent(contactId)}` : "/outcomes"),
    createOutcome: (b)=>req("/outcomes", b, "POST"),
    threads: (contactId)=>req(contactId ? `/threads?contact_id=${encodeURIComponent(contactId)}` : "/threads"),
    threadMessages: (threadId)=>req(`/threads/${encodeURIComponent(threadId)}/messages`),
    dashboardSummary: ()=>req("/dashboard/summary"),
    weeklySummary: ()=>req("/dashboard/summary?range=week"),
    orgSummary: ()=>req("/org/summary"),
    orgWeeklySummary: ()=>req("/org/summary?range=week")
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/Nav.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Nav
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
function Nav() {
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const [auth, setAuth] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [workspaceName, setWorkspaceName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("Main St AI Business");
    const [planName, setPlanName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("Operator Pro");
    const [menuOpen, setMenuOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [role, setRole] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("Owner");
    const [workspaceId, setWorkspaceId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("primary");
    const [workspaces, setWorkspaces] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const menuRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const triggerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Read auth only on the client after mount to avoid SSR / hydration mismatch
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Nav.useEffect": ()=>{
            setAuth((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuth"])());
        }
    }["Nav.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Nav.useEffect": ()=>{
            let active = true;
            const load = {
                "Nav.useEffect.load": async ()=>{
                    try {
                        const access = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].accessGet();
                        if (active && (access?.effective_role || access?.role)) {
                            setRole(access.effective_role || access.role);
                        }
                        if (active && access?.workspace_id) setWorkspaceId(access.workspace_id);
                    } catch  {
                    // ignore access load errors in nav
                    }
                    try {
                        const workspaces = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].workspaces();
                        if (active) {
                            setWorkspaces(workspaces?.items || []);
                            const match = (workspaces?.items || []).find({
                                "Nav.useEffect.load.match": (item)=>item.id === (workspaces?.current || workspaceId)
                            }["Nav.useEffect.load.match"]);
                            if (match?.name) setWorkspaceName(match.name);
                        }
                    } catch  {
                    // ignore workspace load errors in nav
                    }
                    try {
                        const billing = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].billingGet();
                        if (billing?.plan) {
                            const label = billing.plan === "core" ? "Coverage Core" : billing.plan === "enterprise" ? "Enterprise" : "Operator Pro";
                            if (active) setPlanName(label);
                        }
                    } catch  {
                    // ignore billing load errors in nav
                    }
                }
            }["Nav.useEffect.load"];
            load();
            return ({
                "Nav.useEffect": ()=>{
                    active = false;
                }
            })["Nav.useEffect"];
        }
    }["Nav.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Nav.useEffect": ()=>{
            const handleKey = {
                "Nav.useEffect.handleKey": (event)=>{
                    if (event.key === "Escape") setMenuOpen(false);
                }
            }["Nav.useEffect.handleKey"];
            const handleClick = {
                "Nav.useEffect.handleClick": (event)=>{
                    if (!menuOpen) return;
                    const target = event.target;
                    const panel = menuRef.current;
                    const trigger = triggerRef.current;
                    if (!panel || !target) return;
                    if (panel.contains(target) || trigger?.contains(target)) return;
                    setMenuOpen(false);
                }
            }["Nav.useEffect.handleClick"];
            window.addEventListener("keydown", handleKey);
            window.addEventListener("mousedown", handleClick);
            return ({
                "Nav.useEffect": ()=>{
                    window.removeEventListener("keydown", handleKey);
                    window.removeEventListener("mousedown", handleClick);
                }
            })["Nav.useEffect"];
        }
    }["Nav.useEffect"], [
        menuOpen
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Nav.useEffect": ()=>{
            if (!menuOpen) return;
            const panel = menuRef.current;
            if (!panel) return;
            const focusables = panel.querySelectorAll("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])");
            if (focusables.length > 0) focusables[0].focus();
            const handleTab = {
                "Nav.useEffect.handleTab": (event)=>{
                    if (event.key !== "Tab") return;
                    const list = Array.from(panel.querySelectorAll("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"));
                    if (list.length === 0) return;
                    const first = list[0];
                    const last = list[list.length - 1];
                    if (event.shiftKey && document.activeElement === first) {
                        event.preventDefault();
                        last.focus();
                    } else if (!event.shiftKey && document.activeElement === last) {
                        event.preventDefault();
                        first.focus();
                    }
                }
            }["Nav.useEffect.handleTab"];
            document.addEventListener("keydown", handleTab);
            return ({
                "Nav.useEffect": ()=>document.removeEventListener("keydown", handleTab)
            })["Nav.useEffect"];
        }
    }["Nav.useEffect"], [
        menuOpen
    ]);
    const canManageCoverage = role !== "Agent";
    const canSeeAutomation = role !== "Agent";
    const canSeeSecurity = role === "Owner";
    const canSeeSettings = role !== "Agent";
    const canSeeOrg = role !== "Agent";
    const canSwitchWorkspace = role !== "Agent";
    async function selectWorkspace(id) {
        setWorkspaceId(id);
        setMenuOpen(false);
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].workspacesSelect(id);
        } catch  {
        // ignore selection errors
        }
        if ("TURBOPACK compile-time truthy", 1) {
            window.setTimeout(()=>window.location.reload(), 400);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "nav",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "nav-inner",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "nav-brand",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "pill",
                                children: "Main St AI"
                            }, void 0, false, {
                                fileName: "[project]/components/Nav.tsx",
                                lineNumber: 141,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "nav-meta",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: workspaceName
                                    }, void 0, false, {
                                        fileName: "[project]/components/Nav.tsx",
                                        lineNumber: 143,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "muted",
                                        children: [
                                            "Plan: ",
                                            planName
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/Nav.tsx",
                                        lineNumber: 144,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/Nav.tsx",
                                lineNumber: 142,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/Nav.tsx",
                        lineNumber: 140,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "nav-actions",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "btn ghost menu-trigger",
                            onClick: ()=>setMenuOpen((v)=>!v),
                            "aria-expanded": menuOpen,
                            "aria-controls": "mainstai-menu",
                            "aria-label": "Open navigation menu",
                            "aria-haspopup": "menu",
                            ref: triggerRef,
                            children: menuOpen ? "Close" : "Menu"
                        }, void 0, false, {
                            fileName: "[project]/components/Nav.tsx",
                            lineNumber: 148,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/Nav.tsx",
                        lineNumber: 147,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/Nav.tsx",
                lineNumber: 139,
                columnNumber: 7
            }, this),
            menuOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "menu-backdrop",
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/components/Nav.tsx",
                lineNumber: 162,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                id: "mainstai-menu",
                className: `menu-panel ${menuOpen ? "open" : ""}`,
                ref: menuRef,
                role: "menu",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "menu-section",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "menu-title",
                                children: "Quick actions"
                            }, void 0, false, {
                                fileName: "[project]/components/Nav.tsx",
                                lineNumber: 171,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "menu-actions",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        className: "menu-action",
                                        href: "/chat",
                                        onClick: ()=>setMenuOpen(false),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "menu-icon chat",
                                                "aria-hidden": "true"
                                            }, void 0, false, {
                                                fileName: "[project]/components/Nav.tsx",
                                                lineNumber: 174,
                                                columnNumber: 15
                                            }, this),
                                            "Start chat"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/Nav.tsx",
                                        lineNumber: 173,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        className: "menu-action",
                                        href: "/contacts",
                                        onClick: ()=>setMenuOpen(false),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "menu-icon contacts",
                                                "aria-hidden": "true"
                                            }, void 0, false, {
                                                fileName: "[project]/components/Nav.tsx",
                                                lineNumber: 178,
                                                columnNumber: 15
                                            }, this),
                                            "New contact"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/Nav.tsx",
                                        lineNumber: 177,
                                        columnNumber: 13
                                    }, this),
                                    canManageCoverage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        className: "menu-action",
                                        href: "/owner-cover#simulate-inbound",
                                        onClick: ()=>setMenuOpen(false),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "menu-icon simulate",
                                                "aria-hidden": "true"
                                            }, void 0, false, {
                                                fileName: "[project]/components/Nav.tsx",
                                                lineNumber: 183,
                                                columnNumber: 17
                                            }, this),
                                            "Simulate inbound"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/Nav.tsx",
                                        lineNumber: 182,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        className: "menu-action",
                                        href: "/notifications",
                                        onClick: ()=>setMenuOpen(false),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "menu-icon alerts",
                                                "aria-hidden": "true"
                                            }, void 0, false, {
                                                fileName: "[project]/components/Nav.tsx",
                                                lineNumber: 188,
                                                columnNumber: 15
                                            }, this),
                                            "View alerts"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/Nav.tsx",
                                        lineNumber: 187,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/Nav.tsx",
                                lineNumber: 172,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/Nav.tsx",
                        lineNumber: 170,
                        columnNumber: 9
                    }, this),
                    canSwitchWorkspace && workspaces.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "menu-section",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "menu-title",
                                children: "Workspace switcher"
                            }, void 0, false, {
                                fileName: "[project]/components/Nav.tsx",
                                lineNumber: 195,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "menu-actions",
                                children: workspaces.map((workspace)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: `menu-action ${workspaceId === workspace.id ? "active" : ""}`,
                                        onClick: ()=>selectWorkspace(workspace.id),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "menu-icon",
                                                "aria-hidden": "true"
                                            }, void 0, false, {
                                                fileName: "[project]/components/Nav.tsx",
                                                lineNumber: 203,
                                                columnNumber: 19
                                            }, this),
                                            workspace.name
                                        ]
                                    }, workspace.id, true, {
                                        fileName: "[project]/components/Nav.tsx",
                                        lineNumber: 198,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/components/Nav.tsx",
                                lineNumber: 196,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/Nav.tsx",
                        lineNumber: 194,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "menu-title",
                        children: "Workspace"
                    }, void 0, false, {
                        fileName: "[project]/components/Nav.tsx",
                        lineNumber: 210,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "menu-grid",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                className: `nav-link ${pathname === "/dashboard" ? "active" : ""}`,
                                href: "/dashboard",
                                onClick: ()=>setMenuOpen(false),
                                children: "Dashboard"
                            }, void 0, false, {
                                fileName: "[project]/components/Nav.tsx",
                                lineNumber: 212,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                className: `nav-link ${pathname === "/profile" ? "active" : ""}`,
                                href: "/profile",
                                onClick: ()=>setMenuOpen(false),
                                children: "Profile"
                            }, void 0, false, {
                                fileName: "[project]/components/Nav.tsx",
                                lineNumber: 215,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                className: `nav-link ${pathname === "/contacts" ? "active" : ""}`,
                                href: "/contacts",
                                onClick: ()=>setMenuOpen(false),
                                children: "Contacts"
                            }, void 0, false, {
                                fileName: "[project]/components/Nav.tsx",
                                lineNumber: 218,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                className: `nav-link ${pathname === "/chat" ? "active" : ""}`,
                                href: "/chat",
                                onClick: ()=>setMenuOpen(false),
                                children: "Chat"
                            }, void 0, false, {
                                fileName: "[project]/components/Nav.tsx",
                                lineNumber: 221,
                                columnNumber: 11
                            }, this),
                            canManageCoverage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                className: `nav-link ${pathname === "/owner-cover" ? "active" : ""}`,
                                href: "/owner-cover",
                                onClick: ()=>setMenuOpen(false),
                                children: "Owner Cover"
                            }, void 0, false, {
                                fileName: "[project]/components/Nav.tsx",
                                lineNumber: 225,
                                columnNumber: 13
                            }, this),
                            canSeeAutomation && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                className: `nav-link ${pathname === "/automation" ? "active" : ""}`,
                                href: "/automation",
                                onClick: ()=>setMenuOpen(false),
                                children: "Automation"
                            }, void 0, false, {
                                fileName: "[project]/components/Nav.tsx",
                                lineNumber: 230,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                className: `nav-link ${pathname === "/decision-feed" ? "active" : ""}`,
                                href: "/decision-feed",
                                onClick: ()=>setMenuOpen(false),
                                children: "Decisions"
                            }, void 0, false, {
                                fileName: "[project]/components/Nav.tsx",
                                lineNumber: 234,
                                columnNumber: 11
                            }, this),
                            canSeeOrg && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                className: `nav-link ${pathname === "/org" ? "active" : ""}`,
                                href: "/org",
                                onClick: ()=>setMenuOpen(false),
                                children: "Org Analytics"
                            }, void 0, false, {
                                fileName: "[project]/components/Nav.tsx",
                                lineNumber: 238,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                className: `nav-link ${pathname === "/action-queue" ? "active" : ""}`,
                                href: "/action-queue",
                                onClick: ()=>setMenuOpen(false),
                                children: "Action Queue"
                            }, void 0, false, {
                                fileName: "[project]/components/Nav.tsx",
                                lineNumber: 242,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                className: `nav-link ${pathname === "/notifications" ? "active" : ""}`,
                                href: "/notifications",
                                onClick: ()=>setMenuOpen(false),
                                children: "Notifications"
                            }, void 0, false, {
                                fileName: "[project]/components/Nav.tsx",
                                lineNumber: 245,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                className: `nav-link ${pathname === "/memory" ? "active" : ""}`,
                                href: "/memory",
                                onClick: ()=>setMenuOpen(false),
                                children: "Memory"
                            }, void 0, false, {
                                fileName: "[project]/components/Nav.tsx",
                                lineNumber: 248,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                className: `nav-link ${pathname === "/outcomes" ? "active" : ""}`,
                                href: "/outcomes",
                                onClick: ()=>setMenuOpen(false),
                                children: "Outcomes"
                            }, void 0, false, {
                                fileName: "[project]/components/Nav.tsx",
                                lineNumber: 251,
                                columnNumber: 11
                            }, this),
                            canSeeSettings && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                className: `nav-link ${pathname === "/settings" ? "active" : ""}`,
                                href: "/settings",
                                onClick: ()=>setMenuOpen(false),
                                children: "Settings"
                            }, void 0, false, {
                                fileName: "[project]/components/Nav.tsx",
                                lineNumber: 255,
                                columnNumber: 13
                            }, this),
                            canSeeSecurity && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                className: `nav-link ${pathname === "/security" ? "active" : ""}`,
                                href: "/security",
                                onClick: ()=>setMenuOpen(false),
                                children: "Security"
                            }, void 0, false, {
                                fileName: "[project]/components/Nav.tsx",
                                lineNumber: 260,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                className: `nav-link ${pathname === "/how-it-works" ? "active" : ""}`,
                                href: "/how-it-works",
                                onClick: ()=>setMenuOpen(false),
                                children: "How It Works"
                            }, void 0, false, {
                                fileName: "[project]/components/Nav.tsx",
                                lineNumber: 264,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/Nav.tsx",
                        lineNumber: 211,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "menu-footer",
                        children: auth ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "btn ghost",
                            onClick: ()=>{
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clearAuth"])();
                                location.href = "/login";
                            },
                            children: "Logout"
                        }, void 0, false, {
                            fileName: "[project]/components/Nav.tsx",
                            lineNumber: 270,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            className: `nav-link ${pathname === "/login" ? "active" : ""}`,
                            href: "/login",
                            onClick: ()=>setMenuOpen(false),
                            children: "Login"
                        }, void 0, false, {
                            fileName: "[project]/components/Nav.tsx",
                            lineNumber: 280,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/Nav.tsx",
                        lineNumber: 268,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/Nav.tsx",
                lineNumber: 164,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/Nav.tsx",
        lineNumber: 138,
        columnNumber: 5
    }, this);
}
_s(Nav, "47+mEUy07YGqXPdOVobvQUehbq8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = Nav;
var _c;
__turbopack_context__.k.register(_c, "Nav");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/DevToolbar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DevToolbar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function DevToolbar() {
    _s();
    const [mock, setMock] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DevToolbar.useEffect": ()=>{
            const v = localStorage.getItem("USE_MOCK");
            if (v === null) setMock(null);
            else setMock(v === "true");
        }
    }["DevToolbar.useEffect"], []);
    function toggle() {
        const next = !(mock === true);
        localStorage.setItem("USE_MOCK", next ? "true" : "false");
        setMock(next);
    // don't force reload; let components pick up change on next action
    // but advise user to reload for deterministic behavior
    }
    function clear() {
        localStorage.removeItem("USE_MOCK");
        setMock(null);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "devbar",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "devbar-inner",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                    children: "Dev"
                }, void 0, false, {
                    fileName: "[project]/components/DevToolbar.tsx",
                    lineNumber: 29,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    className: "btn ghost",
                    onClick: toggle,
                    children: mock === null ? "Mock: unset" : mock ? "Mock: ON" : "Mock: OFF"
                }, void 0, false, {
                    fileName: "[project]/components/DevToolbar.tsx",
                    lineNumber: 30,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    className: "btn ghost",
                    onClick: clear,
                    children: "Clear"
                }, void 0, false, {
                    fileName: "[project]/components/DevToolbar.tsx",
                    lineNumber: 33,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        marginLeft: "auto"
                    },
                    children: "Tip: toggle changes runtime mock flag stored in localStorage"
                }, void 0, false, {
                    fileName: "[project]/components/DevToolbar.tsx",
                    lineNumber: 34,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/DevToolbar.tsx",
            lineNumber: 28,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/DevToolbar.tsx",
        lineNumber: 27,
        columnNumber: 5
    }, this);
}
_s(DevToolbar, "MkDsxd+wX4LhasI2vvTaGADljg8=");
_c = DevToolbar;
var _c;
__turbopack_context__.k.register(_c, "DevToolbar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/firebase.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "analytics",
    ()=>analytics,
    "default",
    ()=>__TURBOPACK__default__export__,
    "firebaseApp",
    ()=>app
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/app/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/app/dist/esm/index.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$analytics$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/analytics/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$analytics$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/analytics/dist/esm/index.esm.js [app-client] (ecmascript)");
;
;
const firebaseConfig = {
    apiKey: ("TURBOPACK compile-time value", "AIzaSyBLoFQJatOZYvCiimNqF84cXtg2YpOxp3Y"),
    authDomain: ("TURBOPACK compile-time value", "main-st-ai.firebaseapp.com"),
    databaseURL: ("TURBOPACK compile-time value", "https://main-st-ai-default-rtdb.firebaseio.com"),
    projectId: ("TURBOPACK compile-time value", "main-st-ai"),
    storageBucket: ("TURBOPACK compile-time value", "main-st-ai.firebasestorage.app"),
    messagingSenderId: ("TURBOPACK compile-time value", "816395647058"),
    appId: ("TURBOPACK compile-time value", "1:816395647058:web:06a5bcedae2e11cfdb078b"),
    measurementId: ("TURBOPACK compile-time value", "G-WCZN8L5HSK")
};
const app = !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getApps"])().length ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["initializeApp"])(firebaseConfig) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getApp"])();
let analytics = null;
if ("TURBOPACK compile-time truthy", 1) {
    try {
        analytics = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$analytics$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAnalytics"])(app);
    } catch (e) {
        analytics = null;
    }
}
;
const __TURBOPACK__default__export__ = app;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/firebaseClient.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "db",
    ()=>db
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/firebase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/firestore/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/index.esm.js [app-client] (ecmascript)");
;
;
const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getFirestore"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/realtime.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "canUseRealtime",
    ()=>canUseRealtime,
    "subscribeCollection",
    ()=>subscribeCollection,
    "subscribeDoc",
    ()=>subscribeDoc
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/firestore/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/index.esm.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/firebaseClient.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-client] (ecmascript)");
;
;
;
function canUseRealtime() {
    const auth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuth"])();
    if (!auth || !auth.token) return false;
    if (auth.token.startsWith("dev-")) return false;
    return true;
}
function subscribeCollection(pathParts, orderField, onData) {
    const auth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuth"])();
    if (!auth || !canUseRealtime()) return null;
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], ...pathParts);
    const q = orderField ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["query"])(ref, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["orderBy"])(orderField, "desc")) : ref;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onSnapshot"])(q, (snap)=>{
        const rows = snap.docs.map((docSnap)=>({
                id: docSnap.id,
                ...docSnap.data()
            }));
        onData(rows);
    });
}
function subscribeDoc(pathParts, onData) {
    const auth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuth"])();
    if (!auth || !canUseRealtime()) return null;
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$firebaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], ...pathParts);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["onSnapshot"])(ref, (snap)=>{
        onData(snap.exists() ? snap.data() : null);
    });
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/LiveTicker.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LiveTicker
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$realtime$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/realtime.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function LiveTicker() {
    _s();
    const [summary, setSummary] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [pending, setPending] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LiveTicker.useEffect": ()=>{
            let interval = null;
            const auth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAuth"])();
            const uid = auth?.uid;
            if (!uid) return;
            const today = new Date();
            const day = today.getFullYear().toString() + String(today.getMonth() + 1).padStart(2, "0") + String(today.getDate()).padStart(2, "0");
            const unsubStats = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$realtime$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["subscribeDoc"])([
                "users",
                uid,
                "stats",
                `daily_${day}`
            ], {
                "LiveTicker.useEffect.unsubStats": (data)=>setSummary({
                        day,
                        stats: data || {}
                    })
            }["LiveTicker.useEffect.unsubStats"]);
            const unsubQueue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$realtime$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["subscribeCollection"])([
                "users",
                uid,
                "actionQueue"
            ], "created_ts", {
                "LiveTicker.useEffect.unsubQueue": (rows)=>setPending(rows.filter({
                        "LiveTicker.useEffect.unsubQueue": (r)=>r.status === "needs_approval"
                    }["LiveTicker.useEffect.unsubQueue"]).length)
            }["LiveTicker.useEffect.unsubQueue"]);
            if (!unsubStats || !unsubQueue) {
                const poll = {
                    "LiveTicker.useEffect.poll": async ()=>{
                        try {
                            const data = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].dashboardSummary();
                            setSummary(data || null);
                            const queue = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].actionQueue();
                            setPending((queue || []).filter({
                                "LiveTicker.useEffect.poll": (r)=>r.status === "needs_approval"
                            }["LiveTicker.useEffect.poll"]).length);
                        } catch  {
                        // ignore poll errors
                        }
                    }
                }["LiveTicker.useEffect.poll"];
                poll();
                interval = window.setInterval(poll, 5000);
            }
            return ({
                "LiveTicker.useEffect": ()=>{
                    if (typeof unsubStats === "function") unsubStats();
                    if (typeof unsubQueue === "function") unsubQueue();
                    if (interval) window.clearInterval(interval);
                }
            })["LiveTicker.useEffect"];
        }
    }["LiveTicker.useEffect"], []);
    const stats = summary?.stats || {};
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "card tight",
        style: {
            margin: "16px auto",
            maxWidth: 1100
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "row",
            style: {
                alignItems: "center",
                justifyContent: "space-between"
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "muted",
                    children: [
                        "AI handled ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                            children: stats.chat_messages || 0
                        }, void 0, false, {
                            fileName: "[project]/components/LiveTicker.tsx",
                            lineNumber: 60,
                            columnNumber: 22
                        }, this),
                        " messages today"
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/LiveTicker.tsx",
                    lineNumber: 59,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "muted",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                            children: pending
                        }, void 0, false, {
                            fileName: "[project]/components/LiveTicker.tsx",
                            lineNumber: 63,
                            columnNumber: 11
                        }, this),
                        " pending approvals"
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/LiveTicker.tsx",
                    lineNumber: 62,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "muted",
                    children: [
                        "Saved ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                            children: stats.minutes_saved || 0
                        }, void 0, false, {
                            fileName: "[project]/components/LiveTicker.tsx",
                            lineNumber: 66,
                            columnNumber: 17
                        }, this),
                        " minutes today"
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/LiveTicker.tsx",
                    lineNumber: 65,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/LiveTicker.tsx",
            lineNumber: 58,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/LiveTicker.tsx",
        lineNumber: 57,
        columnNumber: 5
    }, this);
}
_s(LiveTicker, "9l/oni4bBKXekoVyySFfBLTT39U=");
_c = LiveTicker;
var _c;
__turbopack_context__.k.register(_c, "LiveTicker");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_c986f201._.js.map