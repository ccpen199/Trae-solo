import { useAppStore } from '@/store'
import { ArrowLeftRight, MapPin, Star, Truck, Zap, Phone, ArrowUpRight, Search, Filter } from 'lucide-react'
import { useState } from 'react'

export default function ReturnSource() {
  const { capacities } = useAppStore()
  const [search, setSearch] = useState('')
  const returns = capacities.filter(c => c.isReturnSource && c.returnRoute)

  return (
    <div className="space-y-6">
      {/* 统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '今日返程车源', count: returns.length, icon: Truck, color: 'from-primary-500 to-primary-600' },
          { label: '本月成交', count: 128, icon: ArrowLeftRight, color: 'from-success-500 to-success-600' },
          { label: '平均节省运费', count: '23%', icon: Zap, color: 'from-accent-500 to-accent-600' },
          { label: '平均响应时长', count: '8min', icon: MapPin, color: 'from-violet-500 to-violet-600' },
        ].map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} className="card-base p-5 card-hover">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate2-400 font-medium">{item.label}</span>
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} text-white flex items-center justify-center`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold font-mono text-slate2-800 tracking-tight">{item.count}</div>
            </div>
          )
        })}
      </div>

      {/* 搜索 */}
      <div className="card-base p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate2-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索出发地/目的地、车牌号、司机名称..."
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate2-50 border border-transparent text-sm focus:outline-none focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-50 transition-all"
          />
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate2-100 text-xs text-slate2-600 hover:bg-slate2-50 transition-colors">
          <Filter className="w-3.5 h-3.5" />
          车型筛选
        </button>
      </div>

      {/* 返程车源列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {returns.map((cap) => {
          const rt = cap.returnRoute!
          return (
            <div key={cap.id} className="card-base overflow-hidden card-hover group">
              <div className="h-1.5 bg-gradient-to-r from-primary-500 via-violet-500 to-success-500" />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 text-white flex items-center justify-center text-xl font-bold shadow-md ring-4 ring-primary-100">
                    {cap.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate2-800 truncate">{cap.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold text-white ${
                        cap.level === 'gold' ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                        cap.level === 'silver' ? 'bg-gradient-to-r from-slate2-400 to-slate2-500' :
                        'bg-slate2-200 text-slate2-600'
                      }`}>
                        {cap.level === 'gold' ? '金牌' : cap.level === 'silver' ? '银牌' : '普通'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate2-400 mt-0.5">
                      {cap.licensePlate || cap.vehicleType} · 最大{cap.maxWeight}吨/{cap.maxVolume}m³
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-slate2-700 font-mono">{cap.rating}</span>
                  </div>
                </div>

                {/* 路线卡片 */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 via-primary-50 to-success-50 border border-violet-100 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-center flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-success-500 text-white flex items-center justify-center text-xs font-bold mx-auto">起</div>
                      <div className="text-xs font-bold text-slate2-700 mt-1.5">{rt.from}</div>
                    </div>
                    <div className="flex-1 relative h-px bg-gradient-to-r from-success-400 via-primary-400 to-violet-400">
                      <Truck className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-primary-500 text-primary-500 p-0.5 shadow-md" />
                      <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 text-[10px] text-success-600 font-bold whitespace-nowrap bg-white px-1.5 py-0.5 rounded">
                        空车 · 可装货
                      </div>
                    </div>
                    <div className="text-center flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-accent-500 text-white flex items-center justify-center text-xs font-bold mx-auto">终</div>
                      <div className="text-xs font-bold text-slate2-700 mt-1.5">{rt.to}</div>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between text-[11px]">
                    <span className="text-slate2-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      可装货: {rt.availableDate}
                    </span>
                    {rt.pricePerTon && (
                      <span className="font-bold font-mono text-accent-600 bg-white px-2 py-0.5 rounded-full border border-accent-100">
                        ¥{rt.pricePerTon}/吨起
                      </span>
                    )}
                  </div>
                </div>

                {/* 数据 */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="p-2 rounded-lg bg-slate2-50">
                    <div className="text-[10px] text-slate2-400 mb-0.5">履约率</div>
                    <div className="text-sm font-bold font-mono text-success-600">{cap.fulfillmentRate}%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate2-50">
                    <div className="text-[10px] text-slate2-400 mb-0.5">信用分</div>
                    <div className="text-sm font-bold font-mono text-primary-600">{cap.creditScore}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate2-50">
                    <div className="text-[10px] text-slate2-400 mb-0.5">历史单</div>
                    <div className="text-sm font-bold font-mono text-slate2-700">{cap.totalOrders}</div>
                  </div>
                </div>

                {/* 操作 */}
                <div className="flex items-center gap-2">
                  <button className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 via-violet-500 to-primary-600 text-white text-xs font-bold hover:shadow-lg hover:shadow-primary-500/20 transition-all flex items-center justify-center gap-1">
                    <Zap className="w-4 h-4" />
                    一键派单
                  </button>
                  <button className="w-10 h-10 rounded-xl bg-slate2-50 text-slate2-500 hover:bg-accent-50 hover:text-accent-600 transition-colors flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="w-10 h-10 rounded-xl bg-slate2-50 text-slate2-500 hover:bg-primary-50 hover:text-primary-600 transition-colors flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
