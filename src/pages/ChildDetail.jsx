import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Baby, Scales, CalendarBlank } from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'
import { handleSupabaseError } from '../utils/errors'
import { showError } from '../utils/swal'

export default function ChildDetail() {
  const { id } = useParams()
  const [child, setChild] = useState(null)
  const [measurements, setMeasurements] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      const { data: c, error: ce } = await supabase
        .from('balita')
        .select('id, nama, tanggal_lahir, jenis_kelamin, nama_ibu, posyandu_id, created_at')
        .eq('id', id)
        .single()
      if (ce) {
        const mapped = handleSupabaseError(ce)
        if (mapped.status === 404) setNotFound(true)
        else showError('Gagal Memuat', mapped.message)
        setLoading(false)
        return
      }
      if (!mounted) return
      setChild(c)

      const { data: m, error: me } = await supabase
        .from('pengukuran')
        .select('id, tanggal_ukur, berat_badan, tinggi_badan, lingkar_kepala, catatan')
        .eq('balita_id', id)
        .order('tanggal_ukur', { ascending: false })
      if (me) {
        showError('Gagal Memuat Pengukuran', handleSupabaseError(me).message)
      } else if (mounted) {
        setMeasurements(m || [])
      }
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [id])

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
        <Link to="/balita" className="inline-flex items-center gap-2 text-purple font-medium min-h-[48px]">
          <ArrowLeft size={20} /> Kembali
        </Link>
        <p className="text-gray-500">Data balita tidak ditemukan atau tidak dapat diakses.</p>
      </section>
    )
  }

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
      <Link to="/balita" className="inline-flex items-center gap-2 text-purple font-medium min-h-[48px]">
        <ArrowLeft size={20} /> Kembali ke daftar
      </Link>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-50 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple to-pink text-white shrink-0">
            <Baby size={32} weight="fill" />
          </span>
          <div className="min-w-0">
            <h1 className="font-heading text-xl md:text-2xl font-bold text-gray-900">{child.nama}</h1>
            <p className="text-gray-500 text-sm">
              {ageMonths(child.tanggal_lahir)} bulan • {child.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
            </p>
            <p className="text-gray-500 text-sm">Ibu: {child.nama_ibu || '-'}</p>
          </div>
        </div>

        <Link
          to={`/balita/${child.id}/ukur`}
          className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl bg-purple text-white font-semibold hover:bg-purple-600 transition-colors w-full sm:w-auto"
        >
          <Scales size={20} weight="fill" /> Input Pengukuran Bulanan
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-50">
        <h2 className="font-heading text-lg font-semibold text-gray-900 mb-3">Riwayat Pengukuran</h2>
        {measurements.length === 0 ? (
          <p className="text-gray-400 text-sm">Belum ada pengukuran.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {measurements.map((m) => (
              <div key={m.id} className="border border-purple-50 rounded-xl p-3 flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1 text-gray-600">
                  <CalendarBlank size={16} /> {m.tanggal_ukur}
                </span>
                <span className="text-gray-800 font-medium">BB: {m.berat_badan} kg</span>
                <span className="text-gray-800 font-medium">TB: {m.tinggi_badan} cm</span>
                <span className="text-gray-800 font-medium">LK: {m.lingkar_kepala} cm</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
