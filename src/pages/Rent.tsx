import { useState, useCallback } from "react"
import { Gamepad2, Shield, Monitor, MapPin, AlertTriangle, Fingerprint, CreditCard, Clock, CheckCircle, ArrowLeft, Zap, Search } from "lucide-react"
import { mockAccounts, gameList, serverList } from "@/data/mockData"
import { useAppStore } from "@/store/useAppStore"

const steps = ["选号", "租期", "设备绑定", "押金", "使用中", "归还", "完成"]
const stepKeys = ["select", "period", "device", "deposit", "active", "return", "done"]

const riskColor = (s: number) => s < 20 ? "text-cyber-green" : s <= 50 ? "text-cyber-gold" : "text-cyber-red"
const statusStyle = (s: string) => s === "available" ? "bg-cyber-green/20 text-cyber-green" : "bg-cyber-gold/20 text-cyber-gold"

export default function Rent() {
  const { flow, setFlow, resetFlow, rentalOrders } = useAppStore()
  const [game, setGame] = useState("")
  const [server, setServer] = useState("")
  const [levelRange, setLevelRange] = useState<[number, number]>([1, 70])
  const [priceMax, setPriceMax] = useState(50)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [deviceId] = useState(() => "FP-" + [...Array(8)].map(() => Math.floor(Math.random() * 16).toString(16)).join("").toUpperCase())
  const [behaviorScore] = useState(() => Math.floor(Math.random() * 38) + 60)
  const [locationAlerts, setLocationAlerts] = useState<{ id: string; location: string; ip: string; time: string }[]>([])
  const [returnLog, setReturnLog] = useState<{ time: string; action: string; detail: string }[]>([])

  const stepIdx = stepKeys.indexOf(flow.rentalStep)
  const selectedAccount = flow.rentalAccountId ? mockAccounts.find((a) => a.id === flow.rentalAccountId) : null
  const rentFee = selectedAccount
    ? flow.rentalPeriod === "hourly"
      ? selectedAccount.rentPriceHourly * flow.rentalHours
      : selectedAccount.rentPriceDaily * flow.rentalHours
    : 0
  const deposit = selectedAccount ? Math.round(selectedAccount.price * 0.15) : 0

  const accounts = mockAccounts.filter((a) => {
    if (a.status !== "available" && a.status !== "rented") return false
    if (game && a.gameName !== game) return false
    if (server && a.server !== server) return false
    if (a.level < levelRange[0] || a.level > levelRange[1]) return false
    if (a.rentPriceHourly > priceMax) return false
    if (search && !a.gameName.includes(search) && !a.server.includes(search)) return false
    return true
  })

  const activeOrder = rentalOrders.find((o) => o.accountId === flow.rentalAccountId)

  const go = useCallback((step: typeof flow.rentalStep) => {
    setFlow({ rentalStep: step })
  }, [setFlow])

  const goWithLoading = useCallback((ms: number, step: typeof flow.rentalStep, extra?: Partial<typeof flow>) => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setFlow({ rentalStep: step, ...extra })
    }, ms)
  }, [setFlow])

  const simulateCircuitBreaker = () => {
    setFlow({ circuitBreaker: true })
    setLocationAlerts((prev) => [
      ...prev,
      { id: `alert-${Date.now()}`, location: "广东省深圳市", ip: "120.78.***.**", time: new Date().toLocaleTimeString("zh-CN") },
    ])
  }

  const simulateReturnAction = (action: string, detail: string) => {
    setReturnLog((prev) => [...prev, { time: new Date().toLocaleTimeString("zh-CN"), action, detail }])
  }

  const renderStep = () => {
    if (flow.rentalStep === "select") {
      return (
        <>
          <div className="sticky top-0 z-30 glass-panel p-4 mb-6 space-y-3">
            <div className="flex items-center gap-2 text-cyber-cyan mb-2"><Gamepad2 size={18} /><span className="font-bold">筛选账号</span></div>
            <div className="flex flex-wrap gap-3 items-end">
              <select className="bg-cyber-panel border border-cyber-border rounded px-3 py-2 text-sm" value={game} onChange={(e) => { setGame(e.target.value); setServer("") }}>
                <option value="">全部游戏</option>
                {gameList.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <select className="bg-cyber-panel border border-cyber-border rounded px-3 py-2 text-sm" value={server} onChange={(e) => setServer(e.target.value)} disabled={!game}>
                <option value="">全部区服</option>
                {(game ? serverList[game] || [] : []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="flex flex-col text-xs text-cyber-muted">
                <span>等级 {levelRange[0]}-{levelRange[1]}</span>
                <input type="range" min={1} max={70} value={levelRange[1]} onChange={(e) => setLevelRange([1, +e.target.value])} className="accent-cyber-cyan w-32" />
              </div>
              <div className="flex flex-col text-xs text-cyber-muted">
                <span>时价上限 ¥{priceMax}</span>
                <input type="range" min={0} max={50} value={priceMax} onChange={(e) => setPriceMax(+e.target.value)} className="accent-cyber-cyan w-32" />
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-cyber-muted" />
                <input className="bg-cyber-panel border border-cyber-border rounded pl-8 pr-3 py-2 text-sm w-44" placeholder="搜索游戏/区服" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {accounts.map((acc) => (
              <div key={acc.id} className="card-cyber">
                <div className="relative h-36 rounded-lg overflow-hidden mb-3">
                  <img src={acc.imageUrl} alt={acc.gameName} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-cyber-bg via-transparent to-transparent" />
                  <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full ${statusStyle(acc.status)}`}>{acc.status === "available" ? "可租" : "已租"}</span>
                  <span className="absolute bottom-2 left-2 text-xs bg-cyber-purple/80 text-white px-2 py-0.5 rounded">Lv.{acc.level}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="neon-text font-bold text-sm">{acc.gameName}</span>
                  <span className="text-xs text-cyber-muted border border-cyber-border rounded px-1.5 py-0.5">{acc.server}</span>
                  <span className="text-xs text-cyber-muted font-mono">{acc.gameUid}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {acc.equipmentSnapshot.slice(0, 3).map((eq) => (
                    <span key={eq.id} className={`badge-rarity-${eq.rarity} text-xs px-1.5 py-0.5 rounded`}>{eq.name}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm">
                    <span className="text-cyber-cyan font-bold">¥{acc.rentPriceHourly}</span><span className="text-cyber-muted text-xs">/时</span>
                    <span className="ml-2 text-cyber-cyan font-bold">¥{acc.rentPriceDaily}</span><span className="text-cyber-muted text-xs">/日</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`flex items-center gap-1 ${riskColor(acc.riskScore)}`}><Shield size={12} />{acc.riskScore}</span>
                    {acc.chainTxHash && <span className="text-cyber-green flex items-center gap-0.5"><CheckCircle size={10} />链</span>}
                    {acc.insuranceActive && <span className="text-cyber-gold flex items-center gap-0.5"><Shield size={10} />保</span>}
                  </div>
                </div>
                <button
                  onClick={() => setFlow({ rentalAccountId: acc.id, rentalStep: "period", rentalPeriod: "hourly", rentalHours: 2, deviceBound: false, depositPaid: false, circuitBreaker: false })}
                  className="btn-cyber text-xs w-full py-1.5"
                  disabled={acc.status !== "available"}
                >
                  {acc.status === "available" ? "选择此号" : "已被租用"}
                </button>
              </div>
            ))}
          </div>
        </>
      )
    }

    if (flow.rentalStep === "period" && selectedAccount) {
      return (
        <div className="max-w-lg mx-auto space-y-5">
          <div className="card-cyber flex gap-4">
            <img src={selectedAccount.imageUrl} alt="" className="w-24 h-24 rounded-lg object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="neon-text font-bold mb-1">{selectedAccount.gameName}</div>
              <div className="text-xs text-cyber-muted space-y-0.5">
                <div>{selectedAccount.server} · {selectedAccount.gameUid} · Lv.{selectedAccount.level}</div>
                <div>¥{selectedAccount.rentPriceHourly}/时 · ¥{selectedAccount.rentPriceDaily}/日</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-cyber-green flex items-center gap-0.5 text-[10px]"><CheckCircle size={9} />链上存证</span>
                  {selectedAccount.insuranceActive && <span className="text-cyber-gold flex items-center gap-0.5 text-[10px]"><Shield size={9} />已投保</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="glass-panel p-5 space-y-5">
            <div>
              <div className="text-sm text-cyber-cyan font-bold mb-3">① 租期类型</div>
              <div className="flex gap-3">
                <button onClick={() => setFlow({ rentalPeriod: "hourly", rentalHours: 2 })} className={`flex-1 py-2.5 rounded-lg border text-sm font-bold transition-all ${flow.rentalPeriod === "hourly" ? "border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan" : "border-cyber-border text-cyber-muted"}`}>
                  <Clock size={16} className="mx-auto mb-1" />按时
                </button>
                <button onClick={() => setFlow({ rentalPeriod: "daily", rentalHours: 1 })} className={`flex-1 py-2.5 rounded-lg border text-sm font-bold transition-all ${flow.rentalPeriod === "daily" ? "border-cyber-cyan bg-cyber-cyan/10 text-cyber-cyan" : "border-cyber-border text-cyber-muted"}`}>
                  <Zap size={16} className="mx-auto mb-1" />按天
                </button>
              </div>
            </div>
            <div>
              <div className="text-sm text-cyber-cyan font-bold mb-2">② {flow.rentalPeriod === "hourly" ? `小时数: ${flow.rentalHours}小时` : `天数: ${flow.rentalHours}天`}</div>
              <input type="range" min={1} max={flow.rentalPeriod === "hourly" ? 24 : 7} value={flow.rentalHours} onChange={(e) => setFlow({ rentalHours: +e.target.value })} className="accent-cyber-cyan w-full" />
            </div>
            <div className="glass-panel p-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-cyber-muted">租金</span><span>¥{rentFee}</span></div>
              <div className="flex justify-between"><span className="text-cyber-muted">押金（托管）</span><span>¥{deposit}</span></div>
              <div className="flex justify-between font-bold border-t border-cyber-border pt-2"><span>合计</span><span className="neon-text">¥{rentFee + deposit}</span></div>
            </div>
            <button onClick={() => go("device")} className="btn-cyber w-full py-2.5 text-sm font-bold">
              确认租期，下一步：设备绑定 →
            </button>
          </div>
        </div>
      )
    }

    if (flow.rentalStep === "device") {
      return (
        <div className="max-w-md mx-auto space-y-5">
          <div className="glass-panel p-6 text-center space-y-4">
            <Fingerprint size={48} className="mx-auto text-cyber-cyan" />
            <div className="text-sm text-cyber-muted">步骤 3/7 — 设备指纹绑定</div>
            <div className="font-mono text-lg neon-text break-all">{deviceId}</div>
            <div className="text-xs text-cyber-muted">绑定后仅限此设备登录游戏账号。更换设备将触发异地登录风控。</div>
            {flow.deviceBound ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-cyber-green text-sm font-bold"><CheckCircle size={16} />设备已绑定成功</div>
                <button onClick={() => go("deposit")} className="btn-cyber w-full py-2.5 text-sm font-bold">下一步：押金托管 →</button>
              </div>
            ) : (
              <button onClick={() => goWithLoading(1000, "device", { deviceBound: true })} disabled={loading} className="btn-cyber w-full py-2.5 text-sm font-bold">
                {loading ? "绑定中..." : "绑定当前设备"}
              </button>
            )}
          </div>
        </div>
      )
    }

    if (flow.rentalStep === "deposit") {
      return (
        <div className="max-w-md mx-auto space-y-5">
          <div className="glass-panel p-6 space-y-4">
            <CreditCard size={40} className="mx-auto text-cyber-cyan" />
            <div className="text-center text-sm text-cyber-muted">步骤 4/7 — 押金托管</div>
            <div className="glass-panel p-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-cyber-muted">租金</span><span>¥{rentFee}</span></div>
              <div className="flex justify-between"><span className="text-cyber-muted">押金（平台托管，可退）</span><span>¥{deposit}</span></div>
              <div className="flex justify-between font-bold border-t border-cyber-border pt-2 text-base"><span>支付总额</span><span className="neon-text">¥{rentFee + deposit}</span></div>
            </div>
            <div className="flex items-center gap-2 justify-center text-xs text-cyber-muted">
              <Shield size={12} className="text-cyber-green" />押金由平台托管，租期结束自动退还
            </div>
            {flow.depositPaid ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-cyber-green text-sm font-bold"><CheckCircle size={16} />押金已托管</div>
                <button onClick={() => go("active")} className="btn-cyber w-full py-2.5 text-sm font-bold">下一步：开始使用 →</button>
              </div>
            ) : (
              <button onClick={() => goWithLoading(1500, "deposit", { depositPaid: true })} disabled={loading} className="btn-cyber w-full py-2.5 text-sm font-bold">
                {loading ? "支付中..." : "支付押金并托管"}
              </button>
            )}
          </div>
        </div>
      )
    }

    if (flow.rentalStep === "active" && selectedAccount) {
      return (
        <div className="max-w-2xl mx-auto space-y-5">
          {flow.circuitBreaker && (
            <div className="glass-panel p-4 border border-cyber-red/50 bg-cyber-red/5 flex items-center gap-3">
              <AlertTriangle size={24} className="text-cyber-red shrink-0" />
              <div>
                <div className="font-bold text-cyber-red">⚠ 熔断保护已触发</div>
                <div className="text-xs text-cyber-muted mt-0.5">检测到异地登录，账号已自动锁定。请联系客服或等待验证。</div>
              </div>
            </div>
          )}

          <div className="card-cyber flex gap-4">
            <img src={selectedAccount.imageUrl} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="neon-text font-bold">{selectedAccount.gameName}</div>
              <div className="text-xs text-cyber-muted">{selectedAccount.server} · {selectedAccount.gameUid} · Lv.{selectedAccount.level}</div>
              <div className="flex items-center gap-3 mt-1 text-xs">
                <span className="text-cyber-green flex items-center gap-0.5"><CheckCircle size={9} />链</span>
                <span>设备: <span className="font-mono text-cyber-cyan">{deviceId}</span></span>
                <span>押金: <span className="text-cyber-cyan">¥{deposit}</span> 托管中</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-4 flex flex-col items-center">
              <Shield size={16} className="text-cyber-cyan mb-2" />
              <span className="text-xs text-cyber-muted mb-3">行为评分</span>
              <div className="relative w-24 h-24">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.8" className="text-cyber-border" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.8" strokeDasharray={`${behaviorScore} ${100 - behaviorScore}`} strokeLinecap="round" className={behaviorScore >= 80 ? "text-cyber-green" : behaviorScore >= 50 ? "text-cyber-gold" : "text-cyber-red"} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold neon-text">{behaviorScore}</span>
              </div>
              <span className={`text-xs mt-2 ${riskColor(behaviorScore)}`}>{behaviorScore >= 80 ? "正常" : behaviorScore >= 50 ? "注意" : "异常"}</span>
            </div>

            <div className="glass-panel p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold"><Monitor size={14} className="text-cyber-cyan" />设备指纹</div>
              <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${flow.deviceBound ? "bg-cyber-green animate-pulse" : "bg-cyber-red"}`} /><span className="text-xs font-mono text-cyber-muted">{deviceId}</span><span className={`text-xs ${flow.deviceBound ? "text-cyber-green" : "text-cyber-red"}`}>{flow.deviceBound ? "已绑定" : "未绑定"}</span></div>

              <div className="flex items-center gap-2 text-sm font-bold"><MapPin size={14} className="text-cyber-cyan" />位置告警</div>
              {locationAlerts.length > 0 ? (
                <ul className="space-y-1">
                  {locationAlerts.map((loc) => (
                    <li key={loc.id} className="flex items-center gap-1.5 text-xs">
                      <AlertTriangle size={10} className="text-cyber-red shrink-0" />
                      <span className="text-cyber-red">{loc.location} · {loc.ip} · {loc.time}</span>
                    </li>
                  ))}
                </ul>
              ) : <span className="text-xs text-cyber-muted">暂无异常</span>}

              <div className="flex items-center gap-2 text-sm font-bold"><AlertTriangle size={14} className="text-cyber-cyan" />风控状态</div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${flow.circuitBreaker ? "bg-cyber-red animate-pulse" : "bg-cyber-green animate-pulse"}`} />
                <span className={`text-sm font-bold ${flow.circuitBreaker ? "text-cyber-red" : "text-cyber-green"}`}>{flow.circuitBreaker ? "熔断锁定" : "正常运行"}</span>
              </div>
            </div>
          </div>

          {!flow.circuitBreaker && (
            <button onClick={simulateCircuitBreaker} className="w-full py-2 rounded border border-cyber-red/40 text-cyber-red text-sm hover:bg-cyber-red/10 transition-colors">
              <Zap size={14} className="inline mr-1" />模拟异地登录（触发熔断）
            </button>
          )}

          {flow.circuitBreaker && (
            <button onClick={() => { setFlow({ circuitBreaker: false }); setLocationAlerts([]) }} className="w-full py-2 rounded border border-cyber-green/40 text-cyber-green text-sm hover:bg-cyber-green/10 transition-colors">
              解除熔断（验证身份后恢复）
            </button>
          )}

          <button onClick={() => { simulateReturnAction("申请归还", "租期结束，申请归还账号"); go("return") }} className="btn-cyber w-full py-2.5 text-sm font-bold">
            结束租用，申请归还 →
          </button>
        </div>
      )
    }

    if (flow.rentalStep === "return" && selectedAccount) {
      return (
        <div className="max-w-md mx-auto space-y-5">
          <div className="glass-panel p-6 space-y-4">
            <CheckCircle size={40} className="mx-auto text-cyber-cyan" />
            <div className="text-center font-bold neon-text text-lg">归还确认</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-cyber-muted">账号</span><span>{selectedAccount.gameName} · {selectedAccount.gameUid}</span></div>
              <div className="flex justify-between"><span className="text-cyber-muted">租期</span><span>{flow.rentalPeriod === "hourly" ? `${flow.rentalHours}小时` : `${flow.rentalHours}天`}</span></div>
              <div className="flex justify-between"><span className="text-cyber-muted">租金</span><span>¥{rentFee}</span></div>
              <div className="flex justify-between"><span className="text-cyber-muted">押金退还</span><span className="text-cyber-green font-bold">¥{deposit}</span></div>
            </div>
            <div className="flex items-center gap-2 justify-center text-xs text-cyber-muted">
              <Shield size={12} className="text-cyber-green" />平台托管押金将自动退还原支付账户
            </div>
          </div>

          {returnLog.length > 0 && (
            <div className="glass-panel p-4 space-y-2">
              <div className="text-sm text-cyber-cyan font-bold">归还记录</div>
              {returnLog.map((log, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-cyber-muted">{log.time}</span>
                  <span className="text-cyber-cyan">{log.action}</span>
                  <span className="text-cyber-muted">{log.detail}</span>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => goWithLoading(1200, "done")} disabled={loading} className="btn-cyber w-full py-2.5 text-sm font-bold">
            {loading ? "归还处理中..." : "确认归还"}
          </button>
        </div>
      )
    }

    if (flow.rentalStep === "done") {
      return (
        <div className="max-w-md mx-auto">
          <div className="glass-panel p-8 text-center space-y-4">
            <CheckCircle size={56} className="mx-auto text-cyber-green" />
            <div className="text-xl font-bold text-cyber-green">租用已完成</div>
            <div className="text-sm text-cyber-muted">押金 ¥{deposit} 已原路退还</div>
            <div className="text-xs text-cyber-muted">设备指纹已解绑 · 账号已归还 · 风控记录已归档</div>
            <div className="glass-panel p-3 mt-3 text-xs text-cyber-muted text-left space-y-1">
              <div>✓ 租金 ¥{rentFee} 已结算</div>
              <div>✓ 押金 ¥{deposit} 已退还</div>
              <div>✓ 设备绑定已解除</div>
              <div>✓ 风控评分已归档</div>
            </div>
            <button onClick={() => { resetFlow("rental"); setLocationAlerts([]); setReturnLog([]) }} className="btn-cyber w-full py-2.5 mt-4">返回租号中心</button>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="glass-panel p-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          {flow.rentalStep !== "select" && (
            <button onClick={() => { if (stepIdx > 0) go(stepKeys[stepIdx - 1] as typeof flow.rentalStep) }} className="text-cyber-muted hover:text-cyber-cyan transition-colors"><ArrowLeft size={18} /></button>
          )}
          <span className="neon-text font-bold text-sm">租号流程</span>
          <span className="text-xs text-cyber-muted ml-2">步骤 {stepIdx + 1}/{steps.length}</span>
          {flow.rentalStep !== "select" && (
            <button onClick={() => { resetFlow("rental"); setLocationAlerts([]); setReturnLog([]) }} className="ml-auto text-xs text-cyber-muted hover:text-cyber-red border border-cyber-border rounded px-3 py-1 transition-colors">重新选号</button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < stepIdx ? "bg-cyber-green/20 text-cyber-green" : i === stepIdx ? "bg-cyber-cyan/20 text-cyber-cyan animate-glow-pulse" : "bg-cyber-border/50 text-cyber-muted"
                }`}>{i < stepIdx ? <CheckCircle size={14} /> : i + 1}</div>
                <span className={`text-[10px] mt-1 ${i <= stepIdx ? "text-cyber-cyan" : "text-cyber-muted"}`}>{label}</span>
              </div>
              {i < steps.length - 1 && <div className={`h-px flex-1 mb-4 transition-colors ${i < stepIdx ? "bg-cyber-green/40" : "bg-cyber-border"}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="transition-opacity duration-200">
        {renderStep()}
      </div>
    </div>
  )
}
