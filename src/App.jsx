import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ChildrenList from './pages/ChildrenList'
import ChildDetail from './pages/ChildDetail'
import MeasurementForm from './pages/MeasurementForm'
import Schedule from './pages/Schedule'
import AdminPosyandu from './pages/AdminPosyandu'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/balita" element={<ChildrenList />} />
                    <Route path="/balita/:id" element={<ChildDetail />} />
                    <Route path="/balita/:id/ukur" element={<MeasurementForm />} />
                    <Route path="/jadwal" element={<Schedule />} />
                    <Route
                      path="/admin/posyandu"
                      element={
                        <ProtectedRoute requireAdmin>
                          <AdminPosyandu />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
