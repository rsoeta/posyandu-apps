# Posyandu Ceria — Aplikasi Pencatatan Posyandu Tingkat Desa

Frontend React/Vite (deploy ke Vercel) + Supabase (PostgreSQL + Auth) dengan Multi-Posyandu RBAC via Row Level Security (RLS).

## Arsitektur

```
┌──────────────────┐        HTTPS        ┌──────────────────────┐
│  React + Vite    │ ──────────────────► │  Supabase (BaaS)     │
│  (Vercel)        │  anon key + JWT     │  - Auth (email/pw)   │
│  - AuthContext   │ ◄────────────────── │  - PostgreSQL + RLS  │
│  - ProtectedRoute│                     │  - Object-level RBAC │
└──────────────────┘                     └──────────────────────┘
```

### Role & Akses
- **Admin Desa**: akses penuh seluruh posyandu di desa, CRUD master Posyandu, assign Kader.
- **Kader Posyandu**: hanya dapat melihat/mengubah data balita & pengukuran di Posyandu tempat ia ditugaskan (`posyandu_id` cocok dengan profil).

RBAC ditegakkan di level database melalui RLS. Frontend hanya menampilkan error generik (`403 Forbidden` / `404 Not Found`) tanpa membocorkan struktur tabel.

### Tabel (semua PK UUID v4)
- `posyandu`, `profiles`, `balita`, `ibu_hamil`, `pengukuran`, `jadwal`.

Lihat skema lengkap di `supabase/migrations/0001_init_posyandu.sql`.

## Setup

1. Buat project Supabase baru (atau gunakan yang ada).
2. Jalankan migrasi: `supabase db push` atau paste SQL di SQL Editor.
3. Buat user admin pertama:
   - Daftar via Auth (email/password), lalu di SQL Editor set role:
     ```sql
     update public.profiles set role = 'admin_desa', posyandu_id = null where id = '<user-uuid>';
     ```
4. Isi `.env`:
   ```
   VITE_SUPABASE_URL=https://<ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-key>
   ```
5. Install & jalankan:
   ```bash
   npm install
   npm run dev
   ```

## Deploy ke Vercel
- Set env vars `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di Vercel Project Settings.
- Build command: `npm run build`, output dir: `dist`.

## Keamanan
- Tidak ada `service_role` key di frontend; hanya `anon` key.
- Semua akses data lewat RLS; error dimapping ke pesan generik di `src/utils/errors.js`.
- Tidak ada `alert()`/`confirm()`; semua dialog via SweetAlert2 (`src/utils/swal.js`).
