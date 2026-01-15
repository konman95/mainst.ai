"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { canUseRealtime, subscribeCollection } from "../../lib/realtime";
import { getAuth } from "../../lib/auth";

export default function Chat() {
  const [msg,setMsg]=useState("");
  const [out,setOut]=useState("");
  const [error,setError]=useState<string | null>(null);
  const [loading,setLoading]=useState(false);
  const [conversationId,setConversationId]=useState("");
  const [messages,setMessages]=useState<any[]>([]);
  const [manual,setManual]=useState("");

  useEffect(()=>{
    let active = true;
    let interval: number | null = null;
    async function loadHistory() {
      try {
        const data = await api.chatHistory(conversationId);
        if (active) setMessages(data || []);
      } catch (e:any) {
        if (active) setError(e?.message || String(e));
      }
    }
    if (!conversationId || !canUseRealtime()) {
      loadHistory();
      interval = window.setInterval(loadHistory, 5000);
      return () => {
        active = false;
        if (interval) window.clearInterval(interval);
      };
    }
    return () => {
      active = false;
      if (interval) window.clearInterval(interval);
    };
  },[conversationId]);
  useEffect(() => {
    const auth = getAuth();
    const uid = auth?.uid;
    if (!uid || !conversationId || !canUseRealtime()) return;
    const pathParts = ["users", uid, "threads", conversationId, "messages"];
    const unsub = subscribeCollection(pathParts, "ts", rows => setMessages(rows));
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [conversationId]);

  async function refreshHistory(nextId: string) {
    const data = await api.chatHistory(nextId);
    setMessages(data || []);
  }

  return (
    <div className="stagger">
      <div>
        <span className="pill">Smart Chat</span>
        <h2 className="section-title">Live conversation</h2>
        <p className="muted">Calm, professional responses that match your business voice.</p>
      </div>

      <div className="card">
        <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
          <strong>Conversation</strong>
          <span className="badge">Owner ready</span>
        </div>
        <div className="card tight" style={{ marginTop: 16 }}>
          {messages.length === 0 ? (
            <div className="muted">No messages yet.</div>
          ) : (
            <div className="timeline">
              {messages.map((m:any, idx:number) => (
                <div className="timeline-item" key={`${m.createdAt}-${idx}`}>
                  <span className="dot" />
                  <div>
                    <strong>{m.role === "assistant" ? "Assistant" : "Customer"}</strong>
                    <div className="muted">{m.text || m.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginTop: 16 }}>
          <input
            className="input"
            placeholder="Type a customer question..."
            value={msg}
            onChange={e=>setMsg(e.target.value)}
          />
        </div>
        <div className="hero-actions">
          <button className="btn primary" disabled={loading} onClick={async()=>{
            setLoading(true);
            setError(null);
            try {
              const r=await api.chat({message:msg, conversationId});
              setOut(r?.reply ?? "");
              if (r?.thread_id) setConversationId(r.thread_id);
              await refreshHistory(r?.thread_id || conversationId);
            } catch (e:any) {
              setError(e?.message || String(e));
            } finally {
              setLoading(false);
            }
          }}>{loading ? "Sending..." : "Send reply"}</button>
          <button className="btn ghost" onClick={()=>{ setMsg(""); setOut(""); }}>Clear</button>
        </div>
        {error && <div className="muted">Error: {error}</div>}
        <div className="card tight" style={{ marginTop: 16 }}>
          <div className="muted" style={{ marginBottom: 8 }}>Suggested response</div>
          <pre style={{ margin: 0 }}>{out || "No response yet."}</pre>
        </div>
        <div style={{ marginTop: 16 }}>
          <div className="muted" style={{ marginBottom: 8 }}>Manual override</div>
          <textarea
            className="textarea"
            placeholder="Edit or write a manual response..."
            value={manual}
            onChange={e=>setManual(e.target.value)}
          />
          <div className="row" style={{ marginTop: 8 }}>
            <button
              className="btn ghost"
              onClick={async()=>{
                if (!manual.trim()) return;
                try {
                  await api.chatManual({ conversationId, response: manual });
                  setManual("");
                  await refreshHistory(conversationId);
                } catch (e:any) {
                  setError(e?.message || String(e));
                }
              }}
            >
              Send manual reply
            </button>
          </div>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <span className="badge">Conversation: {conversationId || "default"}</span>
        </div>
      </div>
    </div>
  );
}
