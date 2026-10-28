import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import pool from '../config/db.js'
import { auth, adminOnly } from '../middleware/auth.js'
import { badRequest, notFound, forbidden } from '../utils/errors.js'

const router = Router()

router.get('/', auth, adminOnly, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        u.id, 
        u.email, 
        u.full_name, 
        u.role, 
        u.status, 
        u.posyandu_id, 
        p.name AS posyandu_name, 
        u.created_at
      FROM users u
      LEFT JOIN posyandu p ON p.id = u.posyandu_id
      ORDER BY 
        CASE WHEN u.status = 'pending' THEN 0 ELSE 1 END,
        u.created_at DESC
    `)
    res.json({ data: rows })
  } catch (e) { next(e) }
})

router.patch(
  '/:id/status',
  auth,
  adminOnly,
  [
    body('status').isIn(['approved', 'rejected', 'pending']).withMessage('Status tidak valid.'),
    body('posyandu_id').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('Posyandu ID tidak valid.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) throw badRequest(errors.array()[0].msg)

      const { id } = req.params
      const { status, posyandu_id } = req.body

      const [existing] = await pool.execute('SELECT id, role FROM users WHERE id = ?', [id])
      if (existing.length === 0) throw notFound('User tidak ditemukan.')

      // Jangan izinkan admin menonaktifkan dirinya sendiri
      if (id === req.user.id && status !== 'approved') {
        throw forbidden('Anda tidak dapat mengubah status akun Anda sendiri.')
      }

      if (posyandu_id !== undefined) {
        await pool.execute('UPDATE users SET status = ?, posyandu_id = ? WHERE id = ?', [
          status,
          posyandu_id || null,
          id,
        ])
      } else {
        await pool.execute('UPDATE users SET status = ? WHERE id = ?', [status, id])
      }

      res.json({ ok: true, message: `Status kader berhasil diperbarui menjadi ${status}.` })
    } catch (e) { next(e) }
  }
)

router.delete('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const { id } = req.params
    if (id === req.user.id) {
      throw forbidden('Anda tidak dapat menghapus akun Anda sendiri.')
    }
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id])
    if (result.affectedRows === 0) throw notFound('User tidak ditemukan.')
    res.json({ ok: true, message: 'User berhasil dihapus.' })
  } catch (e) { next(e) }
})

export default router
