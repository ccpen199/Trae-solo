import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import BasicLayout from '@/layouts/BasicLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Station from '@/pages/Station'
import Pile from '@/pages/Pile'
import Order from '@/pages/Order'
import Settlement from '@/pages/Settlement'
import Revenue from '@/pages/Revenue'
import User from '@/pages/User'
import Community from '@/pages/Community'
import Operator from '@/pages/Operator'

function App() {
  const { token } = useAuthStore()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={token ? <BasicLayout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="station" element={<Station />} />
        <Route path="pile" element={<Pile />} />
        <Route path="order" element={<Order />} />
        <Route path="settlement" element={<Settlement />} />
        <Route path="revenue" element={<Revenue />} />
        <Route path="user" element={<User />} />
        <Route path="community" element={<Community />} />
        <Route path="operator" element={<Operator />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
