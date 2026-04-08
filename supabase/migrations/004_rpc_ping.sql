-- GitHub Actions「Supabase Keep Alive」呼叫 POST /rest/v1/rpc/ping 時使用。
-- 在 Supabase → SQL Editor 執行本檔（或透過 migration 套用）。

create or replace function public.ping()
returns smallint
language sql
security invoker
set search_path = public
as $$
  select 1::smallint;
$$;

comment on function public.ping() is 'Keep-alive RPC for scheduled pings (anon may execute).';

grant execute on function public.ping() to anon, authenticated, service_role;
