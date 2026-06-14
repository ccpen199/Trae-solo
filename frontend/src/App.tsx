import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Workers from './pages/Workers'
import WorkerDetail from './pages/WorkerDetail'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import JobCreate from './pages/JobCreate'
import Matches from './pages/Matches'
import Contracts from './pages/Contracts'
import WagePayments from './pages/WagePayments'
import Analytics from './pages/Analytics'
import Employers from './pages/Employers'
import Trades from './pages/Trades'
import Profile from './pages/Profile'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="admin" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="my" element={<Profile />} />
        <Route path="workers" element={<Workers />} />
        <Route path="workers/:id" element={<WorkerDetail />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/new" element={<JobCreate />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="matches" element={<Matches />} />
        <Route path="contracts" element={<Contracts />} />
        <Route path="wage-payments" element={<WagePayments />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="employers" element={<Employers />} />
        <Route path="trades" element={<Trades />} />
      </Route>
    </Routes>
  )
}

export default App
