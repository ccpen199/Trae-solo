import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronDown, Star, Image as ImageIcon } from 'lucide-react'
import type { QATicket } from '@/types'
import { qaTickets } from '@/mocks'

const STATUS_TABS: { label: string; value: QATicket['status'] | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '待处理', value: 'pending' },
  { label: '已指派', value: 'assigned' },
  { label: '已回复', value: 'answered' },
  { label: '已关闭', value: 'closed' },
]

const STATUS_CONFIG: Record<QATicket['status'], { label: string; color: string; bg: string }> = {
  pending: { label: '待处理', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  assigned: { label: '已指派', color: 'text-blue-600', bg: 'bg-blue-50' },
  answered: { label: '已回复', color: 'text-primary-600', bg: 'bg-primary-50' },
  closed: { label: '已关闭', color: 'text-gray-500', bg: 'bg-gray-100' },
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? 'fill-gold-400 text-gold-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  )
}

export default function QAPage() {
  const [activeTab, setActiveTab] = useState<QATicket['status'] | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = activeTab === 'all'
    ? qaTickets
    : qaTickets.filter((t) => t.status === activeTab)

  return (
    <div className="min-h-screen bg-[#fafaf8] p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="font-serif text-3xl font-bold text-earth-500">专家问答</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-1 bg-white rounded-lg p-1 shadow-sm border border-gray-100 mb-6"
        >
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 hover:text-primary-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        <div className="space-y-3">
          {filtered.map((ticket) => {
            const cfg = STATUS_CONFIG[ticket.status]
            const isExpanded = expandedId === ticket.id

            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                  className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-earth-500">{ticket.title}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-600">{ticket.category}</span>
                        <span className="text-xs text-gray-400">{ticket.asker}</span>
                        <span className="text-xs text-gray-400">{ticket.createDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${cfg.color} ${cfg.bg}`}>
                        {cfg.label}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                        <p className="text-sm text-gray-600 leading-relaxed">{ticket.description}</p>

                        {ticket.images && ticket.images.length > 0 && (
                          <div className="mt-3 flex gap-2">
                            {ticket.images.map((_, i) => (
                              <div key={i} className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-gray-300" />
                              </div>
                            ))}
                          </div>
                        )}

                        {ticket.answer && (
                          <div className="mt-4 bg-primary-50/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-primary-700">
                                {ticket.expert} 的回答
                              </span>
                              {ticket.answerDate && (
                                <span className="text-xs text-gray-400">{ticket.answerDate}</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">{ticket.answer}</p>
                            {ticket.rating !== undefined && (
                              <div className="mt-3 flex items-center gap-2">
                                <span className="text-xs text-gray-500">评价：</span>
                                <RatingStars rating={ticket.rating} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">暂无该状态下的问答</div>
        )}
      </div>

      <button className="fixed bottom-8 right-8 flex items-center gap-2 px-5 py-3 bg-primary-500 text-white rounded-full font-medium shadow-lg hover:bg-primary-600 transition-colors">
        <Plus className="w-5 h-5" />
        提交问题
      </button>
    </div>
  )
}
