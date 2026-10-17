-- Run once in the Supabase SQL Editor. All application data is server-only.
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null, phone text not null, email text not null,
 kind text not null check(kind in ('customer','sales')),
 can_post boolean not null default false,
 created_at timestamptz not null default now()
);
create or replace function public.create_member_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
 insert into public.profiles(id,full_name,phone,email,kind,can_post)
 values(new.id,left(coalesce(new.raw_user_meta_data->>'full_name',''),100),left(coalesce(new.raw_user_meta_data->>'phone',''),20),new.email,
 case when new.raw_user_meta_data->>'kind'='sales' then 'sales' else 'customer' end,false);
 return new;
end $$;
drop trigger if exists on_member_created on auth.users;
create trigger on_member_created after insert on auth.users for each row execute function public.create_member_profile();
create table if not exists public.inquiries (
 id uuid primary key default gen_random_uuid(), member_id uuid references public.profiles(id),
 intent text not null check(intent in ('tenant','owner','owner_sale','owner_transfer')), name text not null, phone text not null,
 area text, type text, budget text, property text, date text,
 owner_address text, owner_size numeric, owner_rent numeric, owner_price numeric, transfer_monthly_rent numeric, owner_notes text,
 contact_consent boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.posts (
 id uuid primary key default gen_random_uuid(), author_id uuid references public.profiles(id),
 status text not null default 'pending' check(status in ('pending','published','rejected')),
 public_data jsonb not null, private_data jsonb not null default '{}',
 created_at timestamptz not null default now(), reviewed_at timestamptz
);
create table if not exists public.assets (
 id uuid primary key default gen_random_uuid(), owner_id uuid references public.profiles(id),
 path text unique not null, name text not null, mime text not null, size bigint not null,
 kind text not null check(kind in ('image','video','document')), created_at timestamptz not null default now()
);
create table if not exists public.notification_log (
 id uuid primary key default gen_random_uuid(), kind text not null, record_id text not null,
 sent boolean not null default false, created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.inquiries enable row level security;
alter table public.posts enable row level security;
alter table public.assets enable row level security;
alter table public.notification_log enable row level security;
revoke all on public.profiles,public.inquiries,public.posts,public.assets,public.notification_log from anon,authenticated;
grant all on public.profiles,public.inquiries,public.posts,public.assets,public.notification_log to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('rental-private','rental-private',false,52428800,array['image/jpeg','image/png','image/webp','video/mp4','video/webm','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain'])
on conflict(id) do nothing;
-- No public storage policies: uploads/downloads require server-issued signed URLs.
