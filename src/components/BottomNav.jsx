import { Link, useLocation } from 'react-router-dom'
import { House, Baby, CalendarBlank } from '@phosphor-icons/react'

const items = [
  { to: '/', label: 'Beranda', icon: House },
  { to: '/balita', label: 'Data Balita', icon: Baby },
  { to: '/jadwal', label: 'Jadwal', icon: CalendarBlank },
]

export default function BottomNav() {
  const location = useLocation()
  return (
    <nav className="glass glass--chrome md:hidden fixed bottom-0 left-0 right-0 z-30 safe-bottom">
      <div className="flex items-stretch justify-around max-w-6xl mx-auto px-2 py-1">
        {items.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center justify-center gap-1 min-h-[52px] py-2 text-xs font-medium transition-colors rounded-full ${
                active ? 'text-[var(--accent-ink)]' : 'text-[var(--text-2)]'
              }`}
            >
              <Icon
                size={24}
                weight={active ? 'fill' : 'regular'}
                className={active ? 'text-[var(--accent-ink)]' : 'text-[var(--text-2)]'}
              />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
