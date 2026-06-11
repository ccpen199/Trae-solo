import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Search, Filter, ChevronLeft, ChevronRight, Clock, CheckCircle, AlertTriangle, Zap } from 'lucide-react'

interface Order {
  id: string; plate: string; vin: string; station: string; pile: string
  startTime: string; endTime: string; kwh: number; fee: string
  status: '充电中' | '已完成' | '故障'; socStart: number; socEnd: number
  power: string; faultType?: string; faultReport?: string; faultDispatch?: string
  faultHandler?: string; faultResolution?: string
}

const orders: Order[] = [
  { id:'ORD20260610001', plate:'京A12345', vin:'LVSHFFAL2GN000001', station:'国网北京朝阳站', pile:'P3', startTime:'2026-06-10 14:30', endTime:'2026-06-10 15:30', kwh:45.6, fee:'¥54.72', status:'已完成', socStart:22, socEnd:85, power:'60kW' },
  { id:'ORD20260609002', plate:'沪B67890', vin:'LVSHFFAL2GN000002', station:'特来电上海浦东站', pile:'P7', startTime:'2026-06-09 18:15', endTime:'', kwh:32.1, fee:'¥48.15', status:'充电中', socStart:15, socEnd:58, power:'55kW' },
  { id:'ORD20260608003', plate:'粤C24680', vin:'LVSHFFAL2GN000003', station:'星星充电广州天河站', pile:'P10', startTime:'2026-06-08 10:22', endTime:'', kwh:0, fee:'¥0.00', status:'故障', socStart:30, socEnd:30, power:'0kW', faultType:'通信故障', faultReport:'10:22', faultDispatch:'10:35', faultHandler:'张工', faultResolution:'11:20处理完成' },
  { id:'ORD20260607004', plate:'川D13579', vin:'LVSHFFAL2GN000004', station:'国网成都高新站', pile:'P5', startTime:'2026-06-07 09:00', endTime:'2026-06-07 10:15', kwh:52.3, fee:'¥62.76', status:'已完成', socStart:10, socEnd:90, power:'60kW' },
  { id:'ORD20260606005', plate:'浙E98765', vin:'LVSHFFAL2GN000005', station:'特来电杭州西湖站', pile:'P2', startTime:'2026-06-06 20:30', endTime:'2026-06-06 21:45', kwh:38.7, fee:'¥46.44', status:'已完成', socStart:18, socEnd:78, power:'55kW' },
  { id:'ORD20260605006', plate:'鄂F11223', vin:'LVSHFFAL2GN000006', station:'国网武汉光谷站', pile:'P8', startTime:'2026-06-05 11:10', endTime:'2026-06-05 12:30', kwh:41.2, fee:'¥49.44', status:'已完成', socStart:25, socEnd:82, power:'50kW' },
  { id:'ORD20260604007', plate:'渝G44556', vin:'LVSHFFAL2GN000007', station:'星星充电重庆渝北站', pile:'P4', startTime:'2026-06-04 16:00', endTime:'2026-06-04 17:20', kwh:55.1, fee:'¥66.12', status:'已完成', socStart:12, socEnd:88, power:'60kW' },
  { id:'ORD20260603008', plate:'苏H77889', vin:'LVSHFFAL2GN000008', station:'特来电南京江宁站', pile:'P6', startTime:'2026-06-03 08:45', endTime:'2026-06-03 09:55', kwh:35.8, fee:'¥42.96', status:'已完成', socStart:20, socEnd:75, power:'50kW' },
  { id:'ORD20260602009', plate:'津J55667', vin:'LVSHFFAL2GN000009', station:'国网天津滨海站', pile:'P1', startTime:'2026-06-02 13:20', endTime:'2026-06-02 14:40', kwh:48.9, fee:'¥58.68', status:'已完成', socStart:8, socEnd:80, power:'60kW' },
  { id:'ORD20260601010', plate:'湘K33445', vin:'LVSHFFAL2GN000010', station:'星星充电长沙岳麓站', pile:'P9', startTime:'2026-06-01 19:00', endTime:'2026-06-01 20:10', kwh:29.4, fee:'¥35.28', status:'已完成', socStart:35, socEnd:82, power:'45kW' },
  { id:'ORD20260531011', plate:'闽L88990', vin:'LVSHFFAL2GN000011', station:'特来电福州鼓楼站', pile:'P3', startTime:'2026-05-31 07:30', endTime:'', kwh:0, fee:'¥0.00', status:'故障', socStart:50, socEnd:50, power:'0kW', faultType:'过温告警', faultReport:'07:35', faultDispatch:'07:50', faultHandler:'李工', faultResolution:'08:30更换散热模块' },
  { id:'ORD20260530012', plate:'皖M22334', vin:'LVSHFFAL2GN000012', station:'国网合肥政务站', pile:'P7', startTime:'2026-05-30 15:45', endTime:'2026-05-30 17:00', kwh:42.5, fee:'¥51.00', status:'已完成', socStart:14, socEnd:80, power:'55kW' },
]

