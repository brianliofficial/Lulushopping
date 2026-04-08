-- 若你只遇到「sort_order does not exist」，可單獨在 SQL Editor 執行這兩段：

alter table public.foodlist
  add column if not exists sort_order integer not null default 0;

create index if not exists foodlist_sort_idx on public.foodlist (sort_order);
