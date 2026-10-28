import { Link, useLocation, useNavigate } from 'react-router-dom'
import { House, Baby, CalendarBlank, SignOut, Buildings, Camera, DownloadSimple } from '@phosphor-icons/react'
import { useAuth } from '../contexts/AuthContext'
import { usePwaInstall } from '../hooks/usePwaInstall'

const navItems = [
  { to: '/', label: 'Beranda', icon: House },
  { to: '/balita', label: 'Data Balita', icon: Baby },
  { to: '/jadwal', label: 'Jadwal', icon: CalendarBlank },
  { to: '/kegiatan', label: 'Kegiatan', icon: Camera },
]

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { posyanduName, isAdmin, signOut, user } = useAuth()
  const { canInstall, installApp } = usePwaInstall()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-purple-100">
      <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto gap-3">
        <Link to="/" className="flex items-center gap-2 min-h-[48px] min-w-0">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple to-pink text-white shrink-0">
            <Baby size={22} weight="fill" />
          </span>
          <div className="min-w-0">
            <span className="font-heading font-bold text-base md:text-lg bg-gradient-to-r from-purple to-pink bg-clip-text text-transparent block truncate">
              Posyandu Ceria
            </span>
            {posyanduName && (
              <span className="text-xs text-gray-500 flex items-center gap-1 truncate">
                <Buildings size={12} /> {posyanduName}
              </span>
            )}
            {isAdmin && !posyanduName && (
              <span className="text-xs text-purple font-medium">Admin Desa</span>
            )}
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 min-h-[48px] rounded-xl font-medium transition-colors ${
                  active ? 'bg-purple-50 text-purple' : 'text-gray-600 hover:bg-gray-100'
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
              className={`flex items-center gap-2 px-3 min-h-[48px] rounded-xl font-medium transition-colors ${
                location.pathname.startsWith('/admin') ? 'bg-purple-50 text-purple' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Buildings size={20} /> Admin
            </Link>
          )}
          {canInstall && (
            <button
              onClick={installApp}
              className="flex items-center gap-1.5 px-3 min-h-[42px] rounded-xl font-semibold bg-purple-50 text-purple hover:bg-purple-100 transition-colors text-sm cursor-pointer"
              title="Pasang Posyandu Ceria ke HP / Komputer"
            >
              <DownloadSimple size={18} weight="bold" />
              <span>Pasang App</span>
            </button>
          )}

          {user ? (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 min-h-[48px] rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <SignOut size={20} /> Keluar
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 min-h-[42px] rounded-xl font-semibold bg-purple text-white hover:bg-purple-600 transition-colors text-sm shadow-xs"
            >
              Masuk
            </Link>
          )}
        </nav>

        {/* Mobile actions */}
        <div className="md:hidden flex items-center gap-1">
          {isAdmin && (
            <Link
              to="/admin/posyandu"
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-purple hover:bg-purple-50"
              aria-label="Admin"
            >
              <Buildings size={22} />
            </Link>
          )}
          {canInstall && (
            <button
              onClick={installApp}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50 text-purple hover:bg-purple-100 transition-colors cursor-pointer"
              title="Pasang Posyandu Ceria ke HP / Komputer"
              aria-label="Pasang Aplikasi"
            >
              <DownloadSimple size={20} weight="bold" />
            </button>
          )}

          {user ? (
            <button
              onClick={handleSignOut}
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-gray-600 hover:bg-gray-100"
              aria-label="Keluar"
            >
              <SignOut size={22} />
            </button>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-lg bg-purple text-white text-xs font-semibold"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