const statusBadge: Record<string,string> = {'充电中':'bg-electric-green/20 text-electric-green','已完成':'bg-ice-blue/20 text-ice-blue','故障':'bg-amber-orange/20 text-amber-orange'}

const statusTab = ['全部','充电中','已完成','故障'] as const
const dateRange = ['近7天','近30天','近90天'] as const

export default function OrderList() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<typeof statusTab[number]>('全部')
  const [date, setDate] = useState<typeof dateRange[number]>('近7天')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const filtered = orders.filter(o => {
    if (tab !== '全部' && o.status !== tab) return false
    if (search && !o.id.toLowerCase().includes(search.toLowerCase()) && !o.plate.includes(search)) return false
    return true
  })

  const perPage = 10
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const auditSteps = (o: Order) => [
    { label:'订单创建', time:'14:28:00', done:true },
    { label:'VIN+车牌认证', time:'14:28:18', done:true },
    { label:'充电启动', time:'14:30:00', done:true },
    { label:'充电中', time:'14:30:01', done: o.status !== '故障', current: o.status === '充电中' },
    { label:'充电完成', time: o.status === '已完成' ? '15:30:00' : '', done: o.status === '已完成' },
    { label:'费用结算', time: o.status === '已完成' ? '15:30:05' : '', done: o.status === '已完成' },
  ]

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="glass-card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 text-gray-400" />
            {statusTab.map(t => (
              <button key={t} onClick={() => { setTab(t); setPage(1) }}
                className={`px-3 py-1 rounded text-xs transition-all ${tab === t ? 'bg-electric-green/20 text-electric-green' : 'text-gray-400 hover:text-gray-200'}`}>{t}</button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-gray-400" />
            {dateRange.map(d => (
              <button key={d} onClick={() => setDate(d)}
                className={`px-3 py-1 rounded text-xs transition-all ${date === d ? 'bg-ice-blue/20 text-ice-blue' : 'text-gray-400 hover:text-gray-200'}`}>{d}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto bg-deep-blue rounded-lg px-3 py-1.5">
            <Search className="w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="订单号或车牌号" className="bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none w-48" />
          </div>
        </div>
      </div>

      <div className="glass-card p-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-white/5">
              <th className="text-left py-2 px-2 font-medium">订单号</th>
              <th className="text-left py-2 px-2 font-medium">车牌号</th>
              <th className="text-left py-2 px-2 font-medium">充电站</th>
              <th className="text-left py-2 px-2 font-medium">充电桩</th>
              <th className="text-left py-2 px-2 font-medium">开始时间</th>
              <th className="text-right py-2 px-2 font-medium">电量(kWh)</th>
              <th className="text-right py-2 px-2 font-medium">费用</th>
              <th className="text-center py-2 px-2 font-medium">状态</th>
              <th className="text-center py-2 px-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(o => (
              <tr key={o.id} className="border-b border-white/5 hover:bg-electric-green/5 transition-colors">
                <td className="py-2.5 px-2 text-electric-green font-mono">{o.id}</td>
                <td className="py-2.5 px-2 text-gray-200">{o.plate}</td>
                <td className="py-2.5 px-2 text-gray-300 truncate max-w-[160px]">{o.station}</td>
                <td className="py-2.5 px-2 text-gray-300">{o.pile}</td>
                <td className="py-2.5 px-2 text-gray-400">{o.startTime}</td>
                <td className="py-2.5 px-2 text-right text-gray-200 data-text">{o.kwh}</td>
                <td className="py-2.5 px-2 text-right text-amber-orange data-text">{o.fee}</td>
                <td className="py-2.5 px-2 text-center"><span className={`px-2 py-0.5 rounded text-[10px] ${statusBadge[o.status]}`}>{o.status}</span></td>
                <td className="py-2.5 px-2 text-center"><button onClick={() => setSelectedOrder(o)} className="text-ice-blue hover:text-ice-blue/80 hover:underline">详情</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {paged.length === 0 && <div className="text-center py-8 text-gray-500 text-sm">暂无订单数据</div>}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>共 {filtered.length} 条订单</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
            className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
          <span>{page} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
            className="p-1.5 rounded hover:bg-white/5 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="glass-card p-6 w-[560px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-electric-green" />
                <span className="text-sm font-bold text-electric-green font-mono">{selectedOrder.id}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] ${statusBadge[selectedOrder.status]}`}>{selectedOrder.status}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-300">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-5">
              {[
                ['车牌号', selectedOrder.plate], ['VIN', selectedOrder.vin],
                ['充电站', selectedOrder.station], ['充电桩ID', selectedOrder.pile],
                ['开始时间', selectedOrder.startTime], ['结束时间', selectedOrder.endTime || '--'],
                ['充电量', `${selectedOrder.kwh} kWh`], ['金额', selectedOrder.fee],
                ['SOC变化', `${selectedOrder.socStart}%→${selectedOrder.socEnd}%`], ['充电功率', selectedOrder.power],
              ].map((item: [string, string], i) => (
                <div key={i} className="flex justify-between p-2 rounded bg-deep-blue/60">
                  <span className="text-gray-500">{item[0]}</span>
                  <span className="text-gray-200">{item[1]}</span>
                </div>
              ))}
            </div>

            <div className="mb-5">
              <h4 className="text-xs font-medium text-gray-300 mb-3">充电审计追溯时间线</h4>
              <div className="space-y-0">
                {auditSteps(selectedOrder).map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      {step.done && !step.current
                        ? <CheckCircle className="w-4 h-4 text-electric-green shrink-0" />
                        : step.current
                          ? <div className="w-4 h-4 rounded-full bg-ice-blue shrink-0 animate-pulse" />
                          : <div className="w-4 h-4 rounded-full bg-gray-700 shrink-0" />}
                      {i < auditSteps(selectedOrder).length - 1 && (
                        <div className={`w-px h-6 ${step.done ? 'bg-electric-green/30' : 'bg-gray-700/30'}`} />
                      )}
                    </div>
                    <div className="pb-3">
                      <div className={`text-xs ${step.done ? 'text-electric-green' : step.current ? 'text-ice-blue' : 'text-gray-600'}`}>{step.label}</div>
                      {step.time && <div className="text-[10px] text-gray-500 mt-0.5">{step.time}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedOrder.status === '故障' && (
              <div className="mb-5 p-3 rounded-lg border border-amber-orange/30 bg-amber-orange/5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-orange" />
                  <span className="text-xs font-medium text-amber-orange">故障追溯</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-500">故障类型</div><div className="text-amber-orange">{selectedOrder.faultType}</div>
                  <div className="text-gray-500">上报时间</div><div className="text-gray-300">{selectedOrder.faultReport}</div>
                  <div className="text-gray-500">派单时间</div><div className="text-gray-300">{selectedOrder.faultDispatch}</div>
                  <div className="text-gray-500">处理人</div><div className="text-gray-300">{selectedOrder.faultHandler}</div>
                  <div className="text-gray-500">处理结果</div><div className="text-electric-green">{selectedOrder.faultResolution}</div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => navigate('/charging-monitor')} className="btn-primary text-xs px-4 py-2 flex-1 flex items-center justify-center gap-1">
                <Zap className="w-3.5 h-3.5" /> 进入充电监控
              </button>
              <button onClick={() => setSelectedOrder(null)} className="btn-secondary text-xs px-4 py-2 flex-1">返回订单列表</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
