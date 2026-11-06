-- Prepared-copy imports are uncapped. A positive limit budgets paid AI jobs only.
-- Keep the service-only RPC signature, atomic lock, retry cap and stale lease.
create or replace function public.claim_source_job(job_id uuid, daily_limit integer default 20)
returns setof public.source_inbox
language plpgsql security definer set search_path = public
as $$
declare
 job public.source_inbox%rowtype;
 day_start timestamptz := date_trunc('day', now() at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh';
 day_key text := to_char(now() at time zone 'Asia/Ho_Chi_Minh','YYYY-MM-DD');
 paid boolean := coalesce(daily_limit,20)>0;
 already_charged boolean;
begin
 perform pg_advisory_xact_lock(981705);
 select * into job from public.source_inbox where id=job_id for update;
 if not found or job.attempts>=3 or not (
  job.processing_status in ('received','failed','blocked') or
  (job.processing_status='processing' and job.processing_started_at<now()-interval '10 minutes')
 ) then return; end if;
 already_charged := coalesce(job.parsed_data->'_automationQuota'->>'mode'='ai'
  and job.parsed_data->'_automationQuota'->>'day'=day_key,false);
 if paid and not already_charged and (
  select count(*) from public.source_inbox s where
   (s.parsed_data->'_automationQuota'->>'mode'='ai' and s.parsed_data->'_automationQuota'->>'day'=day_key)
   or (s.parsed_data->'_automationQuota' is null and s.processing_started_at>=day_start and s.processing_status not in ('updated','grouped'))
 ) >= greatest(1,least(coalesce(daily_limit,20),100)) then return; end if;
 return query update public.source_inbox set
  processing_status='processing',processing_error='',processing_started_at=now(),attempts=attempts+1,
  parsed_data=coalesce(parsed_data,'{}'::jsonb)||jsonb_build_object('_automationQuota',
   case when already_charged then job.parsed_data->'_automationQuota'
    else jsonb_build_object('mode',case when paid then 'ai' else 'provided' end,'day',day_key) end)
 where id=job_id returning *;
end
$$;
revoke all on function public.claim_source_job(uuid,integer) from public,anon,authenticated;
grant execute on function public.claim_source_job(uuid,integer) to service_role;
