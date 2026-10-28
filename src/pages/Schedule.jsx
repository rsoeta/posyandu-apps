import { useEffect, useState } from 'react'
import { CalendarBlank, Clock, MapPin } from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'
import { handleSupabaseError } from '../utils/errors'
import { showError } from '../utils/swal'

export default function Schedule() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const { data, error } = await supabase
        .from('jadwal')
        .select('id, judul, tanggal, waktu, tempat')
        .order('tanggal', { ascending: true })
      if (error) {
        showError('Gagal Memuat', handleSupabaseError(error).message)
      } else if (mounted) {
        setSchedules(data || [])
      }
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">Jadwal</h1>
        <p className="text-gray-500 text-sm mt-1">Jadwal kegiatan posyandu mendatang.</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {schedules.length === 0 && <p className="text-center text-gray-400 py-8">Belum ada jadwal.</p>}
          {schedules.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl p-5 shadow-sm border border-purple-50 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-pink-50 text-pink shrink-0">
                  <CalendarBlank size={24} weight="fill" />
                </span>
                <h2 className="font-heading font-semibold text-gray-900">{s.judul}</h2>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 pl-1">
                <span className="flex items-center gap-1"><CalendarBlank size={16} /> {s.tanggal}</span>
                <span className="flex items-center gap-1"><Clock size={16} /> {s.waktu}</span>
                <span className="flex items-center gap-1"><MapPin size={16} /> {s.tempat}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
