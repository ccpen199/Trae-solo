import { Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore, type UserRole } from '@/store/authStore'

interface ProtectedRouteProps {
  roles?: UserRole[]
}

export default function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const fetchMe = useAuthStore((state) => state.fetchMe)
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setIsChecking(false)
        setIsAuthorized(false)
        return
      }

      if (user) {
        if (roles && roles.length > 0) {
          setIsAuthorized(roles.includes(user.role))
        } else {
          setIsAuthorized(true)
        }
        setIsChecking(false)
        return
      }

      const result = await fetchMe()
      if (result.success) {
        const currentUser = useAuthStore.getState().user
        if (currentUser) {
          if (roles && roles.length > 0) {
            setIsAuthorized(roles.includes(currentUser.role))
          } else {
            setIsAuthorized(true)
          }
        }
      }
      setIsChecking(false)
    }

    checkAuth()
  }, [token, user, roles, fetchMe])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-zinc-900 mb-2">权限不足</h2>
          <p className="text-zinc-500 mb-4">您没有权限访问此页面</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
          >
            返回上一页
          </button>
        </div>
      </div>
    )
  }

  return <Outlet />
}
