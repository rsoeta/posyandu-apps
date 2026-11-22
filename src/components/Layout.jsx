import { useEffect, useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

export default function Layout({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('posyandu:theme') || 'light' } catch { return 'light' }
  })

  useEffect(() => {
    const sync = () => {
      try { setTheme(localStorage.getItem('posyandu:theme') || 'light') } catch { /* ignore */ }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="wall" aria-hidden="true" />
      <a className="skip" href="#main">Lewati ke konten</a>
      <Header />
      <Sidebar />
      <main id="main" className="flex-1 w-full max-w-6xl mx-auto px-4 py-5 pb-24 md:pb-8 md:ml-[260px] md:pl-6">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
