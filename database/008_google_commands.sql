-- Run after 007_customer_watch.sql. Server-only command configurations and audit trail.
create table if not exists public.google_commands (
 id uuid primary key default gen_random_uuid(), name text not null, config jsonb not null,
 enabled boolean not null default false, frequency text not null default 'manual' check(frequency in ('manual','daily')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.google_runs (
 id uuid primary key default gen_random_uuid(), command_id uuid references public.google_commands(id) on delete set null,
 job_key text unique, status text not null default 'preview' check(status in ('preview','running','done','review','failed')),
 config jsonb not null, plan jsonb not null default '{}', result jsonb not null default '{}', error text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.posts add column if not exists google_import_key text;
create unique index if not exists posts_google_import_key on public.posts(google_import_key);
alter table public.google_commands enable row level security;
alter table public.google_runs enable row level security;
revoke all on public.google_commands,public.google_runs from public,anon,authenticated;
grant all on public.google_commands,public.google_runs to service_role;
