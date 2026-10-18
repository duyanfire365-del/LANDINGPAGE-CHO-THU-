begin;
alter table public.inquiries add column if not exists management_status text not null default 'new' check(management_status in ('new','contacted','following','closed'));
alter table public.inquiries add column if not exists admin_notes text not null default '';
alter table public.inquiries add column if not exists updated_at timestamptz;
create index if not exists inquiries_management_created_idx on public.inquiries(management_status,created_at desc);
commit;
