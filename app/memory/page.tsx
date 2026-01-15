"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { canUseRealtime, subscribeCollection } from "../../lib/realtime";
import { getAuth } from "../../lib/auth";

export default function MemoryViewer() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [threads, setThreads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"timeline" | "decisions" | "outcomes">("timeline");

  async function loadContacts() {
    try {
      const data = await api.contacts();
      setContacts(data || []);
      if (data && data.length && !selected) {
        setSelected(data[0].id || "");
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  async function loadDetails(contactId: string) {
    if (!contactId) return;
    try {
      const t = await api.threads(contactId);
      setThreads(t || []);
      const d = await api.decisions(contactId);
      setDecisions(d || []);
      const o = await api.outcomes(contactId);
      setOutcomes(o || []);
      if (t && t.length) {
        const msgs = await api.threadMessages(t[0].id);
        setMessages(msgs || []);
      } else {
        setMessages([]);
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    }
  }

  useEffect(() => {
    const auth = getAuth();
    const uid = auth?.uid;
    if (uid && canUseRealtime()) {
      const unsub = subscribeCollection(["users", uid, "contacts"], "last_touch_ts", rows => {
        setContacts(rows);
        if (rows.length && !selected) setSelected(rows[0].id || "");
      });
      if (!unsub) loadContacts();
      return () => {
        if (typeof unsub === "function") unsub();
      };
    }
    loadContacts();
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const uid = auth?.uid;
    if (!selected) return;
    if (uid && canUseRealtime()) {
      const unsubThreads = subscribeCollection(["users", uid, "threads"], "last_message_ts", rows => {
        const filtered = rows.filter(r => r.contact_id === selected);
        setThreads(filtered);
        if (filtered.length) {
          api.threadMessages(filtered[0].id).then(setMessages).catch(() => {});
        } else {
          setMessages([]);
        }
      });
      const unsubDecisions = subscribeCollection(["users", uid, "decisions"], "created_ts", rows => {
        setDecisions(rows.filter(r => r.contact_id === selected));
      });
      const unsubOutcomes = subscribeCollection(["users", uid, "outcomes"], "ts", rows => {
        setOutcomes(rows.filter(r => r.contact_id === selected));
      });
      return () => {
        if (typeof unsubThreads === "function") unsubThreads();
        if (typeof unsubDecisions === "function") unsubDecisions();
        if (typeof unsubOutcomes === "function") unsubOutcomes();
      };
    }
    loadDetails(selected);
  }, [selected]);

  return (
    <div className="stagger">
      <div>
        <span className="pill">Memory System</span>
        <h2 className="section-title">Memory viewer</h2>
        <p className="muted">Contacts, threads, decisions, and outcomes in one place.</p>
      </div>

      {error && <div className="muted">Error: {error}</div>}

      <div className="feature-grid">
        <div className="card">
          <h3 className="section-title">Contacts</h3>
          {contacts.length === 0 ? (
            <div className="muted">No contacts yet.</div>
          ) : (
            <div className="timeline">
              {contacts.map(contact => (
                <div
                  className="timeline-item"
                  key={contact.id}
                  onClick={() => setSelected(contact.id)}
                  style={{ cursor: "pointer" }}
                >
                  <span className="dot" />
                  <div>
                    <strong>{contact.name || contact.id}</strong>
                    <div className="muted">{contact.email || "No email"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="section-title">Timeline</h3>
            <div className="row">
              <button className="btn ghost" onClick={()=>setActiveTab("timeline")}>Messages</button>
              <button className="btn ghost" onClick={()=>setActiveTab("decisions")}>Decisions</button>
              <button className="btn ghost" onClick={()=>setActiveTab("outcomes")}>Outcomes</button>
            </div>
          </div>

          {activeTab === "timeline" && (
            <div>
              {messages.length === 0 ? (
                <div className="muted">No messages for this contact.</div>
              ) : (
                <div className="timeline">
                  {messages.map((m: any, idx: number) => (
                    <div className="timeline-item" key={`${m.id || idx}`}>
                      <span className="dot" />
                      <div>
                        <strong>{m.role}</strong>
                        <div className="muted">{m.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "decisions" && (
            <div>
              {decisions.length === 0 ? (
                <div className="muted">No decisions for this contact.</div>
              ) : (
                <div className="timeline">
                  {decisions.map((d: any) => (
                    <div className="timeline-item" key={d.id}>
                      <span className="dot" />
                      <div>
                        <strong>{d.intent}</strong>
                        <div className="muted">{d.reason}</div>
                        <div className="row" style={{ marginTop: 6 }}>
                          <span className="badge">{d.decision}</span>
                          <span className="badge">Confidence {Math.round((d.confidence || 0) * 100)}%</span>
                          {d.risk !== undefined && (
                            <span className="badge">Risk {Math.round(d.risk * 100)}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "outcomes" && (
            <div>
              {outcomes.length === 0 ? (
                <div className="muted">No outcomes for this contact.</div>
              ) : (
                <div className="timeline">
                  {outcomes.map((o: any) => (
                    <div className="timeline-item" key={o.id}>
                      <span className="dot" />
                      <div>
                        <strong>{o.type}</strong>
                        <div className="muted">{o.note || "No note"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
