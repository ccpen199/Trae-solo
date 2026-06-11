import { Video, Shield, Wrench, Zap } from 'lucide-react'
import type { Supplier } from '@/store'

interface FactoryInspectionProps {
  supplier: Supplier
}

export default function FactoryInspection({ supplier }: FactoryInspectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h3 className="font-serif text-base font-semibold text-navy-700 mb-4">在线验厂</h3>
      <div className="flex gap-6">
        <div className="w-80 h-48 bg-navy-50 rounded-lg flex flex-col items-center justify-center shrink-0">
          <Video size={40} className="text-navy-300 mb-2" />
          <p className="text-sm text-navy-400">验厂直播</p>
          {supplier.isOnline && (
            <span className="mt-2 px-3 py-1 bg-red-50 text-red-500 text-xs rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />直播中
            </span>
          )}
          {!supplier.isOnline && (
            <span className="mt-2 px-3 py-1 bg-navy-50 text-navy-400 text-xs rounded-full">离线</span>
          )}
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h4 className="text-xs font-medium text-navy-500 mb-2 flex items-center gap-1"><Shield size={12} />资质认证</h4>
            <div className="flex flex-wrap gap-1.5">
              {supplier.certifications.length > 0 ? supplier.certifications.map((c) => (
                <span key={c} className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs rounded-md border border-amber-200">{c}</span>
              )) : (
                <span className="text-xs text-navy-300">暂无认证</span>
              )}
            </div>
          </div>
          {supplier.type === 'factory' && (
            <>
              <div>
                <h4 className="text-xs font-medium text-navy-500 mb-2 flex items-center gap-1"><Zap size={12} />产能信息</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-surface rounded-md p-2 text-center">
                    <p className="text-lg font-bold text-navy-700">{supplier.capacity.current.toLocaleString()}</p>
                    <p className="text-[10px] text-navy-400">当前产能</p>
                  </div>
                  <div className="bg-surface rounded-md p-2 text-center">
                    <p className="text-lg font-bold text-navy-700">{supplier.capacity.max.toLocaleString()}</p>
                    <p className="text-[10px] text-navy-400">最大产能</p>
                  </div>
                  <div className="bg-surface rounded-md p-2 text-center">
                    <p className="text-lg font-bold text-teal-600">{supplier.capacity.available.toLocaleString()}</p>
                    <p className="text-[10px] text-navy-400">可用产能</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-navy-500 mb-2 flex items-center gap-1"><Wrench size={12} />工艺能力</h4>
                <div className="flex flex-wrap gap-1.5">
                  {supplier.crafts.map((c) => (
                    <span key={c} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded">{c}</span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
