import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Recycle, Trophy, Clock, Gavel, CheckCircle, BarChart3, ArrowLeft } from "lucide-react"
import { mockRecycleBids, gameList, serverList } from "@/data/mockData"
import { useAppStore } from "@/store/useAppStore"

const rankBadge = (i: number) => {
  if (i === 0) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
  if (i === 1) return "bg-gray-400/20 text-gray-300 border-gray-400/40"
  if (i === 2) return "bg-orange-600/20 text-orange-400 border-orange-600/40"
  return "bg-cyber-panel text-cyber-muted border-cyber-border"
}

const sortedBids = [...mockRecycleBids].sort((a, b) => b.weightScore - a.weightScore)

const pastOrders = [
  { id: "ro-001", game: "原神", amount: 2100, status: "已完成", time: "2025-06-05" },
  { id: "ro-002", game: "王者荣耀", amount: 1520, status: "已完成", time: "2025-05-28" },
  { id: "ro-003", game: "DNF手游", amount: 3800, status: "进行中", time: "2025-06-08" },
]

const scoreBar = (label: string, score: number, color: string) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="w-8 text-cyber-muted">{label}</span>
    <div className="flex-1 h-2 bg-cyber-border rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
    <span className="w-8 text-right text-cyber-muted">{score}</span>
  </div>
)

