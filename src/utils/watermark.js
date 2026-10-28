/**
 * Utility untuk menambahkan watermark yang menarik dan elegan pada foto kegiatan Posyandu
 * menggunakan HTML5 Canvas di sisi client.
 */
export async function applyWatermark(file, options = {}) {
  const {
    posyanduName = 'Posyandu Desa',
    date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    title = '',
    location = '',
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Skala resolusi optimal untuk medsos (maksimum lebar 1280px)
        const maxWidth = 1280
        const scale = img.width > maxWidth ? maxWidth / img.width : 1
        const width = Math.round(img.width * scale)
        const height = Math.round(img.height * scale)

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        // 1. Gambar foto asli yang sudah di-resize
        ctx.drawImage(img, 0, 0, width, height)

        // 2. Overlay gradient gelap di bagian bawah untuk kontras teks watermark
        const ribbonHeight = Math.max(120, Math.round(height * 0.22))
        const gradient = ctx.createLinearGradient(0, height - ribbonHeight, 0, height)
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
        gradient.addColorStop(0.3, 'rgba(15, 10, 30, 0.4)')
        gradient.addColorStop(0.7, 'rgba(15, 10, 30, 0.82)')
        gradient.addColorStop(1, 'rgba(15, 10, 30, 0.95)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, height - ribbonHeight, width, ribbonHeight)

        // 3. Stempel Badge di pojok kanan atas: "DOKUMENTASI RESMI"
        const badgeWidth = Math.min(260, Math.round(width * 0.32))
        const badgeHeight = Math.round(badgeWidth * 0.16)
        const badgeX = width - badgeWidth - 20
        const badgeY = 20

        // Background pill stempel
        ctx.save()
        ctx.fillStyle = 'rgba(126, 34, 206, 0.85)' // Purple primary
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.lineWidth = 1.5
        roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 8)
        ctx.fill()
        ctx.stroke()

        // Teks badge
        ctx.fillStyle = '#FFFFFF'
        ctx.font = `bold ${Math.round(badgeHeight * 0.46)}px "Outfit", sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('DOKUMENTASI RESMI', badgeX + badgeWidth / 2, badgeY + badgeHeight / 2)
        ctx.restore()

        // 4. Logo & Teks Utama Watermark di Bagian Bawah
        const paddingLeft = Math.max(20, Math.round(width * 0.035))
        const bottomBase = height - 24

        // Aksen garis ungu di tepi kiri teks
        ctx.fillStyle = '#C084FC' // purple light
        ctx.fillRect(paddingLeft, bottomBase - 52, 4, 52)

        // Nama Brand Aplikasi
        ctx.fillStyle = '#FFFFFF'
        ctx.font = `bold ${Math.round(width * 0.024) + 10}px "Outfit", sans-serif`
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
        ctx.fillText('POSYANDU CERIA', paddingLeft + 14, bottomBase - 32)

        // Informasi Posyandu & Desa
        ctx.fillStyle = '#E9D5FF' // purple lighter
        ctx.font = `600 ${Math.round(width * 0.016) + 8}px "Urbanist", sans-serif`
        const posText = `${posyanduName} ${location ? `• ${location}` : ''}`
        ctx.fillText(posText, paddingLeft + 14, bottomBase - 12)

        // 5. Tanggal Kegiatan di Kanan Bawah
        ctx.fillStyle = '#F3E8FF'
        ctx.font = `500 ${Math.round(width * 0.014) + 7}px "Urbanist", sans-serif`
        ctx.textAlign = 'right'
        ctx.fillText(`📅 ${date}`, width - paddingLeft, bottomBase - 12)

        // Ekspor ke WebP / JPEG base64 (kualitas 85%)
        const resultDataUrl = canvas.toDataURL('image/jpeg', 0.85)
        resolve(resultDataUrl)
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

