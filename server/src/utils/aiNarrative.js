/**
 * Generator Narasi Kegiatan Posyandu berbasis Kecerdasan Buatan (Google Gemini)
 * dengan Fallback Smart Heuristic jika API Key belum dikonfigurasi.
 */

export async function generateAiNarrative(data = {}) {
  const {
    judul = 'Kegiatan Posyandu',
    tanggal_kegiatan = new Date().toISOString().split('T')[0],
    lokasi = '',
    posyanduName = 'Posyandu Desa',
    poin_singkat = '',
    gaya = 'hangat', // 'hangat' | 'resmi' | 'ringkas'
  } = data

  const apiKey = process.env.GEMINI_API_KEY

  // 1. Jika ada GEMINI_API_KEY, gunakan Google Gemini 1.5 Flash
  if (apiKey) {
    try {
      const formattedDate = new Date(tanggal_kegiatan).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })

      const prompt = `Anda adalah seorang asisten AI penulis dokumentasi kegiatan Posyandu Desa yang sangat berpengalaman, hangat, dan komunikatif.

Tugas Anda: Buatlah narasi / deskripsi dokumentasi kegiatan Posyandu dalam Bahasa Indonesia yang siap dibagikan ke masyarakat dan grup warga.

Konteks Kegiatan:
- Judul Kegiatan: ${judul}
- Unit Posyandu: ${posyanduName}
- Waktu Pelaksanaan: ${formattedDate}
- Lokasi: ${lokasi || 'Posyandu setempat'}
- Catatan / Poin Khusus dari Kader: ${poin_singkat || 'Kegiatan rutin berjalan tertib dan lancar'}
- Gaya Bahasa: ${gaya === 'resmi' ? 'Formal, terstruktur rapi untuk laporan dinas/desa' : gaya === 'ringkas' ? 'Ringkas, padat 1-2 paragraf untuk postingan cepat' : 'Hangat, ramah, penuh semangat, dan edukatif untuk warga dan media sosial'}

Panduan Penulisan:
1. Paragraf 1: Menceritakan pembukaan kegiatan, antusiasme ibu dan balita yang hadir, serta suasana posyandu.
2. Paragraf 2: Rincian aktivitas yang dilakukan (penimbangan, pengukuran tinggi badan, imunisasi, penyuluhan, atau PMT) sesuai judul dan catatan khusus kader.
3. Paragraf 3: Pesan edukasi kesehatan balita, pencegahan stunting, serta apresiasi dan ajakan kepada para orang tua untuk terus rajin ke Posyandu.
4. Jangan menambahkan tanda petik pembuka/penutup dan jangan menuliskan judul di baris pertama teks.`

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 600,
            },
          }),
        }
      )

      const result = await response.json()
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text
      if (text && text.trim()) {
        return {
          ok: true,
          narasi: text.trim(),
          source: 'Google Gemini AI',
        }
      }
    } catch (err) {
      console.warn('Panggilan Gemini API gagal, beralih ke Smart Heuristic:', err.message)
    }
  }

  // 2. Smart Heuristic Engine (Fallback cerdas instan tanpa ketergantungan kuota / koneksi luar)
  const fallbackText = buildSmartNarrative({
    judul,
    tanggal_kegiatan,
    lokasi,
    posyanduName,
    poin_singkat,
    gaya,
  })

  return {
    ok: true,
    narasi: fallbackText,
    source: 'Smart AI Assistant (Lokal)',
  }
}

/**
 * Heuristic generator berbasis deteksi kata kunci dan konteks Posyandu
 */
