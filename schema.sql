-- UNKNW PM — Database Schema
-- Run in Supabase SQL Editor

-- ═══════════════════════════════════════
-- TEAM MEMBERS
-- ═══════════════════════════════════════
create table team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('internal', 'outsource')),
  role text not null default 'design',
  email text,
  cost_rate numeric(10,2) default 0, -- outsource only
  created_by text, -- who added this outsourcer
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════
-- CLIENTS
-- ═══════════════════════════════════════
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'GBP' check (currency in ('GBP', 'USD', 'EUR')),
  vat boolean default false,
  vat_rate integer default 0,
  deal_lead text,
  status text default 'active' check (status in ('active', 'paused', 'closed')),
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════
-- CLIENT RATES (per client, per role)
-- ═══════════════════════════════════════
create table client_rates (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  role text not null,
  rate numeric(10,2) not null,
  unique(client_id, role)
);

-- ═══════════════════════════════════════
-- CLIENT MONTHLY DATA (estimates + payments)
-- ═══════════════════════════════════════
create table client_months (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  month text not null, -- "april 2026"
  estimate numeric(10,2) default 0,
  paid numeric(10,2) default 0,
  unique(client_id, month)
);

-- ═══════════════════════════════════════
-- OUTSOURCER ↔ CLIENT ASSIGNMENT
-- ═══════════════════════════════════════
create table team_assignments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references team_members(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  unique(member_id, client_id)
);

