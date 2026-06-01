import React from 'react'
import { Navigate } from 'react-router-dom'
import { Spin, Result } from 'antd'
import { useAuth } from '../../hooks/useAuth'

function ProtectedRoute({ children, requireAdmin = false, allowedRoles }) {
  const { isAuthenticated, isAdmin, user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !isAdmin) {
    return (
      <Result
        status="403"
        title="权限不足"
        subTitle="您没有访问此页面的权限，请联系管理员"
      />
    )
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <Result
        status="403"
        title="权限不足"
        subTitle={`当前角色（${user?.role}）无权访问此页面`}
      />
    )
  }

  return children
}

export default ProtectedRoute
