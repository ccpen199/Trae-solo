import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import useAuthStore from './store/authStore'
import Login from './pages/Login'
import StudentLayout from './layouts/StudentLayout'
import TeacherLayout from './layouts/TeacherLayout'
import TALayout from './layouts/TALayout'
import AdminLayout from './layouts/AdminLayout'

function App() {
  const { isAuthenticated, user } = useAuthStore()

  const getLayoutByRole = () => {
    if (!isAuthenticated) return null
    switch (user?.role) {
      case 'student':
        return <StudentLayout />
      case 'teacher':
        return <TeacherLayout />
      case 'ta':
        return <TALayout />
      case 'admin':
        return <AdminLayout />
      default:
        return <StudentLayout />
    }
  }

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route path="/*" element={isAuthenticated ? getLayoutByRole() : <Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}

export default App
