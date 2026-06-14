import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, Bell, User } from 'lucide-react'

const routeTitles: Record<string, string> = {
  '/': '工作台',
  '/qrcode': '市民码',
  '/verify': '无感核验',
  '/cards': '卡片管理',
  '/services': '服务资源',
  '/operations': '运营管理',
}

export default function Header() {
  const location = useLocation()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const title = routeTitles[location.pathname] || '杭州数字身份'

  const formattedDate = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const formattedTime = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-white px-6">
      <h1 className="text-lg font-semibold text-text-primary">{title}</h1>

      <div className="flex items-center gap-5">
        <div className="hidden items-center gap-2 rounded-lg border border-border bg-bg-main px-3 py-2 sm:flex">
          <Search className="h-4 w-4 text-text-secondary" />
          <input
            type="text"
            placeholder="搜索服务..."
            className="w-40 bg-transparent text-sm outline-none placeholder:text-text-secondary"
          />
        </div>

        <div className="relative">
          <Bell className="h-5 w-5 text-text-secondary hover:text-text-primary cursor-pointer" />
          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
            3
          </span>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-sm text-text-secondary">
            {formattedDate} {formattedTime}
          </span>
        </div>

        <div className="flex items-center gap-2.5 border-l border-border pl-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-text-primary">张三</p>
            <p className="text-xs text-text-secondary">市民</p>
          </div>
        </div>
      </div>
    </header>
  )
}
