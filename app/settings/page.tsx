"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

type BillingState = {
  plan: "core" | "pro" | "enterprise";
  billingEmail: string;
  paymentMethod: string;
  seats: number;
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Manager" | "Agent";
  status: "Active" | "Invited";
};

type Integration = {
  id: "webchat" | "email" | "sms";
  name: string;
  status: "connected" | "pending" | "disconnected";
  description: string;
  lastSync: string;
};

const planOptions = [
  {
    id: "core",
    name: "Coverage Core",
    price: "$149 / mo",
    detail: "Monitor mode, approvals, audit log, smart chat."
  },
  {
    id: "pro",
    name: "Operator Pro",
    price: "$299 / mo",
    detail: "Auto-Send, follow-ups, priority queue, premium models."
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    detail: "Multi-location, custom models, SSO, dedicated support."
  }
] as const;

const defaultBilling: BillingState = {
  plan: "pro",
  billingEmail: "owner@mainst.ai",
  paymentMethod: "Visa •••• 4242",
  seats: 3
};

const defaultTeam: TeamMember[] = [
  {
    id: "owner",
    name: "Owner",
    email: "owner@mainst.ai",
    role: "Owner",
    status: "Active"
  },
  {
    id: "ops",
    name: "Operations Lead",
    email: "ops@mainst.ai",
    role: "Manager",
    status: "Active"
  }
];

