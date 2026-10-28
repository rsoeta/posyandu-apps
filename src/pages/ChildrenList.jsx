import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  MagnifyingGlass,
  Baby,
  Plus,
  PencilSimple,
  Trash,
  Scales,
  X,
  GenderMale,
  GenderFemale,
  User,
  IdentificationCard,
  CalendarBlank,
  Buildings,
  Funnel,
} from '@phosphor-icons/react'
import { api, mapApiError } from '../lib/api'
import { showError, showSuccess, showConfirm } from '../utils/swal'
import { useAuth } from '../contexts/AuthContext'

export default function ChildrenList() {
  const { isAdmin, posyanduId: authPosyanduId } = useAuth()
  const [children, setChildren] = useState([])
  const [posyanduList, setPosyanduList] = useState([])
  const [loading, setLoading] = useState(true)

  // Filter States
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState('ALL')
  const [posyanduFilter, setPosyanduFilter] = useState('')
  const [ageFilter, setAgeFilter] = useState('ALL') // ALL, 0-6, 7-12, 13-24, 25-59, 60+

  // Modal State (Create / Edit)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingChild, setEditingChild] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    nama: '',
    nik: '',
    tanggal_lahir: '',
    jenis_kelamin: 'L',
    nama_ibu: '',
    posyandu_id: '',
  })

  // Load data balita
  const loadData = async () => {
    setLoading(true)
    try {
      const [resBalita, resPos] = await Promise.all([
        api('/api/balita'),
        api('/api/posyandu/public-list'),
      ])
      setChildren(resBalita.data || [])
      setPosyanduList(resPos.data || [])
    } catch (e) {
      const mapped = mapApiError(e)
      showError('Gagal Memuat Data', mapped.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Buka Modal Tambah
  const handleOpenAdd = () => {
    setEditingChild(null)
    setForm({
      nama: '',
      nik: '',
      tanggal_lahir: new Date().toISOString().split('T')[0],
      jenis_kelamin: 'L',
      nama_ibu: '',
      posyandu_id: authPosyanduId || (posyanduList[0]?.id || ''),
    })
    setModalOpen(true)
  }

  // Buka Modal Edit
  const handleOpenEdit = (child, e) => {
    e?.stopPropagation()
    e?.preventDefault()
    setEditingChild(child)
    setForm({
      nama: child.nama || '',
      nik: child.nik || '',
      tanggal_lahir: child.tanggal_lahir ? child.tanggal_lahir.substring(0, 10) : '',
      jenis_kelamin: child.jenis_kelamin || 'L',
      nama_ibu: child.nama_ibu || '',
      posyandu_id: child.posyandu_id || '',
    })
    setModalOpen(true)
  }

  // Simpan Form (Tambah / Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault()
    if (!form.nama.trim()) {
      showError('Validasi', 'Nama balita wajib diisi.')
      return
    }
    if (!form.nama_ibu.trim()) {
      showError('Validasi', 'Nama ibu kandung wajib diisi.')
      return
    }
    if (!form.tanggal_lahir) {
      showError('Validasi', 'Tanggal lahir balita wajib diisi.')
      return
    }
    if (form.nik && form.nik.trim().length !== 16) {
      showError('Validasi', 'Jika NIK diisi, harus 16 digit angka.')
      return
    }

    setSubmitting(true)
    try {
      if (editingChild) {
        await api(`/api/balita/${editingChild.id}`, {
          method: 'PUT',
          body: {
            nama: form.nama.trim(),
            nik: form.nik ? form.nik.trim() : null,
            tanggal_lahir: form.tanggal_lahir,
            jenis_kelamin: form.jenis_kelamin,
            nama_ibu: form.nama_ibu.trim(),
            posyandu_id: form.posyandu_id || undefined,
          },
        })
        await showSuccess('Data Balita Diperbarui', `Data balita "${form.nama}" berhasil disimpan.`)
      } else {
        await api('/api/balita', {
          method: 'POST',
          body: {
            nama: form.nama.trim(),
            nik: form.nik ? form.nik.trim() : undefined,
            tanggal_lahir: form.tanggal_lahir,
            jenis_kelamin: form.jenis_kelamin,
            nama_ibu: form.nama_ibu.trim(),
            posyandu_id: form.posyandu_id || undefined,
          },
        })
        await showSuccess('Balita Berhasil Didaftarkan', `Data balita "${form.nama}" berhasil ditambahkan.`)
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

  // Hapus Balita
  const handleDelete = async (child, e) => {
    e?.stopPropagation()
    e?.preventDefault()

    const confirm = await showConfirm(
      'Hapus Data Balita?',
      `Apakah Anda yakin ingin menghapus data "${child.nama}"? Seluruh riwayat pengukuran terkait akan ikut terhapus secara permanen.`
    )
    if (!confirm.isConfirmed) return

    try {
      await api(`/api/balita/${child.id}`, { method: 'DELETE' })
      await showSuccess('Terhapus', `Data balita "${child.nama}" berhasil dihapus.`)
      loadData()
    } catch (err) {
      const mapped = mapApiError(err)
      showError('Gagal Menghapus', mapped.message)
    }
  }

  // Hitung Usia dalam Bulan dan Teks Ramah
  const calculateAge = (dob) => {
    if (!dob) return { months: 0, text: '-' }
    const birth = new Date(dob)
    const now = new Date()

    let years = now.getFullYear() - birth.getFullYear()
    let months = now.getMonth() - birth.getMonth()
    if (now.getDate() < birth.getDate()) {
      months--
    }
    if (months < 0) {
      years--
      months += 12
    }

    const totalMonths = years * 12 + months
    let text = ''
    if (years > 0) {
      text = `${years} thn ${months > 0 ? `${months} bln` : ''}`
    } else {
      text = `${totalMonths} bln`
    }

    return { months: totalMonths, text }
  }

  // Filter Data
  const filteredList = useMemo(() => {
    return children.filter((c) => {
      // 1. Search Query
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = c.nama?.toLowerCase().includes(q)
        const matchNik = c.nik?.toLowerCase().includes(q)
        const matchIbu = c.nama_ibu?.toLowerCase().includes(q)
        if (!matchName && !matchNik && !matchIbu) return false
      }

      // 2. Gender Filter
      if (genderFilter !== 'ALL' && c.jenis_kelamin !== genderFilter) {
        return false
      }

      // 3. Posyandu Filter
      if (posyanduFilter && c.posyandu_id !== posyanduFilter) {
        return false
      }

      // 4. Age Filter
      if (ageFilter !== 'ALL' && c.tanggal_lahir) {
        const { months } = calculateAge(c.tanggal_lahir)
        if (ageFilter === '0-6' && (months < 0 || months > 6)) return false
        if (ageFilter === '7-12' && (months < 7 || months > 12)) return false
        if (ageFilter === '13-24' && (months < 13 || months > 24)) return false
        if (ageFilter === '25-59' && (months < 25 || months > 59)) return false
        if (ageFilter === '60+' && months < 60) return false
      }

      return true
    })
  }, [children, search, genderFilter, posyanduFilter, ageFilter])

  const hasActiveFilter =
    search.trim() || genderFilter !== 'ALL' || posyanduFilter || ageFilter !== 'ALL'

  const resetFilter = () => {
    setSearch('')
    setGenderFilter('ALL')
    setPosyanduFilter('')
    setAgeFilter('ALL')
  }

  return (
    <section className="flex flex-col gap-5">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">
            Data Balita
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Kelola data balita, riwayat penimbangan, dan pantau status gizi.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 min-h-[46px] px-4 py-2.5 rounded-xl bg-purple hover:bg-purple-600 text-white font-semibold text-sm shadow-sm transition-all active:scale-[0.99]"
        >
          <Plus size={18} weight="bold" />
          <span>Tambah Balita</span>
        </button>
      </div>

      {/* Bar Pencarian & Filter */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-50 flex flex-col gap-3">
        <div className="relative">
          <MagnifyingGlass
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama balita, NIK, atau nama ibu..."
            className="w-full min-h-[46px] pl-11 pr-4 rounded-xl border border-purple-100 bg-white focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-sm"
          />
        </div>

        {/* Filter Baris Kedua */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* Filter Gender */}
          <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-200 text-xs font-medium">
            <button
              onClick={() => setGenderFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                genderFilter === 'ALL'
                  ? 'bg-purple text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semua Gender
            </button>
            <button
              onClick={() => setGenderFilter('L')}
              className={`px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 transition-colors ${
                genderFilter === 'L'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <GenderMale size={14} weight="bold" /> Laki-laki
            </button>
            <button
              onClick={() => setGenderFilter('P')}
              className={`px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1 transition-colors ${
                genderFilter === 'P'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <GenderFemale size={14} weight="bold" /> Perempuan
            </button>
          </div>

          {/* Filter Rentang Usia */}
          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            className="min-h-[38px] px-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple/40"
          >
            <option value="ALL">Semua Usia</option>
            <option value="0-6">0 - 6 Bulan</option>
            <option value="7-12">7 - 12 Bulan</option>
            <option value="13-24">1 - 2 Tahun (13-24 bln)</option>
            <option value="25-59">2 - 5 Tahun (25-59 bln)</option>
            <option value="60+">&gt; 5 Tahun (&ge; 60 bln)</option>
          </select>

          {/* Filter Posyandu (terutama berguna untuk Admin Desa) */}
          {isAdmin && (
            <select
              value={posyanduFilter}
              onChange={(e) => setPosyanduFilter(e.target.value)}
              className="min-h-[38px] px-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple/40"
            >
              <option value="">Semua Posyandu</option>
              {posyanduList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Reset Filter Button */}
          {hasActiveFilter && (
            <button
              onClick={resetFilter}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs text-purple hover:bg-purple-50 transition-colors font-medium ml-auto"
            >
              <X size={14} /> Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Ringkasan Jumlah */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span>
          Menampilkan <strong>{filteredList.length}</strong> balita
          {children.length !== filteredList.length ? ` (dari total ${children.length})` : ''}
        </span>
      </div>

      {/* Daftar Kartu Balita */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-purple-50 flex flex-col items-center gap-3">
          <span className="w-14 h-14 rounded-2xl bg-purple-50 text-purple flex items-center justify-center">
            <Baby size={32} />
          </span>
          <p className="font-heading font-semibold text-gray-800 text-base">
            Tidak ada data balita yang cocok
          </p>
          <p className="text-gray-400 text-xs max-w-sm">
            {hasActiveFilter
              ? 'Coba sesuaikan kata kunci pencarian atau bersihkan filter di atas.'
              : 'Belum ada balita yang terdaftar. Klik tombol "Tambah Balita" di atas untuk menambahkan data baru.'}
          </p>
          {hasActiveFilter && (
            <button
              onClick={resetFilter}
              className="mt-2 px-4 py-2 rounded-xl bg-purple-50 text-purple font-semibold text-xs hover:bg-purple-100 transition-colors"
            >
              Bersihkan Filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredList.map((c) => {
            const ageInfo = calculateAge(c.tanggal_lahir)
            const isBoy = c.jenis_kelamin === 'L'

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-purple-50 hover:border-purple/30 transition-all flex flex-col justify-between gap-3 group"
              >
                {/* Bagian Atas: Avatar & Info Utama */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      isBoy
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-pink-50 text-pink-500'
                    }`}
                  >
                    <Baby size={26} weight="fill" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/balita/${c.id}`}
                        className="font-heading font-bold text-gray-900 text-base hover:text-purple transition-colors truncate"
                      >
                        {c.nama}
                      </Link>

                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          isBoy
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-pink-50 text-pink-700'
                        }`}
                      >
                        {isBoy ? <GenderMale size={12} weight="bold" /> : <GenderFemale size={12} weight="bold" />}
                        {isBoy ? 'L' : 'P'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                      <span className="font-medium text-gray-700">
                        Usia: {ageInfo.text} ({ageInfo.months} bln)
                      </span>
                      <span>•</span>
                      <span>Ibu: {c.nama_ibu || '-'}</span>
                    </div>

                    {c.posyandu_name && (
                      <div className="text-[11px] text-purple-700 mt-1 inline-flex items-center gap-1 font-medium bg-purple-50/70 px-2 py-0.5 rounded-md">
                        <Buildings size={12} /> {c.posyandu_name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Pengukuran Terakhir */}
                <div className="bg-gray-50 rounded-xl px-3 py-2 text-xs flex items-center justify-between border border-gray-100">
                  <span className="text-gray-500">Pengukuran Terakhir:</span>
                  {c.latest_bb ? (
                    <span className="font-semibold text-gray-800">
                      BB: {c.latest_bb} kg • TB: {c.latest_tb} cm
                      <span className="text-gray-400 font-normal ml-1">
                        ({new Date(c.latest_ukur).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})
                      </span>
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium">Belum pernah diukur</span>
                  )}
                </div>

                {/* Bar Tombol Aksi */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-2">
                  <Link
                    to={`/balita/${c.id}/ukur`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple hover:bg-purple-100 text-xs font-semibold transition-colors"
                  >
                    <Scales size={15} weight="bold" />
                    Input Ukur
                  </Link>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEdit(c, e)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-purple hover:bg-purple-50 transition-colors"
                      title="Edit Data Balita"
                    >
                      <PencilSimple size={17} />
                    </button>

                    <button
                      onClick={(e) => handleDelete(c, e)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Hapus Data Balita"
                    >
                      <Trash size={17} />
                    </button>

                    <Link
                      to={`/balita/${c.id}`}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-purple transition-colors ml-1"
                    >
                      Detail &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL FORM: TAMBAH & EDIT BALITA */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-purple-50 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-purple-50 text-purple flex items-center justify-center">
                  <Baby size={22} weight="fill" />
                </span>
                <h2 className="font-heading font-bold text-lg text-gray-900">
                  {editingChild ? 'Edit Data Balita' : 'Tambah Balita Baru'}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <label className="font-heading font-semibold text-gray-800 text-xs sm:text-sm">
                  Nama Lengkap Balita <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="misal: Muhammad Al-Fatih"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className="w-full min-h-[44px] pl-10 pr-3.5 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-heading font-semibold text-gray-800 text-xs sm:text-sm">
                    NIK Balita (16 digit)
                  </label>
                  <div className="relative">
                    <IdentificationCard
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      maxLength={16}
                      placeholder="Opsional jika belum ada"
                      value={form.nik}
                      onChange={(e) => setForm({ ...form, nik: e.target.value.replace(/\D/g, '') })}
                      className="w-full min-h-[44px] pl-10 pr-3.5 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-heading font-semibold text-gray-800 text-xs sm:text-sm">
                    Tanggal Lahir <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <CalendarBlank
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="date"
                      required
                      max={new Date().toISOString().split('T')[0]}
                      value={form.tanggal_lahir}
                      onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })}
                      className="w-full min-h-[44px] pl-10 pr-3.5 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-heading font-semibold text-gray-800 text-xs sm:text-sm">
                    Jenis Kelamin <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, jenis_kelamin: 'L' })}
                      className={`min-h-[42px] px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                        form.jenis_kelamin === 'L'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <GenderMale size={16} weight="bold" /> Laki-laki
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, jenis_kelamin: 'P' })}
                      className={`min-h-[42px] px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                        form.jenis_kelamin === 'P'
                          ? 'border-pink-500 bg-pink-50 text-pink-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <GenderFemale size={16} weight="bold" /> Perempuan
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-heading font-semibold text-gray-800 text-xs sm:text-sm">
                    Nama Ibu Kandung <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="misal: Fatimah"
                      value={form.nama_ibu}
                      onChange={(e) => setForm({ ...form, nama_ibu: e.target.value })}
                      className="w-full min-h-[44px] pl-10 pr-3.5 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Posyandu: Admin dapat memilih, Kader otomatis */}
              <div className="flex flex-col gap-1.5">
                <label className="font-heading font-semibold text-gray-800 text-xs sm:text-sm">
                  Unit Posyandu {isAdmin ? <span className="text-rose-500">*</span> : ''}
                </label>
                <div className="relative">
                  <Buildings size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    disabled={!isAdmin}
                    value={form.posyandu_id}
                    onChange={(e) => setForm({ ...form, posyandu_id: e.target.value })}
                    className="w-full min-h-[44px] pl-10 pr-3.5 rounded-xl border border-purple-100 bg-white focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-sm text-gray-700 disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="">Pilih Posyandu...</option>
                    {posyanduList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.desa ? `(${p.desa})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {!isAdmin && (
                  <p className="text-[11px] text-gray-400">
                    Kader otomatis mendaftarkan balita ke posyandu wilayah tugasnya.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[44px] px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl bg-purple hover:bg-purple-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 shadow-sm"
                >
                  {submitting
                    ? 'Menyimpan...'
                    : editingChild
                    ? 'Simpan Perubahan'
                    : 'Tambah Balita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
