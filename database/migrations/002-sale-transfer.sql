-- Existing projects: run this once before accepting sale/transfer inquiries.
begin;
alter table public.inquiries add column if not exists owner_price numeric;
alter table public.inquiries add column if not exists transfer_monthly_rent numeric;
update public.inquiries set owner_price=owner_rent where intent='owner' and owner_price is null;
alter table public.inquiries drop constraint if exists inquiries_intent_check;
alter table public.inquiries add constraint inquiries_intent_check check(intent in ('tenant','owner','owner_sale','owner_transfer'));
commit;
