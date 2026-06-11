import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'
import { Clock, CheckCircle, Wifi, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

type TabKey = 'response' | 'completion' | 'online' | 'payment'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'response', label: '服务响应时效' },
  { key: 'completion', label: '工单完成率' },
  { key: 'online', label: '设备在线率' },
  { key: 'payment', label: '物业费收缴率' },
]

const responseData = [
  { month: '1月', avgTime: 45, overtimeRate: 8.2 }, { month: '2月', avgTime: 42, overtimeRate: 6.5 },
  { month: '3月', avgTime: 38, overtimeRate: 5.1 }, { month: '4月', avgTime: 35, overtimeRate: 4.3 },
  { month: '5月', avgTime: 32, overtimeRate: 3.8 }, { month: '6月', avgTime: 30, overtimeRate: 3.2 },
]

const completionData = [
  { category: '水电', rate: 92 }, { category: '门窗', rate: 88 },
  { category: '电梯', rate: 95 }, { category: '管道', rate: 85 },
  { category: '公共设施', rate: 90 }, { category: '其他', rate: 87 },
]

const onlineData = [
  { date: '6/1', rate: 94.5 }, { date: '6/2', rate: 95.2 }, { date: '6/3', rate: 93.8 },
  { date: '6/4', rate: 96.1 }, { date: '6/5', rate: 95.5 }, { date: '6/6', rate: 94.9 },
  { date: '6/7', rate: 97.2 }, { date: '6/8', rate: 96.8 }, { date: '6/9', rate: 95.3 },
  { date: '6/10', rate: 96.5 },
]

const paymentData = [
  { month: '1月', rate: 82.3 }, { month: '2月', rate: 84.1 }, { month: '3月', rate: 85.6 },
  { month: '4月', rate: 86.2 }, { month: '5月', rate: 87.0 }, { month: '6月', rate: 87.5 },
]

const summaryStats: Record<TabKey, { icon: React.ElementType; label: string; value: string; color: 'emerald' | 'blue' | 'amber' | 'red' }[]> = {
  response: [
    { icon: Clock, label: '平均响应时间', value: '30分钟', color: 'blue' },
    { icon: Clock, label: '超时率', value: '3.2%', color: 'amber' },
  ],
  completion: [
    { icon: CheckCircle, label: '综合完成率', value: '89.5%', color: 'emerald' },
  ],
  online: [
    { icon: Wifi, label: '当前在线率', value: '96.5%', color: 'emerald' },
  ],
  payment: [
    { icon: CreditCard, label: '当前收缴率', value: '87.5%', color: 'blue' },
  ],
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<TabKey>('response')

  return (
    <div className="space-y-6">
      <PageHeader title="统计报表" subtitle="查看运营数据分析" />

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === tab.key ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats[activeTab].map((s) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} color={s.color} />
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-slate-800">{tabs.find((t) => t.key === activeTab)?.label}</h3>
          <div className="flex items-center gap-2">
            <input type="date" className="h-8 px-2 rounded border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <span className="text-slate-400 text-xs">至</span>
            <input type="date" className="h-8 px-2 rounded border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        <div className="h-80">
          {activeTab === 'response' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="avgTime" name="平均响应(分)" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="overtimeRate" name="超时率(%)" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'completion' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="rate" name="完成率(%)" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'online' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={onlineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[90, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="rate" name="在线率(%)" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'payment' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[70, 100]} />
                <Tooltip />
                <Bar dataKey="rate" name="收缴率(%)" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
