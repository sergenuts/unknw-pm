"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

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

export async function updateEntryCoeff(entryId: string, coeff: number, clientId: string) {
  await supabase.from("entries").update({ coeff }).eq("id", entryId);
  revalidatePath("/clients/" + clientId);
}

export async function updateEntryStatus(entryId: string, status: string, clientId: string) {
  await supabase.from("entries").update({ status }).eq("id", entryId);
  revalidatePath("/clients/" + clientId);
  revalidatePath("/approvals");
}

export async function deleteEntry(entryId: string, clientId: string) {
  await supabase.from("entries").delete().eq("id", entryId);
  revalidatePath("/clients/" + clientId);
}

export async function createEntry(data: {
  client_id: string;
  month: string;
  date: string;
  task: string;
  owner_id: string;
  role: string;
  hours: number;
}) {
  await supabase.from("entries").insert({
    ...data,
    coeff: 1,
    status: "in progress",
  });
  revalidatePath("/clients/" + data.client_id);
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
}

export async function deleteFixedCost(costId: string, clientId: string) {
  await supabase.from("fixed_costs").delete().eq("id", costId);
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
  await supabase.from("entries").update({ status: "done" }).eq("status", "submitted");
  revalidatePath("/approvals");
}

// ─── Settings: Team Members ─────────────────────────────────

export async function createTeamMember(data: {
  name: string;
  type: "internal" | "outsource";
  role: string;
  email: string;
  cost_rate?: number;
}) {
  await supabase.from("team_members").insert(data);
  revalidatePath("/settings");
}

export async function deleteTeamMember(id: string) {
  await supabase.from("team_members").delete().eq("id", id);
  revalidatePath("/settings");
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