function buildSmartNarrative({ judul, tanggal_kegiatan, lokasi, posyanduName, poin_singkat, gaya }) {
  const d = new Date(tanggal_kegiatan)
  const dateFormatted = d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const locText = lokasi ? `bertempat di ${lokasi}` : 'bertempat di pos pelayanan posyandu'
  const jLower = judul.toLowerCase()

  // Deteksi tema kegiatan
  const isVitamin = jLower.includes('vitamin')
  const isImunisasi = jLower.includes('imunisasi') || jLower.includes('vaksin')
  const isUkur = jLower.includes('timbang') || jLower.includes('ukur') || jLower.includes('berat')
  const isStunting = jLower.includes('stunting') || jLower.includes('gizi')
  const isIbuHamil = jLower.includes('ibu hamil') || jLower.includes('bumil')
  const isPMT = jLower.includes('pmt') || jLower.includes('makanan') || jLower.includes('kudapan')

  // Bagian 1: Pembuka
  let p1 = ''
  if (gaya === 'resmi') {
    p1 = `Pada hari ${dateFormatted}, telah diselenggarakan kegiatan "${judul}" oleh ${posyanduName} yang ${locText}. Acara ini dihadiri oleh para kader, tenaga kesehatan desa, serta masyarakat dengan tingkat kehadiran dan partisipasi yang baik.`
  } else if (gaya === 'ringkas') {
    p1 = `Alhamdulillah, kegiatan "${judul}" telah sukses dilaksanakan oleh ${posyanduName} pada ${dateFormatted} ${locText}.`
  } else {
    p1 = `Suasana ceria dan penuh antusiasme mewarnai pelaksanaan kegiatan "${judul}" di ${posyanduName} pada hari ${dateFormatted}. Sejak pagi hari, para orang tua bersama buah hati telah berkumpul ${locText} dengan penuh semangat untuk memeriksakan kesehatan dan tumbuh kembang anak.`
  }

  // Bagian 2: Inti Aktivitas
  let p2 = ''
  if (isVitamin && isImunisasi) {
    p2 = `Rangkaian kegiatan difokuskan pada pemberian suplementasi Vitamin A dosis tinggi dan imunisasi lengkap untuk meningkatkan daya tahan tubuh balita terhadap infeksi. Kader bersama petugas medis dengan teliti mencatat riwayat buku KIA serta memastikan setiap anak menerima kapsul vitamin dan dosis vaksin yang tepat.`
  } else if (isVitamin) {
    p2 = `Pada pertemuan kali ini, fokus utama adalah pembagian suplementasi kapsul Vitamin A untuk mendukung kesehatan mata, memperkuat imunitas tubuh, dan mempercepat pemulihan balita dari berbagai penyakit musiman.`
  } else if (isImunisasi) {
    p2 = `Petugas kesehatan desa bersama kader melakukan pemberian imunisasi wajib sesuai tahapan usia balita, serta memberikan konseling kepada para ibu mengenai pentingnya kelengkapan imunisasi dasar sebagai perlindungan utama bagi tumbuh kembang anak.`
  } else if (isIbuHamil) {
    p2 = `Agenda utama berpusat pada pemeriksaan kesehatan ibu hamil, pemantauan asupan nutrisi mikronutrien, pengukuran lingkar lengan atas (LILA), serta sharing edukasi persiapan persalinan yang aman dan sehat.`
  } else if (isPMT || isStunting) {
    p2 = `Selain pemantauan rutin pertumbuhan berat dan tinggi badan, kader menyajikan Pemberian Makanan Tambahan (PMT) bergizi seimbang berbahan pangan lokal, disertai demonstrasi porsi makan bergizi untuk pencegahan stunting pada usia emas pertumbuhan.`
  } else {
    p2 = `Pelaksanaan kegiatan mencakup penimbangan berat badan secara berkala, pengukuran tinggi/panjang badan, pemantauan lingkar kepala balita, serta evaluasi grafik pertumbuhan pada grafik KMS untuk mendeteksi dini indikasi gangguan pertumbuhan.`
  }

  // Sisipkan poin khusus dari kader jika ada
  if (poin_singkat && poin_singkat.trim()) {
    p2 += ` Secara khusus, ${poin_singkat.trim()}.`
  }

  // Bagian 3: Penutup & Ajakan
  let p3 = ''
  if (gaya === 'resmi') {
    p3 = `Diharapkan melalui kegiatan ini, pemantauan status kesehatan balita di wilayah kerja ${posyanduName} dapat terjaga secara berkesinambungan demi mewujudkan generasi desa yang sehat, cerdas, dan bebas stunting.`
  } else if (gaya === 'ringkas') {
    p3 = `Terima kasih atas partisipasi aktif seluruh warga. Mari bersama-sama wujudkan balita sehat bebas stunting!`
  } else {
    p3 = `Kader ${posyanduName} mengucapkan terima kasih yang sebesar-besarnya kepada seluruh warga dan para ibu yang senantiasa meluangkan waktu hadir. Mari bersama-sama kita jaga tumbuh kembang putra-putri tercinta karena generasi emas dimulai dari keluarga yang peduli gizi dan kesehatan!`
  }

  if (gaya === 'ringkas') {
    return `${p1} ${p2} ${p3}`
  }

  return `${p1}\n\n${p2}\n\n${p3}`
}

