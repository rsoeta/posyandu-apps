import {
  Play,
  Pause,
  Stop,
  Plus,
  Clock,
  CheckCircle,
  Sparkle,
  X,
  MagnifyingGlass,
  Timer,
} from '@phosphor-icons/react'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { useAuth } from '../contexts/AuthContext'

function formatMMSS(totalSec) {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function DynamicIsland() {
  const { posyanduName } = useAuth()
  const {
    timerDuration,
    remainingSec,
    timerRunning,
    hasActiveSession,
    station,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    addFiveMinutes,
    islandExpanded,
    setIslandExpanded,
    islandNotice,
    dismissNotice,
    openPalette,
  } = useWorkspace()

  const totalSec = Math.max(1, timerDuration * 60)
  const progressPct = Math.min(100, Math.max(0, ((totalSec - remainingSec) / totalSec) * 100))

  const showFloatingOnMobile = Boolean(hasActiveSession || islandNotice || islandExpanded)

  return (
    <div
      className={`fixed top-3 left-1/2 -translate-x-1/2 lg:left-[calc(50%+126px)] z-50 w-max max-w-[calc(100vw-24px)] transition-all duration-300 ${
        showFloatingOnMobile ? 'flex' : 'hidden lg:flex'
      }`}
      role="region"
      aria-label="Dynamic Island Status Layanan"
    >
      {/* Expanded Timer or Notification View */}
      {islandExpanded || islandNotice ? (
        <div className="glass glass--thick animate-island rounded-[28px] px-4 py-3.5 w-[min(92vw,420px)] flex flex-col gap-3">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  islandNotice?.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : timerRunning
                    ? 'bg-amber-500/20 text-amber-500'
                    : 'bg-[var(--accent-soft)] text-[var(--accent-ink)]'
                }`}
              >
                {islandNotice?.type === 'success' ? (
                  <CheckCircle size={20} weight="fill" />
                ) : (
                  <Timer size={20} weight="fill" className={timerRunning ? 'animate-pulse' : ''} />
                )}
              </span>
              <div className="min-w-0">
                <p className="font-heading font-bold text-sm text-[var(--text)] truncate">
                  {islandNotice ? islandNotice.title : hasActiveSession ? station : 'Sesi Layanan Posyandu'}
                </p>
                <p className="text-xs text-[var(--text-2)] truncate">
                  {islandNotice
                    ? islandNotice.subtitle
                    : timerRunning
                    ? 'Sesi berjalan · Fokus pelayanan'
                    : hasActiveSession
                    ? 'Sesi dijeda'
                    : posyanduName || 'Siap memulai sesi layanan'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(hasActiveSession || timerRunning) && (
                <span
                  className="font-heading font-black text-lg text-[var(--text)] tabular-nums"
                  aria-live="polite"
                >
                  {formatMMSS(remainingSec)}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  dismissNotice()
                  setIslandExpanded(false)
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-2)] hover:bg-[var(--fill)] transition-colors"
                aria-label="Perkecil Dynamic Island"
                title="Perkecil"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
          </div>

          {/* Progress Bar when active */}
          {hasActiveSession && (
            <div className="w-full h-1.5 rounded-full bg-[var(--fill)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, var(--accent), #ff4fa3)',
                }}
              />
            </div>
          )}

          {/* Action Controls (min-h 44px touch targets) */}
          <div className="flex items-center justify-between gap-2">
            {hasActiveSession ? (
              <>
                <button
                  type="button"
                  onClick={addFiveMinutes}
                  className="btn btn--glass btn--sm flex-1"
                  aria-label="Tambah 5 menit"
                >
                  <Plus size={15} weight="bold" /> 5m
                </button>
                {timerRunning ? (
                  <button
                    type="button"
                    onClick={pauseTimer}
                    className="btn btn--accent btn--sm flex-1"
                    aria-label="Jeda sesi layanan"
                  >
                    <Pause size={15} weight="fill" /> Jeda
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resumeTimer}
                    className="btn btn--accent btn--sm flex-1"
                    aria-label="Lanjutkan sesi layanan"
                  >
                    <Play size={15} weight="fill" /> Lanjut
                  </button>
                )}
                <button
                  type="button"
                  onClick={stopTimer}
                  className="btn btn--sm bg-rose-500/15 text-rose-500 hover:bg-rose-500/25"
                  aria-label="Akhiri sesi layanan"
                >
                  <Stop size={15} weight="fill" /> Selesai
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => startTimer(25)}
                  className="btn btn--accent btn--sm flex-1"
                >
                  <Play size={15} weight="fill" /> Mulai Sesi 25m
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIslandExpanded(false)
                    openPalette()
                  }}
                  className="btn btn--glass btn--sm"
                  aria-label="Buka pencarian cepat"
                >
                  <MagnifyingGlass size={15} weight="bold" /> Cari ⌘K
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Compact Pill State */
        <button
          type="button"
          onClick={() => setIslandExpanded(true)}
          className="glass glass--chrome glass--pill min-h-[40px] px-4 py-1.5 flex items-center gap-2.5 text-xs font-semibold text-[var(--text)] hover:scale-[1.02] transition-transform cursor-pointer"
          aria-label={
            hasActiveSession
              ? `Sesi layanan aktif ${formatMMSS(remainingSec)}. Klik untuk membuka kontrol.`
              : 'Dynamic Island Posyandu Ceria. Klik untuk membuka kontrol sesi.'
          }
        >
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              timerRunning
                ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]'
                : hasActiveSession
                ? 'bg-amber-400'
                : 'bg-[var(--accent)]'
            }`}
          />
          {hasActiveSession ? (
            <>
              <Clock size={15} className="text-[var(--accent-ink)]" weight="bold" />
              <span className="max-w-[160px] truncate text-[var(--text-2)]">{station.split(':')[0]}</span>
              <span className="font-heading font-black text-sm tabular-nums text-[var(--text)]">
                {formatMMSS(remainingSec)}
              </span>
            </>
          ) : (
            <>
              <Sparkle size={14} weight="fill" className="text-[var(--accent-ink)]" />
              <span className="truncate max-w-[190px]">
                {posyanduName ? `${posyanduName} · Siap` : 'Posyandu Ceria · Siap'}
              </span>
            </>
          )}
        </button>
      )}
    </div>
  )
}
