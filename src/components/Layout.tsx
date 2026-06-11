import { Outlet, useLocation, Navigate } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import RoleSwitcher from '@/components/RoleSwitcher'
import { useStore } from '@/store'

const pageTitles: Record<string, string> = {
  '/': '工作台',
  '/resume': '简历管理',
  '/resume/diagnosis/new': '智能诊断',
  '/cases': '大牛案例',
  '/tracking': '进程管理',
  '/hr': '协作空间',
  '/hr/screening': 'AI初筛',
  '/hr/analytics': '投递分析',
  '/compliance': '合规中心',
}

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  if (pathname.startsWith('/resume/editor/')) return '简历编辑'
  if (pathname.startsWith('/resume/diagnosis/')) return '诊断报告'
  if (pathname.startsWith('/cases/')) return '案例详情'
  return 'CareerForge'
}

function RoleGuard({ children }: { children: React.ReactNode }) {
  const { currentRole } = useStore()
  const location = useLocation()
  const pathname = location.pathname

  if (currentRole === 'seeker' && pathname.startsWith('/hr')) {
    return <Navigate to="/" replace />
  }

  if (
    currentRole === 'hr' &&
    (pathname.startsWith('/resume/editor') ||
      pathname.startsWith('/resume/diagnosis'))
  ) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default function Layout() {
  const location = useLocation()
  const title = getPageTitle(location.pathname)

  return (
    <div className="min-h-screen bg-ivory">
      <Sidebar />
      <div className="ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-navy-100/50 px-8 py-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-semibold text-navy-500">
            {title}
          </h1>
          <RoleSwitcher />
        </header>
        <main className="flex-1 px-8 py-6 overflow-y-auto">
          <RoleGuard>
            <Outlet />
          </RoleGuard>
        </main>
      </div>
    </div>
  )
}
