-- Run once in Supabase SQL Editor. No existing member is auto-approved.
alter table public.profiles add column if not exists auto_publish boolean not null default false;
do $$
begin
 if not exists(select 1 from pg_constraint where conname='profiles_auto_publish_requires_posting' and conrelid='public.profiles'::regclass) then
  alter table public.profiles add constraint profiles_auto_publish_requires_posting
   check(not auto_publish or (kind='sales' and can_post));
 end if;
end $$;
-- RLS remains enabled; permissions are written only by the admin server route.
