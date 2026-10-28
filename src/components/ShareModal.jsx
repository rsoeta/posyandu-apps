import { useState } from 'react'
import {
  X,
  ShareNetwork,
  WhatsappLogo,
  FacebookLogo,
  Copy,
  Check,
  Link as LinkIcon,
  Globe,
} from '@phosphor-icons/react'

export default function ShareModal({ item, onClose }) {
  const [copied, setCopied] = useState(false)

  if (!item) return null

  // Buat potongan narasi singkat
  const cleanDesc = (item.deskripsi || '').replace(/\s+/g, ' ').trim()
  const excerpt = cleanDesc.length > 120 ? cleanDesc.substring(0, 117) + '...' : cleanDesc

  // Tentukan URL publik Open Graph
  // Menggunakan rute backend /kegiatan/share/:id agar bot WhatsApp/FB merender OG tags dengan sempurna
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  const shareUrl = `${apiBase}/kegiatan/share/${item.id}`
  const directAppUrl = `${window.location.origin}/kegiatan/${item.id}`

  // Format pesan untuk WhatsApp
  const waText = `*${item.judul}*\n\n📍 ${item.posyandu_name || 'Posyandu Desa'} • ${item.tanggal_kegiatan}\n\n"${excerpt}"\n\nLihat dokumentasi lengkap & foto kegiatan:\n${shareUrl}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* fallback */
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.judul,
          text: `${item.judul} - ${excerpt}`,
          url: shareUrl,
        })
      } catch {
        /* user dismissed */
      }
    } else {
      handleCopy()
    }
  }

  // URL gambar absolut
  const imageUrl = item.foto
    ? item.foto.startsWith('http')
      ? item.foto
      : `${apiBase}${item.foto}`
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-purple-50 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-purple-50 text-purple flex items-center justify-center">
              <ShareNetwork size={22} weight="bold" />
            </span>
            <div>
              <h3 className="font-heading font-bold text-gray-900 text-base">Bagikan Kegiatan</h3>
              <p className="text-gray-400 text-xs">Siap tayang di WhatsApp & media sosial</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Preview Kartu Open Graph (Seperti Tampilan di WhatsApp/FB) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Globe size={14} /> Preview Tampilan Media Sosial:
            </span>

            <div className="rounded-xl border border-purple-100 bg-gray-50 overflow-hidden shadow-xs">
              {imageUrl && (
                <div className="w-full h-44 bg-gray-900 relative overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={item.judul}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-purple/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                    Watermarked
                  </div>
                </div>
              )}

              <div className="p-3 flex flex-col gap-1 bg-white">
                <span className="text-[11px] font-medium text-purple-700 truncate">
                  posyandu.desa • {item.posyandu_name || 'Posyandu Ceria'}
                </span>
                <h4 className="font-heading font-bold text-gray-900 text-sm line-clamp-1">
                  {item.judul}
                </h4>
                <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
                  {excerpt}
                </p>
              </div>
            </div>
          </div>

          {/* Tombol Opsi Bagikan Cepat */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-500">Pilih Saluran:</span>

            <div className="grid grid-cols-2 gap-2.5">
              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-[46px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition-colors shadow-xs"
              >
                <WhatsappLogo size={20} weight="fill" /> WhatsApp
              </a>

              {/* Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-[46px] px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-colors shadow-xs"
              >
                <FacebookLogo size={20} weight="fill" /> Facebook
              </a>
            </div>

            {/* Tombol Native Share jika didukung browser mobile */}
            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={handleNativeShare}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple font-semibold text-xs transition-colors"
              >
                <ShareNetwork size={18} weight="bold" /> Bagikan via Aplikasi Lain...
              </button>
            )}
          </div>

          {/* Kolom Salin Tautan */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-100">
            <label className="text-xs font-semibold text-gray-600">
              Tautan Open Graph Publik:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 min-h-[40px] px-3 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-600 font-mono focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className={`inline-flex items-center justify-center gap-1 min-h-[40px] px-4 rounded-xl font-semibold text-xs transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-purple text-white hover:bg-purple-600'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={16} weight="bold" /> Tersalin!
                  </>
                ) : (
                  <>
                    <Copy size={16} /> Salin
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

