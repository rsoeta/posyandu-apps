-- ============================================================
-- Posyandu Desa - Initial Schema + RLS (Object-Level RBAC)
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ---------- posyandu (master) ----------
create table if not exists public.posyandu (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  desa       text,
  alamat     text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- profiles (extends auth.users) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'kader' check (role in ('admin_desa','kader')),
  posyandu_id uuid references public.posyandu(id) on delete set null,
  full_name   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'kader')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent non-admin from escalating role/posyandu_id
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin_desa'
  ) then
    -- non-admin cannot change role or posyandu_id
    new.role := old.role;
    new.posyandu_id := old.posyandu_id;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists protect_profile_fields on public.profiles;
create trigger protect_profile_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ---------- balita ----------
create table if not exists public.balita (
  id            uuid primary key default gen_random_uuid(),
  posyandu_id   uuid not null references public.posyandu(id) on delete cascade,
  nama          text not null,
  nik           text,
  tanggal_lahir date,
  jenis_kelamin text check (jenis_kelamin in ('L','P')),
  nama_ibu      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists balita_touch on public.balita;
create trigger balita_touch before update on public.balita
  for each row execute function public.touch_updated_at();

-- ---------- ibu_hamil ----------
create table if not exists public.ibu_hamil (
  id            uuid primary key default gen_random_uuid(),
  posyandu_id   uuid not null references public.posyandu(id) on delete cascade,
  nama          text not null,
  usia_kehamilan int,
  hpht          date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists ibu_hamil_touch on public.ibu_hamil;
create trigger ibu_hamil_touch before update on public.ibu_hamil
  for each row execute function public.touch_updated_at();

-- ---------- pengukuran ----------
create table if not exists public.pengukuran (
  id             uuid primary key default gen_random_uuid(),
  balita_id      uuid not null references public.balita(id) on delete cascade,
  posyandu_id    uuid not null references public.posyandu(id) on delete cascade,
  tanggal_ukur   date not null default current_date,
  berat_badan    numeric(5,2) not null,
  tinggi_badan   numeric(5,2) not null,
  lingkar_kepala numeric(5,2),
  catatan        text,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

-- Auto-sync posyandu_id from balita on insert
create or replace function public.sync_pengukuran_posyandu()
returns trigger language plpgsql as $$
begin
  select posyandu_id into new.posyandu_id from public.balita where id = new.balita_id;
  if new.posyandu_id is null then
    raise exception 'Balita tidak ditemukan';
  end if;
  return new;
end; $$;

drop trigger if exists sync_pengukuran_posyandu on public.pengukuran;
create trigger sync_pengukuran_posyandu
  before insert on public.pengukuran
  for each row execute function public.sync_pengukuran_posyandu();

-- ---------- jadwal ----------
create table if not exists public.jadwal (
  id          uuid primary key default gen_random_uuid(),
  posyandu_id uuid not null references public.posyandu(id) on delete cascade,
  judul       text not null,
  tanggal     date not null,
  waktu       text,
  tempat      text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================
alter table public.posyandu    enable row level security;
alter table public.profiles     enable row level security;
alter table public.balita       enable row level security;
alter table public.ibu_hamil    enable row level security;
alter table public.pengukuran    enable row level security;
alter table public.jadwal       enable row level security;

-- Helper functions (security definer)
create or replace function public.current_posyandu_id()
returns uuid
language sql
stable
security definer set search_path = public
as $$
  select posyandu_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin_desa'
  );
$$;

-- ---------- posyandu policies ----------
drop policy if exists posyandu_select on public.posyandu;
create policy posyandu_select on public.posyandu
  for select using (public.is_admin() or id = public.current_posyandu_id());

drop policy if exists posyandu_insert on public.posyandu;
create policy posyandu_insert on public.posyandu
  for insert with check (public.is_admin());

drop policy if exists posyandu_update on public.posyandu;
create policy posyandu_update on public.posyandu
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists posyandu_delete on public.posyandu;
create policy posyandu_delete on public.posyandu
  for delete using (public.is_admin());

-- ---------- profiles policies ----------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (public.is_admin() or id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (public.is_admin() or id = auth.uid())
  with check (public.is_admin() or id = auth.uid());

-- ---------- balita policies ----------
drop policy if exists balita_select on public.balita;
create policy balita_select on public.balita
  for select using (public.is_admin() or posyandu_id = public.current_posyandu_id());

drop policy if exists balita_insert on public.balita;
create policy balita_insert on public.balita
  for insert with check (public.is_admin() or posyandu_id = public.current_posyandu_id());

drop policy if exists balita_update on public.balita;
create policy balita_update on public.balita
  for update using (public.is_admin() or posyandu_id = public.current_posyandu_id())
  with check (public.is_admin() or posyandu_id = public.current_posyandu_id());

drop policy if exists balita_delete on public.balita;
create policy balita_delete on public.balita
  for delete using (public.is_admin() or posyandu_id = public.current_posyandu_id());

-- ---------- ibu_hamil policies ----------
drop policy if exists ibu_hamil_select on public.ibu_hamil;
create policy ibu_hamil_select on public.ibu_hamil
  for select using (public.is_admin() or posyandu_id = public.current_posyandu_id());

drop policy if exists ibu_hamil_insert on public.ibu_hamil;
create policy ibu_hamil_insert on public.ibu_hamil
  for insert with check (public.is_admin() or posyandu_id = public.current_posyandu_id());

drop policy if exists ibu_hamil_update on public.ibu_hamil;
create policy ibu_hamil_update on public.ibu_hamil
  for update using (public.is_admin() or posyandu_id = public.current_posyandu_id())
  with check (public.is_admin() or posyandu_id = public.current_posyandu_id());

drop policy if exists ibu_hamil_delete on public.ibu_hamil;
create policy ibu_hamil_delete on public.ibu_hamil
  for delete using (public.is_admin() or posyandu_id = public.current_posyandu_id());

-- ---------- pengukuran policies ----------
drop policy if exists pengukuran_select on public.pengukuran;
create policy pengukuran_select on public.pengukuran
  for select using (public.is_admin() or posyandu_id = public.current_posyandu_id());

drop policy if exists pengukuran_insert on public.pengukuran;
create policy pengukuran_insert on public.pengukuran
  for insert with check (public.is_admin() or posyandu_id = public.current_posyandu_id());

drop policy if exists pengukuran_update on public.pengukuran;
create policy pengukuran_update on public.pengukuran
  for update using (public.is_admin() or posyandu_id = public.current_posyandu_id())
  with check (public.is_admin() or posyandu_id = public.current_posyandu_id());

drop policy if exists pengukuran_delete on public.pengukuran;
create policy pengukuran_delete on public.pengukuran
  for delete using (public.is_admin() or posyandu_id = public.current_posyandu_id());

-- ---------- jadwal policies ----------
drop policy if exists jadwal_select on public.jadwal;
create policy jadwal_select on public.jadwal
  for select using (public.is_admin() or posyandu_id = public.current_posyandu_id());

drop policy if exists jadwal_insert on public.jadwal;
create policy jadwal_insert on public.jadwal
  for insert with check (public.is_admin() or posyandu_id = public.current_posyandu_id());

drop policy if exists jadwal_update on public.jadwal;
create policy jadwal_update on public.jadwal
  for update using (public.is_admin() or posyandu_id = public.current_posyandu_id())
  with check (public.is_admin() or posyandu_id = public.current_posyandu_id());

drop policy if exists jadwal_delete on public.jadwal;
create policy jadwal_delete on public.jadwal
  for delete using (public.is_admin() or posyandu_id = public.current_posyandu_id());

-- Indexes
create index if not exists idx_balita_posyandu on public.balita(posyandu_id);
create index if not exists idx_pengukuran_balita on public.pengukuran(balita_id);
create index if not exists idx_pengukuran_posyandu on public.pengukuran(posyandu_id);
create index if not exists idx_profiles_posyandu on public.profiles(posyandu_id);
