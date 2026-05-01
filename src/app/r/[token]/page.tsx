import { supabase } from "@/lib/supabase";
import type { Client, Entry, FixedItem, ClientRate, TeamMember } from "@/lib/types";
import { ReportView } from "./report-view";

export const dynamic = "force-dynamic";

async function getData(token: string, month: string | undefined, variant: "full" | "short") {
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("report_token", token)
    .single();
  if (!client) return null;

  const [entriesRes, ratesRes, fixedRes, membersRes] = await Promise.all([
    supabase.from("entries").select("*").eq("client_id", (client as Client).id),
    supabase.from("client_rates").select("*").eq("client_id", (client as Client).id),
    supabase.from("fixed_items").select("*").eq("client_id", (client as Client).id),
    supabase.from("team_members").select("id, name, role"),
  ]);

  return {
    client: client as Client,
    entries: ((entriesRes.data || []) as Entry[]).filter(
      (e) => e.status !== "rejected" && e.status !== "paused",
    ),
    rates: (ratesRes.data || []) as ClientRate[],
    fixed: (fixedRes.data || []) as FixedItem[],
    members: (membersRes.data || []) as Pick<TeamMember, "id" | "name" | "role">[],
    month,
    variant,
  };
}

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ m?: string; v?: string }>;
}) {
  const { token } = await params;
  const { m, v } = await searchParams;
  const variant = v === "short" ? "short" : "full";
  const data = await getData(token, m, variant);
  if (!data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif", background: "#fafaf9", color: "#555" }}>
        Report not found.
      </div>
    );
  }
  return <ReportView {...data} />;
}
