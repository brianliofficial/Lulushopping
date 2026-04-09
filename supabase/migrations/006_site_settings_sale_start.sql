alter table public.site_settings
  add column if not exists countdown_starts_at timestamptz;
