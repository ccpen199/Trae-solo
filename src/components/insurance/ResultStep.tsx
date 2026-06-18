import { useState } from 'react'
import { User, BadgeCheck } from 'lucide-react'

type TabKey = 'status' | 'records' | 'benefits'

const insuranceStatus = [
  { type: '养老保险', status: '正常', months: 240, balance: '156,000', lastDate: '2026-05' },
  { type: '医疗保险', status: '正常', months: 240, balance: '48,000', lastDate: '2026-05' },
  { type: '失业保险', status: '正常', months: 180, balance: '-', lastDate: '2026-05' },
]

const paymentRecords = [
  { month: '2026-05', base: '12,000', personal: '960', unit: '1,920', status: '已缴' },
  { month: '2026-04', base: '12,000', personal: '960', unit: '1,920', status: '已缴' },
  { month: '2026-03', base: '12,000', personal: '960', unit: '1,920', status: '已缴' },
  { month: '2026-02', base: '11,500', personal: '920', unit: '1,840', status: '已缴' },
  { month: '2026-01', base: '11,500', personal: '920', unit: '1,840', status: '已缴' },
  { month: '2025-12', base: '11,500', personal: '920', unit: '1,840', status: '已缴' },
]

const benefits = [
  { type: '养老保险', desc: '正常享受基本养老保险待遇', since: '2020-01' },
  { type: '医疗保险', desc: '正常享受城镇职工基本医疗保险', since: '2020-01' },
]

const statusColor: Record<string, string> = {
  '正常': 'bg-success/10 text-success',
  '停缴': 'bg-warning/10 text-warning',
  '终止': 'bg-danger/10 text-danger',
}

function StatusTab() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {insuranceStatus.map((s) => (
        <div key={s.type} className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-gray-900">{s.type}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[s.status]}`}>
              {s.status}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">参保月数</span>
              <span className="text-gray-700">{s.months}月</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">个人账户余额</span>
              <span className="text-gray-700">{s.balance}{s.balance !== '-' ? '元' : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">最近缴费日期</span>
              <span className="text-gray-700">{s.lastDate}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function RecordsTab() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500">
            <th className="text-left px-5 py-3 font-medium">缴费月份</th>
            <th className="text-left px-5 py-3 font-medium">缴费基数</th>
            <th className="text-left px-5 py-3 font-medium">个人缴纳</th>
            <th className="text-left px-5 py-3 font-medium">单位缴纳</th>
            <th className="text-left px-5 py-3 font-medium">状态</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {paymentRecords.map((r) => (
            <tr key={r.month} className="hover:bg-gray-50">
              <td className="px-5 py-3 text-gray-700">{r.month}</td>
              <td className="px-5 py-3 text-gray-700">{r.base}元</td>
              <td className="px-5 py-3 text-gray-700">{r.personal}元</td>
              <td className="px-5 py-3 text-gray-700">{r.unit}元</td>
              <td className="px-5 py-3">
                <span className="text-success text-xs font-medium">{r.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BenefitsTab() {
  return (
    <div className="space-y-3">
      {benefits.map((b) => (
        <div key={b.type} className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">{b.type}</div>
            <div className="text-sm text-gray-500 mt-0.5">{b.desc}</div>
          </div>
          <span className="text-sm text-gray-400">享受起始：{b.since}</span>
        </div>
      ))}
    </div>
  )
}

const tabs: { key: TabKey; label: string }[] = [
  { key: 'status', label: '参保状态' },
  { key: 'records', label: '缴费记录' },
  { key: 'benefits', label: '待遇享受' },
]

export default function ResultStep() {
  const [activeTab, setActiveTab] = useState<TabKey>('status')

  return (
    <div>
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User size={24} className="text-primary" />
        </div>
        <div>
          <div className="font-semibold text-gray-900">张三</div>
          <div className="text-sm text-gray-400 mt-0.5">110101********1234</div>
        </div>
        <div className="ml-auto flex gap-2">
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-success/10 text-success font-medium">
            <BadgeCheck size={12} />
            城镇职工
          </span>
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
            <BadgeCheck size={12} />
            正常参保
          </span>
        </div>
      </div>

      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === t.key ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'status' && <StatusTab />}
      {activeTab === 'records' && <RecordsTab />}
      {activeTab === 'benefits' && <BenefitsTab />}
    </div>
  )
}
