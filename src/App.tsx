import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import KnowledgeGraph from './pages/KnowledgeGraph'
import ResumeParser from './pages/ResumeParser'
import JobModeling from './pages/JobModeling'
import MatchingEngine from './pages/MatchingEngine'
import HRAnalytics from './pages/HRAnalytics'
import { PositionStoreProvider } from './store/PositionStore'

export default function App() {
  return (
    <PositionStoreProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/search" element={<KnowledgeGraph />} />
          <Route path="/discover" element={<KnowledgeGraph />} />
          <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
          <Route path="/resume-parser" element={<ResumeParser />} />
          <Route path="/job-modeling" element={<JobModeling />} />
          <Route path="/matching" element={<MatchingEngine />} />
          <Route path="/analytics" element={<HRAnalytics />} />
          <Route path="/admin" element={<HRAnalytics />} />
        </Route>
      </Routes>
    </PositionStoreProvider>
  )
}
