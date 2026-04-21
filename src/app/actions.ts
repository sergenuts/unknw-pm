"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// ─── Auth ────────────────────────────────────────────────────

export async function loginAdmin(email: string, password: string): Promise<{ error?: string }> {
  const { data } = await supabase
    .from("team_members")
    .select("id, password, is_admin")
    .eq("email", email.trim().toLowerCase())
    .single();
  if (!data || !data.password || data.password !== password) {
    return { error: "Invalid credentials" };
  }
  const jar = await cookies();
  if (data.is_admin) {
    jar.set("admin_auth", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    redirect("/");
  } else {
    jar.set("member_auth", data.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    redirect(`/team/${data.id}`);
  }
}

export async function loginMember(memberId: string, password: string): Promise<{ error?: string }> {
  const { data } = await supabase
    .from("team_members")
    .select("id, password")
    .eq("id", memberId)
    .single();
  if (!data || !data.password || data.password !== password) {
    return { error: "Invalid credentials" };
  }
  const jar = await cookies();
  jar.set("member_auth", memberId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(`/team/${memberId}`);
}

export async function logout() {
  const jar = await cookies();
  jar.delete("admin_auth");
  jar.delete("member_auth");
  redirect("/login");
}

export async function updateTeamMemberPassword(id: string, password: string) {
  await supabase.from("team_members").update({ password: password || null }).eq("id", id);
  revalidatePath("/settings");
}

// ─── Client Months (estimate / paid) ─────────────────────────

export async function upsertClientMonth(
  clientId: string,
  month: string,
  field: "estimate" | "paid",
  value: number
) {
  const { data: existing } = await supabase
    .from("client_months")
    .select("id")
    .eq("client_id", clientId)
    .eq("month", month)
    .single();

  if (existing) {
    await supabase
      .from("client_months")
      .update({ [field]: value })
      .eq("id", existing.id);
  } else {
    await supabase.from("client_months").insert({
      client_id: clientId,
      month,
      [field]: value,
    });
  }
  revalidatePath("/clients/" + clientId);
}

// ─── Entries ─────────────────────────────────────────────────

export async function updateEntryField(
  entryId: string,
  field: string,
  value: string | number,
  clientId: string
) {
  await supabase.from("entries").update({ [field]: value }).eq("id", entryId);
  revalidatePath("/clients/" + clientId);
  if (field === "status") revalidatePath("/approvals");
}

export async function deleteEntry(entryId: string, clientId: string) {
  await supabase.from("entries").delete().eq("id", entryId);
  revalidatePath("/clients/" + clientId);
}

export async function createEntry(data: {
  client_id: string;
  month: string;
  task: string;
  owner_id: string;
  role: string;
  hours: number;
  entry_type?: "hours_task" | "hours_week";
  date?: string;
  week_num?: number;
}) {
  await supabase.from("entries").insert({
    client_id: data.client_id,
    month: data.month,
    task: data.task,
    owner_id: data.owner_id,
    role: data.role,
    hours: data.hours,
    entry_type: data.entry_type ?? "hours_task",
    date: data.date ?? null,
    week_num: data.week_num ?? null,
    coeff: 1,
    status: "in progress",
  });
  revalidatePath("/clients/" + data.client_id);
  revalidatePath("/team/" + data.owner_id);
  revalidatePath("/team/" + data.owner_id + "/" + data.client_id);
}

export async function createMemberEntry(data: {
  client_id: string;
  month: string;
  owner_id: string;
  role: string;
  entry_type: "hours_task" | "hours_week" | "fixed_task";
  task: string;
  date?: string;
  hours?: number;
  amount?: number;
  week_num?: number;
}) {
  await supabase.from("entries").insert({
    client_id: data.client_id,
    month: data.month,
    owner_id: data.owner_id,
    role: data.role,
    entry_type: data.entry_type,
    task: data.task,
    date: data.date ?? null,
    hours: data.hours ?? 0,
    amount: data.amount ?? 0,
    week_num: data.week_num ?? null,
    coeff: 1,
    status: "pending",
  });
  revalidatePath("/clients/" + data.client_id);
  revalidatePath("/team/" + data.owner_id);
  revalidatePath("/team/" + data.owner_id + "/" + data.client_id);
  revalidatePath("/approvals");
}

export async function approveFixedCost(costId: string) {
  await supabase.from("fixed_costs").update({ status: "planned" }).eq("id", costId);
  revalidatePath("/approvals");
}

export async function rejectFixedCost(costId: string) {
  await supabase.from("fixed_costs").delete().eq("id", costId);
  revalidatePath("/approvals");
}

export async function deleteMemberEntry(entryId: string, memberId: string, clientId: string) {
  await supabase.from("entries").delete().eq("id", entryId);
  revalidatePath("/clients/" + clientId);
  revalidatePath("/team/" + memberId);
  revalidatePath("/team/" + memberId + "/" + clientId);
}

// ─── Fixed Items ─────────────────────────────────────────────

export async function createFixedItem(data: {
  client_id: string;
  name: string;
  month: string;
  price: number;
  qty: number;
}) {
  await supabase.from("fixed_items").insert({
    ...data,
    total: data.price * data.qty,
    paid: 0,
    status: "in progress",
  });
  revalidatePath("/clients/" + data.client_id);
}

export async function updateFixedItemPaid(itemId: string, paid: number, clientId: string) {
  await supabase.from("fixed_items").update({ paid }).eq("id", itemId);
  revalidatePath("/clients/" + clientId);
}

export async function updateFixedItemStatus(itemId: string, status: string, clientId: string) {
  await supabase.from("fixed_items").update({ status }).eq("id", itemId);
  revalidatePath("/clients/" + clientId);
}

// ─── Fixed Costs ─────────────────────────────────────────────

export async function createFixedCost(data: {
  fixed_item_id: string;
  type: "outsourcer" | "direct";
  description: string;
  amount: number;
  status: string;
  member_id?: string;
  hours?: number;
  rate?: number;
  clientId: string;
}) {
  const { clientId, ...rest } = data;
  await supabase.from("fixed_costs").insert(rest);
  revalidatePath("/clients/" + clientId);
  revalidatePath("/approvals");
  if (data.member_id) {
    revalidatePath("/team/" + data.member_id);
    revalidatePath("/team/" + data.member_id + "/" + clientId);
  }
}

export async function deleteFixedCost(costId: string, clientId: string) {
  const { data: cost } = await supabase
    .from("fixed_costs")
    .select("member_id")
    .eq("id", costId)
    .single();
  await supabase.from("fixed_costs").delete().eq("id", costId);
  revalidatePath("/clients/" + clientId);
  revalidatePath("/approvals");
  if (cost?.member_id) {
    revalidatePath("/team/" + cost.member_id);
    revalidatePath("/team/" + cost.member_id + "/" + clientId);
  }
}

export async function deleteFixedItem(itemId: string, clientId: string) {
  await supabase.from("fixed_costs").delete().eq("fixed_item_id", itemId);
  await supabase.from("fixed_items").delete().eq("id", itemId);
  revalidatePath("/clients/" + clientId);
}

// ─── Client Rates ────────────────────────────────────────────

export async function createClientRate(clientId: string, role: string, rate: number) {
  await supabase.from("client_rates").insert({ client_id: clientId, role, rate });
  revalidatePath("/clients/" + clientId);
  revalidatePath("/settings");
}

export async function deleteClientRate(rateId: string, clientId: string) {
  await supabase.from("client_rates").delete().eq("id", rateId);
  revalidatePath("/clients/" + clientId);
  revalidatePath("/settings");
}

// ─── Team Assignments ────────────────────────────────────────

export async function assignTeamMember(memberId: string, clientId: string) {
  await supabase.from("team_assignments").insert({ member_id: memberId, client_id: clientId });
  revalidatePath("/clients/" + clientId);
}

export async function unassignTeamMember(memberId: string, clientId: string) {
  await supabase
    .from("team_assignments")
    .delete()
    .eq("member_id", memberId)
    .eq("client_id", clientId);
  revalidatePath("/clients/" + clientId);
}

// ─── Approvals ───────────────────────────────────────────────

export async function approveEntry(entryId: string) {
  await supabase.from("entries").update({ status: "done" }).eq("id", entryId);
  revalidatePath("/approvals");
}

export async function rejectEntry(entryId: string) {
  await supabase.from("entries").update({ status: "rejected" }).eq("id", entryId);
  revalidatePath("/approvals");
}

export async function approveAllEntries() {
  await supabase.from("entries").update({ status: "done" }).in("status", ["submitted", "pending"]);
  revalidatePath("/approvals");
}

// ─── Settings: Team Members ─────────────────────────────────

export async function createTeamMember(data: {
  name: string;
  type: "internal" | "outsource" | "lead";
  role: string;
  email: string;
  cost_rate?: number;
}) {
  await supabase.from("team_members").insert(data);
  revalidatePath("/settings");
}

export async function deleteTeamMember(id: string): Promise<{ error?: string }> {
  const [eRes, fcRes, omRes] = await Promise.all([
    supabase.from("entries").select("id", { count: "exact", head: true }).eq("owner_id", id),
    supabase.from("fixed_costs").select("id", { count: "exact", head: true }).eq("member_id", id),
    supabase.from("outsource_months").select("id", { count: "exact", head: true }).eq("member_id", id),
  ]);
  const parts: string[] = [];
  if (eRes.count) parts.push(`${eRes.count} entries`);
  if (fcRes.count) parts.push(`${fcRes.count} fixed costs`);
  if (omRes.count) parts.push(`${omRes.count} outsource months`);
  if (parts.length > 0) {
    return { error: `Cannot delete — has ${parts.join(", ")}` };
  }
  await supabase.from("team_assignments").delete().eq("member_id", id);
  const { error } = await supabase.from("team_members").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return {};
}

export async function updateTeamMemberRate(id: string, costRate: number) {
  await supabase.from("team_members").update({ cost_rate: costRate }).eq("id", id);
  revalidatePath("/settings");
}

export async function updateTeamMemberType(id: string, type: "internal" | "outsource" | "lead") {
  await supabase.from("team_members").update({ type }).eq("id", id);
  revalidatePath("/settings");
}

export async function updateTeamMemberRole(id: string, role: string) {
  await supabase.from("team_members").update({ role }).eq("id", id);
  revalidatePath("/settings");
}

// ─── Outsource Months ────────────────────────────────────────

export async function upsertOutsourceMonth(
  clientId: string,
  memberId: string,
  month: string,
  field: "rate_override" | "paid" | "status",
  value: number | string
) {
  const { data: existing } = await supabase
    .from("outsource_months")
    .select("id")
    .eq("client_id", clientId)
    .eq("member_id", memberId)
    .eq("month", month)
    .single();

  if (existing) {
    await supabase
      .from("outsource_months")
      .update({ [field]: value })
      .eq("id", existing.id);
  } else {
    await supabase.from("outsource_months").insert({
      client_id: clientId,
      member_id: memberId,
      month,
      [field]: value,
    });
  }
  revalidatePath("/clients/" + clientId);
}

// ─── Settings: Clients ──────────────────────────────────────

export async function createClient(data: {
  name: string;
  currency: string;
  vat: boolean;
  vat_rate: number;
  deal_lead: string;
}) {
  await supabase.from("clients").insert(data);
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function toggleClientVat(clientId: string, vat: boolean) {
  await supabase.from("clients").update({ vat }).eq("id", clientId);
  revalidatePath("/settings");
  revalidatePath("/clients/" + clientId);
}

export async function updateClientField(clientId: string, field: "currency" | "deal_lead", value: string) {
  await supabase.from("clients").update({ [field]: value }).eq("id", clientId);
  revalidatePath("/settings");
  revalidatePath("/clients/" + clientId);
  revalidatePath("/");
}
