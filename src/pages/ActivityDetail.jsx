import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarBlank,
  MapPin,
  Buildings,
  ShareNetwork,
  PencilSimple,
  Trash,
  User,
  Baby,
} from '@phosphor-icons/react'
import { api, mapApiError } from '../lib/api'
import { showError, showSuccess, showConfirm } from '../utils/swal'
import { useAuth } from '../contexts/AuthContext'
import ShareModal from '../components/ShareModal'

export default function ActivityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000'

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        // Gunakan endpoint publik agar bisa diakses oleh masyarakat umum tanpa harus login
        const res = await api(`/api/kegiatan/public/${id}`)
        if (!mounted) return
        setItem(res.data)

        // Update title dokumen dinamis
        if (res.data?.judul) {
          document.title = `${res.data.judul} - Posyandu Ceria`
        }
      } catch (err) {
        const mapped = mapApiError(err)
        if (mapped.status === 404) setNotFound(true)
        else showError('Gagal Memuat', mapped.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [id])

  const handleDelete = async () => {
    const confirm = await showConfirm(
      'Hapus Kegiatan?',
      `Apakah Anda yakin ingin menghapus dokumentasi "${item.judul}"?`
    )
    if (!confirm.isConfirmed) return

    try {
      await api(`/api/kegiatan/${id}`, { method: 'DELETE' })
      await showSuccess('Terhapus', 'Dokumentasi kegiatan berhasil dihapus.')
      navigate('/kegiatan', { replace: true })
    } catch (err) {
      const mapped = mapApiError(err)
      showError('Gagal Menghapus', mapped.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !item) {
    return (
      <section className="flex flex-col gap-4 py-8">
        <Link
          to="/kegiatan"
          className="inline-flex items-center gap-2 text-purple font-semibold text-sm"
        >
          <ArrowLeft size={18} weight="bold" /> Kembali ke Daftar Kegiatan
        </Link>
        <div className="bg-white rounded-2xl p-8 text-center border border-purple-50">
          <p className="text-gray-500 font-medium">Dokumentasi kegiatan tidak ditemukan.</p>
        </div>
      </section>
    )
  }

  const imageUrl = item.foto
    ? item.foto.startsWith('http')
      ? item.foto
      : `${apiBase}${item.foto}`
    : null

  const canManage = Boolean(user && (isAdmin || user.posyandu_id === item.posyandu_id))

  return (
    <section className="flex flex-col gap-5 max-w-3xl mx-auto pb-8">
      {/* Bar Navigasi Atas */}
      <div className="flex items-center justify-between">
        <Link
          to="/kegiatan"
          className="inline-flex items-center gap-2 text-purple hover:text-purple-700 font-semibold text-sm min-h-[40px]"
        >
          <ArrowLeft size={18} weight="bold" /> Kembali ke Daftar Kegiatan
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple text-white hover:bg-purple-600 text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
          >
            <ShareNetwork size={16} weight="bold" /> Bagikan
          </button>

          {canManage && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
              title="Hapus Kegiatan"
            >
              <Trash size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Konten Utama */}
      <article className="bg-white rounded-2xl shadow-sm border border-purple-50 overflow-hidden flex flex-col">
        {/* Foto Dokumentasi Ber-watermark */}
        {imageUrl && (
          <div className="w-full bg-black max-h-[500px] flex items-center justify-center overflow-hidden relative">
            <img
              src={imageUrl}
              alt={item.judul}
              className="w-full h-full object-contain max-h-[500px]"
            />
          </div>
        )}

        <div className="p-5 sm:p-7 flex flex-col gap-4">
          {/* Metadata Kegiatan */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple font-semibold px-2.5 py-1 rounded-lg">
              <Buildings size={14} />
              {item.posyandu_name || 'Posyandu'}
            </span>

            <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-100">
              <CalendarBlank size={14} />
              {new Date(item.tanggal_kegiatan).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>

            {item.lokasi && (
              <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-100">
                <MapPin size={14} />
                {item.lokasi}
              </span>
            )}
          </div>

          {/* Judul Kegiatan */}
          <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-gray-900 leading-snug">
            {item.judul}
          </h1>

          {/* Narasi / Deskripsi Lengkap */}
          <div className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-line pt-2 border-t border-gray-100">
            {item.deskripsi}
          </div>

          {/* Footer Info Pembuat & Ajakan Bagikan */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-5 border-t border-gray-100 mt-3 text-xs text-gray-400">
            <span>
              Didokumentasikan oleh:{' '}
              <strong className="text-gray-600 font-medium">
                {item.creator_name || 'Kader Posyandu'}
              </strong>
            </span>

            <button
              onClick={() => setShareOpen(true)}
              className="inline-flex items-center gap-1.5 text-purple font-semibold hover:underline"
            >
              <ShareNetwork size={16} /> Bagikan kegiatan ini ke WhatsApp & Medsos
            </button>
          </div>
        </div>
      </article>

      {/* Modal Share */}
      {shareOpen && <ShareModal item={item} onClose={() => setShareOpen(false)} />}
    </section>
  )
}

