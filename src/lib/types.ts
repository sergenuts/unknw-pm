export interface TeamMember {
  id: string;
  name: string;
  type: "internal" | "outsource";
  role: string;
  email: string | null;
  cost_rate: number;
  created_by: string | null;
  password: string | null;
  is_admin: boolean;
}

export interface Client {
  id: string;
  name: string;
  currency: "GBP" | "USD" | "EUR";
  vat: boolean;
  vat_rate: number;
  deal_lead: string | null;
  status: string;
}

export interface ClientRate {
  id: string;
  client_id: string;
  role: string;
  rate: number;
}

export interface ClientMonth {
  id: string;
  client_id: string;
  month: string;
  estimate: number;
  paid: number;
}

export type EntryType = "hours_task" | "hours_week" | "fixed_task";

export interface Entry {
  id: string;
  client_id: string;
  month: string;
  date: string | null;
  task: string;
  owner_id: string;
  role: string;
  hours: number;
  coeff: number;
  status: string;
  entry_type: EntryType;
  amount: number;
  week_num: number | null;
}

export interface FixedItem {
  id: string;
  client_id: string;
  name: string;
  month: string;
  price: number;
  qty: number;
  total: number;
  paid: number;
  status: string;
}

export interface OutsourceMonth {
  id: string;
  client_id: string;
  member_id: string;
  month: string;
  rate_override: number | null;
  paid: number;
  status: string;
}

export interface FixedCost {
  id: string;
  fixed_item_id: string;
  type: "outsourcer" | "direct";
  description: string;
  amount: number;
  status: string;
  member_id: string | null;
  hours: number | null;
  rate: number | null;
}
