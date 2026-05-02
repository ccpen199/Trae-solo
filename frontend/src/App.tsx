import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

import Login from '@/pages/Login'
import MainLayout from '@/layouts/MainLayout'
import Dashboard from '@/pages/Dashboard'
import RoomStatus from '@/pages/RoomStatus'
import Reservations from '@/pages/Reservations'
import CheckIns from '@/pages/CheckIns'
import Bills from '@/pages/Bills'
import Cleaning from '@/pages/Cleaning'
import Reports from '@/pages/Reports'
import { useUserStore } from '@/store/userStore'

dayjs.locale('zh-cn')

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useUserStore((state) => state.token)
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
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
            <Route index element={<Dashboard />} />
            <Route path="room-status" element={<RoomStatus />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="check-ins" element={<CheckIns />} />
            <Route path="bills" element={<Bills />} />
            <Route path="cleaning" element={<Cleaning />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
