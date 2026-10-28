import { Baby, Heart, ChartBar } from '@phosphor-icons/react'
import { stats } from '../data/mockData'

const cards = [
  { label: 'Total Balita', value: stats.totalBalita, icon: Baby, color: 'from-purple to-pink' },
  { label: 'Total Ibu Hamil', value: stats.totalIbuHamil, icon: Heart, color: 'from-pink to-purple' },
  { label: 'Balita Diukur Bulan Ini', value: stats.balitaDiukurBulanIni, icon: ChartBar, color: 'from-purple to-purple-600' },
]

export default function Dashboard() {
  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">Beranda</h1>
        <p className="text-gray-500 text-sm mt-1">Ringkasan aktivitas posyandu bulan ini.</p>
      </div>

      {/* Responsive flex-wrap grid */}
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

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-50">
        <h2 className="font-heading text-lg font-semibold text-gray-900 mb-2">Aktivitas Terbaru</h2>
        <ul className="flex flex-col gap-3">
          {[
            'Pengukuran balita Aisyah Putri selesai',
            'Jadwal posyandu bulan depan ditambahkan',
            'Data ibu hamil diperbarui',
          ].map((t, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
              <span className="w-2 h-2 rounded-full bg-pink shrink-0" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
