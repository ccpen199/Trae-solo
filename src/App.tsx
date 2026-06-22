import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import GuideDetailPage from './pages/GuideDetailPage'
import ReviewDashboard from './pages/ReviewDashboard'
import ServicePlugins from './pages/ServicePlugins'
import AnalyticsDashboard from './pages/AnalyticsDashboard'
import LoadingSpinner from './components/LoadingSpinner'
import { useApp } from './context/AppContext'

function App() {
  const { loading } = useApp()

  return (
    <>
      {loading && <LoadingSpinner fullScreen text="正在加载数据..." />}
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="guide/:id" element={<GuideDetailPage />} />
          <Route path="review" element={<ReviewDashboard />} />
          <Route path="services" element={<ServicePlugins />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
