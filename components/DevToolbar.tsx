"use client";
import { useEffect, useState } from "react";

export default function DevToolbar() {
  const [mock, setMock] = useState<boolean | null>(null);

  useEffect(() => {
    const v = localStorage.getItem("USE_MOCK");
    if (v === null) setMock(null);
    else setMock(v === "true");
  }, []);

  function toggle() {
    const next = !(mock === true);
    localStorage.setItem("USE_MOCK", next ? "true" : "false");
    setMock(next);
    // don't force reload; let components pick up change on next action
    // but advise user to reload for deterministic behavior
  }

  function clear() {
    localStorage.removeItem("USE_MOCK");
    setMock(null);
  }

  return (
    <div className="devbar">
      <div className="devbar-inner">
        <strong>Dev</strong>
        <button className="btn ghost" onClick={toggle}>
          {mock === null ? "Mock: unset" : mock ? "Mock: ON" : "Mock: OFF"}
        </button>
        <button className="btn ghost" onClick={clear}>Clear</button>
        <div style={{ marginLeft: "auto" }}>
          Tip: toggle changes runtime mock flag stored in localStorage
        </div>
      </div>
    </div>
  );
}
