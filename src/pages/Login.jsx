import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { EnvelopeSimple, Lock, Baby } from '@phosphor-icons/react'
import { useAuth } from '../contexts/AuthContext'
import { handleSupabaseError } from '../utils/errors'
import { showError } from '../utils/swal'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email.trim(), password)
    setLoading(false)
    if (error) {
      const mapped = handleSupabaseError(error)
      showError('Login Gagal', mapped.message)
      return
    }
    const from = location.state?.from?.pathname || '/'
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-svh flex items-center justify-center px-4 py-8 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-purple-50 p-6 flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple to-pink text-white">
            <Baby size={32} weight="fill" />
          </span>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Posyandu Ceria</h1>
          <p className="text-gray-500 text-sm">Masuk untuk mencatat data posyandu.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-heading font-semibold text-gray-800 text-sm">Email</label>
            <div className="relative">
              <EnvelopeSimple size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-purple-100 bg-white focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-base"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="font-heading font-semibold text-gray-800 text-sm">Password</label>
            <div className="relative">
              <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[48px] pl-11 pr-4 rounded-xl border border-purple-100 bg-white focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple text-base"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 min-h-[52px] px-6 rounded-xl bg-purple text-white font-semibold text-base hover:bg-purple-600 active:scale-[0.99] transition-all w-full disabled:opacity-60"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
