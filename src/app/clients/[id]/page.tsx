import Link from "next/link";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div>
      <Link
        href="/"
        style={{
          color: "var(--s4)",
          fontSize: 12,
          textDecoration: "none",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        ← BACK
      </Link>
      <div style={{ marginTop: 16 }}>
        <div
          style={{
            fontSize: 11,
            color: "var(--s3)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          CLIENT DETAIL
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
          LOADING...
        </h1>
        <p style={{ color: "var(--s4)", marginTop: 16, fontSize: 13 }}>
          Client ID: {id}. This page will be built by Claude Code — see RULES.md for spec.
        </p>
      </div>
    </div>
  );
}
