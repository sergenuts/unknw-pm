"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/app/_components/badge";
import { formatMoney, getCurrentMonth } from "@/lib/format";
import { weeksInMonth, isoWeek } from "@/lib/weeks";
import type { Client, Entry, FixedItem, FixedCost, ClientMonth, ClientRate, TeamMember, OutsourceMonth } from "@/lib/types";
import {
  upsertClientMonth,
  updateEntryField,
  deleteEntry,
  createEntry,
  createFixedItem,
  updateFixedItemPaid,
  createFixedCost,
  deleteFixedCost,
  deleteFixedItem,
  createClientRate,
  updateFixedItemStatus,
  updateFixedCostStatus,
  deleteClientRate,
  assignTeamMember,
  unassignTeamMember,
  upsertOutsourceMonth,
} from "@/app/actions";

interface Props {
  client: Client;
  entries: Entry[];
  rates: ClientRate[];
  months: ClientMonth[];
  fixed: FixedItem[];
  costs: FixedCost[];
  assignments: { id: string; member_id: string; client_id: string }[];
  members: TeamMember[];
  outsourceMonths: OutsourceMonth[];
}

// ─── Styles ──────────────────────────────────────────────────

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

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

// ─── Editable inline text ────────────────────────────────────

function EditableText({
  value,
  onSave,
  placeholder = "—",
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  if (editing) {
    return (
      <input
        autoFocus
        style={{ ...inputStyle, width: "100%", fontSize: 13 }}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          onSave(val);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSave(val);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <span
      onClick={() => {
        setVal(value);
        setEditing(true);
      }}
      style={{
        cursor: "pointer",
        borderBottom: "1px dashed var(--s3)",
        fontSize: 13,
        color: value ? "var(--fg)" : "var(--s4)",
      }}
    >
      {value || placeholder}
    </span>
  );
}

// ─── Editable inline value ───────────────────────────────────

function EditableValue({
  value,
  onSave,
  format,
  color,
  size = 16,
}: {
  value: number;
  onSave: (v: number) => void;
  format?: (v: number) => string;
  color?: string;
  size?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value));

  if (editing) {
    return (
      <input
        autoFocus
        style={{ ...inputStyle, width: 100, fontSize: size, fontWeight: 800 }}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          onSave(Number(val) || 0);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSave(Number(val) || 0);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <span
      onClick={() => {
        setVal(String(value));
        setEditing(true);
      }}
      style={{
        cursor: "pointer",
        borderBottom: "1px dashed var(--s3)",
        fontSize: size,
        fontWeight: 800,
        color: color || "var(--fg)",
        lineHeight: 1,
      }}
    >
      {format ? format(value) : value}
    </span>
  );
}

const ITEM_STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  "in progress": { bg: "var(--yellow-dim)", fg: "var(--yellow)" },
  done: { bg: "var(--green-dim)", fg: "var(--green)" },
  paused: { bg: "rgba(255,255,255,.06)", fg: "var(--s3)" },
};

function ItemStatusSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const c = ITEM_STATUS_COLORS[value] || { bg: "rgba(255,255,255,.06)", fg: "var(--s3)" };
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: c.bg,
        color: c.fg,
        border: "none",
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        cursor: "pointer",
        width: 130,
      }}
    >
      <option value="in progress">in progress</option>
      <option value="done">done</option>
      <option value="paused">paused</option>
    </select>
  );
}

const COST_STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  planned: { bg: "var(--yellow-dim)", fg: "var(--yellow)" },
  pending: { bg: "var(--purple-dim)", fg: "var(--purple)" },
  spent: { bg: "var(--yellow-dim)", fg: "var(--yellow)" },
  paid: { bg: "var(--green-dim)", fg: "var(--green)" },
};

function CostStatusSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const c = COST_STATUS_COLORS[value] || { bg: "rgba(255,255,255,.06)", fg: "var(--s3)" };
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: c.bg,
        color: c.fg,
        border: "none",
        padding: "3px 8px",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        cursor: "pointer",
      }}
    >
      <option value="planned">planned</option>
      <option value="pending">pending</option>
      <option value="spent">spent</option>
      <option value="paid">paid</option>
    </select>
  );
}

// ─── Main Component ──────────────────────────────────────────

