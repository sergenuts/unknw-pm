export default function ApprovalsPage() {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: "var(--s3)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        002 — APPROVALS
      </div>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: "var(--fg)",
          textTransform: "uppercase",
          lineHeight: 0.92,
          margin: 0,
        }}
      >
        PENDING <span style={{ fontWeight: 300 }}>REVIEW</span>
      </h1>
      <p style={{ color: "var(--s4)", marginTop: 16, fontSize: 13 }}>
        Will be built by Claude Code — see RULES.md for spec.
      </p>
    </div>
  );
}
