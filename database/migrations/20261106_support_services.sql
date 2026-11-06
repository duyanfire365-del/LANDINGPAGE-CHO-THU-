begin;
alter table public.news_articles drop constraint news_articles_section_check;
alter table public.news_articles add constraint news_articles_section_check check(section in ('news','experience','services','recruitment'));
alter table public.news_articles drop constraint news_articles_industry_check;
alter table public.news_articles add constraint news_articles_industry_check check(industry in ('','cafe','food','spa','office','retail','warehouse','other','survey','bank','land-title','notary','inheritance','land-services','collaborator'));
create table public.service_requests (
 id uuid primary key,
 service text not null check(service in ('survey','bank','land-title','notary','inheritance','land-services','collaborator')),
 kind text not null check(kind in ('services','recruitment')),
 name text not null check(char_length(name) between 1 and 100),
 phone text not null check(phone ~ '^0[0-9]{9}$'),
 address text not null check(char_length(address) between 1 and 250),
 age integer check(age between 18 and 100),
 need text not null check(char_length(need) between 1 and 1200),
 urgency text not null check(urgency in ('urgent','soon','exploring')),
 contact_consent boolean not null check(contact_consent),
 request_hash text not null,
 status text not null default 'new' check(status in ('new','contacted','closed')),
 notification_state text not null default 'pending' check(notification_state in ('pending','sending','sent','failed')),
 notification_error text not null default '',
 notification_claimed_at timestamptz,
 notified_at timestamptz,
 created_at timestamptz not null default now(),
 constraint service_request_kind check((service='collaborator' and kind='recruitment' and age is not null) or (service<>'collaborator' and kind='services'))
);
create index service_requests_created on public.service_requests(created_at desc,id desc);
alter table public.service_requests enable row level security;
revoke all on public.service_requests from public,anon,authenticated;
grant select,insert,update,delete on public.service_requests to service_role;
commit;
