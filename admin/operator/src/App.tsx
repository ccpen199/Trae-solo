import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Devices from './pages/Devices'
import DeviceControl from './pages/DeviceControl'
import Firmware from './pages/Firmware'
import WorkOrders from './pages/WorkOrders'

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('operator_token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="devices" element={<Devices />} />
        <Route path="device-control" element={<DeviceControl />} />
        <Route path="firmware" element={<Firmware />} />
        <Route path="work-orders" element={<WorkOrders />} />
      </Route>
    </Routes>
  )
}

export default App
