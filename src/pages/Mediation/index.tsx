import { useState } from 'react'
import { mockMediationCases } from '@/mock/data'
import type { MediationCase, MediationMessage } from '@/types'

const STATUS_MAP: Record<MediationCase['status'], { label: string; color: string; bg: string }> = {
  pending: { label: '待受理', color: '#92400E', bg: '#FEF3C7' },
  mediating: { label: '调解中', color: '#1B3A5C', bg: '#DBEAFE' },
  settled: { label: '已和解', color: '#065F46', bg: '#D1FAE5' },
  failed: { label: '调解失败', color: '#991B1B', bg: '#FEE2E2' },
}

const SENDER_MAP: Record<MediationMessage['sender'], { label: string; align: 'left' | 'right'; bg: string; textColor: string }> = {
  mediator: { label: '调解员', align: 'left', bg: '#1B3A5C', textColor: '#FFFFFF' },
  applicant: { label: '申请人', align: 'right', bg: '#C9A84C', textColor: '#1B3A5C' },
  counterparty: { label: '对方当事人', align: 'left', bg: '#F1F5F9', textColor: '#334155' },
}

const DISPUTE_TYPES = ['工资报酬', '劳动合同', '社会保险', '经济补偿', '其他']

export default function Mediation() {
  const [activeTab, setActiveTab] = useState<'apply' | 'process'>('apply')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [disputeType, setDisputeType] = useState('')
  const [counterparty, setCounterparty] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [msgInput, setMsgInput] = useState<Record<string, string>>({})

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  const handleSubmit = () => {
    if (!disputeType || !counterparty || !description) return
    setDisputeType('')
    setCounterparty('')
    setAmount('')
    setDescription('')
  }

  const handleSend = (caseId: string) => {
    const text = msgInput[caseId]?.trim()
    if (!text) return
    setMsgInput(prev => ({ ...prev, [caseId]: '' }))
  }

  return (
    <div className="min-h-screen bg-surface-primary p-6 animate-fade-in-up">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-gov-blue-dark">劳动争议线上调解</h1>
        <p className="text-sm text-gray-500 mt-1">高效便捷 · 线上化解劳动纠纷</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(['apply', 'process'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-gov-blue text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gov-blue/30'
            }`}
          >
            {tab === 'apply' ? '调解申请' : '调解过程'}
          </button>
        ))}
      </div>

      {activeTab === 'apply' && (
        <div className="gov-card p-6 max-w-2xl space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">争议类型</label>
            <select
              value={disputeType}
              onChange={e => setDisputeType(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue/20 bg-white transition-colors"
            >
              <option value="">请选择争议类型</option>
              {DISPUTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">对方当事人</label>
            <input
              type="text"
              value={counterparty}
              onChange={e => setCounterparty(e.target.value)}
              placeholder="请输入对方当事人名称"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">争议金额（元）</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="请输入争议金额"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">争议描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="请详细描述争议情况"
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue/20 resize-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">证据上传</label>
            <div className="border-2 border-dashed border-gray-200 rounded-md p-6 text-center text-gray-400 text-sm hover:border-gov-blue/40 transition-colors cursor-pointer">
              点击或拖拽文件至此处上传证据材料
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!disputeType || !counterparty || !description}
            className="gov-btn-primary w-full py-3 text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            提交调解申请
          </button>
        </div>
      )}

      {activeTab === 'process' && (
        <div className="space-y-4 max-w-2xl">
          {mockMediationCases.map(c => {
            const s = STATUS_MAP[c.status]
            const isExpanded = expandedId === c.id
            return (
              <div key={c.id} className="gov-card overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => toggleExpand(c.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gov-blue-dark">{c.title}</h3>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ color: s.color, backgroundColor: s.bg }}
                      >
                        {s.label}
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>对方：{c.counterparty}</span>
                    <span>申请日期：{c.createdAt}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100">
                    <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                      {c.messages.map(msg => {
                        const cfg = SENDER_MAP[msg.sender]
                        return (
                          <div key={msg.id} className={`flex ${cfg.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] ${cfg.align === 'right' ? 'items-end' : 'items-start'} flex flex-col`}>
                              <span className="text-xs text-gray-400 mb-1">{cfg.label}</span>
                              <div
                                className="px-3 py-2 rounded-lg text-sm leading-relaxed"
                                style={{ backgroundColor: cfg.bg, color: cfg.textColor }}
                              >
                                {msg.content}
                              </div>
                              <span className="text-xs text-gray-300 mt-1">{msg.time}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="border-t border-gray-100 p-3 flex gap-2">
                      <input
                        type="text"
                        value={msgInput[c.id] || ''}
                        onChange={e => setMsgInput(prev => ({ ...prev, [c.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') handleSend(c.id) }}
                        placeholder="输入消息..."
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue/20 transition-colors"
                      />
                      <button
                        onClick={() => handleSend(c.id)}
                        className="px-4 py-2 bg-gov-blue text-white rounded-md text-sm hover:bg-gov-blue-dark transition-colors"
                      >
                        发送
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
