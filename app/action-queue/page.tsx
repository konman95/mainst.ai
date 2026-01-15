"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { subscribeCollection } from "../../lib/realtime";
import { getAuth } from "../../lib/auth";
import { useSearchParams } from "next/navigation";

export default function ActionQueue() {
  const [actions, setActions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"pending" | "all">("pending");
  const [tick, setTick] = useState(0);
  const searchParams = useSearchParams();
  const focusId = useMemo(() => searchParams?.get("action") || "", [searchParams]);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const data = await api.actionQueue();
      setActions(data || []);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let interval: number | null = null;
    const auth = getAuth();
    const uid = auth?.uid;
    if (uid) {
      const unsub = subscribeCollection(["users", uid, "actionQueue"], "created_ts", rows => setActions(rows));
      if (!unsub) {
        load();
        interval = window.setInterval(load, 5000);
      }
      return () => {
        if (typeof unsub === "function") unsub();
        if (interval) window.clearInterval(interval);
      };
    }
    load();
    return () => {};
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setTick(t => t + 1), 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (focusId) setView("all");
  }, [focusId]);

  useEffect(() => {
    if (!focusId) return;
    const el = document.getElementById(`action-${focusId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId, actions]);

  async function decide(id: string, approve: boolean) {
    setError(null);
    try {
      await api.approveAction(id, approve);
      await load();
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  async function approveAll() {
    setError(null);
    try {
      const pending = actions.filter(a => a.status === "needs_approval");
      for (const item of pending) {
        await api.approveAction(item.id, true);
      }
      await load();
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  const visible = view === "pending"
    ? actions.filter(a => a.status === "needs_approval")
    : actions;

  void tick;

  return (
    <div className="stagger">
      <div>
        <span className="pill">Approvals</span>
        <h2 className="section-title">Action queue</h2>
        <p className="muted">Approve, deny, or review queued actions.</p>
      </div>

      <div className="row">
        <button className="btn ghost" onClick={load}>Refresh</button>
        <select className="select" value={view} onChange={e=>setView(e.target.value as any)}>
          <option value="pending">Pending</option>
          <option value="all">All</option>
        </select>
        <button className="btn primary" onClick={approveAll}>Approve all</button>
      </div>

      {error && <div className="muted">Error: {error}</div>}

      <div className="card">
        {loading ? (
          <div className="muted">Loading...</div>
        ) : visible.length === 0 ? (
          <div className="muted">No actions in queue.</div>
        ) : (
          <div className="timeline">
            {visible.map((a: any) => (
              <div
                className={`timeline-item ${focusId && a.id === focusId ? "highlight" : ""}`}
                key={a.id}
                id={`action-${a.id}`}
              >
                <span className="dot" />
                <div>
                  <strong>Owner Cover action</strong>
                  <div className="muted">{a.draft || a.reason}</div>
                  <div className="muted">Status: {a.status}</div>
                  <div className="muted">Confidence: {a.confidence}</div>
                  <div className="row" style={{ marginTop: 6 }}>
                    <span className="badge">Priority {a.confidence >= 0.85 ? "High" : a.confidence >= 0.7 ? "Medium" : "Low"}</span>
                    {a.reason && a.reason.toLowerCase().includes("money") && (
                      <span className="badge">Risk: Money</span>
                    )}
                    {a.reason && a.reason.toLowerCase().includes("escalation") && (
                      <span className="badge">Risk: Escalation</span>
                    )}
                    {a.created_ts && (() => {
                      const ageMin = Math.max(0, Math.round((Date.now() / 1000 - a.created_ts) / 60));
                      const sla = ageMin >= 60 ? "Breach" : ageMin >= 30 ? "Warning" : "On time";
                      return (
                        <>
                          <span className="badge">Age {ageMin}m</span>
                          <span className="badge">SLA {sla}</span>
                        </>
                      );
                    })()}
                  </div>
                  <div className="row" style={{ marginTop: 8 }}>
                    {a.status === "needs_approval" && (
                      <>
                        <button className="btn ghost" onClick={() => decide(a.id, true)}>Approve</button>
                        <button className="btn ghost" onClick={() => decide(a.id, false)}>Deny</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
