import fs from 'fs'
import path from 'path'

const basePath = '/Users/chen/Documents/trae_projects/local_projects/may-63456/frontend/src'

const files = {
  'index.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  min-height: 100vh;
}

.ant-layout {
  min-height: 100vh;
}

.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-title {
  text-align: center;
  margin-bottom: 32px;
}

.login-title h1 {
  font-size: 24px;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.login-title p {
  color: #666;
  font-size: 14px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #1a1a2e;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.status-tag {
  font-weight: 500;
}

.detail-card {
  margin-bottom: 24px;
}

.detail-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}

.detail-value {
  color: #1a1a2e;
  font-size: 16px;
  font-weight: 500;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.form-section {
  background: #fafafa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.form-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 16px;
}

.stat-card {
  text-align: center;
  padding: 20px;
}

.stat-card .stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.stat-card .stat-label {
  color: #666;
  font-size: 14px;
}

.chart-container {
  width: 100%;
  height: 400px;
}

@media (max-width: 768px) {
  .login-card {
    width: 90%;
    padding: 24px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
`,

  'App.jsx': `import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Result, Button } from 'antd'
import useAuthStore from './store/authStore'
import { USER_ROLES } from './utils/constants'
import Login from './pages/Login.jsx'
import Layout from './pages/Layout.jsx'
import ServiceList from './pages/patient-family/ServiceList.jsx'
import OrderCreate from './pages/patient-family/OrderCreate.jsx'
import OrderList from './pages/patient-family/OrderList.jsx'
import OrderDetail from './pages/patient-family/OrderDetail.jsx'
import TaskList from './pages/nurse/TaskList.jsx'
import TaskDetail from './pages/nurse/TaskDetail.jsx'
import NursingRecord from './pages/nurse/NursingRecord.jsx'
import Schedule from './pages/nurse/Schedule.jsx'
import OrderPool from './pages/dispatcher/OrderPool.jsx'
import OrderAudit from './pages/dispatcher/OrderAudit.jsx'
import Dispatch from './pages/dispatcher/Dispatch.jsx'
import TaskMonitor from './pages/dispatcher/TaskMonitor.jsx'
import ServiceManage from './pages/admin/ServiceManage.jsx'
import NurseManage from './pages/admin/NurseManage.jsx'
import OrderManage from './pages/admin/OrderManage.jsx'
import Reports from './pages/admin/Reports.jsx'
import Inventory from './pages/admin/Inventory.jsx'

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuthStore()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有权限访问此页面"
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            返回上一页
          </Button>
        }
      />
    )
  }

  return children
}

const getHomeRoute = (role) => {
  switch (role) {
    case USER_ROLES.PATIENT_FAMILY:
      return '/services'
    case USER_ROLES.NURSE:
      return '/nurse/tasks'
    case USER_ROLES.DISPATCHER:
      return '/dispatch/pool'
    case USER_ROLES.ADMIN:
      return '/admin/reports'
    default:
      return '/services'
  }
}

const HomeRedirect = () => {
  const { user } = useAuthStore()
  const homeRoute = user ? getHomeRoute(user.role) : '/login'
  return <Navigate to={homeRoute} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<HomeRedirect />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="services" element={
          <PrivateRoute allowedRoles={[USER_ROLES.PATIENT_FAMILY, USER_ROLES.ADMIN]}>
            <ServiceList />
          </PrivateRoute>
        } />
        <Route path="order/create" element={
          <PrivateRoute allowedRoles={[USER_ROLES.PATIENT_FAMILY]}>
            <OrderCreate />
          </PrivateRoute>
        } />
        <Route path="orders" element={
          <PrivateRoute>
            <OrderList />
          </PrivateRoute>
        } />
        <Route path="orders/:id" element={
          <PrivateRoute>
            <OrderDetail />
          </PrivateRoute>
        } />
        <Route path="nurse/tasks" element={
          <PrivateRoute allowedRoles={[USER_ROLES.NURSE, USER_ROLES.ADMIN]}>
            <TaskList />
          </PrivateRoute>
        } />
        <Route path="nurse/tasks/:id" element={
          <PrivateRoute allowedRoles={[USER_ROLES.NURSE, USER_ROLES.ADMIN]}>
            <TaskDetail />
          </PrivateRoute>
        } />
        <Route path="nurse/record/:orderId" element={
          <PrivateRoute allowedRoles={[USER_ROLES.NURSE]}>
            <NursingRecord />
          </PrivateRoute>
        } />
        <Route path="nurse/schedule" element={
          <PrivateRoute allowedRoles={[USER_ROLES.NURSE, USER_ROLES.ADMIN]}>
            <Schedule />
          </PrivateRoute>
        } />
        <Route path="dispatch/pool" element={
          <PrivateRoute allowedRoles={[USER_ROLES.DISPATCHER, USER_ROLES.ADMIN]}>
            <OrderPool />
          </PrivateRoute>
        } />
        <Route path="dispatch/audit" element={
          <PrivateRoute allowedRoles={[USER_ROLES.DISPATCHER, USER_ROLES.ADMIN]}>
            <OrderAudit />
          </PrivateRoute>
        } />
        <Route path="dispatch/orders/:id" element={
          <PrivateRoute allowedRoles={[USER_ROLES.DISPATCHER, USER_ROLES.ADMIN]}>
            <Dispatch />
          </PrivateRoute>
        } />
        <Route path="dispatch/monitor" element={
          <PrivateRoute allowedRoles={[USER_ROLES.DISPATCHER, USER_ROLES.ADMIN]}>
            <TaskMonitor />
          </PrivateRoute>
        } />
        <Route path="admin/services" element={
          <PrivateRoute allowedRoles={[USER_ROLES.ADMIN]}>
            <ServiceManage />
          </PrivateRoute>
        } />
        <Route path="admin/nurses" element={
          <PrivateRoute allowedRoles={[USER_ROLES.ADMIN]}>
            <NurseManage />
          </PrivateRoute>
        } />
        <Route path="admin/orders" element={
          <PrivateRoute allowedRoles={[USER_ROLES.ADMIN]}>
            <OrderManage />
          </PrivateRoute>
        } />
        <Route path="admin/reports" element={
          <PrivateRoute allowedRoles={[USER_ROLES.ADMIN]}>
            <Reports />
          </PrivateRoute>
        } />
        <Route path="admin/inventory" element={
          <PrivateRoute allowedRoles={[USER_ROLES.ADMIN]}>
            <Inventory />
          </PrivateRoute>
        } />
      </Route>
      <Route
        path="*"
        element={
          <Result
            status="404"
            title="404"
            subTitle="抱歉，您访问的页面不存在"
            extra={
              <Button type="primary" href="/">
                返回首页
              </Button>
            }
          />
        }
      />
    </Routes>
  )
}

export default App
`
}

for (const [fileName, content] of Object.entries(files)) {
  const filePath = path.join(basePath, fileName)
  fs.writeFileSync(filePath, content, 'utf8')
  console.log(`Created: ${filePath}`)
}

console.log('All files generated successfully!')
