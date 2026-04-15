import { supabase } from "@/lib/supabase";
import type { TeamMember, Client, ClientRate } from "@/lib/types";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

async function getData() {
  const [membersRes, clientsRes, ratesRes] = await Promise.all([
    supabase.from("team_members").select("*").order("created_at"),
    supabase.from("clients").select("*").order("created_at"),
    supabase.from("client_rates").select("*"),
  ]);
  return {
    members: (membersRes.data || []) as TeamMember[],
    clients: (clientsRes.data || []) as Client[],
    rates: (ratesRes.data || []) as ClientRate[],
  };
}

export default async function SettingsPage() {
  const data = await getData();
  return <SettingsClient {...data} />;
}
