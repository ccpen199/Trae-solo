import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Route, Zap, Battery, AlertTriangle, Clock, Car, Search,
  Wifi, Server, Radio, Activity, CircleDot, X, ChevronDown, Check } from 'lucide-react'

const mockStats = { onlinePiles: 32847, chargingPiles: 12456, faultPiles: 234, todayOrders: 58923 }
const hY = [8,16,24,32,40,48,56,64,72,80], vX = [8,16,24,32,40,48,56,64,72,80]
const hLabels = ['G6京藏','G1京哈','G30连霍','G20青银','G36宁洛','G40沪陕','G50沪渝','G60沪昆','G72泉南','G75兰海']
const vLabels = ['G5京昆','G65包茂','G15沈海','G4京港澳','G2京沪','G3京台','G45大广','G55二广','G75兰海','G85渝昆']

const cities = [
  {n:'北京',x:48,y:16,online:4120,total:4500,charging:1820,available:1680,fault:32},
  {n:'上海',x:72,y:56,online:3860,total:4200,charging:1750,available:1560,fault:28},
  {n:'广州',x:56,y:72,online:3520,total:3800,charging:1580,available:1420,fault:25},
  {n:'深圳',x:64,y:72,online:3200,total:3500,charging:1450,available:1280,fault:22},
  {n:'成都',x:24,y:56,online:2680,total:3000,charging:1200,available:1050,fault:18},
  {n:'武汉',x:48,y:48,online:2340,total:2600,charging:980,available:920,fault:16},
  {n:'西安',x:32,y:32,online:1980,total:2200,charging:850,available:780,fault:14},
  {n:'郑州',x:48,y:32,online:1860,total:2100,charging:820,available:720,fault:12},
  {n:'南京',x:64,y:48,online:2100,total:2400,charging:920,available:860,fault:15},
  {n:'重庆',x:24,y:64,online:2260,total:2500,charging:1020,available:880,fault:19},
  {n:'杭州',x:72,y:48,online:2450,total:2700,charging:1100,available:980,fault:13},
  {n:'长沙',x:48,y:64,online:1720,total:2000,charging:760,available:680,fault:11},
  {n:'沈阳',x:64,y:16,online:1480,total:1700,charging:640,available:580,fault:9},
  {n:'哈尔滨',x:72,y:8,online:1120,total:1300,charging:480,available:420,fault:7},
  {n:'昆明',x:16,y:72,online:1360,total:1600,charging:580,available:520,fault:10},
  {n:'乌鲁木齐',x:8,y:16,online:680,total:800,charging:280,available:260,fault:5},
  {n:'福州',x:72,y:64,online:1560,total:1800,charging:680,available:620,fault:8},
  {n:'拉萨',x:16,y:48,online:420,total:500,charging:180,available:160,fault:3},
]

const quickActions = [
  {icon:MapPin,label:'一键找桩',sub:'附近3km 12桩可用',path:'/map',color:'text-electric-green'},
  {icon:Route,label:'AI路径规划',sub:'支持多目的地+电量约束',path:'/route-plan',color:'text-ice-blue'},
  {icon:Zap,label:'扫码充电',sub:'VIN+车牌即插即充',path:'/plug-charge',color:'text-electric-green'},
  {icon:Battery,label:'V2G策略',sub:'月收益¥2,860',path:'/v2g',color:'text-ice-blue'},
  {icon:AlertTriangle,label:'故障上报',sub:'2件待处理',path:'/charging-monitor',color:'text-amber-orange'},
  {icon:Clock,label:'充电记录',sub:'本月充电23次',path:'/charging-monitor',color:'text-amber-orange'},
  {icon:Car,label:'我的车辆',sub:'2辆已认证',path:'/plug-charge',color:'text-ice-blue'},
  {icon:Search,label:'订单查询',sub:'可追溯180天',path:'/orders',color:'text-electric-green'},
]

