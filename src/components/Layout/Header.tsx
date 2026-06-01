import React, { useState } from 'react'
import { Bell, Search, User, Settings, LogOut, Package, AlertTriangle, Shield } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'

interface SearchResult {
  type: 'order' | 'exception' | 'decrypt'
  id: string | number
  title: string
  subtitle: string
}

const Header: React.FC = () => {
  const { sidebarOpen, currentUser, notifications, addNotification } = useAppStore()
  const [showUserMenu, setShowUserMenu] = React.useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const navigate = useNavigate()

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setSearchLoading(true)
    setShowSearchResults(true)

    try {
      const [ordersResult, exceptionsResult] = await Promise.all([
        api.orders.list({ page: 1, pageSize: 5 }),
        api.exceptions.list({ page: 1, pageSize: 5 }),
      ])

      const results: SearchResult[] = []

      // 匹配运单
      if (ordersResult.success && ordersResult.data) {
        const orders = ordersResult.data as any[]
        const matchedOrders = orders.filter((o: any) =>
          o.order_no?.includes(query) ||
          o.tracking_no?.includes(query) ||
          o.sender_phone?.includes(query) ||
          o.receiver_phone?.includes(query)
        )
        matchedOrders.forEach((o: any) => {
          results.push({
            type: 'order',
            id: o.id,
            title: `运单: ${o.tracking_no || o.order_no}`,
            subtitle: `收件人: ${o.receiver_name} | 状态: ${o.status}`,
          })
        })
      }

      // 匹配异常件
      if (exceptionsResult.success && exceptionsResult.data) {
        const exceptions = exceptionsResult.data as any[]
        const matchedExceptions = exceptions.filter((e: any) =>
          e.tracking_no?.includes(query) ||
          e.order_no?.includes(query) ||
          e.receiver_phone?.includes(query)
        )
        matchedExceptions.forEach((e: any) => {
          results.push({
            type: 'exception',
            id: e.id,
            title: `异常件: ${e.tracking_no || e.order_no}`,
            subtitle: `${e.description} | 级别: ${e.level}级`,
          })
        })
      }

      // 如果查询的是手机号，添加解密申请入口
      if (/^1\d{10}$/.test(query)) {
        results.push({
          type: 'decrypt',
          id: query,
          title: `申请解密手机号: ${query.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}`,
          subtitle: '点击创建解密申请，授权后可查看完整信息',
        })
      }

      setSearchResults(results.slice(0, 8))
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    setShowSearchResults(false)
    setSearchQuery('')

    switch (result.type) {
      case 'order':
        navigate(`/track/${result.id}`)
        break
      case 'exception':
        navigate('/track/exception')
        addNotification({ type: 'info', message: '已定位到异常中心' })
        break
      case 'decrypt':
        navigate('/security/decrypt')
        addNotification({ type: 'info', message: '请在解密审批中心创建新的解密申请' })
        break
    }
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'order': return Package
      case 'exception': return AlertTriangle
      case 'decrypt': return Shield
      default: return Search
    }
  }

  const getResultColor = (type: string) => {
    switch (type) {
      case 'order': return 'text-sf-blue'
      case 'exception': return 'text-sf-red'
      case 'decrypt': return 'text-sf-yellow'
      default: return 'text-sf-light/50'
    }
  }

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-sf-black/80 backdrop-blur-xl border-b border-sf-blue/30 z-30 transition-all duration-300 ${
        sidebarOpen ? 'left-64' : 'left-16'
      }`}
    >
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sf-light/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery && setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              placeholder="搜索运单号、手机号..."
              className="w-80 h-9 pl-9 pr-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sm text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-sf-blue border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-sf-dark border border-sf-blue/30 rounded-xl shadow-2xl overflow-hidden z-50">
                {searchResults.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    {searchResults.map((result, index) => {
                      const ResultIcon = getResultIcon(result.type)
                      const resultColor = getResultColor(result.type)
                      return (
                        <button
                          key={`${result.type}-${result.id}-${index}`}
                          onClick={() => handleResultClick(result)}
                          className="w-full px-4 py-3 flex items-start gap-3 hover:bg-sf-blue/10 transition-colors text-left border-b border-sf-blue/10 last:border-0"
                        >
                          <div className={`w-8 h-8 rounded-lg bg-sf-black flex items-center justify-center flex-shrink-0 ${resultColor}`}>
                            <ResultIcon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-sf-light font-medium truncate">{result.title}</div>
                            <div className="text-xs text-sf-light/50 mt-0.5 truncate">{result.subtitle}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <Search size={24} className="text-sf-light/30 mx-auto mb-2" />
                    <p className="text-sm text-sf-light/50">
                      {searchLoading ? '搜索中...' : '未找到匹配结果'}
                    </p>
                    {/^1\d{10}$/.test(searchQuery) && (
                      <p className="text-xs text-sf-yellow/70 mt-2">
                        提示：搜索完整手机号可申请解密查看
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-sf-dark text-sf-light/70 hover:text-sf-light transition-colors">
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-sf-red rounded-full text-xs text-white flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          <button className="p-2 rounded-lg hover:bg-sf-dark text-sf-light/70 hover:text-sf-light transition-colors">
            <Settings size={18} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-sf-dark transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-sf-red to-sf-orange rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm text-sf-light">管*员</div>
                <div className="text-xs text-sf-light/50">系统管理员</div>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-sf-dark border border-sf-blue/30 rounded-lg shadow-xl overflow-hidden">
                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-sf-light/70 hover:bg-sf-black hover:text-sf-light transition-colors">
                  <User size={14} />
                  个人中心
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-sf-light/70 hover:bg-sf-black hover:text-sf-light transition-colors">
                  <Settings size={14} />
                  系统设置
                </button>
                <div className="h-px bg-sf-blue/20" />
                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-sf-red hover:bg-sf-black transition-colors">
                  <LogOut size={14} />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
