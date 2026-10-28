import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import pool from '../config/db.js'
import { auth } from '../middleware/auth.js'
import { badRequest, unauthorized } from '../utils/errors.js'

const router = Router()

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isString().notEmpty(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) throw badRequest('Input tidak valid.')

      const { email, password } = req.body
      const [rows] = await pool.execute(
        'SELECT id, email, password_hash, role, posyandu_id, full_name FROM users WHERE email = ?',
        [email]
      )
      const user = rows[0]
      if (!user) throw unauthorized('Email atau password salah.')
      const ok = await bcrypt.compare(password, user.password_hash)
      if (!ok) throw unauthorized('Email atau password salah.')

      const token = jwt.sign(
        { sub: user.id, role: user.role, posyandu_id: user.posyandu_id },
        process.env.JWT_SECRET,
        { expiresIn: '12h' }
      )
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 12 * 60 * 60 * 1000,
      })
      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          posyandu_id: user.posyandu_id,
          full_name: user.full_name,
        },
      })
    } catch (e) {
      next(e)
    }
  }
)

router.post('/logout', (req, res) => {
  res.clearCookie('token')
  res.json({ ok: true })
})

router.get('/me', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.email, u.role, u.posyandu_id, u.full_name, p.name AS posyandu_name
       FROM users u LEFT JOIN posyandu p ON p.id = u.posyandu_id
       WHERE u.id = ?`,
      [req.user.id]
    )
    if (!rows[0]) throw unauthorized()
    res.json({ user: rows[0] })
  } catch (e) {
    next(e)
  }
})

export default router
