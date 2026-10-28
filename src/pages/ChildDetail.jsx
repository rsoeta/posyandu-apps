import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Baby, Scales, Ruler, Circle } from '@phosphor-icons/react'
import { children } from '../data/mockData'

export default function ChildDetail() {
  const { id } = useParams()
  const child = children.find((c) => c.id === Number(id))

  if (!child) {
    return (
      <section className="flex flex-col gap-4">
        <Link to="/balita" className="inline-flex items-center gap-2 text-purple font-medium min-h-[48px]">
          <ArrowLeft size={20} /> Kembali
        </Link>
        <p className="text-gray-500">Data balita tidak ditemukan.</p>
      </section>
    )
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
            <h1 className="font-heading text-xl md:text-2xl font-bold text-gray-900">{child.name}</h1>
            <p className="text-gray-500 text-sm">
              {child.ageMonths} bulan • {child.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
            </p>
            <p className="text-gray-500 text-sm">Orang tua: {child.parent}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Terakhir diukur', value: child.lastMeasured, icon: Circle },
          ].map((x, i) => (
            <div key={i} className="bg-purple-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">{x.label}</p>
              <p className="font-heading font-semibold text-gray-900">{x.value}</p>
            </div>
          ))}
        </div>

        <Link
          to={`/balita/${child.id}/ukur`}
          className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl bg-purple text-white font-semibold hover:bg-purple-600 transition-colors w-full sm:w-auto"
        >
          <Scales size={20} weight="fill" /> Input Pengukuran Bulanan
        </Link>
      </div>
    </section>
  )
}
