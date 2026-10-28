import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pool from '../config/db.js'
import { auth } from '../middleware/auth.js'
import { notFound, badRequest } from '../utils/errors.js'
import { generateAiNarrative } from '../utils/aiNarrative.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '../../public/uploads')

const router = Router()

// Helper simpan base64 ke file di /uploads
async function saveBase64Image(base64String) {
  if (!base64String || typeof base64String !== 'string') return null
  if (!base64String.startsWith('data:image/')) {
    return base64String // diasumsikan sudah berupa path/url
  }

  const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
  if (!matches || matches.length !== 3) return null

  const mimeType = matches[1]
  let ext = 'jpg'
  if (mimeType.includes('png')) ext = 'png'
  else if (mimeType.includes('webp')) ext = 'webp'

  const buffer = Buffer.from(matches[2], 'base64')
  const filename = `kegiatan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`
  const destPath = path.join(uploadsDir, filename)

  await fs.mkdir(uploadsDir, { recursive: true })
  await fs.writeFile(destPath, buffer)
  return `/uploads/${filename}`
}

// POST /api/kegiatan/generate-narasi - Generator AI Narasi Kegiatan
router.post('/generate-narasi', auth, async (req, res, next) => {
  try {
    const { judul, tanggal_kegiatan, lokasi, posyandu_id, poin_singkat, gaya } = req.body
    if (!judul || !judul.trim()) {
      throw badRequest('Judul kegiatan wajib diisi terlebih dahulu untuk menyusun narasi.')
    }

    let posyanduName = 'Posyandu Desa'
    let pId = posyandu_id || req.user.posyandu_id
    if (pId) {
      const [pos] = await pool.execute('SELECT name, desa FROM posyandu WHERE id = ?', [pId])
      if (pos[0]) {
        posyanduName = `${pos[0].name} (Desa ${pos[0].desa || 'Pasirlangu'})`
      }
    }

    const result = await generateAiNarrative({
      judul: judul.trim(),
      tanggal_kegiatan,
      lokasi: lokasi ? lokasi.trim() : '',
      posyanduName,
      poin_singkat: poin_singkat ? poin_singkat.trim() : '',
      gaya: gaya || 'hangat',
    })

    res.json(result)
  } catch (e) {
    next(e)
  }
})

// GET /api/kegiatan/public/:id - Detail publik (tanpa login) untuk dibagikan ke masyarakat
router.get('/public/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const [rows] = await pool.execute(
      `SELECT 
        k.id, 
        k.posyandu_id, 
        k.judul, 
        k.deskripsi, 
        k.foto, 
        DATE_FORMAT(k.tanggal_kegiatan, '%Y-%m-%d') AS tanggal_kegiatan, 
        k.lokasi, 
        k.created_at,
        p.name AS posyandu_name,
        p.desa AS posyandu_desa,
        u.full_name AS creator_name
      FROM kegiatan k
      LEFT JOIN posyandu p ON p.id = k.posyandu_id
      LEFT JOIN users u ON u.id = k.created_by
      WHERE k.id = ?`,
      [id]
    )

    const row = rows[0]
    if (!row) throw notFound('Kegiatan tidak ditemukan.')
    res.json({ data: row })
  } catch (e) {
    next(e)
  }
})

// GET /api/kegiatan - List kegiatan (internal auth)
router.get('/', auth, async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim()
    const posyanduFilter = req.query.posyandu_id

    let sql = `
      SELECT 
        k.id, 
        k.posyandu_id, 
        k.judul, 
        k.deskripsi, 
        k.foto, 
        DATE_FORMAT(k.tanggal_kegiatan, '%Y-%m-%d') AS tanggal_kegiatan, 
        k.lokasi, 
        k.created_at,
        p.name AS posyandu_name,
        p.desa AS posyandu_desa,
        u.full_name AS creator_name
      FROM kegiatan k
      LEFT JOIN posyandu p ON p.id = k.posyandu_id
      LEFT JOIN users u ON u.id = k.created_by
    `

    const params = []
    const where = []

    if (req.user.role !== 'admin_desa') {
      where.push('k.posyandu_id = ?')
      params.push(req.user.posyandu_id)
    } else if (posyanduFilter) {
      where.push('k.posyandu_id = ?')
      params.push(posyanduFilter)
    }

    if (q) {
      where.push('(k.judul LIKE ? OR k.deskripsi LIKE ? OR k.lokasi LIKE ?)')
      params.push(`%${q}%`, `%${q}%`, `%${q}%`)
    }

    if (where.length) {
      sql += ' WHERE ' + where.join(' AND ')
    }

    sql += ' ORDER BY k.tanggal_kegiatan DESC, k.created_at DESC'

    const [rows] = await pool.execute(sql, params)
    res.json({ data: rows })
  } catch (e) {
    next(e)
  }
})