const mockOrders = [
  {id:'ORD20260610001',plate:'京A12345',station:'国网北京朝阳站',status:'充电中',amount:'¥45.60',time:'2026-06-10 09:23',progress:62},
  {id:'ORD20260610002',plate:'沪B67890',station:'特来电上海浦东站',status:'已完成',amount:'¥82.30',time:'2026-06-10 08:15',progress:100},
  {id:'ORD20260610003',plate:'粤C24680',station:'星星充电广州天河站',status:'充电中',amount:'¥36.90',time:'2026-06-10 10:05',progress:38},
  {id:'ORD20260610004',plate:'川D13579',station:'国网成都高新站',status:'故障',amount:'¥0.00',time:'2026-06-10 07:50',progress:0},
  {id:'ORD20260610005',plate:'浙E98765',station:'特来电杭州西湖站',status:'已完成',amount:'¥55.20',time:'2026-06-10 06:30',progress:100},
  {id:'ORD20260610006',plate:'鄂F11223',station:'国网武汉光谷站',status:'充电中',amount:'¥28.40',time:'2026-06-10 11:12',progress:51},
  {id:'ORD20260610007',plate:'渝G44556',station:'星星充电重庆渝北站',status:'已完成',amount:'¥67.80',time:'2026-06-09 22:40',progress:100},
  {id:'ORD20260610008',plate:'苏H77889',station:'特来电南京江宁站',status:'充电中',amount:'¥41.50',time:'2026-06-10 10:48',progress:24},
]

const statusBadge: Record<string,string> = {'充电中':'bg-electric-green/20 text-electric-green','已完成':'bg-ice-blue/20 text-ice-blue','故障':'bg-amber-orange/20 text-amber-orange'}

const chargeLayers = [
  {label:'高速服务区桩',total:18650,available:14230,color:'bg-ice-blue',textColor:'text-ice-blue',detail:'覆盖G1-G85共20条高速, 436个服务区, 快充桩8,200/慢充桩10,450'},
  {label:'城市公共桩',total:45200,available:38900,color:'bg-electric-green',textColor:'text-electric-green',detail:'覆盖328个城市, 特来电12,000/星星充电15,600/国网17,600'},
  {label:'社区/目的地桩',total:28400,available:21500,color:'bg-amber-orange',textColor:'text-amber-orange',detail:'覆盖2,100个社区, 7kW慢充为主, 均价¥0.8/度'},
]

const thirdParty = [
  {name:'特来电',status:'connected',response:'128ms',sync:'10秒前',rate:'99.8%'},
  {name:'星星充电',status:'connected',response:'156ms',sync:'15秒前',rate:'99.5%'},
  {name:'云快充',status:'connecting',response:'-',sync:'同步中',rate:'-'},
  {name:'e充电',status:'offline',response:'-',sync:'3小时前',rate:'0%'},
]
const statusDot: Record<string,string> = {connected:'bg-electric-green',connecting:'bg-amber-orange',offline:'bg-red-500'}

const auditTrail = [{step:'订单创建',time:'09:22:15'},{step:'认证通过',time:'09:22:18'},{step:'充电开始',time:'09:23:01'},{step:'充电中',time:''}]
const mockHistory = [
  {id:'ORD20260609012',station:'国网北京海淀站',amount:'¥62.30',time:'2026-06-09'},
  {id:'ORD20260608008',station:'特来电北京望京站',amount:'¥38.50',time:'2026-06-08'},
  {id:'ORD20260607005',station:'星星充电北京丰台站',amount:'¥51.20',time:'2026-06-07'},
]

