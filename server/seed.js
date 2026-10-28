import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import pool from './src/config/db.js'

const email = process.env.SEED_ADMIN_EMAIL || 'admin@posyandu.local'
const password = process.env.SEED_ADMIN_PASSWORD || 'admin123'
const hash = await bcrypt.hash(password, 10)
const id = randomUUID()

await pool.execute(
  'INSERT INTO users (id, email, password_hash, role, status, full_name) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE status="approved"',
  [id, email, hash, 'admin_desa', 'approved', 'Admin Desa']
)
console.log('Seeded admin:', email, '/', password)
process.exit(0)