// GET /api/kegiatan/:id - Detail 1 kegiatan
router.get('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params
    const [rows] = await pool.execute(
      `SELECT 
        k.id, 
        k.posyandu_id, 
        k.judul, 
        k.deskripsi, 
        k.foto, 
        DATE_FORMAT(k.tanggal_kegiatan, '%Y-%m-%d') AS tanggal_kegiatan, 
        k.lokasi, 
        k.created_at,
        p.name AS posyandu_name,
        p.desa AS posyandu_desa,
        u.full_name AS creator_name
      FROM kegiatan k
      LEFT JOIN posyandu p ON p.id = k.posyandu_id
      LEFT JOIN users u ON u.id = k.created_by
      WHERE k.id = ?`,
      [id]
    )

    const row = rows[0]
    if (!row) throw notFound('Kegiatan tidak ditemukan.')
    if (req.user.role !== 'admin_desa' && row.posyandu_id !== req.user.posyandu_id) {
      throw notFound('Kegiatan tidak ditemukan.')
    }

    res.json({ data: row })
  } catch (e) {
    next(e)
  }
})

// POST /api/kegiatan - Tambah kegiatan baru
router.post(
  '/',
  auth,
  [
    body('judul').isString().trim().notEmpty().withMessage('Judul kegiatan wajib diisi.'),
    body('deskripsi').isString().trim().notEmpty().withMessage('Deskripsi kegiatan wajib diisi.'),
    body('tanggal_kegiatan').isISO8601().withMessage('Tanggal kegiatan tidak valid.'),
    body('lokasi').optional().isString().trim(),
    body('posyandu_id').optional({ nullable: true, checkFalsy: true }).isUUID(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) throw badRequest(errors.array()[0].msg)

      let posyanduId = req.body.posyandu_id
      if (req.user.role !== 'admin_desa') {
        posyanduId = req.user.posyandu_id
      }
      if (!posyanduId) {
        throw badRequest(
          req.user.role === 'admin_desa'
            ? 'Pilih unit posyandu penyelenggara.'
            : 'Akun Anda belum ditugaskan ke unit posyandu.'
        )
      }

      const { judul, deskripsi, tanggal_kegiatan, lokasi, foto } = req.body

      let fotoPath = null
      if (foto) {
        fotoPath = await saveBase64Image(foto)
      }

      const id = randomUUID()
      await pool.execute(
        `INSERT INTO kegiatan (id, posyandu_id, judul, deskripsi, foto, tanggal_kegiatan, lokasi, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          posyanduId,
          judul.trim(),
          deskripsi.trim(),
          fotoPath,
          tanggal_kegiatan,
          lokasi?.trim() || null,
          req.user.id,
        ]
      )

      res.status(201).json({
        ok: true,
        message: 'Kegiatan berhasil didokumentasikan.',
        data: { id, foto: fotoPath },
      })
    } catch (e) {
      next(e)
    }
  }
)

// PUT /api/kegiatan/:id - Update kegiatan
router.put(
  '/:id',
  auth,
  [
    param('id').isUUID(),
    body('judul').optional().isString().trim().notEmpty(),
    body('deskripsi').optional().isString().trim().notEmpty(),
    body('tanggal_kegiatan').optional().isISO8601(),
    body('lokasi').optional().isString().trim(),
    body('posyandu_id').optional({ nullable: true, checkFalsy: true }).isUUID(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) throw badRequest(errors.array()[0].msg)

      const { id } = req.params
      const [existing] = await pool.execute('SELECT id, posyandu_id, foto FROM kegiatan WHERE id = ?', [id])
      const row = existing[0]
      if (!row) throw notFound('Kegiatan tidak ditemukan.')
      if (req.user.role !== 'admin_desa' && row.posyandu_id !== req.user.posyandu_id) {
        throw notFound('Kegiatan tidak ditemukan.')
      }

      const { judul, deskripsi, tanggal_kegiatan, lokasi, posyandu_id, foto } = req.body

      let fotoPath = row.foto
      if (foto && foto.startsWith('data:image/')) {
        fotoPath = await saveBase64Image(foto)
      }

      let newPosyandu = row.posyandu_id
      if (req.user.role === 'admin_desa' && posyandu_id) {
        newPosyandu = posyandu_id
      }

      await pool.execute(
        `UPDATE kegiatan SET
          judul = COALESCE(?, judul),
          deskripsi = COALESCE(?, deskripsi),
          tanggal_kegiatan = COALESCE(?, tanggal_kegiatan),
          lokasi = ?,
          foto = ?,
          posyandu_id = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [
          judul ? judul.trim() : null,
          deskripsi ? deskripsi.trim() : null,
          tanggal_kegiatan || null,
          lokasi !== undefined ? (lokasi ? lokasi.trim() : null) : null,
          fotoPath,
          newPosyandu,
          id,
        ]
      )

      res.json({ ok: true, message: 'Kegiatan berhasil diperbarui.' })
    } catch (e) {
      next(e)
    }
  }
)

