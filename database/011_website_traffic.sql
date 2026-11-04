-- First-party anonymous traffic. Only the trusted server can insert/read.
create table public.website_visits (
 event_id uuid primary key,
 at timestamptz not null default now(),
 visitor_key text not null check (visitor_key ~ '^[a-f0-9]{64}$'),
 session_key text not null check (session_key ~ '^[a-f0-9]{64}$'),
 page text not null check (length(page) between 1 and 180),
 channel text not null check (channel in ('direct','google','bing','facebook','instagram','zalo','telegram','tiktok','youtube','email','other_campaign','referral')),
 referrer_host text not null default '' check (length(referrer_host)<=120),
 attribution text not null check (attribution in ('utm','referrer','direct')),
 device text not null check (device in ('mobile','tablet','desktop','unknown'))
);
create index website_visits_at_idx on public.website_visits(at);
create index website_visits_session_at_idx on public.website_visits(session_key,at);
alter table public.website_visits enable row level security;
revoke all on public.website_visits from public,anon,authenticated;
grant select,insert on public.website_visits to service_role;

create function public.website_traffic_report(p_start date,p_end date,p_bucket text)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if p_end<=p_start or p_end-p_start>366 or p_bucket not in ('hour','day','month') then raise exception 'Invalid traffic range';end if;
 return (
 with filtered as materialized (
  select * from public.website_visits where at >= (p_start::timestamp at time zone 'Asia/Ho_Chi_Minh') and at < (p_end::timestamp at time zone 'Asia/Ho_Chi_Minh')
 ), sessions as (select distinct on(session_key) session_key,visitor_key,channel,referrer_host,device from filtered order by session_key,at,event_id),
 totals as (select count(*) as views,count(distinct session_key) as sessions,count(distinct visitor_key) as visitors from filtered),
 points as (select date_trunc(p_bucket,at at time zone 'Asia/Ho_Chi_Minh') as bucket,count(*) as views,count(distinct session_key) as sessions,count(distinct visitor_key) as visitors from filtered group by 1),
 buckets as (select generate_series(p_start::timestamp,p_end::timestamp-interval '1 second',case p_bucket when 'hour' then interval '1 hour' when 'day' then interval '1 day' else interval '1 month' end) as bucket),
 chart as (select to_char(b.bucket,'YYYY-MM-DD"T"HH24:MI:SS') as bucket,coalesce(p.views,0) as views,coalesce(p.sessions,0) as sessions,coalesce(p.visitors,0) as visitors from buckets b left join points p on p.bucket=b.bucket order by b.bucket),
 sources as (select channel,count(*) as sessions,count(distinct visitor_key) as visitors from sessions group by channel order by sessions desc,channel),
 pages as (select page,count(*) as views,count(distinct session_key) as sessions from filtered group by page order by views desc,page limit 20),
 referrers as (select referrer_host,count(*) as sessions from sessions where referrer_host<>'' group by referrer_host order by sessions desc,referrer_host limit 20),
 devices as (select device,count(*) as sessions from sessions group by device order by sessions desc,device)
 select jsonb_build_object('totals',(select to_jsonb(t) from totals t),'chart',coalesce((select jsonb_agg(to_jsonb(c)) from chart c),'[]'::jsonb),'sources',coalesce((select jsonb_agg(to_jsonb(s)) from sources s),'[]'::jsonb),'pages',coalesce((select jsonb_agg(to_jsonb(p)) from pages p),'[]'::jsonb),'referrers',coalesce((select jsonb_agg(to_jsonb(r)) from referrers r),'[]'::jsonb),'devices',coalesce((select jsonb_agg(to_jsonb(d)) from devices d),'[]'::jsonb),'firstCollectedAt',(select min(at) from public.website_visits),'timezone','Asia/Ho_Chi_Minh')
 );
end $$;
revoke all on function public.website_traffic_report(date,date,text) from public,anon,authenticated;
grant execute on function public.website_traffic_report(date,date,text) to service_role;
