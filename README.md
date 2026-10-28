# Posyandu Ceria — Aplikasi Pencatatan Posyandu Tingkat Desa

Frontend React/Vite (deploy ke Vercel) + Backend REST API (Node/Express) + MySQL, dengan Multi-Posyandu Object-Level RBAC.

## Arsitektur

```
┌──────────────────┐   HTTPS/JSON   ┌──────────────────────┐
│  React + Vite    │ ─────────────► │  Express REST API    │
│  (Vercel)        │  cookie (JWT)  │  (Node.js)           │
│  - AuthContext   │ ◄───────────── │  - Object-Level RBAC │
│  - ProtectedRoute│                │  - bcrypt + JWT      │
└──────────────────┘                └──────────┬───────────┘
                                               │
                                               ▼
                                       ┌──────────────┐
                                       │   MySQL      │
                                       │  (UUID PKs)  │
                                       └──────────────┘
```

### Role & Akses
- **Admin Desa**: akses penuh, CRUD master Posyandu, assign Kader, lihat seluruh data.
- **Kader Posyandu**: hanya dapat melihat/mengubah data balita & pengukuran di Posyandu tempat ia ditugaskan.

RBAC ditegakkan di **setiap endpoint & query** (filter `posyandu_id` eksplisit). Jika Kader mengakses UUID milik posyandu lain, API mengembalikan `404 Not Found` (tanpa membocorkan eksistensi data). Endpoint admin-only mengembalikan `403 Forbidden`.

### Keamanan
- Password di-hash dengan **bcrypt**.
- Autentikasi via **JWT** di httpOnly cookie.
- Semua query MySQL menggunakan **prepared statements** (mysql2 `execute`).
- Validasi input ketat via **express-validator**.
- Semua Primary Key menggunakan **UUID (CHAR(36))**, bukan auto-increment.
- Frontend hanya menampilkan pesan error generik (`403/404`).

## Struktur Proyek

```
posyandu-apps/
├── src/                    # Frontend React/Vite
│   ├── lib/api.js
│   ├── contexts/AuthContext.jsx
│   ├── components/
│   ├── pages/
│   └── utils/swal.js
├── server/                 # Backend REST API
│   ├── src/
│   │   ├── index.js
│   │   ├── config/db.js
│   │   ├── middleware/
│   │   └── routes/
│   ├── schema.sql
│   ├── seed.js
│   └── .env.example
├── .env.example
└── README.md
```

## Setup

### Backend
1. Buat database & tabel:
   ```bash
   mysql -u root -e "CREATE DATABASE IF NOT EXISTS posyandu;"
   mysql -u root posyandu < server/schema.sql
   ```
2. Konfigurasi `server/.env` (lihat `server/.env.example`).
3. Seed admin:
   ```bash
   cd server && npm install && node seed.js
   ```
   Default: `admin@posyandu.local` / `admin123`.
4. Jalankan:
   ```bash
   cd server && npm run dev   # http://localhost:4000
   ```

### Frontend
1. Konfigurasi `.env` (lihat `.env.example`): `VITE_API_URL=http://localhost:4000`.
2. Install & jalankan:
   ```bash
   npm install
   npm run dev   # http://localhost:5173
   ```

## Deploy
- Backend: deploy ke VPS/Render/Railway, set env vars, jalankan `npm start`.
- Frontend: deploy ke Vercel, set `VITE_API_URL` ke URL backend, build `npm run build`, output `dist`.
- Pastikan CORS `CLIENT_ORIGIN` di backend sesuai domain frontend.
