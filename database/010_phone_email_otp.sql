-- Supports phone-only accounts; the existing trigger used a non-null email.
-- Does not grant posting, auto-publish, admin or private-source access.
create or replace function public.create_member_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
 insert into public.profiles(id,full_name,phone,email,kind,can_post)
 values(new.id,left(coalesce(new.raw_user_meta_data->>'full_name',''),100),
 left(coalesce(new.phone,new.raw_user_meta_data->>'phone',''),20),coalesce(new.email,''),
 case when new.raw_user_meta_data->>'kind'='sales' then 'sales' else 'customer' end,false);
 return new;
end $$;
