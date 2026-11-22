import { useCallback, useLayoutEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { House, Baby, CalendarBlank, Camera, MagnifyingGlass } from '@phosphor-icons/react'
import { useWorkspace } from '../contexts/WorkspaceContext'

const items = [
  { to: '/', label: 'Beranda', icon: House },
  { to: '/balita', label: 'Balita', icon: Baby },
  { to: '/jadwal', label: 'Jadwal', icon: CalendarBlank },
  { to: '/kegiatan', label: 'Kegiatan', icon: Camera },
]

export default function BottomNav() {
  const location = useLocation()
  const { openPalette, paletteOpen } = useWorkspace()
  const trackRef = useRef(null)
  const lensRef = useRef(null)
  const hasPositionedRef = useRef(false)

  const updateLens = useCallback(() => {
    const track = trackRef.current
    const lens = lensRef.current
    if (!track || !lens) return

    const activeEl = track.querySelector('[data-nav-active="true"]')
    if (!activeEl) {
      lens.style.opacity = '0'
      return
    }

    if (!hasPositionedRef.current) {
      lens.style.transition = 'none'
    } else {
      lens.style.transition =
        'left 380ms var(--spring), width 380ms var(--spring), top 380ms var(--spring), height 380ms var(--spring), opacity 200ms var(--ease)'
    }

    lens.style.left = `${activeEl.offsetLeft}px`
    lens.style.top = `${activeEl.offsetTop}px`
    lens.style.width = `${activeEl.offsetWidth}px`
    lens.style.height = `${activeEl.offsetHeight}px`
    lens.style.opacity = '1'

    if (!hasPositionedRef.current) {
      // Force reflow once so subsequent clicks animate smoothly
      void lens.offsetWidth
      hasPositionedRef.current = true
    }
  }, [])

  useLayoutEffect(() => {
    updateLens()
    const track = trackRef.current
    const ro = typeof ResizeObserver !== 'undefined' && track ? new ResizeObserver(updateLens) : null
    if (ro && track) ro.observe(track)
    window.addEventListener('resize', updateLens)

    return () => {
      if (ro) ro.disconnect()
      window.removeEventListener('resize', updateLens)
    }
  }, [location.pathname, paletteOpen, updateLens])

  return (
    <nav
      className="glass glass--thick glass--pill lg:hidden fixed left-3 right-3 z-40 max-w-md mx-auto"
      style={{ bottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
      aria-label="Navigasi Utama Mobile"
    >
      <div
        ref={trackRef}
        className="relative flex items-center justify-around px-1.5 py-1 gap-0.5"
      >
        {/* Sliding Liquid Glass Pill Indicator */}
        <span
          ref={lensRef}
          aria-hidden="true"
          className="absolute rounded-full pointer-events-none"
          style={{
            background: 'var(--fill)',
            boxShadow:
              'inset 0 1px 1px var(--rim-hi), inset 0 -1px 1px var(--rim-lo), 0 4px 12px -6px #00000033',
            border: '1px solid var(--rim-lo)',
            opacity: 0,
          }}
        />

        {items.map(({ to, label, icon: Icon }) => {
          const routeActive =
            location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
          const isHighlighted = !paletteOpen && routeActive

          return (
            <Link
              key={to}
              to={to}
              aria-current={routeActive ? 'page' : undefined}
              data-nav-active={isHighlighted ? 'true' : undefined}
              className={`relative z-10 flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[48px] py-1.5 text-[11px] font-bold transition-[color,transform] duration-200 active:scale-95 rounded-full ${
                isHighlighted
                  ? 'text-[var(--accent-ink)]'
                  : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              <Icon
                size={21}
                weight={isHighlighted ? 'fill' : 'regular'}
                className={isHighlighted ? 'text-[var(--accent-ink)]' : 'text-[var(--text-2)]'}
              />
              <span>{label}</span>
            </Link>
          )
        })}

        <button
          type="button"
          onClick={openPalette}
          data-nav-active={paletteOpen ? 'true' : undefined}
          aria-pressed={paletteOpen}
          className={`relative z-10 flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[48px] py-1.5 text-[11px] font-bold transition-[color,transform] duration-200 active:scale-95 rounded-full ${
            paletteOpen
              ? 'text-[var(--accent-ink)]'
              : 'text-[var(--text-2)] hover:text-[var(--text)]'
          }`}
          aria-label="Cari cepat"
        >
          <MagnifyingGlass
            size={21}
            weight={paletteOpen ? 'fill' : 'bold'}
            className={paletteOpen ? 'text-[var(--accent-ink)]' : 'text-[var(--text-2)]'}
          />
          <span>Cari</span>
        </button>
      </div>
    </nav>
  )
}
