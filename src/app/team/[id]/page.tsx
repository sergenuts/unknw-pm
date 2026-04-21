import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCurrentMonth, formatMoney } from "@/lib/format";
import { Badge } from "@/app/_components/badge";
import type { Client, Entry, TeamMember, ClientRate, FixedCost, FixedItem } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getData(memberId: string) {
  const [memberRes, assignRes, clientsRes, entriesRes, ratesRes, fixedCostsRes, fixedItemsRes] = await Promise.all([
    supabase.from("team_members").select("*").eq("id", memberId).single(),
    supabase.from("team_assignments").select("*").eq("member_id", memberId),
    supabase.from("clients").select("*"),
    supabase.from("entries").select("*").eq("owner_id", memberId),
    supabase.from("client_rates").select("*"),
    supabase.from("fixed_costs").select("*").eq("member_id", memberId),
    supabase.from("fixed_items").select("*"),
  ]);
  return {
    member: memberRes.data as TeamMember | null,
    assignedClientIds: (assignRes.data || []).map((a: { client_id: string }) => a.client_id),
    clients: (clientsRes.data || []) as Client[],
    entries: (entriesRes.data || []) as Entry[],
    rates: (ratesRes.data || []) as ClientRate[],
    fixedCosts: (fixedCostsRes.data || []) as FixedCost[],
    fixedItems: (fixedItemsRes.data || []) as FixedItem[],
  };
}

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { member, assignedClientIds, clients, entries, rates, fixedCosts, fixedItems } = await getData(id);
  if (!member) return <div style={{ color: "var(--s4)" }}>Member not found</div>;
  const cur = getCurrentMonth();
  const assigned = clients.filter((c) => assignedClientIds.includes(c.id));
  const fixedItemById = new Map(fixedItems.map((f) => [f.id, f]));

  return (
    <div>
      <Link
        href="/settings"
        style={{ color: "var(--s4)", fontSize: 12, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.04em" }}
      >
        ← BACK
      </Link>

      <div style={{ marginTop: 16, display: "flex", gap: 8, marginBottom: 10 }}>
        <Badge type={member.type}>{member.type}</Badge>
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 800, textTransform: "uppercase", lineHeight: 0.92, margin: 0, color: "var(--fg)" }}>
        {member.name}
      </h1>
      <div style={{ fontSize: 12, color: "var(--s4)", marginTop: 8 }}>
        {member.role}{member.email ? " · " + member.email : ""}
      </div>

      <div style={{ marginTop: 32, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "var(--s3)", textTransform: "uppercase", marginBottom: 12 }}>
        My projects
      </div>

      {assigned.length === 0 ? (
        <div style={{ color: "var(--s4)", fontSize: 13 }}>Not assigned to any project yet.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 12 }}>
          {assigned.map((c) => {
            const mine = entries.filter((e) => e.client_id === c.id);
            const mineCur = mine.filter((e) => e.month === cur);
            const hoursCur = mineCur.reduce((s, e) => s + (e.hours || 0), 0);
            const fixedCur = mineCur.filter((e) => e.entry_type === "fixed_task").reduce((s, e) => s + (e.amount || 0), 0);
            const myRate = rates.find((r) => r.client_id === c.id && r.role === member.role)?.rate || 0;
            const fixedCostsCur = fixedCosts
              .filter((fc) => {
                const fi = fixedItemById.get(fc.fixed_item_id);
                return fi && fi.client_id === c.id && fi.month === cur;
              })
              .reduce((s, fc) => s + (fc.amount || 0), 0);
            const billedCur = mineCur
              .filter((e) => e.entry_type !== "fixed_task")
              .reduce((s, e) => s + (e.hours || 0) * myRate, 0) + fixedCur + fixedCostsCur;
            return (
              <Link
                key={c.id}
                href={`/team/${member.id}/${c.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div style={{ background: "var(--s1)", border: "1px solid var(--s2)", padding: 20, cursor: "pointer" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "var(--s4)", marginBottom: 16 }}>{c.currency}{mine.length > 0 ? ` · ${mine.length} entries total` : ""}</div>
                  <div style={{ display: "flex", gap: 24 }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{hoursCur.toFixed(1)}</div>
                      <div style={{ fontSize: 9, color: "var(--s3)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 }}>
                        {cur.split(" ")[0]} hours
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1, color: "var(--green)" }}>{formatMoney(billedCur, c.currency)}</div>
                      <div style={{ fontSize: 9, color: "var(--s3)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 }}>
                        {cur.split(" ")[0]} billed
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
