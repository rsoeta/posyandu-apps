import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import pool from './config/db.js'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'
import posyanduRoutes from './routes/posyandu.js'
import balitaRoutes from './routes/balita.js'
import pengukuranRoutes from './routes/pengukuran.js'
import jadwalRoutes from './routes/jadwal.js'
import dashboardRoutes from './routes/dashboard.js'
import usersRoutes from './routes/users.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/posyandu', posyanduRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/balita', balitaRoutes)
app.use('/api/pengukuran', pengukuranRoutes)
app.use('/api/jadwal', jadwalRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Posyandu API running on http://localhost:${PORT}`)
})
