import { useAppStore } from '@/store'
import {
  Wrench, Plus, Calendar, Clock, CheckCircle2, FileCheck, Star,
  Search, MapPin, ChevronRight, Shield, AlertCircle, ArrowUpCircle,
} from 'lucide-react'
import { useState } from 'react'

const services = [
  { id: 1, name: '小保养', desc: '机油+机滤更换', price: 480, duration: '45分钟', icon: '🛢️', popular: false },
  { id: 2, name: '大保养', desc: '三滤+变速箱油+全车检查', price: 1280, duration: '2小时', icon: '🔧', popular: true },
  { id: 3, name: '轮胎更换', desc: '含动平衡+四轮定位', price: 880, duration: '1.5小时', icon: '🛞', popular: false },
  { id: 4, name: '刹车系统', desc: '刹车片+刹车油+检测', price: 680, duration: '1小时', icon: '🛑', popular: false },
  { id: 5, name: '发动机深度', desc: '积碳清洗+油路保养', price: 960, duration: '2小时', icon: '⚙️', popular: false },
  { id: 6, name: '空调系统', desc: '冷媒+滤芯+除菌', price: 380, duration: '1小时', icon: '❄️', popular: false },
  { id: 7, name: '全车综合', desc: '底盘+电气+传动系统', price: 580, duration: '2小时', icon: '🚛', popular: false },
  { id: 8, name: '钣金喷漆', desc: '单幅面+烤漆', price: 1680, duration: '3天', icon: '🎨', popular: false },
]

const shops = [
  { id: 1, name: '潍柴服务中心·深圳旗舰店', distance: '3.2km', rating: 4.9, count: 1280, brand: '潍柴', level: 'AAA', services: 23 },
  { id: 2, name: '重汽特约维修·宝安店', distance: '6.8km', rating: 4.8, count: 856, brand: '重汽', level: 'AA', services: 18 },
  { id: 3, name: '解放卡车服务·龙岗店', distance: '12.5km', rating: 4.7, count: 632, brand: '解放', level: 'AA', services: 21 },
  { id: 4, name: '全国连锁驰加·光明店', distance: '15.8km', rating: 4.9, count: 1456, brand: '米其林', level: 'AAA', services: 15 },
]

