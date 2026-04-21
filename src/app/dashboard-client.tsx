"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "./_components/badge";
import { formatMoney } from "@/lib/format";
import type { Client, Entry, ClientMonth, ClientRate } from "@/lib/types";

export function DashboardClient({
  clients,
  entries,
  months,
  rates,
  allMonths,
  defaultMonth,
}: {
  clients: Client[];
  entries: Entry[];
  months: ClientMonth[];
  rates: ClientRate[];
  allMonths: string[];
  defaultMonth: string;
}) {
  const [selectedMonth, setSelectedMonth] = useState(
    allMonths.includes(defaultMonth) ? defaultMonth : allMonths[allMonths.length - 1] || defaultMonth,
  );

  return (
    <div>
      {/* Month switcher */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, overflowX: "auto" }}>
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
          gap: 12,
        }}
      >
        {clients.map((cl) => {
          const getRate = (role: string) =>
            rates.find((r) => r.client_id === cl.id && r.role === role)?.rate || 0;
          const monthEntries = entries.filter(
            (e) => e.client_id === cl.id && e.month === selectedMonth,
          );
          const done = monthEntries.filter((e) => e.status === "done");
          const billed = done.reduce(
            (s, e) => s + e.hours * (e.coeff || 1) * getRate(e.role),
            0,
          );
          const manualEst =
            months.find((m) => m.client_id === cl.id && m.month === selectedMonth)?.estimate || 0;
          const autoEst = monthEntries
            .filter((e) => e.status !== "rejected")
            .reduce((s, e) => s + e.hours * (e.coeff || 1) * getRate(e.role), 0);
          const est = manualEst > 0 ? manualEst : autoEst;
          const pend = entries.filter(
            (e) => e.client_id === cl.id && (e.status === "submitted" || e.status === "pending"),
          ).length;
          return (
            <Link
              key={cl.id}
              href={"/clients/" + cl.id}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  background: "var(--s1)",
                  border: "1px solid var(--s2)",
                  padding: 24,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Badge type="active">active</Badge>
                    {cl.vat && <Badge type="planned">+VAT</Badge>}
                    {pend > 0 && (
                      <span style={{ color: "var(--red, #f66)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", alignSelf: "center" }}>
                        ({pend}) pending
                      </span>
                    )}
                  </div>
                  {cl.deal_lead && (
                    <div style={{ fontSize: 11, color: "var(--s4)", letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {cl.deal_lead}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: "var(--fg)",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  {cl.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--s4)", marginBottom: 20 }}>
                  {cl.currency}
                </div>
                <div style={{ display: "flex", gap: 32 }}>
                  <div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: "var(--green)",
                        lineHeight: 1,
                      }}
                    >
                      {formatMoney(billed, cl.currency)}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--s3)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        marginTop: 4,
                      }}
                    >
                      BILLED
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: "var(--s4)",
                        lineHeight: 1,
                      }}
                    >
                      {formatMoney(est, cl.currency)}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--s3)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        marginTop: 4,
                      }}
                    >
                      ESTIMATE
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
