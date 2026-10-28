import { Router } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import pool from '../config/db.js'
import { auth, adminOnly } from '../middleware/auth.js'
import { notFound, badRequest } from '../utils/errors.js'

const router = Router()

router.get('/', auth, async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim()
    let sql = 'SELECT id, posyandu_id, nama, nik, tanggal_lahir, jenis_kelamin, nama_ibu, created_at FROM balita'
    const params = []
    const where = []
    if (req.user.role !== 'admin_desa') {
      where.push('posyandu_id = ?')
      params.push(req.user.posyandu_id)
    }
    if (q) {
      where.push('nama LIKE ?')
      params.push(`%${q}%`)
    }
    if (where.length) sql += ' WHERE ' + where.join(' AND ')
    sql += ' ORDER BY nama'
    const [rows] = await pool.execute(sql, params)
    res.json({ data: rows })
  } catch (e) { next(e) }
})

router.get('/:id', auth, async (req, res, next) => {
  try {
    const id = req.params.id
    const [rows] = await pool.execute(
      'SELECT id, posyandu_id, nama, nik, tanggal_lahir, jenis_kelamin, nama_ibu FROM balita WHERE id = ?',
      [id]
    )
    const row = rows[0]
    if (!row) throw notFound()
    if (req.user.role !== 'admin_desa' && row.posyandu_id !== req.user.posyandu_id) throw notFound()
    res.json({ data: row })
  } catch (e) { next(e) }
})

router.post(
  '/',
  auth,
  [
    body('nama').isString().trim().notEmpty(),
    body('posyandu_id').optional().isUUID(),
    body('nik').optional().isString().trim(),
    body('tanggal_lahir').optional().isISO8601(),
    body('jenis_kelamin').optional().isIn(['L', 'P']),
    body('nama_ibu').optional().isString().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) throw badRequest('Input tidak valid.')
      let posyanduId = req.body.posyandu_id
      if (req.user.role !== 'admin_desa') {
        posyanduId = req.user.posyandu_id
      }
      if (!posyanduId) throw badRequest('posyandu_id wajib.')
      const id = crypto.randomUUID()
      const { nama, nik, tanggal_lahir, jenis_kelamin, nama_ibu } = req.body
      await pool.execute(
        'INSERT INTO balita (id, posyandu_id, nama, nik, tanggal_lahir, jenis_kelamin, nama_ibu) VALUES (?,?,?,?,?,?,?)',
        [id, posyanduId, nama, nik || null, tanggal_lahir || null, jenis_kelamin || null, nama_ibu || null]
      )
      res.status(201).json({ data: { id } })
    } catch (e) { next(e) }
  }
)

router.put(
  '/:id',
  auth,
  [
    param('id').isUUID(),
    body('nama').optional().isString().trim().notEmpty(),
    body('nik').optional().isString().trim(),
    body('tanggal_lahir').optional().isISO8601(),
    body('jenis_kelamin').optional().isIn(['L', 'P']),
    body('nama_ibu').optional().isString().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) throw badRequest('Input tidak valid.')
      const id = req.params.id
      const { nama, nik, tanggal_lahir, jenis_kelamin, nama_ibu } = req.body
      let sql = `UPDATE balita SET
        nama = COALESCE(?, nama),
        nik = COALESCE(?, nik),
        tanggal_lahir = COALESCE(?, tanggal_lahir),
        jenis_kelamin = COALESCE(?, jenis_kelamin),
        nama_ibu = COALESCE(?, nama_ibu),
        updated_at = NOW()
        WHERE id = ?`
      const params = [nama ?? null, nik ?? null, tanggal_lahir ?? null, jenis_kelamin ?? null, nama_ibu ?? null, id]
      if (req.user.role !== 'admin_desa') {
        sql += ' AND posyandu_id = ?'
        params.push(req.user.posyandu_id)
      }
      const [result] = await pool.execute(sql, params)
      if (result.affectedRows === 0) throw notFound()
      res.json({ ok: true })
    } catch (e) { next(e) }
  }
)

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const id = req.params.id
    let sql = 'DELETE FROM balita WHERE id = ?'
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
