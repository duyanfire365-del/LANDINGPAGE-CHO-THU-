-- Run in Supabase SQL Editor. Source content stays admin-only.
create table if not exists public.source_inbox (
 id uuid primary key default gen_random_uuid(),
 update_id bigint not null unique, message_id bigint not null, chat_id text not null,
 media_group_id text, content text not null default '', media jsonb not null default '[]',
 content_hash text not null unique, created_at timestamptz not null default now()
);
alter table public.source_inbox enable row level security;
revoke all on public.source_inbox from anon, authenticated;
grant all on public.source_inbox to service_role;
create index if not exists source_inbox_created on public.source_inbox(created_at desc);
