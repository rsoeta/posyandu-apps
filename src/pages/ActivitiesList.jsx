import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Camera,
  Plus,
  MagnifyingGlass,
  CalendarBlank,
  MapPin,
  Buildings,
  ShareNetwork,
  PencilSimple,
  Trash,
  X,
  Image as ImageIcon,
  Sparkle,
  ArrowRight,
} from '@phosphor-icons/react'
import { api, mapApiError } from '../lib/api'
import { showError, showSuccess, showConfirm } from '../utils/swal'
import { useAuth } from '../contexts/AuthContext'
import { applyWatermark } from '../utils/watermark'
import { getImageUrl } from '../utils/imageUrl'
import ShareModal from '../components/ShareModal'

export default function ActivitiesList() {
  const { isAdmin, posyanduId: authPosyanduId, posyanduName: authPosyanduName } = useAuth()
  const [activities, setActivities] = useState([])
  const [posyanduList, setPosyanduList] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [posyanduFilter, setPosyanduFilter] = useState('')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [watermarking, setWatermarking] = useState(false)
  const [shareItem, setShareItem] = useState(null)

  // AI Generator State
  const [generatingAi, setGeneratingAi] = useState(false)
  const [aiPoin, setAiPoin] = useState('')
  const [aiGaya, setAiGaya] = useState('hangat')
  const [aiSource, setAiSource] = useState('')

  // Form State
  const [form, setForm] = useState({
    judul: '',
    deskripsi: '',
    tanggal_kegiatan: new Date().toISOString().split('T')[0],
    lokasi: '',
    posyandu_id: '',
    foto: '', // base64 or url
  })

  const apiBase =
    import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== ''
      ? import.meta.env.VITE_API_URL
      : typeof window !== 'undefined'
      ? window.location.origin
      : ''

  const loadData = async () => {
    setLoading(true)
    try {
      const [resKegiatan, resPos] = await Promise.all([
        api('/api/kegiatan'),
        api('/api/posyandu/public-list'),
      ])
      setActivities(resKegiatan.data || [])
      setPosyanduList(resPos.data || [])
    } catch (e) {
      const mapped = mapApiError(e)
      showError('Gagal Memuat Kegiatan', mapped.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Buka Modal Tambah
  const handleOpenAdd = () => {
    setEditingItem(null)
    setForm({
      judul: '',
      deskripsi: '',
      tanggal_kegiatan: new Date().toISOString().split('T')[0],
      lokasi: '',
      posyandu_id: authPosyanduId || (posyanduList[0]?.id || ''),
      foto: '',
    })
    setModalOpen(true)
  }

  // Buka Modal Edit
  const handleOpenEdit = (item, e) => {
    e?.stopPropagation()
    e?.preventDefault()
    setEditingItem(item)
    setForm({
      judul: item.judul || '',
      deskripsi: item.deskripsi || '',
      tanggal_kegiatan: item.tanggal_kegiatan || new Date().toISOString().split('T')[0],
      lokasi: item.lokasi || '',
      posyandu_id: item.posyandu_id || '',
      foto: item.foto || '',
    })
    setModalOpen(true)
  }

  // Handler Upload Foto dengan Watermark Otomatis
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Dapatkan nama posyandu untuk watermark
    let posName = authPosyanduName || 'Posyandu Desa'
    if (form.posyandu_id) {
      const found = posyanduList.find((p) => p.id === form.posyandu_id)
      if (found) posName = `${found.name} • Desa ${found.desa || 'Pasirlangu'}`
    }

    setWatermarking(true)
    try {
      // Terapkan watermark secara live di canvas client
      const watermarkedBase64 = await applyWatermark(file, {
        posyanduName: posName,
        date: new Date(form.tanggal_kegiatan || Date.now()).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        title: form.judul,
        location: form.lokasi,
      })

      setForm((prev) => ({ ...prev, foto: watermarkedBase64 }))
    } catch (err) {
      console.error('Error watermarking:', err)
      showError('Gagal Memproses Foto', 'Terjadi kesalahan saat memproses watermark foto.')
    } finally {
      setWatermarking(false)
    }
  }

  // Handler Generate Narasi Menggunakan AI
  const handleGenerateAi = async () => {
    if (!form.judul.trim()) {
      showError('Judul Diperlukan', 'Harap isi kolom Judul Kegiatan terlebih dahulu agar AI memahami konteks kegiatan yang akan dituliskan.')
      return
    }

    setGeneratingAi(true)
    try {
      const res = await api('/api/kegiatan/generate-narasi', {
        method: 'POST',
        body: {
          judul: form.judul.trim(),
          tanggal_kegiatan: form.tanggal_kegiatan,
          lokasi: form.lokasi ? form.lokasi.trim() : '',
          posyandu_id: form.posyandu_id || authPosyanduId || undefined,
          poin_singkat: aiPoin.trim(),
          gaya: aiGaya,
        },
      })

      if (res.narasi) {
        setForm((prev) => ({ ...prev, deskripsi: res.narasi }))
        setAiSource(res.source || 'AI')
        await showSuccess(
          'Narasi Berhasil Dibuat!',
          `AI (${res.source || 'Asisten AI'}) telah menyusun draf narasi kegiatan. Anda dapat meninjau dan mengedit teks tersebut sebelum disimpan.`
        )
      }
    } catch (err) {
      const mapped = mapApiError(err)
      showError('Gagal Menyusun Narasi', mapped.message)
    } finally {
      setGeneratingAi(false)
    }
  }

  // Simpan Form Kegiatan
  const handleSubmitForm = async (e) => {
    e.preventDefault()
    if (!form.judul.trim()) {
      showError('Validasi', 'Judul kegiatan wajib diisi.')
      return
    }
    if (!form.deskripsi.trim()) {
      showError('Validasi', 'Deskripsi narasi kegiatan wajib diisi.')
      return
    }

    setSubmitting(true)
    try {
      if (editingItem) {
        await api(`/api/kegiatan/${editingItem.id}`, {
          method: 'PUT',
          body: {
            judul: form.judul.trim(),
            deskripsi: form.deskripsi.trim(),
            tanggal_kegiatan: form.tanggal_kegiatan,
            lokasi: form.lokasi ? form.lokasi.trim() : null,
            posyandu_id: form.posyandu_id || undefined,
            foto: form.foto || undefined,
          },
        })
        await showSuccess('Berhasil', 'Dokumentasi kegiatan berhasil diperbarui.')
      } else {
        await api('/api/kegiatan', {
          method: 'POST',
          body: {
            judul: form.judul.trim(),
            deskripsi: form.deskripsi.trim(),
            tanggal_kegiatan: form.tanggal_kegiatan,
            lokasi: form.lokasi ? form.lokasi.trim() : undefined,
            posyandu_id: form.posyandu_id || undefined,
            foto: form.foto || undefined,
          },
        })
        await showSuccess(
          'Kegiatan Tersimpan!',
          'Dokumentasi berhasil ditambahkan dengan watermark resmi dan siap dibagikan.'
        )
      }

      setModalOpen(false)
      loadData()
    } catch (err) {
      const mapped = mapApiError(err)
      showError('Gagal Menyimpan', mapped.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Hapus Kegiatan
  const handleDelete = async (item, e) => {
    e?.stopPropagation()
    e?.preventDefault()

    const confirm = await showConfirm(
      'Hapus Kegiatan?',
      `Hapus dokumentasi "${item.judul}"? Tindakan ini tidak dapat dibatalkan.`
    )
    if (!confirm.isConfirmed) return

    try {
      await api(`/api/kegiatan/${item.id}`, { method: 'DELETE' })
      await showSuccess('Terhapus', 'Dokumentasi kegiatan berhasil dihapus.')
      loadData()
    } catch (err) {
      const mapped = mapApiError(err)
      showError('Gagal Menghapus', mapped.message)
    }
  }

  // Filter List
  const filteredActivities = useMemo(() => {
    return activities.filter((k) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchJudul = k.judul?.toLowerCase().includes(q)
        const matchDesc = k.deskripsi?.toLowerCase().includes(q)
        const matchLokasi = k.lokasi?.toLowerCase().includes(q)
        if (!matchJudul && !matchDesc && !matchLokasi) return false
      }
      if (posyanduFilter && k.posyandu_id !== posyanduFilter) {
        return false
      }
      return true
    })
  }, [activities, search, posyanduFilter])

  return (
    <section className="flex flex-col gap-5">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2.5">
            <Camera size={30} className="text-purple" weight="duotone" />
            Dokumentasi Kegiatan
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Publikasikan dokumentasi kegiatan posyandu lengkap dengan foto ber-watermark dan siap bagikan ke media sosial.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 min-h-[46px] px-4 py-2.5 rounded-xl bg-purple hover:bg-purple-600 text-white font-semibold text-sm shadow-sm transition-all active:scale-[0.99]"
        >
          <Plus size={18} weight="bold" />
          <span>Tambah Kegiatan</span>
        </button>
      </div>

      {/* Bar Pencarian & Filter */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-50 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <MagnifyingGlass
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul kegiatan, lokasi, atau narasi..."
            className="w-full min-h-[44px] pl-11 pr-4 rounded-xl border border-purple-100 bg-white focus:outline-none focus:ring-2 focus:ring-purple/40 text-sm"
          />
        </div>

        {isAdmin && (
          <select
            value={posyanduFilter}
            onChange={(e) => setPosyanduFilter(e.target.value)}
            className="min-h-[44px] px-3.5 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple/40 w-full sm:w-auto"
          >
            <option value="">Semua Posyandu</option>
            {posyanduList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Grid Kartu Kegiatan */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-purple-50 flex flex-col items-center gap-3">
          <span className="w-14 h-14 rounded-2xl bg-purple-50 text-purple flex items-center justify-center">
            <Camera size={32} />
          </span>
          <p className="font-heading font-semibold text-gray-800 text-base">
            Belum ada dokumentasi kegiatan
          </p>
          <p className="text-gray-400 text-xs max-w-sm">
            Klik tombol "Tambah Kegiatan" di atas untuk mengunggah dokumentasi posyandu beserta foto ber-watermark.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActivities.map((k) => {
            const imageUrl = getImageUrl(k.foto)

            return (
              <div
                key={k.id}
                className="bg-white rounded-2xl shadow-sm border border-purple-50 hover:border-purple/30 overflow-hidden flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Foto dengan Watermark */}
                  <div className="relative w-full h-48 bg-gray-100 overflow-hidden flex items-center justify-center">
                    {imageUrl ? (
                      <>
                        <img
                          src={imageUrl}
                          alt={k.judul}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const fallback = e.currentTarget.parentElement?.querySelector('.img-fallback')
                            if (fallback) fallback.classList.remove('hidden')
                          }}
                        />
                        <div className="img-fallback hidden w-full h-full flex flex-col items-center justify-center text-gray-300 gap-1 bg-gray-50">
                          <ImageIcon size={36} />
                          <span className="text-xs">Foto Tidak Tersedia</span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-1">
                        <ImageIcon size={36} />
                        <span className="text-xs">Tanpa Foto</span>
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-xs text-purple text-xs font-semibold px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
                      <Buildings size={13} />
                      <span className="truncate max-w-[150px]">{k.posyandu_name || 'Posyandu'}</span>
                    </div>
                  </div>

                  {/* Konten Info */}
                  <div className="p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <CalendarBlank size={14} />
                        {new Date(k.tanggal_kegiatan).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {k.lokasi && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 truncate">
                            <MapPin size={14} /> {k.lokasi}
                          </span>
                        </>
                      )}
                    </div>

                    <Link
                      to={`/kegiatan/${k.id}`}
                      className="font-heading font-bold text-gray-900 text-base hover:text-purple transition-colors line-clamp-2"
                    >
                      {k.judul}
                    </Link>

                    <p className="text-gray-600 text-xs line-clamp-3 leading-relaxed">
                      {k.deskripsi}
                    </p>
                  </div>
                </div>

                {/* Footer Kartu & Tombol Aksi */}
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-2 bg-gray-50/50">
                  <button
                    onClick={() => setShareItem(k)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple text-white hover:bg-purple-600 text-xs font-semibold transition-all shadow-xs active:scale-[0.98]"
                  >
                    <ShareNetwork size={16} weight="bold" /> Bagikan
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEdit(k, e)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-purple hover:bg-purple-50 transition-colors"
                      title="Edit Kegiatan"
                    >
                      <PencilSimple size={16} />
                    </button>

                    <button
                      onClick={(e) => handleDelete(k, e)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Hapus Kegiatan"
                    >
                      <Trash size={16} />
                    </button>

                    <Link
                      to={`/kegiatan/${k.id}`}
                      className="p-1.5 rounded-lg text-purple font-semibold hover:bg-purple-50 transition-colors"
                      title="Lihat Detail"
                    >
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL FORM TAMBAH / EDIT KEGIATAN */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-purple-50 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-purple-50 text-purple flex items-center justify-center">
                  <Camera size={22} weight="fill" />
                </span>
                <h2 className="font-heading font-bold text-lg text-gray-900">
                  {editingItem ? 'Edit Dokumentasi Kegiatan' : 'Tambah Dokumentasi Kegiatan'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <label className="font-heading font-semibold text-gray-800 text-xs sm:text-sm">
                  Judul Kegiatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: Pelaksanaan Penimbangan & Pemberian Vitamin A Balita"
                  value={form.judul}
                  onChange={(e) => setForm({ ...form, judul: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-heading font-semibold text-gray-800 text-xs sm:text-sm">
                    Tanggal Pelaksanaan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.tanggal_kegiatan}
                    onChange={(e) => setForm({ ...form, tanggal_kegiatan: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-heading font-semibold text-gray-800 text-xs sm:text-sm">
                    Lokasi Kegiatan
                  </label>
                  <input
                    type="text"
                    placeholder="misal: Balai Warga RW 02"
                    value={form.lokasi}
                    onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 text-sm"
                  />
                </div>
              </div>

              {/* Pilihan Posyandu Penyelenggara */}
              <div className="flex flex-col gap-1.5">
                <label className="font-heading font-semibold text-gray-800 text-xs sm:text-sm">
                  Unit Posyandu Penyelenggara {isAdmin ? <span className="text-rose-500">*</span> : ''}
                </label>
                <select
                  disabled={!isAdmin}
                  value={form.posyandu_id}
                  onChange={(e) => setForm({ ...form, posyandu_id: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-purple-100 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">Pilih Posyandu...</option>
                  {posyanduList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.desa ? `(${p.desa})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Asisten AI Penulis Narasi */}
              <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/80 via-white to-pink-50/60 p-4 flex flex-col gap-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple to-pink text-white flex items-center justify-center shadow-xs">
                      <Sparkle size={16} weight="fill" />
                    </span>
                    <div>
                      <h4 className="font-heading font-bold text-gray-900 text-xs sm:text-sm">
                        Asisten AI Penulis Narasi
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Buat narasi kegiatan yang rapi & memikat secara otomatis
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-purple bg-purple-100/80 px-2 py-0.5 rounded-full border border-purple-200 uppercase tracking-wide">
                    AI Powered
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2 flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-gray-700">
                      Poin Khusus / Catatan Tambahan (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="misal: 35 balita hadir, pembagian bubur kacang hijau & vitamin A"
                      value={aiPoin}
                      onChange={(e) => setAiPoin(e.target.value)}
                      className="w-full min-h-[38px] px-3 rounded-xl border border-purple-100 bg-white text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple/40"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-gray-700">Gaya Bahasa</label>
                    <select
                      value={aiGaya}
                      onChange={(e) => setAiGaya(e.target.value)}
                      className="w-full min-h-[38px] px-2.5 rounded-xl border border-purple-100 bg-white text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple/40"
                    >
                      <option value="hangat">Hangat (Medsos & WA)</option>
                      <option value="resmi">Resmi (Laporan Desa)</option>
                      <option value="ringkas">Ringkas & Padat</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-purple-100/60">
                  {aiSource ? (
                    <span className="text-[11px] text-purple-700 font-medium truncate">
                      ✨ Terakhir digenerate oleh: <strong>{aiSource}</strong>
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-400">
                      AI menyusun narasi berdasarkan judul, data posyandu, & poin catatan Anda.
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleGenerateAi}
                    disabled={generatingAi || !form.judul.trim()}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[38px] px-4 rounded-xl bg-gradient-to-r from-purple to-pink hover:opacity-95 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    <Sparkle size={14} weight="fill" className={generatingAi ? 'animate-spin' : ''} />
                    {generatingAi ? 'Menyusun Narasi...' : 'Generate Narasi dengan AI'}
                  </button>
                </div>
              </div>

              {/* Narasi / Deskripsi Kegiatan */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-heading font-semibold text-gray-800 text-xs sm:text-sm">
                    Deskripsi / Narasi Kegiatan <span className="text-rose-500">*</span>
                  </label>
                  {form.deskripsi && (
                    <span className="text-[11px] text-gray-400">
                      {form.deskripsi.length} karakter
                    </span>
                  )}
                </div>
                <textarea
                  rows={5}
                  required
                  placeholder="Tuliskan ringkasan jalannya kegiatan atau gunakan tombol 'Generate Narasi dengan AI' di atas..."
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  className="w-full p-3.5 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 text-sm leading-relaxed"
                />
              </div>

              {/* Upload Foto & Watermark Live Preview */}
              <div className="flex flex-col gap-2 p-4 rounded-xl border border-purple-100 bg-purple-50/40">
                <div className="flex items-center justify-between">
                  <label className="font-heading font-semibold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <Sparkle size={16} className="text-purple" weight="fill" />
                    Foto Dokumentasi + Watermark Otomatis
                  </label>
                  {watermarking && (
                    <span className="text-xs font-semibold text-purple animate-pulse">
                      Menerapkan Watermark...
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple file:text-white hover:file:bg-purple-600 cursor-pointer"
                />

                {/* Preview Foto Ber-Watermark */}
                {form.foto && (
                  <div className="mt-2 relative rounded-xl overflow-hidden border border-purple-200 max-h-56 bg-black flex items-center justify-center">
                    <img
                      src={getImageUrl(form.foto)}
                      alt="Watermarked Preview"
                      className="max-h-56 object-contain"
                    />
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                      ✓ Watermark Aktif
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-gray-500">
                  Foto akan otomatis dibubuhi watermark resmi "Posyandu Ceria", nama unit posyandu, dan tanggal kegiatan agar siap dibagikan ke WhatsApp dan media sosial.
                </p>
              </div>

              {/* Tombol Simpan */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[44px] px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || watermarking}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-purple hover:bg-purple-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm"
                >
                  {submitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Terbitkan Kegiatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BAGIKAN */}
      {shareItem && (
        <ShareModal item={shareItem} onClose={() => setShareItem(null)} />
      )}
    </section>
  )
}

