import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import { randomUUID } from 'node:crypto'
import pool from '../config/db.js'
import { auth } from '../middleware/auth.js'
import { badRequest, unauthorized, forbidden } from '../utils/errors.js'
import { verifyTurnstile } from '../utils/turnstile.js'

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

      const { email, password, cfToken } = req.body

      const cfCheck = await verifyTurnstile(cfToken, req.ip)
      if (!cfCheck.success) {
        throw badRequest(cfCheck.message)
      }

      const [rows] = await pool.execute(
        'SELECT id, email, password_hash, role, status, posyandu_id, full_name FROM users WHERE email = ?',
        [email]
      )
      const user = rows[0]
      if (!user) throw unauthorized('Email atau password salah.')
      const ok = await bcrypt.compare(password, user.password_hash)
      if (!ok) throw unauthorized('Email atau password salah.')

      if (user.status === 'pending') {
        throw forbidden('Akun Anda masih menunggu persetujuan (approval) oleh Admin Desa.')
      }
      if (user.status === 'rejected') {
        throw forbidden('Pendaftaran akun Anda ditolak oleh Admin Desa. Silakan hubungi pengurus posyandu.')
      }

      const token = jwt.sign(
        { sub: user.id, role: user.role, posyandu_id: user.posyandu_id },
        process.env.JWT_SECRET,
        { expiresIn: '12h' }
      )
      const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production'
      res.cookie('token', token, {
        httpOnly: true,
        secure: isHttps,
        sameSite: 'lax',
        maxAge: 12 * 60 * 60 * 1000,
      })
      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          posyandu_id: user.posyandu_id,
          full_name: user.full_name,
        },
      })
    } catch (e) {
      next(e)
    }
  }
)

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Format email tidak valid.').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter.'),
    body('full_name').trim().notEmpty().withMessage('Nama lengkap wajib diisi.'),
    body('posyandu_id').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('Posyandu tidak valid.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw badRequest(errors.array()[0].msg)
      }

      const { email, password, full_name, posyandu_id, cfToken } = req.body

      const cfCheck = await verifyTurnstile(cfToken, req.ip)
      if (!cfCheck.success) {
        throw badRequest(cfCheck.message)
      }

      const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email])
      if (existing.length > 0) {
        throw badRequest('Email ini sudah terdaftar. Silakan gunakan email lain atau hubungi admin.')
      }

      let validPosyanduId = null
      if (posyandu_id) {
        const [posRows] = await pool.execute('SELECT id FROM posyandu WHERE id = ?', [posyandu_id])
        if (posRows.length > 0) {
          validPosyanduId = posyandu_id
        }
      }

      const hash = await bcrypt.hash(password, 10)
      const id = randomUUID()

      await pool.execute(
        'INSERT INTO users (id, email, password_hash, role, status, posyandu_id, full_name) VALUES (?, ?, ?, "kader", "pending", ?, ?)',
        [id, email, hash, validPosyanduId, full_name.trim()]
      )

      res.status(201).json({
        ok: true,
        message: 'Registrasi berhasil! Akun Anda sedang menunggu verifikasi dan persetujuan Admin Desa sebelum dapat login.',
      })
    } catch (e) {
      next(e)
    }
  }
)

router.post('/logout', (req, res) => {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production'
  res.clearCookie('token', {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
  })
  res.json({ ok: true })
})

router.get('/me', auth, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.email, u.role, u.status, u.posyandu_id, u.full_name, p.name AS posyandu_name
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
