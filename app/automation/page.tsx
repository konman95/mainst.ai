"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Rule = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  status: "active" | "paused";
  risk: "low" | "medium" | "high";
};

type Guardrail = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

const defaultRules: Rule[] = [
  {
    id: "rule-hours",
    name: "After-hours routing",
    trigger: "Inbound outside business hours",
    action: "Queue for approval + after-hours response",
    status: "active",
    risk: "low"
  },
  {
    id: "rule-pricing",
    name: "Pricing intent",
    trigger: "Customer asks about pricing",
    action: "Send approved range + request one detail",
    status: "active",
    risk: "medium"
  },
  {
    id: "rule-complaint",
    name: "Complaint escalation",
    trigger: "Complaint or refund keywords",
    action: "Escalate to owner + draft response",
    status: "active",
    risk: "high"
  }
];

const defaultGuardrails: Guardrail[] = [
  {
    id: "gr-confidence",
    label: "Minimum confidence",
    description: "Block auto-send if confidence drops below 0.70.",
    enabled: true
  },
  {
    id: "gr-money",
    label: "Money approval",
    description: "Require approval for pricing, invoices, or refunds.",
    enabled: true
  },
  {
    id: "gr-legal",
    label: "Legal escalation",
    description: "Escalate legal or complaint language immediately.",
    enabled: true
  },
  {
    id: "gr-quiet",
    label: "Quiet hours",
    description: "Prevent auto-send outside business hours.",
    enabled: false
  }
];

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function Automation() {
  const [rules, setRules] = useState<Rule[]>(defaultRules);
  const [guardrails, setGuardrails] = useState<Guardrail[]>(defaultGuardrails);
  const [role, setRole] = useState<"Owner" | "Manager" | "Agent">("Owner");
  const [newRule, setNewRule] = useState({
    name: "",
    trigger: "",
    action: "",
    risk: "medium" as Rule["risk"]
  });
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    api.automationRules()
      .then((data) => setRules(data || defaultRules))
      .catch(() => setRules(defaultRules));
    api.automationGuardrails()
      .then((data) => setGuardrails(data || defaultGuardrails))
      .catch(() => setGuardrails(defaultGuardrails));
    api.accessGet()
      .then((data) => setRole(data?.role || "Owner"))
      .catch(() => setRole("Owner"));
  }, []);

  function toggleGuardrail(id: string) {
    const next = guardrails.map(g => (g.id === id ? { ...g, enabled: !g.enabled } : g));
    setGuardrails(next);
    api.automationGuardrailsSet(next).catch(() => null);
  }

  function toggleRule(id: string) {
    const next = rules.map((r): Rule =>
      r.id === id ? { ...r, status: r.status === "active" ? "paused" : "active" } : r
    );
    setRules(next);
    api.automationRulesSet(next).catch(() => null);
  }

  function addRule() {
    if (!newRule.name || !newRule.trigger || !newRule.action) return;
    const rule: Rule = {
      id: makeId("rule"),
      name: newRule.name,
      trigger: newRule.trigger,
      action: newRule.action,
      status: "active",
      risk: newRule.risk
    };
    const next = [rule, ...rules];
    setRules(next);
    api.automationRulesSet(next).catch(() => null);
    setNewRule({ name: "", trigger: "", action: "", risk: "medium" });
    setSaved("Rule added.");
    setTimeout(() => setSaved(null), 2200);
  }

  return (
    <div className="stagger">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span className="pill">Automation Studio</span>
          <h2 className="section-title">Design how the Decision Core acts</h2>
        </div>
        <a className="btn primary" href="/owner-cover">Owner Cover settings</a>
      </div>

      {role === "Agent" && (
        <div className="card">
          <h3 className="section-title">Limited access</h3>
          <p className="muted">
            Automation Studio is available to Owners and Managers. Ask your Owner to grant access.
          </p>
        </div>
      )}

      {role === "Agent" ? null : (
        <>
      <div className="card">
        <h3 className="section-title">Guardrails</h3>
        <p className="muted">Guardrails keep the AI safe and explainable before it takes action.</p>
        <div className="table" style={{ marginTop: 12 }}>
          {guardrails.map(item => (
            <div className="table-row" key={item.id}>
              <div>
                <strong>{item.label}</strong>
                <div className="muted">{item.description}</div>
              </div>
              <span className={`status-pill ${item.enabled ? "" : "warn"}`}>
                <span className="status-dot" />
                {item.enabled ? "Enabled" : "Disabled"}
              </span>
              <div className="muted">Policy</div>
              <button className="btn ghost" onClick={() => toggleGuardrail(item.id)}>
                {item.enabled ? "Disable" : "Enable"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
          <h3 className="section-title">Automation rules</h3>
          {saved && <span className="muted">{saved}</span>}
        </div>
        <div className="table" style={{ marginTop: 12 }}>
          <div className="table-row table-header">
            <span>Rule</span>
            <span>Risk</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {rules.map(rule => (
            <div className="table-row" key={rule.id}>
              <div>
                <strong>{rule.name}</strong>
                <div className="muted">Trigger: {rule.trigger}</div>
                <div className="muted">Action: {rule.action}</div>
              </div>
              <span className={`status-pill ${rule.risk === "high" ? "warn" : ""}`}>
                <span className="status-dot" />
                {rule.risk}
              </span>
              <span className={`status-pill ${rule.status === "active" ? "" : "warn"}`}>
                <span className="status-dot" />
                {rule.status}
              </span>
              <button className="btn ghost" onClick={() => toggleRule(rule.id)}>
                {rule.status === "active" ? "Pause" : "Activate"}
              </button>
            </div>
          ))}
        </div>

        <div className="settings-grid" style={{ marginTop: 16 }}>
          <div>
            <label className="muted">Rule name</label>
            <input
              className="input"
              placeholder="e.g. High-value lead follow-up"
              value={newRule.name}
              onChange={e => setNewRule({ ...newRule, name: e.target.value })}
            />
          </div>
          <div>
            <label className="muted">Trigger</label>
            <input
              className="input"
              placeholder="e.g. Lead tagged VIP"
              value={newRule.trigger}
              onChange={e => setNewRule({ ...newRule, trigger: e.target.value })}
            />
          </div>
          <div>
            <label className="muted">Action</label>
            <input
              className="input"
              placeholder="e.g. Auto-send with premium response"
              value={newRule.action}
              onChange={e => setNewRule({ ...newRule, action: e.target.value })}
            />
          </div>
          <div>
            <label className="muted">Risk</label>
            <select
              className="select"
              value={newRule.risk}
              onChange={e => setNewRule({ ...newRule, risk: e.target.value as Rule["risk"] })}
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </div>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn primary" onClick={addRule}>Add rule</button>
          <button className="btn ghost">Export rules</button>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Playbooks</h3>
        <p className="muted">Pre-approved response playbooks for high-volume scenarios.</p>
        <div className="feature-grid" style={{ marginTop: 12 }}>
          <div className="feature-card">
            <strong>Lead follow-up</strong>
            <p className="muted">Auto-send in 24h if no reply, then queue if still idle.</p>
            <button className="btn ghost">Configure</button>
          </div>
          <div className="feature-card">
            <strong>Booking flow</strong>
            <p className="muted">Collect service, date, time, and hand off to owner.</p>
            <button className="btn ghost">Configure</button>
          </div>
          <div className="feature-card">
            <strong>Refund protection</strong>
            <p className="muted">Escalate to owner with prewritten responses.</p>
            <button className="btn ghost">Configure</button>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
