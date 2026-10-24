-- Run this script in Supabase Dashboard > SQL Editor for the selected project.
-- It is safe to run again: existing settings and records are preserved.

create extension if not exists pgcrypto;

create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  category text,
  suggested_price numeric(10, 2),
  status text not null default 'available'
    check (status in ('available', 'fulfilled')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  hosts text not null default 'Guilherme & Alice',
  page_title text not null default 'Chá de Casa Nova',
  page_subtitle text not null default 'Guilherme & Alice',
  intro_text text not null default 'Um novo lar, muitas histórias para viver e uma alegria enorme em compartilhar esse momento com vocês! Preparamos uma lista de itens para nossa casa nova e ficaremos muito felizes com o carinho de cada um.',
  about_title text not null default 'Nosso novo lar',
  about_text text not null default '',
  event_date date,
  hero_image_url text,
  about_image_url text,
  delivery_address jsonb not null default '{
    "postal_code": "",
    "street": "",
    "number": "",
    "complement": "",
    "neighborhood": "",
    "city": "",
    "state": "",
    "reference": ""
  }'::jsonb,
  address_is_public boolean not null default false,
  pix_key text not null default 'guilhenriquesilva10@gmail.com',
  pix_text text not null default 'Se preferir, você também pode nos presentear com uma contribuição para ajudar a montar nosso novo lar. Agradecemos muito pelo carinho!',
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  email text primary key,
  added_at timestamptz not null default now(),
  constraint admin_users_email_lowercase check (email = lower(email))
);

-- First authorized administrator. Create this email as an Auth user in Supabase
-- Dashboard > Authentication > Users before signing into /admin.
insert into public.admin_users (email)
values ('guilhenriquesilva10@gmail.com')
on conflict (email) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists gifts_set_updated_at on public.gifts;
create trigger gifts_set_updated_at
before update on public.gifts
for each row execute function public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.get_public_site_settings()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', settings.id,
    'hosts', settings.hosts,
    'page_title', settings.page_title,
    'page_subtitle', settings.page_subtitle,
    'intro_text', settings.intro_text,
    'about_title', settings.about_title,
    'about_text', settings.about_text,
    'event_date', settings.event_date,
    'hero_image_url', settings.hero_image_url,
    'about_image_url', settings.about_image_url,
    'delivery_address',
      case
        when settings.address_is_public
          and length(btrim(coalesce(settings.delivery_address ->> 'postal_code', ''))) > 0
          and length(btrim(coalesce(settings.delivery_address ->> 'street', ''))) > 0
          and length(btrim(coalesce(settings.delivery_address ->> 'number', ''))) > 0
          and length(btrim(coalesce(settings.delivery_address ->> 'neighborhood', ''))) > 0
          and length(btrim(coalesce(settings.delivery_address ->> 'city', ''))) > 0
          and length(btrim(coalesce(settings.delivery_address ->> 'state', ''))) > 0
        then settings.delivery_address
        else null
      end,
    'pix_key', settings.pix_key,
    'pix_text', settings.pix_text,
    'updated_at', settings.updated_at
  )
  from public.site_settings as settings
  where settings.id = 1;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.is_admin() from public;
revoke all on function public.get_public_site_settings() from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.get_public_site_settings() to anon, authenticated;

alter table public.gifts enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_users enable row level security;

revoke all on public.gifts from anon, authenticated;
grant select on public.gifts to anon, authenticated;
grant insert, update, delete on public.gifts to authenticated;

revoke all on public.site_settings from anon, authenticated;
grant select, update on public.site_settings to authenticated;

revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

drop policy if exists "Guests and hosts can read visible gifts" on public.gifts;
create policy "Guests and hosts can read visible gifts"
on public.gifts for select
to anon, authenticated
using (status = 'available' or (select public.is_admin()));

drop policy if exists "Hosts can add gifts" on public.gifts;
create policy "Hosts can add gifts"
on public.gifts for insert
to authenticated
with check ((select public.is_admin()));

drop policy if exists "Hosts can update gifts" on public.gifts;
create policy "Hosts can update gifts"
on public.gifts for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Hosts can delete gifts" on public.gifts;
create policy "Hosts can delete gifts"
on public.gifts for delete
to authenticated
using ((select public.is_admin()));

drop policy if exists "Hosts can read site settings" on public.site_settings;
create policy "Hosts can read site settings"
on public.site_settings for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "Hosts can update site settings" on public.site_settings;
create policy "Hosts can update site settings"
on public.site_settings for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Users can verify their own admin access" on public.admin_users;
create policy "Users can verify their own admin access"
on public.admin_users for select
to authenticated
using (email = lower(coalesce(auth.jwt() ->> 'email', '')));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gift-photos',
  'gift-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Guests can view gift photos'
  ) then
    create policy "Guests can view gift photos"
    on storage.objects for select
    to anon, authenticated
    using (bucket_id = 'gift-photos');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Hosts can upload gift photos'
  ) then
    create policy "Hosts can upload gift photos"
    on storage.objects for insert
    to authenticated
    with check (bucket_id = 'gift-photos' and (select public.is_admin()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Hosts can update gift photos'
  ) then
    create policy "Hosts can update gift photos"
    on storage.objects for update
    to authenticated
    using (bucket_id = 'gift-photos' and (select public.is_admin()))
    with check (bucket_id = 'gift-photos' and (select public.is_admin()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Hosts can delete gift photos'
  ) then
    create policy "Hosts can delete gift photos"
    on storage.objects for delete
    to authenticated
    using (bucket_id = 'gift-photos' and (select public.is_admin()));
  end if;
end;
$$;
