import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "./supabase";

export async function guardMemberPage(memberId: string) {
  const jar = await cookies();
  const isAdmin = jar.get("admin_auth")?.value === "1";
  if (isAdmin) return;

  const memberAuth = jar.get("member_auth")?.value || "";
  const loginPath = `/team/${memberId}/login`;

  if (memberAuth !== memberId) redirect(loginPath);

  const { data } = await supabase
    .from("team_members")
    .select("password")
    .eq("id", memberId)
    .single();
  if (!data?.password) redirect(loginPath);
}