// DELETE /api/kegiatan/:id - Hapus kegiatan
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params
    const [existing] = await pool.execute('SELECT id, posyandu_id, foto FROM kegiatan WHERE id = ?', [id])
    const row = existing[0]
    if (!row) throw notFound('Kegiatan tidak ditemukan.')
    if (req.user.role !== 'admin_desa' && row.posyandu_id !== req.user.posyandu_id) {
      throw notFound('Kegiatan tidak ditemukan.')
    }

    await pool.execute('DELETE FROM kegiatan WHERE id = ?', [id])

    // Bersihkan file foto dari uploads jika lokal
    if (row.foto && row.foto.startsWith('/uploads/')) {
      const filename = path.basename(row.foto)
      const filepath = path.join(uploadsDir, filename)
      fs.unlink(filepath).catch(() => {})
    }

    res.json({ ok: true, message: 'Kegiatan berhasil dihapus.' })
  } catch (e) {
    next(e)
  }
})

// RUTE PUBLIC OPEN GRAPH UNTUK MEDIA SOSIAL (WhatsApp, FB, Telegram, Twitterbot)
// GET /kegiatan/share/:id
router.get('/share/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await pool.execute(
      `SELECT 
        k.id, 
        k.judul, 
        k.deskripsi, 
        k.foto, 
        DATE_FORMAT(k.tanggal_kegiatan, '%d %M %Y') AS tanggal_formatted,
        k.lokasi, 
        p.name AS posyandu_name,
        p.desa AS posyandu_desa
      FROM kegiatan k
      LEFT JOIN posyandu p ON p.id = k.posyandu_id
      WHERE k.id = ?`,
      [id]
    )

    const item = rows[0]
    if (!item) {
      return res.status(404).send('<h1>404 - Dokumentasi Kegiatan Tidak Ditemukan</h1>')
    }

    // Buat potongan narasi singkat untuk og:description (maks 150 karakter)
    const rawDesc = item.deskripsi.replace(/(\r\n|\n|\r)/gm, ' ')
    const excerpt = rawDesc.length > 150 ? rawDesc.substring(0, 147) + '...' : rawDesc

    // Tentukan URL absolut gambar & halaman publik untuk media sosial (WhatsApp, FB, Telegram)
    const rawFwdHost = req.headers['x-forwarded-host']
    let host = rawFwdHost ? rawFwdHost.split(',')[0].trim() : req.get('host') || 'localhost:5173'

    // Jika host masih localhost:4000 (port internal Express), periksa origin atau referer publik
    if (host.includes(':4000') || host.includes('127.0.0.1')) {
      if (req.headers['origin']) {
        try { host = new URL(req.headers['origin']).host } catch {}
      } else if (req.headers['referer']) {
        try { host = new URL(req.headers['referer']).host } catch {}
      }
    }

    const isHttps =
      req.secure ||
      req.headers['x-forwarded-proto'] === 'https' ||
      host.includes('trycloudflare.com') ||
      process.env.NODE_ENV === 'production'
    const protocol = isHttps ? 'https' : 'http'
    const baseUrl = `${protocol}://${host}`

    const imageUrl = item.foto
      ? (item.foto.startsWith('http')
          ? item.foto
          : `${baseUrl}${item.foto.startsWith('/') ? item.foto : `/${item.foto}`}`)
      : `${baseUrl}/favicon.svg`

    const imgExt = (imageUrl.split('.').pop() || '').toLowerCase()
    const mimeType = imgExt === 'png' ? 'image/png' : imgExt === 'webp' ? 'image/webp' : 'image/jpeg'

    const pageUrl = `${baseUrl}/kegiatan/share/${item.id}`
    const clientAppUrl = `${baseUrl}/kegiatan/${item.id}`

    // Render HTML dengan lengkap Open Graph & Twitter Card meta tags
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(item.judul)} - Posyandu Ceria</title>
  <meta name="description" content="${escapeHtml(excerpt)}" />

  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Posyandu Ceria ${escapeHtml(item.posyandu_name || 'Desa')}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:title" content="${escapeHtml(item.judul)}" />
  <meta property="og:description" content="${escapeHtml(excerpt)}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:secure_url" content="${imageUrl}" />
  <meta property="og:image:type" content="${mimeType}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeHtml(item.judul)}" />

  <!-- Fallback untuk WhatsApp & Telegram Scraper -->
  <link rel="image_src" href="${imageUrl}" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${pageUrl}" />
  <meta name="twitter:title" content="${escapeHtml(item.judul)}" />
  <meta name="twitter:description" content="${escapeHtml(excerpt)}" />
  <meta name="twitter:image" content="${imageUrl}" />

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #FAF5FF; color: #1F2937; padding: 20px; display: flex; justify-content: center; }
    .card { background: white; max-width: 640px; width: 100%; border-radius: 20px; box-shadow: 0 4px 20px rgba(147, 51, 234, 0.08); overflow: hidden; border: 1px solid #F3E8FF; }
    .img-container { width: 100%; max-height: 400px; background: #000; overflow: hidden; position: relative; }
    .img-container img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .content { padding: 24px; }
    .badge { display: inline-block; background: #F3E8FF; color: #7E22CE; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; margin-bottom: 12px; }
    h1 { font-size: 22px; line-height: 1.3; font-weight: 800; color: #111827; margin-bottom: 8px; }
    .meta { font-size: 13px; color: #6B7280; margin-bottom: 16px; border-bottom: 1px solid #F3F4F6; padding-bottom: 12px; }
    .desc { font-size: 15px; line-height: 1.6; color: #374151; white-space: pre-wrap; margin-bottom: 24px; }
    .btn { display: inline-flex; align-items: center; justify-content: center; width: 100%; padding: 14px; background: #9333EA; color: white; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 15px; }
  </style>
</head>
<body>
  <div class="card">
    ${item.foto ? `<div class="img-container"><img src="${imageUrl}" alt="${escapeHtml(item.judul)}" /></div>` : ''}
    <div class="content">
      <span class="badge">DOKUMENTASI KEGIATAN POSYANDU</span>
      <h1>${escapeHtml(item.judul)}</h1>
      <div class="meta">
        <strong>${escapeHtml(item.posyandu_name || 'Posyandu Desa')}</strong> • ${escapeHtml(item.tanggal_formatted)} ${item.lokasi ? `• Lokasi: ${escapeHtml(item.lokasi)}` : ''}
      </div>
      <div class="desc">${escapeHtml(item.deskripsi)}</div>
      <a href="${clientAppUrl}" class="btn">Buka di Aplikasi Posyandu Ceria &rarr;</a>
    </div>
  </div>
</body>
</html>`

    res.send(html)
  } catch (err) {
    console.error('Error rendering share page:', err)
    res.status(500).send('Terjadi kesalahan.')
  }
})

function escapeHtml(string) {
  if (!string) return ''
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export default router

