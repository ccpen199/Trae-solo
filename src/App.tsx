import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import ResumeList from '@/pages/ResumeList'
import ResumeEditor from '@/pages/ResumeEditor'
import ResumeDiagnosis from '@/pages/ResumeDiagnosis'
import CaseLibrary from '@/pages/CaseLibrary'
import CaseDetail from '@/pages/CaseDetail'
import Tracking from '@/pages/Tracking'
import HrWorkspace from '@/pages/HrWorkspace'
import HrScreening from '@/pages/HrScreening'
import HrAnalytics from '@/pages/HrAnalytics'
import Compliance from '@/pages/Compliance'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/resume" element={<ResumeList />} />
          <Route path="/resume/editor/:id" element={<ResumeEditor />} />
          <Route path="/resume/diagnosis/:id" element={<ResumeDiagnosis />} />
          <Route path="/cases" element={<CaseLibrary />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/hr" element={<HrWorkspace />} />
          <Route path="/hr/screening" element={<HrScreening />} />
          <Route path="/hr/analytics" element={<HrAnalytics />} />
          <Route path="/compliance" element={<Compliance />} />
        </Route>
      </Routes>
    </Router>
  )
}
