-- Single-row site settings (countdown, etc.). Home reads via service role; admin writes via API + service role.

create table if not exists public.site_settings (
  id integer primary key default 1,
  countdown_ends_at timestamptz,
  constraint site_settings_single_row check (id = 1)
);

insert into public.site_settings (id, countdown_ends_at)
values (1, null)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

-- No policies: anon cannot access; service_role bypasses RLS for server-side reads/writes.
