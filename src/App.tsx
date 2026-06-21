import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Layout from '@/components/Layout/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Home from '@/pages/Home/index'
import Government from '@/pages/Government/index'
import ServiceDetail from '@/pages/Government/ServiceDetail'
import CityService from '@/pages/CityService/index'
import Transport from '@/pages/CityService/Transport'
import Scenic from '@/pages/CityService/Scenic'
import Hospital from '@/pages/CityService/Hospital'
import Education from '@/pages/CityService/Education'
import PublicService from '@/pages/PublicService/index'
import SmartGuide from '@/pages/SmartGuide/index'
import Elderly from '@/pages/Elderly/index'
import Profile from '@/pages/Profile/index'
import Monitor from '@/pages/Admin/Monitor'
import Login from '@/pages/Login/index'

function AnimatedRoutes() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  if (isLoginPage) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Login />
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/government" element={<Government />} />
            <Route
              path="/government/:serviceId"
              element={
                <ProtectedRoute>
                  <ServiceDetail />
                </ProtectedRoute>
              }
            />
            <Route path="/city-service" element={<CityService />} />
            <Route
              path="/city-service/transport"
              element={
                <ProtectedRoute>
                  <Transport />
                </ProtectedRoute>
              }
            />
            <Route path="/city-service/scenic" element={<Scenic />} />
            <Route
              path="/city-service/hospital"
              element={
                <ProtectedRoute>
                  <Hospital />
                </ProtectedRoute>
              }
            />
            <Route
              path="/city-service/education"
              element={
                <ProtectedRoute>
                  <Education />
                </ProtectedRoute>
              }
            />
            <Route path="/public-service" element={<PublicService />} />
            <Route path="/smart-guide" element={<SmartGuide />} />
            <Route path="/elderly" element={<Elderly />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/monitor"
              element={
                <ProtectedRoute>
                  <Monitor />
                </ProtectedRoute>
              }
            />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </Layout>
  )
}

export default function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  )
}