export default function RecyclePage() {
  const { flow, setFlow, resetFlow } = useAppStore()
  const [game, setGame] = useState("")
  const [server, setServer] = useState("")
  const [uid, setUid] = useState("")
  const [price, setPrice] = useState("")
  const [loading, setLoading] = useState(false)

  const acceptedBid = flow.acceptedBidId ? mockRecycleBids.find((b) => b.id === flow.acceptedBidId) : null

  const handleSubmit = () => {
    if (!game || !uid) return
    setFlow({ recycleStep: "bidding", recycleAccountId: uid })
  }

  const handleAccept = (bidId: string) => {
    setFlow({ recycleStep: "accept", acceptedBidId: bidId })
  }

  const handleContact = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); setFlow({ recycleStep: "transfer" }) }, 2000)
  }

  const handleTransfer = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); setFlow({ recycleStep: "done", recycleTransferDone: true }) }, 1500)
  }

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-6xl mx-auto">
      <AnimatePresence mode="wait">
        {flow.recycleStep === "submit" && (
          <motion.div key="submit" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="glass-panel p-6 max-w-lg mx-auto">
            <div className="flex items-center gap-2 text-cyber-gold mb-5">
              <Recycle size={18} /><span className="font-bold text-lg">回收申请</span>
            </div>
            <div className="space-y-4">
              <select className="w-full bg-cyber-panel border border-cyber-border rounded px-3 py-2.5 text-sm" value={game} onChange={(e) => { setGame(e.target.value); setServer("") }}>
                <option value="">选择游戏</option>
                {gameList.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <select className="w-full bg-cyber-panel border border-cyber-border rounded px-3 py-2.5 text-sm" value={server} onChange={(e) => setServer(e.target.value)} disabled={!game}>
                <option value="">选择区服</option>
                {(game ? serverList[game] || [] : []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input className="w-full bg-cyber-panel border border-cyber-border rounded px-3 py-2.5 text-sm" placeholder="游戏UID" value={uid} onChange={(e) => setUid(e.target.value)} />
              <input className="w-full bg-cyber-panel border border-cyber-border rounded px-3 py-2.5 text-sm" placeholder="期望价格（元）" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
              <button className="btn-cyber w-full py-2.5 text-sm font-bold" onClick={handleSubmit}>
                <Gavel size={14} className="inline mr-1.5" />提交回收申请
              </button>
            </div>
          </motion.div>
        )}

        {flow.recycleStep === "bidding" && (
          <motion.div key="bidding" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="glass-panel p-5">
            <div className="flex items-center gap-2 mb-5">
              <Trophy size={18} className="text-cyber-gold" />
              <span className="font-bold text-cyber-gold">回收商竞价排行</span>
              <span className="flex items-center gap-1.5 ml-auto">
                <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
                <span className="text-xs text-cyber-green">LIVE</span>
              </span>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {sortedBids.map((bid, i) => {
                const totalWeight = +(bid.heatScore * 0.3 + bid.valuationScore * 0.4 + bid.timelinessScore * 0.3).toFixed(1)
                return (
                  <motion.div key={bid.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="glass-panel p-4">
                    <div className="flex items-start gap-3">
                      <span className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${rankBadge(i)}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{bid.recyclerName}</span>
                          <span className="font-orbitron text-xl font-bold text-cyber-cyan">¥{bid.bidAmount.toLocaleString()}</span>
                        </div>
                        <div className="space-y-1.5 mb-2">
                          {scoreBar("热度", bid.heatScore, "bg-yellow-500")}
                          {scoreBar("估值", bid.valuationScore, "bg-purple-500")}
                          {scoreBar("时效", bid.timelinessScore, "bg-cyber-cyan")}
                        </div>
                        <div className="text-xs text-cyber-muted mb-3 font-mono">
                          综合权重 = 热度×0.3 + 估值×0.4 + 时效×0.3 = <span className="text-cyber-gold">{totalWeight}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-cyber-muted flex items-center gap-1"><Clock size={10} />预计 {bid.estimatedTime}</span>
                          <button className="btn-cyber-success text-xs py-1 px-3" onClick={() => handleAccept(bid.id)}>接受报价</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {flow.recycleStep === "accept" && acceptedBid && (
          <motion.div key="accept" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 max-w-lg mx-auto text-center">
            <Trophy size={24} className="text-cyber-gold mx-auto mb-3" />
            <div className="font-bold text-lg mb-2">已接受报价</div>
            <div className="font-orbitron text-3xl text-cyber-cyan font-bold mb-1">¥{acceptedBid.bidAmount.toLocaleString()}</div>
            <div className="text-sm text-cyber-muted mb-5">{acceptedBid.recyclerName}</div>
            <div className="flex items-center justify-center gap-2 text-cyber-cyan mb-5">
              <div className="w-4 h-4 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">正在联系回收商...</span>
            </div>
            <button className="btn-cyber w-full py-2.5" onClick={handleContact} disabled={loading}>
              {loading ? "连接中..." : "确认联系回收商"}
            </button>
          </motion.div>
        )}

        {flow.recycleStep === "transfer" && acceptedBid && (
          <motion.div key="transfer" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 max-w-lg mx-auto">
            <div className="flex items-center gap-2 text-cyber-cyan mb-5">
              <BarChart3 size={18} /><span className="font-bold text-lg">账号移交确认</span>
            </div>
            <div className="glass-panel p-4 mb-5 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-cyber-muted">回收商</span><span>{acceptedBid.recyclerName}</span></div>
              <div className="flex justify-between"><span className="text-cyber-muted">回收金额</span><span className="font-orbitron text-cyber-cyan">¥{acceptedBid.bidAmount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-cyber-muted">预计时间</span><span>{acceptedBid.estimatedTime}</span></div>
            </div>
            <div className="text-xs text-cyber-muted mb-5 text-center">请确认已将账号信息移交至回收商</div>
            <button className="btn-cyber w-full py-2.5 font-bold" onClick={handleTransfer} disabled={loading}>
              {loading ? "处理中..." : "确认移交账号"}
            </button>
          </motion.div>
        )}

        {flow.recycleStep === "done" && acceptedBid && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-8 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-cyber-green/20 border-2 border-cyber-green flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-cyber-green" />
            </div>
            <div className="neon-text-green font-bold text-xl mb-3">回收完成</div>
            <div className="font-orbitron text-4xl font-bold text-cyber-cyan mb-2">¥{acceptedBid.bidAmount.toLocaleString()}</div>
            <div className="text-sm text-cyber-muted mb-1">款项将在 1-3 个工作日内到账</div>
            <div className="text-xs text-cyber-muted mb-5">回收商: {acceptedBid.recyclerName}</div>
            <button className="btn-cyber px-6 py-2" onClick={() => resetFlow("recycle")}>
              <ArrowLeft size={14} className="inline mr-1.5" />返回
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-panel p-5 mt-6">
        <div className="flex items-center gap-2 text-cyber-muted mb-4">
          <Clock size={16} /><span className="font-bold">回收记录</span>
        </div>
        <div className="space-y-2">
          {pastOrders.map((o) => (
            <div key={o.id} className="flex items-center justify-between p-3 rounded bg-cyber-bg/50 text-sm">
              <div className="flex items-center gap-4">
                <span className="font-medium">{o.game}</span>
                <span className="text-cyber-muted">{o.time}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-orbitron text-cyber-cyan">¥{o.amount.toLocaleString()}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${o.status === "已完成" ? "bg-cyber-green/20 text-cyber-green" : "bg-cyber-gold/20 text-cyber-gold"}`}>{o.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
