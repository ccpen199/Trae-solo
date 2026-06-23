import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import MortgageCalculator from './pages/MortgageCalculator'
import TaxCalculator from './pages/TaxCalculator'
import KnowledgeBase from './pages/KnowledgeBase'
import KnowledgeDetail from './pages/KnowledgeDetail'
import PolicyCenter from './pages/PolicyCenter'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/mortgage" replace />} />
        <Route path="/mortgage" element={<MortgageCalculator />} />
        <Route path="/tax" element={<TaxCalculator />} />
        <Route path="/knowledge" element={<KnowledgeBase />} />
        <Route path="/knowledge/:id" element={<KnowledgeDetail />} />
        <Route path="/policy" element={<PolicyCenter />} />
      </Routes>
    </Layout>
  )
}

export default App
