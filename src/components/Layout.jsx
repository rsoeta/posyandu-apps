import Header from './Header'
import BottomNav from './BottomNav'

export default function Layout({ children }) {
  return (
    <div className="min-h-svh flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-5 pb-24 md:pb-8">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
