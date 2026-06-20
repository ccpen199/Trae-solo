import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, entryPaths } from '../context/AuthContext'
import type { Role } from '../types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: Role[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, currentUser } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role as Role)) {
    return <Navigate to={entryPaths[currentUser.role as Role]} replace />
  }

  return <>{children}</>
}
