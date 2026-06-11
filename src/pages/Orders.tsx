import { useState } from 'react'
import OrderRow from '@/components/orders/OrderRow'
import InquiryCard from '@/components/orders/InquiryCard'
import { useStore } from '@/store'

const tabs = [
  { key: 'inquiry', label: '询价单' },
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待付定金' },
  { key: 'deposit_paid', label: '定金已付' },
  { key: 'in_production', label: '生产中' },
  { key: 'quality_check', label: '质检中' },
  { key: 'shipped', label: '已发货' },
  { key: 'completed', label: '已完成' },
]

export default function Orders() {
  const orders = useStore((s) => s.orders)
  const inquiries = useStore((s) => s.inquiries)
  const [activeTab, setActiveTab] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = activeTab === 'all' ? orders : orders.filter((o) => o.status === activeTab)
  const isInquiryTab = activeTab === 'inquiry'

  return (
    <div className="animate-fade-in">
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t.key ? 'bg-navy-700 text-white' : 'bg-white text-navy-500 hover:bg-navy-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {isInquiryTab ? (
        <div className="space-y-4">
          {inquiries.length === 0 ? (
            <div className="py-12 text-center text-sm text-navy-300 bg-white rounded-lg shadow-sm">暂无询价单数据</div>
          ) : (
            inquiries.map((inq) => (
              <InquiryCard key={inq.id} inquiry={inq} />
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center px-4 py-2.5 bg-navy-50 text-xs font-medium text-navy-400">
            <span className="w-32">订单号</span>
            <span className="flex-1">标题</span>
            <span className="w-28">供应商</span>
            <span className="w-24 text-right">金额</span>
            <span className="w-20 text-center">定金</span>
            <span className="w-20">状态</span>
            <span className="w-8" />
          </div>
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-navy-300">暂无订单数据</div>
          ) : (
            filtered.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                expanded={expandedId === order.id}
                onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
