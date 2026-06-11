import { useState } from 'react'
import { Banknote, Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { amlData } from '@/data/mockData'

const statusBadge = (status: 'passed' | 'pending' | 'flagged') => {
  const map = {
    passed: { label: '通过', className: 'badge-safe', icon: <CheckCircle size={12} /> },
    pending: { label: '待审', className: 'badge-warning', icon: <AlertTriangle size={12} /> },
    flagged: { label: '标记', className: 'badge-danger', icon: <AlertTriangle size={12} /> },
  }
  const { label, className, icon } = map[status]
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {icon}
      {label}
    </span>
  )
}

const riskBarColor = (score: number) => {
  if (score >= 70) return 'bg-red-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-emerald-500'
}

export default function AML() {
  const [rules, setRules] = useState(amlData.rules)

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  return (
    <div className="page-container animate-fade-in-up">
      <PageHeader title="反洗钱检查" subtitle="大额交易监控与异常资金检测" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 animate-fade-in-up stagger-1">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Banknote size={18} className="text-emerald-600" />
            <h2 className="text-sm font-semibold text-gray-700">最近检查记录</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">经销商</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">金额</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">日期</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">状态</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">风险评分</th>
                </tr>
              </thead>
              <tbody>
                {amlData.recentChecks.map(check => (
                  <tr key={check.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-800">{check.dealer}</td>
                    <td className="py-3 px-4 text-gray-600">¥{check.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-500">{check.date}</td>
                    <td className="py-3 px-4">{statusBadge(check.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className={`h-full rounded-full ${riskBarColor(check.riskScore)} transition-all duration-500`}
                            style={{ width: `${check.riskScore}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          check.riskScore >= 70 ? 'text-red-600' : check.riskScore >= 40 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {check.riskScore}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 animate-fade-in-up stagger-2">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Shield size={18} className="text-emerald-600" />
            <h2 className="text-sm font-semibold text-gray-700">AML规则配置</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {rules.map(rule => (
              <div key={rule.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-800">{rule.name}</span>
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                      rule.enabled ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                        rule.enabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-1">{rule.description}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <span>阈值: {rule.threshold.toLocaleString()}{rule.id === 'R001' ? '元' : rule.id === 'R004' ? '个' : '%'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
