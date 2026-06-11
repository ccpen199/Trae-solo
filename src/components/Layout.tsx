import { Outlet, useLocation, Link, Navigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { useStore } from '@/store'

const breadcrumbMap: Record<string, string> = {
  '/': '首页',
  '/market': '供需大厅',
  '/match': '智能匹配',
  '/map': '产业地图',
  '/orders': '订单中心',
  '/news': '资讯报告',
  '/supplier/:id': '供应商详情',
}

export default function Layout() {
  const location = useLocation()
  const isLoggedIn = useStore((s) => s.isLoggedIn)
  const pathParts = location.pathname.split('/').filter(Boolean)

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  const crumbs = pathParts.length === 0
    ? [{ label: '首页', path: '/' }]
    : [
        { label: '首页', path: '/' },
        ...pathParts.map((part, i) => {
          const path = '/' + pathParts.slice(0, i + 1).join('/')
          const pattern = Object.keys(breadcrumbMap).find((key) => {
            const keyParts = key.split('/').filter(Boolean)
            if (keyParts.length !== i + 1) return false
            return keyParts.every((kp, j) => kp.startsWith(':') || kp === pathParts[j])
          })
          return { label: breadcrumbMap[pattern || path] || part, path }
        }),
      ]

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 bg-white border-b border-navy-100 flex items-center px-6 shrink-0">
          <nav className="flex items-center text-sm text-navy-400">
            {crumbs.map((crumb, i) => (
              <span key={crumb.path + i} className="flex items-center">
                {i > 0 && <ChevronRight size={14} className="mx-1 text-navy-200" />}
                {i < crumbs.length - 1 ? (
                  <Link to={crumb.path} className="hover:text-navy-600 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-navy-700 font-medium">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
