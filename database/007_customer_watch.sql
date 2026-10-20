-- Private customer watchlist. All reads/writes go through authenticated server endpoints.
create table if not exists public.customer_watch (
 id uuid primary key default gen_random_uuid(), owner_id uuid references public.profiles(id) on delete cascade,
 data jsonb not null default '{}', status text not null default 'active' check(status in ('active','following','closed')),
 dedup_key text unique, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists customer_watch_owner on public.customer_watch(owner_id,status);
create table if not exists public.customer_imports (
 id uuid primary key default gen_random_uuid(), owner_id uuid references public.profiles(id) on delete cascade,
 update_id bigint unique, payload jsonb not null default '{}', status text not null default 'received' check(status in ('received','processing','done','review','failed')),
 error text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.customer_match_alerts (
 customer_id uuid references public.customer_watch(id) on delete cascade, slug text not null,
 sent boolean not null default false, created_at timestamptz not null default now(), primary key(customer_id,slug)
);
create table if not exists public.customer_sync_jobs (
 key text primary key, updated_at timestamptz not null default now(), error text not null default ''
);
alter table public.customer_watch enable row level security;
alter table public.customer_imports enable row level security;
alter table public.customer_match_alerts enable row level security;
alter table public.customer_sync_jobs enable row level security;
revoke all on public.customer_watch,public.customer_imports,public.customer_match_alerts,public.customer_sync_jobs from public,anon,authenticated;
grant all on public.customer_watch,public.customer_imports,public.customer_match_alerts,public.customer_sync_jobs to service_role;

-- Lease new notifications atomically so parallel source uploads do not spam the same match.
alter table public.customer_match_alerts add column if not exists claim_token uuid;
alter table public.customer_match_alerts add column if not exists claim_until timestamptz;
create or replace function public.claim_customer_alerts(p_customer uuid,p_slugs text[],p_token uuid)
returns table(slug text) language sql security definer set search_path=public as $$
 with candidates as (
  select a.customer_id,a.slug from public.customer_match_alerts a
  where a.customer_id=p_customer and a.slug=any(p_slugs) and not a.sent
  and (a.claim_until is null or a.claim_until<now())
  order by a.created_at,a.slug limit 5 for update skip locked
 )
 update public.customer_match_alerts a
 set claim_token=p_token,claim_until=now()+interval '2 minutes'
 from candidates c where a.customer_id=c.customer_id and a.slug=c.slug
 returning a.slug;
$$;
revoke all on function public.claim_customer_alerts(uuid,text[],uuid) from public,anon,authenticated;
grant execute on function public.claim_customer_alerts(uuid,text[],uuid) to service_role;
