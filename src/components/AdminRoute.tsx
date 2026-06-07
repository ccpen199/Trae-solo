import { useAppStore } from '@/lib/store'
import { Navigate } from 'react-router-dom'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAppStore()
  if (!token || !user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}
