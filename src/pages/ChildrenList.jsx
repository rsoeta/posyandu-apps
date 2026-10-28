import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MagnifyingGlass, Baby } from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'
import { handleSupabaseError } from '../utils/errors'
import { showError } from '../utils/swal'

export default function ChildrenList() {
  const [children, setChildren] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('balita')
      .select('id, nama, tanggal_lahir, jenis_kelamin, nama_ibu, posyandu_id')
      .order('nama', { ascending: true })
    if (error) {
      const mapped = handleSupabaseError(error)
      showError('Gagal Memuat Data', mapped.message)
      setLoading(false)
      return
    }
    setChildren(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = children.filter((c) =>
    c.nama.toLowerCase().includes(query.toLowerCase())
  )

  const ageMonths = (dob) => {
    if (!dob) return '-'
    // eslint-disable-next-line react/purity
    const d = new Date(dob)
    // eslint-disable-next-line react/purity
    const now = new Date()
    return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
  }

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">Data Balita</h1>
        <p className="text-gray-500 text-sm mt-1">Daftar balita yang dapat Anda akses.</p>
      </div>

      <div className="relative">
        <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama balita..."
          className="w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-purple-100 bg-white focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-base"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-8">Tidak ditemukan.</p>
          )}
          {filtered.map((c) => (
            <Link
              key={c.id}
              to={`/balita/${c.id}`}
              className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-purple-50 hover:border-purple/40 transition-colors min-h-[64px]"
            >
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 text-purple shrink-0">
                <Baby size={24} weight="fill" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-gray-900 truncate">{c.nama}</p>
                <p className="text-sm text-gray-500 truncate">
                  {ageMonths(c.tanggal_lahir)} bulan • {c.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} • Ibu: {c.nama_ibu || '-'}
                </p>
              </div>
              <span className="text-purple text-sm font-medium shrink-0">Detail →</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
