import jwt from 'jsonwebtoken'
import { unauthorized } from '../utils/errors.js'

export function auth(req, res, next) {
  try {
    let token = null
    if (req.cookies?.token) token = req.cookies.token
    else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7)
    }
    if (!token) throw unauthorized('Token tidak ditemukan.')
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.sub, role: payload.role, posyandu_id: payload.posyandu_id }
    next()
  } catch (e) {
    next(e.status ? e : unauthorized('Token tidak valid atau kedaluwarsa.'))
  }
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin_desa') return next(unauthorized('Hanya Admin Desa.'))
  next()
}
