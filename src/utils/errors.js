// Map Supabase/PostgREST errors to generic, non-leaky messages.
export function handleSupabaseError(err, fallback = 'Terjadi kesalahan. Silakan coba lagi.') {
  if (!err) return { status: 500, message: fallback }

  const code = err.code || err.status || err.statusCode
  const msg = (err.message || '').toLowerCase()

  // RLS / permission denied
  if (code === '42501' || msg.includes('permission denied') || msg.includes('row-level security')) {
    return { status: 403, message: '403 Forbidden: Anda tidak memiliki akses ke data ini.' }
  }
  // Not found (single row missing due to RLS or not exists)
  if (code === 'PGRST116' || msg.includes('no rows') || msg.includes('json object requested')) {
    return { status: 404, message: '404 Not Found: Data tidak ditemukan.' }
  }
  // Auth errors
  if (code === 'invalid_credentials' || msg.includes('invalid login')) {
    return { status: 401, message: 'Email atau password salah.' }
  }
  if (msg.includes('jwt') || msg.includes('session')) {
    return { status: 401, message: 'Sesi berakhir. Silakan login kembali.' }
  }

  return { status: code || 500, message: fallback }
}

export async function safe(call) {
  try {
    const res = await call()
    if (res?.error) {
      const mapped = handleSupabaseError(res.error)
      return { data: null, error: mapped }
    }
    return { data: res?.data ?? res, error: null }
  } catch (e) {
    return { data: null, error: handleSupabaseError(e) }
  }
}
