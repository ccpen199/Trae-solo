import { Navigate } from 'react-router-dom'
import { useAppStore } from '@/lib/store'
import { useEffect, useState } from 'react'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token: storeToken, user: storeUser, setToken, setUser } = useAppStore()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const localToken = localStorage.getItem('etax_token')
    const localUserStr = localStorage.getItem('etax_user')
    let localUser = null
    try {
      localUser = localUserStr ? JSON.parse(localUserStr) : null
    } catch {}

    if (storeToken && storeUser) {
      setIsAuthenticated(true)
      setIsChecking(false)
      return
    }

    if (localToken && localUser) {
      setToken(localToken)
      setUser(localUser)
      setIsAuthenticated(true)
      setIsChecking(false)
      return
    }

    setIsAuthenticated(false)
    setIsChecking(false)
  }, [storeToken, storeUser, setToken, setUser])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500">正在验证身份...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
