import { useState, useEffect } from 'react'
import { Menu, Settings, Database, RefreshCw, CheckCircle, XCircle, Clock, Filter, ChevronDown, Activity, AlertCircle, FileCheck } from 'lucide-react'
import { useAdminStore } from '@/stores/adminStore'
import AdminSidebar from '@/components/admin/AdminSidebar'
import StatusBadge from '@/components/StatusBadge'

const typeLabels: Record<string, string> = {
  adoption: '领养备案',
  breeding: '配种备案',
  trading: '交易备案',
  pet: '宠物登记',
}

const statusMap: Record<string, { status: string; label: string }> = {
  pending: { status: 'pending', label: '待备案' },
  processing: { status: 'info', label: '处理中' },
  completed: { status: 'success', label: '已备案' },
  failed: { status: 'rejected', label: '备案失败' },
}

export default function AdminFiling() {
  const { filings, fetchFilings, syncFiling } = useAdminStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [filters, setFilters] = useState({
    filing_type: 'all',
    status: 'all',
    date_range: '7days',
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try { await fetchFilings() } catch {}
      setLoading(false)
    }
    load()
  }, [fetchFilings])

  const handleSync = async () => {
    setSyncing(true)
    try { await syncFiling() } finally { setSyncing(false) }
  }

  const handleRetry = async (id: number) => {
    try { await syncFiling() } catch {}
  }

  const filteredFilings = filings.filter((f: any) => {
    if (filters.filing_type !== 'all' && f.filing_type !== filters.filing_type) return false
    if (filters.status !== 'all' && f.status !== filters.status) return false
    return true
  })

  const apiOnline = true
  const totalCount = filings.length
  const completedCount = filings.filter((f: any) => f.status === 'completed').length
  const successRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="min-h-screen bg-cream flex">
      <AdminSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 bg-white border-b border-stone-200 shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-stone-100 rounded-lg transition"
              >
                <Menu className="w-5 h-5 text-text-secondary" />
              </button>
              <div>
                <h1 className="heading-font text-lg font-bold text-text-primary">备案管理</h1>
                <p className="text-xs text-text-secondary">农业农村部门备案接口对接</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 rounded-full">
                <div className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-success animate-pulse' : 'bg-danger'}`} />
                <span className="text-xs font-medium text-success">
                  {apiOnline ? '农业部门接口状态: 正常' : '农业部门接口状态: 异常'}
                </span>
              </div>
              <button className="p-2 hover:bg-stone-100 rounded-lg transition">
                <Settings className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-8 space-y-6">
          <div className="bg-gradient-to-r from-secondary/10 via-primary/5 to-secondary/10 border border-secondary/20 rounded-2xl p-6 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Database className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="heading-font text-lg font-semibold text-secondary mb-1">农业农村部门备案系统</h3>
                  <p className="text-sm text-text-secondary">
                    所有宠物领养、配种、交易等活体相关操作均需强制接入地方农业农村部门备案接口，确保合法合规。
                    备案数据实时同步，记录永久可追溯。
                  </p>
                </div>
              </div>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-6 py-3 bg-secondary text-white font-medium rounded-xl hover:bg-secondary/90 transition flex items-center gap-2 disabled:opacity-50"
              >
                {syncing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
                {syncing ? '同步中...' : '手动同步备案'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm animate-fadeIn">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-text-secondary text-xs">本月备案</p>
                  <p className="text-2xl font-bold text-text-primary">{totalCount} 笔</p>
                </div>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm animate-fadeIn stagger-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-text-secondary text-xs">备案成功率</p>
                  <p className="text-2xl font-bold text-text-primary">{successRate}%</p>
                </div>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: `${successRate}%` }} />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm animate-fadeIn stagger-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-text-secondary text-xs">待备案</p>
                  <p className="text-2xl font-bold text-text-primary">{filings.filter((f: any) => f.status === 'pending').length} 笔</p>
                </div>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-warning rounded-full" style={{ width: `${totalCount > 0 ? (filings.filter((f: any) => f.status === 'pending').length / totalCount) * 100 : 0}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-stone-100">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-text-secondary" />
                  <span className="text-sm font-medium text-text-primary">筛选</span>
                </div>
                <select
                  value={filters.filing_type}
                  onChange={(e) => setFilters((p) => ({ ...p, filing_type: e.target.value }))}
                  className="px-3 py-1.5 rounded-lg text-sm bg-stone-100 border-0 focus:ring-2 focus:ring-primary/30"
                >
                  <option value="all">全部类型</option>
                  <option value="adoption">领养备案</option>
                  <option value="breeding">配种备案</option>
                  <option value="trading">交易备案</option>
                  <option value="pet">宠物登记</option>
                </select>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                  className="px-3 py-1.5 rounded-lg text-sm bg-stone-100 border-0 focus:ring-2 focus:ring-primary/30"
                >
                  <option value="all">全部状态</option>
                  <option value="pending">待备案</option>
                  <option value="processing">处理中</option>
                  <option value="completed">已备案</option>
                  <option value="failed">备案失败</option>
                </select>
                <select
                  value={filters.date_range}
                  onChange={(e) => setFilters((p) => ({ ...p, date_range: e.target.value }))}
                  className="px-3 py-1.5 rounded-lg text-sm bg-stone-100 border-0 focus:ring-2 focus:ring-primary/30"
                >
                  <option value="today">今天</option>
                  <option value="7days">最近7天</option>
                  <option value="30days">最近30天</option>
                  <option value="90days">最近90天</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse grid grid-cols-6 gap-4">
                    <div className="h-4 bg-stone-200 rounded col-span-1" />
                    <div className="h-4 bg-stone-200 rounded col-span-1" />
                    <div className="h-4 bg-stone-200 rounded col-span-2" />
                    <div className="h-4 bg-stone-200 rounded col-span-1" />
                    <div className="h-4 bg-stone-200 rounded col-span-1" />
                  </div>
                ))}
              </div>
            ) : filteredFilings.length === 0 ? (
              <div className="p-16 text-center">
                <Database className="w-16 h-16 mx-auto mb-4 text-text-secondary/20" />
                <p className="text-text-secondary">暂无备案记录</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                <div className="px-4 py-3 bg-stone-50 grid grid-cols-12 gap-4 text-sm text-text-secondary">
                  <span className="col-span-2">备案编号</span>
                  <span className="col-span-2">备案类型</span>
                  <span className="col-span-1">关联ID</span>
                  <span className="col-span-2">状态</span>
                  <span className="col-span-2">提交时间</span>
                  <span className="col-span-2">响应时间</span>
                  <span className="col-span-1">操作</span>
                </div>
                {filteredFilings.map((filing: any, index: number) => {
                  const status = statusMap[filing.status] || statusMap.pending
                  const typeLabel = typeLabels[filing.filing_type] || filing.filing_type
                  let responseData = null
                  try {
                    responseData = filing.response_data ? JSON.parse(filing.response_data) : null
                  } catch {}
                  return (
                    <div key={filing.id} className="px-4 py-4 grid grid-cols-12 gap-4 items-center hover:bg-stone-50 transition animate-fadeIn" style={{ animationDelay: `${index * 0.05}s` }}>
                      <div className="col-span-2">
                        <span className="font-mono text-sm text-text-primary">{filing.filing_id || `BL${filing.id?.toString().padStart(8, '0')}`}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                          <Activity className="w-3 h-3" />
                          {typeLabel}
                        </span>
                      </div>
                      <span className="col-span-1 text-sm text-text-secondary">#{filing.related_id}</span>
                      <div className="col-span-2">
                        <StatusBadge status={status.status} label={status.label} />
                      </div>
                      <span className="col-span-2 text-sm text-text-secondary flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {filing.filed_at ? new Date(filing.filed_at).toLocaleString('zh-CN') : '--'}
                      </span>
                      <span className="col-span-2 text-sm text-text-secondary">
                        {filing.responded_at ? new Date(filing.responded_at).toLocaleString('zh-CN') : '--'}
                      </span>
                      <div className="col-span-1 flex items-center gap-1">
                        {responseData && (
                          <button
                            className="p-2 hover:bg-stone-100 rounded-lg transition"
                            title={`${responseData.code || ''} ${responseData.message || ''}`}
                          >
                            {responseData.code === '200' || responseData.code === 200 ? (
                              <CheckCircle className="w-4 h-4 text-success" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-warning" />
                            )}
                          </button>
                        )}
                        {filing.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(filing.id)}
                            className="p-2 hover:bg-primary/10 rounded-lg transition"
                            title="重试备案"
                          >
                            <RefreshCw className="w-4 h-4 text-primary" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn">
              <h3 className="heading-font text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                备案趋势
              </h3>
              <div className="space-y-4">
                {[
                  { label: '领养备案', count: 128, color: 'bg-primary' },
                  { label: '配种备案', count: 86, color: 'bg-secondary' },
                  { label: '宠物登记', count: 256, color: 'bg-blue-500' },
                  { label: '交易备案', count: 42, color: 'bg-amber-500' },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">{item.label}</span>
                      <span className="font-medium text-text-primary">{item.count} 笔</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${(item.count / 300) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn stagger-1">
              <h3 className="heading-font text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
                <Database className="w-5 h-5 text-secondary" />
                接口配置
              </h3>
              <div className="space-y-3">
                {[
                  { label: '接口地址', value: 'https://api.agri.gov.cn/pet-filing/v1' },
                  { label: 'API Key', value: 'AK*****************89f2' },
                  { label: '最近心跳', value: '10秒前' },
                  { label: '平均响应时间', value: '235ms' },
                  { label: '今日调用次数', value: '128 次' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                    <span className="text-sm text-text-secondary">{item.label}</span>
                    <span className="text-sm font-medium text-text-primary font-mono">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
