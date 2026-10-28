import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = async () => {
    try {
      const res = await api('/api/auth/me')
      setUser(res.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMe() }, [])

  const signIn = async (email, password, cfToken) => {
    const res = await api('/api/auth/login', { method: 'POST', body: { email, password, cfToken } })
    setUser(res.user)
    return res
  }

  const signOut = async () => {
    try { await api('/api/auth/logout', { method: 'POST' }) } catch { /* ignore */ }
    setUser(null)
  }

  const value = {
    user,
    profile: user,
    role: user?.role ?? null,
    posyanduId: user?.posyandu_id ?? null,
    posyanduName: user?.posyandu_name ?? null,
    isAdmin: user?.role === 'admin_desa',
    loading,
    signIn,
    signOut,
    refresh: fetchMe,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
