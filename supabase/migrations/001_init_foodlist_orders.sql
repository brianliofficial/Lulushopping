-- ============================================================
-- LULU：在 Supabase → SQL Editor 貼上「整份」後按右下角 Run（或 Cmd/Ctrl + Enter）
-- 成功時：下方 Results 會出現最後一個查詢的表格（兩列 foodlist / orders）
-- 若已建過表：CREATE IF NOT EXISTS 不會報錯，只會略過已存在的物件
-- ============================================================

-- PostgreSQL 15+ 內建 gen_random_uuid()，不需 pgcrypto；若你的專案較舊可改開啟：
-- create extension if not exists pgcrypto with schema extensions;

create table if not exists public.foodlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric not null default 0,
  max_qty integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 若 foodlist 是很早手動建的、沒有 sort_order，CREATE TABLE 不會幫你補欄位，需下面這段：
alter table public.foodlist add column if not exists description text not null default '';
alter table public.foodlist add column if not exists price numeric not null default 0;
alter table public.foodlist add column if not exists max_qty integer not null default 0;
alter table public.foodlist add column if not exists sort_order integer not null default 0;
alter table public.foodlist add column if not exists created_at timestamptz not null default now();

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  transfer_last5 text not null,
  items jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  paid boolean not null default false,
  picked_up boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.orders add column if not exists total numeric not null default 0;
alter table public.orders add column if not exists paid boolean not null default false;
alter table public.orders add column if not exists picked_up boolean not null default false;
alter table public.orders add column if not exists created_at timestamptz not null default now();

create index if not exists foodlist_sort_idx on public.foodlist (sort_order);
create index if not exists orders_created_idx on public.orders (created_at desc);

alter table public.foodlist enable row level security;
alter table public.orders enable row level security;

-- 執行後應看到兩列 tablename：foodlist、orders
select tablename
from pg_tables
where schemaname = 'public'
  and tablename in ('foodlist', 'orders')
order by tablename;
