-- 若曾用 ALTER 補欄位（例如 sort_order）後，API 仍回 PGRST204「欄位不在 schema cache」，
-- 在 SQL Editor 執行本檔一次，強制 PostgREST 重新載入 schema。

select pg_notification_queue_usage();

notify pgrst, 'reload schema';
