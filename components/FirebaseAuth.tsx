"use client";
import { useEffect, useState } from "react";
import {
  getAuth as firebaseGetAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import firebaseApp from "../lib/firebase";
import { setAuth, clearAuth } from "../lib/auth";

export default function FirebaseAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = firebaseGetAuth(firebaseApp as any);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const token = await u.getIdToken();
          setAuth({ uid: u.uid, token });
        } catch (e) {
          console.error(e);
        }
      } else {
        setUser(null);
        clearAuth();
      }
    });
    return () => unsub();
  }, [auth]);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();
      setAuth({ uid: cred.user.uid, token });
      setUser(cred.user);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const token = await cred.user.getIdToken();
      setAuth({ uid: cred.user.uid, token });
      setUser(cred.user);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (!email) return setError("Enter email to reset password");
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setError("Password reset email sent.");
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await firebaseSignOut(auth);
    clearAuth();
    setUser(null);
  }

  return (
    <div className="stagger">
      <h3 className="section-title">Sign in</h3>
      {user ? (
        <div>
          <div className="muted">Signed in as {user.email || user.uid}</div>
          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={handleSignOut}>Sign out</button>
          </div>
        </div>
      ) : (
        <div>
          <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <div className="row">
            <button className="btn primary" onClick={handleSignIn} disabled={loading}>{loading?"Signing in...":"Sign in"}</button>
            <button className="btn ghost" onClick={handleGoogleSignIn} disabled={loading}>Sign in with Google</button>
          </div>
          <div style={{marginTop:8}}>
            <button className="btn ghost" onClick={handlePasswordReset}>Send password reset</button>
          </div>
          {error && <div className="muted">{error}</div>}
        </div>
      )}
    </div>
  );
}
