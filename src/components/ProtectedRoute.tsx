import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useStore } from '@/store/useStore'

interface ProtectedRouteProps {
  children: ReactNode
  required?: boolean
}

export default function ProtectedRoute({ children, required = true }: ProtectedRouteProps) {
  const isAuthenticated = useStore((s) => s.isAuthenticated)
  const isAuthenticating = useStore((s) => s.isAuthenticating)
  const location = useLocation()

  if (isAuthenticating) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">身份认证中...</p>
        </div>
      </div>
    )
  }

  if (required && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
