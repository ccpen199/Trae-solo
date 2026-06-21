import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import {
  ArrowLeft, Package, MapPin, Clock, Thermometer, Box, Weight,
  FileSpreadsheet, Truck, User, Phone, CalendarClock, Shield,
  Edit2, CheckCircle2, AlertCircle, History, Plus, ChevronRight,
  Share2, Copy,
} from 'lucide-react'

const statusColor: Record<string, string> = {
  draft: 'bg-slate2-100 text-slate2-500',
  published: 'bg-blue-50 text-blue-600',
  assigned: 'bg-violet-50 text-violet-600',
  in_transit: 'bg-amber-50 text-amber-600',
  delivered: 'bg-success-50 text-success-600',
  exception: 'bg-accent-50 text-accent-600',
}
const statusLabel: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  assigned: '已派单',
  in_transit: '运输中',
  delivered: '已签收',
  exception: '异常',
}

export default function CargoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { cargoOrders, capacities, alerts, insurancePolicies, waybills } = useAppStore()

  const order = cargoOrders.find(o => o.id === id)
  if (!order) {
    return (
      <div className="space-y-6">
        <Link to="/cargo" className="inline-flex items-center gap-2 text-slate2-500 hover:text-primary-600">
          <ArrowLeft className="w-4 h-4" /> 返回列表
        </Link>
        <div className="card-base p-10 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-accent-500" />
          <h3 className="text-lg font-bold text-slate2-700 mb-1">货源订单不存在</h3>
          <p className="text-sm text-slate2-400">ID: {id}</p>
        </div>
      </div>
    )
  }

  const assignedDriver = capacities.find(c => c.id === order.assignedCapacityId)
  const relatedAlerts = alerts.filter(a => a.waybillId === order.waybillId)
  const relatedPolicy = insurancePolicies.find(p => p.orderNo === order.orderNo)
  const relatedWaybill = waybills.find(w => w.orderNo === order.orderNo)

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-lg bg-white border border-slate2-100 text-slate2-500 hover:bg-slate2-50 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate2-800 truncate">{order.cargoName}</h2>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusColor[order.status]}`}>
              {statusLabel[order.status]}
            </span>
            {order.erpOrderNo && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-success-50 text-success-600 font-bold flex items-center gap-0.5">
                <FileSpreadsheet className="w-2.5 h-2.5" />
                ERP: {order.erpOrderNo}
              </span>
            )}
            {order.temperatureControlled && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold flex items-center gap-0.5">
                <Thermometer className="w-2.5 h-2.5" />
                {order.temperatureRange}
              </span>
            )}
          </div>
          <div className="text-xs text-slate2-400 mt-0.5 flex items-center gap-2">
            <span className="font-mono">订单号: {order.orderNo}</span>
            <span className="w-1 h-1 rounded-full bg-slate2-200" />
            <span>创建于 {order.createdAt.slice(0, 16)}</span>
            <button className="text-primary-500 flex items-center gap-0.5 hover:underline">
              <Copy className="w-2.5 h-2.5" /> 复制
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 px-3 rounded-lg bg-slate2-50 border border-transparent text-xs text-slate2-600 hover:bg-white hover:border-slate2-200 transition-all flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5" />
            分享
          </button>
          <button className="h-9 px-3 rounded-lg bg-slate2-50 border border-transparent text-xs text-slate2-600 hover:bg-white hover:border-slate2-200 transition-all flex items-center gap-1.5">
            <Edit2 className="w-3.5 h-3.5" />
            编辑
          </button>
          {order.status === 'published' && (
            <button className="h-9 px-4 rounded-lg bg-gradient-to-r from-primary-500 to-violet-600 text-white text-xs font-bold hover:shadow-md transition-all flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              匹配运力
            </button>
          )}
        </div>
      </div>

      {/* 时间线 */}
      <div className="card-base p-6">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          {[
            { s: '订单创建', t: order.createdAt.slice(5, 16), done: true },
            { s: '货源发布', t: order.publishedAt?.slice(5, 16), done: !!order.publishedAt },
            { s: '运力匹配', t: assignedDriver ? order.assignedAt?.slice(5, 16) : '-', done: !!assignedDriver },
            { s: '货物提运', t: order.pickupTime.slice(5, 16), done: order.status !== 'published' },
            { s: '签收完成', t: order.deliveryTime.slice(5, 16), done: order.status === 'delivered' },
          ].map((item, i, arr) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  item.done
                    ? 'bg-gradient-to-br from-primary-500 to-violet-600 text-white shadow-md'
                    : 'bg-slate2-100 text-slate2-300'
                }`}>
                  {item.done ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                </div>
                <span className={`mt-2 text-[11px] font-bold ${item.done ? 'text-slate2-700' : 'text-slate2-300'}`}>{item.s}</span>
                <span className={`mt-0.5 text-[10px] font-mono ${item.done ? 'text-slate2-500' : 'text-slate2-300'}`}>{item.t}</span>
              </div>
              {i < arr.length - 1 && (
                <div className={`w-16 md:w-20 h-0.5 mx-2 md:mx-3 ${item.done && arr[i+1].done ? 'bg-gradient-to-r from-primary-500 to-success-500' : 'bg-slate2-100'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 左侧主内容 */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* 路线信息大卡片 */}
          <div className="card-base p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-gradient-to-br from-primary-50 to-transparent -translate-y-1/2 translate-x-1/2" />
            <h3 className="font-bold text-slate2-800 mb-4 flex items-center gap-2 text-sm relative">
              <MapPin className="w-4 h-4 text-primary-500" />
              运输路线信息
            </h3>
            <div className="flex items-center gap-4 md:gap-8 relative">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-md" />
                  <span className="text-xs font-bold text-slate2-500 uppercase">起运地</span>
                </div>
                <div className="text-lg font-extrabold text-slate2-800 mb-0.5">{order.origin.province} {order.origin.city}</div>
                <div className="text-xs text-slate2-500 leading-relaxed">{order.origin.address}</div>
                <div className="mt-2 flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-0.5 text-slate2-600"><User className="w-3 h-3 text-primary-500" />{order.origin.contact}</span>
                  <span className="flex items-center gap-0.5 text-slate2-600"><Phone className="w-3 h-3 text-primary-500" />{order.origin.phone}</span>
                </div>
              </div>

              <div className="flex-shrink-0 text-center px-2">
                <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 via-violet-500 to-indigo-600 text-white relative shadow-lg">
                  <div className="text-[10px] opacity-80 mb-0.5">预计里程 · 时长</div>
                  <div className="text-sm font-extrabold font-mono">{order.distance}km · {order.estimatedDays}天</div>
                  <Truck className="w-6 h-6 absolute left-1/2 -translate-x-1/2 -bottom-5 text-primary-600" />
                </div>
              </div>

              <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center gap-2 mb-1 justify-end">
                  <span className="text-xs font-bold text-slate2-500 uppercase">目的地</span>
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-success-500 to-emerald-600 shadow-md" />
                </div>
                <div className="text-lg font-extrabold text-slate2-800 mb-0.5">{order.destination.province} {order.destination.city}</div>
                <div className="text-xs text-slate2-500 leading-relaxed">{order.destination.address}</div>
                <div className="mt-2 flex items-center gap-3 text-[11px] justify-end">
                  <span className="flex items-center gap-0.5 text-slate2-600"><User className="w-3 h-3 text-success-500" />{order.destination.contact}</span>
                  <span className="flex items-center gap-0.5 text-slate2-600"><Phone className="w-3 h-3 text-success-500" />{order.destination.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 货物详情 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-base p-6">
              <h3 className="font-bold text-slate2-800 mb-4 flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-primary-500" />
                货物规格信息
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate2-50 to-white border border-slate2-100">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate2-400 mb-1.5">
                    <Box className="w-3 h-3" />
                    总件数
                  </div>
                  <div className="text-xl font-extrabold font-mono text-slate2-800">{order.quantity}<span className="text-xs font-bold text-slate2-400 ml-1">件</span></div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-white border border-amber-100">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate2-400 mb-1.5">
                    <Weight className="w-3 h-3 text-amber-500" />
                    总重量
                  </div>
                  <div className="text-xl font-extrabold font-mono text-amber-600">{order.weight}<span className="text-xs font-bold text-amber-400 ml-1">吨</span></div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-white border border-violet-100">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate2-400 mb-1.5">
                    <Box className="w-3 h-3 text-violet-500" />
                    总体积
                  </div>
                  <div className="text-xl font-extrabold font-mono text-violet-600">{order.volume}<span className="text-xs font-bold text-violet-400 ml-1">m³</span></div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50 to-white border border-sky-100">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate2-400 mb-1.5">
                    <Package className="w-3 h-3 text-sky-500" />
                    货物类型
                  </div>
                  <div className="text-sm font-bold text-slate2-800 mt-1.5">{order.cargoType}</div>
                </div>
              </div>
              {order.notes && (
                <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-transparent border border-blue-100">
                  <div className="text-[10px] font-bold text-blue-600 mb-1 uppercase tracking-wider">特别备注</div>
                  <div className="text-xs text-slate2-600 leading-relaxed">{order.notes}</div>
                </div>
              )}
            </div>

            <div className="card-base p-6">
              <h3 className="font-bold text-slate2-800 mb-4 flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary-500" />
                费用与时效
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate2-50/60">
                  <span className="text-xs text-slate2-500">基础运费</span>
                  <span className="font-bold font-mono text-slate2-800">¥{order.baseFee.toLocaleString()}</span>
                </div>
                {order.temperatureControlled && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50/60">
                    <span className="text-xs text-slate2-500 flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-sky-500" />
                      冷链温控附加费
                    </span>
                    <span className="font-bold font-mono text-sky-600">¥{Math.round(order.baseFee * 0.15).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 rounded-xl bg-violet-50/60">
                  <span className="text-xs text-slate2-500">保费 (中国人民保险)</span>
                  <span className="font-bold font-mono text-violet-600">¥{(order.declaredValue * 0.0012).toFixed(0)}</span>
                </div>
                <div className="h-px bg-slate2-100 my-1" />
                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                  <span className="text-sm font-bold text-slate2-800">订单总额</span>
                  <div className="text-2xl font-extrabold font-mono bg-gradient-to-r from-amber-500 to-accent-500 bg-clip-text text-transparent">
                    ¥{order.totalFee.toLocaleString()}
                  </div>
                </div>
                <div className="pt-3 border-t border-slate2-50 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate2-500">申报货值</span>
                    <span className="font-mono font-bold text-slate2-700">¥{order.declaredValue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate2-500 flex items-center gap-1"><CalendarClock className="w-3 h-3" />提货时限</span>
                    <span className="font-mono font-bold text-primary-600">{order.pickupTime.slice(0, 16)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate2-500 flex items-center gap-1"><CalendarClock className="w-3 h-3" />送达时限</span>
                    <span className="font-mono font-bold text-success-600">{order.deliveryTime.slice(0, 16)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 关联运单/告警/保单横向 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedWaybill && (
              <div className="card-base p-5 card-hover cursor-pointer hover:ring-2 hover:ring-primary-200 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-primary-500 uppercase tracking-wider">电子运单</span>
                  <FileSpreadsheet className="w-4 h-4 text-primary-500" />
                </div>
                <div className="font-mono text-sm font-bold text-slate2-800 mb-2">{relatedWaybill.waybillNo}</div>
                <div className="text-[11px] text-slate2-500 mb-1">司机: {relatedWaybill.driverName}</div>
                <div className="text-[11px] text-slate2-500">车辆: {relatedWaybill.vehiclePlate}</div>
                <button className="w-full mt-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 text-[11px] font-bold hover:bg-primary-100 transition-colors flex items-center justify-center gap-0.5">
                  查看运单 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {relatedPolicy ? (
              <div className="card-base p-5 card-hover cursor-pointer hover:ring-2 hover:ring-red-200 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-[#C8102E] uppercase tracking-wider">中国人保保单</span>
                  <Shield className="w-4 h-4 text-[#C8102E]" />
                </div>
                <div className="font-mono text-sm font-bold text-slate2-800 mb-2">{relatedPolicy.policyNo}</div>
                <div className="text-[11px] text-slate2-500 mb-1">保额: <span className="font-mono font-bold text-[#C8102E]">¥{relatedPolicy.coverageAmount.toLocaleString()}</span></div>
                <div className="text-[11px] text-slate2-500">保费: <span className="font-mono">¥{relatedPolicy.premium.toLocaleString()}</span></div>
                <button className="w-full mt-3 py-1.5 rounded-lg bg-red-50 text-[#C8102E] text-[11px] font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-0.5">
                  查看保单 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="card-base p-5 border-dashed border-2 border-slate2-200 bg-slate2-50/40 cursor-pointer hover:bg-red-50/50 hover:border-red-200 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate2-400 uppercase tracking-wider">未投保</span>
                  <Shield className="w-4 h-4 text-slate2-300" />
                </div>
                <div className="text-sm font-bold text-slate2-400 mb-2">为货物安全投保</div>
                <div className="text-[11px] text-slate2-400">最高1000万保额</div>
                <button className="w-full mt-3 py-1.5 rounded-lg bg-gradient-to-r from-[#C8102E] to-red-600 text-white text-[11px] font-bold hover:shadow-md transition-all flex items-center justify-center gap-0.5">
                  <Plus className="w-3 h-3" />
                  立即投保
                </button>
              </div>
            )}

            <div className={`card-base p-5 card-hover cursor-pointer transition-all ${relatedAlerts.length > 0 ? 'hover:ring-2 hover:ring-accent-200' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${relatedAlerts.length > 0 ? 'text-accent-500' : 'text-slate2-400'}`}>运输告警</span>
                <AlertCircle className={`w-4 h-4 ${relatedAlerts.length > 0 ? 'text-accent-500' : 'text-slate2-300'}`} />
              </div>
              <div className={`text-sm font-bold mb-2 ${relatedAlerts.length > 0 ? 'text-accent-600' : 'text-slate2-400'}`}>
                {relatedAlerts.length > 0 ? `${relatedAlerts.length} 条告警` : '暂无告警'}
              </div>
              <div className="text-[11px] text-slate2-500">
                {relatedAlerts.length > 0 ? relatedAlerts.map(a => a.type).join('、') : '运输全程正常'}
              </div>
              {relatedAlerts.length > 0 && (
                <button className="w-full mt-3 py-1.5 rounded-lg bg-accent-50 text-accent-600 text-[11px] font-bold hover:bg-accent-100 transition-colors flex items-center justify-center gap-0.5">
                  告警中心 <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 右侧栏 */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* 运力信息 */}
          {assignedDriver ? (
            <div className="card-base p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-gradient-to-br from-amber-50 to-transparent -translate-y-1/2 -translate-x-1/2" />
              <div className="flex items-center justify-between mb-4 relative">
                <h3 className="font-bold text-slate2-800 flex items-center gap-2 text-sm">
                  <Truck className="w-4 h-4 text-primary-500" />
                  承运方信息
                </h3>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                  assignedDriver.creditLevel === 'AAA' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' :
                  assignedDriver.creditLevel === 'AA' ? 'bg-violet-50 text-violet-600' :
                  assignedDriver.creditLevel === 'A' ? 'bg-primary-50 text-primary-600' :
                  'bg-slate2-50 text-slate2-500'
                }`}>
                  {assignedDriver.creditLevel}级运力
                </span>
              </div>

              <div className="flex items-start gap-3 mb-4 relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg flex-shrink-0">
                  {assignedDriver.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate2-800">{assignedDriver.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-50 text-success-600 font-bold">已认证</span>
                  </div>
                  <div className="text-xs text-slate2-500 mb-1">
                    {assignedDriver.type === 'fleet' ? '企业车队' : '个体司机'} · 从业 {assignedDriver.experienceYears} 年
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="flex items-center gap-0.5 text-amber-500">
                      {'★'.repeat(Math.round(assignedDriver.rating))}
                      <span className="ml-0.5 font-bold text-slate2-700">{assignedDriver.rating.toFixed(1)}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate2-50 text-xs relative">
                <InfoRow k="联系电话" v={<span className="font-mono">{assignedDriver.phone}</span>} />
                <InfoRow k="车牌号码" v={<span className="font-mono font-bold text-primary-600">{assignedDriver.vehiclePlate}</span>} />
                <InfoRow k="车型/载重" v={`${assignedDriver.vehicleType} · ${assignedDriver.maxWeight}吨`} />
                <InfoRow k="历史履约率" v={<span className="font-bold text-success-600">{assignedDriver.completionRate}%</span>} />
                <InfoRow k="合作订单数" v={<span className="font-mono font-bold text-slate2-800">{assignedDriver.totalOrders}</span>} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 relative">
                <button className="py-2 rounded-lg bg-primary-50 text-primary-600 text-[11px] font-bold hover:bg-primary-100 transition-colors flex items-center justify-center gap-1">
                  <Phone className="w-3 h-3" />
                  联系司机
                </button>
                <button className="py-2 rounded-lg bg-slate2-50 text-slate2-600 text-[11px] font-bold hover:bg-slate2-100 transition-colors flex items-center justify-center gap-1">
                  <History className="w-3 h-3" />
                  历史评价
                </button>
              </div>
            </div>
          ) : (
            <div className="card-base p-6 border-dashed border-2 border-slate2-200 bg-slate2-50/40">
              <div className="text-center py-4">
                <Truck className="w-12 h-12 mx-auto mb-3 text-slate2-300" />
                <div className="text-sm font-bold text-slate2-500 mb-1">暂未匹配运力</div>
                <div className="text-xs text-slate2-400 mb-4">智能匹配系统正在寻找最合适的承运方</div>
                <button className="px-5 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-violet-600 text-white text-xs font-bold hover:shadow-md transition-all flex items-center gap-1 mx-auto">
                  手动选择运力 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* 操作日志 */}
          <div className="card-base overflow-hidden">
            <div className="px-5 py-4 border-b border-slate2-100 bg-gradient-to-r from-slate2-50 to-transparent">
              <h3 className="font-bold text-slate2-800 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-primary-500" />
                操作日志
              </h3>
            </div>
            <div className="divide-y divide-slate2-50 max-h-[320px] overflow-y-auto">
              {[
                { t: '10:15', user: '李经理 (货主)', action: '发布货源订单，自动同步ERP系统', tag: '发布', color: 'primary' },
                { t: '09:30', user: '系统', action: `生成保险建议: 综合险 保费 ¥${(order.declaredValue * 0.0012).toFixed(0)}`, tag: 'AI推荐', color: 'violet' },
                { t: '09:00', user: 'SAP ERP', action: `同步订单 ${order.erpOrderNo || '#'}，创建货运需求`, tag: '同步', color: 'success' },
                { t: '昨天 17:42', user: '张总 (管理员)', action: '审核该路线为高价值货物，建议升级保险', tag: '审核', color: 'amber' },
                { t: '昨天 15:20', user: '李经理 (货主)', action: '保存订单草稿', tag: '草稿', color: 'slate' },
              ].map((l, i) => (
                <div key={i} className="px-5 py-3 flex items-start gap-3 hover:bg-slate2-50/60 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    l.color === 'primary' ? 'bg-primary-500' :
                    l.color === 'violet' ? 'bg-violet-500' :
                    l.color === 'success' ? 'bg-success-500' :
                    l.color === 'amber' ? 'bg-amber-500' :
                    'bg-slate2-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate2-700 leading-relaxed">
                      <span className="font-bold">{l.user}</span>
                      <span className="text-slate2-500"> · {l.action}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        l.color === 'primary' ? 'bg-primary-50 text-primary-600' :
                        l.color === 'violet' ? 'bg-violet-50 text-violet-600' :
                        l.color === 'success' ? 'bg-success-50 text-success-600' :
                        l.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                        'bg-slate2-50 text-slate2-500'
                      }`}>
                        {l.tag}
                      </span>
                      <span className="text-[10px] text-slate2-400 font-mono">{l.t}</span>
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

function InfoRow({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate2-400">{k}</span>
      <span className="text-slate2-800">{v}</span>
    </div>
  )
}
