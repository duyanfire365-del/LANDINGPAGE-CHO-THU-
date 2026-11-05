alter table public.news_articles add column rich_content jsonb;
alter table public.news_articles add constraint news_rich_content_size check (
 rich_content is null or (jsonb_typeof(rich_content)='object' and octet_length(rich_content::text)<=400000)
);
