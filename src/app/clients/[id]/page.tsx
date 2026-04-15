import { supabase } from "@/lib/supabase";
import type { Client, Entry, FixedItem, FixedCost, ClientMonth, ClientRate, TeamMember } from "@/lib/types";
import { ClientDetail } from "./client-page";

export const dynamic = "force-dynamic";

interface TeamAssignment {
  id: string;
  member_id: string;
  client_id: string;
}

async function getData(id: string) {
  const [
    clientRes,
    entriesRes,
    ratesRes,
    monthsRes,
    fixedRes,
    assignmentsRes,
    membersRes,
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase.from("entries").select("*").eq("client_id", id).order("created_at", { ascending: true }),
    supabase.from("client_rates").select("*").eq("client_id", id),
    supabase.from("client_months").select("*").eq("client_id", id),
    supabase.from("fixed_items").select("*").eq("client_id", id),
    supabase.from("team_assignments").select("*").eq("client_id", id),
    supabase.from("team_members").select("*"),
  ]);

  const fixed = (fixedRes.data || []) as FixedItem[];
  const fixedIds = fixed.map((f) => f.id);
  let costs: FixedCost[] = [];
  if (fixedIds.length > 0) {
    const { data } = await supabase.from("fixed_costs").select("*").in("fixed_item_id", fixedIds);
    costs = (data || []) as FixedCost[];
  }

  return {
    client: clientRes.data as Client,
    entries: (entriesRes.data || []) as Entry[],
    rates: (ratesRes.data || []) as ClientRate[],
    months: (monthsRes.data || []) as ClientMonth[],
    fixed,
    costs,
    assignments: (assignmentsRes.data || []) as TeamAssignment[],
    members: (membersRes.data || []) as TeamMember[],
  };
}

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData(id);

  if (!data.client) {
    return <div style={{ color: "var(--s4)", padding: 40 }}>Client not found</div>;
  }

  return <ClientDetail {...data} />;
}
