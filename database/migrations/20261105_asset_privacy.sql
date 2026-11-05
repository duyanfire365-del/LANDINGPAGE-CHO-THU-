-- Existing assets keep their previous visibility. New uploads are private until checked.
alter table public.assets add column if not exists access_data jsonb not null default '{"visibility":"public","scan":"legacy","members":[]}'::jsonb;
alter table public.assets alter column access_data set default '{"visibility":"owner","scan":"pending","members":[]}'::jsonb;
alter table public.assets drop constraint if exists assets_access_data_valid;
alter table public.assets add constraint assets_access_data_valid check (
 jsonb_typeof(access_data)='object' and access_data ?& array['visibility','members'] and access_data->>'visibility' in ('public','owner','members')
 and jsonb_typeof(access_data->'members')='array'
);
comment on column public.assets.access_data is 'Server-only per-file visibility, scan outcome and explicitly granted member IDs. No public table permissions.';
