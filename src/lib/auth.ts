import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "./supabase";

export type AuthRole = "admin" | "viewer" | null;

export async function currentRole(): Promise<AuthRole> {
  const v = (await cookies()).get("admin_auth")?.value;
  if (v === "1") return "admin";
  if (v === "viewer") return "viewer";
  return null;
}

export async function requireAdmin(): Promise<void> {
  const r = await currentRole();
  if (r !== "admin") {
    throw new Error("Forbidden — viewer cannot modify data");
  }
}

/** Blocks viewer role. Members & unauthenticated pass (they're guarded elsewhere). */
export async function assertNotViewer(): Promise<void> {
  const r = await currentRole();
  if (r === "viewer") {
    throw new Error("Read-only mode — changes are not allowed");
  }
}

export async function guardMemberPage(memberId: string) {
  const jar = await cookies();
  const isAdmin = jar.get("admin_auth")?.value === "1";
  if (isAdmin || jar.get("admin_auth")?.value === "viewer") return;

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
