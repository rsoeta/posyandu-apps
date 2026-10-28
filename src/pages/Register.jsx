import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, EnvelopeSimple, Lock, Buildings, Baby, ArrowRight, Info } from '@phosphor-icons/react'
import { api, mapApiError } from '../lib/api'
import { showError, showSuccess } from '../utils/swal'
import Turnstile from '../components/Turnstile'

export default function Register() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [posyanduId, setPosyanduId] = useState('')
  const [posyanduList, setPosyanduList] = useState([])
  const [cfToken, setCfToken] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Ambil daftar posyandu publik untuk pilihan pendaftaran kader
    const fetchPosyandu = async () => {
      try {
        const res = await api('/api/posyandu/public-list')
        setPosyanduList(res.data || [])
      } catch {
        /* jika gagal, kader tetap bisa daftar tanpa assign awal */
      }
    }
    fetchPosyandu()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password.length < 6) {
      showError('Validasi', 'Password minimal 6 karakter.')
      return
    }

    if (password !== confirmPassword) {
      showError('Validasi', 'Konfirmasi password tidak cocok.')
      return
    }

    setLoading(true)
    try {
      const res = await api('/api/auth/register', {
        method: 'POST',
        body: {
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          posyandu_id: posyanduId || undefined,
          cfToken,
        },
      })

      await showSuccess(
        'Pendaftaran Berhasil!',
        res.message || 'Akun Anda berhasil didaftarkan. Harap tunggu persetujuan dari Admin Desa sebelum Anda dapat masuk.'
      )
      navigate('/login')
    } catch (err) {
      const mapped = mapApiError(err)
      showError('Pendaftaran Gagal', mapped.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center px-4 py-8 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-purple-50 p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple to-pink text-white shadow-sm">
            <Baby size={30} weight="fill" />
          </span>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Registrasi Kader</h1>
          <p className="text-gray-500 text-sm">Daftar akun baru sebagai Kader Posyandu.</p>
        </div>

        {/* Notifikasi info persetujuan admin */}
        <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-3.5 flex items-start gap-3 text-xs text-purple-900 leading-relaxed">
          <Info size={22} className="text-purple shrink-0 mt-0.5" weight="fill" />
          <div>
            <strong>Perhatian:</strong> Setelah pendaftaran berhasil, akun Anda berstatus{' '}
            <span className="font-semibold text-purple">Menunggu Persetujuan</span>. Hanya{' '}
            <span className="font-semibold">Admin Desa</span> yang dapat mengaktifkan hak akses akun Anda.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fullName" className="font-heading font-semibold text-gray-800 text-xs sm:text-sm">
              Nama Lengkap Kader
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="fullName"
                type="text"
                required
                placeholder="misal: Siti Aminah"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full min-h-[46px] pl-10 pr-3.5 rounded-xl border border-purple-100 bg-white focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="regEmail" className="font-heading font-semibold text-gray-800 text-xs sm:text-sm">
              Email
            </label>
            <div className="relative">
              <EnvelopeSimple size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="regEmail"
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[46px] pl-10 pr-3.5 rounded-xl border border-purple-100 bg-white focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="posyandu" className="font-heading font-semibold text-gray-800 text-xs sm:text-sm">
              Tugas Posyandu (Opsional)
            </label>
            <div className="relative">
              <Buildings size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                id="posyandu"
                value={posyanduId}
                onChange={(e) => setPosyanduId(e.target.value)}
                className="w-full min-h-[46px] pl-10 pr-3.5 rounded-xl border border-purple-100 bg-white focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-sm text-gray-700"
              >
                <option value="">-- Pilih Posyandu (bisa ditentukan nanti oleh Admin) --</option>
                {posyanduList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.desa ? `(${p.desa})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="regPassword" className="font-heading font-semibold text-gray-800 text-xs sm:text-sm">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="regPassword"
                  type="password"
                  required
                  placeholder="Min 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-[46px] pl-10 pr-3.5 rounded-xl border border-purple-100 bg-white focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="font-heading font-semibold text-gray-800 text-xs sm:text-sm">
                Konfirmasi
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full min-h-[46px] pl-10 pr-3.5 rounded-xl border border-purple-100 bg-white focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-sm"
                />
              </div>
            </div>
          </div>

          {/* Cloudflare Turnstile */}
          <Turnstile onVerify={(token) => setCfToken(token)} />

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 min-h-[50px] px-6 rounded-xl bg-purple text-white font-semibold text-sm sm:text-base hover:bg-purple-600 active:scale-[0.99] transition-all w-full disabled:opacity-60 mt-1 shadow-sm"
          >
            {loading ? 'Mendaftarkan...' : 'Daftar Sebagai Kader'}
          </button>
        </form>

        <div className="pt-2 border-t border-purple-50 text-center text-sm text-gray-500">
          Sudah memiliki akun?{' '}
          <Link
            to="/login"
            className="text-purple font-semibold hover:underline inline-flex items-center gap-1"
          >
            Masuk di sini <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}

