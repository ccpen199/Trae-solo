import { useState } from 'react'
import {
  Wrench,
  CreditCard,
  Fuel,
  Car,
  ShieldCheck,
  ArrowUpRight,
  CalendarCheck,
  TrendingUp,
  RefreshCcw,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle2,
  Star,
  Search,
  Sparkles,
  Receipt,
  FileText,
} from 'lucide-react'
import { useAppStore } from '@/store'

export default function ServiceCenter() {
  const { serviceOrders, etcCards, fuelCards, maintenanceOrders } = useAppStore()

  return (
    <div className="space-y-6">
      {/* 三大服务入口 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <ServiceEntryCard
          title="ETC 充值服务"
          desc="全国高速ETC卡绑定·在线充值·秒级到账·电子发票"
          gradient="from-sky-500 via-blue-500 to-indigo-600"
          icon={<CreditCard className="w-7 h-7" />}
          stats={[
            { k: '绑定卡片', v: etcCards.length, u: '张' },
            { k: '本月充值', v: '¥' + (etcCards.reduce((s, c) => s + c.balance, 0) / 1000).toFixed(1) + 'k', u: '' },
          ]}
          to="/service/etc"
        />
        <ServiceEntryCard
          title="油卡折扣结算"
          desc="中石化/中石油/壳牌·品牌折扣套餐·消费明细查询"
          gradient="from-amber-500 via-orange-500 to-red-500"
          icon={<Fuel className="w-7 h-7" />}
          stats={[
            { k: '绑定油卡', v: fuelCards.length, u: '张' },
            { k: '平均折扣', v: Math.round(fuelCards.reduce((s, c) => s + c.discount, 0) / fuelCards.length * 100) / 10 + '折', u: '' },
          ]}
          to="/service/fuel"
        />
        <ServiceEntryCard
          title="车辆维保服务"
          desc="品牌特约服务站·预约上门·电子工单·评价闭环"
          gradient="from-emerald-500 via-teal-500 to-cyan-600"
          icon={<Car className="w-7 h-7" />}
          stats={[
            { k: '服务网点', v: '2,480+', u: '家' },
            { k: '本月工单', v: maintenanceOrders.length, u: '单' },
          ]}
          to="/service/maintenance"
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 左：ETC + 油卡速览 */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          {/* ETC 卡片 */}
          <div className="card-base overflow-hidden card-hover">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate2-100 bg-gradient-to-r from-sky-50 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-500 text-white flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate2-800 text-sm">ETC 账户速览</h3>
                  <p className="text-[10px] text-slate2-400">快速充值 · 通行无忧</p>
                </div>
              </div>
              <a className="text-xs text-sky-600 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 transition-colors cursor-pointer">
                管理卡片
                <ChevronRight className="w-3 h-3" />
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
              {etcCards.slice(0, 2).map((card) => (
                <div
                  key={card.id}
                  className={`relative overflow-hidden rounded-2xl p-5 text-white ${
                    card.status === 'active'
                      ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-900'
                      : 'bg-gradient-to-br from-slate2-200 to-slate2-300'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <div className="text-[10px] opacity-70 mb-0.5">ETC CARD</div>
                        <div className={`text-lg font-bold font-mono tracking-wider ${card.status === 'frozen' ? 'text-slate2-500' : ''}`}>
                          {card.cardNo}
                        </div>
                      </div>
                      <div className={`w-10 h-10 rounded-lg ${card.status === 'frozen' ? 'bg-slate2-400/30' : 'bg-gradient-to-br from-yellow-400 to-yellow-500'}`} />
                    </div>
                    <div className="mb-4">
                      <div className="text-[10px] opacity-70 mb-1">绑定车牌</div>
                      <div className={`text-sm font-bold font-mono ${card.status === 'frozen' ? 'text-slate2-500' : ''}`}>
                        {card.vehiclePlate}
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-[10px] opacity-70 mb-0.5">账户余额</div>
                        <div className={`text-2xl font-extrabold font-mono ${card.status === 'frozen' ? 'text-slate2-500' : ''}`}>
                          ¥ {card.balance.toLocaleString()}
                        </div>
                      </div>
                      {card.status === 'active' ? (
                        <button className="px-4 py-1.5 rounded-lg bg-white/15 text-white text-xs font-semibold backdrop-blur hover:bg-white/25 transition-colors border border-white/20">
                          立即充值
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg bg-white/10 text-white/60 text-xs font-medium">已冻结</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 油卡速览 */}
          <div className="card-base overflow-hidden card-hover">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate2-100 bg-gradient-to-r from-amber-50 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md">
                  <Fuel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate2-800 text-sm">油卡折扣中心</h3>
                  <p className="text-[10px] text-slate2-400">三大品牌合作 · 最高立省 8%</p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-slate2-50">
              {fuelCards.map((fc) => (
                <div key={fc.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate2-50/60 transition-colors">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-md ${
                    fc.brand === '中国石化' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                    fc.brand === '中国石油' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                    'bg-gradient-to-br from-yellow-500 to-orange-500'
                  }`}>
                    <Fuel className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-slate2-800">{fc.brand}</span>
                      <span className="text-[10px] font-mono text-slate2-400">{fc.cardNo}</span>
                      <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-gradient-to-r from-accent-500 to-orange-500 text-white font-bold">
                        {(fc.discount * 10).toFixed(1)} 折
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-slate2-500">
                      <span>余额: <span className="font-mono font-bold text-slate2-700">¥{fc.balance.toLocaleString()}</span></span>
                      <span>车牌: <span className="font-mono text-slate2-700">{fc.vehiclePlate}</span></span>
                      <span className={`px-1.5 py-0.5 rounded ${fc.status === 'active' ? 'bg-success-50 text-success-600' : 'bg-slate2-100 text-slate2-500'}`}>
                        {fc.status === 'active' ? '正常' : '停用'}
                      </span>
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-sm">
                    <Plus className="w-3.5 h-3.5" />
                    充值
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右：维保 + 订单 */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* 待处理维保 */}
          <div className="card-base overflow-hidden card-hover">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate2-100 bg-gradient-to-r from-emerald-50 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-md">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate2-800 text-sm">维保预约工单</h3>
                  <p className="text-[10px] text-slate2-400">
                    待处理 {maintenanceOrders.filter(o => ['pending', 'in_progress'].includes(o.status)).length} 单
                  </p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-slate2-50">
              {maintenanceOrders.map((mo) => (
                <div key={mo.id} className="px-5 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono text-xs font-bold text-slate2-700">{mo.workOrderNo}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          mo.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                          mo.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                          'bg-success-50 text-success-600'
                        }`}>
                          {({ pending: '待服务', in_progress: '服务中', completed: '已完成', cancelled: '已取消' } as any)[mo.status]}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate2-800">{mo.serviceType}</div>
                    </div>
                    {mo.rating && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < mo.rating! ? 'text-amber-400 fill-amber-400' : 'text-slate2-200'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-[11px] text-slate2-500">
                    <div className="flex items-center gap-1.5">
                      <Car className="w-3 h-3 text-slate2-400" />
                      <span className="font-mono text-slate2-700">{mo.vehiclePlate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate2-400" />
                      {mo.appointmentTime}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-slate2-400" />
                      <span className="truncate">{mo.workshop}</span>
                    </div>
                  </div>
                  {mo.items && mo.status === 'completed' && (
                    <div className="mt-2 p-2.5 rounded-lg bg-slate2-50 border border-slate2-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate2-500">费用合计</span>
                        <span className="font-bold font-mono text-slate2-800">¥ {mo.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 最近服务订单 */}
          <div className="card-base p-5 card-hover">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate2-800 flex items-center gap-2 text-sm">
                <Receipt className="w-4 h-4 text-primary-500" />
                最近服务订单
              </h3>
              <span className="text-[10px] text-slate2-400">共 {serviceOrders.length} 笔</span>
            </div>
            <div className="space-y-2.5">
              {serviceOrders.map((so) => (
                <div key={so.id} className="p-3 rounded-xl bg-gradient-to-r from-slate2-50/60 to-white border border-slate2-100 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${
                      so.serviceType === 'etc' ? 'bg-sky-500' :
                      so.serviceType === 'fuel' ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`}>
                      {so.serviceType === 'etc' && <CreditCard className="w-5 h-5" />}
                      {so.serviceType === 'fuel' && <Fuel className="w-5 h-5" />}
                      {so.serviceType === 'maintenance' && <Wrench className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-mono text-slate2-600">{so.orderNo}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                          so.status === 'completed' ? 'bg-success-50 text-success-600' :
                          so.status === 'processing' ? 'bg-blue-50 text-blue-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {so.status === 'completed' ? '已完成' : so.status === 'processing' ? '处理中' : '待处理'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate2-500 truncate">
                        {so.capacityName} · {so.vehiclePlate}
                      </div>
                    </div>
                    <div className="text-right">
                      {so.discount > 0 && (
                        <div className="text-[10px] text-accent-500 font-medium line-through">¥{so.amount}</div>
                      )}
                      <div className="text-sm font-bold font-mono text-slate2-800">¥ {so.actualAmount.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ServiceEntryCard({
  title,
  desc,
  gradient,
  icon,
  stats,
  to,
}: {
  title: string
  desc: string
  gradient: string
  icon: any
  stats: { k: string; v: string | number; u: string }[]
  to: string
}) {
  return (
    <a href={'#' + to} className="group relative overflow-hidden rounded-2xl p-6 text-white bg-gradient-to-br cursor-pointer transition-all hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 duration-300"
      style={{}}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-100`} />
      {/* 装饰 */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/8 rounded-full -translate-y-1/3 translate-x-1/3 transition-transform group-hover:scale-125 duration-500" />
      <div className="absolute bottom-0 left-8 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
      <div className={`absolute -bottom-16 -right-16 w-48 h-48 rounded-full border border-white/10`} />

      <div className="relative">
        <div className="flex items-start justify-between mb-8">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center shadow-inner group-hover:bg-white/25 transition-all duration-300">
            {icon}
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 text-xs font-medium group-hover:bg-white group-hover:text-slate2-800 transition-all">
            进入服务
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <h2 className="text-xl font-bold mb-1.5 tracking-wide">{title}</h2>
        <p className="text-xs opacity-80 leading-relaxed mb-6 line-clamp-2">{desc}</p>

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/15">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="text-[10px] opacity-70 mb-1">{s.k}</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold font-mono tracking-tight">{s.v}</span>
                <span className="text-xs opacity-75">{s.u}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </a>
  )
}
