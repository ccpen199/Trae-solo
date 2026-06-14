import { useState } from "react"
import { motion } from "framer-motion"
import { Recycle, Trophy, Clock, Star, Gavel } from "lucide-react"
import { mockRecycleBids, gameList, serverList } from "@/data/mockData"

const rankBadge = (i: number) => {
  if (i === 0) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
  if (i === 1) return "bg-gray-400/20 text-gray-300 border-gray-400/40"
  if (i === 2) return "bg-orange-600/20 text-orange-400 border-orange-600/40"
  return "bg-cyber-panel text-cyber-muted border-cyber-border"
}

const pastOrders = [
  { id: "ro-001", game: "原神", amount: 2100, status: "已完成", time: "2025-06-05" },
  { id: "ro-002", game: "王者荣耀", amount: 1520, status: "已完成", time: "2025-05-28" },
  { id: "ro-003", game: "DNF手游", amount: 3800, status: "进行中", time: "2025-06-08" },
]

export default function RecyclePage() {
  const [game, setGame] = useState("")
  const [server, setServer] = useState("")
  const [uid, setUid] = useState("")
  const [price, setPrice] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!game || !uid) return
    setSubmitted(true)
  }

  const sortedBids = [...mockRecycleBids].sort((a, b) => b.weightScore - a.weightScore)

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-panel p-5">
          <div className="flex items-center gap-2 text-cyber-gold mb-4">
            <Recycle size={18} /><span className="font-bold">回收申请</span>
          </div>
          <div className="space-y-3">
            <select className="w-full bg-cyber-panel border border-cyber-border rounded px-3 py-2 text-sm" value={game} onChange={(e) => { setGame(e.target.value); setServer("") }}>
              <option value="">选择游戏</option>
              {gameList.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select className="w-full bg-cyber-panel border border-cyber-border rounded px-3 py-2 text-sm" value={server} onChange={(e) => setServer(e.target.value)} disabled={!game}>
              <option value="">选择区服</option>
              {(game ? serverList[game] || [] : []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input className="w-full bg-cyber-panel border border-cyber-border rounded px-3 py-2 text-sm" placeholder="游戏UID" value={uid} onChange={(e) => setUid(e.target.value)} />
            <input className="w-full bg-cyber-panel border border-cyber-border rounded px-3 py-2 text-sm" placeholder="期望价格（元）" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            <button className="btn-cyber w-full text-sm" onClick={handleSubmit}>
              <span className="flex items-center justify-center gap-2"><Gavel size={14} />提交回收申请</span>
            </button>
          </div>
        </div>

        {submitted && (
          <div className="glass-panel p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-cyber-gold" />
              <span className="font-bold text-cyber-gold">回收商竞价排行</span>
              <span className="flex items-center gap-1.5 ml-auto">
                <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
                <span className="text-xs text-cyber-green">LIVE</span>
              </span>
            </div>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {sortedBids.map((bid, i) => (
                <motion.div
                  key={bid.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.12 }}
                  className="glass-panel p-3 flex items-start gap-3"
                >
                  <span className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold ${rankBadge(i)}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{bid.recyclerName}</span>
                      <span className="font-orbitron text-lg font-bold text-cyber-cyan">¥{bid.bidAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-cyber-muted mb-2">
                      <span className="flex items-center gap-1"><Star size={10} className="text-cyber-gold" />热度 {bid.heatScore}</span>
                      <span className="flex items-center gap-1"><Trophy size={10} className="text-cyber-purple" />估值 {bid.valuationScore}</span>
                      <span className="flex items-center gap-1"><Clock size={10} className="text-cyber-cyan" />时效 {bid.timelinessScore}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-cyber-muted flex items-center gap-1"><Clock size={10} />预计 {bid.estimatedTime}</span>
                      <button className="btn-cyber-success text-xs py-1 px-3">接受报价</button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel p-5">
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
                <span className={`text-xs px-2 py-0.5 rounded ${o.status === "已完成" ? "bg-cyber-green/20 text-cyber-green" : "bg-cyber-gold/20 text-cyber-gold"}`}>
                  {o.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