export function ClientDetail({ client, entries, rates, months, fixed, costs, assignments, members: membersRaw, outsourceMonths }: Props) {
  const members = [...membersRaw].sort((a, b) => a.name.localeCompare(b.name));
  const assignedMemberIds = new Set(assignments.map((a) => a.member_id));
  const leadName = (client.deal_lead || "").trim().toLowerCase();
  const projectMembers = members.filter(
    (m) => assignedMemberIds.has(m.id) || (leadName && m.name.trim().toLowerCase() === leadName),
  );
  const cl = client;
  const cur = getCurrentMonth();

  // all months from entries + client_months
  const allMonthSet = new Set<string>();
  entries.forEach((e) => allMonthSet.add(e.month));
  months.forEach((m) => allMonthSet.add(m.month));
  fixed.forEach((f) => allMonthSet.add(f.month));

  const monthOrder = [
    "december 2025", "january 2026", "february 2026", "march 2026", "april 2026",
    "may 2026", "june 2026", "july 2026", "august 2026", "september 2026",
    "october 2026", "november 2026", "december 2026",
  ];
  const allMonths = monthOrder.filter((m) => allMonthSet.has(m));
  if (allMonths.length === 0) allMonths.push(cur);

  const [selectedMonth, setSelectedMonth] = useState(allMonths.includes(cur) ? cur : allMonths[allMonths.length - 1]);
  const [contentTab, setContentTab] = useState<"report" | "history" | "outsource" | "team">("report");
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showAddFixed, setShowAddFixed] = useState(false);
  const [showAddRate, setShowAddRate] = useState(false);
  const [showAddCost, setShowAddCost] = useState<string | null>(null);
  const [entryOrder, setEntryOrder] = useState<string[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const getRate = (role: string) => rates.find((r) => r.role === role)?.rate || 0;
  const fm = (v: number) => formatMoney(v, cl.currency);

  // Month data
  const mEntriesRaw = entries.filter((e) => e.month === selectedMonth);
  // sort newest-first by day, drag reorder can override
  const mEntriesSorted = [...mEntriesRaw].sort((a, b) => (Number(b.date) || 0) - (Number(a.date) || 0));
  const mEntries = entryOrder.length > 0
    ? entryOrder
        .map((id) => mEntriesSorted.find((e) => e.id === id))
        .filter(Boolean)
        .concat(mEntriesSorted.filter((e) => !entryOrder.includes(e.id))) as Entry[]
    : mEntriesSorted;
  const mDone = mEntries.filter((e) => e.status === "done");
  const mHours = mDone.reduce((s, e) => s + e.hours * (e.coeff || 1), 0);
  const mBilled = mDone.reduce((s, e) => s + e.hours * (e.coeff || 1) * getRate(e.role), 0);
  const mData = months.find((m) => m.month === selectedMonth);
  // Auto estimate: all non-rejected tasks (by rate) + fixed items
  const mEstAuto =
    mEntries
      .filter((e) => e.status !== "rejected" && e.status !== "paused")
      .reduce((s, e) => s + e.hours * (e.coeff || 1) * getRate(e.role), 0) +
    fixed
      .filter((f) => f.month === selectedMonth)
      .reduce((s, f) => s + (f.total || 0), 0);
  const mEstManual = mData?.estimate || 0;
  const mEst = mEstManual > 0 ? mEstManual : mEstAuto;
  const mEstIsAuto = mEstManual === 0;
  const mPaid = mData?.paid || 0;
  const mOwes = mBilled - mPaid;

  // Report by role
  const roleMap = new Map<string, { hours: number; rate: number; amount: number }>();
  mDone.forEach((e) => {
    const h = e.hours * (e.coeff || 1);
    const r = getRate(e.role);
    const ex = roleMap.get(e.role) || { hours: 0, rate: r, amount: 0 };
    ex.hours += h;
    ex.amount += h * r;
    roleMap.set(e.role, ex);
  });

  // All months summary with rolling balance (overpayment carries forward)
  let carryOver = 0;
  const allMonthsSummary = allMonths.map((m) => {
    const me = entries.filter((e) => e.month === m && e.status === "done");
    const h = me.reduce((s, e) => s + e.hours * (e.coeff || 1), 0);
    const b = me.reduce((s, e) => s + e.hours * (e.coeff || 1) * getRate(e.role), 0);
    const md = months.find((cm) => cm.month === m);
    const paid = md?.paid || 0;
    const rawOwes = b - paid - carryOver;
    const owes = rawOwes;
    // if overpaid this month, carry surplus to next
    carryOver = owes < 0 ? Math.abs(owes) : 0;
    const autoEst =
      entries
        .filter((e) => e.month === m && e.status !== "rejected")
        .reduce((s, e) => s + e.hours * (e.coeff || 1) * getRate(e.role), 0) +
      fixed
        .filter((f) => f.month === m)
        .reduce((s, f) => s + (f.total || 0), 0);
    const manualEst = md?.estimate || 0;
    return {
      month: m,
      hours: h,
      billed: b,
      estimate: manualEst > 0 ? manualEst : autoEst,
      estimateIsAuto: manualEst === 0,
      paid,
      owes,
    };
  });

  const contentTabs = [
    { key: "report" as const, label: "Report" },
    { key: "history" as const, label: "History" },
    { key: "outsource" as const, label: "Outsource" },
    { key: "team" as const, label: "Team" },
  ];

  const ratesStr = rates.map((r) => `${r.role} ${fm(r.rate)}/h`).join(" · ");

  return (
    <div>
      {/* Back */}
      <Link
        href="/"
        style={{ color: "var(--s4)", fontSize: 12, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.04em" }}
      >
        ← BACK
      </Link>

      {/* Header */}
      <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <Badge type="active">active</Badge>
            {cl.vat && <Badge type="planned">+VAT {cl.vat_rate}%</Badge>}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, textTransform: "uppercase", lineHeight: 0.92, margin: 0, color: "var(--fg)" }}>
            {cl.name}
          </h1>
          <div style={{ fontSize: 12, color: "var(--s4)", marginTop: 8 }}>
            {cl.deal_lead} · {cl.currency} · {ratesStr}
          </div>
        </div>
        <button style={btnStyle}>EXPORT</button>
      </div>

      {/* Month tabs */}
      <div style={{ display: "flex", gap: 4, marginTop: 28, overflowX: "auto" }}>
        {allMonths.map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMonth(m)}
            style={{
              padding: "7px 16px",
              fontSize: 11,
              fontWeight: selectedMonth === m ? 700 : 400,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              background: selectedMonth === m ? "var(--accent)" : "var(--s1)",
              color: selectedMonth === m ? "#fff" : "var(--s4)",
              border: selectedMonth === m ? "none" : "1px solid var(--s2)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Content tabs */}
      <div style={{ display: "flex", gap: 24, marginTop: 24, borderBottom: "1px solid var(--s2)", paddingBottom: 0 }}>
        {contentTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setContentTab(t.key)}
            style={{
              padding: "8px 0",
              fontSize: 13,
              fontWeight: contentTab === t.key ? 600 : 400,
              color: contentTab === t.key ? "var(--fg)" : "var(--s4)",
              background: "none",
              border: "none",
              borderBottom: contentTab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: "pointer",
              letterSpacing: "0.02em",
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ marginTop: 24 }}>
        {/* ═══ REPORT TAB ═══ */}
        {contentTab === "report" && (
          <div>
            <SummaryStats
              hours={mHours}
              billed={mBilled}
              estimate={mEst}
              estimateIsAuto={mEstIsAuto}
              paid={mPaid}
              owes={mOwes}
              fm={fm}
              clientId={cl.id}
              month={selectedMonth}
            />

            {/* Role table */}
            <div style={{ marginTop: 24 }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Role</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Hours</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Rate</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(roleMap.entries()).map(([role, d]) => (
                    <tr key={role}>
                      <td style={tdStyle}>{role}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{d.hours}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{fm(d.rate)}</td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{fm(d.amount)}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 800 }}>
                    <td style={tdStyle}>TOTAL</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{mHours}</td>
                    <td style={tdStyle}></td>
                    <td style={{ ...tdStyle, textAlign: "right", color: "var(--green)" }}>{fm(mBilled)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Tasks header + add button */}
            <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--s3)", textTransform: "uppercase" }}>
                Tasks
              </div>
              {!showAddEntry && (
                <button onClick={() => setShowAddEntry(true)} style={{ ...btnStyle, fontSize: 10, padding: "4px 10px" }}>
                  + ADD TASK
                </button>
              )}
            </div>
            {showAddEntry && (
              <AddEntryForm
                clientId={cl.id}
                month={selectedMonth}
                members={projectMembers}
                rates={rates}
                onClose={() => setShowAddEntry(false)}
              />
            )}

            {/* Tasks table */}
            <div style={{ marginTop: showAddEntry ? 16 : 0 }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 20 }}></th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Task</th>
                    <th style={thStyle}>Owner</th>
                    <th style={thStyle}>Role</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Hrs</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Coeff</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Amt</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {mEntries.map((e, idx) => {
                    const amt = e.hours * (e.coeff || 1) * getRate(e.role);
                    return (
                      <tr
                        key={e.id}
                        draggable
                        onDragStart={() => setDragIdx(idx)}
                        onDragOver={(ev) => {
                          ev.preventDefault();
                          ev.currentTarget.style.borderTop = "2px solid var(--accent)";
                        }}
                        onDragLeave={(ev) => {
                          ev.currentTarget.style.borderTop = "";
                        }}
                        onDrop={(ev) => {
                          ev.currentTarget.style.borderTop = "";
                          if (dragIdx === null || dragIdx === idx) return;
                          const ids = mEntries.map((x) => x.id);
                          const [moved] = ids.splice(dragIdx, 1);
                          ids.splice(idx, 0, moved);
                          setEntryOrder(ids);
                          setDragIdx(null);
                        }}
                        onDragEnd={() => setDragIdx(null)}
                        style={{ cursor: "grab", opacity: dragIdx === idx ? 0.4 : 1 }}
                      >
                        <td style={{ ...tdStyle, cursor: "grab", color: "var(--s3)", width: 20, fontSize: 11, userSelect: "none" }}>⠿</td>
                        <td style={tdStyle}>
                          {e.entry_type === "hours_week" ? (
                            <span style={{ color: "var(--s4)" }}>Week {e.week_num ?? "?"}</span>
                          ) : (
                            <EditableText
                              value={e.date || ""}
                              placeholder="—"
                              onSave={(v) => updateEntryField(e.id, "date", v, cl.id)}
                            />
                          )}
                        </td>
                        <td style={tdStyle}>
                          <EditableText
                            value={e.task}
                            onSave={(v) => updateEntryField(e.id, "task", v, cl.id)}
                          />
                        </td>
                        <td style={tdStyle}>
                          <select
                            value={e.owner_id}
                            onChange={(ev) => updateEntryField(e.id, "owner_id", ev.target.value, cl.id)}
                            style={{ ...selectStyle, width: "auto", padding: "3px 6px", fontSize: 13 }}
                          >
                            {(() => {
                              const opts = projectMembers.some((m) => m.id === e.owner_id)
                                ? projectMembers
                                : [...projectMembers, members.find((m) => m.id === e.owner_id)!].filter(Boolean);
                              return opts.map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ));
                            })()}
                          </select>
                        </td>
                        <td style={tdStyle}>
                          <select
                            value={e.role}
                            onChange={(ev) => updateEntryField(e.id, "role", ev.target.value, cl.id)}
                            style={{ ...selectStyle, width: "auto", padding: "3px 6px", fontSize: 13 }}
                          >
                            {rates.map((r) => (
                              <option key={r.id} value={r.role}>{r.role}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          <EditableValue
                            value={e.hours}
                            size={13}
                            onSave={(v) => updateEntryField(e.id, "hours", v, cl.id)}
                          />
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          <EditableValue
                            value={e.coeff}
                            size={13}
                            onSave={(v) => updateEntryField(e.id, "coeff", v, cl.id)}
                          />
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{fm(amt)}</td>
                        <td style={tdStyle}>
                          <select
                            value={e.status}
                            onChange={(ev) => updateEntryField(e.id, "status", ev.target.value, cl.id)}
                            style={{
                              ...selectStyle,
                              width: "auto",
                              padding: "3px 6px",
                              fontSize: 11,
                              color:
                                e.status === "done" ? "var(--green)" :
                                e.status === "in progress" ? "var(--yellow)" :
                                e.status === "submitted" ? "var(--purple)" :
                                e.status === "rejected" ? "var(--red)" :
                                "var(--fg)",
                            }}
                          >
                            {["in progress", "done", "submitted", "pending", "rejected", "paused"].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => deleteEntry(e.id, cl.id)}
                            style={{ background: "none", border: "none", color: "var(--s3)", cursor: "pointer", fontSize: 14 }}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Fixed price header + add button */}
            <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--s3)", textTransform: "uppercase" }}>
                Fixed Price
              </div>
              {!showAddFixed && (
                <button onClick={() => setShowAddFixed(true)} style={{ ...btnStyle, fontSize: 10, padding: "4px 10px" }}>
                  + NEW
                </button>
              )}
            </div>
            {showAddFixed && (
              <AddFixedForm
                clientId={cl.id}
                currency={cl.currency}
                month={selectedMonth}
                onClose={() => setShowAddFixed(false)}
              />
            )}

            {fixed
              .filter((f) => f.month === selectedMonth)
              .map((item) => {
                const itemCosts = costs.filter((c) => c.fixed_item_id === item.id);
                const totalCosts = itemCosts.reduce((s, c) => s + c.amount, 0);
                const profit = item.total - totalCosts;
                const available = item.total - item.paid;
                const owes = item.total - item.paid;
                const progress = item.total > 0 ? Math.min((item.paid / item.total) * 100, 100) : 0;

                return (
                  <div key={item.id} style={panelStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{item.name}</span>
                        <span style={{ color: "var(--s4)", fontSize: 13, marginLeft: 12 }}>
                          {item.qty} × {fm(item.price)} = {fm(item.total)}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <ItemStatusSelect value={item.status} onChange={(v) => updateFixedItemStatus(item.id, v, cl.id)} />
                        <button
                          onClick={() => {
                            if (confirm("Delete " + item.name + "?")) deleteFixedItem(item.id, cl.id);
                          }}
                          style={{ background: "none", border: "none", color: "var(--s3)", cursor: "pointer", fontSize: 16 }}
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: "flex", gap: 40, marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--green)", lineHeight: 1 }}>{fm(item.total)}</div>
                        <div style={{ fontSize: 10, color: "var(--s3)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>client pays</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--yellow)", lineHeight: 1 }}>{fm(totalCosts)}</div>
                        <div style={{ fontSize: 10, color: "var(--s3)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>estimate costs</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: profit >= 0 ? "var(--green)" : "var(--red)", lineHeight: 1 }}>{fm(profit)}</div>
                        <div style={{ fontSize: 10, color: "var(--s3)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>profit</div>
                      </div>
                    </div>

                    {/* Costs list */}
                    {itemCosts.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        {itemCosts.map((c) => (
                          <div
                            key={c.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "6px 0",
                              borderBottom: "1px solid var(--s2)",
                              fontSize: 13,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <CostStatusSelect
                                value={c.status}
                                onChange={(v) => updateFixedCostStatus(c.id, v, cl.id)}
                              />
                              <span>{c.description}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <span style={{ fontWeight: 600 }}>{fm(c.amount)}</span>
                              <button
                                onClick={() => deleteFixedCost(c.id, cl.id)}
                                style={{ background: "none", border: "none", color: "var(--s3)", cursor: "pointer", fontSize: 14 }}
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {showAddCost === item.id ? (
                      <AddCostForm
                        fixedItemId={item.id}
                        clientId={cl.id}
                        currency={cl.currency}
                        members={members}
                        onClose={() => setShowAddCost(null)}
                      />
                    ) : (
                      <button onClick={() => setShowAddCost(item.id)} style={{ ...btnStyle, fontSize: 10, padding: "4px 10px" }}>
                        + ADD COST
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* ═══ HISTORY TAB ═══ */}
        {contentTab === "history" && (
          <div>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Month</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Hours</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Billed</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Est</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Paid</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Owes</th>
                </tr>
              </thead>
              <tbody>
                {allMonthsSummary.map((r) => (
                  <tr key={r.month}>
                    <td style={tdStyle}>{r.month}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{r.hours}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{fm(r.billed)}</td>
                    <td style={{ ...tdStyle, textAlign: "right", color: "var(--s4)" }}>{fm(r.estimate)}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <EditableValue
                        value={r.paid}
                        size={13}
                        format={(v) => fm(v)}
                        onSave={(v) => upsertClientMonth(cl.id, r.month, "paid", v)}
                      />
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", color: r.owes > 0 ? "var(--red)" : "var(--green)" }}>
                      {r.owes > 0 ? fm(r.owes) : r.owes < 0 ? "+" + fm(Math.abs(r.owes)) : "settled"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ═══ OUTSOURCE TAB ═══ */}
        {contentTab === "outsource" && (
          <div>
            {/* Current month */}
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--s3)", textTransform: "uppercase", marginBottom: 12 }}>
              {selectedMonth}
            </div>
            {(() => {
              // outsource members from entries this month
              const outsourceOwners = new Map<string, number>();
              mEntries.forEach((e) => {
                const m = members.find((mb) => mb.id === e.owner_id);
                if (m && m.type === "outsource") {
                  outsourceOwners.set(e.owner_id, (outsourceOwners.get(e.owner_id) || 0) + e.hours * (e.coeff || 1));
                }
              });
              if (outsourceOwners.size === 0) {
                return <div style={{ color: "var(--s4)", fontSize: 13, padding: "12px 0" }}>No outsourcers this month</div>;
              }
              return (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Name</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Hours</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Rate</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>To Pay</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Paid</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(outsourceOwners.entries()).map(([ownerId, hours]) => {
                      const m = members.find((mb) => mb.id === ownerId)!;
                      const om = outsourceMonths.find((o) => o.member_id === ownerId && o.month === selectedMonth);
                      const rate = om?.rate_override ?? m.cost_rate ?? 0;
                      const toPay = hours * rate;
                      const paid = om?.paid || 0;
                      const status = om?.status || "pending";
                      return (
                        <tr key={ownerId}>
                          <td style={tdStyle}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Badge type="outsource">outsource</Badge>
                              {m.name}
                            </div>
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>{hours}</td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            <EditableValue
                              value={rate}
                              size={13}
                              format={(v) => fm(v)}
                              onSave={(v) => upsertOutsourceMonth(cl.id, ownerId, selectedMonth, "rate_override", v)}
                            />
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{fm(toPay)}</td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            <EditableValue
                              value={paid}
                              size={13}
                              format={(v) => fm(v)}
                              onSave={(v) => upsertOutsourceMonth(cl.id, ownerId, selectedMonth, "paid", v)}
                            />
                          </td>
                          <td style={tdStyle}>
                            <select
                              value={status}
                              onChange={(ev) => upsertOutsourceMonth(cl.id, ownerId, selectedMonth, "status", ev.target.value)}
                              style={{
                                ...selectStyle,
                                width: "auto",
                                padding: "3px 6px",
                                fontSize: 11,
                                color: status === "paid" ? "var(--green)" : status === "partial" ? "var(--yellow)" : "var(--purple)",
                              }}
                            >
                              {["pending", "partial", "paid"].map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}

            {/* History — all other months */}
            <div style={{ marginTop: 40 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--s3)", textTransform: "uppercase", marginBottom: 12 }}>
                History
              </div>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Month</th>
                    <th style={thStyle}>Outsourcer</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Hours</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>To Pay</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Paid</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allMonths.map((month) => {
                    const monthEntries = entries.filter((e) => e.month === month);
                    const outsourceMap = new Map<string, number>();
                    monthEntries.forEach((e) => {
                      const m = members.find((mb) => mb.id === e.owner_id);
                      if (m && m.type === "outsource") {
                        outsourceMap.set(e.owner_id, (outsourceMap.get(e.owner_id) || 0) + e.hours * (e.coeff || 1));
                      }
                    });
                    const rows = Array.from(outsourceMap.entries());
                    if (rows.length === 0) return null;
                    return rows.map(([ownerId, hours], idx) => {
                      const m = members.find((mb) => mb.id === ownerId)!;
                      const om = outsourceMonths.find((o) => o.member_id === ownerId && o.month === month);
                      const rate = om?.rate_override ?? m.cost_rate ?? 0;
                      const toPay = hours * rate;
                      const paid = om?.paid || 0;
                      const status = om?.status || "pending";
                      return (
                        <tr key={month + ownerId}>
                          {idx === 0 && (
                            <td style={{ ...tdStyle, verticalAlign: "top", borderBottom: "1px solid var(--s1)" }} rowSpan={rows.length}>{month}</td>
                          )}
                          <td style={tdStyle}>{m.name}</td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>{hours}</td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>{fm(toPay)}</td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            <EditableValue
                              value={paid}
                              size={13}
                              format={(v) => fm(v)}
                              onSave={(v) => upsertOutsourceMonth(cl.id, ownerId, month, "paid", v)}
                            />
                          </td>
                          <td style={tdStyle}>
                            <select
                              value={status}
                              onChange={(ev) => upsertOutsourceMonth(cl.id, ownerId, month, "status", ev.target.value)}
                              style={{
                                ...selectStyle,
                                width: "auto",
                                padding: "3px 6px",
                                fontSize: 11,
                                color: status === "paid" ? "var(--green)" : status === "partial" ? "var(--yellow)" : "var(--purple)",
                              }}
                            >
                              {["pending", "partial", "paid"].map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ TEAM TAB ═══ */}
        {contentTab === "team" && (
          <div>
            {/* Rates */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--s3)", textTransform: "uppercase", marginBottom: 12 }}>
                Rates
              </div>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Role</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Rate</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((r) => (
                    <tr key={r.id}>
                      <td style={tdStyle}>{r.role}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{fm(r.rate)}/h</td>
                      <td style={{ ...tdStyle, width: 30 }}>
                        <button
                          onClick={() => deleteClientRate(r.id, cl.id)}
                          style={{ background: "none", border: "none", color: "var(--s3)", cursor: "pointer", fontSize: 14 }}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {showAddRate ? (
                <AddRateForm
                  clientId={cl.id}
                  existingRoles={Array.from(new Set(members.map((m) => m.role).filter(Boolean))).sort()}
                  takenRoles={new Set(rates.filter((r) => r.client_id === cl.id).map((r) => r.role))}
                  onClose={() => setShowAddRate(false)}
                />
              ) : (
                <button onClick={() => setShowAddRate(true)} style={{ ...btnStyle, marginTop: 12 }}>
                  + ADD RATE
                </button>
              )}
            </div>

            {/* Assigned members — can log hours in this project */}
            <AssignedMembers
              clientId={cl.id}
              members={members}
              assignments={assignments}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Summary Stats ───────────────────────────────────────────

function SummaryStats({
  hours, billed, estimate, estimateIsAuto, paid, owes, fm, clientId, month,
}: {
  hours: number; billed: number; estimate: number; estimateIsAuto?: boolean;
  paid: number; owes: number;
  fm: (v: number) => string; clientId: string; month: string;
}) {
  const labelStyle: React.CSSProperties = { fontSize: 9, color: "var(--s3)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 };
  const valStyle: React.CSSProperties = { fontSize: 15, fontWeight: 700, lineHeight: 1, color: "var(--s4)" };
  return (
    <div style={{ ...panelStyle, display: "flex", alignItems: "flex-end", gap: 28, padding: "14px 20px" }}>
      <div>
        <div style={valStyle}>{hours.toFixed(1)}</div>
        <div style={labelStyle}>hours</div>
      </div>
      <div>
        <div style={valStyle}>{fm(billed)}</div>
        <div style={labelStyle}>billed</div>
      </div>
      <div>
        <EditableValue value={estimate} size={15} color="var(--s4)" format={(v) => fm(v)} onSave={(v) => upsertClientMonth(clientId, month, "estimate", v)} />
        <div style={labelStyle}>estimate{estimateIsAuto ? " · auto" : ""}</div>
      </div>
      <div>
        <EditableValue value={paid} size={15} color="var(--s4)" format={(v) => fm(v)} onSave={(v) => upsertClientMonth(clientId, month, "paid", v)} />
        <div style={labelStyle}>paid</div>
      </div>
      <div>
        <div style={{ ...valStyle, color: owes > 0 ? "var(--red)" : "var(--green)" }}>
          {owes <= 0 ? "settled" : fm(owes)}
        </div>
        <div style={labelStyle}>owes</div>
      </div>
    </div>
  );
}

// ─── Add Entry Form ──────────────────────────────────────────

function AddEntryForm({
  clientId, month, members, rates, onClose,
}: {
  clientId: string; month: string; members: TeamMember[]; rates: ClientRate[]; onClose: () => void;
}) {
  const [mode, setMode] = useState<"date" | "week">("date");
  const [date, setDate] = useState(new Date().getDate().toString());
  const weeks = weeksInMonth(month);
  const currentWeek = isoWeek(new Date());
  const [weekNum, setWeekNum] = useState(
    weeks.find((w) => w.week === currentWeek)?.week || weeks[0]?.week || 0,
  );
  const [task, setTask] = useState("");
  const firstMember = members[0];
  const [ownerId, setOwnerId] = useState(firstMember?.id || "");
  const [role, setRole] = useState(
    (firstMember && rates.find((r) => r.role === firstMember.role)?.role) || firstMember?.role || rates[0]?.role || "",
  );
  const [hours, setHours] = useState("");

  function onOwnerChange(id: string) {
    setOwnerId(id);
    const m = members.find((x) => x.id === id);
    if (m) {
      const matched = rates.find((r) => r.role === m.role)?.role || m.role;
      setRole(matched);
    }
  }

  async function handleSubmit() {
    if (!ownerId || !role || !hours) return;
    if (mode === "date") {
      if (!task) return;
      await createEntry({ client_id: clientId, month, task, owner_id: ownerId, role, hours: Number(hours), entry_type: "hours_task", date });
    } else {
      const label = weeks.find((w) => w.week === weekNum)?.label || `Week ${weekNum}`;
      await createEntry({ client_id: clientId, month, task: task || label, owner_id: ownerId, role, hours: Number(hours), entry_type: "hours_week", week_num: weekNum });
    }
    onClose();
  }

  const roleOptions = Array.from(new Set([role, ...rates.map((r) => r.role), ...members.map((m) => m.role)].filter(Boolean)));

  return (
    <div style={{ ...panelStyle, marginTop: 16 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <button
          onClick={() => setMode("date")}
          style={{ ...btnStyle, fontSize: 10, padding: "4px 10px", background: mode === "date" ? "var(--accent)" : "var(--s2)", color: mode === "date" ? "#fff" : "var(--s4)" }}
        >
          By date
        </button>
        <button
          onClick={() => setMode("week")}
          style={{ ...btnStyle, fontSize: 10, padding: "4px 10px", background: mode === "week" ? "var(--accent)" : "var(--s2)", color: mode === "week" ? "#fff" : "var(--s4)" }}
        >
          By week
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        {mode === "date" ? (
          <div>
            <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Day</div>
            <input style={{ ...inputStyle, width: 60 }} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Week</div>
            <select style={{ ...selectStyle, width: 200 }} value={weekNum} onChange={(e) => setWeekNum(Number(e.target.value))}>
              {weeks.map((w) => (
                <option key={w.week} value={w.week}>{w.label}</option>
              ))}
            </select>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 150 }}>
          <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Task</div>
          <input style={inputStyle} value={task} onChange={(e) => setTask(e.target.value)} placeholder={mode === "week" ? "optional note" : ""} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Owner</div>
          <select style={{ ...selectStyle, width: 150 }} value={ownerId} onChange={(e) => onOwnerChange(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Role</div>
          <select style={{ ...selectStyle, width: 120 }} value={role} onChange={(e) => setRole(e.target.value)}>
            {roleOptions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Hours</div>
          <input style={{ ...inputStyle, width: 70 }} type="number" value={hours} onChange={(e) => setHours(e.target.value)} />
        </div>
        <button onClick={handleSubmit} style={btnStyle}>ADD</button>
        <button onClick={onClose} style={{ ...btnStyle, background: "var(--s2)", color: "var(--s4)" }}>CANCEL</button>
      </div>
    </div>
  );
}

// ─── Add Fixed Item Form ─────────────────────────────────────

function AddFixedForm({ clientId, currency, month, onClose }: { clientId: string; currency: Client["currency"]; month: string; onClose: () => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");

  async function handleSubmit() {
    if (!name || !price) return;
    await createFixedItem({ client_id: clientId, name, month, price: Number(price), qty: Number(qty) || 1 });
    onClose();
  }

  return (
    <div style={{ ...panelStyle, marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Name</div>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Price</div>
          <input style={{ ...inputStyle, width: 100 }} type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Qty</div>
          <input style={{ ...inputStyle, width: 60 }} type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
        <div style={{ color: "var(--s4)", fontSize: 13, whiteSpace: "nowrap" }}>
          = {formatMoney((Number(price) || 0) * (Number(qty) || 1), currency)}
        </div>
        <button onClick={handleSubmit} style={btnStyle}>CREATE</button>
        <button onClick={onClose} style={{ ...btnStyle, background: "var(--s2)", color: "var(--s4)" }}>CANCEL</button>
      </div>
    </div>
  );
}

// ─── Add Cost Form ───────────────────────────────────────────

function AddCostForm({
  fixedItemId, clientId, currency, members, onClose,
}: {
  fixedItemId: string; clientId: string; currency: Client["currency"]; members: TeamMember[]; onClose: () => void;
}) {
  const [costType, setCostType] = useState<"outsourcer" | "direct">("outsourcer");
  const assignable = members;

  // outsourcer fields
  const [memberId, setMemberId] = useState(assignable[0]?.id || "");
  const [hours, setHours] = useState("");
  const [rate, setRate] = useState(String(assignable[0]?.cost_rate || 0));

  // direct fields
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");

  function onMemberChange(id: string) {
    setMemberId(id);
    const m = assignable.find((x) => x.id === id);
    setRate(String(m?.cost_rate || 0));
  }

  async function handleSubmit() {
    if (costType === "outsourcer") {
      const m = assignable.find((mb) => mb.id === memberId);
      if (!m || !hours) return;
      const h = Number(hours);
      const r = Number(rate) || 0;
      await createFixedCost({
        fixed_item_id: fixedItemId,
        type: "outsourcer",
        description: `${m.name} — ${h}h`,
        amount: h * r,
        status: "planned",
        member_id: m.id,
        hours: h,
        rate: r,
        clientId,
      });
    } else {
      if (!desc || !amount) return;
      await createFixedCost({
        fixed_item_id: fixedItemId,
        type: "direct",
        description: desc,
        amount: Number(amount),
        status: "planned",
        clientId,
      });
    }
    onClose();
  }

  return (
    <div style={{ marginTop: 8, padding: 12, border: "1px solid var(--s2)", background: "var(--bg)" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button
          onClick={() => setCostType("outsourcer")}
          style={{ ...btnStyle, fontSize: 10, padding: "3px 8px", background: costType === "outsourcer" ? "var(--accent)" : "var(--s2)", color: costType === "outsourcer" ? "#fff" : "var(--s4)" }}
        >
          Outsourcer
        </button>
        <button
          onClick={() => setCostType("direct")}
          style={{ ...btnStyle, fontSize: 10, padding: "3px 8px", background: costType === "direct" ? "var(--accent)" : "var(--s2)", color: costType === "direct" ? "#fff" : "var(--s4)" }}
        >
          Direct
        </button>
      </div>

      {costType === "outsourcer" ? (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Person</div>
            <select style={{ ...selectStyle, width: 170 }} value={memberId} onChange={(e) => onMemberChange(e.target.value)}>
              {assignable.length === 0 && <option value="">— no members —</option>}
              {assignable.map((m) => (
                <option key={m.id} value={m.id}>{m.name} · {m.type}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Hours</div>
            <input style={{ ...inputStyle, width: 70 }} type="number" value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Rate</div>
            <input style={{ ...inputStyle, width: 70 }} type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
          </div>
          <div style={{ color: "var(--s4)", fontSize: 12, whiteSpace: "nowrap" }}>
            = {formatMoney((Number(hours) || 0) * (Number(rate) || 0), currency)}
          </div>
          <button onClick={handleSubmit} style={btnStyle}>ADD</button>
          <button onClick={onClose} style={{ ...btnStyle, background: "var(--s2)", color: "var(--s4)" }}>CANCEL</button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Description</div>
            <input style={inputStyle} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Amount</div>
            <input style={{ ...inputStyle, width: 100 }} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <button onClick={handleSubmit} style={btnStyle}>ADD</button>
          <button onClick={onClose} style={{ ...btnStyle, background: "var(--s2)", color: "var(--s4)" }}>CANCEL</button>
        </div>
      )}
    </div>
  );
}

// ─── Add Rate Form ───────────────────────────────────────────

function AddRateForm({
  clientId,
  existingRoles,
  takenRoles,
  onClose,
}: {
  clientId: string;
  existingRoles: string[];
  takenRoles: Set<string>;
  onClose: () => void;
}) {
  const available = existingRoles.filter((r) => !takenRoles.has(r));
  const [role, setRole] = useState(available[0] || "");
  const [rate, setRate] = useState("");

  async function handleSubmit() {
    if (!role || !rate) return;
    await createClientRate(clientId, role, Number(rate));
    onClose();
  }

  if (available.length === 0) {
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, fontSize: 12, color: "var(--s4)" }}>
        All team roles already have a rate.
        <button onClick={onClose} style={{ ...btnStyle, background: "var(--s2)", color: "var(--s4)" }}>CLOSE</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: 12 }}>
      <div>
        <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Role</div>
        <select style={{ ...selectStyle, width: 160 }} value={role} onChange={(e) => setRole(e.target.value)}>
          {available.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div>
        <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Rate</div>
        <input style={{ ...inputStyle, width: 80 }} type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
      </div>
      <button onClick={handleSubmit} style={btnStyle}>ADD</button>
      <button onClick={onClose} style={{ ...btnStyle, background: "var(--s2)", color: "var(--s4)" }}>CANCEL</button>
    </div>
  );
}

// ─── Assigned Members ────────────────────────────────────────

function AssignedMembers({
  clientId,
  members,
  assignments,
}: {
  clientId: string;
  members: TeamMember[];
  assignments: { id: string; member_id: string; client_id: string }[];
}) {
  const assignedIds = new Set(assignments.map((a) => a.member_id));
  const assignedMembers = members.filter((m) => assignedIds.has(m.id));
  const unassigned = members.filter((m) => !assignedIds.has(m.id));
  const [pick, setPick] = useState("");

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--s3)", textTransform: "uppercase", marginBottom: 12 }}>
        Assigned to project
      </div>
      <div style={{ fontSize: 12, color: "var(--s4)", marginBottom: 12 }}>
        Assigned members will be able to log hours to this project.
      </div>
      {assignedMembers.length === 0 ? (
        <div style={{ color: "var(--s4)", fontSize: 13, marginBottom: 12 }}>No one assigned yet</div>
      ) : (
        <div style={{ marginBottom: 12 }}>
          {assignedMembers.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 0",
                borderBottom: "1px solid var(--s2)",
              }}
            >
              <Badge type={m.type}>{m.type}</Badge>
              <span style={{ fontSize: 13 }}>{m.name}</span>
              <span style={{ fontSize: 12, color: "var(--s4)" }}>{m.role}</span>
              <button
                onClick={() => unassignTeamMember(m.id, clientId)}
                style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--s3)", cursor: "pointer", fontSize: 14 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {unassigned.length > 0 && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: 8 }}>
          <select
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            style={{ ...selectStyle, width: 220 }}
          >
            <option value="">Select member…</option>
            {unassigned.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.type} · {m.role})
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (!pick) return;
              assignTeamMember(pick, clientId);
              setPick("");
            }}
            style={btnStyle}
          >
            + ASSIGN
          </button>
        </div>
      )}
    </div>
  );
}
