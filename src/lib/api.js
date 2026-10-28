const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export async function api(path, options = {}) {
  const { body, headers, ...rest } = options
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    ...rest,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  let data = {}
  try { data = await res.json() } catch { /* ignore */ }
  if (!res.ok) {
    const err = new Error(data?.error || 'Terjadi kesalahan.')
    err.status = res.status
    throw err
  }
  return data
}

export function mapApiError(err) {
  const status = err?.status || 500
  if (status === 401) return { status, message: err.message || 'Sesi berakhir. Silakan login kembali.' }
  if (status === 403) return { status, message: '403 Forbidden: Anda tidak memiliki akses ke data ini.' }
  if (status === 404) return { status, message: '404 Not Found: Data tidak ditemukan.' }
  if (status === 400) return { status, message: err.message || 'Input tidak valid.' }
  return { status, message: err.message || 'Terjadi kesalahan server.' }
}
