import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import useStore from '../store/useStore'

function ProtectedRoute({ children }) {
  const isAuthenticated = useStore((state) => state.isAuthenticated)
  const location = useLocation()
  
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('redirectAfterLogin', location.pathname + location.search)
    }
  }, [isAuthenticated, location])
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

export default ProtectedRoute
