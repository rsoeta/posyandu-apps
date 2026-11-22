import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { House, Baby, CalendarBlank, Buildings } from '@phosphor-icons/react'
import { useAuth } from '../contexts/AuthContext'

export default function Sidebar() {
  const location = useLocation()
  const { isAdmin } = useAuth()
  const trackRef = useRef(null)
  const lensRef = useRef(null)

  const items = [
    { to: '/', label: 'Beranda', icon: House },
    { to: '/balita', label: 'Data Balita', icon: Baby },
    { to: '/jadwal', label: 'Jadwal', icon: CalendarBlank },
    ...(isAdmin ? [{ to: '/admin/posyandu', label: 'Admin', icon: Buildings }] : []),
  ]

  useEffect(() => {
    const track = trackRef.current
    const lens = lensRef.current
    if (!track || !lens) return
    const active = track.querySelector('[aria-current="page"]')
    if (!active) { lens.style.opacity = '0'; return }
    const r = active.getBoundingClientRect()
    const tr = track.getBoundingClientRect()
    lens.style.opacity = '1'
    lens.style.top = `${active.offsetTop}px`
    lens.style.height = `${active.offsetHeight}px`
  }, [location.pathname])

  return (
    <aside className="glass glass--chrome hidden md:flex fixed top-[14px] bottom-[14px] left-[14px] w-[232px] flex-col gap-4 p-4 z-30">
      <Link to="/" className="flex items-center gap-2 px-2 min-h-[44px]">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-purple to-pink text-white shrink-0">
          <Baby size={18} weight="fill" />
        </span>
        <span className="font-heading font-bold text-base bg-gradient-to-r from-purple to-pink bg-clip-text text-transparent">
          Posyandu Ceria
        </span>
      </Link>
      <nav ref={trackRef} className="relative flex flex-col gap-1" aria-label="Main">
        <span
          ref={lensRef}
          aria-hidden="true"
          className="absolute left-0 right-0 rounded-full transition-all duration-300 pointer-events-none"
          style={{
            background: 'var(--fill)',
            boxShadow: 'inset 0 1px 1px var(--rim-mid), 0 4px 10px -6px #00000033',
            opacity: 0,
          }}
        />
        {items.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={`relative z-10 flex items-center gap-3 h-11 px-3 rounded-full font-medium transition-colors ${
                active ? 'text-[var(--accent-ink)]' : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              <Icon size={20} weight={active ? 'fill' : 'regular'} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
