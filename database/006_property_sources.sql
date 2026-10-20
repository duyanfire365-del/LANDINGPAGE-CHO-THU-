-- Run once in Supabase SQL Editor. Source contacts, exact maps and grants are server-only.
create table if not exists public.property_sources (
 slug text primary key check (slug ~ '^(hn-[0-9]{3}|live-[0-9]{10,20})$'),
 owner_id uuid references public.profiles(id) on delete set null,
 data jsonb not null default '{}',
 shared_with uuid[] not null default '{}',
 map_shares jsonb not null default '[]',
 updated_at timestamptz not null default now()
);
alter table public.property_sources enable row level security;
revoke all on public.property_sources from public,anon,authenticated;
grant all on public.property_sources to service_role;
create index if not exists property_sources_shared_idx on public.property_sources using gin(shared_with);
