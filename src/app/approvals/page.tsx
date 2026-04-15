import { supabase } from "@/lib/supabase";
import type { Entry, TeamMember, Client } from "@/lib/types";
import { ApprovalsClient } from "./approvals-client";

export const dynamic = "force-dynamic";

async function getData() {
  const [entriesRes, membersRes, clientsRes] = await Promise.all([
    supabase.from("entries").select("*").eq("status", "submitted"),
    supabase.from("team_members").select("*"),
    supabase.from("clients").select("*"),
  ]);
  return {
    entries: (entriesRes.data || []) as Entry[],
    members: (membersRes.data || []) as TeamMember[],
    clients: (clientsRes.data || []) as Client[],
  };
}

export default async function ApprovalsPage() {
  const { entries, members, clients } = await getData();

  return <ApprovalsClient entries={entries} members={members} clients={clients} />;
}
