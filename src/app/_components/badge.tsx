const colors: Record<string, { bg: string; fg: string }> = {
  active: { bg: "var(--green-dim)", fg: "var(--green)" },
  done: { bg: "var(--green-dim)", fg: "var(--green)" },
  paid: { bg: "var(--green-dim)", fg: "var(--green)" },
  internal: { bg: "var(--green-dim)", fg: "var(--green)" },
  "in progress": { bg: "var(--yellow-dim)", fg: "var(--yellow)" },
  paused: { bg: "var(--yellow-dim)", fg: "var(--yellow)" },
  outsource: { bg: "var(--yellow-dim)", fg: "var(--yellow)" },
  lead: { bg: "var(--purple-dim)", fg: "var(--purple)" },
  spent: { bg: "var(--yellow-dim)", fg: "var(--yellow)" },
  submitted: { bg: "var(--purple-dim)", fg: "var(--purple)" },
  pending: { bg: "var(--purple-dim)", fg: "var(--purple)" },
  rejected: { bg: "var(--red-dim)", fg: "var(--red)" },
};

const fallback = { bg: "rgba(255,255,255,.06)", fg: "var(--s3)" };

export function Badge({ children, type }: { children: React.ReactNode; type: string }) {
  const s = colors[type] || fallback;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 8px",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        background: s.bg,
        color: s.fg,
      }}
    >
      {children}
    </span>
  );
}
