"use client";

export default function HowItWorks() {
  return (
    <div className="stagger">
      <div>
        <span className="pill">How It Works</span>
        <h2 className="section-title">Operational coverage, not another AI tool</h2>
        <p className="muted">
          Main St AI is built as a business operator. It decides, acts, and stays accountable so the owner
          can step away without the business going quiet.
        </p>
      </div>

      <div className="card">
        <h3 className="section-title">The Decision Core</h3>
        <p className="muted">
          Every action passes through a single decision system that asks: goal, risk, authority, context,
          safest acceptable action, and what happens if it is wrong.
        </p>
      </div>

      <div className="feature-grid">
        <div className="feature-card">
          <strong>Business memory</strong>
          <p className="muted">
            Facts, people history, interactions, past decisions, and outcomes are retained so the AI becomes
            experienced, not reactive.
          </p>
        </div>
        <div className="feature-card">
          <strong>Owner Cover Mode</strong>
          <p className="muted">
            Off, Monitor, or Auto-Send. Delegation with explicit authority, not blind automation.
          </p>
        </div>
        <div className="feature-card">
          <strong>Guardrails</strong>
          <p className="muted">
            Confidence thresholds, topic restrictions, money sensitivity, and quiet hours keep risk low.
          </p>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Action queue + approvals</h3>
        <p className="muted">
          Every AI action is sent, queued, or blocked. Queued items show the draft response, reasoning,
          confidence, and risk flags.
        </p>
      </div>

      <div className="feature-grid">
        <div className="feature-card">
          <strong>Audit log</strong>
          <p className="muted">
            Every decision is logged with the input, interpretation, decision path, and outcome.
          </p>
        </div>
        <div className="feature-card">
          <strong>Outcome learning</strong>
          <p className="muted">
            Results feed back into thresholds, follow-ups, and responses to compound performance.
          </p>
        </div>
        <div className="feature-card">
          <strong>Unified channels</strong>
          <p className="muted">
            Web chat today, email and SMS next. All channels feed the same brain.
          </p>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">North Star</h3>
        <p className="muted">
          Does this increase the AI&apos;s ability to run the business without the owner present?
          If yes, build it. If no, reject it.
        </p>
      </div>
    </div>
  );
}
