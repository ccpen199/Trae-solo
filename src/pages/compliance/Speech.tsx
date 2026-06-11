import { useState } from 'react'
import { MessageSquareWarning, AlertTriangle, CheckCircle, User, Bot } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { speechAnalysisData } from '@/data/mockData'

const riskBadge = (level: 'safe' | 'warning' | 'danger') => {
  const map = {
    safe: { label: '安全', className: 'badge-safe' },
    warning: { label: '警告', className: 'badge-warning' },
    danger: { label: '高风险', className: 'badge-danger' },
  }
  const { label, className } = map[level]
  return <span className={className}>{label}</span>
}

const severityIcon = (severity: 'warning' | 'danger') => {
  return severity === 'danger' ? (
    <AlertTriangle size={16} className="text-red-500" />
  ) : (
    <AlertTriangle size={16} className="text-amber-500" />
  )
}

export default function Speech() {
  const [selectedId, setSelectedId] = useState(speechAnalysisData.conversations[0].id)
  const selected = speechAnalysisData.conversations.find(c => c.id === selectedId)!
  const relatedViolations = speechAnalysisData.violations.filter(v => v.conversationId === selectedId)

  return (
    <div className="page-container animate-fade-in-up">
      <PageHeader title="话术分析" subtitle="AI智能检测违规话术与虚假宣传" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 animate-fade-in-up stagger-1">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">对话列表</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {speechAnalysisData.conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full text-left p-4 transition-all duration-150 hover:bg-gray-50 ${
                  selectedId === conv.id ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800">{conv.dealer} ↔ {conv.customer}</span>
                  {riskBadge(conv.riskLevel)}
                </div>
                <p className="text-xs text-gray-400">{conv.date}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 animate-fade-in-up stagger-2">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquareWarning size={18} className="text-emerald-600" />
                <h2 className="text-sm font-semibold text-gray-700">对话详情</h2>
              </div>
              {riskBadge(selected.riskLevel)}
            </div>
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
              {selected.messages.map((msg, idx) => {
                const isDealer = msg.role === 'dealer'
                const isViolated = relatedViolations.some(v => msg.content.includes(v.content))
                return (
                  <div key={idx} className={`flex gap-3 ${isDealer ? '' : 'flex-row-reverse'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isDealer ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {isDealer ? <Bot size={14} /> : <User size={14} />}
                    </div>
                    <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                      isViolated
                        ? 'bg-red-50 border border-red-200 text-red-800'
                        : isDealer
                          ? 'bg-emerald-50 text-gray-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isViolated && (
                        <div className="flex items-center gap-1 mb-1 text-xs text-red-500">
                          <AlertTriangle size={12} />
                          <span>检测到违规内容</span>
                        </div>
                      )}
                      {msg.content}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 animate-fade-in-up stagger-3">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              <h2 className="text-sm font-semibold text-gray-700">违规检测</h2>
              {relatedViolations.length > 0 && (
                <span className="badge-danger ml-auto">{relatedViolations.length} 项违规</span>
              )}
              {relatedViolations.length === 0 && (
                <span className="badge-safe ml-auto flex items-center gap-1">
                  <CheckCircle size={12} />
                  无违规
                </span>
              )}
            </div>
            {relatedViolations.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {relatedViolations.map(v => (
                  <div
                    key={v.id}
                    className={`p-4 ${
                      v.severity === 'danger'
                        ? 'border-l-4 border-l-red-500 bg-red-50/30'
                        : 'border-l-4 border-l-amber-500 bg-amber-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {severityIcon(v.severity)}
                      <span className="text-sm font-medium text-gray-800">{v.type}</span>
                      <span className={v.severity === 'danger' ? 'badge-danger' : 'badge-warning'}>
                        {v.severity === 'danger' ? '严重' : '警告'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">"{v.content}"</p>
                    <div className="flex items-start gap-1 text-xs text-emerald-700 bg-emerald-50 rounded-lg p-2">
                      <CheckCircle size={14} className="mt-0.5 shrink-0" />
                      <span>{v.suggestion}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">该对话未检测到违规内容</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