export default function Home() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(mockStats)
  const [selectedCity, setSelectedCity] = useState<typeof cities[0] | null>(null)
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null)
  const [expandedSource, setExpandedSource] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<typeof mockOrders[0] | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    fetch('/api/admin/dashboard').then(r=>r.json()).then(d=>{if(d?.stats)setStats(d.stats)}).catch(()=>{})
  }, [])

  const statCards = [
    {label:'在线桩数',value:stats.onlinePiles,icon:CircleDot,color:'text-electric-green',action:()=>navigate('/map')},
    {label:'充电中',value:stats.chargingPiles,icon:Activity,color:'text-ice-blue',action:()=>navigate('/charging-monitor')},
    {label:'故障数',value:stats.faultPiles,icon:AlertTriangle,color:'text-amber-orange',action:()=>navigate('/charging-monitor')},
    {label:'今日订单',value:stats.todayOrders,icon:Clock,color:'text-electric-green',action:()=>navigate('/orders')},
  ]

  const orderSteps = (status: string) => {
    const done = status==='已完成'?4:status==='故障'?2:3
    return auditTrail.map((s,i)=>({...s,state:i<done?'done':i===done?'active':'pending'}))
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="grid grid-cols-4 gap-4">
        {statCards.map(({label,value,icon:Icon,color,action})=>(
          <div key={label} className="stat-card glow-green cursor-pointer hover:ring-1 hover:ring-electric-green/30 transition-all" onClick={action}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">{label}</span><Icon className={`w-4 h-4 ${color}`}/>
            </div>
            <div className={`data-text text-2xl font-bold ${color} glow-text`}>{value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="glass-card p-4">
            <h2 className="section-title">十横十纵两环高速充电网络</h2>
            <div className="relative w-full h-72 bg-deep-blue rounded-lg overflow-hidden">
              <svg viewBox="0 0 100 88" className="w-full h-full">
                <defs><filter id="glow"><feGaussianBlur stdDeviation="0.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
                {hY.map((y,i)=><g key={`h${i}`}><line x1="2" y1={y} x2="98" y2={y} stroke="rgba(0,229,153,0.3)" strokeWidth="0.4" filter="url(#glow)"/><text x="97" y={y-0.8} fontSize="1.8" fill="rgba(0,229,153,0.5)" textAnchor="end">{hLabels[i]}</text></g>)}
                {vX.map((x,i)=><g key={`v${i}`}><line x1={x} y1="2" x2={x} y2="86" stroke="rgba(0,229,153,0.3)" strokeWidth="0.4" filter="url(#glow)"/><text x={x+0.5} y="4" fontSize="1.8" fill="rgba(0,229,153,0.5)" textAnchor="start">{vLabels[i]}</text></g>)}
                <ellipse cx="50" cy="44" rx="22" ry="16" fill="none" stroke="rgba(79,195,247,0.4)" strokeWidth="0.6" filter="url(#glow)" strokeDasharray="2,1"/>
                <text x="72" y="36" fontSize="2" fill="rgba(79,195,247,0.6)">内环</text>
                <ellipse cx="50" cy="44" rx="38" ry="28" fill="none" stroke="rgba(79,195,247,0.25)" strokeWidth="0.6" filter="url(#glow)" strokeDasharray="3,1.5"/>
                <text x="88" y="24" fontSize="2" fill="rgba(79,195,247,0.5)">外环</text>
                {cities.map(c=>(
                  <g key={c.n} className="cursor-pointer" onClick={()=>setSelectedCity(c)}>
                    <circle cx={c.x} cy={c.y} r="2.5" fill="transparent"/>
                    <circle cx={c.x} cy={c.y} r="1.5" fill="#00E599"><animate attributeName="r" values="1.2;1.8;1.2" dur="2s" repeatCount="indefinite"/></circle>
                    <circle cx={c.x} cy={c.y} r="3" fill="none" stroke="#00E599" strokeWidth="0.2" opacity="0.4"><animate attributeName="r" values="2;5;2" dur="3s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite"/></circle>
                    <text x={c.x} y={c.y+4} fontSize="2.2" fill="#9CA3AF" textAnchor="middle">{c.n}</text>
                  </g>
                ))}
              </svg>
              {selectedCity && (
                <div className="absolute glass-card p-3 w-52 z-10" style={{left:`${selectedCity.x}%`,top:`${selectedCity.y-5}%`}}>
                  <button onClick={()=>setSelectedCity(null)} className="absolute top-1 right-1"><X className="w-3 h-3 text-gray-500"/></button>
                  <div className="text-sm font-bold text-electric-green mb-2">{selectedCity.n}</div>
                  <div className="space-y-1 text-xs text-gray-400">
                    <div>在线: <span className="text-electric-green">{selectedCity.online}</span> / {selectedCity.total}</div>
                    <div>充电中: <span className="text-ice-blue">{selectedCity.charging}</span> · 可用: <span className="text-electric-green">{selectedCity.available}</span> · 故障: <span className="text-amber-orange">{selectedCity.fault}</span></div>
                  </div>
                  <button onClick={()=>navigate('/map')} className="mt-2 text-xs text-electric-green hover:underline">查看详情 →</button>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-4">
            <h2 className="section-title">城市公共桩分层</h2>
            <div className="space-y-3">
              {chargeLayers.map((l,i)=>(
                <div key={l.label}>
                  <div className="cursor-pointer flex items-center gap-2" onClick={()=>setSelectedLayer(selectedLayer===i?null:i)}>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-xs"><span className={l.textColor}>{l.label}</span><span className="text-gray-400">可用 {l.available.toLocaleString()} / 总计 {l.total.toLocaleString()}</span></div>
                      <div className="h-3 bg-deep-blue rounded-full overflow-hidden"><div className={`h-full ${l.color} rounded-full opacity-70`} style={{width:`${(l.available/l.total*100).toFixed(1)}%`}}/></div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${selectedLayer===i?'rotate-180':''}`}/>
                  </div>
                  {selectedLayer===i && <div className="mt-2 p-2 rounded bg-deep-blue/60 text-xs text-gray-300 animate-slide-down">{l.detail}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-4">
            <h2 className="section-title">多源桩联网接入</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-ice-blue"/><span className="text-sm text-gray-200">国网自有桩</span>
                  <span className="ml-auto flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-electric-green animate-pulse"/><span className="text-xs text-electric-green">已连接</span></span>
                </div>
                <div className="text-xs text-gray-400 pl-6">在线 28,450 / 总计 31,200</div>
                <div className="pl-6"><button onClick={()=>navigate('/admin')} className="btn-secondary text-[10px] px-2 py-0.5">实时监控</button></div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2"><Wifi className="w-4 h-4 text-electric-green"/><span className="text-sm text-gray-200">第三方运营商API</span></div>
                <div className="grid grid-cols-2 gap-1.5 pl-6">
                  {thirdParty.map(t=>(
                    <div key={t.name} className="cursor-pointer" onClick={()=>setExpandedSource(expandedSource===t.name?null:t.name)}>
                      <div className="flex items-center gap-1.5 text-xs"><span className={`w-1.5 h-1.5 rounded-full ${statusDot[t.status]}`}/><span className="text-gray-400 hover:text-gray-200">{t.name}</span></div>
                      {expandedSource===t.name && (
                        <div className="mt-1 p-1.5 rounded bg-deep-blue/60 text-[10px] text-gray-400 space-y-0.5">
                          <div>响应: <span className="text-ice-blue">{t.response}</span></div>
                          <div>同步: <span className="text-ice-blue">{t.sync}</span></div>
                          <div>成功率: <span className={t.rate==='99.8%'||t.rate==='99.5%'?'text-electric-green':'text-amber-orange'}>{t.rate}</span></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2"><Radio className="w-4 h-4 text-amber-orange"/><span className="text-sm text-gray-200">GB/T 27930协议直连</span></div>
                <div className="text-xs text-gray-400 pl-6 space-y-0.5">
                  <div>已连接设备: <span className="text-electric-green">1,280</span></div><div>协议版本: V2.2</div><div>最近心跳: <span className="text-ice-blue">10秒前</span></div>
                </div>
                <div className="pl-6"><button onClick={()=>navigate('/admin')} className="btn-secondary text-[10px] px-2 py-0.5">设备列表</button></div>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <h2 className="section-title">快捷操作</h2>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map(({icon:Icon,label,sub,path,color})=>(
                <button key={label} onClick={()=>navigate(path)} className="glass-card p-2.5 text-left hover:border-electric-green/20 transition-all group">
                  <Icon className={`w-5 h-5 ${color} mb-1 group-hover:scale-110 transition-transform`}/>
                  <div className="text-xs text-gray-200 group-hover:text-white">{label}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">可追溯订单实时动态</h2>
          <button onClick={()=>navigate('/orders')} className="text-xs text-electric-green hover:underline">查看全部订单</button>
        </div>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {mockOrders.map(o=>(
            <div key={o.id} className="glass-card flex items-center gap-3 px-3 py-2 text-xs hover:border-electric-green/20 transition-all cursor-pointer" onClick={()=>{setSelectedOrder(o);setShowHistory(false)}}>
              <span className="text-electric-green font-mono shrink-0">{o.id}</span>
              <span className="text-gray-300 shrink-0">{o.plate}</span>
              <span className="text-gray-400 truncate flex-1">{o.station}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${statusBadge[o.status]}`}>{o.status}</span>
              <span className="text-gray-200 shrink-0 font-mono">{o.amount}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={()=>setSelectedOrder(null)}>
          <div className="glass-card p-5 w-[480px] max-h-[85vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-electric-green">订单详情</h3>
              <button onClick={()=>setSelectedOrder(null)}><X className="w-4 h-4 text-gray-500"/></button>
            </div>
            <div className="space-y-2 text-xs mb-4">
              {[['订单ID',selectedOrder.id],['车牌号',selectedOrder.plate],['充电站',selectedOrder.station],['金额',selectedOrder.amount],['开始时间',selectedOrder.time]].map(([k,v])=>(
                <div key={k} className="flex justify-between"><span className="text-gray-500">{k}</span><span className="text-gray-200">{v}</span></div>
              ))}
              <div className="flex justify-between"><span className="text-gray-500">状态</span><span className={`${statusBadge[selectedOrder.status]} px-1.5 py-0.5 rounded`}>{selectedOrder.status}</span></div>
            </div>
            {selectedOrder.status==='充电中' && (
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">充电进度</span><span className="text-electric-green">{selectedOrder.progress}%</span></div>
                <div className="h-2 bg-deep-blue rounded-full overflow-hidden"><div className="h-full bg-electric-green rounded-full transition-all" style={{width:`${selectedOrder.progress}%`}}/></div>
              </div>
            )}
            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-2">审计轨迹</div>
              <div className="flex items-start gap-1">
                {orderSteps(selectedOrder.status).map((s,i)=>(
                  <div key={i} className="flex-1 text-center">
                    <div className="flex items-center">
                      {s.state==='done'&&<Check className="w-3 h-3 text-electric-green mx-auto"/>}
                      {s.state==='active'&&<span className="w-3 h-3 rounded-full bg-ice-blue mx-auto"/>}
                      {s.state==='pending'&&<span className="w-3 h-3 rounded-full bg-gray-700 mx-auto"/>}
                      {i<orderSteps(selectedOrder.status).length-1&&<div className={`flex-1 h-px ${s.state==='done'?'bg-electric-green/40':'bg-gray-700'}`}/>}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${s.state==='done'?'text-electric-green':s.state==='active'?'text-ice-blue':'text-gray-600'}`}>{s.step}</div>
                    {s.time&&<div className="text-[9px] text-gray-600">{s.time}</div>}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>navigate('/charging-monitor')} className="btn-primary text-xs px-3 py-1.5 flex-1">进入充电监控</button>
              <button onClick={()=>setShowHistory(!showHistory)} className="btn-secondary text-xs px-3 py-1.5 flex-1">查看充电记录</button>
            </div>
            {showHistory && (
              <div className="mt-3 space-y-1.5">
                <div className="text-xs text-gray-400 mb-1">历史订单 ({selectedOrder.plate})</div>
                {mockHistory.map(h=>(
                  <div key={h.id} className="flex items-center gap-2 text-[10px] p-1.5 rounded bg-deep-blue/60">
                    <span className="text-gray-400 font-mono">{h.id}</span><span className="text-gray-500 truncate flex-1">{h.station}</span><span className="text-gray-300">{h.amount}</span><span className="text-gray-600">{h.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
