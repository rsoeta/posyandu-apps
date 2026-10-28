import { CalendarBlank, Clock, MapPin } from '@phosphor-icons/react'

const schedules = [
  { id: 1, title: 'Posyandu Bulan Oktober', date: '2026-10-15', time: '08:00 - 12:00', place: 'Balai Desa' },
  { id: 2, title: 'Posyandu Bulan November', date: '2026-11-12', time: '08:00 - 12:00', place: 'Balai Desa' },
  { id: 3, title: 'Imunisasi Tambahan', date: '2026-10-22', time: '09:00 - 11:00', place: 'Puskesmas' },
]

export default function Schedule() {
  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900">Jadwal</h1>
        <p className="text-gray-500 text-sm mt-1">Jadwal kegiatan posyandu mendatang.</p>
      </div>
      <div className="flex flex-col gap-3">
        {schedules.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl p-5 shadow-sm border border-purple-50 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-pink-50 text-pink shrink-0">
                <CalendarBlank size={24} weight="fill" />
              </span>
              <h2 className="font-heading font-semibold text-gray-900">{s.title}</h2>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 pl-1">
              <span className="flex items-center gap-1"><CalendarBlank size={16} /> {s.date}</span>
              <span className="flex items-center gap-1"><Clock size={16} /> {s.time}</span>
              <span className="flex items-center gap-1"><MapPin size={16} /> {s.place}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
