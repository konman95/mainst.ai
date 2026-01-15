"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { subscribeCollection } from "../../lib/realtime";
import { getAuth } from "../../lib/auth";

const outcomeTypes = [
  "won",
  "lost",
  "resolved",
  "satisfied",
  "unsatisfied",
  "owner_intervened",
  "follow_up_success",
  "follow_up_failed"
];

export default function OutcomesPage() {
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactId, setContactId] = useState("");
  const [threadId, setThreadId] = useState("");
  const [type, setType] = useState(outcomeTypes[0]);
  const [note, setNote] = useState("");

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const data = await api.outcomes();
      setOutcomes(data || []);
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
      const unsub = subscribeCollection(["users", uid, "outcomes"], "ts", rows => setOutcomes(rows));
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

  async function submit() {
    setError(null);
    try {
      await api.createOutcome({
        id: "",
        contact_id: contactId || "unknown",
        thread_id: threadId || "unknown",
        type,
        note
      });
      setContactId("");
      setThreadId("");
      setNote("");
      await load();
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  return (
    <div className="stagger">
      <div>
        <span className="pill">Outcomes</span>
        <h2 className="section-title">Outcome tracking</h2>
        <p className="muted">Close the loop to measure impact and improve decisions.</p>
      </div>

      <div className="card">
        <h3 className="section-title">Record outcome</h3>
        <div className="feature-grid">
          <input
            className="input"
            placeholder="Contact ID"
            value={contactId}
            onChange={e => setContactId(e.target.value)}
          />
          <input
            className="input"
            placeholder="Thread ID"
            value={threadId}
            onChange={e => setThreadId(e.target.value)}
          />
          <select className="select" value={type} onChange={e => setType(e.target.value)}>
            {outcomeTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <textarea
          className="textarea"
          placeholder="Outcome note"
          value={note}
          onChange={e => setNote(e.target.value)}
          style={{ marginTop: 12 }}
        />
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn primary" onClick={submit}>Save outcome</button>
        </div>
      </div>

      {error && <div className="muted">Error: {error}</div>}

      <div className="card">
        <h3 className="section-title">Outcome log</h3>
        {loading ? (
          <div className="muted">Loading...</div>
        ) : outcomes.length === 0 ? (
          <div className="muted">No outcomes recorded yet.</div>
        ) : (
          <div className="timeline">
            {outcomes.map((o: any) => (
              <div className="timeline-item" key={o.id}>
                <span className="dot" />
                <div>
                  <strong>{o.type}</strong>
                  <div className="muted">Contact: {o.contact_id}</div>
                  <div className="muted">{o.note || "No note"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