const defaultIntegrations: Integration[] = [
  {
    id: "webchat",
    name: "Web Chat",
    status: "connected",
    description: "On-site widget and Smart Chat routing.",
    lastSync: "Live"
  },
  {
    id: "email",
    name: "Email Relay",
    status: "pending",
    description: "Route inbound emails into Owner Cover.",
    lastSync: "Awaiting verification"
  },
  {
    id: "sms",
    name: "SMS Outbound",
    status: "disconnected",
    description: "Send replies to leads via text.",
    lastSync: "Not configured"
  }
];

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function Settings() {
  const [profile, setProfile] = useState<any>(null);
  const [ownerCover, setOwnerCover] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [billing, setBilling] = useState<BillingState>(defaultBilling);
  const [team, setTeam] = useState<TeamMember[]>(defaultTeam);
  const [integrations, setIntegrations] = useState<Integration[]>(defaultIntegrations);
  const [invite, setInvite] = useState({ name: "", email: "", role: "Agent" as TeamMember["role"] });
  const [billingSaved, setBillingSaved] = useState<string | null>(null);
  const [teamSaved, setTeamSaved] = useState<string | null>(null);
  const [integrationSaved, setIntegrationSaved] = useState<string | null>(null);
  const [access, setAccess] = useState<{ role: "Owner" | "Manager" | "Agent"; workspace_id?: string; effective_role?: "Owner" | "Manager" | "Agent" } | null>(null);
  const [accessSaved, setAccessSaved] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string }>>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<string>("");
  const [newWorkspace, setNewWorkspace] = useState("");
  const [workspaceSaved, setWorkspaceSaved] = useState<string | null>(null);
  const [members, setMembers] = useState<Array<{ id: string; name: string; email: string; role: "Owner" | "Manager" | "Agent"; status: string }>>([]);
  const [memberInvite, setMemberInvite] = useState({ name: "", email: "", role: "Agent" as "Owner" | "Manager" | "Agent" });
  const [membersSaved, setMembersSaved] = useState<string | null>(null);
  const [routing, setRouting] = useState<{ email_enabled: boolean; sms_enabled: boolean; email: string; sms: string; min_severity: "low" | "medium" | "high" } | null>(null);
  const [routingSaved, setRoutingSaved] = useState<string | null>(null);

  useEffect(() => {
    api.billingGet()
      .then((data) => setBilling(data || defaultBilling))
      .catch(() => setBilling(defaultBilling));
    api.teamGet()
      .then((data) => setTeam(data || defaultTeam))
      .catch(() => setTeam(defaultTeam));
    api.integrationsGet()
      .then((data) => setIntegrations(data || defaultIntegrations))
      .catch(() => setIntegrations(defaultIntegrations));
    api.accessGet()
      .then((data) => setAccess(data || { role: "Owner" }))
      .catch(() => setAccess({ role: "Owner" }));
    api.workspaces()
      .then((data) => {
        setWorkspaces(data?.items || []);
        setCurrentWorkspace(data?.current || "");
      })
      .catch(() => null);
    api.notificationsRouting()
      .then((data) => setRouting(data || { email_enabled: true, sms_enabled: false, email: "owner@mainst.ai", sms: "", min_severity: "high" }))
      .catch(() => setRouting({ email_enabled: true, sms_enabled: false, email: "owner@mainst.ai", sms: "", min_severity: "high" }));
  }, []);

  useEffect(() => {
    if (!currentWorkspace) return;
    api.workspacesMembers(currentWorkspace)
      .then((data) => setMembers(data || []))
      .catch(() => setMembers([]));
  }, [currentWorkspace]);

  useEffect(() => {
    api.profileGet().then(setProfile).catch(() => setProfile(null));
    api.ownerGet().then(setOwnerCover).catch(() => setOwnerCover(null));
    api.health().then(setHealth).catch(() => setHealth(null));
    api.dashboardSummary().then(setSummary).catch(() => setSummary(null));
  }, []);

  const effectiveRole = access?.effective_role || access?.role;
  const workspaceLabel =
    workspaces.find(item => item.id === currentWorkspace)?.name ||
    profile?.name ||
    "Main St AI Business";
  const coverMode = ownerCover?.mode ? ownerCover.mode.toUpperCase() : "MONITOR";
  const apiStatus = health?.ok ? "Operational" : "Offline";

  const usageStats = useMemo(() => {
    const stats = summary?.stats || {};
    return [
      { label: "Messages today", value: stats.chat_messages || 0 },
      { label: "Decisions today", value: stats.decisions_made || 0 },
      { label: "Minutes saved", value: stats.minutes_saved || 0 }
    ];
  }, [summary]);

  function saveBilling() {
    api.billingSet(billing).catch(() => null);
    setBillingSaved("Billing settings saved.");
    setTimeout(() => setBillingSaved(null), 2200);
  }

  function addTeamMember() {
    if (!invite.name || !invite.email) return;
    const next = [
      { id: makeId("team"), name: invite.name, email: invite.email, role: invite.role, status: "Invited" as const },
      ...team
    ];
    setTeam(next);
    api.teamSet(next).catch(() => null);
    setInvite({ name: "", email: "", role: "Agent" });
    setTeamSaved("Invite sent.");
    setTimeout(() => setTeamSaved(null), 2200);
  }

  function updateTeam(id: string, nextRole: TeamMember["role"]) {
    const next = team.map(member => (member.id === id ? { ...member, role: nextRole } : member));
    setTeam(next);
    api.teamSet(next).catch(() => null);
    setTeamSaved("Team updated.");
    setTimeout(() => setTeamSaved(null), 2200);
  }

  function removeTeam(id: string) {
    const next = team.filter(member => member.id !== id);
    setTeam(next);
    api.teamSet(next).catch(() => null);
    setTeamSaved("Member removed.");
    setTimeout(() => setTeamSaved(null), 2200);
  }

  function toggleIntegration(id: Integration["id"]) {
    const next = integrations.map(integration => {
      if (integration.id !== id) return integration;
      if (integration.status === "connected") {
        return { ...integration, status: "disconnected", lastSync: "Paused" };
      }
      if (integration.status === "pending") {
        return { ...integration, status: "connected", lastSync: "Connected just now" };
      }
      return { ...integration, status: "connected", lastSync: "Connected just now" };
    });
    setIntegrations(next);
    api.integrationsSet(next).catch(() => null);
    setIntegrationSaved("Integrations updated.");
    setTimeout(() => setIntegrationSaved(null), 2200);
  }

  function saveAccess(role: "Owner" | "Manager" | "Agent") {
    const next = { role, workspace_id: access?.workspace_id || currentWorkspace || "primary" };
    setAccess(next);
    api.accessSet(next).catch(() => null);
    setAccessSaved("Access role updated.");
    setTimeout(() => setAccessSaved(null), 2200);
  }

  function selectWorkspace(id: string) {
    setCurrentWorkspace(id);
    api.workspacesSelect(id).catch(() => null);
    setAccess(prev => (prev ? { ...prev, workspace_id: id } : prev));
    setWorkspaceSaved("Workspace switched.");
    setTimeout(() => setWorkspaceSaved(null), 2200);
    if (typeof window !== "undefined") {
      window.setTimeout(() => window.location.reload(), 400);
    }
  }

  function addWorkspace() {
    const trimmed = newWorkspace.trim();
    if (!trimmed) return;
    const id = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const next = [{ id: id || `ws-${Date.now()}`, name: trimmed }, ...workspaces];
    setWorkspaces(next);
    api.workspacesSet(next).catch(() => null);
    setNewWorkspace("");
    setWorkspaceSaved("Workspace added.");
    setTimeout(() => setWorkspaceSaved(null), 2200);
  }

  function addMember() {
    if (!memberInvite.name || !memberInvite.email) return;
    const next = [
      { id: `member-${Date.now()}`, name: memberInvite.name, email: memberInvite.email, role: memberInvite.role, status: "Invited" },
      ...members
    ];
    setMembers(next);
    api.workspacesMembersSet(next, currentWorkspace).catch(() => null);
    setMemberInvite({ name: "", email: "", role: "Agent" });
    setMembersSaved("Member invited.");
    setTimeout(() => setMembersSaved(null), 2200);
  }

  function updateMember(id: string, role: "Owner" | "Manager" | "Agent") {
    const next = members.map(member => (member.id === id ? { ...member, role } : member));
    setMembers(next);
    api.workspacesMembersSet(next, currentWorkspace).catch(() => null);
    setMembersSaved("Member updated.");
    setTimeout(() => setMembersSaved(null), 2200);
  }

  function removeMember(id: string) {
    const next = members.filter(member => member.id !== id);
    setMembers(next);
    api.workspacesMembersSet(next, currentWorkspace).catch(() => null);
    setMembersSaved("Member removed.");
    setTimeout(() => setMembersSaved(null), 2200);
  }

  function saveRouting(next: { email_enabled: boolean; sms_enabled: boolean; email: string; sms: string; min_severity: "low" | "medium" | "high" }) {
    setRouting(next);
    api.notificationsRoutingSet(next).catch(() => null);
    setRoutingSaved("Notification routing saved.");
    setTimeout(() => setRoutingSaved(null), 2200);
  }

  return (
    <div className="stagger">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span className="pill">Workspace Settings</span>
          <h2 className="section-title">Run your AI business like an operator</h2>
        </div>
        <a className="btn primary" href="/dashboard">Back to Dashboard</a>
      </div>

      {effectiveRole === "Agent" && (
        <div className="card">
          <h3 className="section-title">Limited access</h3>
          <p className="muted">
            Settings are restricted to Owners and Managers. Contact your Owner for access.
          </p>
        </div>
      )}

      {effectiveRole === "Agent" ? null : (
        <>
      <div className="card">
        <h3 className="section-title">Workspace status</h3>
        <div className="row">
          <span className="badge">Workspace: {workspaceLabel}</span>
          <span className="badge">Owner Cover: {coverMode}</span>
          <span className={`status-pill ${health?.ok ? "" : "warn"}`}>
            <span className="status-dot" />
            {apiStatus}
          </span>
        </div>
        <div className="stat-grid" style={{ marginTop: 16 }}>
          {usageStats.map(item => (
            <div className="stat" key={item.label}>
              <div className="stat-value">{item.value}</div>
              <div className="muted">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {effectiveRole === "Owner" && (
        <div className="card">
          <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <h3 className="section-title">Billing & plan</h3>
            {billingSaved && <span className="muted">{billingSaved}</span>}
          </div>
          <div className="feature-grid" style={{ marginTop: 12 }}>
            {planOptions.map(option => (
              <button
                key={option.id}
                className={`plan-card ${billing.plan === option.id ? "active" : ""}`}
                type="button"
                onClick={() => setBilling({ ...billing, plan: option.id })}
              >
                <div>
                  <strong>{option.name}</strong>
                  <div className="muted">{option.detail}</div>
                </div>
                <span className="badge">{option.price}</span>
              </button>
            ))}
          </div>
          <div className="settings-grid" style={{ marginTop: 16 }}>
            <div>
              <label className="muted">Billing email</label>
              <input
                className="input"
                value={billing.billingEmail}
                onChange={e => setBilling({ ...billing, billingEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="muted">Payment method</label>
              <input
                className="input"
                value={billing.paymentMethod}
                onChange={e => setBilling({ ...billing, paymentMethod: e.target.value })}
              />
            </div>
            <div>
              <label className="muted">Seats</label>
              <input
                className="input"
                type="number"
                min={1}
                value={billing.seats}
                onChange={e => setBilling({ ...billing, seats: Number(e.target.value || 1) })}
              />
            </div>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn primary" onClick={saveBilling}>Save billing</button>
            <button className="btn ghost">Download invoices</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
          <h3 className="section-title">Team access</h3>
          {teamSaved && <span className="muted">{teamSaved}</span>}
        </div>
        <div className="table">
          <div className="table-row table-header">
            <span>Name</span>
            <span>Role</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {team.map(member => (
            <div className="table-row" key={member.id}>
              <div>
                <strong>{member.name}</strong>
                <div className="muted">{member.email}</div>
              </div>
              <select
                className="select"
                value={member.role}
                onChange={e => updateTeam(member.id, e.target.value as TeamMember["role"])}
              >
                <option value="Owner">Owner</option>
                <option value="Manager">Manager</option>
                <option value="Agent">Agent</option>
              </select>
              <span className={`status-pill ${member.status === "Invited" ? "warn" : ""}`}>
                <span className="status-dot" />
                {member.status}
              </span>
              <button className="btn ghost" onClick={() => removeTeam(member.id)}>Remove</button>
            </div>
          ))}
        </div>
        <div className="settings-grid" style={{ marginTop: 16 }}>
          <div>
            <label className="muted">Name</label>
            <input
              className="input"
              value={invite.name}
              onChange={e => setInvite({ ...invite, name: e.target.value })}
            />
          </div>
          <div>
            <label className="muted">Email</label>
            <input
              className="input"
              value={invite.email}
              onChange={e => setInvite({ ...invite, email: e.target.value })}
            />
          </div>
          <div>
            <label className="muted">Role</label>
            <select
              className="select"
              value={invite.role}
              onChange={e => setInvite({ ...invite, role: e.target.value as TeamMember["role"] })}
            >
              <option value="Owner">Owner</option>
              <option value="Manager">Manager</option>
              <option value="Agent">Agent</option>
            </select>
          </div>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn primary" onClick={addTeamMember}>Send invite</button>
          <button className="btn ghost">Manage roles</button>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
          <h3 className="section-title">Channel integrations</h3>
          {integrationSaved && <span className="muted">{integrationSaved}</span>}
        </div>
        <div className="table">
          <div className="table-row table-header">
            <span>Channel</span>
            <span>Status</span>
            <span>Last update</span>
            <span>Actions</span>
          </div>
          {integrations.map(integration => (
            <div className="table-row" key={integration.id}>
              <div>
                <strong>{integration.name}</strong>
                <div className="muted">{integration.description}</div>
              </div>
              <span className={`status-pill ${integration.status !== "connected" ? "warn" : ""}`}>
                <span className="status-dot" />
                {integration.status}
              </span>
              <span className="muted">{integration.lastSync}</span>
              <button className="btn ghost" onClick={() => toggleIntegration(integration.id)}>
                {integration.status === "connected" ? "Pause" : "Connect"}
              </button>
            </div>
          ))}
        </div>
        <div className="callout" style={{ marginTop: 16 }}>
          Connect web chat, email, and SMS to keep conversations unified in the Decision Core.
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
          <h3 className="section-title">Workspaces</h3>
          {workspaceSaved && <span className="muted">{workspaceSaved}</span>}
        </div>
        <p className="muted">
          Switch between business workspaces without losing context. Each workspace keeps its own contacts, chats, and automation.
        </p>
        {workspaces.length === 0 ? (
          <div className="muted">No workspaces yet.</div>
        ) : (
          <div className="table" style={{ marginTop: 12 }}>
            <div className="table-row table-header">
              <span>Workspace</span>
              <span>Status</span>
              <span>Data scope</span>
              <span>Actions</span>
            </div>
            {workspaces.map(workspace => (
              <div className="table-row" key={workspace.id}>
                <div>
                  <strong>{workspace.name}</strong>
                  <div className="muted">ID: {workspace.id}</div>
                </div>
                <span className={`status-pill ${currentWorkspace === workspace.id ? "" : "warn"}`}>
                  <span className="status-dot" />
                  {currentWorkspace === workspace.id ? "Active" : "Idle"}
                </span>
                <div className="muted">Contacts + Decisions</div>
                <button className="btn ghost" onClick={() => selectWorkspace(workspace.id)}>
                  {currentWorkspace === workspace.id ? "Selected" : "Switch"}
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="settings-grid" style={{ marginTop: 16 }}>
          <div>
            <label className="muted">New workspace name</label>
            <input
              className="input"
              placeholder="e.g. Downtown Studio"
              value={newWorkspace}
              onChange={e => setNewWorkspace(e.target.value)}
            />
          </div>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn primary" onClick={addWorkspace}>Add workspace</button>
        </div>
      </div>

      {effectiveRole !== "Agent" && (
        <div className="card">
          <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <h3 className="section-title">Workspace members</h3>
            {membersSaved && <span className="muted">{membersSaved}</span>}
          </div>
          <p className="muted">
            Members inherit permissions per workspace. Owners can promote or remove access.
          </p>
          {members.length === 0 ? (
            <div className="muted">No members yet.</div>
          ) : (
            <div className="table" style={{ marginTop: 12 }}>
              <div className="table-row table-header">
                <span>Member</span>
                <span>Role</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {members.map(member => (
                <div className="table-row" key={member.id}>
                  <div>
                    <strong>{member.name}</strong>
                    <div className="muted">{member.email}</div>
                  </div>
                  <select
                    className="select"
                    value={member.role}
                    onChange={e => updateMember(member.id, e.target.value as "Owner" | "Manager" | "Agent")}
                  >
                    <option value="Owner">Owner</option>
                    <option value="Manager">Manager</option>
                    <option value="Agent">Agent</option>
                  </select>
                  <span className={`status-pill ${member.status === "Invited" ? "warn" : ""}`}>
                    <span className="status-dot" />
                    {member.status}
                  </span>
                  <button className="btn ghost" onClick={() => removeMember(member.id)}>Remove</button>
                </div>
              ))}
            </div>
          )}
          <div className="settings-grid" style={{ marginTop: 16 }}>
            <div>
              <label className="muted">Name</label>
              <input
                className="input"
                value={memberInvite.name}
                onChange={e => setMemberInvite({ ...memberInvite, name: e.target.value })}
              />
            </div>
            <div>
              <label className="muted">Email</label>
              <input
                className="input"
                value={memberInvite.email}
                onChange={e => setMemberInvite({ ...memberInvite, email: e.target.value })}
              />
            </div>
            <div>
              <label className="muted">Role</label>
              <select
                className="select"
                value={memberInvite.role}
                onChange={e => setMemberInvite({ ...memberInvite, role: e.target.value as "Owner" | "Manager" | "Agent" })}
              >
                <option value="Owner">Owner</option>
                <option value="Manager">Manager</option>
                <option value="Agent">Agent</option>
              </select>
            </div>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn primary" onClick={addMember}>Invite member</button>
          </div>
        </div>
      )}

      {effectiveRole !== "Agent" && routing && (
        <div className="card">
          <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <h3 className="section-title">Notification routing</h3>
            {routingSaved && <span className="muted">{routingSaved}</span>}
          </div>
          <p className="muted">
            Route high-severity alerts to the right channels so approvals never slip.
          </p>
          <div className="settings-grid" style={{ marginTop: 12 }}>
            <div>
              <label className="muted">Email recipient</label>
              <input
                className="input"
                value={routing.email}
                onChange={e => setRouting({ ...routing, email: e.target.value })}
              />
            </div>
            <div>
              <label className="muted">SMS recipient</label>
              <input
                className="input"
                value={routing.sms}
                onChange={e => setRouting({ ...routing, sms: e.target.value })}
              />
            </div>
            <div>
              <label className="muted">Minimum severity</label>
              <select
                className="select"
                value={routing.min_severity}
                onChange={e => setRouting({ ...routing, min_severity: e.target.value as "low" | "medium" | "high" })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button
              className={`btn ${routing.email_enabled ? "primary" : "ghost"}`}
              onClick={() => saveRouting({ ...routing, email_enabled: !routing.email_enabled })}
            >
              Email {routing.email_enabled ? "On" : "Off"}
            </button>
            <button
              className={`btn ${routing.sms_enabled ? "primary" : "ghost"}`}
              onClick={() => saveRouting({ ...routing, sms_enabled: !routing.sms_enabled })}
            >
              SMS {routing.sms_enabled ? "On" : "Off"}
            </button>
            <button className="btn ghost" onClick={() => saveRouting(routing)}>
              Save routing
            </button>
          </div>
        </div>
      )}

      {effectiveRole === "Owner" && (
        <div className="card">
          <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <h3 className="section-title">Access role</h3>
            {accessSaved && <span className="muted">{accessSaved}</span>}
          </div>
          <p className="muted">
            Role-based permissions control what operators can access in the workspace.
          </p>
          <div className="row" style={{ marginTop: 12 }}>
            {(["Owner", "Manager", "Agent"] as const).map((role) => (
              <button
                key={role}
                className={`btn ${access?.role === role ? "primary" : "ghost"}`}
                onClick={() => saveAccess(role)}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
