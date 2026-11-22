import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'

const WorkspaceContext = createContext(null)

export const WALLPAPERS = [
  { id: 'lavender', label: 'Lavender', swatch: 'linear-gradient(135deg, #7c3aed, #ff4fa3)' },
  { id: 'sakura', label: 'Sakura', swatch: 'linear-gradient(135deg, #f43f5e, #ec4899)' },
  { id: 'aurora', label: 'Aurora', swatch: 'linear-gradient(135deg, #2563eb, #06b6d4)' },
  { id: 'mint', label: 'Mint', swatch: 'linear-gradient(135deg, #10b981, #14b8a6)' },
  { id: 'senja', label: 'Senja', swatch: 'linear-gradient(135deg, #f97316, #f59e0b)' },
]

export const POSYANDU_STATIONS = [
  'Meja 1: Pendaftaran Ibu & Balita',
  'Meja 2: Penimbangan & Pengukuran TB',
  'Meja 3: Pencatatan KMS & Grafik Gizi',
  'Meja 4: Penyuluhan Gizi & PMT',
  'Meja 5: Pelayanan Kesehatan & Imunisasi',
]

const todayKey = () => new Date().toISOString().slice(0, 10)

const loadDailyStats = () => {
  try {
    const raw = localStorage.getItem('posyandu:focusStats')
    if (!raw) return { date: todayKey(), sessions: 0, focusedSec: 0 }
    const parsed = JSON.parse(raw)
    if (parsed.date !== todayKey()) {
      return { date: todayKey(), sessions: 0, focusedSec: 0 }
    }
    return parsed
  } catch {
    return { date: todayKey(), sessions: 0, focusedSec: 0 }
  }
}

export function WorkspaceProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('posyandu:theme') || 'light' } catch { return 'light' }
  })
  const [wallpaper, setWallpaper] = useState(() => {
    try { return localStorage.getItem('posyandu:wall') || 'lavender' } catch { return 'lavender' }
  })
  const [glassMode, setGlassMode] = useState(() => {
    try { return localStorage.getItem('posyandu:glass') || 'tinted' } catch { return 'tinted' }
  })

  // Command Palette state
  const [paletteOpen, setPaletteOpen] = useState(false)

  // Posyandu Service Timer (Dynamic Island) state
  const [timerDuration, setTimerDuration] = useState(25)
  const [remainingSec, setRemainingSec] = useState(25 * 60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [hasActiveSession, setHasActiveSession] = useState(false)
  const [station, setStation] = useState(POSYANDU_STATIONS[1])
  const [dailyStats, setDailyStats] = useState(loadDailyStats)
  const [islandExpanded, setIslandExpanded] = useState(false)
  const [islandNotice, setIslandNotice] = useState(null)

  const noticeTimeoutRef = useRef(null)

  // Sync theme, wallpaper, glassMode to documentElement + meta theme-color
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.dataset.wall = wallpaper
    root.dataset.glass = glassMode
    try {
      localStorage.setItem('posyandu:theme', theme)
      localStorage.setItem('posyandu:wall', wallpaper)
      localStorage.setItem('posyandu:glass', glassMode)
    } catch { /* ignore */ }

    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0f0d18' : '#6C2BD9')
    }
  }, [theme, wallpaper, glassMode])

  // Persist daily focus stats
  useEffect(() => {
    try {
      localStorage.setItem('posyandu:focusStats', JSON.stringify(dailyStats))
    } catch { /* ignore */ }
  }, [dailyStats])

  // Global keyboard shortcut: Cmd+K / Ctrl+K for Command Palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const notifyIsland = useCallback((title, subtitle = '', type = 'info') => {
    setIslandNotice({ title, subtitle, type, id: Date.now() })
    if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current)
    noticeTimeoutRef.current = setTimeout(() => {
      setIslandNotice(null)
    }, 4500)
  }, [])

  const dismissNotice = useCallback(() => {
    if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current)
    setIslandNotice(null)
  }, [])

  // Service Timer Countdown Tick
  useEffect(() => {
    if (!timerRunning) return
    const id = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          setTimerRunning(false)
          setHasActiveSession(false)
          setDailyStats((s) => {
            const base = s.date === todayKey() ? s : { date: todayKey(), sessions: 0, focusedSec: 0 }
            return {
              date: todayKey(),
              sessions: base.sessions + 1,
              focusedSec: base.focusedSec + timerDuration * 60,
            }
          })
          notifyIsland('Sesi Layanan Selesai!', `${timerDuration} menit di ${station}`, 'success')
          return timerDuration * 60
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [timerRunning, timerDuration, station, notifyIsland])

  const setDurationMinutes = useCallback((mins) => {
    setTimerDuration(mins)
    if (!hasActiveSession && !timerRunning) {
      setRemainingSec(mins * 60)
    }
  }, [hasActiveSession, timerRunning])

  const startTimer = useCallback((customMinutes, customStation) => {
    const mins = customMinutes || timerDuration
    const targetStation = customStation || station
    if (customMinutes) setTimerDuration(customMinutes)
    if (customStation) setStation(customStation)
    setRemainingSec(mins * 60)
    setHasActiveSession(true)
    setTimerRunning(true)
    setIslandExpanded(true)
    notifyIsland('Sesi Layanan Dimulai', `${targetStation} (${mins} menit)`, 'active')
  }, [timerDuration, station, notifyIsland])

  const pauseTimer = useCallback(() => {
    setTimerRunning(false)
  }, [])

  const resumeTimer = useCallback(() => {
    if (remainingSec > 0) {
      setHasActiveSession(true)
      setTimerRunning(true)
    }
  }, [remainingSec])

  const stopTimer = useCallback(() => {
    const elapsed = Math.max(0, timerDuration * 60 - remainingSec)
    if (elapsed >= 60) {
      setDailyStats((s) => {
        const base = s.date === todayKey() ? s : { date: todayKey(), sessions: 0, focusedSec: 0 }
        return {
          date: todayKey(),
          sessions: base.sessions + 1,
          focusedSec: base.focusedSec + elapsed,
        }
      })
      notifyIsland('Sesi Disimpan', `${Math.round(elapsed / 60)} menit dicatat hari ini`, 'success')
    }
    setTimerRunning(false)
    setHasActiveSession(false)
    setRemainingSec(timerDuration * 60)
    setIslandExpanded(false)
  }, [timerDuration, remainingSec, notifyIsland])

  const addFiveMinutes = useCallback(() => {
    setRemainingSec((s) => s + 300)
    setTimerDuration((d) => d + 5)
    notifyIsland('+5 Menit Ditambahkan', station, 'info')
  }, [station, notifyIsland])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const openPalette = useCallback(() => setPaletteOpen(true), [])
  const closePalette = useCallback(() => setPaletteOpen(false), [])
  const togglePalette = useCallback(() => setPaletteOpen((p) => !p), [])

  const value = {
    theme,
    setTheme,
    toggleTheme,
    wallpaper,
    setWallpaper,
    glassMode,
    setGlassMode,
    paletteOpen,
    openPalette,
    closePalette,
    togglePalette,
    // Timer & Dynamic Island
    timerDuration,
    remainingSec,
    timerRunning,
    hasActiveSession,
    station,
    setStation,
    setDurationMinutes,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    addFiveMinutes,
    sessionsToday: dailyStats.sessions,
    focusedMinutesToday: Math.round(dailyStats.focusedSec / 60),
    islandExpanded,
    setIslandExpanded,
    islandNotice,
    notifyIsland,
    dismissNotice,
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
