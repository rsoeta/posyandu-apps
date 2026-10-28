import { Link, useLocation } from 'react-router-dom'
import { House, Baby, CalendarBlank } from '@phosphor-icons/react'

const navItems = [
  { to: '/', label: 'Beranda', icon: House },
  { to: '/balita', label: 'Data Balita', icon: Baby },
  { to: '/jadwal', label: 'Jadwal', icon: CalendarBlank },
]

export default function Header() {
  const location = useLocation()
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-purple-100">
      <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
        <Link to="/" className="flex items-center gap-2 min-h-[48px]">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple to-pink text-white">
            <Baby size={22} weight="fill" />
          </span>
          <span className="font-heading font-bold text-lg bg-gradient-to-r from-purple to-pink bg-clip-text text-transparent">
            Posyandu Ceria
          </span>
        </Link>
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 min-h-[48px] rounded-xl font-medium transition-colors ${
                  active ? 'bg-purple-50 text-purple' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} weight={active ? 'fill' : 'regular'} />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
