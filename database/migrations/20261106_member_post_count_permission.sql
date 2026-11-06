alter table public.profiles add column can_view_own_post_counts boolean not null default false;
comment on column public.profiles.can_view_own_post_counts is 'Admin grant: active posting members may see only their own published listing counts.';
