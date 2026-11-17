-- FITDAY initial schema: run with `supabase db push` or in the Supabase SQL Editor.
create extension if not exists pgcrypto;

do $$ begin
  create type public.garment_category as enum ('tshirt', 'hoodie', 'crewneck', 'jeans', 'trousers', 'socks', 'shoes', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.garment_fit as enum ('slim', 'regular', 'relaxed', 'oversized', 'wide', 'unknown');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.laundry_status as enum ('clean', 'dirty', 'washing', 'drying');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  style_preferences text[] not null default '{}',
  favorite_colors text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.garments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  category public.garment_category not null,
  brand text check (brand is null or char_length(brand) <= 80),
  color text not null check (char_length(color) between 1 and 40),
  color_hex text check (color_hex is null or color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  fit public.garment_fit not null default 'unknown',
  laundry_status public.laundry_status not null default 'clean',
  image_path text,
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.avatar_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  model_path text,
  config jsonb not null default '{"bodyType":"standard","skinTone":"medium","hairStyle":"short","hairColor":"brown"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  outfit_date date not null default current_date,
  title text not null default 'Il tuo look di oggi',
  rationale text,
  occasion text,
  weather_summary text,
  created_at timestamptz not null default now(),
  unique (user_id, outfit_date)
);

create table if not exists public.outfit_items (
  outfit_id uuid not null references public.outfits(id) on delete cascade,
  garment_id uuid not null references public.garments(id) on delete cascade,
  position smallint not null default 0,
  primary key (outfit_id, garment_id)
);

create index if not exists garments_user_status_idx on public.garments(user_id, laundry_status);
create index if not exists garments_user_category_idx on public.garments(user_id, category);
create index if not exists outfits_user_date_idx on public.outfits(user_id, outfit_date desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists garments_set_updated_at on public.garments;
create trigger garments_set_updated_at before update on public.garments
for each row execute function public.set_updated_at();
drop trigger if exists avatar_profiles_set_updated_at on public.avatar_profiles;
create trigger avatar_profiles_set_updated_at before update on public.avatar_profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  insert into public.avatar_profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_fitday on auth.users;
create trigger on_auth_user_created_fitday
after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.garments enable row level security;
alter table public.avatar_profiles enable row level security;
alter table public.outfits enable row level security;
alter table public.outfit_items enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "garments_select_own" on public.garments for select to authenticated using (user_id = (select auth.uid()));
create policy "garments_insert_own" on public.garments for insert to authenticated with check (user_id = (select auth.uid()));
create policy "garments_update_own" on public.garments for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "garments_delete_own" on public.garments for delete to authenticated using (user_id = (select auth.uid()));

create policy "avatar_select_own" on public.avatar_profiles for select to authenticated using (user_id = (select auth.uid()));
create policy "avatar_insert_own" on public.avatar_profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy "avatar_update_own" on public.avatar_profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "outfits_select_own" on public.outfits for select to authenticated using (user_id = (select auth.uid()));
create policy "outfits_insert_own" on public.outfits for insert to authenticated with check (user_id = (select auth.uid()));
create policy "outfits_update_own" on public.outfits for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "outfits_delete_own" on public.outfits for delete to authenticated using (user_id = (select auth.uid()));

create policy "outfit_items_select_own" on public.outfit_items for select to authenticated
using (exists (select 1 from public.outfits o where o.id = outfit_id and o.user_id = (select auth.uid())));
create policy "outfit_items_insert_own" on public.outfit_items for insert to authenticated
with check (
  exists (select 1 from public.outfits o where o.id = outfit_id and o.user_id = (select auth.uid()))
  and exists (select 1 from public.garments g where g.id = garment_id and g.user_id = (select auth.uid()))
);
create policy "outfit_items_delete_own" on public.outfit_items for delete to authenticated
using (exists (select 1 from public.outfits o where o.id = outfit_id and o.user_id = (select auth.uid())));

-- Private image bucket. Every file path must start with the owner's auth UID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wardrobe', 'wardrobe', false, 10485760, array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do update set public = false, file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic'];

create policy "wardrobe_read_own" on storage.objects for select to authenticated
using (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "wardrobe_upload_own" on storage.objects for insert to authenticated
with check (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "wardrobe_update_own" on storage.objects for update to authenticated
using (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "wardrobe_delete_own" on storage.objects for delete to authenticated
using (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = (select auth.uid())::text);
