export function errorHandler(err, req, res, _next) {
  const status = err.status || 500
  const message = status >= 500 ? 'Terjadi kesalahan server.' : err.message
  if (status >= 500) console.error(err)
  res.status(status).json({ error: message, status })
}