-- ═══════════════════════════════════════
-- ENTRIES (tasks — source of truth for reports)
-- ═══════════════════════════════════════
create table entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  month text not null,
  date text, -- "25", "1-5", "w3", etc.
  task text not null,
  owner_id uuid not null references team_members(id),
  role text not null,
  hours numeric(10,2) not null default 0,
  coeff numeric(4,2) not null default 1,
  status text not null default 'in progress'
    check (status in ('in progress', 'done', 'submitted', 'pending', 'rejected', 'paused')),
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════
-- FIXED PRICE ITEMS
-- ═══════════════════════════════════════
create table fixed_items (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null,
  month text not null,
  price numeric(10,2) not null default 0, -- per unit
  qty integer not null default 1,
  total numeric(10,2) not null default 0, -- price × qty
  paid numeric(10,2) default 0,
  status text default 'in progress'
    check (status in ('in progress', 'done', 'paused')),
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════
-- FIXED PRICE COSTS
-- ═══════════════════════════════════════
create table fixed_costs (
  id uuid primary key default gen_random_uuid(),
  fixed_item_id uuid not null references fixed_items(id) on delete cascade,
  type text not null check (type in ('outsourcer', 'direct')),
  description text not null,
  amount numeric(10,2) not null default 0,
  status text default 'planned' check (status in ('planned', 'spent', 'paid')),
  -- outsourcer-specific
  member_id uuid references team_members(id),
  hours numeric(10,2),
  rate numeric(10,2),
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════
-- SEED: Team
-- ═══════════════════════════════════════
insert into team_members (id, name, type, role, email) values
  ('a1000000-0000-0000-0000-000000000001', 'rozov', 'internal', 'design', 'rozov@unknw.com'),
  ('a1000000-0000-0000-0000-000000000002', 'emir', 'internal', 'design', null),
  ('a1000000-0000-0000-0000-000000000003', 'deni', 'internal', 'design', null),
  ('a1000000-0000-0000-0000-000000000004', 'misha k.', 'internal', 'creative dir', null),
  ('a1000000-0000-0000-0000-000000000005', 'dima s.', 'internal', 'senior', null);

insert into team_members (id, name, type, role, email, cost_rate, created_by) values
  ('a1000000-0000-0000-0000-000000000006', 'kate m.', 'outsource', 'design', 'kate@mail.com', 20, 'misha');

-- ═══════════════════════════════════════
-- SEED: Clients
-- ═══════════════════════════════════════
insert into clients (id, name, currency, vat, vat_rate, deal_lead) values
  ('c1000000-0000-0000-0000-000000000001', 'Ben', 'GBP', true, 20, 'Serge'),
  ('c1000000-0000-0000-0000-000000000002', 'Paysend', 'USD', false, 0, 'Misha K.');

-- ═══════════════════════════════════════
-- SEED: Rates
-- ═══════════════════════════════════════
insert into client_rates (client_id, role, rate) values
  ('c1000000-0000-0000-0000-000000000001', 'design', 30),
  ('c1000000-0000-0000-0000-000000000001', 'code', 48),
  ('c1000000-0000-0000-0000-000000000002', 'middle', 31),
  ('c1000000-0000-0000-0000-000000000002', 'senior', 38),
  ('c1000000-0000-0000-0000-000000000002', 'creative dir', 100);

-- ═══════════════════════════════════════
-- SEED: Monthly estimates & payments
-- ═══════════════════════════════════════
insert into client_months (client_id, month, estimate, paid) values
  ('c1000000-0000-0000-0000-000000000001', 'december 2025', 3960, 3840),
  ('c1000000-0000-0000-0000-000000000001', 'january 2026', 2400, 2400),
  ('c1000000-0000-0000-0000-000000000001', 'february 2026', 480, 2400),
  ('c1000000-0000-0000-0000-000000000001', 'march 2026', 6750, 0),
  ('c1000000-0000-0000-0000-000000000001', 'april 2026', 2400, 0),
  ('c1000000-0000-0000-0000-000000000002', 'january 2026', 4000, 4020),
  ('c1000000-0000-0000-0000-000000000002', 'march 2026', 9000, 0),
  ('c1000000-0000-0000-0000-000000000002', 'april 2026', 5000, 0);

-- ═══════════════════════════════════════
-- SEED: Outsourcer assignments
-- ═══════════════════════════════════════
insert into team_assignments (member_id, client_id) values
  ('a1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002');

-- ═══════════════════════════════════════
-- SEED: Entries (Ben)
-- ═══════════════════════════════════════
insert into entries (client_id, month, date, task, owner_id, role, hours, coeff, status) values
  ('c1000000-0000-0000-0000-000000000001', 'december 2025', '', 'design retainer', 'a1000000-0000-0000-0000-000000000001', 'design', 132, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000001', 'january 2026', '', 'design retainer', 'a1000000-0000-0000-0000-000000000001', 'design', 12.5, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000001', 'january 2026', '', 'code work', 'a1000000-0000-0000-0000-000000000003', 'code', 18, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000001', 'february 2026', '', 'design retainer', 'a1000000-0000-0000-0000-000000000001', 'design', 16, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000001', 'march 2026', '25', 'benEY', 'a1000000-0000-0000-0000-000000000001', 'design', 4, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000001', 'march 2026', '26', 'benEY', 'a1000000-0000-0000-0000-000000000001', 'design', 8, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000001', 'march 2026', '27', 'benEY', 'a1000000-0000-0000-0000-000000000001', 'design', 8, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000001', 'march 2026', '28', 'benEY', 'a1000000-0000-0000-0000-000000000001', 'design', 8, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000001', 'march 2026', '', 'asos teaser', 'a1000000-0000-0000-0000-000000000002', 'design', 50, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000001', 'march 2026', '', 'q1 product video', 'a1000000-0000-0000-0000-000000000002', 'design', 45, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000001', 'march 2026', '', 'brand awareness', 'a1000000-0000-0000-0000-000000000002', 'design', 47, 1, 'in progress'),
  ('c1000000-0000-0000-0000-000000000001', 'march 2026', '', 'asos launch', 'a1000000-0000-0000-0000-000000000002', 'design', 52, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000001', 'march 2026', '', 'ba intro vid', 'a1000000-0000-0000-0000-000000000003', 'design', 11, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000001', 'march 2026', '30', 'Q1 ads', 'a1000000-0000-0000-0000-000000000001', 'design', 8, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000001', 'march 2026', '31', 'Q1 ads', 'a1000000-0000-0000-0000-000000000001', 'design', 12, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000001', 'april 2026', '1', 'Q1 ads', 'a1000000-0000-0000-0000-000000000001', 'design', 6, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000001', 'april 2026', '8', 'EY Storyboard', 'a1000000-0000-0000-0000-000000000001', 'design', 9, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000001', 'april 2026', '8', 'EY Onboarding', 'a1000000-0000-0000-0000-000000000001', 'design', 4, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000001', 'april 2026', '13', 'Product video', 'a1000000-0000-0000-0000-000000000002', 'design', 6, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000001', 'april 2026', '', 'social ads', 'a1000000-0000-0000-0000-000000000006', 'design', 8, 1, 'submitted');

-- ═══════════════════════════════════════
-- SEED: Entries (Paysend)
-- ═══════════════════════════════════════
insert into entries (client_id, month, date, task, owner_id, role, hours, coeff, status) values
  ('c1000000-0000-0000-0000-000000000002', 'january 2026', 'w3', 'week 3', 'a1000000-0000-0000-0000-000000000004', 'middle', 22, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000002', 'january 2026', 'w3', 'week 3 sr', 'a1000000-0000-0000-0000-000000000005', 'senior', 20, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000002', 'january 2026', 'w4', 'week 4', 'a1000000-0000-0000-0000-000000000004', 'middle', 21, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000002', 'january 2026', 'w4', 'week 4 sr', 'a1000000-0000-0000-0000-000000000005', 'senior', 2, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000002', 'march 2026', '', 'march mid', 'a1000000-0000-0000-0000-000000000004', 'middle', 120, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000002', 'march 2026', '', 'march sr', 'a1000000-0000-0000-0000-000000000005', 'senior', 78, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000002', 'march 2026', '', 'march cd', 'a1000000-0000-0000-0000-000000000004', 'creative dir', 27, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000002', 'april 2026', '1-5', 'week 14', 'a1000000-0000-0000-0000-000000000004', 'middle', 43.5, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000002', 'april 2026', '1-5', 'week 14 sr', 'a1000000-0000-0000-0000-000000000005', 'senior', 5, 1, 'done'),
  ('c1000000-0000-0000-0000-000000000002', 'april 2026', '7', 'banners', 'a1000000-0000-0000-0000-000000000006', 'middle', 12, 1, 'submitted');

-- ═══════════════════════════════════════
-- SEED: Fixed price items (Ben)
-- ═══════════════════════════════════════
insert into fixed_items (id, client_id, name, month, price, qty, total, paid, status) values
  ('f1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Clips', 'january 2026', 500, 6, 3000, 3000, 'done'),
  ('f1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Clips', 'february 2026', 500, 9, 4500, 0, 'done');

-- ═══════════════════════════════════════
-- SEED: Fixed costs
-- ═══════════════════════════════════════
insert into fixed_costs (fixed_item_id, type, description, amount, status, member_id, hours, rate) values
  ('f1000000-0000-0000-0000-000000000001', 'outsourcer', 'kate — 30h', 600, 'paid', 'a1000000-0000-0000-0000-000000000006', 30, 20),
  ('f1000000-0000-0000-0000-000000000001', 'direct', 'Stock music', 300, 'paid', null, null, null),
  ('f1000000-0000-0000-0000-000000000002', 'outsourcer', 'kate — 45h', 900, 'paid', 'a1000000-0000-0000-0000-000000000006', 45, 20),
  ('f1000000-0000-0000-0000-000000000002', 'direct', 'Voiceover', 400, 'planned', null, null, null);
