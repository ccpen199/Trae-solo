import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingCart, Tag, ClipboardList, FileText, Shield, AlertTriangle, Plus, X } from "lucide-react"
import { mockAccounts, mockTradeOrders, gameList, serverList } from "@/data/mockData"
import { useAppStore } from "@/store/useAppStore"

const escrowSteps = ["下单", "合同签署", "资金托管冻结", "账号过户", "资金释放"]
const contractStatusCfg: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-yellow-500/20 text-yellow-400", label: "待签署" },
  signed: { color: "bg-cyber-cyan/20 text-cyber-cyan", label: "已签署" },
  escrow_frozen: { color: "bg-blue-500/20 text-blue-400", label: "资金冻结" },
  releasing: { color: "bg-cyber-green/20 text-cyber-green", label: "释放中" },
  completed: { color: "bg-cyber-green/20 text-cyber-green", label: "已完成" },
  disputed: { color: "bg-cyber-red/20 text-cyber-red", label: "争议中" },
}
const escrowStepIdx = (s: string) => {
  const m: Record<string, number> = { pending: 0, signed: 1, escrow_frozen: 2, releasing: 4, completed: 4, disputed: 2 }
  return m[s] ?? 0
}

type Tab = "buy" | "sell" | "orders"

export default function Trade() {
  const { tradeOrders, accounts } = useAppStore()
  const [tab, setTab] = useState<Tab>("buy")
  const [detailId, setDetailId] = useState<string | null>(null)
  const [signed, setSigned] = useState<Record<string, boolean>>({})

  const [sellGame, setSellGame] = useState("")
  const [sellServer, setSellServer] = useState("")
  const [sellUid, setSellUid] = useState("")
  const [sellLevel, setSellLevel] = useState("")
  const [sellPrice, setSellPrice] = useState("")
  const [sellEquipList, setSellEquipList] = useState<{ name: string; rarity: string; type: string }[]>([])
  const [newEq, setNewEq] = useState({ name: "", rarity: "rare", type: "" })

  const sellingAccounts = mockAccounts.filter((a) => a.status === "selling" || a.status === "available")

  const detailAcc = detailId ? sellingAccounts.find((a) => a.id === detailId) : null
  const detailOrder = detailId ? tradeOrders.find((o) => o.accountId === detailId) : null

  const autoValuation = sellPrice ? Math.round(+sellPrice * 0.9 + Math.random() * 200) : 0

  const addEquip = () => {
    if (!newEq.name || !newEq.type) return
    setSellEquipList([...sellEquipList, { ...newEq }])
    setNewEq({ name: "", rarity: "rare", type: "" })
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="flex gap-2 mb-6">
        {([["buy", "买号", ShoppingCart], ["sell", "卖号", Tag], ["orders", "我的订单", ClipboardList]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === key ? "btn-cyber" : "bg-cyber-panel border border-cyber-border text-cyber-muted hover:text-cyber-cyan"}`}>
            <Icon size={16} />{label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "buy" && (
          <motion.div key="buy" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sellingAccounts.map((acc) => (
              <motion.div key={acc.id} layout className="card-cyber group relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="relative h-36 rounded-lg overflow-hidden mb-3">
                  <img src={acc.imageUrl} alt={acc.gameName} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-cyber-bg via-transparent to-transparent" />
                  <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-cyber-cyan/20 text-cyber-cyan">{acc.status === "selling" ? "在售" : "可购"}</span>
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
                  <span className="text-cyber-cyan font-bold">¥{acc.price}</span>
                  <span className="text-xs text-cyber-muted">估值 ¥{acc.valuation}~¥{acc.valuation + 300}</span>
                </div>
                <button onClick={() => { setDetailId(acc.id); setSigned((p) => ({ ...p })) }} className="btn-cyber text-xs w-full py-1.5">立即购买</button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {tab === "sell" && (
          <motion.div key="sell" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="max-w-lg mx-auto glass-panel p-6 space-y-4">
            <div className="neon-text font-bold text-lg mb-2">发布上架</div>
            <select className="w-full bg-cyber-panel border border-cyber-border rounded px-3 py-2 text-sm" value={sellGame} onChange={(e) => { setSellGame(e.target.value); setSellServer("") }}>
              <option value="">选择游戏</option>
              {gameList.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select className="w-full bg-cyber-panel border border-cyber-border rounded px-3 py-2 text-sm" value={sellServer} onChange={(e) => setSellServer(e.target.value)} disabled={!sellGame}>
              <option value="">选择区服</option>
              {(sellGame ? serverList[sellGame] || [] : []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input className="w-full bg-cyber-panel border border-cyber-border rounded px-3 py-2 text-sm" placeholder="UID" value={sellUid} onChange={(e) => setSellUid(e.target.value)} />
            <input className="w-full bg-cyber-panel border border-cyber-border rounded px-3 py-2 text-sm" placeholder="等级" type="number" value={sellLevel} onChange={(e) => setSellLevel(e.target.value)} />
            <input className="w-full bg-cyber-panel border border-cyber-border rounded px-3 py-2 text-sm" placeholder="售价 (¥)" type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} />
            {sellPrice && <div className="text-sm text-cyber-gold">自动估值：¥{autoValuation}</div>}
            <div className="space-y-2">
              <div className="text-sm text-cyber-muted font-bold">装备列表</div>
              {sellEquipList.map((eq, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={`badge-rarity-${eq.rarity} px-1.5 py-0.5 rounded`}>{eq.name}</span>
                  <span className="text-cyber-muted">{eq.type}</span>
                  <button onClick={() => setSellEquipList(sellEquipList.filter((_, j) => j !== i))} className="text-cyber-red"><X size={12} /></button>
                </div>
              ))}
              <div className="flex gap-2">
                <input className="flex-1 bg-cyber-panel border border-cyber-border rounded px-2 py-1 text-xs" placeholder="装备名" value={newEq.name} onChange={(e) => setNewEq({ ...newEq, name: e.target.value })} />
                <select className="bg-cyber-panel border border-cyber-border rounded px-2 py-1 text-xs" value={newEq.rarity} onChange={(e) => setNewEq({ ...newEq, rarity: e.target.value })}>
                  <option value="rare">稀有</option><option value="epic">史诗</option><option value="legendary">传说</option>
                </select>
                <input className="w-16 bg-cyber-panel border border-cyber-border rounded px-2 py-1 text-xs" placeholder="类型" value={newEq.type} onChange={(e) => setNewEq({ ...newEq, type: e.target.value })} />
                <button onClick={addEquip} className="btn-cyber px-2 py-1 text-xs"><Plus size={12} /></button>
              </div>
            </div>
            <button className="btn-cyber w-full py-2 text-sm font-bold">发布上架</button>
          </motion.div>
        )}

        {tab === "orders" && (
          <motion.div key="orders" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-3 max-w-2xl mx-auto">
            {tradeOrders.map((o) => {
              const acc = accounts.find((a) => a.id === o.accountId)
              const cfg = contractStatusCfg[o.contractStatus]
              return (
                <div key={o.id} className="glass-panel p-4 flex items-center gap-4">
                  <FileText size={20} className="text-cyber-cyan shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-cyber-muted">{o.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <div className="text-sm neon-text">{acc?.gameName ?? "—"}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-cyber-cyan font-bold">¥{o.amount}</div>
                    <div className="text-xs text-cyber-muted">{o.escrowStatus}</div>
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailId && detailAcc && (
          <>
            <motion.div className="fixed inset-0 bg-black/50 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetailId(null)} />
            <motion.div className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[560px] bg-cyber-panel border border-cyber-border rounded-xl z-50 overflow-y-auto" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="neon-text font-bold text-lg">交易详情</span>
                  <button onClick={() => setDetailId(null)} className="text-cyber-muted hover:text-cyber-cyan"><X size={18} /></button>
                </div>
                <div className="glass-panel p-3 space-y-1">
                  <div className="flex items-center gap-2"><span className="neon-text font-bold">{detailAcc.gameName}</span><span className="text-xs text-cyber-muted">{detailAcc.server}</span></div>
                  <div className="text-xs text-cyber-muted">Lv.{detailAcc.level} · UID {detailAcc.gameUid}</div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {detailAcc.equipmentSnapshot.slice(0, 3).map((eq) => <span key={eq.id} className={`badge-rarity-${eq.rarity} text-xs px-1.5 py-0.5 rounded`}>{eq.name}</span>)}
                  </div>
                  <div className="text-cyber-cyan font-bold">¥{detailAcc.price}</div>
                </div>
                <div className="glass-panel p-3 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-cyber-cyan"><FileText size={14} />合同预览</div>
                  <div className="text-xs text-cyber-muted leading-relaxed bg-cyber-bg/50 rounded p-3 max-h-32 overflow-y-auto">
                    甲方（卖方）同意将游戏账号 {detailAcc.gameUid} 以 ¥{detailAcc.price} 转让给乙方（买方）。双方同意通过平台托管完成交易。资金在账号过户确认后释放。争议由平台仲裁解决。本合同基于区块链存证，哈希 {detailOrder?.contractHash ?? "0xpending..."}。
                  </div>
                </div>
                <div className="glass-panel p-3 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-cyber-cyan"><Shield size={14} />托管进度</div>
                  <div className="flex items-center gap-1">
                    {escrowSteps.map((step, i) => {
                      const current = escrowStepIdx(detailOrder?.contractStatus ?? "pending")
                      const done = i <= current
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className={`w-full h-1.5 rounded-full ${done ? "bg-cyber-cyan" : "bg-cyber-border"}`} />
                          <span className={`text-[10px] ${done ? "text-cyber-cyan" : "text-cyber-muted"}`}>{step}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setSigned((p) => ({ ...p, [detailId]: true }))} disabled={!!signed[detailId]} className={`flex-1 py-2 rounded text-sm font-bold ${signed[detailId] ? "bg-cyber-green/20 text-cyber-green border border-cyber-green/40" : "btn-cyber"}`}>
                    {signed[detailId] ? "已签署" : "签署合同"}
                  </button>
                  <button className="btn-cyber-danger flex items-center gap-1.5 px-4 py-2 text-sm"><AlertTriangle size={14} />发起争议</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
