import { useState } from 'react'
import { CalendarCheck, Clock, User, Store } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { appointments } from '@/data/mockData'

const statusConfig = {
  confirmed: { label: '已确认', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  pending: { label: '待确认', bg: 'bg-amber-50', text: 'text-amber-700' },
  cancelled: { label: '已取消', bg: 'bg-red-50', text: 'text-red-700' },
}

const dates = ['2025-06-09', '2025-06-10', '2025-06-11']
const dateLabels = ['今天', '明天', '后天']
const filterTabs = ['all', 'confirmed', 'pending', 'cancelled'] as const
const filterLabels: Record<string, string> = { all: '全部', confirmed: '已确认', pending: '待确认', cancelled: '已取消' }

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState('2025-06-09')
  const [filter, setFilter] = useState<string>('all')

  const filtered = appointments
    .filter(a => a.date === selectedDate)
    .filter(a => filter === 'all' || a.status === filter)

  return (
    <div className="p-6 animate-fade-in-up">
      <PageHeader title="预约管理" subtitle="查看和管理门店服务预约" />

      <div className="flex gap-2 mb-6">
        {dates.map((d, i) => (
          <button
            key={d}
            onClick={() => setSelectedDate(d)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedDate === d ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'}`}
          >
            {dateLabels[i]}
            <span className="ml-1 text-xs opacity-75">{d.slice(5)}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        {filterTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === tab ? 'bg-emerald-50 text-emerald-700 font-medium' : 'bg-white text-gray-500 border border-gray-200 hover:border-emerald-300'}`}
          >
            {filterLabels[tab]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <CalendarCheck size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">暂无预约记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(apt => {
            const cfg = statusConfig[apt.status]
            return (
              <div key={apt.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <User size={20} className="text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{apt.customerName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock size={14} />
                          <span>{apt.timeSlot}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Store size={14} />
                          <span>{apt.storeName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-gray-50 text-sm text-gray-600">
                    {apt.service}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
