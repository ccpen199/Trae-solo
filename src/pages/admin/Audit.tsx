import { useAdminStore } from '@/stores/adminStore'
import { Search, Download, Activity, ChevronDown, ChevronUp, Image } from 'lucide-react'
import { useEffect, useState } from 'react'

const actionIcons: Record<string, string> = {
  '认证通过': '✅',
  '认证失败': '❌',
  '人工复核通过': '✅',
  '预警处理': '⚠️',
  '预警触发': '🚨',
}

export default function Audit() {
  const { auditLogs, fetchAuditLogs, loading } = useAdminStore()
  const [searchIdCard, setSearchIdCard] = useState('')
  const [searchCertNo, setSearchCertNo] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [actionType, setActionType] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchAuditLogs()
  }, [fetchAuditLogs])

  const handleSearch = () => {
    const params: Record<string, string> = {}
    if (searchIdCard) params.idCard = searchIdCard
    if (searchCertNo) params.certNo = searchCertNo
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (actionType) params.actionType = actionType
    fetchAuditLogs(params)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Search size={18} className="text-gray-400" />
          <input
            value={searchIdCard}
            onChange={(e) => setSearchIdCard(e.target.value)}
            placeholder="证件号"
            className="border border-gray-200 rounded-badge px-3 py-2 text-sm w-40 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            value={searchCertNo}
            onChange={(e) => setSearchCertNo(e.target.value)}
            placeholder="认证编号"
            className="border border-gray-200 rounded-badge px-3 py-2 text-sm w-40 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-200 rounded-badge px-3 py-2 text-sm bg-white"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-200 rounded-badge px-3 py-2 text-sm bg-white"
          />
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="border border-gray-200 rounded-badge px-3 py-2 text-sm bg-white"
          >
            <option value="">全部操作</option>
            <option value="认证通过">认证通过</option>
            <option value="认证失败">认证失败</option>
            <option value="人工复核通过">人工复核通过</option>
            <option value="预警处理">预警处理</option>
            <option value="预警触发">预警触发</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-primary text-white text-sm rounded-badge hover:bg-primary/90 transition-colors"
          >
            查询
          </button>
        </div>
        <button className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-badge text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <Download size={14} />
          导出日志
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-20">加载中...</div>
      ) : (
        <div className="bg-white rounded-card shadow-card p-6">
          <div className="space-y-0">
            {auditLogs.map((log) => {
              const isExpanded = expandedId === log.id
              return (
                <div key={log.id} className="relative pl-8 pb-6 last:pb-0">
                  <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-gray-100" />
                  <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-bg flex items-center justify-center text-xs">
                    <Activity size={12} className="text-primary" />
                  </div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="w-full text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-base">{actionIcons[log.action] || '📋'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-gray-900">{log.action}</span>
                          <span className="text-xs text-gray-400">{log.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{log.detail}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          <span>操作者: {log.operator}</span>
                          <span>对象: {log.target}</span>
                        </div>
                      </div>
                      {log.screenshots && log.screenshots.length > 0 && (
                        <span className="text-gray-300 group-hover:text-gray-500 transition-colors">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                      )}
                    </div>
                  </button>
                  {isExpanded && log.screenshots && (
                    <div className="mt-3 ml-9 grid grid-cols-4 gap-2">
                      {log.screenshots.map((shot, i) => (
                        <div
                          key={i}
                          className="aspect-video bg-gray-50 rounded-btn flex items-center justify-center border border-gray-100"
                        >
                          <Image size={20} className="text-gray-300" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
