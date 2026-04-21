import { supabase } from "@/lib/supabase";
import { getCurrentMonth } from "@/lib/format";
import { DashboardClient } from "./dashboard-client";
import type { Client, Entry, ClientMonth, ClientRate, FixedItem } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getData() {
  const [clientsRes, entriesRes, monthsRes, ratesRes, fixedRes] = await Promise.all([
    supabase.from("clients").select("*"),
    supabase.from("entries").select("*"),
    supabase.from("client_months").select("*"),
    supabase.from("client_rates").select("*"),
    supabase.from("fixed_items").select("*"),
  ]);
  return {
    clients: (clientsRes.data || []) as Client[],
    entries: (entriesRes.data || []) as Entry[],
    months: (monthsRes.data || []) as ClientMonth[],
    rates: (ratesRes.data || []) as ClientRate[],
    fixed: (fixedRes.data || []) as FixedItem[],
  };
}

export default async function DashboardPage() {
  const { clients, entries, months, rates, fixed } = await getData();
  const cur = getCurrentMonth();

  const monthOrder = [
    "december 2025", "january 2026", "february 2026", "march 2026", "april 2026",
    "may 2026", "june 2026", "july 2026", "august 2026", "september 2026",
    "october 2026", "november 2026", "december 2026",
  ];
  const monthSet = new Set<string>();
  entries.forEach((e) => monthSet.add(e.month));
  months.forEach((m) => monthSet.add(m.month));
  monthSet.add(cur);
  const allMonths = monthOrder.filter((m) => monthSet.has(m));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
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

      <DashboardClient
        clients={clients}
        entries={entries}
        months={months}
        rates={rates}
        fixed={fixed}
        allMonths={allMonths}
        defaultMonth={cur}
      />
    </div>
  );
}
