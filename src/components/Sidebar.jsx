import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  House,
  Baby,
  CalendarBlank,
  Camera,
  Buildings,
  Timer,
  Sun,
  Moon,
  SignOut,
} from '@phosphor-icons/react'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'

export default function Sidebar() {
  const location = useLocation()
  const { user, isAdmin, posyanduName, signOut } = useAuth()
  const { theme, toggleTheme, startTimer, hasActiveSession } = useWorkspace()
  const trackRef = useRef(null)
  const lensRef = useRef(null)

  const items = [
    { to: '/', label: 'Beranda', icon: House },
    { to: '/balita', label: 'Data Balita', icon: Baby },
    { to: '/jadwal', label: 'Jadwal', icon: CalendarBlank },
    { to: '/kegiatan', label: 'Kegiatan', icon: Camera },
    ...(isAdmin ? [{ to: '/admin/posyandu', label: 'Admin Desa', icon: Buildings }] : []),
  ]

  useEffect(() => {
    const track = trackRef.current
    const lens = lensRef.current
    if (!track || !lens) return
    const active = track.querySelector('[aria-current="page"]')
    if (!active) {
      lens.style.opacity = '0'
      return
    }
    lens.style.opacity = '1'
    lens.style.top = `${active.offsetTop}px`
    lens.style.height = `${active.offsetHeight}px`
  }, [location.pathname])

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'Pengunjung'
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || '')
    .join('')

  return (
    <aside
      className="glass glass--chrome hidden lg:flex fixed top-[14px] bottom-[14px] left-[14px] w-[244px] rounded-[30px] flex-col justify-between gap-4 p-4 z-30"
      aria-label="Workspace Posyandu"
    >
      <div className="flex flex-col gap-5 overflow-y-auto pr-0.5">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2.5 px-2 min-h-[44px]"
          aria-label="Posyandu Ceria — Beranda"
          title="Posyandu Ceria"
        >
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-purple to-pink text-white shrink-0 shadow-md">
            <Baby size={20} weight="fill" />
          </span>
          <div className="min-w-0">
            <span className="font-heading font-extrabold text-base bg-gradient-to-r from-purple to-pink bg-clip-text text-transparent block truncate">
              Posyandu Ceria
            </span>
            <span className="text-[11px] font-medium text-[var(--text-3)] block truncate">
              Workspace Kader & Desa
            </span>
          </div>
        </Link>

        {/* Primary Navigation */}
        <nav ref={trackRef} className="relative flex flex-col gap-1" aria-label="Navigasi Utama Desktop">
          <span
            ref={lensRef}
            aria-hidden="true"
            className="absolute left-0 right-0 rounded-full transition-all duration-300 pointer-events-none"
            style={{
              background: 'var(--fill)',
              boxShadow: 'inset 0 1px 1px var(--rim-mid), 0 4px 10px -6px #00000033',
              opacity: 0,
              transitionTimingFunction: 'var(--spring)',
            }}
          />
          {items.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                title={label}
                className={`relative z-10 flex items-center gap-3 min-h-[44px] px-3.5 rounded-full font-semibold text-sm transition-colors ${
                  active ? 'text-[var(--accent-ink)]' : 'text-[var(--text-2)] hover:text-[var(--text)]'
                }`}
              >
                <Icon size={20} weight={active ? 'fill' : 'regular'} />
                <span className="truncate">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Pinned Shortcuts (TERSEMAT) */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--sep)]">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]">
            Tersemat
          </p>
          <Link
            to="/balita"
            title="Cari & Timbang Balita"
            className="flex items-center gap-2.5 min-h-[40px] px-3 rounded-full text-xs font-semibold text-[var(--text-2)] hover:bg-[var(--fill-hover)] hover:text-[var(--text)] transition-colors"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <span className="truncate">Cari &amp; Timbang Balita</span>
          </Link>
          <Link
            to="/kegiatan"
            title="Galeri & AI Narasi"
            className="flex items-center gap-2.5 min-h-[40px] px-3 rounded-full text-xs font-semibold text-[var(--text-2)] hover:bg-[var(--fill-hover)] hover:text-[var(--text)] transition-colors"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-pink shrink-0" />
            <span className="truncate">Galeri &amp; AI Narasi</span>
          </Link>
          <button
            type="button"
            onClick={() => startTimer(25)}
            title="Mulai sesi layanan 25 menit"
            className="flex items-center gap-2.5 min-h-[40px] px-3 rounded-full text-xs font-semibold text-[var(--text-2)] hover:bg-[var(--fill-hover)] hover:text-[var(--text)] transition-colors text-left"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                hasActiveSession ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            <span className="truncate flex-1">
              {hasActiveSession ? 'Sesi Meja Aktif' : 'Sesi Meja Layanan'}
            </span>
            <Timer size={14} className="text-[var(--text-3)] shrink-0" />
          </button>
        </div>
      </div>

      {/* Bottom Profile Card */}
      <div className="pt-2 border-t border-[var(--sep)]">
        {user ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-[var(--fill)]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-purple to-pink text-white font-heading font-bold text-xs flex items-center justify-center shrink-0">
                {initials || 'K'}
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[var(--glass-solid)]"
                  title="Online"
                />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-bold text-xs text-[var(--text)] truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-[var(--text-2)] truncate">
                  {posyanduName || (isAdmin ? 'Admin Desa' : 'Kader Posyandu')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-2)] hover:bg-[var(--fill-2)] transition-colors"
                aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
                title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                type="button"
                onClick={signOut}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-2)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                aria-label="Keluar akun"
                title="Keluar"
              >
                <SignOut size={16} />
              </button>
            </div>
          </div>
        ) : (
          <Link
            to="/login"
            className="btn btn--accent btn--sm w-full"
          >
            Masuk Kader / Admin
          </Link>
        )}
      </div>
    </aside>
  )
}
