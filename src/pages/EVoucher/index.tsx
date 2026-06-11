import { useState } from 'react'
import { mockEVoucherRecords } from '@/mock/data'
import { useAppStore } from '@/store/useAppStore'
import type { EVoucherRecord } from '@/types'

const qrPattern = Array.from({ length: 9 }, () =>
  Array.from({ length: 9 }, () => Math.random() > 0.4)
)

export default function EVoucher() {
  const user = useAppStore((s) => s.user)
  const [refreshing, setRefreshing] = useState(false)
  const medicalRecords = mockEVoucherRecords.filter((r: EVoucherRecord) => r.type === 'medical')
  const maskedCard = user?.idCard ? user.idCard.slice(0, 6) + '********' + user.idCard.slice(-4) : ''

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1500)
  }

  return (
    <div className="min-h-screen bg-surface-primary p-6 animate-fade-in-up">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-gov-blue-dark">就医购药电子凭证</h1>
        <p className="text-sm text-gray-500 mt-1">医保电子凭证 · 一码通用</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="gov-card p-6 flex flex-col items-center">
            <div className="w-56 h-56 bg-white border-2 border-gov-blue/20 rounded-xl p-4 flex items-center justify-center relative">
              <div className="grid grid-cols-9 gap-[2px] w-full h-full">
                {qrPattern.flat().map((filled: boolean, i: number) => (
                  <div
                    key={i}
                    className={`rounded-[1px] ${filled ? 'bg-gov-blue-dark' : 'bg-gray-100'}`}
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white px-2 py-1 rounded border border-gov-gold/40">
                  <span className="text-xs font-bold text-gov-blue">医保电子凭证</span>
                </div>
              </div>
            </div>
            <div className="mt-4 w-full space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">持卡人姓名</span>
                <span className="font-medium text-gov-blue-dark">{user?.name || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">社保卡号</span>
                <span className="font-medium text-gov-blue-dark">{maskedCard || '—'}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-500">凭证状态</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                  有效
                </span>
              </div>
            </div>
            <div className="mt-5 flex gap-3 w-full">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex-1 py-2.5 rounded-lg border border-gov-blue text-gov-blue text-sm font-medium hover:bg-gov-blue/5 transition-colors disabled:opacity-50"
              >
                {refreshing ? '刷新中...' : '刷新凭证'}
              </button>
              <button className="flex-1 py-2.5 rounded-lg bg-gov-blue text-white text-sm font-medium hover:bg-gov-blue-dark transition-colors">
                出示凭证
              </button>
            </div>
          </div>
        </div>

        <div className="gov-card p-6">
          <h2 className="gov-section-title mb-4">就医购药记录</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 text-gray-500 font-medium">医疗机构</th>
                  <th className="text-right py-3 text-gray-500 font-medium">金额</th>
                  <th className="text-right py-3 text-gray-500 font-medium">时间</th>
                  <th className="text-right py-3 text-gray-500 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {medicalRecords.map((r: EVoucherRecord) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 text-gov-blue-dark">{r.location}</td>
                    <td className="py-3 text-right text-gov-gold font-medium">¥{r.amount?.toFixed(2)}</td>
                    <td className="py-3 text-right text-gray-500">{r.time}</td>
                    <td className="py-3 text-right">
                      <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-600">
                        {r.status === 'used' ? '已使用' : '待使用'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
