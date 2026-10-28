/**
 * Helper untuk normalisasi URL gambar foto kegiatan posyandu
 * Kompatibel dengan Data URL (base64), URL eksternal, dan path relatif (/uploads/...)
 */

export function getImageUrl(foto) {
  if (!foto || typeof foto !== 'string') return null

  // 1. Jika sudah berupa data base64
  if (foto.startsWith('data:image/')) {
    return foto
  }

  // 2. Jika sudah berupa URL absolut lengkap (http / https)
  if (foto.startsWith('http://') || foto.startsWith('https://')) {
    return foto
  }

  // 3. Jika path relatif (/uploads/...)
  const cleanPath = foto.startsWith('/') ? foto : `/${foto}`
  return cleanPath
}

export function getAbsoluteImageUrl(foto) {
  if (!foto || typeof foto !== 'string') return null
  if (foto.startsWith('http://') || foto.startsWith('https://')) return foto
  if (foto.startsWith('data:image/')) return foto

  const cleanPath = foto.startsWith('/') ? foto : `/${foto}`
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
  return `${origin}${cleanPath}`
}

