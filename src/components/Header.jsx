import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Baby,
  Buildings,
  SignOut,
  Moon,
  Sun,
  MagnifyingGlass,
  Plus,
  Palette,
  Camera,
  CalendarBlank,
  Timer,
  DownloadSimple,
  Sparkle,
} from '@phosphor-icons/react'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace, WALLPAPERS } from '../contexts/WorkspaceContext'
import { usePwaInstall } from '../hooks/usePwaInstall'

function getBreadcrumb(pathname) {
  if (pathname === '/') return 'Beranda'
  if (pathname === '/balita') return 'Data Balita'
  if (pathname.endsWith('/ukur')) return 'Input Pengukuran'
  if (pathname.startsWith('/balita/')) return 'Detail Balita'
  if (pathname === '/jadwal') return 'Jadwal Posyandu'
  if (pathname === '/kegiatan') return 'Dokumentasi Kegiatan'
  if (pathname.startsWith('/kegiatan/')) return 'Detail Kegiatan'
  if (pathname.startsWith('/admin')) return 'Admin Posyandu & Kader'
  return 'Posyandu Ceria'
}

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, posyanduName, isAdmin, signOut } = useAuth()
  const {
    theme,
    toggleTheme,
    wallpaper,
    setWallpaper,
    glassMode,
    setGlassMode,
    openPalette,
    startTimer,
  } = useWorkspace()
  const { canInstall, installApp } = usePwaInstall()

  const [createOpen, setCreateOpen] = useState(false)
  const [appearOpen, setAppearOpen] = useState(false)
  const toolbarRef = useRef(null)

  useEffect(() => {
    const handleOutside = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setCreateOpen(false)
        setAppearOpen(false)
      }
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setCreateOpen(false)
        setAppearOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const pageTitle = getBreadcrumb(location.pathname)

  return (
    <header
      className="sticky top-0 z-30 lg:pl-[268px] lg:pr-6 pt-0 lg:pt-3.5"
      aria-label="Toolbar"
    >
      {/* Mobile & Tablet Header */}
      <div className="lg:hidden glass glass--chrome rounded-none px-4 py-2.5 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 min-h-[44px] min-w-0">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-purple to-pink text-white shrink-0 shadow-sm">
            <Baby size={20} weight="fill" />
          </span>
          <div className="min-w-0">
            <span className="font-heading font-extrabold text-sm bg-gradient-to-r from-purple to-pink bg-clip-text text-transparent block truncate">
              {pageTitle === 'Beranda' ? 'Posyandu Ceria' : pageTitle}
            </span>
            {posyanduName && (
              <span className="text-[11px] text-[var(--text-2)] flex items-center gap-1 truncate">
                <Buildings size={11} /> {posyanduName}
              </span>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={openPalette}
            className="inline-flex items-center justify-center w-11 h-11 rounded-full text-[var(--text-2)] hover:bg-[var(--fill-hover)]"
            aria-label="Pencarian Cepat"
            title="Cari (⌘K)"
          >
            <MagnifyingGlass size={20} />
          </button>

          {canInstall && (
            <button
              type="button"
              onClick={installApp}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)]"
              aria-label="Pasang Aplikasi"
              title="Pasang App"
            >
              <DownloadSimple size={20} weight="bold" />
            </button>
          )}

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
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center justify-center w-11 h-11 rounded-full text-[var(--text-2)] hover:bg-[var(--fill-hover)]"
            aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full text-[var(--text-2)] hover:bg-[var(--fill-hover)]"
              aria-label="Keluar"
            >
              <SignOut size={20} />
            </button>
          ) : (
            <Link
              to="/login"
              className="btn btn--accent btn--sm !min-h-[38px] !px-3.5 text-xs"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>

      {/* Desktop Floating Utility Toolbar */}
      <div className="hidden lg:flex items-center justify-between gap-4 max-w-[1280px] mx-auto px-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="glass glass--chrome glass--pill px-4 py-2 text-xs font-bold text-[var(--text-2)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <span>{pageTitle}</span>
            {posyanduName && (
              <>
                <span className="text-[var(--text-3)]">·</span>
                <span className="text-[var(--text)] truncate max-w-[200px]">{posyanduName}</span>
              </>
            )}
          </span>
        </div>

        <div
          ref={toolbarRef}
          className="relative glass glass--chrome glass--pill px-2 py-1.5 flex items-center gap-1"
        >
          {/* Command Palette Trigger */}
          <button
            type="button"
            onClick={openPalette}
            className="min-h-[40px] px-3.5 rounded-full bg-[var(--fill)] hover:bg-[var(--fill-2)] text-xs font-semibold text-[var(--text-2)] hover:text-[var(--text)] flex items-center gap-2 transition-colors"
            aria-label="Pencarian cepat (⌘K)"
          >
            <MagnifyingGlass size={16} weight="bold" />
            <span className="hidden lg:inline">Cari balita, menu...</span>
            <kbd className="px-1.5 py-0.5 text-[10px] rounded-md bg-[var(--glass-solid)] text-[var(--text-2)] border border-[var(--sep)] font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Quick Create Popover Button */}
          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setCreateOpen((v) => !v)
                  setAppearOpen(false)
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text)] hover:bg-[var(--fill)] transition-colors"
                aria-label="Buat baru"
                aria-expanded={createOpen}
                aria-haspopup="menu"
                title="Buat Baru"
              >
                <Plus size={19} weight="bold" />
              </button>

              {createOpen && (
                <div
                  role="menu"
                  className="glass glass--thick animate-island absolute right-0 mt-2 w-60 rounded-2xl p-2 flex flex-col gap-1 z-50"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setCreateOpen(false)
                      navigate('/balita')
                    }}
                    className="flex items-center gap-2.5 px-3 min-h-[42px] rounded-xl text-xs font-semibold text-[var(--text)] hover:bg-[var(--fill)] text-left transition-colors"
                  >
                    <Baby size={17} className="text-blue-500" weight="duotone" />
                    Data &amp; Pendaftaran Balita
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setCreateOpen(false)
                      navigate('/kegiatan')
                    }}
                    className="flex items-center gap-2.5 px-3 min-h-[42px] rounded-xl text-xs font-semibold text-[var(--text)] hover:bg-[var(--fill)] text-left transition-colors"
                  >
                    <Camera size={17} className="text-pink" weight="duotone" />
                    Dokumentasi Kegiatan Baru
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setCreateOpen(false)
                      navigate('/jadwal')
                    }}
                    className="flex items-center gap-2.5 px-3 min-h-[42px] rounded-xl text-xs font-semibold text-[var(--text)] hover:bg-[var(--fill)] text-left transition-colors"
                  >
                    <CalendarBlank size={17} className="text-[var(--accent-ink)]" weight="duotone" />
                    Agenda Jadwal Posyandu
                  </button>
                  <div className="my-1 border-t border-[var(--sep)]" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setCreateOpen(false)
                      startTimer(25)
                    }}
                    className="flex items-center gap-2.5 px-3 min-h-[42px] rounded-xl text-xs font-semibold text-[var(--accent-ink)] hover:bg-[var(--accent-soft)] text-left transition-colors"
                  >
                    <Timer size={17} weight="fill" />
                    Mulai Sesi Layanan (25m)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Appearance Customizer Popover Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setAppearOpen((v) => !v)
                setCreateOpen(false)
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--fill)] transition-colors"
              aria-label="Atur Tampilan & Wallpaper"
              aria-expanded={appearOpen}
              aria-haspopup="dialog"
              title="Tampilan & Liquid Glass"
            >
              <Palette size={19} weight="duotone" />
            </button>

            {appearOpen && (
              <div
                role="dialog"
                aria-label="Pengaturan Tampilan Liquid Glass"
                className="glass glass--thick animate-island absolute right-0 mt-2 w-72 rounded-2xl p-4 flex flex-col gap-3.5 z-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs text-[var(--text)] flex items-center gap-1.5">
                    <Sparkle size={15} weight="fill" className="text-[var(--accent-ink)]" />
                    Tampilan Liquid Glass
                  </span>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="px-2.5 py-1 rounded-full bg-[var(--fill)] text-[11px] font-bold text-[var(--text)] flex items-center gap-1"
                  >
                    {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                    {theme === 'dark' ? 'Terang' : 'Gelap'}
                  </button>
                </div>

                {/* Wallpapers */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-[var(--text-2)]">
                    Latar Belakang (Wallpaper)
                  </span>
                  <div className="flex items-center gap-2">
                    {WALLPAPERS.map((w) => {
                      const active = wallpaper === w.id
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setWallpaper(w.id)}
                          aria-label={`Wallpaper ${w.label}`}
                          title={w.label}
                          className={`w-9 h-9 rounded-full transition-transform ${
                            active ? 'ring-2 ring-[var(--accent-ink)] ring-offset-2 scale-110' : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{ background: w.swatch }}
                        />
                      )
                    })}
                  </div>
                </div>

                {/* Glass Mode */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold text-[var(--text-2)]">
                    Efek Kaca
                  </span>
                  <div className="seg w-full">
                    <button
                      type="button"
                      onClick={() => setGlassMode('tinted')}
                      aria-pressed={glassMode === 'tinted'}
                      className="seg__btn flex-1"
                    >
                      Tinted Glass
                    </button>
                    <button
                      type="button"
                      onClick={() => setGlassMode('clear')}
                      aria-pressed={glassMode === 'clear'}
                      className="seg__btn flex-1"
                    >
                      Clear Glass
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Direct Theme Quick Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--fill)] transition-colors"
            aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
            title={theme === 'dark' ? 'Tema Terang' : 'Tema Gelap'}
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {/* PWA Install Button */}
          {canInstall && (
            <button
              type="button"
              onClick={installApp}
              className="min-h-[38px] px-3 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] hover:bg-[var(--fill-2)] text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Pasang Posyandu Ceria sebagai Aplikasi"
            >
              <DownloadSimple size={16} weight="bold" />
              <span>Pasang</span>
            </button>
          )}

          {/* Sign Out / Login */}
          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="min-h-[40px] px-3 rounded-full text-xs font-semibold text-[var(--text-2)] hover:text-rose-500 hover:bg-rose-500/10 flex items-center gap-1.5 transition-colors"
              aria-label="Keluar"
            >
              <SignOut size={17} />
              <span>Keluar</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="btn btn--accent btn--sm !min-h-[38px] !px-4 text-xs"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
