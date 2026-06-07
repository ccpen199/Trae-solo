import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import News from './pages/News'
import NewsDetail from './pages/NewsDetail'
import NearbyNews from './pages/NearbyNews'
import Video from './pages/Video'
import VideoDetail from './pages/VideoDetail'
import Creator from './pages/Creator'
import CreatorDetail from './pages/CreatorDetail'
import CreatorApply from './pages/CreatorApply'
import Task from './pages/Task'
import Beans from './pages/Beans'
import Admin from './pages/Admin'
import AdminReports from './pages/AdminReports'
import AdminCreators from './pages/AdminCreators'
import AdminAntiFraud from './pages/AdminAntiFraud'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  if (!token) return <Navigate to="/login" replace />
  try {
    const user = JSON.parse(userStr || '{}')
    if (user.role !== 'admin') return <Navigate to="/" replace />
  } catch {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/" element={<Home />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/nearby" element={<NearbyNews />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="/videos" element={<Video />} />
        <Route path="/videos/:id" element={<VideoDetail />} />
        <Route path="/creators" element={<Creator />} />
        <Route path="/creators/:id" element={<CreatorDetail />} />
        <Route path="/creators/apply" element={<CreatorApply />} />
        <Route path="/tasks" element={<Task />} />
        <Route path="/beans" element={<Beans />} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
        <Route path="/admin/creators" element={<AdminRoute><AdminCreators /></AdminRoute>} />
        <Route path="/admin/anti-fraud" element={<AdminRoute><AdminAntiFraud /></AdminRoute>} />
      </Route>
    </Routes>
  )
}
