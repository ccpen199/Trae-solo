import { Navigate } from 'react-router-dom'
import { useAppStore } from '@/lib/store'

interface Props {
  children: React.ReactNode
  allowedRoles?: string[]
}

export default function RoleRoute({ children, allowedRoles }: Props) {
  const { user } = useAppStore()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
