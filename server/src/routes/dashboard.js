import { Router } from 'express'
import pool from '../config/db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/', auth, async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin_desa'
    const posFilter = isAdmin ? '' : ' WHERE posyandu_id = ?'
    const posParams = isAdmin ? [] : [req.user.posyandu_id]

    const [[{ c: balita }]] = await pool.execute(`SELECT COUNT(*) AS c FROM balita${posFilter}`, posParams)
    const [[{ c: ibuHamil }]] = await pool.execute(`SELECT COUNT(*) AS c FROM ibu_hamil${posFilter}`, posParams)

    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
    let ukurSql = 'SELECT COUNT(*) AS c FROM pengukuran WHERE tanggal_ukur BETWEEN ? AND ?'
    const ukurParams = [start, end]
    if (!isAdmin) { ukurSql += ' AND posyandu_id = ?'; ukurParams.push(req.user.posyandu_id) }
    const [[{ c: ukur }]] = await pool.execute(ukurSql, ukurParams)

    let posyanduCount = 0
    if (isAdmin) {
      const [[{ c }]] = await pool.execute('SELECT COUNT(*) AS c FROM posyandu')
      posyanduCount = c
    }

    res.json({ data: { balita, ibuHamil, ukurBulanIni: ukur, posyandu: posyanduCount } })
  } catch (e) { next(e) }
})

export default router
