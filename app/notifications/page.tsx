"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Alert = {
  id: string;
  title: string;
  detail: string;
  severity: "low" | "medium" | "high";
  status: "new" | "acknowledged" | "resolved";
  time?: string;
  ts?: number;
  tags?: string[];
  link?: string;
  action_id?: string;
  decision_id?: string;
};

const defaultAlerts: Alert[] = [
  {
    id: "alert-1",
    title: "Approval queue breach",
    detail: "2 actions pending for more than 30 minutes.",
    severity: "high",
    status: "new",
    time: "Just now",
    tags: ["sla", "queue"]
  },
  {
    id: "alert-2",
    title: "Owner Cover paused",
    detail: "Auto-send disabled after confidence drop.",
    severity: "medium",
    status: "acknowledged",
    time: "Today · 2:12 PM",
    tags: ["ownercover", "mode"]
  },
  {
    id: "alert-3",
    title: "New lead escalation",
    detail: "Complaint flagged and queued for review.",
    severity: "high",
    status: "new",
    time: "Today · 11:04 AM",
    tags: ["escalation", "complaint"]
  },
  {
    id: "alert-4",
    title: "Weekly report ready",
    detail: "Operator summary is ready to download.",
    severity: "low",
    status: "resolved",
    time: "Yesterday · 4:33 PM",
    tags: ["report"]
  }
];

export default function Notifications() {
  const [alerts, setAlerts] = useState<Alert[]>(defaultAlerts);
  const [filter, setFilter] = useState<"all" | "new" | "acknowledged" | "resolved">("all");

  useEffect(() => {
    api.notifications()
      .then((data) => setAlerts(data || defaultAlerts))
      .catch(() => setAlerts(defaultAlerts));
  }, []);

  function updateAlert(id: string, status: Alert["status"]) {
    const next = alerts.map(alert => (alert.id === id ? { ...alert, status } : alert));
    setAlerts(next);
    api.notificationsUpdate({ id, status }).catch(() => null);
  }

  const visible = alerts.filter(alert => (filter === "all" ? true : alert.status === filter));

  return (
    <div className="stagger">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span className="pill">Notifications</span>
          <h2 className="section-title">Operational alerts and escalations</h2>
        </div>
        <div className="row">
          <button className="btn ghost" onClick={() => setFilter("all")}>All</button>
          <button className="btn ghost" onClick={() => setFilter("new")}>New</button>
          <button className="btn ghost" onClick={() => setFilter("acknowledged")}>Ack</button>
          <button className="btn ghost" onClick={() => setFilter("resolved")}>Resolved</button>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Alert feed</h3>
        {visible.length === 0 ? (
          <div className="muted">No alerts in this view.</div>
        ) : (
          <div className="table" style={{ marginTop: 12 }}>
            <div className="table-row table-header">
              <span>Alert</span>
              <span>Severity</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {visible.map(alert => {
              const timeLabel = alert.time
                ? alert.time
                : alert.ts
                  ? new Date(alert.ts * 1000).toLocaleString()
                  : "Just now";
              const link =
                alert.link
                  ? alert.action_id
                    ? `${alert.link}?action=${encodeURIComponent(alert.action_id)}`
                    : alert.link
                  : alert.action_id
                    ? `/action-queue?action=${encodeURIComponent(alert.action_id)}`
                    : null;
              return (
              <div className="table-row" key={alert.id}>
                <div>
                  <strong>{alert.title}</strong>
                  <div className="muted">{alert.detail}</div>
                  <div className="muted">{timeLabel}</div>
                  {alert.tags && alert.tags.length > 0 && (
                    <div className="row" style={{ marginTop: 6 }}>
                      {alert.tags.map(tag => (
                        <span className="badge" key={`${alert.id}-${tag}`}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`status-pill ${alert.severity === "high" ? "warn" : ""}`}>
                  <span className="status-dot" />
                  {alert.severity}
                </span>
                <span className={`status-pill ${alert.status === "resolved" ? "" : "warn"}`}>
                  <span className="status-dot" />
                  {alert.status}
                </span>
                <div className="row">
                  {link && (
                    <a className="btn ghost" href={link}>
                      Open
                    </a>
                  )}
                  {alert.status !== "acknowledged" && (
                    <button className="btn ghost" onClick={() => updateAlert(alert.id, "acknowledged")}>
                      Acknowledge
                    </button>
                  )}
                  {alert.status !== "resolved" && (
                    <button className="btn ghost" onClick={() => updateAlert(alert.id, "resolved")}>
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}
