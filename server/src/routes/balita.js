import { Router } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import { randomUUID } from 'node:crypto'
import pool from '../config/db.js'
import { auth } from '../middleware/auth.js'
import { notFound, badRequest } from '../utils/errors.js'

const router = Router()

// GET /api/balita - List Balita dengan Filter, Pencarian, & Info Pengukuran Terbaru
router.get('/', auth, async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim()
    const posyanduFilter = req.query.posyandu_id
    const genderFilter = req.query.gender

    let sql = `
      SELECT 
        b.id, 
        b.posyandu_id, 
        b.nama, 
        b.nik, 
        DATE_FORMAT(b.tanggal_lahir, '%Y-%m-%d') AS tanggal_lahir, 
        b.jenis_kelamin, 
        b.nama_ibu, 
        b.created_at,
        p.name AS posyandu_name,
        p.desa AS posyandu_desa,
        (SELECT berat_badan FROM pengukuran WHERE balita_id = b.id ORDER BY tanggal_ukur DESC, created_at DESC LIMIT 1) AS latest_bb,
        (SELECT tinggi_badan FROM pengukuran WHERE balita_id = b.id ORDER BY tanggal_ukur DESC, created_at DESC LIMIT 1) AS latest_tb,
        DATE_FORMAT(
          (SELECT tanggal_ukur FROM pengukuran WHERE balita_id = b.id ORDER BY tanggal_ukur DESC, created_at DESC LIMIT 1),
          '%Y-%m-%d'
        ) AS latest_ukur
      FROM balita b
      LEFT JOIN posyandu p ON p.id = b.posyandu_id
    `

    const params = []
    const where = []

    // Object-level RBAC: Kader hanya dapat melihat balita di posyandunya
    if (req.user.role !== 'admin_desa') {
      where.push('b.posyandu_id = ?')
      params.push(req.user.posyandu_id)
    } else if (posyanduFilter) {
      where.push('b.posyandu_id = ?')
      params.push(posyanduFilter)
    }

    if (q) {
      where.push('(b.nama LIKE ? OR b.nik LIKE ? OR b.nama_ibu LIKE ?)')
      params.push(`%${q}%`, `%${q}%`, `%${q}%`)
    }

    if (genderFilter && ['L', 'P'].includes(genderFilter)) {
      where.push('b.jenis_kelamin = ?')
      params.push(genderFilter)
    }

    if (where.length) {
      sql += ' WHERE ' + where.join(' AND ')
    }

    sql += ' ORDER BY b.created_at DESC'

    const [rows] = await pool.execute(sql, params)
    res.json({ data: rows })
  } catch (e) {
    next(e)
  }
})

// GET /api/balita/:id - Detail 1 Balita
router.get('/:id', auth, async (req, res, next) => {
  try {
    const id = req.params.id
    const [rows] = await pool.execute(
      `SELECT 
        b.id, 
        b.posyandu_id, 
        b.nama, 
        b.nik, 
        DATE_FORMAT(b.tanggal_lahir, '%Y-%m-%d') AS tanggal_lahir, 
        b.jenis_kelamin, 
        b.nama_ibu,
        b.created_at,
        p.name AS posyandu_name,
        p.desa AS posyandu_desa
      FROM balita b
      LEFT JOIN posyandu p ON p.id = b.posyandu_id
      WHERE b.id = ?`,
      [id]
    )

    const row = rows[0]
    if (!row) throw notFound('Data balita tidak ditemukan.')
    if (req.user.role !== 'admin_desa' && row.posyandu_id !== req.user.posyandu_id) {
      throw notFound('Data balita tidak ditemukan.')
    }

    res.json({ data: row })
  } catch (e) {
    next(e)
  }
})

