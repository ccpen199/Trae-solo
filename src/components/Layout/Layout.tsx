import { type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import { cn } from '@/lib/utils'

function shouldShowSidebar(pathname: string): boolean {
  if (pathname === '/') return false
  if (pathname.startsWith('/elderly')) return false
  if (pathname.startsWith('/admin')) return false
  return true
}

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const showSidebar = shouldShowSidebar(location.pathname)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex pt-16">
        {showSidebar && <Sidebar />}

        <main
          className={cn(
            'flex-1 min-h-[calc(100vh-4rem)] transition-all duration-300',
            showSidebar ? 'lg:ml-60' : ''
          )}
        >
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
