"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Profile = {
  name: string;
  services: string;
  hours: string;
  serviceArea: string;
  pricingNotes: string;
  policies: string;
  tone: string;
};

const emptyProfile: Profile = {
  name: "",
  services: "",
  hours: "",
  serviceArea: "",
  pricingNotes: "",
  policies: "",
  tone: "Calm, professional, concise."
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.profileGet();
        if (active && data) setProfile({ ...emptyProfile, ...data });
      } catch (e: any) {
        if (active) setError(e?.message || String(e));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const data = await api.profileSet(profile);
      setProfile({ ...emptyProfile, ...data });
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  function completeness() {
    const fields = [
      profile.name,
      profile.services,
      profile.hours,
      profile.serviceArea,
      profile.pricingNotes,
      profile.policies,
      profile.tone
    ];
    const filled = fields.filter(value => String(value || "").trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }

  const percent = completeness();

  return (
    <div className="stagger">
      <div>
        <span className="pill">Business Context</span>
        <h2 className="section-title">Business profile</h2>
        <p className="muted">
          This is the source of truth for Smart Chat and Owner Cover decisions.
        </p>
      </div>

      <div className="card">
        <h3 className="section-title">Profile completeness</h3>
        <div className="row" style={{ alignItems: "center" }}>
          <div className="badge">{percent}% complete</div>
          <div className="muted">
            {percent < 60 && "Add services, hours, and policies to unlock safe auto‑responses."}
            {percent >= 60 && percent < 90 && "Almost there. Fill pricing notes and policies."}
            {percent >= 90 && "Profile looks solid. You can enable Auto‑Send safely."}
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="muted">Loading...</div>
        ) : (
          <>
            <div className="feature-grid">
              <div>
                <label className="muted">Business name</label>
                <input
                  className="input"
                  value={profile.name}
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div>
                <label className="muted">Hours</label>
                <input
                  className="input"
                  value={profile.hours}
                  onChange={e => setProfile({ ...profile, hours: e.target.value })}
                />
              </div>
              <div>
                <label className="muted">Service area</label>
                <input
                  className="input"
                  value={profile.serviceArea}
                  onChange={e => setProfile({ ...profile, serviceArea: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label className="muted">Services offered</label>
              <textarea
                className="textarea"
                value={profile.services}
                onChange={e => setProfile({ ...profile, services: e.target.value })}
              />
            </div>

            <div className="feature-grid" style={{ marginTop: 16 }}>
              <div>
                <label className="muted">Pricing notes</label>
                <textarea
                  className="textarea"
                  value={profile.pricingNotes}
                  onChange={e => setProfile({ ...profile, pricingNotes: e.target.value })}
                />
              </div>
              <div>
                <label className="muted">Policies</label>
                <textarea
                  className="textarea"
                  value={profile.policies}
                  onChange={e => setProfile({ ...profile, policies: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label className="muted">Tone and behavior guidance</label>
              <textarea
                className="textarea"
                value={profile.tone}
                onChange={e => setProfile({ ...profile, tone: e.target.value })}
              />
            </div>
          </>
        )}

        {error && <div className="muted">Error: {error}</div>}
        <div className="hero-actions">
          <button className="btn primary" disabled={saving} onClick={save}>
            {saving ? "Saving..." : "Save profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
