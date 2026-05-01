import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, Spin } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import ErrorBoundary from './components/ErrorBoundary'

const Layout = lazy(() => import('./components/Layout'))
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Points = lazy(() => import('./pages/Points'))
const Transactions = lazy(() => import('./pages/Transactions'))
const Exchange = lazy(() => import('./pages/Exchange'))
const ExchangeOrders = lazy(() => import('./pages/ExchangeOrders'))
const Rules = lazy(() => import('./pages/Rules'))
const Reconciliation = lazy(() => import('./pages/Reconciliation'))
const Profile = lazy(() => import('./pages/Profile'))

const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#f5f5f5'
  }}>
    <Spin size="large" />
  </div>
)

const PageLoadingFallback = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  }}>
    <Spin size="large" tip="页面加载中..." />
  </div>
)

function App() {
  return (
    <ErrorBoundary>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#1890ff',
          },
        }}
      >
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Layout />}>
                <Route index element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Dashboard />
                  </Suspense>
                } />
                <Route path="points" element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Points />
                  </Suspense>
                } />
                <Route path="points/transactions" element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Transactions />
                  </Suspense>
                } />
                <Route path="exchange" element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Exchange />
                  </Suspense>
                } />
                <Route path="exchange/orders" element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <ExchangeOrders />
                  </Suspense>
                } />
                <Route path="rules" element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Rules />
                  </Suspense>
                } />
                <Route path="reconciliation" element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Reconciliation />
                  </Suspense>
                } />
                <Route path="profile" element={
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Profile />
                  </Suspense>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ConfigProvider>
    </ErrorBoundary>
  )
}

export default App
