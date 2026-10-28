export async function verifyTurnstile(token, remoteIp) {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY
  const isProd = process.env.NODE_ENV === 'production'

  // Jika tidak di mode production dan secret key belum diset, bypass untuk kemudahan dev lokal
  if (!isProd && !secret) {
    return { success: true }
  }

  if (!token) {
    return {
      success: false,
      message: 'Verifikasi keamanan Cloudflare Turnstile diperlukan.',
    }
  }

  try {
    const formData = new URLSearchParams()
    formData.append('secret', secret || '1x0000000000000000000000000000000AA') // Default dummy test key dari Cloudflare (always passes)
    formData.append('response', token)
    if (remoteIp) {
      formData.append('remoteip', remoteIp)
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    if (!data.success) {
      return {
        success: false,
        message: 'Validasi keamanan Cloudflare Turnstile gagal. Silakan coba lagi.',
        errors: data['error-codes'],
      }
    }
    return { success: true }
  } catch (err) {
    console.error('Error verifying Turnstile:', err)
    // Jika gagal kontak ke server Cloudflare di dev, jangan blokir
    if (!isProd) {
      return { success: true }
    }
    return { success: false, message: 'Gagal memverifikasi captcha keamanan.' }
  }
}

