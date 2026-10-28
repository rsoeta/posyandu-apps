import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ChildrenList from './pages/ChildrenList'
import ChildDetail from './pages/ChildDetail'
import MeasurementForm from './pages/MeasurementForm'
import Schedule from './pages/Schedule'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/balita" element={<ChildrenList />} />
          <Route path="/balita/:id" element={<ChildDetail />} />
          <Route path="/balita/:id/ukur" element={<MeasurementForm />} />
          <Route path="/jadwal" element={<Schedule />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
