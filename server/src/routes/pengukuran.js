import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import pool from '../config/db.js'
import { auth } from '../middleware/auth.js'
import { notFound, badRequest } from '../utils/errors.js'

const router = Router()

router.get('/', auth, async (req, res, next) => {
  try {
    const balitaId = req.query.balita_id
    let sql = `SELECT id, balita_id, posyandu_id, tanggal_ukur, berat_badan, tinggi_badan, lingkar_kepala, catatan, created_at
               FROM pengukuran`
    const params = []
    const where = []
    if (req.user.role !== 'admin_desa') {
      where.push('posyandu_id = ?')
      params.push(req.user.posyandu_id)
    }
    if (balitaId) {
      where.push('balita_id = ?')
      params.push(balitaId)
    }
    if (where.length) sql += ' WHERE ' + where.join(' AND ')
    sql += ' ORDER BY tanggal_ukur DESC'
    const [rows] = await pool.execute(sql, params)
    res.json({ data: rows })
  } catch (e) { next(e) }
})

router.post(
  '/',
  auth,
  [
    body('balita_id').isUUID(),
    body('berat_badan').isFloat({ gt: 0 }),
    body('tinggi_badan').isFloat({ gt: 0 }),
    body('lingkar_kepala').optional().isFloat({ gt: 0 }),
    body('tanggal_ukur').optional().isISO8601(),
    body('catatan').optional().isString().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) throw badRequest('Input tidak valid.')
      const { balita_id, berat_badan, tinggi_badan, lingkar_kepala, tanggal_ukur, catatan } = req.body

      // ownership check on balita
      const [bRows] = await pool.execute('SELECT id, posyandu_id FROM balita WHERE id = ?', [balita_id])
      const balita = bRows[0]
      if (!balita) throw notFound()
      if (req.user.role !== 'admin_desa' && balita.posyandu_id !== req.user.posyandu_id) throw notFound()

      const id = crypto.randomUUID()
      await pool.execute(
        `INSERT INTO pengukuran (id, balita_id, posyandu_id, tanggal_ukur, berat_badan, tinggi_badan, lingkar_kepala, catatan, created_by)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [id, balita_id, balita.posyandu_id, tanggal_ukur || new Date().toISOString().slice(0, 10), berat_badan, tinggi_badan, lingkar_kepala || null, catatan || null, req.user.id]
      )
      res.status(201).json({ data: { id } })
    } catch (e) { next(e) }
  }
)

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const id = req.params.id
    let sql = 'DELETE FROM pengukuran WHERE id = ?'
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
