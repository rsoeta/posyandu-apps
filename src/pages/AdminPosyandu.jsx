import { useEffect, useState } from 'react'
import {
  Plus,
  PencilSimple,
  Trash,
  X,
  CheckCircle,
  XCircle,
  UserCheck,
  Buildings,
  Clock,
  ShieldCheck,
} from '@phosphor-icons/react'
import { api, mapApiError } from '../lib/api'
import { showSuccess, showError, showConfirm } from '../utils/swal'

export default function AdminPosyandu() {
  const [activeTab, setActiveTab] = useState('posyandu') // 'posyandu' | 'kader'
  const [posyandus, setPosyandus] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', desa: '', alamat: '' })
  const [assignForm, setAssignForm] = useState({ userId: '', posyanduId: '' })

  const load = async () => {
    setLoading(true)
    try {
      const [p, u] = await Promise.all([
        api('/api/posyandu'),
        api('/api/users'),
      ])
      setPosyandus(p.data || [])
      setUsers(u.data || [])
    } catch (e) {
      const mapped = mapApiError(e)
      showError('Gagal Memuat', mapped.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setForm({ name: '', desa: '', alamat: '' })
    setEditing(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      showError('Validasi', 'Nama posyandu wajib diisi.')
      return
    }
    try {
      if (editing) {
        await api(`/api/posyandu/${editing.id}`, {
          method: 'PUT',
          body: {
            name: form.name.trim(),
            desa: form.desa.trim(),
            alamat: form.alamat.trim(),
          },
        })
      } else {
        await api('/api/posyandu', {
          method: 'POST',
          body: {
            name: form.name.trim(),
            desa: form.desa.trim(),
            alamat: form.alamat.trim(),
          },
        })
      }
      await showSuccess(editing ? 'Posyandu diperbarui.' : 'Posyandu ditambahkan.')
      resetForm()
      load()
    } catch (e) {
      const mapped = mapApiError(e)
      showError('Gagal Simpan', mapped.message)
    }
  }

  const handleEdit = (p) => {
    setEditing(p)
    setForm({ name: p.name, desa: p.desa || '', alamat: p.alamat || '' })
  }

  const handleDelete = async (p) => {
    const res = await showConfirm(
      'Hapus Posyandu?',
      `Hapus "${p.name}"? Data balita terkait akan ikut terhapus.`
    )
    if (!res.isConfirmed) return
    try {
      await api(`/api/posyandu/${p.id}`, { method: 'DELETE' })
      await showSuccess('Posyandu dihapus.')
      load()
    } catch (e) {
      const mapped = mapApiError(e)
      showError('Gagal Hapus', mapped.message)
    }
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!assignForm.userId || !assignForm.posyanduId) {
      showError('Validasi', 'Pilih kader dan posyandu.')
      return
    }
    try {
      await api('/api/posyandu/assign', {
        method: 'POST',
        body: { userId: assignForm.userId, posyanduId: assignForm.posyanduId },
      })
      await showSuccess('Kader berhasil ditugaskan.')
      setAssignForm({ userId: '', posyanduId: '' })
      load()
    } catch (e) {
      const mapped = mapApiError(e)
      showError('Gagal Assign', mapped.message)
    }
  }

  // Update status akun kader (Setujui / Tolak / Ganti status)
  const handleUpdateStatus = async (user, newStatus, newPosyanduId) => {
    const actionLabel =
      newStatus === 'approved'
        ? 'Setujui'
        : newStatus === 'rejected'
        ? 'Tolak'
        : 'Ubah'

    const confirm = await showConfirm(
      `${actionLabel} Akses Kader?`,
      `Apakah Anda yakin ingin mengubah status ${user.full_name || user.email} menjadi ${newStatus}?`
    )
    if (!confirm.isConfirmed) return

    try {
      await api(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        body: {
          status: newStatus,
          posyandu_id: newPosyanduId !== undefined ? newPosyanduId : user.posyandu_id,
        },
      })
      await showSuccess(`Akun berhasil di-${newStatus}.`)
      load()
    } catch (e) {
      const mapped = mapApiError(e)
      showError('Gagal Memperbarui Status', mapped.message)
    }
  }

  // Hapus akun kader
  const handleDeleteUser = async (user) => {
    const confirm = await showConfirm(
      'Hapus Akun Kader?',
      `Hapus permanen akun "${user.full_name || user.email}"?`
    )
    if (!confirm.isConfirmed) return

    try {
      await api(`/api/users/${user.id}`, { method: 'DELETE' })
      await showSuccess('Akun berhasil dihapus.')
      load()
    } catch (e) {
      const mapped = mapApiError(e)
      showError('Gagal Hapus', mapped.message)
    }
  }

  const pendingCount = users.filter((u) => u.status === 'pending').length

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">
          Manajemen Posyandu & Kader
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Kelola data posyandu, validasi registrasi kader, dan atur penugasan wilayah.
        </p>
      </div>

      {/* Tabs Navigasi */}
      <div className="flex border-b border-gray-200 gap-2">
        <button
          onClick={() => setActiveTab('posyandu')}
          className={`pb-3 px-3 font-heading font-semibold text-sm transition-colors border-b-2 inline-flex items-center gap-2 ${
            activeTab === 'posyandu'
              ? 'border-purple text-purple'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Buildings size={18} />
          Master Posyandu ({posyandus.length})
        </button>

        <button
          onClick={() => setActiveTab('kader')}
          className={`pb-3 px-3 font-heading font-semibold text-sm transition-colors border-b-2 inline-flex items-center gap-2 ${
            activeTab === 'kader'
              ? 'border-purple text-purple'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserCheck size={18} />
          Validasi & Akun Kader ({users.length})
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full animate-pulse">
              {pendingCount} Pending
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: MASTER POSYANDU */}
      {activeTab === 'posyandu' && (
        <div className="flex flex-col gap-5">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-5 shadow-sm border border-purple-50 flex flex-col gap-4"
          >
            <h2 className="font-heading text-lg font-semibold text-gray-900">
              {editing ? 'Edit Posyandu' : 'Tambah Posyandu'}
            </h2>
            <div className="flex flex-col gap-2">
              <label className="font-heading font-semibold text-gray-800 text-sm">
                Nama Posyandu
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="misal: Posyandu Mawar I"
                className="w-full min-h-[48px] px-4 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-base"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-heading font-semibold text-gray-800 text-sm">Desa</label>
              <input
                value={form.desa}
                onChange={(e) => setForm({ ...form, desa: e.target.value })}
                placeholder="misal: Sukajaya"
                className="w-full min-h-[48px] px-4 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-base"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-heading font-semibold text-gray-800 text-sm">Alamat</label>
              <input
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                placeholder="misal: Dusun Krajan RT 02 / RW 01"
                className="w-full min-h-[48px] px-4 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-base"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl bg-purple text-white font-semibold hover:bg-purple-600 transition-colors"
              >
                <Plus size={20} weight="bold" /> {editing ? 'Simpan Perubahan' : 'Tambah'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                >
                  <X size={20} /> Batal
                </button>
              )}
            </div>
          </form>

          <form
            onSubmit={handleAssign}
            className="bg-white rounded-2xl p-5 shadow-sm border border-purple-50 flex flex-col gap-4"
          >
            <h2 className="font-heading text-lg font-semibold text-gray-900">
              Tugaskan Kader ke Posyandu
            </h2>
            <div className="flex flex-wrap gap-3">
              <select
                value={assignForm.userId}
                onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
                className="flex-1 min-w-[180px] min-h-[48px] px-3 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-base"
              >
                <option value="">Pilih kader aktif...</option>
                {users
                  .filter((u) => u.status === 'approved' && u.role === 'kader')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.email} {u.posyandu_name ? `(${u.posyandu_name})` : ''}
                    </option>
                  ))}
              </select>
              <select
                value={assignForm.posyanduId}
                onChange={(e) => setAssignForm({ ...assignForm, posyanduId: e.target.value })}
                className="flex-1 min-w-[180px] min-h-[48px] px-3 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-base"
              >
                <option value="">Pilih posyandu tujuan...</option>
                {posyandus.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="min-h-[48px] px-5 rounded-xl bg-purple text-white font-semibold hover:bg-purple-600 transition-colors"
              >
                Tugaskan
              </button>
            </div>
          </form>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {posyandus.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-purple-50 flex items-center gap-4 min-h-[64px]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {p.desa || '-'} • {p.alamat || '-'}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleEdit(p)}
                      className="inline-flex items-center justify-center w-11 h-11 rounded-xl text-purple hover:bg-purple-50 transition-colors"
                      aria-label="Edit"
                    >
                      <PencilSimple size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="inline-flex items-center justify-center w-11 h-11 rounded-xl text-pink hover:bg-pink-50 transition-colors"
                      aria-label="Hapus"
                    >
                      <Trash size={20} />
                    </button>
                  </div>
                </div>
              ))}
              {posyandus.length === 0 && (
                <p className="text-center text-gray-400 py-8">Belum ada posyandu.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VALIDASI & AKUN KADER */}
      {activeTab === 'kader' && (
        <div className="flex flex-col gap-4">
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Clock size={24} className="text-amber-600 shrink-0 mt-0.5" weight="bold" />
            <div className="text-sm text-amber-900 leading-relaxed">
              <strong className="font-semibold">Mekanisme Validasi Hak Akses:</strong>
              <p className="mt-0.5 text-xs text-amber-800">
                Setiap kader yang baru mendaftar dari halaman register akan berstatus{' '}
                <span className="font-bold underline">Menunggu Persetujuan</span>. Anda sebagai Admin
                Desa harus menekan tombol <strong>Setujui</strong> agar kader dapat melakukan login
                dan mencatat data balita.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {users.map((u) => {
                const isPending = u.status === 'pending'
                const isApproved = u.status === 'approved'
                const isRejected = u.status === 'rejected'
                const isAdmin = u.role === 'admin_desa'

                return (
                  <div
                    key={u.id}
                    className={`bg-white rounded-2xl p-4 shadow-sm border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isPending
                        ? 'border-amber-300 ring-1 ring-amber-300/60 bg-amber-50/20'
                        : 'border-purple-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-semibold text-gray-900 text-base">
                          {u.full_name || 'Tanpa Nama'}
                        </span>

                        {isAdmin && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                            <ShieldCheck size={14} weight="bold" /> Admin Desa
                          </span>
                        )}

                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock size={14} weight="bold" /> Menunggu Validasi
                          </span>
                        )}

                        {isApproved && !isAdmin && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle size={14} weight="bold" /> Disetujui
                          </span>
                        )}

                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                            <XCircle size={14} weight="bold" /> Ditolak
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-500 mt-0.5">{u.email}</p>

                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <span>
                          Posyandu:{' '}
                          <strong className="text-gray-700">
                            {u.posyandu_name || '(Belum ditugaskan)'}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Daftar:{' '}
                          {new Date(u.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Tombol aksi status */}
                    {!isAdmin && (
                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(u, 'approved')}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm"
                            >
                              <CheckCircle size={16} weight="bold" />
                              Setujui
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(u, 'rejected')}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold transition-colors"
                            >
                              <XCircle size={16} weight="bold" />
                              Tolak
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            onClick={() => handleUpdateStatus(u, 'rejected')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-rose-50 hover:text-rose-600 text-xs font-medium transition-colors"
                          >
                            Nonaktifkan
                          </button>
                        )}

                        {isRejected && (
                          <button
                            onClick={() => handleUpdateStatus(u, 'approved')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs font-medium transition-colors"
                          >
                            Aktifkan Kembali
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-gray-400 hover:text-pink hover:bg-pink-50 transition-colors"
                          title="Hapus Akun"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}

              {users.length === 0 && (
                <p className="text-center text-gray-400 py-8">Belum ada akun terdaftar.</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
