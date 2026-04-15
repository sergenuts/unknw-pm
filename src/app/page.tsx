import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatMoney, getCurrentMonth } from "@/lib/format";
import { Badge } from "./_components/badge";
import type { Client, Entry, FixedItem, ClientMonth, ClientRate } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getData() {
  const [clientsRes, entriesRes, fixedRes, monthsRes, ratesRes] = await Promise.all([
    supabase.from("clients").select("*"),
    supabase.from("entries").select("*"),
    supabase.from("fixed_items").select("*"),
    supabase.from("client_months").select("*"),
    supabase.from("client_rates").select("*"),
  ]);
  return {
    clients: (clientsRes.data || []) as Client[],
    entries: (entriesRes.data || []) as Entry[],
    fixed: (fixedRes.data || []) as FixedItem[],
    months: (monthsRes.data || []) as ClientMonth[],
    rates: (ratesRes.data || []) as ClientRate[],
  };
}

function calcClient(
  cl: Client,
  entries: Entry[],
  fixed: FixedItem[],
  months: ClientMonth[],
  rates: ClientRate[]
) {
  const getRate = (role: string) => rates.find((r) => r.client_id === cl.id && r.role === role)?.rate || 0;
  const done = entries.filter((e) => e.client_id === cl.id && e.status === "done");
  const billed = done.reduce((s, e) => s + e.hours * (e.coeff || 1) * getRate(e.role), 0);
  const clMonths = months.filter((m) => m.client_id === cl.id);
  const totalPaid = clMonths.reduce((s, m) => s + (m.paid || 0), 0);
  const fpTotal = fixed.filter((f) => f.client_id === cl.id).reduce((s, f) => s + f.total, 0);
  const curM = getCurrentMonth();
  const curDone = done.filter((e) => e.month === curM);
  const curBill = curDone.reduce((s, e) => s + e.hours * (e.coeff || 1) * getRate(e.role), 0);
  const curEst = clMonths.find((m) => m.month === curM)?.estimate || 0;
  const pend = entries.filter((e) => e.client_id === cl.id && e.status === "submitted").length;
  return {
    earned: billed + fpTotal,
    debt: billed - totalPaid,
    curBill,
    curEst,
    pend,
  };
}

export default async function DashboardPage() {
  const { clients, entries, fixed, months, rates } = await getData();
  const curM = getCurrentMonth();

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 32,
        }}
      >
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
            001 — DASHBOARD
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
            ALL <span style={{ fontWeight: 300 }}>CLIENTS</span>
          </h1>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
          gap: 12,
        }}
      >
        {clients.map(function (cl) {
          const d = calcClient(cl, entries, fixed, months, rates);
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
                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                  <Badge type="active">active</Badge>
                  {cl.vat && <Badge type="planned">+VAT</Badge>}
                  {d.pend > 0 && (
                    <Badge type="submitted">{d.pend} pending</Badge>
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
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--s4)",
                    marginBottom: 20,
                  }}
                >
                  {cl.deal_lead} · {cl.currency}
                </div>
                {/* Main stats */}
                <div
                  style={{ display: "flex", gap: 32, marginBottom: 12 }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: "var(--green)",
                        lineHeight: 1,
                      }}
                    >
                      {formatMoney(d.earned, cl.currency)}
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
                      TOTAL EARNED
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: d.debt > 0 ? "var(--red)" : "var(--green)",
                        lineHeight: 1,
                      }}
                    >
                      {formatMoney(d.debt, cl.currency)}
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
                      CLIENT OWES
                    </div>
                  </div>
                </div>
                {/* Current month */}
                <div
                  style={{
                    borderTop: "1px solid var(--s2)",
                    paddingTop: 12,
                    display: "flex",
                    gap: 24,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      {formatMoney(d.curBill, cl.currency)}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: "var(--s3)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        marginTop: 4,
                      }}
                    >
                      {curM.split(" ")[0].toUpperCase()} BILLED
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: "var(--s4)",
                        lineHeight: 1,
                      }}
                    >
                      {formatMoney(d.curEst, cl.currency)}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: "var(--s3)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        marginTop: 4,
                      }}
                    >
                      {curM.split(" ")[0].toUpperCase()} EST
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
