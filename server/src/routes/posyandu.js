import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import pool from '../config/db.js'
import { auth, adminOnly } from '../middleware/auth.js'
import { notFound, badRequest, forbidden } from '../utils/errors.js'

const router = Router()

router.get('/', auth, async (req, res, next) => {
  try {
    let sql = 'SELECT id, name, desa, alamat, created_at FROM posyandu'
    const params = []
    if (req.user.role !== 'admin_desa') {
      sql += ' WHERE id = ?'
      params.push(req.user.posyandu_id)
    }
    sql += ' ORDER BY name'
    const [rows] = await pool.execute(sql, params)
    res.json({ data: rows })
  } catch (e) { next(e) }
})

router.get('/:id', auth, async (req, res, next) => {
  try {
    const id = req.params.id
    const [rows] = await pool.execute('SELECT id, name, desa, alamat FROM posyandu WHERE id = ?', [id])
    const row = rows[0]
    if (!row) throw notFound()
    if (req.user.role !== 'admin_desa' && row.id !== req.user.posyandu_id) throw notFound()
    res.json({ data: row })
  } catch (e) { next(e) }
})

router.post(
  '/',
  auth,
  adminOnly,
  [
    body('name').isString().trim().notEmpty(),
    body('desa').optional().isString().trim(),
    body('alamat').optional().isString().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) throw badRequest('Input tidak valid.')
      const id = crypto.randomUUID()
      const { name, desa, alamat } = req.body
      await pool.execute(
        'INSERT INTO posyandu (id, name, desa, alamat) VALUES (?,?,?,?)',
        [id, name, desa || null, alamat || null]
      )
      res.status(201).json({ data: { id, name, desa, alamat } })
    } catch (e) { next(e) }
  }
)

router.put(
  '/:id',
  auth,
  adminOnly,
  [
    param('id').isUUID(),
    body('name').optional().isString().trim().notEmpty(),
    body('desa').optional().isString().trim(),
    body('alamat').optional().isString().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) throw badRequest('Input tidak valid.')
      const id = req.params.id
      const [rows] = await pool.execute('SELECT id FROM posyandu WHERE id = ?', [id])
      if (!rows[0]) throw notFound()
      const { name, desa, alamat } = req.body
      await pool.execute(
        'UPDATE posyandu SET name = COALESCE(?, name), desa = COALESCE(?, desa), alamat = COALESCE(?, alamat), updated_at = NOW() WHERE id = ?',
        [name ?? null, desa ?? null, alamat ?? null, id]
      )
      res.json({ ok: true })
    } catch (e) { next(e) }
  }
)

router.delete('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const id = req.params.id
    const [rows] = await pool.execute('SELECT id FROM posyandu WHERE id = ?', [id])
    if (!rows[0]) throw notFound()
    await pool.execute('DELETE FROM posyandu WHERE id = ?', [id])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// assign kader to posyandu
router.post(
  '/assign',
  auth,
  adminOnly,
  [
    body('userId').isUUID(),
    body('posyanduId').isUUID(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) throw badRequest('Input tidak valid.')
      const { userId, posyanduId } = req.body
      const [u] = await pool.execute('SELECT id FROM users WHERE id = ?', [userId])
      if (!u[0]) throw notFound()
      const [p] = await pool.execute('SELECT id FROM posyandu WHERE id = ?', [posyanduId])
      if (!p[0]) throw notFound()
      await pool.execute(
        "UPDATE users SET role = 'kader', posyandu_id = ?, updated_at = NOW() WHERE id = ?",
        [posyanduId, userId]
      )
      res.json({ ok: true })
    } catch (e) { next(e) }
  }
)

export default router
