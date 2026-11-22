import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MagnifyingGlass,
  House,
  Baby,
  CalendarBlank,
  Camera,
  Buildings,
  Timer,
  Sun,
  Moon,
  Scales,
  ArrowRight,
  X,
} from '@phosphor-icons/react'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

export default function CommandPalette() {
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const {
    paletteOpen,
    closePalette,
    theme,
    toggleTheme,
    startTimer,
  } = useWorkspace()

  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [loadingData, setLoadingData] = useState(false)
  const [cache, setCache] = useState({ balita: [], kegiatan: [], jadwal: [], loaded: false })

  const inputRef = useRef(null)

  const handleClose = () => {
    setQuery('')
    setActiveIndex(0)
    closePalette()
  }

  // Fetch data when palette opens (if authenticated)
  useEffect(() => {
    if (!paletteOpen) return
    const t = setTimeout(() => inputRef.current?.focus(), 30)

    if (!user || cache.loaded) return () => clearTimeout(t)
    let mounted = true
    const loadSearchable = async () => {
      setLoadingData(true)
      const [bRes, kRes, jRes] = await Promise.allSettled([
        api('/api/balita'),
        api('/api/kegiatan'),
        api('/api/jadwal'),
      ])
      if (!mounted) return
      setCache({
        balita: bRes.status === 'fulfilled' ? bRes.value.data || [] : [],
        kegiatan: kRes.status === 'fulfilled' ? kRes.value.data || [] : [],
        jadwal: jRes.status === 'fulfilled' ? jRes.value.data || [] : [],
        loaded: true,
      })
      setLoadingData(false)
    }
    loadSearchable()
    return () => {
      mounted = false
      clearTimeout(t)
    }
  }, [paletteOpen, user, cache.loaded])

  const quickCommands = useMemo(() => {
    const base = [
      { id: 'nav-home', group: 'Navigasi & Aksi Cepat', title: 'Beranda Dashboard', subtitle: 'Ringkasan bento workspace posyandu', icon: House, action: () => navigate('/') },
      { id: 'nav-balita', group: 'Navigasi & Aksi Cepat', title: 'Data Balita', subtitle: 'Daftar balita, filter usia, & penimbangan', icon: Baby, action: () => navigate('/balita') },
      { id: 'nav-jadwal', group: 'Navigasi & Aksi Cepat', title: 'Jadwal Posyandu', subtitle: 'Lihat agenda pelayanan terdekat', icon: CalendarBlank, action: () => navigate('/jadwal') },
      { id: 'nav-kegiatan', group: 'Navigasi & Aksi Cepat', title: 'Dokumentasi Kegiatan', subtitle: 'Foto watermark, AI narasi & bagikan', icon: Camera, action: () => navigate('/kegiatan') },
    ]
    if (isAdmin) {
      base.push({
        id: 'nav-admin',
        group: 'Navigasi & Aksi Cepat',
        title: 'Admin Posyandu & Kader',
        subtitle: 'Validasi kader & master unit posyandu',
        icon: Buildings,
        action: () => navigate('/admin/posyandu'),
      })
    }
    base.push(
      {
        id: 'act-focus',
        group: 'Navigasi & Aksi Cepat',
        title: 'Mulai Sesi Layanan (25 Menit)',
        subtitle: 'Aktifkan timer Dynamic Island untuk meja posyandu',
        icon: Timer,
        action: () => startTimer(25),
      },
      {
        id: 'act-theme',
        group: 'Navigasi & Aksi Cepat',
        title: theme === 'dark' ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap',
        subtitle: 'Sesuaikan tampilan Liquid Glass',
        icon: theme === 'dark' ? Sun : Moon,
        action: () => toggleTheme(),
      }
    )
    return base
  }, [isAdmin, theme, navigate, startTimer, toggleTheme])

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    const results = []

    const matchingCommands = quickCommands.filter(
      (c) =>
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q)
    )
    results.push(...matchingCommands)

    if (cache.balita.length > 0) {
      const matchingBalita = cache.balita
        .filter((b) => {
          if (!q) return true
          return (
            b.nama?.toLowerCase().includes(q) ||
            b.nik?.toLowerCase().includes(q) ||
            b.nama_ibu?.toLowerCase().includes(q) ||
            b.posyandu_name?.toLowerCase().includes(q)
          )
        })
        .slice(0, q ? 6 : 3)
        .map((b) => ({
          id: `balita-${b.id}`,
          group: 'Data Balita',
          title: b.nama,
          subtitle: `Ibu: ${b.nama_ibu || '-'}${b.latest_bb ? ` · BB ${b.latest_bb} kg` : ' · Belum diukur'}`,
          icon: Baby,
          secondaryAction: {
            label: 'Timbang',
            icon: Scales,
            onClick: () => navigate(`/balita/${b.id}/ukur`),
          },
          action: () => navigate(`/balita/${b.id}`),
        }))
      results.push(...matchingBalita)
    }

    if (cache.kegiatan.length > 0) {
      const matchingKegiatan = cache.kegiatan
        .filter((k) => {
          if (!q) return true
          return (
            k.judul?.toLowerCase().includes(q) ||
            k.lokasi?.toLowerCase().includes(q) ||
            k.posyandu_name?.toLowerCase().includes(q)
          )
        })
        .slice(0, q ? 4 : 2)
        .map((k) => ({
          id: `kegiatan-${k.id}`,
          group: 'Dokumentasi Kegiatan',
          title: k.judul,
          subtitle: `${k.tanggal_kegiatan || ''} ${k.lokasi ? `· ${k.lokasi}` : ''}`.trim(),
          icon: Camera,
          action: () => navigate(`/kegiatan/${k.id}`),
        }))
      results.push(...matchingKegiatan)
    }

    if (cache.jadwal.length > 0 && q) {
      const matchingJadwal = cache.jadwal
        .filter((j) => j.judul?.toLowerCase().includes(q) || j.tempat?.toLowerCase().includes(q))
        .slice(0, 3)
        .map((j) => ({
          id: `jadwal-${j.id}`,
          group: 'Jadwal Posyandu',
          title: j.judul,
          subtitle: `${j.tanggal || ''} ${j.waktu ? `· ${j.waktu}` : ''} ${j.tempat ? `· ${j.tempat}` : ''}`,
          icon: CalendarBlank,
          action: () => navigate('/jadwal'),
        }))
      results.push(...matchingJadwal)
    }

    return results
  }, [query, quickCommands, cache, navigate])

  if (!paletteOpen) return null

  const runItem = (item) => {
    if (!item) return
    item.action()
    handleClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      handleClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (filteredItems.length ? (prev + 1) % filteredItems.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) =>
        filteredItems.length ? (prev - 1 + filteredItems.length) % filteredItems.length : 0
      )
    } else if (e.key === 'Enter' && filteredItems[activeIndex]) {
      e.preventDefault()
      runItem(filteredItems[activeIndex])
    }
  }

  // Group items for rendering headers
  const grouped = []
  let lastGroup = null
  filteredItems.forEach((item, idx) => {
    if (item.group !== lastGroup) {
      grouped.push({ type: 'header', label: item.group })
      lastGroup = item.group
    }
    grouped.push({ type: 'item', item, idx })
  })

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh] px-4 bg-[var(--scrim)] backdrop-blur-xs animate-fadeIn"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette Pencarian Cepat"
    >
      <div
        className="glass glass--thick w-full max-w-xl rounded-[26px] overflow-hidden flex flex-col max-h-[76vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--sep)]">
          <MagnifyingGlass size={20} className="text-[var(--accent-ink)] shrink-0" weight="bold" />
          <label htmlFor="command-palette-input" className="sr-only">
            Cari balita, kegiatan, jadwal, atau perintah
          </label>
          <input
            ref={inputRef}
            id="command-palette-input"
            name="command_search"
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-list"
            aria-label="Cari balita, kegiatan, jadwal, atau menu navigasi"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            placeholder="Cari balita, NIK, kegiatan, jadwal, atau perintah..."
            className="flex-1 bg-transparent text-sm md:text-base text-[var(--text)] placeholder:text-[var(--text-3)] min-h-[38px] px-1 rounded-lg focus-visible:outline-2 focus-visible:outline-[var(--accent-ink)]"
          />
          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-2)] hover:bg-[var(--fill)] transition-colors"
            aria-label="Tutup pencarian"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Results List */}
        <div
          id="command-palette-list"
          role="listbox"
          className="overflow-y-auto p-2.5 flex flex-col gap-1"
        >
          {loadingData && (
            <p className="text-xs text-[var(--text-3)] px-3 py-2">Memuat indeks data posyandu...</p>
          )}

          {grouped.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--text-3)]">
              Tidak ada hasil cocok untuk &ldquo;{query}&rdquo;.
            </div>
          ) : (
            grouped.map((entry, i) => {
              if (entry.type === 'header') {
                return (
                  <div
                    key={`h-${entry.label}-${i}`}
                    className="px-3 pt-2.5 pb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-3)]"
                  >
                    {entry.label}
                  </div>
                )
              }

              const { item, idx } = entry
              const Icon = item.icon
              const isSelected = idx === activeIndex

              return (
                <div
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl transition-colors cursor-pointer min-h-[48px] ${
                    isSelected
                      ? 'bg-[var(--accent-soft)] text-[var(--text)]'
                      : 'hover:bg-[var(--fill-hover)] text-[var(--text)]'
                  }`}
                  onClick={() => runItem(item)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--fill)] text-[var(--accent-ink)]'
                      }`}
                    >
                      <Icon size={18} weight="duotone" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-heading font-bold text-sm truncate">{item.title}</p>
                      <p className="text-xs text-[var(--text-2)] truncate">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.secondaryAction && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          item.secondaryAction.onClick()
                          handleClose()
                        }}
                        className="btn btn--glass btn--sm !min-h-[34px] !px-2.5 text-xs"
                      >
                        <item.secondaryAction.icon size={14} weight="bold" />
                        <span>{item.secondaryAction.label}</span>
                      </button>
                    )}
                    <ArrowRight
                      size={16}
                      className={isSelected ? 'text-[var(--accent-ink)]' : 'text-[var(--text-3)]'}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-2.5 border-t border-[var(--sep)] flex items-center justify-between text-[11px] text-[var(--text-3)]">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigasi</span>
            <span>↵ Buka</span>
            <span>Esc Tutup</span>
          </div>
          <span className="hidden sm:inline">Pintasan: ⌘K / Ctrl+K</span>
        </div>
      </div>
    </div>
  )
}
