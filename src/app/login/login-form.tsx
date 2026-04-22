"use client";

import { useState } from "react";
import { loginAdmin } from "@/app/actions";

const inputStyle: React.CSSProperties = {
  background: "var(--s1)",
  border: "1px solid var(--s2)",
  color: "var(--fg)",
  padding: "10px 12px",
  fontSize: 14,
  width: "100%",
  fontFamily: "inherit",
};

const btnStyle: React.CSSProperties = {
  padding: "10px 16px",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  width: "100%",
  marginTop: 8,
};

export function LoginForm() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await loginAdmin(login, password);
    setBusy(false);
    if (res?.error) setError(res.error);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 340,
          background: "var(--s1)",
          border: "1px solid var(--s2)",
          padding: 28,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: "0.2em",
            color: "var(--accent)",
            marginBottom: 4,
          }}
        >
          UNKNW
        </div>
        <div
          style={{
            fontSize: 10,
            color: "var(--s3)",
            letterSpacing: "0.2em",
            marginBottom: 24,
          }}
        >
          PM · ADMIN SIGN IN
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email or name</div>
          <input autoFocus style={inputStyle} type="text" value={login} onChange={(e) => setLogin(e.target.value)} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Password</div>
          <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && (
          <div style={{ color: "var(--red, #f66)", fontSize: 12, marginTop: 8 }}>{error}</div>
        )}
        <button type="submit" style={btnStyle} disabled={busy}>
          {busy ? "..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
