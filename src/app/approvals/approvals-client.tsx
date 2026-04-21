"use client";

import { Badge } from "@/app/_components/badge";
import { approveEntry, rejectEntry, approveAllEntries, approveFixedCost, rejectFixedCost } from "@/app/actions";
import type { Entry, TeamMember, Client, FixedCost, FixedItem } from "@/lib/types";
import { formatMoney } from "@/lib/format";

function timeAgo(iso: string): string {
  const t = Date.parse(iso);
  if (isNaN(t)) return "";
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  const dt = new Date(t);
  return dt.toLocaleDateString("en", { month: "short", day: "numeric" });
}

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
  fixedCosts,
  fixedItems,
}: {
  entries: Entry[];
  members: TeamMember[];
  clients: Client[];
  fixedCosts: FixedCost[];
  fixedItems: FixedItem[];
}) {
  const totalPending = entries.length + fixedCosts.length;
  const sortedEntries = [...entries].sort((a, b) => Date.parse(b.created_at || "") - Date.parse(a.created_at || ""));
  const sortedFixed = [...fixedCosts].sort((a, b) => Date.parse(b.created_at || "") - Date.parse(a.created_at || ""));
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
            {totalPending > 0 && <Badge type="submitted">{totalPending} pending</Badge>}
          </div>
        </div>
        {entries.length > 0 && (
          <button onClick={() => approveAllEntries()} style={btnStyle}>
            APPROVE ALL
          </button>
        )}
      </div>

      {totalPending === 0 ? (
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
        <>
          {entries.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 32 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Submitted</th>
                  <th style={thStyle}>Who</th>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Task</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Hrs</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((e) => {
                  const owner = members.find((m) => m.id === e.owner_id);
                  const client = clients.find((c) => c.id === e.client_id);
                  const t = e.entry_type === "hours_week" ? "hours/week" : "hours/task";
                  return (
                    <tr key={e.id}>
                      <td style={{ ...tdStyle, color: "var(--s4)", fontSize: 11 }} title={e.created_at}>{timeAgo(e.created_at)}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {owner && <Badge type={owner.type}>{owner.type}</Badge>}
                          {owner?.name || "—"}
                        </div>
                      </td>
                      <td style={tdStyle}>{client?.name || "—"}</td>
                      <td style={{ ...tdStyle, color: "var(--s4)", fontSize: 11, textTransform: "uppercase" }}>{t}</td>
                      <td style={tdStyle}>{e.task}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{e.hours}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <ApproveRejectButtons
                          onApprove={() => approveEntry(e.id)}
                          onReject={() => rejectEntry(e.id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {fixedCosts.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--s3)", textTransform: "uppercase", marginBottom: 12 }}>
                Fixed costs
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Submitted</th>
                    <th style={thStyle}>Who</th>
                    <th style={thStyle}>Client</th>
                    <th style={thStyle}>Fixed item</th>
                    <th style={thStyle}>Note</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFixed.map((c) => {
                    const owner = c.member_id ? members.find((m) => m.id === c.member_id) : null;
                    const item = fixedItems.find((f) => f.id === c.fixed_item_id);
                    const client = item ? clients.find((cl) => cl.id === item.client_id) : null;
                    return (
                      <tr key={c.id}>
                        <td style={{ ...tdStyle, color: "var(--s4)", fontSize: 11 }} title={c.created_at}>{timeAgo(c.created_at)}</td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {owner && <Badge type={owner.type}>{owner.type}</Badge>}
                            {owner?.name || "—"}
                          </div>
                        </td>
                        <td style={tdStyle}>{client?.name || "—"}</td>
                        <td style={tdStyle}>{item?.name || "—"}</td>
                        <td style={{ ...tdStyle, color: "var(--s4)" }}>{c.description}</td>
                        <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>
                          {client ? formatMoney(c.amount, client.currency) : c.amount}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          <ApproveRejectButtons
                            onApprove={() => approveFixedCost(c.id)}
                            onReject={() => rejectFixedCost(c.id)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </>
      )}
    </div>
  );
}

function ApproveRejectButtons({ onApprove, onReject }: { onApprove: () => void; onReject: () => void }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
      <button
        onClick={onApprove}
        style={{
          padding: "4px 10px", fontSize: 11, fontWeight: 600,
          background: "var(--green-dim)", color: "var(--green)",
          border: "none", cursor: "pointer", letterSpacing: "0.04em",
        }}
      >
        ✓
      </button>
      <button
        onClick={onReject}
        style={{
          padding: "4px 10px", fontSize: 11, fontWeight: 600,
          background: "var(--red-dim)", color: "var(--red)",
          border: "none", cursor: "pointer", letterSpacing: "0.04em",
        }}
      >
        ✕
      </button>
    </div>
  );
}
