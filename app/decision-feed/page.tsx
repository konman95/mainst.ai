"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { subscribeCollection } from "../../lib/realtime";
import { getAuth } from "../../lib/auth";

export default function DecisionFeed() {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const data = await api.decisions();
      setDecisions(data || []);
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
      const unsub = subscribeCollection(["users", uid, "decisions"], "created_ts", rows => setDecisions(rows));
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

  const filtered = decisions.filter(d => {
    if (filter === "all") return true;
    if (filter === "send") return d.decision === "send";
    if (filter === "queue") return d.decision === "queue";
    if (filter === "block") return d.decision === "block";
    return true;
  });

  return (
    <div className="stagger">
      <div>
        <span className="pill">Decision Core</span>
        <h2 className="section-title">Decision feed</h2>
        <p className="muted">Every AI decision, in order, with reason and confidence.</p>
      </div>

      <div className="row">
        <button className="btn ghost" onClick={load}>Refresh</button>
        <select className="select" value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="send">Sent</option>
          <option value="queue">Queued</option>
          <option value="block">Blocked</option>
        </select>
      </div>

      {error && <div className="muted">Error: {error}</div>}

      <div className="card">
        {loading ? (
          <div className="muted">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="muted">No decisions yet.</div>
        ) : (
          <div className="timeline">
            {filtered.map((d: any) => (
              <div className="timeline-item" key={d.id}>
                <span className="dot" />
                <div>
                  <strong>{d.intent || "decision"}</strong>
                  <div className="row" style={{ marginTop: 6 }}>
                    <span className="badge">{d.decision}</span>
                    <span className="badge">Confidence {Math.round((d.confidence || 0) * 100)}%</span>
                    {d.risk !== undefined && (
                      <span className="badge">Risk {Math.round(d.risk * 100)}%</span>
                    )}
                  </div>
                  <div className="muted" style={{ marginTop: 6 }}>{d.reason}</div>
                  <div className="muted">Contact: {d.contact_id}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
