import { Link, useLocation } from 'react-router-dom'
import { House, Baby, CalendarBlank, Camera } from '@phosphor-icons/react'

const items = [
  { to: '/', label: 'Beranda', icon: House },
  { to: '/balita', label: 'Balita', icon: Baby },
  { to: '/kegiatan', label: 'Kegiatan', icon: Camera },
  { to: '/jadwal', label: 'Jadwal', icon: CalendarBlank },
]

export default function BottomNav() {
  const location = useLocation()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-purple-100">
      <div className="flex items-stretch justify-around max-w-5xl mx-auto">
        {items.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center justify-center gap-1 min-h-[56px] py-2 text-xs font-medium transition-colors"
            >
              <Icon
                size={24}
                weight={active ? 'fill' : 'regular'}
                className={active ? 'text-purple' : 'text-gray-500'}
              />
              <span className={active ? 'text-purple' : 'text-gray-500'}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
