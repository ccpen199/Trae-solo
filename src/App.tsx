import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from '@/components/common/Navbar'
import Home from '@/pages/Home'
import TaskHall from '@/pages/TaskHall'
import TaskDetail from '@/pages/TaskDetail'
import MyTasks from '@/pages/MyTasks'
import Profile from '@/pages/Profile'
import Employer from '@/pages/Employer'
import EmployerCertify from '@/pages/EmployerCertify'
import Admin from '@/pages/Admin'
import AdminRisk from '@/pages/AdminRisk'
import AdminPrediction from '@/pages/AdminPrediction'

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tasks" element={<TaskHall />} />
        <Route path="/tasks/:taskId" element={<TaskDetail />} />
        <Route path="/my-tasks" element={<MyTasks />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/employer" element={<Employer />} />
        <Route path="/employer/certify" element={<EmployerCertify />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/risk" element={<AdminRisk />} />
        <Route path="/admin/prediction" element={<AdminPrediction />} />
      </Routes>
    </Router>
  )
}
