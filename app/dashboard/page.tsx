"use client";
import { useEffect,useState } from "react";
import { api } from "../../lib/api";
import { canUseRealtime, subscribeCollection, subscribeDoc } from "../../lib/realtime";
import { getAuth } from "../../lib/auth";

export default function Dashboard() {
  const [health,setHealth]=useState<any>(null);
  const [error,setError]=useState<string | null>(null);
  const [loading,setLoading]=useState(true);
  const [audit,setAudit]=useState<any[]>([]);
  const [auditError,setAuditError]=useState<string | null>(null);
  const [summary,setSummary]=useState<any>(null);
  const [pendingApprovals,setPendingApprovals]=useState(0);
  const [weeklyMinutes,setWeeklyMinutes]=useState(0);
  const [profile,setProfile]=useState<any>(null);
  const [ownerCover,setOwnerCover]=useState<any>(null);
  const [savingCover,setSavingCover]=useState(false);
  const [confirmAutoSend,setConfirmAutoSend]=useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const h = await api.health();
      setHealth(h);
      const events = await api.audit();
      setAudit(events || []);
      const stats = await api.dashboardSummary();
      setSummary(stats || null);
      const weekly = await api.weeklySummary();
      setWeeklyMinutes(weekly?.minutes_saved || 0);
      const profileData = await api.profileGet();
      setProfile(profileData || null);
      const ownerData = await api.ownerGet();
      setOwnerCover(ownerData || null);
      const queue = await api.actionQueue();
      setPendingApprovals((queue || []).filter((r:any) => r.status === "needs_approval").length);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || String(e));
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{
    let active = true;
    let interval: number | null = null;
    const auth = getAuth();
    const uid = auth?.uid;

    const loadAudit = async () => {
      setAuditError(null);
      try {
        const events = await api.audit();
        if (active) setAudit(events || []);
      } catch (e:any) {
        if (active) setAuditError(e?.message || String(e));
      }
    };

    load();

    if (uid && canUseRealtime()) {
      const unsubAudit = subscribeCollection(
        ["users", uid, "auditLog"],
        "ts",
        rows => setAudit(rows)
      );
      const today = new Date();
      const day =
        today.getFullYear().toString() +
        String(today.getMonth() + 1).padStart(2, "0") +
        String(today.getDate()).padStart(2, "0");
      const unsubStats = subscribeDoc(
        ["users", uid, "stats", `daily_${day}`],
        data => setSummary({ day, stats: data || {} })
      );
      const unsubQueue = subscribeCollection(
        ["users", uid, "actionQueue"],
        "created_ts",
        rows => setPendingApprovals(rows.filter(r => r.status === "needs_approval").length)
      );

      if (!unsubAudit || !unsubStats || !unsubQueue) {
        interval = window.setInterval(load, 5000);
      } else {
        const weeklyPoll = async () => {
          try {
            const weekly = await api.weeklySummary();
            setWeeklyMinutes(weekly?.minutes_saved || 0);
          } catch {
            // ignore
          }
        };
        weeklyPoll();
        interval = window.setInterval(weeklyPoll, 60000);
      }

      return () => {
        active = false;
        if (typeof unsubAudit === "function") unsubAudit();
        if (typeof unsubStats === "function") unsubStats();
        if (typeof unsubQueue === "function") unsubQueue();
        if (interval) window.clearInterval(interval);
      };
    }

    interval = window.setInterval(load, 5000);
    return () => {
      active = false;
      if (interval) window.clearInterval(interval);
    };
  },[]);

  return (
    <div className="stagger">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span className="pill">Operational Coverage</span>
          <h2 className="section-title">Business control center</h2>
        </div>
        <div className="row">
          <button className="btn ghost" onClick={load}>Refresh</button>
          <a className="btn primary" href="/chat">Open Smart Chat</a>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-value">{summary?.stats?.chat_messages || 0}</div>
          <div className="muted">AI-handled messages today</div>
        </div>
        <div className="stat">
          <div className="stat-value">{summary?.stats?.decisions_made || 0}</div>
          <div className="muted">Decisions made today</div>
        </div>
        <div className="stat">
          <div className="stat-value">{summary?.stats?.autosent || 0}</div>
          <div className="muted">Auto-sent responses</div>
        </div>
        <div className="stat">
          <div className="stat-value">{summary?.stats?.minutes_saved || 0}</div>
          <div className="muted">Minutes saved today</div>
        </div>
        <div className="stat">
          <div className="stat-value">{weeklyMinutes}</div>
          <div className="muted">Minutes saved this week</div>
        </div>
        <div className="stat">
          <div className="stat-value">{pendingApprovals}</div>
          <div className="muted">Pending approvals</div>
        </div>
      </div>

      <div className="feature-grid">
        <div className="feature-card">
          <strong>Owner Cover status</strong>
          <p className="muted">
            Mode: {ownerCover?.mode || "monitor"} • {pendingApprovals} approvals awaiting review
          </p>
        </div>
        <div className="feature-card">
          <strong>Smart Chat queues</strong>
          <p className="muted">Active chats • median response under 2 minutes</p>
        </div>
        <div className="feature-card">
          <strong>Lead pipeline</strong>
          <p className="muted">New leads tracked with last-contact visibility</p>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Setup status</h3>
        <div className="timeline">
          <div className="timeline-item">
            <span className="dot" />
            <div>
              <strong>Business profile</strong>
              <div className="muted">
                {profile?.name ? "Configured" : "Add your business name and services"}
              </div>
            </div>
          </div>
          <div className="timeline-item">
            <span className="dot" />
            <div>
              <strong>Hours and policies</strong>
              <div className="muted">
                {profile?.hours ? "Configured" : "Set hours and policies for safe responses"}
              </div>
            </div>
          </div>
          <div className="timeline-item">
            <span className="dot" />
            <div>
              <strong>Owner Cover settings</strong>
              <div className="muted">
                {ownerCover?.mode ? `Mode: ${ownerCover.mode}` : "Choose Off, Monitor, or Auto-Send"}
              </div>
            </div>
          </div>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <a className="btn ghost" href="/profile">Edit Business Profile</a>
          <a className="btn ghost" href="/owner-cover">Configure Owner Cover</a>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Next best actions</h3>
        <div className="timeline">
          {!profile?.name && (
            <div className="timeline-item">
              <span className="dot" />
              <div>
                <strong>Add business name and services</strong>
                <div className="muted">Improves accuracy and confident responses.</div>
              </div>
            </div>
          )}
          {!profile?.hours && (
            <div className="timeline-item">
              <span className="dot" />
              <div>
                <strong>Set business hours</strong>
                <div className="muted">Prevents after-hours replies and misrouting.</div>
              </div>
            </div>
          )}
          {!profile?.policies && (
            <div className="timeline-item">
              <span className="dot" />
              <div>
                <strong>Add policies and restrictions</strong>
                <div className="muted">Keeps Owner Cover within safe boundaries.</div>
              </div>
            </div>
          )}
          {pendingApprovals > 0 && (
            <div className="timeline-item">
              <span className="dot" />
              <div>
                <strong>Review pending approvals</strong>
                <div className="muted">{pendingApprovals} items are waiting.</div>
              </div>
            </div>
          )}
          {profile?.name && profile?.hours && profile?.policies && pendingApprovals === 0 && (
            <div className="timeline-item">
              <span className="dot" />
              <div>
                <strong>System is ready</strong>
                <div className="muted">Owner Cover can be enabled safely.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Coverage readiness</h3>
        <div className="row">
          <span className="badge">
            {ownerCover?.mode === "autosend"
              ? "Auto-Send ready"
              : ownerCover?.mode === "monitor"
                ? "Monitor mode"
                : "Coverage off"}
          </span>
          <span className="muted">
            {ownerCover?.mode === "autosend"
              ? "Guardrails enabled. System can respond automatically."
              : ownerCover?.mode === "monitor"
                ? "Approvals required. Safe to review drafts."
                : "Enable Owner Cover to activate coverage."}
          </span>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          {ownerCover?.mode !== "monitor" && (
            <button
              className="btn ghost"
              disabled={savingCover}
              onClick={async()=>{
                setSavingCover(true);
                try {
                  const next = await api.ownerSet({ ...ownerCover, mode: "monitor" });
                  setOwnerCover(next);
                } finally {
                  setSavingCover(false);
                }
              }}
            >
              Enable Monitor Mode
            </button>
          )}
          {(() => {
            const fields = [
              profile?.name,
              profile?.services,
              profile?.hours,
              profile?.serviceArea,
              profile?.pricingNotes,
              profile?.policies,
              profile?.tone
            ];
            const filled = fields.filter(v => String(v || "").trim().length > 0).length;
            const score = Math.round((filled / fields.length) * 100);
            const canAutosend = score >= 85 && pendingApprovals === 0;
            if (!canAutosend || ownerCover?.mode === "autosend") return null;
            return (
              <button
                className="btn primary"
                disabled={savingCover}
                onClick={()=>setConfirmAutoSend(true)}
              >
                Start Auto-Send
              </button>
            );
          })()}
        </div>
      </div>

      {confirmAutoSend && (
        <div className="card">
          <h3 className="section-title">Enable Auto‑Send?</h3>
          <p className="muted">
            Auto‑Send allows the AI to respond automatically within your guardrails. You can switch back to
            Monitor at any time.
          </p>
          <div className="row">
            <button
              className="btn primary"
              disabled={savingCover}
              onClick={async()=>{
                setSavingCover(true);
                try {
                  const next = await api.ownerSet({ ...ownerCover, mode: "autosend" });
                  setOwnerCover(next);
                  setConfirmAutoSend(false);
                } finally {
                  setSavingCover(false);
                }
              }}
            >
              Confirm Auto‑Send
            </button>
            <button className="btn ghost" onClick={()=>setConfirmAutoSend(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="section-title">Setup score</h3>
        <div className="row" style={{ alignItems: "center" }}>
          <span className="badge">
            {(() => {
              const fields = [
                profile?.name,
                profile?.services,
                profile?.hours,
                profile?.serviceArea,
                profile?.pricingNotes,
                profile?.policies,
                profile?.tone
              ];
              const filled = fields.filter(v => String(v || "").trim().length > 0).length;
              const score = Math.round((filled / fields.length) * 100);
              return `${score}% complete`;
            })()}
          </span>
          <span className="muted">
            {profile?.name && profile?.hours && profile?.policies
              ? "Core configuration is set."
              : "Complete your business context to unlock safe automation."}
          </span>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Live activity</h3>
        <p className="muted">Decisions and approvals as they happen.</p>
        {audit.length === 0 ? (
          <div className="muted">No activity yet.</div>
        ) : (
          <div className="timeline">
            {audit.slice(0, 6).map((event:any) => (
              <div className="timeline-item" key={`live-${event.id}`}>
                <span className="dot" />
                <div>
                  <strong>{event.type || "Event"}</strong>
                  {event.in && <div className="muted">Inbound: {event.in}</div>}
                  {event.out && <div className="muted">Response: {event.out}</div>}
                  {event.decision?.decision && (
                    <div className="muted">Decision: {event.decision.decision}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="section-title">Live ROI</h3>
        <div className="feature-grid">
          <div className="feature-card">
            <strong>Messages handled today</strong>
            <div className="stat-value">{summary?.stats?.chat_messages || 0}</div>
            <div className="muted">Trend: steady</div>
          </div>
          <div className="feature-card">
            <strong>Minutes saved this week</strong>
            <div className="stat-value">{weeklyMinutes}</div>
            <div className="muted">Trend: positive</div>
          </div>
          <div className="feature-card">
            <strong>Auto-sent rate</strong>
            <div className="stat-value">
              {summary?.stats?.decisions_made
                ? Math.round((summary?.stats?.autosent || 0) / summary?.stats?.decisions_made * 100)
                : 0}%
            </div>
            <div className="muted">Trend: stable</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">System health</h3>
        {loading ? (
          <div className="muted">Loading...</div>
        ) : error ? (
          <div>
            <div className="muted">Failed to load health: {error}</div>
            <div className="row" style={{marginTop:12}}>
              <button className="btn" onClick={load}>Retry</button>
            </div>
          </div>
        ) : (
          <pre>{JSON.stringify(health,null,2)}</pre>
        )}
      </div>

      <div className="card">
        <h3 className="section-title">Audit feed (trust layer)</h3>
        {auditError && <div className="muted">Error: {auditError}</div>}
        {audit.length === 0 ? (
          <div className="muted">No audit events yet.</div>
        ) : (
          <div className="timeline">
            {audit.slice(0, 8).map((event:any) => (
              <div className="timeline-item" key={event.id}>
                <span className="dot" />
                <div>
                  <strong>{event.type || "Audit event"}</strong>
                  {event.in && <div className="muted">Inbound: {event.in}</div>}
                  {event.out && <div className="muted">Response: {event.out}</div>}
                  {event.reason && <div className="muted">Reason: {event.reason}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="section-title">Decision breakdowns</h3>
        <p className="muted">
          Every AI response includes a reason, confidence, and outcome — so approvals are fast and safe.
        </p>
        {audit.length === 0 ? (
          <div className="muted" style={{ marginTop: 16 }}>
            No decision data yet. Once chats and Owner Cover run, breakdowns appear here.
          </div>
        ) : (
          <div className="timeline" style={{ marginTop: 16 }}>
            {audit.slice(0, 6).map((event:any) => (
              <div className="timeline-item" key={`decision-${event.id}`}>
                <span className="dot" />
                <div>
                  <strong>{event.decision?.intent || event.type || "Decision"}</strong>
                  {event.decision?.reason && <div className="muted">{event.decision.reason}</div>}
                  {event.decision?.confidence !== undefined && (
                    <div className="muted">Confidence: {event.decision.confidence}</div>
                  )}
                  {event.decision?.decision && (
                    <div className="muted">Outcome: {event.decision.decision}</div>
                  )}
                  {!event.decision && event.in && <div className="muted">Inbound: {event.in}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
