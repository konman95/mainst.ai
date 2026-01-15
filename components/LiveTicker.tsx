"use client";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { subscribeCollection, subscribeDoc } from "../lib/realtime";
import { getAuth } from "../lib/auth";

export default function LiveTicker() {
  const [summary, setSummary] = useState<any>(null);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let interval: number | null = null;
    const auth = getAuth();
    const uid = auth?.uid;
    if (!uid) return;

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
      rows => setPending(rows.filter(r => r.status === "needs_approval").length)
    );

    if (!unsubStats || !unsubQueue) {
      const poll = async () => {
        try {
          const data = await api.dashboardSummary();
          setSummary(data || null);
          const queue = await api.actionQueue();
          setPending((queue || []).filter((r: any) => r.status === "needs_approval").length);
        } catch {
          // ignore poll errors
        }
      };
      poll();
      interval = window.setInterval(poll, 5000);
    }

    return () => {
      if (typeof unsubStats === "function") unsubStats();
      if (typeof unsubQueue === "function") unsubQueue();
      if (interval) window.clearInterval(interval);
    };
  }, []);

  const stats = summary?.stats || {};
  return (
    <div className="card tight" style={{ margin: "16px auto", maxWidth: 1100 }}>
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div className="muted">
          AI handled <strong>{stats.chat_messages || 0}</strong> messages today
        </div>
        <div className="muted">
          <strong>{pending}</strong> pending approvals
        </div>
        <div className="muted">
          Saved <strong>{stats.minutes_saved || 0}</strong> minutes today
        </div>
      </div>
    </div>
  );
}
