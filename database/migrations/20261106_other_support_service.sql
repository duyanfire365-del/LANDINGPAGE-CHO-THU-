begin;
alter table public.service_requests drop constraint service_requests_service_check;
alter table public.service_requests add constraint service_requests_service_check check(service in ('survey','bank','land-title','notary','inheritance','land-services','other','collaborator'));
commit;
