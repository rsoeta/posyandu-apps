import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />
  }
  return children
}
