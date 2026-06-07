import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Candidates from './pages/Candidates'
import CandidateDetail from './pages/CandidateDetail'
import CandidateForm from './pages/CandidateForm'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import JobForm from './pages/JobForm'
import Matching from './pages/Matching'
import Headhunter from './pages/Headhunter'
import Interviews from './pages/Interviews'
import InterviewDetail from './pages/InterviewDetail'
import Analytics from './pages/Analytics'
import Campus from './pages/Campus'
import Admin from './pages/Admin'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="candidates" element={<Candidates />} />
        <Route path="candidates/new" element={<CandidateForm />} />
        <Route path="candidates/:id" element={<CandidateDetail />} />
        <Route path="candidates/:id/edit" element={<CandidateForm />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/new" element={<JobForm />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="jobs/:id/edit" element={<JobForm />} />
        <Route path="matching" element={<Matching />} />
        <Route path="headhunter" element={<Headhunter />} />
        <Route path="interviews" element={<Interviews />} />
        <Route path="interviews/:id" element={<InterviewDetail />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="campus" element={<Campus />} />
        <Route path="admin" element={<Admin />} />
      </Route>
    </Routes>
  )
}
