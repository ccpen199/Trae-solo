import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import Verify from '@/pages/Verify'
import Result from '@/pages/Result'
import AdminLayout from '@/components/AdminLayout'
import Dashboard from '@/pages/admin/Dashboard'
import Alerts from '@/pages/admin/Alerts'
import Review from '@/pages/admin/Review'
import ReviewDetail from '@/pages/admin/ReviewDetail'
import Audit from '@/pages/admin/Audit'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/result" element={<Result />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="review" element={<Review />} />
          <Route path="review/:id" element={<ReviewDetail />} />
          <Route path="audit" element={<Audit />} />
        </Route>
      </Routes>
    </Router>
  )
}
