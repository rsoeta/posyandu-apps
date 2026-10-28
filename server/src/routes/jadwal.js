import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import pool from '../config/db.js'
import { auth, adminOnly } from '../middleware/auth.js'
import { notFound, badRequest } from '../utils/errors.js'

const router = Router()

router.get('/', auth, async (req, res, next) => {
  try {
    let sql = 'SELECT id, posyandu_id, judul, tanggal, waktu, tempat, created_at FROM jadwal'
    const params = []
    if (req.user.role !== 'admin_desa') {
      sql += ' WHERE posyandu_id = ?'
      params.push(req.user.posyandu_id)
    }
    sql += ' ORDER BY tanggal ASC'
    const [rows] = await pool.execute(sql, params)
    res.json({ data: rows })
  } catch (e) { next(e) }
})

router.post(
  '/',
  auth,
  [
    body('judul').isString().trim().notEmpty(),
    body('posyandu_id').optional().isUUID(),
    body('tanggal').isISO8601(),
    body('waktu').optional().isString().trim(),
    body('tempat').optional().isString().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) throw badRequest('Input tidak valid.')
      let posyanduId = req.body.posyandu_id
      if (req.user.role !== 'admin_desa') posyanduId = req.user.posyandu_id
      if (!posyanduId) throw badRequest('posyandu_id wajib.')
      const id = crypto.randomUUID()
      const { judul, tanggal, waktu, tempat } = req.body
      await pool.execute(
        'INSERT INTO jadwal (id, posyandu_id, judul, tanggal, waktu, tempat) VALUES (?,?,?,?,?,?)',
        [id, posyanduId, judul, tanggal, waktu || null, tempat || null]
      )
      res.status(201).json({ data: { id } })
    } catch (e) { next(e) }
  }
)

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const id = req.params.id
    let sql = 'DELETE FROM jadwal WHERE id = ?'
    const params = [id]
    if (req.user.role !== 'admin_desa') {
      sql += ' AND posyandu_id = ?'
      params.push(req.user.posyandu_id)
    }
    const [result] = await pool.execute(sql, params)
    if (result.affectedRows === 0) throw notFound()
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router
