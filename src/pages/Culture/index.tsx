import { mockEVoucherRecords } from '@/mock/data'
import type { EVoucherRecord } from '@/types'

const venues = [
  { name: '国家博物馆', address: '北京市东城区东长安街16号', hours: '09:00-17:00（周一闭馆）', icon: '🏛️' },
  { name: '国家图书馆', address: '北京市海淀区中关村南大街33号', hours: '09:00-21:00', icon: '📚' },
  { name: '中国美术馆', address: '北京市东城区五四大街1号', hours: '09:00-17:00（周一闭馆）', icon: '🎨' },
  { name: '中国科技馆', address: '北京市朝阳区北辰东路5号', hours: '09:30-17:00', icon: '🔬' },
]

const qrPattern = Array.from({ length: 9 }, () =>
  Array.from({ length: 9 }, () => Math.random() > 0.4)
)

export default function Culture() {
  const cultureRecords = mockEVoucherRecords.filter((r: EVoucherRecord) => r.type === 'culture')

  return (
    <div className="min-h-screen bg-surface-primary p-6 animate-fade-in-up">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-gov-blue-dark">文化场馆核验</h1>
        <p className="text-sm text-gray-500 mt-1">社保卡 · 文化惠民</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="gov-card p-6 flex flex-col items-center">
            <div className="w-48 h-48 bg-white border-2 border-gov-blue/20 rounded-xl p-4 flex items-center justify-center relative">
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
                  <span className="text-xs font-bold text-gov-blue">入馆核验码</span>
                </div>
              </div>
            </div>
            <button className="mt-5 w-full py-2.5 rounded-lg bg-gov-blue text-white text-sm font-medium hover:bg-gov-blue-dark transition-colors">
              扫码入馆
            </button>
          </div>

          <div className="gov-card p-6">
            <h2 className="gov-section-title mb-4">入馆记录</h2>
            <div className="space-y-3">
              {cultureRecords.map((r: EVoucherRecord) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100"
                >
                  <div>
                    <p className="text-sm font-medium text-gov-blue-dark">{r.location}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.time}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-600">
                    {r.status === 'used' ? '已入馆' : '待入馆'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 gov-card p-6">
          <h2 className="gov-section-title mb-4">文化场馆</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {venues.map((v) => (
              <div
                key={v.name}
                className="p-4 rounded-lg border border-gray-100 hover:border-gov-blue/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-lg bg-gov-blue/10 flex items-center justify-center shrink-0">
                    <span className="text-xl">{v.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gov-blue-dark">{v.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 truncate">{v.address}</p>
                    <p className="text-xs text-gov-gold mt-1">{v.hours}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
