"use client";

import { Badge } from "@/app/_components/badge";
import { approveEntry, rejectEntry, approveAllEntries } from "@/app/actions";
import type { Entry, TeamMember, Client } from "@/lib/types";

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  fontSize: 10,
  fontWeight: 600,
  color: "var(--s3)",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  borderBottom: "1px solid var(--s2)",
};

const tdStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderBottom: "1px solid var(--s2)",
  color: "var(--fg)",
  fontSize: 13,
};

const btnStyle: React.CSSProperties = {
  padding: "6px 14px",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  cursor: "pointer",
};

export function ApprovalsClient({
  entries,
  members,
  clients,
}: {
  entries: Entry[];
  members: TeamMember[];
  clients: Client[];
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
            {entries.length > 0 && <Badge type="submitted">{entries.length} submitted</Badge>}
          </div>
        </div>
        {entries.length > 0 && (
          <button onClick={() => approveAllEntries()} style={btnStyle}>
            APPROVE ALL
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "var(--s4)",
            fontSize: 14,
            background: "var(--s1)",
            border: "1px solid var(--s2)",
          }}
        >
          all clear
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Who</th>
              <th style={thStyle}>Client</th>
              <th style={thStyle}>Task</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Hrs</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const owner = members.find((m) => m.id === e.owner_id);
              const client = clients.find((c) => c.id === e.client_id);
              return (
                <tr key={e.id}>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Badge type="outsource">outsource</Badge>
                      {owner?.name || "—"}
                    </div>
                  </td>
                  <td style={tdStyle}>{client?.name || "—"}</td>
                  <td style={tdStyle}>{e.task}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{e.hours}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button
                        onClick={() => approveEntry(e.id)}
                        style={{
                          padding: "4px 10px",
                          fontSize: 11,
                          fontWeight: 600,
                          background: "var(--green-dim)",
                          color: "var(--green)",
                          border: "none",
                          cursor: "pointer",
                          letterSpacing: "0.04em",
                        }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => rejectEntry(e.id)}
                        style={{
                          padding: "4px 10px",
                          fontSize: 11,
                          fontWeight: 600,
                          background: "var(--red-dim)",
                          color: "var(--red)",
                          border: "none",
                          cursor: "pointer",
                          letterSpacing: "0.04em",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
