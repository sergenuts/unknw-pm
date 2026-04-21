import { supabase } from "@/lib/supabase";
import type { Entry, TeamMember, Client, FixedCost, FixedItem } from "@/lib/types";
import { ApprovalsClient } from "./approvals-client";

export const dynamic = "force-dynamic";

async function getData() {
  const [entriesRes, membersRes, clientsRes, fixedCostsRes, fixedItemsRes] = await Promise.all([
    supabase.from("entries").select("*").in("status", ["pending", "submitted"]),
    supabase.from("team_members").select("*"),
    supabase.from("clients").select("*"),
    supabase.from("fixed_costs").select("*").eq("status", "pending"),
    supabase.from("fixed_items").select("*"),
  ]);
  return {
    entries: (entriesRes.data || []) as Entry[],
    members: (membersRes.data || []) as TeamMember[],
    clients: (clientsRes.data || []) as Client[],
    fixedCosts: (fixedCostsRes.data || []) as FixedCost[],
    fixedItems: (fixedItemsRes.data || []) as FixedItem[],
  };
}

export default async function ApprovalsPage() {
  const data = await getData();
  return <ApprovalsClient {...data} />;
}
