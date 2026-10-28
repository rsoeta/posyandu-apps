import { Router } from 'express'
import pool from '../config/db.js'
import { auth, adminOnly } from '../middleware/auth.js'

const router = Router()

router.get('/', auth, adminOnly, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, email, full_name, role, posyandu_id, created_at FROM users ORDER BY full_name'
    )
    res.json({ data: rows })
  } catch (e) { next(e) }
})

export default router
