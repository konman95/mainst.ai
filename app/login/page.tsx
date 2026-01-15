"use client";
import { useState } from "react";
import FirebaseAuth from "../../components/FirebaseAuth";
import { setAuth } from "../../lib/auth";

export default function Login() {
  const [uid,setUid]=useState("123");
  const [token,setToken]=useState("dev-123");
  const [showDev, setShowDev] = useState(process.env.NEXT_PUBLIC_SHOW_DEVTOOLS === "true");
  return (
    <div className="hero">
      <div className="card fade-up">
        <span className="pill">Secure Sign In</span>
        <h2 className="section-title">Welcome back</h2>
        <p className="muted">Sign in to keep coverage, chat history, and owner handoffs flowing.</p>
        <div style={{ marginTop: 16 }}>
          <FirebaseAuth />
        </div>
        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn ghost" onClick={() => setShowDev(v => !v)}>
            {showDev ? "Hide developer access" : "Developer access"}
          </button>
        </div>
      </div>

      {showDev && (
        <div className="card fade-up">
          <span className="pill">Developer Access</span>
          <h3 className="section-title">Local login</h3>
          <p className="muted">
            For local development or demo access without Firebase.
          </p>
          <div style={{ marginTop: 12 }}>
            <input className="input" value={uid} onChange={e=>setUid(e.target.value)} />
            <input className="input" value={token} onChange={e=>setToken(e.target.value)} />
          </div>
          <div className="hero-actions">
            <button className="btn primary" onClick={()=>{
              setAuth({uid,token});
              location.href="/dashboard";
            }}>Sign in</button>
            <a className="btn ghost" href="/">Back to Home</a>
          </div>
        </div>
      )}
    </div>
  );
}
