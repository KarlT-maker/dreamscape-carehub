Future Supabase client factories belong here. No client or credentials are required yet.

Replace src/lib/data/repository.ts with asynchronous queries and introduce loading/error states in the provider. Keep database row mapping outside components. Before real data: authentication, ranch-scoped RLS, effective-date validation, task uniqueness by horse/instruction/date/period, audit trail, migrations and backups. Store real completions on the server; the prototype is not a shared care record.
