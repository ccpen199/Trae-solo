import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import { Search, Filter, Shield, AlertTriangle, MapPin, Monitor, X } from "lucide-react"
import { mockAccounts, gameList, serverList } from "@/data/mockData"
import { useAppStore } from "@/store/useAppStore"

const riskColor = (s: number) => s < 20 ? "text-cyber-green" : s <= 50 ? "text-cyber-gold" : "text-cyber-red"
const statusStyle = (s: string) => s === "available" ? "bg-cyber-green/20 text-cyber-green" : "bg-cyber-gold/20 text-cyber-gold"
const riskStatusCfg: Record<string, { color: string; label: string }> = {
  normal: { color: "text-cyber-green", label: "正常" },
  warning: { color: "text-cyber-gold", label: "警告" },
  alert: { color: "text-orange-400", label: "异常" },
  circuit_break: { color: "text-cyber-red", label: "熔断" },
}

export default function Rent() {
  const { rentalOrders } = useAppStore()
  const [game, setGame] = useState("")
  const [server, setServer] = useState("")
  const [levelRange, setLevelRange] = useState<[number, number]>([1, 70])
  const [priceMax, setPriceMax] = useState(50)
  const [search, setSearch] = useState("")
  const [panelId, setPanelId] = useState<string | null>(null)

  const accounts = mockAccounts.filter((a) => {
    if (a.status !== "available" && a.status !== "rented") return false
    if (game && a.gameName !== game) return false
    if (server && a.server !== server) return false
    if (a.level < levelRange[0] || a.level > levelRange[1]) return false
    if (a.rentPriceHourly > priceMax) return false
    if (search && !a.gameName.includes(search) && !a.server.includes(search)) return false
    return true
  })

  const selectedOrder = panelId ? rentalOrders.find((o) => o.accountId === panelId) : null
  const riskInfo = selectedOrder ? riskStatusCfg[selectedOrder.riskStatus] : null

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="sticky top-0 z-30 glass-panel p-4 mb-6 space-y-3">
        <div className="flex items-center gap-2 text-cyber-cyan mb-2">
          <Filter size={18} /><span className="font-bold">筛选账号</span>
        </div>
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
          <motion.div key={acc.id} layout className="card-cyber group relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="relative h-36 rounded-lg overflow-hidden mb-3">
              <img src={acc.imageUrl} alt={acc.gameName} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-cyber-bg via-transparent to-transparent" />
              <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full ${statusStyle(acc.status)}`}>{acc.status === "available" ? "可租" : "已租"}</span>
              <span className="absolute bottom-2 left-2 text-xs bg-cyber-purple/80 text-white px-2 py-0.5 rounded">Lv.{acc.level}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="neon-text font-bold text-sm">{acc.gameName}</span>
              <span className="text-xs text-cyber-muted border border-cyber-border rounded px-1.5 py-0.5">{acc.server}</span>
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
              <div className={`flex items-center gap-1 text-xs ${riskColor(acc.riskScore)}`}>
                <Shield size={12} />{acc.riskScore}
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={`/rent/${acc.id}`} className="btn-cyber text-xs flex-1 text-center py-1.5">立即租用</Link>
              <button onClick={() => setPanelId(acc.id)} className="border border-cyber-border hover:border-cyber-cyan rounded px-2.5 py-1.5 text-xs text-cyber-muted hover:text-cyber-cyan transition-colors">
                <Shield size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {panelId && selectedOrder && riskInfo && (
          <>
            <motion.div className="fixed inset-0 bg-black/50 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPanelId(null)} />
            <motion.div className="fixed right-0 top-0 h-full w-80 bg-cyber-panel border-l border-cyber-border z-50 p-5 overflow-y-auto" initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }} transition={{ type: "spring", damping: 25 }}>
              <div className="flex items-center justify-between mb-5">
                <span className="neon-text font-bold">风控面板</span>
                <button onClick={() => setPanelId(null)} className="text-cyber-muted hover:text-cyber-cyan"><X size={18} /></button>
              </div>
              <div className="space-y-5">
                <div className="glass-panel p-3">
                  <div className="flex items-center gap-2 text-sm mb-2"><Monitor size={14} className="text-cyber-cyan" />设备指纹</div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
                    <span className="text-xs text-cyber-muted font-mono">{selectedOrder.deviceFingerprint}</span>
                  </div>
                </div>
                <div className="glass-panel p-3">
                  <div className="flex items-center gap-2 text-sm mb-2"><Shield size={14} className="text-cyber-cyan" />行为评分</div>
                  <div className="flex items-center justify-center">
                    <div className="relative w-24 h-24">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.8" className="text-cyber-border" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.8" strokeDasharray={`${selectedOrder.behaviorScore} ${100 - selectedOrder.behaviorScore}`} strokeLinecap="round" className={selectedOrder.behaviorScore >= 80 ? "text-cyber-green" : selectedOrder.behaviorScore >= 50 ? "text-cyber-gold" : "text-cyber-red"} />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold neon-text">{selectedOrder.behaviorScore}</span>
                    </div>
                  </div>
                </div>
                <div className="glass-panel p-3">
                  <div className="flex items-center gap-2 text-sm mb-2"><MapPin size={14} className="text-cyber-cyan" />位置警报</div>
                  {selectedOrder.locationAlerts.length === 0 ? (
                    <span className="text-xs text-cyber-muted">暂无异常</span>
                  ) : (
                    <ul className="space-y-2">
                      {selectedOrder.locationAlerts.map((loc) => (
                        <li key={loc.id} className="flex items-start gap-2 text-xs">
                          <AlertTriangle size={12} className="text-cyber-gold mt-0.5 shrink-0" />
                          <div>
                            <div className="text-cyber-gold">{loc.location} · {loc.ip}</div>
                            <div className="text-cyber-muted">{new Date(loc.timestamp).toLocaleString("zh-CN")}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="glass-panel p-3">
                  <div className="flex items-center gap-2 text-sm mb-2"><AlertTriangle size={14} className="text-cyber-cyan" />风险状态</div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${riskInfo.color === "text-cyber-green" ? "bg-cyber-green" : riskInfo.color === "text-cyber-gold" ? "bg-cyber-gold" : riskInfo.color === "text-orange-400" ? "bg-orange-400" : "bg-cyber-red"} animate-pulse`} />
                    <span className={`text-sm font-bold ${riskInfo.color}`}>{riskInfo.label}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
