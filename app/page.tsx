export default function Home() {
  return (
    <div className="stagger">
      <div className="hero">
        <div className="fade-up">
          <span className="pill">Owner Coverage</span>
          <h1 className="hero-title">Main St AI covers your business when you can’t.</h1>
          <p className="hero-sub muted">
            This isn’t another AI tool. It’s operational coverage — a calm, professional front desk that
            keeps your business responsive, safe, and in control when you step away.
          </p>
          <div className="hero-actions">
            <a className="btn primary" href="/login">Get Started</a>
            <a className="btn ghost" href="/owner-cover">See Owner Cover</a>
          </div>
          <div className="row" style={{ marginTop: 16 }}>
            <span className="badge">Delegated response</span>
            <span className="badge">Guardrails + approvals</span>
            <span className="badge">Full audit trail</span>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">Built for real operations</h3>
          <div className="feature-grid">
            <div className="feature-card">
              <strong>Always-on front desk</strong>
              <p className="muted">AI handles routine inbound while you focus on delivery.</p>
            </div>
            <div className="feature-card">
              <strong>Approval-first safety</strong>
              <p className="muted">High-risk topics pause for review with full context.</p>
            </div>
            <div className="feature-card">
              <strong>Audit trail</strong>
              <p className="muted">Every action is logged for visibility and trust.</p>
            </div>
          </div>
          <div className="callout" style={{ marginTop: 16 }}>
            This is your operating layer — not a chatbot. It keeps the business running when you can’t.
          </div>
        </div>
      </div>

      <div className="feature-grid">
        <div className="feature-card">
          <strong>Operational coverage</strong>
          <p className="muted">
            A single, calm control center that keeps the front office running without you.
          </p>
        </div>
        <div className="feature-card">
          <strong>Smart Chat (business voice)</strong>
          <p className="muted">
            Replies with authority — grounded in business context, not generic chatbot behavior.
          </p>
        </div>
        <div className="feature-card">
          <strong>CRM‑lite, owner‑first</strong>
          <p className="muted">
            Contacts, notes, lead status, and history — simple, useful, and built for SMBs.
          </p>
        </div>
      </div>

      <div className="card">
        <span className="pill">Owner Cover Mode</span>
        <h2 className="section-title">Delegation without losing control</h2>
        <p className="muted">
          The AI can act — with boundaries, approvals, and a full audit trail. You decide how much it does.
        </p>
        <div className="feature-grid" style={{ marginTop: 16 }}>
          <div className="feature-card">
            <strong>Off</strong>
            <p className="muted">AI monitors but takes no action.</p>
          </div>
          <div className="feature-card">
            <strong>Monitor</strong>
            <p className="muted">AI drafts responses and waits for approval.</p>
          </div>
          <div className="feature-card">
            <strong>Auto-Send</strong>
            <p className="muted">AI responds within guardrails you set.</p>
          </div>
        </div>
      </div>

      <div className="card">
        <span className="pill">Proof of autonomy</span>
        <h2 className="section-title">Decision breakdowns, not blind promises</h2>
        <p className="muted">
          Every response is explainable. You see what it decided, why it decided it, and what it did next.
        </p>
        <div className="timeline" style={{ marginTop: 16 }}>
          <div className="timeline-item">
            <span className="dot" />
            <div>
              <strong>Inbound classified as Pricing</strong>
              <div className="muted">Confidence 0.92 • Allowed topic</div>
              <div className="muted">Action: Auto‑Send response within guardrails</div>
            </div>
          </div>
          <div className="timeline-item">
            <span className="dot" />
            <div>
              <strong>Inbound classified as Complaint</strong>
              <div className="muted">Confidence 0.78 • Restricted topic</div>
              <div className="muted">Action: Queued for approval</div>
            </div>
          </div>
          <div className="timeline-item">
            <span className="dot" />
            <div>
              <strong>Follow‑up scheduled</strong>
              <div className="muted">Lead status: Warm • Quiet hours respected</div>
              <div className="muted">Action: Drafted and queued</div>
            </div>
          </div>
        </div>
      </div>

      <div className="feature-grid">
        <div className="feature-card">
          <strong>Guardrails, not blind automation</strong>
          <p className="muted">
            Confidence thresholds, escalation rules, and topic restrictions keep the business safe.
          </p>
        </div>
        <div className="feature-card">
          <strong>Audit-ready by default</strong>
          <p className="muted">
            Every decision is logged, explainable, and reversible for complete transparency.
          </p>
        </div>
        <div className="feature-card">
          <strong>No phone calls (yet)</strong>
          <p className="muted">
            Messaging first for speed, simplicity, and rapid value. Voice is built to plug in later.
          </p>
        </div>
      </div>

      <div className="card">
        <span className="pill">Trust layer</span>
        <h2 className="section-title">You see everything the AI does</h2>
        <p className="muted">
          Confidence scores, reasoning, and approvals are visible in real time — so trust is earned, not assumed.
        </p>
        <div className="feature-grid" style={{ marginTop: 16 }}>
          <div className="feature-card">
            <strong>Approval queue</strong>
            <p className="muted">Review drafts before they go out, or let safe ones send.</p>
          </div>
          <div className="feature-card">
            <strong>Audit log</strong>
            <p className="muted">Every inbound, response, and decision is recorded.</p>
          </div>
          <div className="feature-card">
            <strong>Explainable actions</strong>
            <p className="muted">“AI did this because…” is always available.</p>
          </div>
        </div>
      </div>

      <div className="card">
        <span className="pill">Proof of value</span>
        <h2 className="section-title">Operational ROI, visible daily</h2>
        <p className="muted">
          Track what the AI handled, where it escalated, and how much time it returned to the owner.
        </p>
        <div className="feature-grid" style={{ marginTop: 16 }}>
          <div className="feature-card">
            <strong>AI-handled interactions</strong>
            <p className="muted">Live counts update as the system works.</p>
          </div>
          <div className="feature-card">
            <strong>Time saved</strong>
            <p className="muted">Minutes returned to the owner, tracked daily and weekly.</p>
          </div>
          <div className="feature-card">
            <strong>Escalation control</strong>
            <p className="muted">Approvals and audits ensure safe delegation.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
