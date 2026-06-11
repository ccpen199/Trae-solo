import { useState } from 'react'
import { mockEVoucherRecords } from '@/mock/data'
import type { EVoucherRecord } from '@/types'

const cities = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '成都市', '武汉市', '南京市']

const qrPattern = Array.from({ length: 9 }, () =>
  Array.from({ length: 9 }, () => Math.random() > 0.4)
)

export default function Transit() {
  const [city, setCity] = useState('北京市')
  const transitRecords = mockEVoucherRecords.filter((r: EVoucherRecord) => r.type === 'transit')

  return (
    <div className="min-h-screen bg-surface-primary p-6 animate-fade-in-up">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-gov-blue-dark">公共交通扫码</h1>
        <p className="text-sm text-gray-500 mt-1">社保卡 · 一卡通行全国</p>
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
                  <span className="text-xs font-bold text-gov-blue">社保卡乘车码</span>
                </div>
              </div>
            </div>

            <div className="mt-5 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">选择城市</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-gov-blue focus:ring-1 focus:ring-gov-blue/20 transition-colors bg-white"
              >
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex gap-3 w-full">
              <button className="flex-1 py-2.5 rounded-lg bg-gov-blue text-white text-sm font-medium hover:bg-gov-blue-dark transition-colors">
                扫码乘车
              </button>
              <button className="flex-1 py-2.5 rounded-lg border border-gov-blue text-gov-blue text-sm font-medium hover:bg-gov-blue/5 transition-colors">
                充值
              </button>
            </div>
          </div>
        </div>

        <div className="gov-card p-6">
          <h2 className="gov-section-title mb-4">近期乘车记录</h2>
          <div className="space-y-3">
            {transitRecords.map((r: EVoucherRecord) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gov-blue/10 flex items-center justify-center">
                    <span className="text-gov-blue text-lg">🚇</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gov-blue-dark">{r.location}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.time}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-600">
                  {r.status === 'used' ? '已乘车' : '待乘车'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
