import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'

export default function AuthGuard() {
  const { isAuthenticated, login } = useAppStore()
  const autoDemoLogin = import.meta.env.VITE_AUTO_DEMO_LOGIN === 'true'

  useEffect(() => {
    if (!isAuthenticated && autoDemoLogin) {
      login('insured')
    }
  }, [autoDemoLogin, isAuthenticated, login])

  if (!isAuthenticated && autoDemoLogin) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center text-sm text-gov-blue/70">
        正在进入演示工作台...
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}
