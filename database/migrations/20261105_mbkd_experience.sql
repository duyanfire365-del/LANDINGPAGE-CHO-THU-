-- Existing articles remain in Tin tức Hot. Public/editor permissions are unchanged.
alter table public.news_articles
 add column section text not null default 'news' check (section in ('news','experience')),
 add column industry text not null default '' check (industry in ('','cafe','food','spa','office','retail','warehouse','other'));
create index news_section_feed on public.news_articles (section, featured desc, published_at desc, id desc) where status='published';
create index news_industry_feed on public.news_articles (section, industry, featured desc, published_at desc, id desc) where status='published';
