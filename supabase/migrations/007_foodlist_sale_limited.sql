alter table public.foodlist
  add column if not exists sale_limited boolean not null default false;

comment on column public.foodlist.sale_limited is 'When true, product follows global sale window (only purchasable during window).';
