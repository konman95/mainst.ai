"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function Contacts() {
  const [contacts,setContacts]=useState<any[] | null>(null);
  const [error,setError]=useState<string | null>(null);
  const [editing,setEditing]=useState<any | null>(null);
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [notes,setNotes]=useState("");
  const [tags,setTags]=useState("");
  const [status,setStatus]=useState("new");

  async function load() {
    setError(null);
    try {
      const c = await api.contacts();
      setContacts(c || []);
    } catch (e: any) {
      setError(e?.message || String(e));
      setContacts(null);
    }
  }

  useEffect(()=>{
    let active = true;
    async function refresh() {
      if (!active) return;
      await load();
    }
    load();
    const interval = setInterval(refresh, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  },[]);

  function startNew() {
    setEditing({});
    setName("");
    setEmail("");
    setPhone("");
    setNotes("");
    setTags("");
    setStatus("new");
  }

  function startEdit(c:any) {
    setEditing(c);
    setName(c.name || "");
    setEmail(c.email || "");
    setPhone(c.phone || "");
    setNotes(c.notes || "");
    setTags(Array.isArray(c.tags) ? c.tags.join(", ") : "");
    setStatus(c.status || "new");
  }

  async function save() {
    try {
      if (editing?.id) {
        await api.updateContact(editing.id, {
          name,
          email,
          phone,
          notes,
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
          status
        });
      } else {
        await api.createContact({
          name,
          email,
          phone,
          notes,
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
          status
        });
      }
      setEditing(null);
      await load();
    } catch (e:any) {
      setError(e?.message || String(e));
    }
  }

  async function remove(id:string) {
    try {
      await api.deleteContact(id);
      await load();
    } catch (e:any) {
      setError(e?.message || String(e));
    }
  }

  return (
    <div className="stagger">
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span className="pill">Customer Book</span>
          <h2 className="section-title">Contacts</h2>
          <p className="muted">Lead status, notes, and last interaction — built for small teams.</p>
        </div>
        <div className="row">
          <button className="btn ghost" onClick={load}>Reload</button>
          <button className="btn primary" onClick={startNew}>New Contact</button>
        </div>
      </div>

      {error && <div className="muted">Error: {error}</div>}

      {editing && (
        <div className="card">
          <h3 className="section-title">{editing?.id ? "Edit Contact" : "New Contact"}</h3>
          <div className="feature-grid">
            <input className="input" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
            <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
            <input className="input" placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} />
            <select className="select" value={status} onChange={e=>setStatus(e.target.value)}>
              <option value="new">New lead</option>
              <option value="warm">Warm lead</option>
              <option value="hot">Hot lead</option>
              <option value="customer">Customer</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <textarea
            className="textarea"
            placeholder="Notes"
            value={notes}
            onChange={e=>setNotes(e.target.value)}
            style={{ marginTop: 12 }}
          />
          <input
            className="input"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={e=>setTags(e.target.value)}
            style={{ marginTop: 12 }}
          />
          <div className="row" style={{marginTop:8}}>
            <button className="btn primary" onClick={save}>Save</button>
            <button className="btn ghost" onClick={()=>setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      {!contacts ? (
        <div className="card">
          <div className="muted">No contacts loaded yet.</div>
        </div>
      ) : (
        <div className="feature-grid">
          {contacts.length === 0 && (
            <div className="card">
              <strong>No contacts found</strong>
              <div className="muted">Create your first contact to get started.</div>
            </div>
          )}
          {contacts.map((c,i)=> (
            <div className="feature-card" key={c.id || i}>
              <strong>{c.name || "Unnamed contact"}</strong>
              <div className="muted">{c.email || "No email on file"}</div>
              <div className="muted">{c.phone || "No phone on file"}</div>
              <div className="row" style={{ marginTop: 8 }}>
                <span className="badge">{c.status || "new"}</span>
                {Array.isArray(c.tags) && c.tags.length > 0 && (
                  <span className="badge">{c.tags.slice(0, 3).join(", ")}</span>
                )}
              </div>
              {c.notes && <div className="muted" style={{ marginTop: 8 }}>{c.notes}</div>}
              {c.lastContact && (
                <div className="muted" style={{ marginTop: 8 }}>
                  Last contact: {new Date(c.lastContact).toLocaleString()}
                </div>
              )}
              <div className="row" style={{marginTop:10}}>
                <button className="btn ghost" onClick={()=>startEdit(c)}>Edit</button>
                <button className="btn ghost" onClick={()=>remove(c.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
