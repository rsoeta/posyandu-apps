import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pool from './config/db.js'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'
import posyanduRoutes from './routes/posyandu.js'
import balitaRoutes from './routes/balita.js'
import pengukuranRoutes from './routes/pengukuran.js'
import jadwalRoutes from './routes/jadwal.js'
import dashboardRoutes from './routes/dashboard.js'
import usersRoutes from './routes/users.js'
import kegiatanRoutes from './routes/kegiatan.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '../public/uploads')

const app = express()
const PORT = process.env.PORT || 4000

// Percayai reverse proxy (seperti Vite dev proxy atau Cloudflare Tunnel)
app.set('trust proxy', 1)

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map(o => o.trim())

app.use(cors({
  origin: (origin, callback) => {
    // 1. Izinkan request tanpa origin (seperti request internal same-origin, curl, server-to-server)
    if (!origin) return callback(null, true)

    // 2. Izinkan semua port localhost & 127.0.0.1
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true)
    }

    // 3. Izinkan domain Cloudflare Tunnel (*.trycloudflare.com)
    if (/^https?:\/\/([a-z0-9-]+\.)?trycloudflare\.com$/.test(origin)) {
      return callback(null, true)
    }

    // 4. Izinkan domain yang tercantum di CLIENT_ORIGIN
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    // 5. Di mode development, fleksibel izinkan untuk memudahkan uji coba
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true)
    }

    callback(new Error(`Origin ${origin} tidak diizinkan oleh CORS`))
  },
  credentials: true,
}))
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ limit: '20mb', extended: true }))
app.use(cookieParser())

// Sajikan file statis foto kegiatan
app.use('/uploads', express.static(uploadsDir))

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/posyandu', posyanduRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/balita', balitaRoutes)
app.use('/api/pengukuran', pengukuranRoutes)
app.use('/api/jadwal', jadwalRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/kegiatan', kegiatanRoutes)

// Rute share publik Open Graph untuk medsos (whatsapp, facebook, etc)
app.use('/kegiatan', kegiatanRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Posyandu API running on http://localhost:${PORT}`)
})
