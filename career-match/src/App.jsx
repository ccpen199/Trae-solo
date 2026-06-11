import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import CompetencyGraph from './pages/CompetencyGraph'
import GapDiagnosis from './pages/GapDiagnosis'
import JobMatch from './pages/JobMatch'
import Encyclopedia from './pages/Encyclopedia'
import HRTools from './pages/HRTools'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="competency" element={<CompetencyGraph />} />
          <Route path="gap-diagnosis" element={<GapDiagnosis />} />
          <Route path="job-match" element={<JobMatch />} />
          <Route path="encyclopedia" element={<Encyclopedia />} />
          <Route path="hr-tools" element={<HRTools />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