// POST /api/balita - Tambah Balita Baru
router.post(
  '/',
  auth,
  [
    body('nama').isString().trim().notEmpty().withMessage('Nama balita wajib diisi.'),
    body('posyandu_id').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('Posyandu tidak valid.'),
    body('nik').optional({ nullable: true, checkFalsy: true }).isLength({ min: 16, max: 16 }).withMessage('NIK harus 16 digit angka.'),
    body('tanggal_lahir').isISO8601().withMessage('Tanggal lahir harus valid (YYYY-MM-DD).'),
    body('jenis_kelamin').isIn(['L', 'P']).withMessage('Pilih jenis kelamin (L atau P).'),
    body('nama_ibu').isString().trim().notEmpty().withMessage('Nama ibu wajib diisi.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw badRequest(errors.array()[0].msg)
      }

      let posyanduId = req.body.posyandu_id
      if (req.user.role !== 'admin_desa') {
        posyanduId = req.user.posyandu_id
      }

      if (!posyanduId) {
        throw badRequest(
          req.user.role === 'admin_desa'
            ? 'Pilih Posyandu tempat balita didaftarkan.'
            : 'Akun Anda belum ditugaskan ke Posyandu manapun oleh Admin Desa.'
        )
      }

      const id = randomUUID()
      const { nama, nik, tanggal_lahir, jenis_kelamin, nama_ibu } = req.body

      await pool.execute(
        'INSERT INTO balita (id, posyandu_id, nama, nik, tanggal_lahir, jenis_kelamin, nama_ibu) VALUES (?,?,?,?,?,?,?)',
        [id, posyanduId, nama.trim(), nik?.trim() || null, tanggal_lahir, jenis_kelamin, nama_ibu.trim()]
      )

      res.status(201).json({
        ok: true,
        message: 'Data balita berhasil ditambahkan.',
        data: { id },
      })
    } catch (e) {
      next(e)
    }
  }
)

// PUT /api/balita/:id - Edit Data Balita
router.put(
  '/:id',
  auth,
  [
    param('id').isUUID(),
    body('nama').optional().isString().trim().notEmpty().withMessage('Nama tidak boleh kosong.'),
    body('posyandu_id').optional({ nullable: true, checkFalsy: true }).isUUID(),
    body('nik').optional({ nullable: true, checkFalsy: true }).isLength({ min: 16, max: 16 }).withMessage('NIK harus 16 digit angka.'),
    body('tanggal_lahir').optional().isISO8601().withMessage('Tanggal lahir tidak valid.'),
    body('jenis_kelamin').optional().isIn(['L', 'P']).withMessage('Jenis kelamin tidak valid.'),
    body('nama_ibu').optional().isString().trim().notEmpty().withMessage('Nama ibu tidak boleh kosong.'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw badRequest(errors.array()[0].msg)
      }

      const id = req.params.id
      const { nama, nik, tanggal_lahir, jenis_kelamin, nama_ibu, posyandu_id } = req.body

      // Pastikan data ada dan boleh diedit oleh role saat ini
      const [existing] = await pool.execute('SELECT id, posyandu_id FROM balita WHERE id = ?', [id])
      const row = existing[0]
      if (!row) throw notFound('Data balita tidak ditemukan.')
      if (req.user.role !== 'admin_desa' && row.posyandu_id !== req.user.posyandu_id) {
        throw notFound('Data balita tidak ditemukan.')
      }

      let newPosyandu = row.posyandu_id
      if (req.user.role === 'admin_desa' && posyandu_id) {
        newPosyandu = posyandu_id
      }

      await pool.execute(
        `UPDATE balita SET
          nama = COALESCE(?, nama),
          nik = ?,
          tanggal_lahir = COALESCE(?, tanggal_lahir),
          jenis_kelamin = COALESCE(?, jenis_kelamin),
          nama_ibu = COALESCE(?, nama_ibu),
          posyandu_id = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [
          nama ? nama.trim() : null,
          nik !== undefined ? (nik ? nik.trim() : null) : null,
          tanggal_lahir || null,
          jenis_kelamin || null,
          nama_ibu ? nama_ibu.trim() : null,
          newPosyandu,
          id,
        ]
      )

      res.json({ ok: true, message: 'Data balita berhasil diperbarui.' })
    } catch (e) {
      next(e)
    }
  }
)

// DELETE /api/balita/:id - Hapus Balita
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
    if (result.affectedRows === 0) throw notFound('Data balita tidak ditemukan.')
    res.json({ ok: true, message: 'Data balita dan riwayat pengukuran berhasil dihapus.' })
  } catch (e) {
    next(e)
  }
})

export default router
