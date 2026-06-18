import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import TalentCenter from '@/pages/TalentCenter'
import TalentDetail from '@/pages/TalentDetail'
import JobCenter from '@/pages/JobCenter'
import JobCreate from '@/pages/JobCreate'
import JobDetail from '@/pages/JobDetail'
import MatchCenter from '@/pages/MatchCenter'
import MatchDetail from '@/pages/MatchDetail'
import Analytics from '@/pages/Analytics'
import GraphPage from '@/pages/GraphPage'

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/talent" element={<TalentCenter />} />
          <Route path="/talent/:id" element={<TalentDetail />} />
          <Route path="/jobs" element={<JobCenter />} />
          <Route path="/jobs/create" element={<JobCreate />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/match" element={<MatchCenter />} />
          <Route path="/match/:jobId/:talentId" element={<MatchDetail />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/graph" element={<GraphPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}