export default function MaintenanceService() {
  const { maintenanceOrders } = useAppStore()
  const [tab, setTab] = useState<'home' | 'orders'>('home')

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-600',
    confirmed: 'bg-blue-50 text-blue-600',
    in_progress: 'bg-violet-50 text-violet-600',
    completed: 'bg-success-50 text-success-600',
    closed: 'bg-slate2-100 text-slate2-500',
  }
  const statusLabel: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    in_progress: '施工中',
    completed: '已完工',
    closed: '已结单',
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: '合作门店', count: 286, icon: MapPin, color: 'from-primary-500 to-indigo-600' },
          { label: '本月预约', count: 14, icon: Calendar, color: 'from-emerald-500 to-teal-600' },
          { label: '进行中工单', count: maintenanceOrders.filter(o => ['pending', 'confirmed', 'in_progress'].includes(o.status)).length, icon: Wrench, color: 'from-amber-500 to-orange-600' },
          { label: '累计节省', count: '¥12,680', icon: Shield, color: 'from-sky-500 to-indigo-600' },
          { label: '平均评分', count: 4.9, icon: Star, color: 'from-accent-500 to-red-600' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="card-base p-5 card-hover">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate2-400 font-medium">{s.label}</span>
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-md`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold font-mono text-slate2-800 tracking-tight flex items-center gap-1">
                {s.count}
                {i === 4 && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
              </div>
            </div>
          )
        })}
      </div>

      {/* Tab切换 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTab('home')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === 'home'
              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
              : 'bg-white border border-slate2-200 text-slate2-500 hover:bg-slate2-50'
          }`}
        >
          服务中心
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
            tab === 'orders'
              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
              : 'bg-white border border-slate2-200 text-slate2-500 hover:bg-slate2-50'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          我的工单
          <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{maintenanceOrders.length}</span>
        </button>
        <div className="ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate2-400" />
          <input placeholder="搜索服务/门店/工单" className="w-64 h-10 pl-9 pr-3 rounded-xl bg-white border border-slate2-200 text-xs focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-50 transition-all" />
        </div>
      </div>

      {tab === 'home' ? (
        <>
          {/* 服务项目 */}
          <div className="card-base overflow-hidden card-hover">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate2-100">
              <h3 className="font-bold text-slate2-800 text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary-500" />
                选择维保服务项目
              </h3>
              <span className="text-[11px] text-slate2-400">平台合作价 · 比门店优惠 15~30%</span>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              {services.map((s) => (
                <div key={s.id} className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all group hover:border-primary-300 hover:shadow-md ${s.popular ? 'border-amber-300 bg-gradient-to-br from-amber-50/60 to-white' : 'border-slate2-100 bg-slate2-50/40 hover:bg-white'}`}>
                  {s.popular && (
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold shadow-md flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-white" /> 热门
                    </div>
                  )}
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className="font-bold text-sm text-slate2-800 mb-0.5">{s.name}</div>
                  <div className="text-[11px] text-slate2-500 mb-3 min-h-[32px] leading-relaxed">{s.desc}</div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate2-100">
                    <div>
                      <div className="text-xl font-extrabold font-mono text-primary-600">¥{s.price}</div>
                      <div className="text-[9px] text-slate2-400 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{s.duration}</div>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-[11px] font-bold hover:bg-primary-600 transition-colors flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                      预约 <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 推荐门店 */}
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8">
              <div className="card-base overflow-hidden card-hover">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate2-100">
                  <h3 className="font-bold text-slate2-800 text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary-500" />
                    附近推荐维修门店
                  </h3>
                  <span className="text-[11px] text-primary-500 font-medium">按距离排序 ↓</span>
                </div>
                <div className="divide-y divide-slate2-50">
                  {shops.map((s) => (
                    <div key={s.id} className="p-5 flex items-center gap-4 hover:bg-slate2-50/60 transition-colors cursor-pointer">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                        <MapPin className="w-7 h-7" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-slate2-800">{s.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-primary-500 to-violet-500 text-white font-bold">{s.level}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate2-50 text-slate2-600">{s.brand} 特约</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate2-500">
                          <span className="flex items-center gap-0.5 text-amber-500">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span className="font-bold">{s.rating}</span>
                            <span className="text-slate2-400">({s.count}评价)</span>
                          </span>
                          <span>提供 {s.services} 项服务</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold font-mono text-primary-600 mb-0.5">{s.distance}</div>
                        <div className="text-[10px] text-slate2-400 mb-2">距您位置</div>
                        <button className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-primary-500 to-violet-500 text-white text-[11px] font-bold hover:shadow-md transition-all flex items-center gap-0.5 ml-auto">
                          立即预约 <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 快速预约 */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="card-base overflow-hidden card-hover">
                <div className="px-5 py-4 bg-gradient-to-r from-primary-500 via-indigo-500 to-violet-600 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowUpCircle className="w-4 h-4 text-yellow-300" />
                    <span className="text-xs font-medium opacity-90">平台专享 · 一键下单</span>
                  </div>
                  <div className="text-lg font-bold">快速预约维保</div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate2-600 mb-1.5">选择车牌号</label>
                    <select className="w-full h-10 px-3 rounded-lg bg-slate2-50 border border-slate2-100 text-xs focus:outline-none focus:bg-white focus:border-primary-300 transition-all cursor-pointer">
                      <option>粤B·D12345 · 解放 J6P</option>
                      <option>粤B·88888 · 重汽 豪沃 T7H</option>
                      <option>浙B·23456 · 东风 天龙</option>
                      <option>鲁F·H6666 · 潍柴 乘龙</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate2-600 mb-1.5">选择服务项目</label>
                    <select className="w-full h-10 px-3 rounded-lg bg-slate2-50 border border-slate2-100 text-xs focus:outline-none focus:bg-white focus:border-primary-300 transition-all cursor-pointer">
                      <option>大保养 · ¥1,280</option>
                      <option>小保养 · ¥480</option>
                      <option>全车综合检查 · ¥580</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate2-600 mb-1.5">预约到店时间</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" className="h-10 px-3 rounded-lg bg-white border border-slate2-200 text-xs font-mono focus:outline-none focus:border-primary-300 transition-all" />
                      <select className="h-10 px-3 rounded-lg bg-white border border-slate2-200 text-xs focus:outline-none focus:border-primary-300 transition-all cursor-pointer">
                        <option>09:00</option>
                        <option>10:00</option>
                        <option>14:00</option>
                        <option>15:00</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate2-600 mb-1.5">门店选择</label>
                    <select className="w-full h-10 px-3 rounded-lg bg-slate2-50 border border-slate2-100 text-xs focus:outline-none focus:bg-white focus:border-primary-300 transition-all cursor-pointer">
                      <option>潍柴服务中心·深圳旗舰店 (3.2km)</option>
                      <option>重汽特约维修·宝安店 (6.8km)</option>
                      <option>解放卡车服务·龙岗店 (12.5km)</option>
                    </select>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-white border border-amber-100">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="text-[11px] text-amber-700 leading-relaxed">
                        新客立减 <strong>¥100</strong>，平台补贴后仅需 <strong className="font-mono">¥1,180</strong>
                      </div>
                    </div>
                  </div>
                  <button className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 via-indigo-500 to-violet-600 text-white font-bold hover:shadow-xl hover:shadow-primary-500/30 transition-all flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    提交预约
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* 我的工单 */
        <div className="card-base overflow-hidden card-hover">
          <div className="px-5 py-4 border-b border-slate2-100 bg-gradient-to-r from-slate2-50 to-transparent">
            <h3 className="font-bold text-slate2-800 text-sm flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-primary-500" />
              维保工单列表
            </h3>
          </div>
          <div className="divide-y divide-slate2-50">
            {maintenanceOrders.map((o) => (
              <div key={o.id} className="p-5 hover:bg-slate2-50/60 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate2-700">工单号: {o.orderNo}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColor[o.status]}`}>
                        {statusLabel[o.status]}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate2-800 flex items-center gap-2">
                      {o.serviceType}
                      <span className="text-[10px] font-normal text-slate2-400">·</span>
                      <span className="font-mono text-slate2-500 text-xs font-normal">{o.vehiclePlate}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate2-400 mb-0.5">实付金额</div>
                    <div className="text-lg font-extrabold font-mono text-primary-600">¥{o.cost.toLocaleString()}</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 py-3 my-3 border-y border-slate2-50">
                  <MiniCell label="服务门店" val={o.shop.name} />
                  <MiniCell label="预约到店" val={o.scheduledTime} />
                  <MiniCell label="负责技师" val={o.technician || '待分配'} />
                  <MiniCell label="完成时间" val={o.completedAt || '-'} />
                </div>

                {/* 进度条 */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    {['提交工单', '门店确认', '入场施工', '质检完工', '车主取车'].map((s, i, arr) => {
                      const curStage = o.status === 'pending' ? 0 : o.status === 'confirmed' ? 1 : o.status === 'in_progress' ? 2 : ['completed', 'closed'].includes(o.status) ? 4 : 0
                      const active = i <= curStage
                      return (
                        <div key={s} className="flex items-center flex-1 last:flex-none">
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              active ? (i === curStage && o.status !== 'closed' ? 'bg-gradient-to-br from-primary-500 to-violet-600 text-white animate-pulse shadow-md' : 'bg-success-500 text-white') : 'bg-slate2-100 text-slate2-400'
                            }`}>
                              {active && i < curStage ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                            </div>
                            <span className={`mt-1 text-[10px] ${active ? 'text-slate2-700 font-medium' : 'text-slate2-300'}`}>{s}</span>
                          </div>
                          {i < arr.length - 1 && (
                            <div className={`h-0.5 flex-1 mx-1 -mt-3 ${i < curStage ? 'bg-gradient-to-r from-success-400 to-success-500' : 'bg-slate2-100'}`} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-slate2-500">
                    <FileCheck className="w-3 h-3" />
                    服务进度: {o.stages.filter(s => s.done).length}/{o.stages.length} 项
                  </div>
                  <div className="flex items-center gap-2">
                    {o.status === 'pending' && (
                      <button className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-[11px] font-bold hover:bg-amber-100 transition-colors">
                        催促确认
                      </button>
                    )}
                    {o.status === 'in_progress' && (
                      <button className="px-3 py-1.5 rounded-lg bg-violet-50 text-violet-600 text-[11px] font-bold hover:bg-violet-100 transition-colors flex items-center gap-1">
                        <Wrench className="w-3 h-3" />
                        查看施工过程
                      </button>
                    )}
                    {o.status === 'completed' && (
                      <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-success-500 to-emerald-600 text-white text-[11px] font-bold hover:shadow-md transition-all flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        评价服务
                      </button>
                    )}
                    <button className="px-3 py-1.5 rounded-lg bg-slate2-50 text-slate2-600 text-[11px] font-bold hover:bg-slate2-100 transition-colors">
                      工单详情
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MiniCell({ label, val }: { label: string; val: string }) {
  return (
    <div>
      <div className="text-[10px] text-slate2-400 mb-0.5">{label}</div>
      <div className="text-xs font-medium text-slate2-700 truncate">{val}</div>
    </div>
  )
}
