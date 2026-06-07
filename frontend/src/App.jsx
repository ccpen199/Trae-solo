import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import MainLayout from './components/MainLayout'
import Dashboard from './pages/Dashboard'
import PackageList from './pages/PackageList'
import CabinetList from './pages/CabinetList'
import Reservation from './pages/Reservation'
import Rental from './pages/Rental'
import EmpowerCenter from './pages/EmpowerCenter'
import CabinetHealth from './pages/CabinetHealth'
import RevenueAnalysis from './pages/RevenueAnalysis'

function PrivateRoute({ children }) {
  let token = localStorage.getItem('token')
  if (!token && import.meta.env.DEV) {
    token = 'local-demo-courier'
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      username: 'courier001',
      name: '演示快递员',
      phone: '13800138001',
      brands: ['sto', 'yto'],
      serviceArea: '朝阳区A区',
      performancePoints: 1250
    }))
  }
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute>
          <MainLayout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="packages" element={<PackageList />} />
        <Route path="cabinets" element={<CabinetList />} />
        <Route path="reservation" element={<Reservation />} />
        <Route path="rental" element={<Rental />} />
        <Route path="empower" element={<EmpowerCenter />} />
        <Route path="cabinet-health" element={<CabinetHealth />} />
        <Route path="revenue" element={<RevenueAnalysis />} />
      </Route>
    </Routes>
  )
}

export default App
