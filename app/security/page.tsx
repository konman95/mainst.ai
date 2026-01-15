"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Policy = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

type LogEntry = {
  id: string;
  event: string;
  status: "resolved" | "monitoring" | "investigating";
  ts: string;
};

const defaultPolicies: Policy[] = [
  {
    id: "mfa",
    name: "Multi-factor enforcement",
    description: "Require MFA for owners and managers.",
    enabled: true
  },
  {
    id: "ip",
    name: "IP allowlist",
    description: "Restrict logins to trusted networks.",
    enabled: false
  },
  {
    id: "export",
    name: "Weekly audit export",
    description: "Send encrypted audit bundle to the owner.",
    enabled: true
  },
  {
    id: "retention",
    name: "90-day data retention",
    description: "Auto-archive conversations after 90 days.",
    enabled: false
  }
];

const defaultLogs: LogEntry[] = [
  { id: "log-1", event: "Action queue accessed", status: "resolved", ts: "Today · 3:42 PM" },
  { id: "log-2", event: "Guardrail update", status: "resolved", ts: "Today · 2:58 PM" },
  { id: "log-3", event: "Login from new device", status: "monitoring", ts: "Yesterday · 8:11 PM" }
];

export default function Security() {
  const [policies, setPolicies] = useState<Policy[]>(defaultPolicies);
  const [logs, setLogs] = useState<LogEntry[]>(defaultLogs);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [role, setRole] = useState<"Owner" | "Manager" | "Agent">("Owner");

  useEffect(() => {
    api.securityPolicies()
      .then((data) => setPolicies(data || defaultPolicies))
      .catch(() => setPolicies(defaultPolicies));
    api.securityLogs()
      .then((data) => setLogs(data || defaultLogs))
      .catch(() => setLogs(defaultLogs));
    api.accessGet()
      .then((data) => setRole(data?.role || "Owner"))
      .catch(() => setRole("Owner"));
  }, []);

  function togglePolicy(id: string) {
    const next = policies.map(policy => (policy.id === id ? { ...policy, enabled: !policy.enabled } : policy));
    setPolicies(next);
    api.securityPoliciesSet(next).catch(() => null);
  }

  function runExport() {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setMessage("Audit export queued. You will receive a secure link shortly.");
      setTimeout(() => setMessage(null), 2600);
    }, 900);
  }

  return (
    <div className="stagger">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span className="pill">Security & Compliance</span>
          <h2 className="section-title">Governance for autonomous operations</h2>
        </div>
        <a className="btn primary" href="/settings">Workspace settings</a>
      </div>

      {role !== "Owner" && (
        <div className="card">
          <h3 className="section-title">Owner-only access</h3>
          <p className="muted">
            Security and compliance controls are restricted to Owners.
          </p>
        </div>
      )}

      {role !== "Owner" ? null : (
        <>
      <div className="card">
        <h3 className="section-title">Access controls</h3>
        <p className="muted">Protect the operator interface with strict access and monitoring.</p>
        <div className="table" style={{ marginTop: 12 }}>
          {policies.map(policy => (
            <div className="table-row" key={policy.id}>
              <div>
                <strong>{policy.name}</strong>
                <div className="muted">{policy.description}</div>
              </div>
              <span className={`status-pill ${policy.enabled ? "" : "warn"}`}>
                <span className="status-dot" />
                {policy.enabled ? "Enabled" : "Disabled"}
              </span>
              <div className="muted">Policy</div>
              <button className="btn ghost" onClick={() => togglePolicy(policy.id)}>
                {policy.enabled ? "Disable" : "Enable"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 className="section-title">Audit exports</h3>
            <p className="muted">Download a complete decision and action trail for compliance.</p>
          </div>
          <button className="btn primary" onClick={runExport} disabled={exporting}>
            {exporting ? "Preparing..." : "Generate export"}
          </button>
        </div>
        {message && <div className="callout" style={{ marginTop: 12 }}>{message}</div>}
        <div className="feature-grid" style={{ marginTop: 16 }}>
          <div className="feature-card">
            <strong>Audit log window</strong>
            <p className="muted">Last 30 days · 2,142 events</p>
          </div>
          <div className="feature-card">
            <strong>Decision trace</strong>
            <p className="muted">Includes confidence, intent, and approvals.</p>
          </div>
          <div className="feature-card">
            <strong>Export format</strong>
            <p className="muted">JSON + CSV, encrypted link.</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Incident log</h3>
        <p className="muted">Visibility into access events and system changes.</p>
        <div className="table" style={{ marginTop: 12 }}>
          <div className="table-row table-header">
            <span>Event</span>
            <span>Status</span>
            <span>Timestamp</span>
            <span>Actions</span>
          </div>
          {logs.map(entry => (
            <div className="table-row" key={entry.id}>
              <div>
                <strong>{entry.event}</strong>
                <div className="muted">Operator console</div>
              </div>
              <span className={`status-pill ${entry.status === "investigating" ? "warn" : ""}`}>
                <span className="status-dot" />
                {entry.status}
              </span>
              <span className="muted">{entry.ts}</span>
              <button className="btn ghost">Review</button>
            </div>
          ))}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
