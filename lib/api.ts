import { getAuth } from "./auth";
const BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" ? "/api" : "http://localhost:8000");
const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCK || "false") === "true";

function isMockEnabled(): boolean {
  if (typeof window !== "undefined") {
    const runtime = localStorage.getItem("USE_MOCK");
    if (runtime === "true") return true;
    if (runtime === "false") return false;
  }
  return USE_MOCK;
}

const MOCK_PATHS = ["/health", "/contacts", "/chat", "/ownercover", "/profile"];

function buildUrl(path: string) {
  if (isMockEnabled() && MOCK_PATHS.some(p => path === p || path.startsWith(`${p}/`))) {
    return `/api/mock${path}`;
  }
  return BASE + path;
}

async function req(path: string, body?: any, method?: string) {
  const auth = getAuth();
  const devFallback =
    typeof window !== "undefined" && !auth?.token ? "dev-guest" : undefined;
  let res: Response;
  try {
    res = await fetch(buildUrl(path), {
      method: method || (body ? "POST" : "GET"),
      headers: {
        "Content-Type": "application/json",
        ...(auth?.token
          ? { Authorization: `Bearer ${auth.token}` }
          : devFallback
            ? { Authorization: `Bearer ${devFallback}` }
            : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (e: any) {
    throw new Error("Network error: " + (e?.message || String(e)));
  }

  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(text);
  }

  try {
    return await res.json();
  } catch (e) {
    return null;
  }
}

export const api = {
  health: () => req("/health"),
  chat: (b: any) => req("/chat", b),
  chatManual: (b: any) => req("/chat/manual", b),
  chatHistory: (conversationId: string) =>
    req(`/chat/history?conversationId=${encodeURIComponent(conversationId)}`),
  ownerGet: () => req("/ownercover/settings"),
  ownerSet: (b: any) => req("/ownercover/settings", b),
  ownerInbound: (b: any) => req("/ownercover/handleInbound", b),
  profileGet: () => req("/profile"),
  profileSet: (b: any) => req("/profile", b, "POST"),
  billingGet: () => req("/billing"),
  billingSet: (b: any) => req("/billing", b, "POST"),
  integrationsGet: () => req("/integrations"),
  integrationsSet: (b: any) => req("/integrations", b, "POST"),
  teamGet: () => req("/team"),
  teamSet: (b: any) => req("/team", b, "POST"),
  accessGet: () => req("/access"),
  accessSet: (b: any) => req("/access", b, "POST"),
  workspaces: () => req("/workspaces"),
  workspacesSet: (b: any) => req("/workspaces", b, "POST"),
  workspacesSelect: (id: string) => req("/workspaces/select", { id }, "POST"),
  workspacesMembers: (workspaceId?: string) =>
    req(workspaceId ? `/workspaces/members?workspace_id=${encodeURIComponent(workspaceId)}` : "/workspaces/members"),
  workspacesMembersSet: (items: any, workspaceId?: string) =>
    req(
      workspaceId ? `/workspaces/members?workspace_id=${encodeURIComponent(workspaceId)}` : "/workspaces/members",
      items,
      "POST"
    ),
  automationRules: () => req("/automation/rules"),
  automationRulesSet: (b: any) => req("/automation/rules", b, "POST"),
  automationGuardrails: () => req("/automation/guardrails"),
  automationGuardrailsSet: (b: any) => req("/automation/guardrails", b, "POST"),
  securityPolicies: () => req("/security/policies"),
  securityPoliciesSet: (b: any) => req("/security/policies", b, "POST"),
  securityLogs: () => req("/security/logs"),
  notifications: () => req("/notifications"),
  notificationsUpdate: (b: any) => req("/notifications", b, "POST"),
  notificationsRouting: () => req("/notifications/routing"),
  notificationsRoutingSet: (b: any) => req("/notifications/routing", b, "POST"),
  contacts: () => req("/contacts"),
  createContact: (b: any) => req("/contacts", b, "POST"),
  updateContact: (id: string, b: any) => req(`/contacts/${id}`, b, "PUT"),
  deleteContact: (id: string) => req(`/contacts/${id}`, undefined, "DELETE"),
  decisions: (contactId?: string) =>
    req(contactId ? `/decisions?contact_id=${encodeURIComponent(contactId)}` : "/decisions"),
  actionQueue: () => req("/actionQueue"),
  approveAction: (actionId: string, approve: boolean) =>
    req("/actionQueue/approve", { action_id: actionId, approve }, "POST"),
  audit: () => req("/auditLog"),
  outcomes: (contactId?: string) =>
    req(contactId ? `/outcomes?contact_id=${encodeURIComponent(contactId)}` : "/outcomes"),
  createOutcome: (b: any) => req("/outcomes", b, "POST"),
  threads: (contactId?: string) =>
    req(contactId ? `/threads?contact_id=${encodeURIComponent(contactId)}` : "/threads"),
  threadMessages: (threadId: string) => req(`/threads/${encodeURIComponent(threadId)}/messages`),
  dashboardSummary: () => req("/dashboard/summary"),
  weeklySummary: () => req("/dashboard/summary?range=week"),
  orgSummary: () => req("/org/summary"),
  orgWeeklySummary: () => req("/org/summary?range=week")
};
