import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCurrentMonth } from "@/lib/format";
import type { Client, Entry, TeamMember, ClientRate, FixedItem, FixedCost } from "@/lib/types";
import { MemberProjectClient } from "./member-project-client";

export const dynamic = "force-dynamic";

async function getData(memberId: string, clientId: string) {
  const [memberRes, clientRes, entriesRes, ratesRes, assignRes, fixedRes] = await Promise.all([
    supabase.from("team_members").select("*").eq("id", memberId).single(),
    supabase.from("clients").select("*").eq("id", clientId).single(),
    supabase
      .from("entries")
      .select("*")
      .eq("owner_id", memberId)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase.from("client_rates").select("*").eq("client_id", clientId),
    supabase
      .from("team_assignments")
      .select("*")
      .eq("member_id", memberId)
      .eq("client_id", clientId),
    supabase.from("fixed_items").select("*").eq("client_id", clientId),
  ]);
  const fixedItems = (fixedRes.data || []) as FixedItem[];
  const fixedIds = fixedItems.map((f) => f.id);
  let fixedCosts: FixedCost[] = [];
  if (fixedIds.length > 0) {
    const { data } = await supabase
      .from("fixed_costs")
      .select("*")
      .in("fixed_item_id", fixedIds)
      .eq("member_id", memberId);
    fixedCosts = (data || []) as FixedCost[];
  }
  return {
    member: memberRes.data as TeamMember | null,
    client: clientRes.data as Client | null,
    entries: (entriesRes.data || []) as Entry[],
    rates: (ratesRes.data || []) as ClientRate[],
    assigned: (assignRes.data || []).length > 0,
    fixedItems,
    fixedCosts,
  };
}

export default async function MemberProjectPage({
  params,
}: {
  params: Promise<{ id: string; clientId: string }>;
}) {
  const { id, clientId } = await params;
  const { member, client, entries, rates, assigned, fixedItems, fixedCosts } = await getData(id, clientId);
  if (!member || !client) return <div style={{ color: "var(--s4)" }}>Not found</div>;
  if (!assigned) {
    return (
      <div style={{ color: "var(--s4)" }}>
        <Link href={`/team/${id}`} style={{ color: "var(--s4)", fontSize: 12 }}>← BACK</Link>
        <div style={{ marginTop: 16 }}>Not assigned to this project.</div>
      </div>
    );
  }
  const cur = getCurrentMonth();

  return (
    <MemberProjectClient
      member={member}
      client={client}
      entries={entries}
      rates={rates}
      fixedItems={fixedItems}
      fixedCosts={fixedCosts}
      currentMonth={cur}
    />
  );
}
