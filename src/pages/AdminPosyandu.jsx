import { useEffect, useState } from 'react'
import { Plus, PencilSimple, Trash, X } from '@phosphor-icons/react'
import { api, mapApiError } from '../lib/api'
import { showSuccess, showError, showConfirm } from '../utils/swal'

export default function AdminPosyandu() {
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

  useEffect(() => { load() }, [])

  const resetForm = () => { setForm({ name: '', desa: '', alamat: '' }); setEditing(null) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { showError('Validasi', 'Nama posyandu wajib diisi.'); return }
    try {
      if (editing) {
        await api(`/api/posyandu/${editing.id}`, { method: 'PUT', body: { name: form.name.trim(), desa: form.desa.trim(), alamat: form.alamat.trim() } })
      } else {
        await api('/api/posyandu', { method: 'POST', body: { name: form.name.trim(), desa: form.desa.trim(), alamat: form.alamat.trim() } })
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
    const res = await showConfirm('Hapus Posyandu?', `Hapus "${p.name}"? Data balita terkait akan ikut terhapus.`)
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
      await api('/api/posyandu/assign', { method: 'POST', body: { userId: assignForm.userId, posyanduId: assignForm.posyanduId } })
      await showSuccess('Kader berhasil ditugaskan.')
      setAssignForm({ userId: '', posyanduId: '' })
      load()
    } catch (e) {
      const mapped = mapApiError(e)
      showError('Gagal Assign', mapped.message)
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">Manajemen Posyandu</h1>
        <p className="text-gray-500 text-sm mt-1">Kelola master data posyandu dan penugasan kader.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm border border-purple-50 flex flex-col gap-4">
        <h2 className="font-heading text-lg font-semibold text-gray-900">
          {editing ? 'Edit Posyandu' : 'Tambah Posyandu'}
        </h2>
        <div className="flex flex-col gap-2">
          <label className="font-heading font-semibold text-gray-800 text-sm">Nama Posyandu</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full min-h-[48px] px-4 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-base"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-heading font-semibold text-gray-800 text-sm">Desa</label>
          <input
            value={form.desa}
            onChange={(e) => setForm({ ...form, desa: e.target.value })}
            className="w-full min-h-[48px] px-4 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-base"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-heading font-semibold text-gray-800 text-sm">Alamat</label>
          <input
            value={form.alamat}
            onChange={(e) => setForm({ ...form, alamat: e.target.value })}
            className="w-full min-h-[48px] px-4 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-base"
          />
        </div>
        <div className="flex gap-3">
          <button type="submit" className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl bg-purple text-white font-semibold hover:bg-purple-600 transition-colors">
            <Plus size={20} weight="bold" /> {editing ? 'Simpan Perubahan' : 'Tambah'}
          </button>
          {editing && (
            <button type="button" onClick={resetForm} className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors">
              <X size={20} /> Batal
            </button>
          )}
        </div>
      </form>

      <form onSubmit={handleAssign} className="bg-white rounded-2xl p-5 shadow-sm border border-purple-50 flex flex-col gap-4">
        <h2 className="font-heading text-lg font-semibold text-gray-900">Tugaskan Kader ke Posyandu</h2>
        <div className="flex flex-wrap gap-3">
          <select
            value={assignForm.userId}
            onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
            className="flex-1 min-w-[180px] min-h-[48px] px-3 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-base"
          >
            <option value="">Pilih kader...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
            ))}
          </select>
          <select
            value={assignForm.posyanduId}
            onChange={(e) => setAssignForm({ ...assignForm, posyanduId: e.target.value })}
            className="flex-1 min-w-[180px] min-h-[48px] px-3 rounded-xl border border-purple-100 focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-base"
          >
            <option value="">Pilih posyandu...</option>
            {posyandus.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button type="submit" className="min-h-[48px] px-5 rounded-xl bg-purple text-white font-semibold hover:bg-purple-600 transition-colors">
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
            <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-purple-50 flex items-center gap-4 min-h-[64px]">
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-gray-900 truncate">{p.name}</p>
                <p className="text-sm text-gray-500 truncate">{p.desa || '-'} • {p.alamat || '-'}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleEdit(p)} className="inline-flex items-center justify-center w-11 h-11 rounded-xl text-purple hover:bg-purple-50 transition-colors" aria-label="Edit">
                  <PencilSimple size={20} />
                </button>
                <button onClick={() => handleDelete(p)} className="inline-flex items-center justify-center w-11 h-11 rounded-xl text-pink hover:bg-pink-50 transition-colors" aria-label="Hapus">
                  <Trash size={20} />
                </button>
              </div>
            </div>
          ))}
          {posyandus.length === 0 && <p className="text-center text-gray-400 py-8">Belum ada posyandu.</p>}
        </div>
      )}
    </section>
  )
}
