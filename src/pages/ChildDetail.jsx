import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Baby,
  Scales,
  CalendarBlank,
  PencilSimple,
  Trash,
  GenderMale,
  GenderFemale,
  IdentificationCard,
  User,
  Buildings,
  X,
} from '@phosphor-icons/react'
import { api, mapApiError } from '../lib/api'
import { showError, showSuccess, showConfirm } from '../utils/swal'
import { useAuth } from '../contexts/AuthContext'

export default function ChildDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  const [child, setChild] = useState(null)
  const [measurements, setMeasurements] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [posyanduList, setPosyanduList] = useState([])
  const [form, setForm] = useState({
    nama: '',
    nik: '',
    tanggal_lahir: '',
    jenis_kelamin: 'L',
    nama_ibu: '',
    posyandu_id: '',
  })

  const load = async () => {
    setLoading(true)
    try {
      const [cRes, mRes, pRes] = await Promise.all([
        api(`/api/balita/${id}`),
        api(`/api/pengukuran?balita_id=${id}`),
        api('/api/posyandu/public-list'),
      ])
      setChild(cRes.data)
      setMeasurements(mRes.data || [])
      setPosyanduList(pRes.data || [])
    } catch (e) {
      const mapped = mapApiError(e)
      if (mapped.status === 404) setNotFound(true)
      else showError('Gagal Memuat', mapped.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const openEditModal = () => {
    if (!child) return
    setForm({
      nama: child.nama || '',
      nik: child.nik || '',
      tanggal_lahir: child.tanggal_lahir ? child.tanggal_lahir.substring(0, 10) : '',
      jenis_kelamin: child.jenis_kelamin || 'L',
      nama_ibu: child.nama_ibu || '',
      posyandu_id: child.posyandu_id || '',
    })
    setEditOpen(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!form.nama.trim()) {
      showError('Validasi', 'Nama balita wajib diisi.')
      return
    }
    if (!form.nama_ibu.trim()) {
      showError('Validasi', 'Nama ibu kandung wajib diisi.')
      return
    }

    setSubmitting(true)
    try {
      await api(`/api/balita/${id}`, {
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
      await showSuccess('Berhasil', 'Data balita berhasil diperbarui.')
      setEditOpen(false)
      load()
    } catch (err) {
      const mapped = mapApiError(err)
      showError('Gagal Memperbarui', mapped.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteChild = async () => {
    const confirm = await showConfirm(
      'Hapus Data Balita?',
      `Hapus permanen data "${child.nama}" beserta seluruh catatan pengukurannya?`
    )
    if (!confirm.isConfirmed) return

    try {
      await api(`/api/balita/${id}`, { method: 'DELETE' })
      await showSuccess('Terhapus', `Data balita "${child.nama}" berhasil dihapus.`)
      navigate('/balita', { replace: true })
    } catch (err) {
      const mapped = mapApiError(err)
      showError('Gagal Menghapus', mapped.message)
    }
  }

  const handleDeleteMeasurement = async (mId) => {
    const confirm = await showConfirm(
      'Hapus Data Pengukuran?',
      'Catatan hasil penimbangan ini akan dihapus dari riwayat.'
    )
    if (!confirm.isConfirmed) return

    try {
      await api(`/api/pengukuran/${mId}`, { method: 'DELETE' })
      await showSuccess('Terhapus', 'Catatan pengukuran berhasil dihapus.')
      load()
    } catch (err) {
      const mapped = mapApiError(err)
      showError('Gagal Menghapus', mapped.message)
    }
  }

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
      text = `${years} tahun ${months > 0 ? `${months} bulan` : ''}`
    } else {
      text = `${totalMonths} bulan`
    }

    return { months: totalMonths, text }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !child) {
    return (
      <section className="flex flex-col gap-4">
        <Link
          to="/balita"
          className="inline-flex items-center gap-2 text-purple font-medium min-h-[44px]"
        >
          <ArrowLeft size={20} /> Kembali ke daftar balita
        </Link>
        <div className="bg-white rounded-2xl p-8 text-center border border-purple-50">
          <p className="text-gray-600 font-semibold">
            Data balita tidak ditemukan atau Anda tidak memiliki akses ke posyandu ini.
          </p>
        </div>
      </section>
    )
  }

  const isBoy = child.jenis_kelamin === 'L'
  const age = calculateAge(child.tanggal_lahir)

  return (
    <section className="flex flex-col gap-5">
      {/* Navigasi Kembali */}
      <div className="flex items-center justify-between">
        <Link
          to="/balita"
          className="inline-flex items-center gap-2 text-purple hover:text-purple-700 font-semibold text-sm min-h-[40px]"
        >
          <ArrowLeft size={18} weight="bold" /> Kembali ke Daftar Balita
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={openEditModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:text-purple hover:bg-purple-50 text-xs font-semibold transition-colors"
          >
            <PencilSimple size={15} /> Edit Data
          </button>
          <button
            onClick={handleDeleteChild}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
          >
            <Trash size={15} /> Hapus
          </button>
        </div>
      </div>

      {/* Kartu Profil Balita */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-purple-50 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                isBoy ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-500'
              }`}
            >
              <Baby size={36} weight="fill" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading text-xl sm:text-2xl font-bold text-gray-900">
                  {child.nama}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold ${
                    isBoy ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                  }`}
                >
                  {isBoy ? <GenderMale size={14} weight="bold" /> : <GenderFemale size={14} weight="bold" />}
                  {isBoy ? 'Laki-laki' : 'Perempuan'}
                </span>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                Usia saat ini:{' '}
                <strong className="text-gray-800 font-semibold">{age.text}</strong> ({age.months} bulan)
              </p>
            </div>
          </div>

          <Link
            to={`/balita/${child.id}/ukur`}
            className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 rounded-xl bg-purple text-white font-semibold hover:bg-purple-600 text-sm transition-all shadow-sm active:scale-[0.99] self-start sm:self-auto"
          >
            <Scales size={18} weight="fill" /> Input Pengukuran Bulanan
          </Link>
        </div>

        {/* Detail Biodata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
              <IdentificationCard size={14} /> NIK Balita
            </span>
            <span className="text-sm font-semibold text-gray-800">
              {child.nik || '(Belum dicatat)'}
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
              <CalendarBlank size={14} /> Tanggal Lahir
            </span>
            <span className="text-sm font-semibold text-gray-800">
              {child.tanggal_lahir
                ? new Date(child.tanggal_lahir).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '-'}
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
              <User size={14} /> Nama Ibu Kandung
            </span>
            <span className="text-sm font-semibold text-gray-800">{child.nama_ibu || '-'}</span>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1">
            <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
              <Buildings size={14} /> Unit Posyandu
            </span>
            <span className="text-sm font-semibold text-purple">
              {child.posyandu_name || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Riwayat Pengukuran */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-50 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-gray-900">
            Riwayat Pengukuran & Penimbangan ({measurements.length})
          </h2>
          <Link
            to={`/balita/${child.id}/ukur`}
            className="text-xs font-semibold text-purple hover:underline"
          >
            + Tambah Catatan
          </Link>
        </div>

        {measurements.length === 0 ? (
          <div className="text-center py-8 text-gray-400 flex flex-col items-center gap-2">
            <Scales size={36} className="text-gray-300" />
            <p className="text-sm font-medium">Belum ada riwayat pengukuran untuk balita ini.</p>
            <Link
              to={`/balita/${child.id}/ukur`}
              className="mt-1 px-4 py-2 rounded-xl bg-purple-50 text-purple font-semibold text-xs hover:bg-purple-100 transition-colors"
            >
              Lakukan Penimbangan Sekarang
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {measurements.map((m) => (
              <div
                key={m.id}
                className="border border-purple-50 hover:border-purple/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors bg-white"
              >
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-gray-700 bg-purple-50/70 px-2.5 py-1 rounded-lg text-xs">
                    <CalendarBlank size={15} className="text-purple" />
                    {new Date(m.tanggal_ukur).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>

                  <span className="text-gray-800 font-semibold">
                    BB:{' '}
                    <span className="text-purple font-bold">{m.berat_badan}</span> kg
                  </span>

                  <span className="text-gray-800 font-semibold">
                    TB:{' '}
                    <span className="text-purple font-bold">{m.tinggi_badan}</span> cm
                  </span>

                  {m.lingkar_kepala && (
                    <span className="text-gray-600 text-xs">
                      LK: <strong>{m.lingkar_kepala}</strong> cm
                    </span>
                  )}

                  {m.catatan && (
                    <span className="text-xs text-gray-500 italic">
                      "{m.catatan}"
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteMeasurement(m.id)}
                  className="self-end sm:self-auto p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Hapus Pengukuran"
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL EDIT BALITA */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-purple-50 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
              <h2 className="font-heading font-bold text-lg text-gray-900">
                Edit Data Balita
              </h2>
              <button
                onClick={() => setEditOpen(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <label className="font-heading font-semibold text-gray-800 text-xs sm:text-sm">
                  Nama Lengkap Balita <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-heading font-semibold text-gray-800 text-xs sm:text-sm">
                    NIK Balita (16 digit)
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={form.nik}
                    onChange={(e) => setForm({ ...form, nik: e.target.value.replace(/\D/g, '') })}
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-heading font-semibold text-gray-800 text-xs sm:text-sm">
                    Tanggal Lahir <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={form.tanggal_lahir}
                    onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 text-sm"
                  />
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
                      className={`min-h-[42px] px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1 transition-colors ${
                        form.jenis_kelamin === 'L'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      <GenderMale size={16} weight="bold" /> Laki-laki
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, jenis_kelamin: 'P' })}
                      className={`min-h-[42px] px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1 transition-colors ${
                        form.jenis_kelamin === 'P'
                          ? 'border-pink-500 bg-pink-50 text-pink-700'
                          : 'border-gray-200 text-gray-600'
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
                  <input
                    type="text"
                    required
                    value={form.nama_ibu}
                    onChange={(e) => setForm({ ...form, nama_ibu: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 text-sm"
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-heading font-semibold text-gray-800 text-xs sm:text-sm">
                    Unit Posyandu
                  </label>
                  <select
                    value={form.posyandu_id}
                    onChange={(e) => setForm({ ...form, posyandu_id: e.target.value })}
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-purple-100 text-sm"
                  >
                    <option value="">Pilih Posyandu...</option>
                    {posyanduList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.desa ? `(${p.desa})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="min-h-[42px] px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[42px] px-5 rounded-xl bg-purple text-white hover:bg-purple-600 text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
