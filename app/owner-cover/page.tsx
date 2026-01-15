"use client";
import { useEffect,useState } from "react";
import { api } from "../../lib/api";
import { canUseRealtime, subscribeCollection, subscribeDoc } from "../../lib/realtime";
import { getAuth } from "../../lib/auth";

export default function OwnerCover() {
  const [settings,setSettings]=useState<any>(null);
  const [error,setError]=useState<string | null>(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [actions,setActions]=useState<any[]>([]);
  const [lastInbound,setLastInbound]=useState<any | null>(null);
  const [pendingApprovals,setPendingApprovals]=useState(0);
  const [minutesPerAction,setMinutesPerAction]=useState(2);

  useEffect(()=>{
    let active = true;
    let interval: number | null = null;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.ownerGet();
        if (active) {
          setSettings(data);
          setMinutesPerAction(Number(data?.minutesPerAction ?? 2));
        }
        const actionData = await api.actionQueue();
        if (active) {
          setActions(actionData || []);
          setPendingApprovals((actionData || []).filter((a:any) => a.status === "needs_approval").length);
        }
      } catch (e:any) {
        if (active) setError(e?.message || String(e));
      } finally {
        if (active) setLoading(false);
      }
    }
    const auth = getAuth();
    const uid = auth?.uid;
    if (uid && canUseRealtime()) {
      const unsubSettings = subscribeDoc(
        ["users", uid, "config", "ownerCover"],
        data => setSettings(data)
      );
      const unsubQueue = subscribeCollection(
        ["users", uid, "actionQueue"],
        "created_ts",
        rows => {
          setActions(rows);
          setPendingApprovals(rows.filter((a:any) => a.status === "needs_approval").length);
        }
      );
      if (!unsubSettings || !unsubQueue) {
        interval = window.setInterval(load, 5000);
      }
      return () => {
        active = false;
        if (typeof unsubSettings === "function") unsubSettings();
        if (typeof unsubQueue === "function") unsubQueue();
        if (interval) window.clearInterval(interval);
      };
    }
    load();
    interval = window.setInterval(load, 5000);
    return () => {
      active = false;
      if (interval) window.clearInterval(interval);
    };
  },[]);

  async function saveSettings() {
    setSaving(true);
    setError(null);
    try {
      const data = await api.ownerSet({ ...settings, minutesPerAction });
      setSettings(data);
    } catch (e:any) {
      setError(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  async function updateAction(id: string, status: string) {
    setError(null);
    try {
      await api.approveAction(id, status === "approved");
      const actionData = await api.actionQueue();
      setActions(actionData || []);
    } catch (e:any) {
      setError(e?.message || String(e));
    }
  }
  return (
    <div className="stagger">
      <div>
        <span className="pill">Owner Cover</span>
        <h2 className="section-title">Delegation without risk</h2>
        <p className="muted">
          The AI can act on your behalf — with guardrails, approvals, and full visibility.
        </p>
      </div>

      <div className="feature-grid">
        <div className="feature-card">
          <strong>Off</strong>
          <p className="muted">AI monitors activity only. No automated replies.</p>
        </div>
        <div className="feature-card">
          <strong>Monitor</strong>
          <p className="muted">AI drafts replies for approval before sending.</p>
        </div>
        <div className="feature-card">
          <strong>Auto-Send</strong>
          <p className="muted">AI responds within defined confidence and topic guardrails.</p>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
          <strong>Coverage settings</strong>
          <button className="btn ghost" onClick={()=>location.href="/contacts"}>View Contacts</button>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <span className="badge">{pendingApprovals} pending approvals</span>
        </div>
        {loading ? (
          <div className="muted" style={{ marginTop: 12 }}>Loading...</div>
        ) : error ? (
          <div className="muted" style={{ marginTop: 12 }}>Error: {error}</div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <div className="feature-grid">
              <div>
                <label className="muted">Mode</label>
                <select
                  className="select"
                  value={settings?.mode || "monitor"}
                  onChange={e=>setSettings({ ...settings, mode: e.target.value })}
                >
                  <option value="off">Off</option>
                  <option value="monitor">Monitor</option>
                  <option value="auto">Auto-Send</option>
                </select>
              </div>
              <div>
                <label className="muted">Confidence threshold</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settings?.confidenceThreshold ?? 0.85}
                  onChange={e=>setSettings({ ...settings, confidenceThreshold: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="muted">Quiet hours</label>
                <div className="row">
                  <select
                    className="select"
                    value={settings?.quietHoursEnabled ? "on" : "off"}
                    onChange={e=>setSettings({ ...settings, quietHoursEnabled: e.target.value === "on" })}
                  >
                    <option value="off">Disabled</option>
                    <option value="on">Enabled</option>
                  </select>
                  <input
                    className="input"
                    type="time"
                    value={settings?.quietHoursStart || "20:00"}
                    onChange={e=>setSettings({ ...settings, quietHoursStart: e.target.value })}
                  />
                  <input
                    className="input"
                    type="time"
                    value={settings?.quietHoursEnd || "07:00"}
                    onChange={e=>setSettings({ ...settings, quietHoursEnd: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label className="muted">Restricted topics (comma separated)</label>
              <input
                className="input"
                value={Array.isArray(settings?.restrictedTopics) ? settings.restrictedTopics.join(", ") : ""}
                onChange={e=>setSettings({
                  ...settings,
                  restrictedTopics: e.target.value.split(",").map(t => t.trim()).filter(Boolean)
                })}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <label className="muted">Minutes saved per AI action</label>
              <input
                className="input"
                type="number"
                min="1"
                step="1"
                value={minutesPerAction}
                onChange={e=>setMinutesPerAction(Number(e.target.value))}
              />
            </div>
            <div className="hero-actions">
              <button className="btn primary" disabled={saving} onClick={saveSettings}>
                {saving ? "Saving..." : "Save settings"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card" id="simulate-inbound">
        <h3 className="section-title">Simulate inbound</h3>
        <p className="muted">Watch how the AI decides, logs, and queues approvals.</p>
        <button className="btn primary" onClick={async()=>{
          try {
            const r=await api.ownerInbound({
              contact_id:"lead-1",
              channel:"webchat",
              text:"How much does it cost?"
            });
            setLastInbound(r);
            const actionData = await api.actionQueue();
            setActions(actionData || []);
          } catch (e:any) {
            setError(e?.message || String(e));
          }
        }}>Simulate Inbound</button>
        {lastInbound && (
          <pre style={{ marginTop: 12 }}>{JSON.stringify(lastInbound, null, 2)}</pre>
        )}
      </div>

      <div className="card">
        <h3 className="section-title">Action queue</h3>
        <p className="muted">Approve, deny, or review every AI action.</p>
        {actions.length === 0 ? (
          <div className="muted">No actions yet.</div>
        ) : (
          <div className="timeline">
            {actions.map(action => (
              <div className="timeline-item" key={action.id}>
                <span className="dot" />
                <div>
                  <strong>{action.action}</strong>
                  <div className="muted">{action.message}</div>
                  <div className="muted">Confidence: {action.confidence}</div>
                  <div className="row" style={{ marginTop: 8 }}>
                    <span className="badge">{action.status}</span>
                    {action.status === "needs_approval" && (
                      <>
                        <button className="btn ghost" onClick={()=>updateAction(action.id, "approved")}>Approve</button>
                        <button className="btn ghost" onClick={()=>updateAction(action.id, "denied")}>Deny</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="section-title">Guardrails</h3>
        <p className="muted">
          High-stakes topics route to approval. Every action is logged, visible, and reversible.
        </p>
        <div className="feature-grid" style={{ marginTop: 12 }}>
          <div className="feature-card">
            <strong>Confidence threshold</strong>
            <p className="muted">Auto-send only when confidence meets the floor.</p>
          </div>
          <div className="feature-card">
            <strong>Topic restrictions</strong>
            <p className="muted">Billing, complaints, and legal always escalate.</p>
          </div>
          <div className="feature-card">
            <strong>Full audit log</strong>
            <p className="muted">Every AI decision is recorded and explainable.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
