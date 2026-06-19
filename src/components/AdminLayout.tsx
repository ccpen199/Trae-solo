import { useLocation, Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'

export default function AdminLayout() {
  const location = useLocation()
  const activeRoute = `/admin${location.pathname.replace('/admin', '') || ''}`

  return (
    <div className="flex min-h-screen">
      <AdminSidebar activeRoute={activeRoute} />
      <main className="flex-1 bg-slate-50 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
