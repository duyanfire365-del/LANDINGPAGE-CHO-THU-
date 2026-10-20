-- Run after 004_source_inbox.sql. Server-only durable jobs and atomic deduplication.
alter table public.source_inbox add column if not exists processing_status text not null default 'received';
alter table public.source_inbox add column if not exists processing_error text not null default '';
alter table public.source_inbox add column if not exists processing_started_at timestamptz;
alter table public.source_inbox add column if not exists processed_at timestamptz;
alter table public.source_inbox add column if not exists result_url text;
alter table public.source_inbox add column if not exists attempts integer not null default 0;
alter table public.source_inbox add column if not exists parsed_data jsonb;
alter table public.posts add column if not exists source_inbox_id uuid unique references public.source_inbox(id);
create table if not exists public.source_fingerprints (
 fingerprint text primary key, source_id uuid unique not null references public.source_inbox(id), created_at timestamptz not null default now()
);
alter table public.source_fingerprints enable row level security;
revoke all on public.source_fingerprints from anon,authenticated;
grant all on public.source_fingerprints to service_role;
-- Serialize claiming/budget checks across concurrent Telegram requests.
create or replace function public.claim_source_job(job_id uuid, daily_limit integer default 20)
returns setof public.source_inbox language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(981705);
 if (select count(*) from public.source_inbox where processing_started_at >= date_trunc('day',now())) >= greatest(1,least(daily_limit,100)) then return; end if;
 return query update public.source_inbox set processing_status='processing',processing_error='',processing_started_at=now(),attempts=attempts+1
 where id=job_id and attempts<3 and (processing_status in ('received','failed','blocked') or (processing_status='processing' and processing_started_at<now()-interval '10 minutes')) returning *;
end $$;
revoke all on function public.claim_source_job(uuid,integer) from public,anon,authenticated;
grant execute on function public.claim_source_job(uuid,integer) to service_role;
