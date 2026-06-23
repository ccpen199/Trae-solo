import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'

const RiderApp = lazy(() => import('./apps/rider/RiderApp'))
const AdminApp = lazy(() => import('./apps/admin/AdminApp'))

function App() {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center bg-cyber-darker">
        <div className="text-cyber-accent font-rajdhani text-2xl animate-pulse">
          LOADING...
        </div>
      </div>
    }>
      <Routes>
        <Route path="/" element={<Navigate to="/rider" replace />} />
        <Route path="/rider/*" element={<RiderApp />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </Suspense>
  )
}

export default App
