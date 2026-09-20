-- Svuota tutte le tabelle di dati (tranne la cronologia delle migration) prima di un restore.
-- Serve perché le migration inseriscono già alcune righe iniziali (es. app_settings) che andrebbero in conflitto.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '__EFMigrationsHistory' LOOP
    EXECUTE format('TRUNCATE TABLE %I RESTART IDENTITY CASCADE', r.tablename);
  END LOOP;
END $$;
