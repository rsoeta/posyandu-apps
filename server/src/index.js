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

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map(o => o.trim())

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    // Di mode non-production, izinkan semua port localhost (5173, 5174, dll)
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true)
    }
    if (allowedOrigins.includes(origin)) {
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
