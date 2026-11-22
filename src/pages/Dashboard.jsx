import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Baby,
  ChartBar,
  Buildings,
  CalendarBlank,
  Camera,
  Plus,
  MagnifyingGlass,
  Play,
  Pause,
  Stop,
  Scales,
  ArrowsOutSimple,
  ArrowsInSimple,
  CheckCircle,
  Clock,
  MapPin,
  ArrowRight,
  GenderMale,
  GenderFemale,
  Image as ImageIcon,
  Timer,
} from '@phosphor-icons/react'
import { api, mapApiError } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace, POSYANDU_STATIONS } from '../contexts/WorkspaceContext'
import { getImageUrl } from '../utils/imageUrl'
import { showError } from '../utils/swal'

function getGreeting(now) {
  const h = now.getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

function formatMMSS(totalSec) {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function calcMonths(dob, now) {
  if (!dob) return 0
  const birth = new Date(dob)
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (now.getDate() < birth.getDate()) months -= 1
  return Math.max(0, months)
}

export default function Dashboard() {
  const { user, isAdmin, posyanduName } = useAuth()
  const {
    openPalette,
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
    sessionsToday,
    focusedMinutesToday,
  } = useWorkspace()

  const [stats, setStats] = useState({ balita: 0, ibuHamil: 0, ukurBulanIni: 0, posyandu: 0 })
  const [balitaList, setBalitaList] = useState([])
  const [jadwalList, setJadwalList] = useState([])
  const [kegiatanList, setKegiatanList] = useState([])
  const [posyanduList, setPosyanduList] = useState([])
  const [loading, setLoading] = useState(true)

  const [now] = useState(() => new Date())
  const [chartExpanded, setChartExpanded] = useState(false)
  const [rightTab, setRightTab] = useState('posyandu') // 'posyandu' | 'aktivitas'

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      const [dRes, bRes, jRes, kRes, pRes] = await Promise.allSettled([
        api('/api/dashboard'),
        api('/api/balita'),
        api('/api/jadwal'),
        api('/api/kegiatan'),
        api('/api/posyandu/public-list'),
      ])

      if (!mounted) return

      if (dRes.status === 'fulfilled') {
        setStats(dRes.value.data || { balita: 0, ibuHamil: 0, ukurBulanIni: 0, posyandu: 0 })
      } else {
        const mapped = mapApiError(dRes.reason)
        showError('Gagal Memuat Ringkasan', mapped.message)
      }

      if (bRes.status === 'fulfilled') setBalitaList(bRes.value.data || [])
      if (jRes.status === 'fulfilled') setJadwalList(jRes.value.data || [])
      if (kRes.status === 'fulfilled') setKegiatanList(kRes.value.data || [])
      if (pRes.status === 'fulfilled') setPosyanduList(pRes.value.data || [])

      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const currentMonthPrefix = now.toISOString().slice(0, 7) // YYYY-MM

  // Derived analytics & priorities
  const analytics = useMemo(() => {
    const total = balitaList.length || stats.balita || 0
    const weighedChildren = balitaList.filter(
      (b) => b.latest_ukur && b.latest_ukur.startsWith(currentMonthPrefix)
    )
    const weighedCount = balitaList.length ? weighedChildren.length : stats.ukurBulanIni || 0
    const nikCount = balitaList.filter((b) => b.nik && b.nik.trim().length >= 16).length

    const ukurPct = total > 0 ? Math.min(100, Math.round((weighedCount / total) * 100)) : 0
    const nikPct = balitaList.length > 0 ? Math.min(100, Math.round((nikCount / balitaList.length) * 100)) : 0
    const kegiatanTarget = 4
    const kegiatanPct = Math.min(100, Math.round((kegiatanList.length / kegiatanTarget) * 100))

    // Priority children: unweighed this month first, then oldest measurement
    const priorityChildren = [...balitaList]
      .sort((a, b) => {
        const aDone = a.latest_ukur?.startsWith(currentMonthPrefix) ? 1 : 0
        const bDone = b.latest_ukur?.startsWith(currentMonthPrefix) ? 1 : 0
        if (aDone !== bDone) return aDone - bDone
        return (a.latest_ukur || '').localeCompare(b.latest_ukur || '')
      })
      .slice(0, 6)

    // Age cohorts bar chart
    const cohorts = [
      { label: '0–6 bln', min: 0, max: 6, total: 0, weighed: 0 },
      { label: '7–12 bln', min: 7, max: 12, total: 0, weighed: 0 },
      { label: '13–24 bln', min: 13, max: 24, total: 0, weighed: 0 },
      { label: '25–36 bln', min: 25, max: 36, total: 0, weighed: 0 },
      { label: '37+ bln', min: 37, max: 999, total: 0, weighed: 0 },
    ]
    balitaList.forEach((b) => {
      const m = calcMonths(b.tanggal_lahir, now)
      const bucket = cohorts.find((c) => m >= c.min && m <= c.max)
      if (bucket) {
        bucket.total += 1
        if (b.latest_ukur?.startsWith(currentMonthPrefix)) {
          bucket.weighed += 1
        }
      }
    })
    const maxCohort = Math.max(1, ...cohorts.map((c) => c.total))

    // Upcoming schedules (sorted ascending by date)
    const todayStr = now.toISOString().slice(0, 10)
    const sortedJadwal = [...jadwalList].sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''))
    const upcomingJadwal = sortedJadwal.filter((j) => !j.tanggal || j.tanggal >= todayStr)
    const displayJadwal = upcomingJadwal.length > 0 ? upcomingJadwal : sortedJadwal

    // Posyandu breakdown
    const posyanduCounts = posyanduList.map((p) => {
      const count = balitaList.filter((b) => b.posyandu_id === p.id).length
      const weighed = balitaList.filter(
        (b) => b.posyandu_id === p.id && b.latest_ukur?.startsWith(currentMonthPrefix)
      ).length
      return { ...p, count, weighed }
    })

    // Latest weighed activity
    const recentMeasured = [...balitaList]
      .filter((b) => b.latest_ukur)
      .sort((a, b) => (b.latest_ukur || '').localeCompare(a.latest_ukur || ''))
      .slice(0, 5)

    return {
      total,
      weighedCount,
      nikCount,
      ukurPct,
      nikPct,
      kegiatanPct,
      priorityChildren,
      cohorts,
      maxCohort,
      displayJadwal,
      posyanduCounts,
      recentMeasured,
    }
  }, [balitaList, stats, kegiatanList, jadwalList, posyanduList, currentMonthPrefix, now])

  const firstName = user?.full_name?.split(' ')[0] || (isAdmin ? 'Admin' : 'Kader')
  const todayLabel = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const timerTotalSec = Math.max(1, timerDuration * 60)
  const timerProgress = Math.min(1, Math.max(0, (timerTotalSec - remainingSec) / timerTotalSec))
  const dialR = 46
  const dialC = 2 * Math.PI * dialR

  const pendingMeasureCount = Math.max(0, analytics.total - analytics.weighedCount)

  return (
    <section className="flex flex-col gap-6">
      {/* HERO GREETING HEADER */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <h1 className="font-heading text-3xl md:text-[40px] font-extrabold text-[var(--text)] leading-tight tracking-tight">
            {getGreeting(now)}, {firstName}
          </h1>
          <p className="text-sm md:text-base text-[var(--text-2)] font-medium">
            {todayLabel} ·{' '}
            <span className="text-[var(--text)] font-semibold">
              {pendingMeasureCount} balita menunggu penimbangan bulan ini
            </span>
            {posyanduName ? ` · ${posyanduName}` : ''}
          </p>
        </div>

        {/* Hero Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link to="/balita" className="btn btn--glass btn--sm">
            <Plus size={16} weight="bold" /> Data Balita
          </Link>
          <Link to="/kegiatan" className="btn btn--glass btn--sm">
            <Camera size={16} weight="duotone" /> Dokumentasi
          </Link>
          <button
            type="button"
            onClick={openPalette}
            className="btn btn--accent btn--sm"
            aria-label="Buka pencarian cepat Command Palette"
          >
            <MagnifyingGlass size={16} weight="bold" /> Cari Cepat
          </button>
        </div>
      </header>

      {/* 4 GLASS KPI STAT PILLS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass stat-pill">
          <span className="stat-pill__label flex items-center gap-1.5">
            <Baby size={15} className="text-[var(--accent-ink)]" weight="fill" /> Total Balita Terdaftar
          </span>
          <span className="stat-pill__val">{stats.balita}</span>
        </div>

        <div className="glass stat-pill">
          <span className="stat-pill__label flex items-center gap-1.5">
            <Scales size={15} className="text-pink" weight="fill" /> Diukur Bulan Ini
          </span>
          <span className="stat-pill__val">
            {stats.ukurBulanIni}{' '}
            <span className="text-sm font-semibold text-[var(--text-3)]">
              / {analytics.total}
            </span>
          </span>
        </div>

        <div className="glass stat-pill">
          <span className="stat-pill__label flex items-center gap-1.5">
            <ChartBar size={15} className="text-emerald-500" weight="fill" /> Ibu Hamil Terpantau
          </span>
          <span className="stat-pill__val">{stats.ibuHamil}</span>
        </div>

        <div className="glass stat-pill">
          <span className="stat-pill__label flex items-center gap-1.5">
            {isAdmin ? (
              <>
                <Buildings size={15} className="text-sky-500" weight="fill" /> Unit Posyandu Aktif
              </>
            ) : (
              <>
                <Camera size={15} className="text-sky-500" weight="fill" /> Dokumentasi Kegiatan
              </>
            )}
          </span>
          <span className="stat-pill__val">
            {isAdmin ? stats.posyandu : kegiatanList.length}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="glass bento-card items-center justify-center py-20">
          <div className="w-9 h-9 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-2)] font-medium mt-2">
            Menyiapkan workspace posyandu...
          </p>
        </div>
      ) : (
        /* 12-COLUMN BENTO DASHBOARD GRID */
        <div className="bento-grid">
          {/* WIDGET 1 (4 Cols): TARGET LAYANAN BULAN INI (CONCENTRIC RINGS) */}
          <section className="glass bento-card bento-col-4" aria-labelledby="w-rings-title">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 id="w-rings-title" className="font-heading font-bold text-base text-[var(--text)]">
                  Target Layanan
                </h2>
                <p className="text-xs text-[var(--text-2)]">Lengkapi cincin capaian bulan ini</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)] text-[11px] font-bold">
                {analytics.ukurPct}%
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 my-auto py-1">
              {/* Concentric Apple Watch-style SVG Rings */}
              <svg
                width="132"
                height="132"
                viewBox="0 0 132 132"
                className="shrink-0"
                role="img"
                aria-label={`Progres layanan: Penimbangan ${analytics.ukurPct}%, Kelengkapan NIK ${analytics.nikPct}%, Kegiatan ${analytics.kegiatanPct}%`}
              >
                {[
                  { r: 54, pct: analytics.ukurPct, color: '#ff2d6f' },
                  { r: 40, pct: analytics.nikPct, color: '#34c46b' },
                  { r: 26, pct: analytics.kegiatanPct, color: '#22c3f0' },
                ].map((ring) => {
                  const circ = 2 * Math.PI * ring.r
                  const dashOffset = circ * (1 - Math.max(4, ring.pct) / 100)
                  return (
                    <g key={ring.r} transform="rotate(-90 66 66)">
                      <circle
                        cx="66"
                        cy="66"
                        r={ring.r}
                        fill="none"
                        stroke={ring.color}
                        strokeOpacity="0.18"
                        strokeWidth="10"
                      />
                      <circle
                        cx="66"
                        cy="66"
                        r={ring.r}
                        fill="none"
                        stroke={ring.color}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        strokeDashoffset={dashOffset}
                        className="transition-all duration-700"
                      />
                    </g>
                  )
                })}
              </svg>

              {/* Rings Legend */}
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#ff2d6f] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#ff2d6f]" /> Penimbangan
                  </span>
                  <span className="font-heading font-bold text-sm text-[var(--text)] tabular-nums">
                    {analytics.weighedCount} / {analytics.total} balita
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#34c46b] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#34c46b]" /> Data NIK Valid
                  </span>
                  <span className="font-heading font-bold text-sm text-[var(--text)] tabular-nums">
                    {analytics.nikCount} / {balitaList.length || 0} ({analytics.nikPct}%)
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#22c3f0] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#22c3f0]" /> Dokumentasi
                  </span>
                  <span className="font-heading font-bold text-sm text-[var(--text)] tabular-nums">
                    {kegiatanList.length} kegiatan
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* WIDGET 2 (4 Cols): JADWAL BERIKUTNYA */}
          <section className="glass bento-card bento-col-4" aria-labelledby="w-next-title">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 id="w-next-title" className="font-heading font-bold text-base text-[var(--text)]">
                  Jadwal Berikutnya
                </h2>
                <p className="text-xs text-[var(--text-2)]">Agenda posyandu terdekat</p>
              </div>
              <Link
                to="/jadwal"
                className="btn btn--ghost btn--sm !px-3 text-xs"
              >
                Kalender
              </Link>
            </div>

            {analytics.displayJadwal.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6 gap-2">
                <span className="w-11 h-11 rounded-2xl bg-[var(--fill)] text-[var(--accent-ink)] flex items-center justify-center">
                  <CalendarBlank size={24} weight="duotone" />
                </span>
                <p className="text-sm font-semibold text-[var(--text)]">Belum ada agenda terjadwal</p>
                <p className="text-xs text-[var(--text-2)]">
                  Lihat halaman jadwal untuk agenda posyandu mendatang.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 flex-1">
                {/* Featured First Schedule (independent button container — no nested buttons!) */}
                {(() => {
                  const first = analytics.displayJadwal[0]
                  return (
                    <div className="rounded-2xl p-3.5 bg-[var(--accent-soft)] border border-[var(--sep)] flex items-center justify-between gap-3">
                      <Link to="/jadwal" className="min-w-0 flex-1 group">
                        <span className="text-[11px] font-bold text-[var(--accent-ink)] uppercase tracking-wider">
                          {first.tanggal
                            ? new Date(first.tanggal).toLocaleDateString('id-ID', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              })
                            : 'Segera'}
                        </span>
                        <h3 className="font-heading font-bold text-sm text-[var(--text)] truncate group-hover:underline">
                          {first.judul}
                        </h3>
                        <p className="text-xs text-[var(--text-2)] truncate mt-0.5 flex items-center gap-1.5">
                          <Clock size={12} /> {first.waktu || '08:00 WIB'}
                          {first.tempat && (
                            <>
                              <span>·</span>
                              <MapPin size={12} /> {first.tempat}
                            </>
                          )}
                        </p>
                      </Link>
                      <button
                        type="button"
                        onClick={() => startTimer(25, `Agenda: ${first.judul}`)}
                        className="btn btn--accent btn--sm !px-3.5 shrink-0"
                        title="Mulai timer persiapan meja untuk agenda ini"
                      >
                        Siapkan
                      </button>
                    </div>
                  )
                })()}

                {/* Remaining Compact Schedule Rows */}
                <div className="flex flex-col gap-1.5">
                  {analytics.displayJadwal.slice(1, 4).map((j) => (
                    <Link
                      key={j.id}
                      to="/jadwal"
                      className="flex items-center justify-between gap-3 px-3 min-h-[42px] rounded-xl hover:bg-[var(--fill-hover)] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-pink shrink-0" />
                        <span className="text-xs font-semibold text-[var(--text)] truncate">
                          {j.judul}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-[var(--text-2)] shrink-0 tabular-nums">
                        {j.waktu || j.tanggal}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* WIDGET 3 (4 Cols): MEJA LAYANAN & TIMER FOKUS (DYNAMIC ISLAND SYNC) */}
          <section className="glass bento-card bento-col-4" aria-labelledby="w-focus-title">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 id="w-focus-title" className="font-heading font-bold text-base text-[var(--text)]">
                  Meja Layanan
                </h2>
                <p className="text-xs text-[var(--text-2)]">Dynamic Island mencatat durasi</p>
              </div>
              <div className="seg" role="group" aria-label="Pilih durasi sesi">
                {[15, 25, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    disabled={hasActiveSession}
                    onClick={() => setDurationMinutes(mins)}
                    aria-pressed={timerDuration === mins}
                    className="seg__btn !min-h-[32px] !px-2.5 text-xs"
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Circular Dial + Station Selector */}
            <div className="flex items-center gap-4 my-auto">
              <div className="relative w-[108px] h-[108px] shrink-0 flex items-center justify-center">
                <svg width="108" height="108" viewBox="0 0 108 108" aria-hidden="true">
                  <g transform="rotate(-90 54 54)">
                    <circle
                      cx="54"
                      cy="54"
                      r={dialR}
                      fill="none"
                      stroke="var(--fill-2)"
                      strokeWidth="7"
                    />
                    <circle
                      cx="54"
                      cy="54"
                      r={dialR}
                      fill="none"
                      stroke={timerRunning ? '#f59e0b' : 'var(--accent)'}
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={dialC}
                      strokeDashoffset={dialC * (1 - timerProgress)}
                      className="transition-all duration-500"
                    />
                  </g>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-heading font-black text-xl text-[var(--text)] tabular-nums">
                    {formatMMSS(remainingSec)}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">
                    {timerRunning ? 'Aktif' : hasActiveSession ? 'Dijeda' : 'Siap'}
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div>
                  <label htmlFor="focus-station" className="text-[11px] font-bold text-[var(--text-2)] block mb-1">
                    Pilih Meja Posyandu
                  </label>
                  <select
                    id="focus-station"
                    name="focus_station"
                    value={station}
                    onChange={(e) => setStation(e.target.value)}
                    className="input !min-h-[40px] !py-1.5 !px-2.5 text-xs font-semibold"
                  >
                    {POSYANDU_STATIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {!hasActiveSession ? (
                    <button
                      type="button"
                      onClick={() => startTimer()}
                      className="btn btn--accent btn--sm flex-1"
                    >
                      <Play size={15} weight="fill" /> Mulai Sesi
                    </button>
                  ) : (
                    <>
                      {timerRunning ? (
                        <button
                          type="button"
                          onClick={pauseTimer}
                          className="btn btn--glass btn--sm flex-1"
                        >
                          <Pause size={15} weight="fill" /> Jeda
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={resumeTimer}
                          className="btn btn--accent btn--sm flex-1"
                        >
                          <Play size={15} weight="fill" /> Lanjut
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={stopTimer}
                        className="btn btn--sm bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 !px-3"
                        aria-label="Hentikan sesi"
                        title="Selesai"
                      >
                        <Stop size={15} weight="fill" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[var(--text-2)] pt-2 border-t border-[var(--sep)]">
              <span className="flex items-center gap-1.5">
                <Timer size={14} className="text-[var(--accent-ink)]" />
                Hari ini: <strong className="text-[var(--text)]">{focusedMinutesToday} mnt</strong>
              </span>
              <span>{sessionsToday} sesi selesai</span>
            </div>
          </section>

          {/* WIDGET 4 (5 Cols): PRIORITAS PENIMBANGAN BALITA */}
          <section className="glass bento-card bento-col-5" aria-labelledby="w-tasks-title">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 id="w-tasks-title" className="font-heading font-bold text-base text-[var(--text)]">
                  Prioritas Penimbangan
                </h2>
                <p className="text-xs text-[var(--text-2)]">
                  Balita belum ditimbang &amp; antrean bulan ini
                </p>
              </div>
              <Link to="/balita" className="btn btn--ghost btn--sm !px-3 text-xs">
                Semua Balita
              </Link>
            </div>

            {analytics.priorityChildren.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center gap-2">
                <Baby size={32} className="text-[var(--text-3)]" />
                <p className="text-sm font-semibold text-[var(--text)]">Belum ada data balita</p>
                <Link to="/balita" className="btn btn--accent btn--sm mt-1">
                  + Tambah Data Balita
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {analytics.priorityChildren.map((b) => {
                  const weighedThisMonth = Boolean(b.latest_ukur?.startsWith(currentMonthPrefix))
                  const isBoy = b.jenis_kelamin === 'L'
                  const ageMonths = calcMonths(b.tanggal_lahir, now)

                  return (
                    <li
                      key={b.id}
                      className="flex items-center justify-between gap-2.5 p-2 rounded-2xl hover:bg-[var(--fill-hover)] transition-colors"
                    >
                      {/* Accessible 44x44px tap target for quick measure */}
                      <Link
                        to={`/balita/${b.id}/ukur`}
                        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 hover:bg-[var(--fill)] transition-colors"
                        aria-label={`Input penimbangan ${b.nama}`}
                        title={weighedThisMonth ? 'Sudah ditimbang bulan ini (klik untuk ukur ulang)' : 'Timbang sekarang'}
                      >
                        {weighedThisMonth ? (
                          <CheckCircle size={24} weight="fill" className="text-emerald-500" />
                        ) : (
                          <span className="w-6 h-6 rounded-full border-2 border-[var(--accent-ink)] flex items-center justify-center text-[var(--accent-ink)]">
                            <Scales size={13} weight="bold" />
                          </span>
                        )}
                      </Link>

                      <Link to={`/balita/${b.id}`} className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-heading font-bold text-sm text-[var(--text)] line-clamp-1">
                            {b.nama}
                          </span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                              isBoy
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                : 'bg-pink-500/15 text-pink-600 dark:text-pink-400'
                            }`}
                          >
                            {isBoy ? <GenderMale size={10} weight="bold" /> : <GenderFemale size={10} weight="bold" />}
                            {isBoy ? 'L' : 'P'}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-2)] truncate">
                          {ageMonths} bln ·{' '}
                          {b.latest_bb ? `BB ${b.latest_bb}kg / TB ${b.latest_tb}cm` : 'Belum pernah diukur'}
                        </p>
                      </Link>

                      <Link
                        to={`/balita/${b.id}/ukur`}
                        className={`px-3 min-h-[34px] rounded-full text-[11px] font-bold inline-flex items-center shrink-0 transition-colors ${
                          weighedThisMonth
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25'
                        }`}
                      >
                        {weighedThisMonth ? 'Terukur' : 'Timbang'}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* WIDGET 5 (7 Cols, Tablet Full): SEBARAN USIA & CAKUPAN TIMBANG */}
          <section
            className="glass bento-card bento-col-7 bento-tablet-full"
            aria-labelledby="w-week-title"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 id="w-week-title" className="font-heading font-bold text-base text-[var(--text)]">
                  Sebaran Usia &amp; Cakupan Timbang
                </h2>
                <p className="text-xs text-[var(--text-2)]">
                  Perbandingan jumlah balita terdaftar dan terukur per kelompok usia
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChartExpanded((e) => !e)}
                className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--text-2)] hover:bg-[var(--fill)] transition-colors shrink-0"
                aria-label={chartExpanded ? 'Kecilkan grafik sebaran usia' : 'Perbesar grafik sebaran usia'}
                title={chartExpanded ? 'Kecilkan' : 'Perbesar'}
              >
                {chartExpanded ? <ArrowsInSimple size={19} weight="bold" /> : <ArrowsOutSimple size={19} weight="bold" />}
              </button>
            </div>

            {/* Headline Stat */}
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-heading font-black text-3xl text-[var(--text)] tabular-nums">
                {analytics.weighedCount} terukur
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                {analytics.ukurPct}% cakupan bulan ini
              </span>
            </div>

            {/* 5-Column Vertical Bar Chart */}
            <div
              className={`grid grid-cols-5 gap-3 items-end pt-4 transition-all duration-300 ${
                chartExpanded ? 'h-72' : 'h-48'
              }`}
              role="img"
              aria-label="Grafik batang sebaran usia balita"
            >
              {analytics.cohorts.map((c) => {
                const totalHeightPct = c.total > 0 ? Math.max(12, Math.round((c.total / analytics.maxCohort) * 100)) : 8
                const weighedHeightPct = c.total > 0 ? Math.round((c.weighed / c.total) * 100) : 0
                return (
                  <div
                    key={c.label}
                    className="h-full flex flex-col items-center justify-end gap-2 group"
                  >
                    <span className="text-[11px] font-bold text-[var(--text-2)] tabular-nums">
                      {c.weighed}/{c.total}
                    </span>
                    <div
                      className="w-full max-w-[44px] rounded-t-2xl rounded-b-lg bg-[var(--fill)] relative overflow-hidden flex items-end transition-all duration-500"
                      style={{ height: `${totalHeightPct}%` }}
                      title={`${c.label}: ${c.weighed} terukur dari ${c.total} balita`}
                    >
                      <div
                        className="w-full rounded-t-xl transition-all duration-700"
                        style={{
                          height: `${weighedHeightPct}%`,
                          background: 'linear-gradient(180deg, #ff4fa3, var(--accent))',
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--text-2)] text-center">
                      {c.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* WIDGET 6 (7 Cols): DOKUMENTASI KEGIATAN TERBARU */}
          <section className="glass bento-card bento-col-7" aria-labelledby="w-kegiatan-title">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 id="w-kegiatan-title" className="font-heading font-bold text-base text-[var(--text)]">
                  Dokumentasi Kegiatan Terbaru
                </h2>
                <p className="text-xs text-[var(--text-2)]">
                  Foto ber-watermark resmi siap bagikan ke warga
                </p>
              </div>
              <Link to="/kegiatan" className="btn btn--ghost btn--sm !px-3 text-xs">
                Semua Kegiatan
              </Link>
            </div>

            {kegiatanList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center gap-2">
                <Camera size={32} className="text-[var(--text-3)]" />
                <p className="text-sm font-semibold text-[var(--text)]">Belum ada dokumentasi</p>
                <Link to="/kegiatan" className="btn btn--accent btn--sm mt-1">
                  + Unggah Kegiatan
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {kegiatanList.slice(0, 4).map((k) => {
                  const thumb = getImageUrl(k.foto)
                  return (
                    <Link
                      key={k.id}
                      to={`/kegiatan/${k.id}`}
                      className="flex items-center gap-3 p-2.5 rounded-2xl bg-[var(--fill-hover)] hover:bg-[var(--fill)] transition-colors group min-w-0"
                    >
                      <div className="w-16 h-16 rounded-xl bg-[var(--fill)] overflow-hidden shrink-0 flex items-center justify-center">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={k.judul}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        ) : (
                          <ImageIcon size={24} className="text-[var(--text-3)]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-bold text-sm text-[var(--text)] line-clamp-1 group-hover:text-[var(--accent-ink)]">
                          {k.judul}
                        </p>
                        <p className="text-[11px] text-[var(--text-2)] truncate mt-0.5">
                          {k.posyandu_name || 'Posyandu'} ·{' '}
                          {k.tanggal_kegiatan
                            ? new Date(k.tanggal_kegiatan).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                              })
                            : ''}
                        </p>
                        {k.lokasi && (
                          <p className="text-[11px] text-[var(--text-3)] truncate mt-0.5 flex items-center gap-1">
                            <MapPin size={11} /> {k.lokasi}
                          </p>
                        )}
                      </div>
                      <ArrowRight
                        size={16}
                        className="text-[var(--text-3)] group-hover:text-[var(--accent-ink)] shrink-0 mr-1"
                      />
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          {/* WIDGET 7 (5 Cols): UNIT POSYANDU & RIWAYAT TERBARU */}
          <section className="glass bento-card bento-col-5" aria-labelledby="w-people-title">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 id="w-people-title" className="font-heading font-bold text-base text-[var(--text)]">
                Status Wilayah
              </h2>
              <div className="seg" role="group" aria-label="Filter status wilayah">
                <button
                  type="button"
                  onClick={() => setRightTab('posyandu')}
                  aria-pressed={rightTab === 'posyandu'}
                  className="seg__btn"
                >
                  Unit Posyandu
                </button>
                <button
                  type="button"
                  onClick={() => setRightTab('aktivitas')}
                  aria-pressed={rightTab === 'aktivitas'}
                  className="seg__btn"
                >
                  Terukur Terbaru
                </button>
              </div>
            </div>

            {rightTab === 'posyandu' ? (
              <div className="flex flex-col gap-2.5">
                {analytics.posyanduCounts.length === 0 ? (
                  <p className="text-xs text-[var(--text-3)] py-6 text-center">
                    Data unit posyandu belum tersedia.
                  </p>
                ) : (
                  analytics.posyanduCounts.slice(0, 5).map((p) => {
                    const pct = p.count > 0 ? Math.round((p.weighed / p.count) * 100) : 0
                    return (
                      <div
                        key={p.id}
                        className="flex flex-col gap-1.5 p-2.5 rounded-2xl bg-[var(--fill-hover)]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-8 h-8 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-ink)] flex items-center justify-center shrink-0">
                              <Buildings size={16} weight="duotone" />
                            </span>
                            <div className="min-w-0">
                              <p className="font-heading font-bold text-xs text-[var(--text)] truncate">
                                {p.name}
                              </p>
                              <p className="text-[11px] text-[var(--text-3)] truncate">
                                Desa {p.desa || 'Pasirlangu'}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-[var(--text)] tabular-nums shrink-0">
                            {p.count > 0 ? `${p.weighed}/${p.count}` : 'Aktif'}
                          </span>
                        </div>
                        {p.count > 0 && (
                          <div className="w-full h-1.5 rounded-full bg-[var(--fill)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-purple to-pink"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {analytics.recentMeasured.length === 0 ? (
                  <p className="text-xs text-[var(--text-3)] py-6 text-center">
                    Belum ada catatan penimbangan terbaru.
                  </p>
                ) : (
                  analytics.recentMeasured.map((b) => (
                    <Link
                      key={b.id}
                      to={`/balita/${b.id}`}
                      className="flex items-center justify-between gap-2.5 p-2.5 rounded-2xl hover:bg-[var(--fill-hover)] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                          <CheckCircle size={18} weight="fill" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-heading font-bold text-xs text-[var(--text)] truncate">
                            {b.nama}
                          </p>
                          <p className="text-[11px] text-[var(--text-2)] truncate">
                            BB {b.latest_bb} kg · TB {b.latest_tb} cm
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--text-3)] shrink-0">
                        {new Date(b.latest_ukur).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  )
}
