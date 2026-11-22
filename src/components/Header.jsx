import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Baby, House, CalendarBlank, Buildings, SignOut, Moon, Sun } from '@phosphor-icons/react'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'

const navItems = [
  { to: '/', label: 'Beranda', icon: House },
  { to: '/balita', label: 'Data Balita', icon: Baby },
  { to: '/jadwal', label: 'Jadwal', icon: CalendarBlank },
]

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { posyanduName, isAdmin, signOut } = useAuth()
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('posyandu:theme') || 'light' } catch { return 'light' }
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('posyandu:theme', theme) } catch { /* ignore */ }
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="glass glass--chrome sticky top-0 z-30">
      <div className="flex items-center justify-between gap-3 px-4 py-3 max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2 min-h-[44px] min-w-0">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple to-pink text-white shrink-0 shadow-lg">
            <Baby size={22} weight="fill" />
          </span>
          <div className="min-w-0">
            <span className="font-heading font-bold text-base md:text-lg bg-gradient-to-r from-purple to-pink bg-clip-text text-transparent block truncate">
              Posyandu Ceria
            </span>
            {posyanduName && (
              <span className="text-xs text-[var(--text-2)] flex items-center gap-1 truncate">
                <Buildings size={12} /> {posyanduName}
              </span>
            )}
            {isAdmin && !posyanduName && (
              <span className="text-xs text-[var(--accent-ink)] font-medium">Admin Desa</span>
            )}
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 min-h-[44px] rounded-full font-medium transition-colors ${
                  active ? 'bg-[var(--fill)] text-[var(--accent-ink)]' : 'text-[var(--text-2)] hover:bg-[var(--fill-hover)] hover:text-[var(--text)]'
                }`}
              >
                <Icon size={20} weight={active ? 'fill' : 'regular'} />
                {label}
              </Link>
            )
          })}
          {isAdmin && (
            <Link
              to="/admin/posyandu"
              className={`flex items-center gap-2 px-3 min-h-[44px] rounded-full font-medium transition-colors ${
                location.pathname.startsWith('/admin') ? 'bg-[var(--fill)] text-[var(--accent-ink)]' : 'text-[var(--text-2)] hover:bg-[var(--fill-hover)] hover:text-[var(--text)]'
              }`}
            >
              <Buildings size={20} /> Admin
            </Link>
          )}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-11 h-11 rounded-full text-[var(--text-2)] hover:bg-[var(--fill-hover)] transition-colors"
            aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 min-h-[44px] rounded-full font-medium text-[var(--text-2)] hover:bg-[var(--fill-hover)] transition-colors"
          >
            <SignOut size={20} /> Keluar
          </button>
        </nav>

        <div className="md:hidden flex items-center gap-1">
          {isAdmin && (
            <Link
              to="/admin/posyandu"
              className="inline-flex items-center justify-center w-11 h-11 rounded-full text-[var(--accent-ink)] hover:bg-[var(--fill-hover)]"
              aria-label="Admin"
            >
              <Buildings size={20} />
            </Link>
          )}
          <button
            onClick={toggleTheme}
            className="inline-flex items-center justify-center w-11 h-11 rounded-full text-[var(--text-2)] hover:bg-[var(--fill-hover)]"
            aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center justify-center w-11 h-11 rounded-full text-[var(--text-2)] hover:bg-[var(--fill-hover)]"
            aria-label="Keluar"
          >
            <SignOut size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
