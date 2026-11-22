import Header from './Header'
import BottomNav from './BottomNav'

export default function Layout({ children }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <a className="skip" href="#main">Lewati ke konten</a>
      <Header />
      <main id="main" className="flex-1 w-full max-w-6xl mx-auto px-4 py-5 pb-24 md:pb-8">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
