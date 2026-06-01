import React from 'react'
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
        <Route
          path="services"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.PATIENT_FAMILY, USER_ROLES.ADMIN]}>
              <ServiceList />
            </PrivateRoute>
          }
        />
        <Route
          path="order/create"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.PATIENT_FAMILY]}>
              <OrderCreate />
            </PrivateRoute>
          }
        />
        <Route
          path="patient-family/orders"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.PATIENT_FAMILY]}>
              <OrderList />
            </PrivateRoute>
          }
        />
        <Route
          path="patient-family/orders/:id"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.PATIENT_FAMILY]}>
              <OrderDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="nurse/tasks"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.NURSE, USER_ROLES.ADMIN]}>
              <TaskList />
            </PrivateRoute>
          }
        />
        <Route
          path="nurse/tasks/:id"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.NURSE, USER_ROLES.ADMIN]}>
              <TaskDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="nurse/record/:orderId"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.NURSE]}>
              <NursingRecord />
            </PrivateRoute>
          }
        />
        <Route
          path="nurse/schedule"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.NURSE, USER_ROLES.ADMIN]}>
              <Schedule />
            </PrivateRoute>
          }
        />
        <Route
          path="dispatch/pool"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.DISPATCHER, USER_ROLES.ADMIN]}>
              <OrderPool />
            </PrivateRoute>
          }
        />
        <Route
          path="dispatch/audit"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.DISPATCHER, USER_ROLES.ADMIN]}>
              <OrderAudit />
            </PrivateRoute>
          }
        />
        <Route
          path="dispatch/dispatch/:orderId"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.DISPATCHER, USER_ROLES.ADMIN]}>
              <Dispatch />
            </PrivateRoute>
          }
        />
        <Route
          path="dispatch/monitor"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.DISPATCHER, USER_ROLES.ADMIN]}>
              <TaskMonitor />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/services"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <ServiceManage />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/nurses"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <NurseManage />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/orders"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <OrderManage />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/reports"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <Reports />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/inventory"
          element={
            <PrivateRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <Inventory />
            </PrivateRoute>
          }
        />
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
