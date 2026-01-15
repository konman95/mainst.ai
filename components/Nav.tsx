"use client";
import Link from "next/link";
import { clearAuth, getAuth } from "../lib/auth";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "../lib/api";

export default function Nav() {
  const pathname = usePathname();
  const [auth, setAuth] = useState<{ uid: string; token: string } | null>(null);
  const [workspaceName, setWorkspaceName] = useState("Main St AI Business");
  const [planName, setPlanName] = useState("Operator Pro");
  const [menuOpen, setMenuOpen] = useState(false);
  const [role, setRole] = useState<"Owner" | "Manager" | "Agent">("Owner");
  const [workspaceId, setWorkspaceId] = useState("primary");
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string }>>([]);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Read auth only on the client after mount to avoid SSR / hydration mismatch
  useEffect(() => {
    setAuth(getAuth());
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const access = await api.accessGet();
        if (active && (access?.effective_role || access?.role)) {
          setRole(access.effective_role || access.role);
        }
        if (active && access?.workspace_id) setWorkspaceId(access.workspace_id);
      } catch {
        // ignore access load errors in nav
      }
      try {
        const workspaces = await api.workspaces();
        if (active) {
          setWorkspaces(workspaces?.items || []);
          const match = (workspaces?.items || []).find((item: any) => item.id === (workspaces?.current || workspaceId));
          if (match?.name) setWorkspaceName(match.name);
        }
      } catch {
        // ignore workspace load errors in nav
      }
      try {
        const billing = await api.billingGet();
        if (billing?.plan) {
          const label =
            billing.plan === "core" ? "Coverage Core" : billing.plan === "enterprise" ? "Enterprise" : "Operator Pro";
          if (active) setPlanName(label);
        }
      } catch {
        // ignore billing load errors in nav
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const handleClick = (event: MouseEvent) => {
      if (!menuOpen) return;
      const target = event.target as Node | null;
      const panel = menuRef.current;
      const trigger = triggerRef.current;
      if (!panel || !target) return;
      if (panel.contains(target) || trigger?.contains(target)) return;
      setMenuOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("mousedown", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("mousedown", handleClick);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const panel = menuRef.current;
    if (!panel) return;
    const focusables = panel.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"
    );
    if (focusables.length > 0) focusables[0].focus();

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const list = Array.from(
        panel.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"
        )
      );
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [menuOpen]);

  const canManageCoverage = role !== "Agent";
  const canSeeAutomation = role !== "Agent";
  const canSeeSecurity = role === "Owner";
  const canSeeSettings = role !== "Agent";
  const canSeeOrg = role !== "Agent";
  const canSwitchWorkspace = role !== "Agent";

  async function selectWorkspace(id: string) {
    setWorkspaceId(id);
    setMenuOpen(false);
    try {
      await api.workspacesSelect(id);
    } catch {
      // ignore selection errors
    }
    if (typeof window !== "undefined") {
      window.setTimeout(() => window.location.reload(), 400);
    }
  }

  return (
    <div className="nav">
      <div className="nav-inner">
        <div className="nav-brand">
          <span className="pill">Main St AI</span>
          <div className="nav-meta">
            <strong>{workspaceName}</strong>
            <span className="muted">Plan: {planName}</span>
          </div>
        </div>
        <div className="nav-actions">
          <button
            className="btn ghost menu-trigger"
            onClick={() => setMenuOpen(v => !v)}
            aria-expanded={menuOpen}
            aria-controls="mainstai-menu"
            aria-label="Open navigation menu"
            aria-haspopup="menu"
            ref={triggerRef}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="menu-backdrop" aria-hidden="true" />
      )}
      <div
        id="mainstai-menu"
        className={`menu-panel ${menuOpen ? "open" : ""}`}
        ref={menuRef}
        role="menu"
      >
        <div className="menu-section">
          <div className="menu-title">Quick actions</div>
          <div className="menu-actions">
            <a className="menu-action" href="/chat" onClick={() => setMenuOpen(false)}>
              <span className="menu-icon chat" aria-hidden="true" />
              Start chat
            </a>
            <a className="menu-action" href="/contacts" onClick={() => setMenuOpen(false)}>
              <span className="menu-icon contacts" aria-hidden="true" />
              New contact
            </a>
            {canManageCoverage && (
              <a className="menu-action" href="/owner-cover#simulate-inbound" onClick={() => setMenuOpen(false)}>
                <span className="menu-icon simulate" aria-hidden="true" />
                Simulate inbound
              </a>
            )}
            <a className="menu-action" href="/notifications" onClick={() => setMenuOpen(false)}>
              <span className="menu-icon alerts" aria-hidden="true" />
              View alerts
            </a>
          </div>
        </div>
        {canSwitchWorkspace && workspaces.length > 0 && (
          <div className="menu-section">
            <div className="menu-title">Workspace switcher</div>
            <div className="menu-actions">
              {workspaces.map(workspace => (
                <button
                  key={workspace.id}
                  className={`menu-action ${workspaceId === workspace.id ? "active" : ""}`}
                  onClick={() => selectWorkspace(workspace.id)}
                >
                  <span className="menu-icon" aria-hidden="true" />
                  {workspace.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="menu-title">Workspace</div>
        <div className="menu-grid">
          <Link className={`nav-link ${pathname === "/dashboard" ? "active" : ""}`} href="/dashboard" onClick={() => setMenuOpen(false)}>
            Dashboard
          </Link>
          <Link className={`nav-link ${pathname === "/profile" ? "active" : ""}`} href="/profile" onClick={() => setMenuOpen(false)}>
            Profile
          </Link>
          <Link className={`nav-link ${pathname === "/contacts" ? "active" : ""}`} href="/contacts" onClick={() => setMenuOpen(false)}>
            Contacts
          </Link>
          <Link className={`nav-link ${pathname === "/chat" ? "active" : ""}`} href="/chat" onClick={() => setMenuOpen(false)}>
            Chat
          </Link>
          {canManageCoverage && (
            <Link className={`nav-link ${pathname === "/owner-cover" ? "active" : ""}`} href="/owner-cover" onClick={() => setMenuOpen(false)}>
              Owner Cover
            </Link>
          )}
          {canSeeAutomation && (
            <Link className={`nav-link ${pathname === "/automation" ? "active" : ""}`} href="/automation" onClick={() => setMenuOpen(false)}>
              Automation
            </Link>
          )}
          <Link className={`nav-link ${pathname === "/decision-feed" ? "active" : ""}`} href="/decision-feed" onClick={() => setMenuOpen(false)}>
            Decisions
          </Link>
          {canSeeOrg && (
            <Link className={`nav-link ${pathname === "/org" ? "active" : ""}`} href="/org" onClick={() => setMenuOpen(false)}>
              Org Analytics
            </Link>
          )}
          <Link className={`nav-link ${pathname === "/action-queue" ? "active" : ""}`} href="/action-queue" onClick={() => setMenuOpen(false)}>
            Action Queue
          </Link>
          <Link className={`nav-link ${pathname === "/notifications" ? "active" : ""}`} href="/notifications" onClick={() => setMenuOpen(false)}>
            Notifications
          </Link>
          <Link className={`nav-link ${pathname === "/memory" ? "active" : ""}`} href="/memory" onClick={() => setMenuOpen(false)}>
            Memory
          </Link>
          <Link className={`nav-link ${pathname === "/outcomes" ? "active" : ""}`} href="/outcomes" onClick={() => setMenuOpen(false)}>
            Outcomes
          </Link>
          {canSeeSettings && (
            <Link className={`nav-link ${pathname === "/settings" ? "active" : ""}`} href="/settings" onClick={() => setMenuOpen(false)}>
              Settings
            </Link>
          )}
          {canSeeSecurity && (
            <Link className={`nav-link ${pathname === "/security" ? "active" : ""}`} href="/security" onClick={() => setMenuOpen(false)}>
              Security
            </Link>
          )}
          <Link className={`nav-link ${pathname === "/how-it-works" ? "active" : ""}`} href="/how-it-works" onClick={() => setMenuOpen(false)}>
            How It Works
          </Link>
        </div>
        <div className="menu-footer">
          {auth ? (
            <button
              className="btn ghost"
              onClick={() => {
                clearAuth();
                location.href = "/login";
              }}
            >
              Logout
            </button>
          ) : (
            <Link className={`nav-link ${pathname === "/login" ? "active" : ""}`} href="/login" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
