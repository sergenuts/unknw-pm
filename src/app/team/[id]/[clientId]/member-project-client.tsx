"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Client, Entry, TeamMember, ClientRate, FixedItem, FixedCost } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { weeksInMonth, weekDateLabel } from "@/lib/weeks";
import { createMemberEntry, deleteMemberEntry, createFixedCost, deleteFixedCost, updateMemberEntryField, updateFixedCostField } from "@/app/actions";

function DeleteBtn({
  onConfirm,
  confirmMsg,
}: {
  onConfirm: () => Promise<void> | void;
  confirmMsg?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirmMsg && !confirm(confirmMsg)) return;
        startTransition(async () => {
          await onConfirm();
        });
      }}
      style={{
        background: "none",
        border: "none",
        color: pending ? "var(--accent)" : "var(--s3)",
        cursor: pending ? "wait" : "pointer",
        fontSize: 14,
        opacity: pending ? 0.7 : 1,
      }}
      title={pending ? "Deleting…" : "Delete"}
    >
      {pending ? "…" : "×"}
    </button>
  );
}

function InlineEdit({
  value,
  onSave,
  width,
  align = "left",
  type = "text",
}: {
  value: string | number;
  onSave: (v: string) => Promise<void> | void;
  width?: number;
  align?: "left" | "right";
  type?: "text" | "number";
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value ?? ""));
  const [pending, startTransition] = useTransition();
  if (!editing) {
    return (
      <span
        onClick={() => { setVal(String(value ?? "")); setEditing(true); }}
        style={{ cursor: "text", borderBottom: "1px dashed var(--s2)", paddingBottom: 1 }}
      >
        {value || "—"}
      </span>
    );
  }
  const commit = () => {
    setEditing(false);
    if (String(value ?? "") === val) return;
    startTransition(async () => { await onSave(val); });
  };
  return (
    <input
      autoFocus
      type={type}
      value={val}
      disabled={pending}
      onChange={(e) => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
      style={{
        background: "var(--s1)", border: "1px solid var(--s2)", color: "var(--fg)",
        padding: "2px 6px", fontSize: 13, width: width ?? 100, textAlign: align,
      }}
    />
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 600,
  color: "var(--s3)", letterSpacing: "0.08em", textTransform: "uppercase",
  borderBottom: "1px solid var(--s2)",
};
const tdStyle: React.CSSProperties = {
  padding: "8px 12px", borderBottom: "1px solid var(--s2)", color: "var(--fg)", fontSize: 13,
};
const btnStyle: React.CSSProperties = {
  padding: "6px 14px", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
  textTransform: "uppercase", background: "var(--accent)", color: "#fff",
  border: "none", cursor: "pointer",
};
const inputStyle: React.CSSProperties = {
  background: "var(--s1)", border: "1px solid var(--s2)", color: "var(--fg)",
  padding: "6px 10px", fontSize: 13,
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

const monthOrder = [
  "december 2025","january 2026","february 2026","march 2026","april 2026",
  "may 2026","june 2026","july 2026","august 2026","september 2026",
  "october 2026","november 2026","december 2026",
];

export function MemberProjectClient({
  member, client, entries, rates, fixedItems, fixedCosts, currentMonth,
}: {
  member: TeamMember;
  client: Client;
  entries: Entry[];
  rates: ClientRate[];
  fixedItems: FixedItem[];
  fixedCosts: FixedCost[];
  currentMonth: string;
}) {
  const monthSet = new Set<string>();
  entries.forEach((e) => monthSet.add(e.month));
  fixedItems.forEach((f) => monthSet.add(f.month));
  monthSet.add(currentMonth);
  const months = monthOrder.filter((m) => monthSet.has(m));

  const [selectedMonth, setSelectedMonth] = useState(
    months.includes(currentMonth) ? currentMonth : months[months.length - 1],
  );
  const [showAdd, setShowAdd] = useState<null | "hours_task" | "hours_week" | "fixed_task">(null);

  const mEntriesAll = entries
    .filter((e) => e.month === selectedMonth)
    .sort((a, b) => {
      const ka = Number(a.date) || (a.week_num ? a.week_num * 7 : 0);
      const kb = Number(b.date) || (b.week_num ? b.week_num * 7 : 0);
      return kb - ka;
    });
  const mEntries = mEntriesAll.filter((e) => e.status !== "rejected" && e.status !== "paused");
  const mFixedItems = fixedItems.filter((f) => f.month === selectedMonth);
  const mFixedCosts = [...fixedCosts.filter((c) =>
    mFixedItems.some((f) => f.id === c.fixed_item_id),
  )].reverse();
  const rateFor = (role: string) => rates.find((r) => r.role === role)?.rate || 0;
  const fm = (v: number) => formatMoney(v, client.currency);

  const isBilledEntry = (s: string) => s === "done";
  const isEstimateEntry = (s: string) => s === "pending" || s === "submitted" || s === "in progress";
  const isBilledCost = (s: string) => s === "paid" || s === "spent";
  const isEstimateCost = (s: string) => s === "pending" || s === "planned";

  const totalHours = mEntries.reduce((s, e) => s + (e.hours || 0), 0);
  const billedFromHours = mEntries
    .filter((e) => isBilledEntry(e.status))
    .reduce((s, e) => s + (e.hours || 0) * rateFor(e.role), 0);
  const billedFromFixed = mFixedCosts
    .filter((c) => isBilledCost(c.status))
    .reduce((s, c) => s + (c.amount || 0), 0);
  const totalBilled = billedFromHours + billedFromFixed;
  const estimateFromHours = mEntries
    .filter((e) => isEstimateEntry(e.status))
    .reduce((s, e) => s + (e.hours || 0) * rateFor(e.role), 0);
  const estimateFromFixed = mFixedCosts
    .filter((c) => isEstimateCost(c.status))
    .reduce((s, c) => s + (c.amount || 0), 0);
  const totalEstimate = estimateFromHours + estimateFromFixed;

  return (
    <div>
      <Link
        href={`/team/${member.id}`}
        style={{ color: "var(--s4)", fontSize: 12, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.04em" }}
      >
        ← BACK
      </Link>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, color: "var(--s4)" }}>{member.name} · {member.role}</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, textTransform: "uppercase", lineHeight: 0.92, margin: "8px 0 0", color: "var(--fg)" }}>
          {client.name}
        </h1>
        <div style={{ fontSize: 12, color: "var(--s4)", marginTop: 8 }}>
          Rates: {rates.length === 0 ? "none" : rates.map((r) => `${r.role} ${fm(r.rate)}/h`).join(" · ")}
        </div>
      </div>

      {/* Month tabs */}
      <div style={{ display: "flex", gap: 4, marginTop: 28, overflowX: "auto" }}>
        {months.map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMonth(m)}
            style={{
              padding: "7px 16px", fontSize: 11,
              fontWeight: selectedMonth === m ? 700 : 400,
              letterSpacing: "0.04em", textTransform: "uppercase",
              background: selectedMonth === m ? "var(--accent)" : "var(--s1)",
              color: selectedMonth === m ? "#fff" : "var(--s4)",
              border: selectedMonth === m ? "none" : "1px solid var(--s2)",
              cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ marginTop: 20, background: "var(--s1)", border: "1px solid var(--s2)", padding: "14px 20px", display: "flex", gap: 32 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--s4)", lineHeight: 1 }}>{totalHours.toFixed(1)}</div>
          <div style={{ fontSize: 9, color: "var(--s3)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>hours</div>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--green)", lineHeight: 1 }}>{fm(totalBilled)}</div>
          <div style={{ fontSize: 9, color: "var(--s3)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>billed</div>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--yellow)", lineHeight: 1 }}>{fm(totalEstimate)}</div>
          <div style={{ fontSize: 9, color: "var(--s3)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>estimate</div>
        </div>
      </div>

      {/* Add buttons */}
      <div style={{ marginTop: 24, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setShowAdd("hours_task")} style={btnStyle}>+ HOURS / TASK</button>
        <button onClick={() => setShowAdd("hours_week")} style={btnStyle}>+ HOURS / WEEK</button>
        <button
          onClick={() => setShowAdd("fixed_task")}
          disabled={mFixedItems.length === 0}
          title={mFixedItems.length === 0 ? "No fixed items in this project for this month" : ""}
          style={{
            ...btnStyle,
            opacity: mFixedItems.length === 0 ? 0.4 : 1,
            cursor: mFixedItems.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          + FIXED / TASK
        </button>
      </div>
      {mFixedItems.length === 0 && (
        <div style={{ fontSize: 11, color: "var(--s4)", marginTop: 6 }}>
          Fixed costs can be added only when the project has a fixed item this month.
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <AddForm
          type={showAdd}
          member={member}
          client={client}
          month={selectedMonth}
          rates={rates}
          fixedItems={mFixedItems}
          onClose={() => setShowAdd(null)}
        />
      )}

      {/* Entries list */}
      <div style={{ marginTop: 24 }}>
        {mEntriesAll.length === 0 && mFixedCosts.length === 0 ? (
          <div style={{ color: "var(--s4)", fontSize: 13, padding: "12px 0" }}>No entries yet for this month.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>When</th>
                <th style={thStyle}>Task / Fixed item</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Hours</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {mEntriesAll.map((e) => {
                const r = rateFor(e.role);
                const amt = (e.hours || 0) * r;
                const typeLabel = e.entry_type === "hours_week" ? "hours/week" : "hours/task";
                return (
                  <tr key={e.id}>
                    <td style={{ ...tdStyle, color: "var(--s4)", fontSize: 11, textTransform: "uppercase" }}>{typeLabel}</td>
                    <td style={tdStyle}>
                      {e.entry_type === "hours_week" ? (
                        <span style={{ color: "var(--s4)" }}>{weekDateLabel(selectedMonth, e.week_num)}</span>
                      ) : (
                        <InlineEdit
                          value={e.date || ""}
                          width={60}
                          onSave={(v) => updateMemberEntryField(e.id, "date", v, member.id, client.id)}
                        />
                      )}
                    </td>
                    <td style={tdStyle}>
                      <InlineEdit
                        value={e.task}
                        width={220}
                        onSave={(v) => updateMemberEntryField(e.id, "task", v, member.id, client.id)}
                      />
                      <span style={{ color: r === 0 ? "var(--red)" : "var(--s4)", fontSize: 11, marginLeft: 8 }}>
                        · {e.role}{r === 0 ? " (no rate)" : ""}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <InlineEdit
                        value={e.hours}
                        type="number"
                        width={70}
                        align="right"
                        onSave={(v) => updateMemberEntryField(e.id, "hours", Number(v), member.id, client.id)}
                      />
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{fm(amt)}</td>
                    <td style={{ ...tdStyle, color: "var(--s4)" }}>{e.status}</td>
                    <td style={tdStyle}>
                      <DeleteBtn
                        confirmMsg={`Delete entry "${e.task}"?`}
                        onConfirm={() => deleteMemberEntry(e.id, member.id, client.id)}
                      />
                    </td>
                  </tr>
                );
              })}
              {mFixedCosts.map((c) => {
                const item = mFixedItems.find((f) => f.id === c.fixed_item_id);
                return (
                  <tr key={c.id}>
                    <td style={{ ...tdStyle, color: "var(--s4)", fontSize: 11, textTransform: "uppercase" }}>fixed</td>
                    <td style={tdStyle}>—</td>
                    <td style={tdStyle}>
                      {item?.name || "—"}{" "}
                      <span style={{ color: "var(--s4)" }}>· </span>
                      <InlineEdit
                        value={c.description}
                        width={200}
                        onSave={(v) => updateFixedCostField(c.id, "description", v, client.id)}
                      />
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>—</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>
                      <InlineEdit
                        value={c.amount}
                        type="number"
                        width={90}
                        align="right"
                        onSave={(v) => updateFixedCostField(c.id, "amount", Number(v), client.id)}
                      />
                    </td>
                    <td style={{ ...tdStyle, color: "var(--s4)" }}>{c.status}</td>
                    <td style={tdStyle}>
                      <DeleteBtn
                        confirmMsg={`Delete cost "${c.description}"?`}
                        onConfirm={() => deleteFixedCost(c.id, client.id)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function AddForm({
  type, member, client, month, rates, fixedItems, onClose,
}: {
  type: "hours_task" | "hours_week" | "fixed_task";
  member: TeamMember;
  client: Client;
  month: string;
  rates: ClientRate[];
  fixedItems: FixedItem[];
  onClose: () => void;
}) {
  const defaultRole = rates.find((r) => r.role === member.role)?.role || rates[0]?.role || member.role;
  const [task, setTask] = useState("");
  const [date, setDate] = useState(String(new Date().getDate()));
  const [hours, setHours] = useState("");
  const [amount, setAmount] = useState("");
  const [role, setRole] = useState(defaultRole);
  const weeks = weeksInMonth(month);
  const [weekNum, setWeekNum] = useState(weeks[0]?.week || 0);
  const [fixedItemId, setFixedItemId] = useState(fixedItems[0]?.id || "");
  const [note, setNote] = useState("");
  const [fixedBillingMode, setFixedBillingMode] = useState<"amount" | "hours">("amount");
  const [fixedHours, setFixedHours] = useState("");
  const rateForFixed = rates.find((r) => r.role === role)?.rate || member.cost_rate || 0;
  const computedFromHours = (Number(fixedHours) || 0) * rateForFixed;

  async function submit() {
    const base = {
      client_id: client.id,
      month,
      owner_id: member.id,
      role,
      entry_type: type,
    };
    if (type === "hours_task") {
      if (!task || !hours) return;
      await createMemberEntry({ ...base, task, date, hours: Number(hours) });
    } else if (type === "hours_week") {
      if (!hours || !weekNum) return;
      const label = weeks.find((w) => w.week === weekNum)?.label || weekDateLabel(month, weekNum);
      await createMemberEntry({ ...base, task: label, week_num: weekNum, hours: Number(hours) });
    } else {
      if (!fixedItemId) return;
      let finalAmount = 0;
      let description = note || member.name;
      if (fixedBillingMode === "hours") {
        const h = Number(fixedHours);
        if (!h) return;
        finalAmount = h * rateForFixed;
        description = `${description} — ${h}h × ${rateForFixed}`;
      } else {
        if (!amount) return;
        finalAmount = Number(amount);
      }
      await createFixedCost({
        fixed_item_id: fixedItemId,
        type: "outsourcer",
        description,
        amount: finalAmount,
        status: "pending",
        member_id: member.id,
        hours: fixedBillingMode === "hours" ? Number(fixedHours) : undefined,
        rate: fixedBillingMode === "hours" ? rateForFixed : undefined,
        clientId: client.id,
      });
    }
    onClose();
  }

  const label = type === "hours_task" ? "HOURS / TASK"
    : type === "hours_week" ? "HOURS / WEEK"
    : "FIXED / TASK";

  return (
    <div style={{ background: "var(--s1)", border: "1px solid var(--s2)", padding: 20, marginTop: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--s3)", textTransform: "uppercase", marginBottom: 12 }}>
        {label}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        {type === "hours_task" && (
          <>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Task</div>
              <input style={{ ...inputStyle, width: "100%" }} value={task} onChange={(e) => setTask(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Role</div>
              <select style={{ ...selectStyle, width: 130 }} value={role} onChange={(e) => setRole(e.target.value)}>
                {rates.length === 0 ? <option value={member.role}>{member.role}</option> : rates.map((r) => (
                  <option key={r.id} value={r.role}>{r.role}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Day</div>
              <input style={{ ...inputStyle, width: 60 }} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Hours</div>
              <input style={{ ...inputStyle, width: 80 }} type="number" value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
          </>
        )}

        {type === "hours_week" && (
          <>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Week</div>
              <select style={{ ...selectStyle, width: "100%" }} value={weekNum} onChange={(e) => setWeekNum(Number(e.target.value))}>
                {weeks.map((w) => (
                  <option key={w.week} value={w.week}>{w.label}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Role</div>
              <select style={{ ...selectStyle, width: 130 }} value={role} onChange={(e) => setRole(e.target.value)}>
                {rates.length === 0 ? <option value={member.role}>{member.role}</option> : rates.map((r) => (
                  <option key={r.id} value={r.role}>{r.role}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Hours</div>
              <input style={{ ...inputStyle, width: 80 }} type="number" value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
          </>
        )}

        {type === "fixed_task" && (
          <>
            <div style={{ width: "100%", display: "flex", gap: 6, marginBottom: 4 }}>
              <button
                onClick={() => setFixedBillingMode("amount")}
                style={{ ...btnStyle, fontSize: 10, padding: "4px 10px", background: fixedBillingMode === "amount" ? "var(--accent)" : "var(--s2)", color: fixedBillingMode === "amount" ? "#fff" : "var(--s4)" }}
              >
                Fixed amount
              </button>
              <button
                onClick={() => setFixedBillingMode("hours")}
                style={{ ...btnStyle, fontSize: 10, padding: "4px 10px", background: fixedBillingMode === "hours" ? "var(--accent)" : "var(--s2)", color: fixedBillingMode === "hours" ? "#fff" : "var(--s4)" }}
              >
                By hours
              </button>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Fixed item</div>
              <select
                style={{ ...selectStyle, width: "100%" }}
                value={fixedItemId}
                onChange={(e) => setFixedItemId(e.target.value)}
              >
                {fixedItems.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 150 }}>
              <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Note</div>
              <input style={{ ...inputStyle, width: "100%" }} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            {fixedBillingMode === "amount" ? (
              <div>
                <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Amount</div>
                <input style={{ ...inputStyle, width: 100 }} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
            ) : (
              <>
                <div>
                  <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Hours</div>
                  <input style={{ ...inputStyle, width: 80 }} type="number" value={fixedHours} onChange={(e) => setFixedHours(e.target.value)} />
                </div>
                <div style={{ fontSize: 12, color: "var(--s4)", paddingBottom: 6 }}>
                  × {rateForFixed}/h = {formatMoney(computedFromHours, client.currency)}
                </div>
              </>
            )}
          </>
        )}

        <button onClick={submit} style={btnStyle}>ADD</button>
        <button onClick={onClose} style={{ ...btnStyle, background: "var(--s2)", color: "var(--s4)" }}>CANCEL</button>
      </div>
    </div>
  );
}
