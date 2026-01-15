"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function OrgAnalytics() {
  const [summary, setSummary] = useState<any>(null);
  const [weekly, setWeekly] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [daySummary, weekSummary] = await Promise.all([
          api.orgSummary(),
          api.orgWeeklySummary()
        ]);
        if (active) {
          setSummary(daySummary);
          setWeekly(weekSummary);
        }
      } catch (e: any) {
        if (active) setError(e?.message || String(e));
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const totals = summary?.totals || {};
  const weeklyTotals = weekly?.totals || {};

  return (
    <div className="stagger">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span className="pill">Org Analytics</span>
          <h2 className="section-title">Cross-workspace intelligence</h2>
        </div>
        <a className="btn primary" href="/dashboard">Back to Dashboard</a>
      </div>

      {error && <div className="muted">Error: {error}</div>}

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-value">{totals.chat_messages || 0}</div>
          <div className="muted">Messages today</div>
        </div>
        <div className="stat">
          <div className="stat-value">{totals.decisions_made || 0}</div>
          <div className="muted">Decisions today</div>
        </div>
        <div className="stat">
          <div className="stat-value">{totals.autosent || 0}</div>
          <div className="muted">Auto-sent today</div>
        </div>
        <div className="stat">
          <div className="stat-value">{totals.minutes_saved || 0}</div>
          <div className="muted">Minutes saved today</div>
        </div>
        <div className="stat">
          <div className="stat-value">{weeklyTotals.minutes_saved || 0}</div>
          <div className="muted">Minutes saved (7d)</div>
        </div>
        <div className="stat">
          <div className="stat-value">{summary?.workspaces?.length || 0}</div>
          <div className="muted">Active workspaces</div>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Workspace breakdown</h3>
        {summary?.workspaces?.length ? (
          <div className="table" style={{ marginTop: 12 }}>
            <div className="table-row table-header">
              <span>Workspace</span>
              <span>Messages</span>
              <span>Decisions</span>
              <span>Minutes saved</span>
            </div>
            {summary.workspaces.map((ws: any) => (
              <div className="table-row" key={ws.id}>
                <div>
                  <strong>{ws.name}</strong>
                  <div className="muted">ID: {ws.id}</div>
                </div>
                <span className="muted">{ws.stats?.chat_messages || 0}</span>
                <span className="muted">{ws.stats?.decisions_made || 0}</span>
                <span className="muted">{ws.stats?.minutes_saved || 0}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="muted">No workspace stats yet.</div>
        )}
      </div>
    </div>
  );
}
