import { useEffect, useState } from 'react'
import { Baby, ChartBar, Buildings } from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { handleSupabaseError } from '../utils/errors'
import { showError } from '../utils/swal'

export default function Dashboard() {
  const { isAdmin, posyanduName } = useAuth()
  const [stats, setStats] = useState({ balita: 0, ibuHamil: 0, ukurBulanIni: 0, posyandu: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

      const queries = [
        supabase.from('balita').select('id', { count: 'exact', head: true }),
        supabase.from('ibu_hamil').select('id', { count: 'exact', head: true }),
        supabase.from('pengukuran').select('id', { count: 'exact', head: true }).gte('tanggal_ukur', start).lte('tanggal_ukur', end),
      ]
      if (isAdmin) queries.push(supabase.from('posyandu').select('id', { count: 'exact', head: true }))

      const results = await Promise.all(queries)
      if (!mounted) return
      for (const r of results) {
        if (r.error) {
          const mapped = handleSupabaseError(r.error)
          showError('Gagal Memuat Data', mapped.message)
          setLoading(false)
          return
        }
      }
      setStats({
        balita: results[0].count ?? 0,
        ibuHamil: results[1].count ?? 0,
        ukurBulanIni: results[2].count ?? 0,
        posyandu: isAdmin ? (results[3].count ?? 0) : 0,
      })
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [isAdmin])

  const cards = [
    { label: 'Total Balita', value: stats.balita, icon: Baby, color: 'from-purple to-pink' },
    { label: 'Total Ibu Hamil', value: stats.ibuHamil, icon: Baby, color: 'from-pink to-purple' },
    { label: 'Balita Diukur Bulan Ini', value: stats.ukurBulanIni, icon: ChartBar, color: 'from-purple to-purple-600' },
  ]
  if (isAdmin) cards.push({ label: 'Total Posyandu', value: stats.posyandu, icon: Buildings, color: 'from-purple-600 to-pink' })

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">Beranda</h1>
        <p className="text-gray-500 text-sm mt-1">
          Ringkasan aktivitas {posyanduName ? posyanduName : 'desa'} bulan ini.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="flex-grow basis-[calc(33.333%-1rem)] min-w-[160px] bg-white rounded-2xl p-5 shadow-sm border border-purple-50 flex items-center gap-4"
            >
              <span className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${color} text-white shrink-0`}>
                <Icon size={24} weight="fill" />
              </span>
              <div className="min-w-0">
                <p className="text-gray-500 text-xs font-medium truncate">{label}</p>
                <p className="font-heading text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
