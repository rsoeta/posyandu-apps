import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import DynamicIsland from './DynamicIsland'
import CommandPalette from './CommandPalette'

export default function Layout({ children }) {
  const location = useLocation()

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    window.scrollTo({
      top: 0,
      behavior: prefersReduced ? 'auto' : 'smooth',
    })
  }, [location.pathname])

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="wall" aria-hidden="true" />
      <a className="skip" href="#main">Lewati ke konten</a>
      <DynamicIsland />
      <CommandPalette />
      <Header />
      <Sidebar />
      <main
        id="main"
        className="flex-1 w-full lg:pl-[268px] lg:pr-6 px-4 py-5 pb-28 lg:pb-10"
      >
        <div className="max-w-[1280px] mx-auto w-full">
          <div key={location.pathname} className="page-transition">
            {children}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
