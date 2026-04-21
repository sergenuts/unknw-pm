"use client";

import { useState } from "react";
import Link from "next/link";
import type { Client, Entry, TeamMember, ClientRate, FixedItem, FixedCost } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { weeksInMonth } from "@/lib/weeks";
import { createMemberEntry, deleteMemberEntry, createFixedCost, deleteFixedCost } from "@/app/actions";

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

  const mEntries = entries.filter((e) => e.month === selectedMonth);
  const mFixedItems = fixedItems.filter((f) => f.month === selectedMonth);
  const mFixedCosts = fixedCosts.filter((c) =>
    mFixedItems.some((f) => f.id === c.fixed_item_id),
  );
  const rateFor = (role: string) => rates.find((r) => r.role === role)?.rate || 0;
  const fm = (v: number) => formatMoney(v, client.currency);

  const totalHours = mEntries.reduce((s, e) => s + (e.hours || 0), 0);
  const totalFromHours = mEntries.reduce((s, e) => s + (e.hours || 0) * rateFor(e.role), 0);
  const totalFromFixed = mFixedCosts.reduce((s, c) => s + (c.amount || 0), 0);
  const totalBilled = totalFromHours + totalFromFixed;

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
        {mEntries.length === 0 && mFixedCosts.length === 0 ? (
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
              {mEntries.map((e) => {
                const r = rateFor(e.role);
                const amt = (e.hours || 0) * r;
                const when =
                  e.entry_type === "hours_week"
                    ? `Week ${e.week_num ?? "?"}`
                    : e.date || "—";
                const typeLabel = e.entry_type === "hours_week" ? "hours/week" : "hours/task";
                return (
                  <tr key={e.id}>
                    <td style={{ ...tdStyle, color: "var(--s4)", fontSize: 11, textTransform: "uppercase" }}>{typeLabel}</td>
                    <td style={tdStyle}>{when}</td>
                    <td style={tdStyle}>
                      {e.task}
                      <span style={{ color: r === 0 ? "var(--red)" : "var(--s4)", fontSize: 11, marginLeft: 8 }}>
                        · {e.role}{r === 0 ? " (no rate)" : ""}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>{e.hours}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{fm(amt)}</td>
                    <td style={{ ...tdStyle, color: "var(--s4)" }}>{e.status}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => deleteMemberEntry(e.id, member.id, client.id)}
                        style={{ background: "none", border: "none", color: "var(--s3)", cursor: "pointer", fontSize: 14 }}
                      >×</button>
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
                    <td style={tdStyle}>{item?.name || "—"} <span style={{ color: "var(--s4)" }}>· {c.description}</span></td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>—</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{fm(c.amount)}</td>
                    <td style={{ ...tdStyle, color: "var(--s4)" }}>{c.status}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => deleteFixedCost(c.id, client.id)}
                        style={{ background: "none", border: "none", color: "var(--s3)", cursor: "pointer", fontSize: 14 }}
                      >×</button>
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
      const label = weeks.find((w) => w.week === weekNum)?.label || `Week ${weekNum}`;
      await createMemberEntry({ ...base, task: label, week_num: weekNum, hours: Number(hours) });
    } else {
      if (!fixedItemId || !amount) return;
      await createFixedCost({
        fixed_item_id: fixedItemId,
        type: "outsourcer",
        description: note || member.name,
        amount: Number(amount),
        status: "pending",
        member_id: member.id,
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
            <div>
              <div style={{ fontSize: 10, color: "var(--s3)", marginBottom: 4, textTransform: "uppercase" }}>Amount</div>
              <input style={{ ...inputStyle, width: 100 }} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </>
        )}

        <button onClick={submit} style={btnStyle}>ADD</button>
        <button onClick={onClose} style={{ ...btnStyle, background: "var(--s2)", color: "var(--s4)" }}>CANCEL</button>
      </div>
    </div>
  );
}
