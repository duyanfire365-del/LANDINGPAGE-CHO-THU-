begin;
alter table public.news_articles drop constraint news_articles_industry_check;
alter table public.news_articles add constraint news_articles_industry_check check(industry in ('','cafe','food','spa','office','retail','warehouse','other','survey','bank','land-title','notary','inheritance','land-services','collaborator','construction','fire-safety','appliances','housing'));
alter table public.service_requests drop constraint service_requests_service_check;
alter table public.service_requests add constraint service_requests_service_check check(service in ('survey','bank','land-title','notary','inheritance','land-services','other','collaborator','construction','fire-safety','appliances','housing'));
commit;
