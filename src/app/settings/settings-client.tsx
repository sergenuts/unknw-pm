"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/app/_components/badge";
import { formatMoney } from "@/lib/format";
import { createTeamMember, deleteTeamMember, createClient, toggleClientVat, updateTeamMemberRate, updateClientField, updateTeamMemberPassword } from "@/app/actions";
import type { TeamMember, Client, ClientRate } from "@/lib/types";

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

const inputStyle: React.CSSProperties = {
  background: "var(--s1)",
  border: "1px solid var(--s2)",
  color: "var(--fg)",
  padding: "6px 10px",
  fontSize: 13,
  width: "100%",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const panelStyle: React.CSSProperties = {
  background: "var(--s1)",
  border: "1px solid var(--s2)",
  padding: 20,
  marginBottom: 12,
};

function EditableRate({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value));
  if (editing) {
    return (
      <input
        autoFocus
        style={{ ...inputStyle, width: 70, fontSize: 13, textAlign: "right" }}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => { onSave(Number(val) || 0); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Enter") { onSave(Number(val) || 0); setEditing(false); } }}
      />
    );
  }
  return (
    <span
      onClick={() => { setVal(String(value)); setEditing(true); }}
      style={{ cursor: "pointer", borderBottom: "1px dashed var(--s3)", fontSize: 13, color: "var(--yellow)" }}
    >
      ${value}/h
    </span>
  );
}

function EditablePassword({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  if (editing) {
    return (
      <input
        autoFocus
        type="text"
        style={{ ...inputStyle, width: 140, fontSize: 13 }}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => { onSave(val); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Enter") { onSave(val); setEditing(false); } }}
      />
    );
  }
  return (
    <span
      onClick={() => { setVal(value); setEditing(true); }}
      style={{ cursor: "pointer", borderBottom: "1px dashed var(--s3)", fontSize: 13, color: value ? "var(--fg)" : "var(--s4)", fontFamily: "monospace" }}
    >
      {value ? "•".repeat(Math.min(value.length, 10)) : "set password"}
    </span>
  );
}

function EditableLead({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  if (editing) {
    return (
      <input
        autoFocus
        style={{ ...inputStyle, width: 140, fontSize: 13 }}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => { onSave(val); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Enter") { onSave(val); setEditing(false); } }}
      />
    );
  }
  return (
    <span
      onClick={() => { setVal(value); setEditing(true); }}
      style={{ cursor: "pointer", borderBottom: "1px dashed var(--s3)", fontSize: 13, color: value ? "var(--fg)" : "var(--s4)" }}
    >
      {value || "—"}
    </span>
  );
}

export function SettingsClient({
  members,
  clients,
  rates,
}: {
  members: TeamMember[];
  clients: Client[];
  rates: ClientRate[];
}) {
  const [tab, setTab] = useState<"team" | "clients" | "rates">("team");
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);

  const tabs = [
    { key: "team" as const, label: "Team" },
    { key: "clients" as const, label: "Clients" },
    { key: "rates" as const, label: "Rates" },
  ];

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
        003 — SETTINGS
      </div>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: "var(--fg)",
          textTransform: "uppercase",
          lineHeight: 0.92,
          margin: 0,
          marginBottom: 24,
        }}
      >
        REFER<span style={{ fontWeight: 300 }}>ENCES</span>
      </h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--s2)", marginBottom: 24 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 0",
              fontSize: 13,
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? "var(--fg)" : "var(--s4)",
              background: "none",
              border: "none",
              borderBottom: tab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: "pointer",
              letterSpacing: "0.02em",
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ TEAM TAB ═══ */}
      {tab === "team" && (
        <div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Password</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Rate</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td style={tdStyle}>
                    <Link href={`/team/${m.id}`} style={{ color: "var(--fg)", textDecoration: "underline", textDecorationStyle: "dashed", textUnderlineOffset: 3 }}>
                      {m.name}
                    </Link>
                  </td>
                  <td style={tdStyle}>
                    <Badge type={m.type}>{m.type}</Badge>
                  </td>
                  <td style={tdStyle}>{m.role}</td>
                  <td style={tdStyle}>
                    <EditablePassword value={m.password || ""} onSave={(v) => updateTeamMemberPassword(m.id, v)} />
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    {m.type === "outsource" ? (
                      <EditableRate value={m.cost_rate} onSave={(v) => updateTeamMemberRate(m.id, v)} />
                    ) : (
                      <span style={{ color: "var(--s3)" }}>—</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, width: 30 }}>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${m.name}? This will fail if they have linked records.`)) {
                          deleteTeamMember(m.id);
                        }
                      }}
                      style={{ background: "none", border: "none", color: "var(--s3)", cursor: "pointer", fontSize: 14 }}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {showAddMember ? (
            <AddMemberForm onClose={() => setShowAddMember(false)} />
          ) : (
            <button onClick={() => setShowAddMember(true)} style={{ ...btnStyle, marginTop: 16 }}>
              + ADD MEMBER
            </button>
          )}
        </div>
      )}

      {/* ═══ CLIENTS TAB ═══ */}
      {tab === "clients" && (
        <div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Currency</th>
                <th style={thStyle}>VAT</th>
                <th style={thStyle}>Deal Lead</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((cl) => (
                <tr key={cl.id}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{cl.name}</td>
                  <td style={tdStyle}>
                    <select
                      value={cl.currency}
                      onChange={(e) => updateClientField(cl.id, "currency", e.target.value)}
                      style={{ ...selectStyle, width: 90, padding: "3px 6px" }}
                    >
                      <option value="GBP">GBP</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <span
                      onClick={() => toggleClientVat(cl.id, !cl.vat)}
                      style={{ cursor: "pointer" }}
                    >
                      <Badge type={cl.vat ? "active" : "rejected"}>
                        {cl.vat ? `+VAT ${cl.vat_rate}%` : "no VAT"}
                      </Badge>
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <EditableLead value={cl.deal_lead || ""} onSave={(v) => updateClientField(cl.id, "deal_lead", v)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {showAddClient ? (
            <AddClientForm onClose={() => setShowAddClient(false)} />
          ) : (
            <button onClick={() => setShowAddClient(true)} style={{ ...btnStyle, marginTop: 16 }}>
              + ADD CLIENT
            </button>
          )}
        </div>
      )}

      {/* ═══ RATES TAB ═══ */}
      {tab === "rates" && (
        <div>
          {clients.map((cl) => {
            const clRates = rates.filter((r) => r.client_id === cl.id);
            const sym = cl.currency === "USD" ? "$" : cl.currency === "EUR" ? "€" : "£";
            return (
              <div key={cl.id} style={panelStyle}>
                <div style={{ fontWeight: 700, fontSize: 14, textTransform: "uppercase", marginBottom: 12 }}>
                  {cl.name}
                  <span style={{ fontWeight: 400, color: "var(--s4)", fontSize: 12, marginLeft: 8 }}>{cl.currency}</span>
                </div>
                {clRates.length === 0 ? (
                  <div style={{ color: "var(--s4)", fontSize: 13 }}>No rates configured</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Role</th>
                        <th style={{ ...thStyle, textAlign: "right" }}>Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clRates.map((r) => (
                        <tr key={r.id}>
                          <td style={tdStyle}>{r.role}</td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            {formatMoney(r.rate, cl.currency)}/h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Add Member Form ─────────────────────────────────────────

function AddMemberForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"internal" | "outsource">("internal");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [costRate, setCostRate] = useState("");

  async function handleSubmit() {
    if (!name || !role) return;
    await createTeamMember({
      name,
      type,
      role,
      email,
      ...(type === "outsource" && costRate ? { cost_rate: Number(costRate) } : {}),
    });
    onClose();
  }

  return (
    <div style={{ ...{ background: "var(--s1)", border: "1px solid var(--s2)", padding: 20 }, marginTop: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Name</div>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Type</div>
          <select style={{ ...selectStyle, width: 120 }} value={type} onChange={(e) => setType(e.target.value as "internal" | "outsource")}>
            <option value="internal">internal</option>
            <option value="outsource">outsource</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Role</div>
          <input style={{ ...inputStyle, width: 120 }} value={role} onChange={(e) => setRole(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Email</div>
          <input style={{ ...inputStyle, width: 160 }} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {type === "outsource" && (
          <div>
            <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Cost Rate</div>
            <input style={{ ...inputStyle, width: 80 }} type="number" value={costRate} onChange={(e) => setCostRate(e.target.value)} />
          </div>
        )}
        <button onClick={handleSubmit} style={btnStyle}>ADD</button>
        <button onClick={onClose} style={{ ...btnStyle, background: "var(--s2)", color: "var(--s4)" }}>CANCEL</button>
      </div>
    </div>
  );
}

// ─── Add Client Form ─────────────────────────────────────────

function AddClientForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("GBP");
  const [vat, setVat] = useState(false);
  const [vatRate, setVatRate] = useState("20");
  const [dealLead, setDealLead] = useState("");

  async function handleSubmit() {
    if (!name) return;
    await createClient({
      name,
      currency,
      vat,
      vat_rate: vat ? Number(vatRate) : 0,
      deal_lead: dealLead,
    });
    onClose();
  }

  return (
    <div style={{ ...{ background: "var(--s1)", border: "1px solid var(--s2)", padding: 20 }, marginTop: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Name</div>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Currency</div>
          <select style={{ ...selectStyle, width: 90 }} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="GBP">GBP</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 2 }}>
          <input type="checkbox" checked={vat} onChange={(e) => setVat(e.target.checked)} />
          <span style={{ fontSize: 12, color: "var(--s4)" }}>VAT</span>
          {vat && (
            <input
              style={{ ...inputStyle, width: 50 }}
              type="number"
              value={vatRate}
              onChange={(e) => setVatRate(e.target.value)}
              placeholder="%"
            />
          )}
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Deal Lead</div>
          <input style={{ ...inputStyle, width: 130 }} value={dealLead} onChange={(e) => setDealLead(e.target.value)} />
        </div>
        <button onClick={handleSubmit} style={btnStyle}>ADD</button>
        <button onClick={onClose} style={{ ...btnStyle, background: "var(--s2)", color: "var(--s4)" }}>CANCEL</button>
      </div>
    </div>
  );
}
