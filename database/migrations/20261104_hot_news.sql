-- Additive CMS storage. Access goes through the existing server admin guard.
create table public.news_articles (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{5,160}$'),
 title text not null check (char_length(title) between 1 and 180),
 excerpt text not null default '' check (char_length(excerpt) <= 320),
 content text not null check (char_length(content) between 1 and 50000),
 status text not null default 'draft' check (status in ('draft','published','archived')),
 featured boolean not null default false,
 source_url text not null default '' check (char_length(source_url) <= 2000 and (source_url='' or source_url like 'https://%')),
 cover jsonb,
 has_cover boolean not null default false,
 source_key text unique,
 source_update bigint,
 revision uuid not null default gen_random_uuid(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 published_at timestamptz,
 constraint news_cover_size check (cover is null or octet_length(cover::text) <= 650000),
 constraint news_cover_present check (has_cover = (cover is not null)),
 constraint news_published_date check (status <> 'published' or published_at is not null)
);
create index news_published_feed on public.news_articles (featured desc, published_at desc, id desc) where status='published';
create index news_admin_feed on public.news_articles (updated_at desc, id desc);
alter table public.news_articles enable row level security;
revoke all on public.news_articles from public, anon, authenticated;
grant select, insert, update, delete on public.news_articles to service_role;
