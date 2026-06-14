import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Copy, Check, Shield } from "lucide-react"
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts"
import { mockAccounts, gameList, serverList } from "@/data/mockData"

const mock = mockAccounts[0]

const radarData = [
  { dim: "角色等级", val: 82 }, { dim: "装备价值", val: 95 },
  { dim: "稀有度", val: 88 }, { dim: "市场热度", val: 76 }, { dim: "安全评分", val: 90 },
]

const barData = [
  { name: "本账号", price: mock.valuation },
  { name: "市场均价", price: Math.round(mock.valuation * 0.78) },
  { name: "市场最高", price: Math.round(mock.valuation * 1.35) },
]

export default function Valuation() {
  const [game, setGame] = useState("")
  const [server, setServer] = useState("")
  const [uid, setUid] = useState("")
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const handleValuation = () => {
    if (!game || !uid) return
    setLoading(true)
    setShow(false)
    setTimeout(() => { setLoading(false); setShow(true) }, 1500)
  }

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-5xl mx-auto">
      <div className="glass-panel p-5 mb-6">
        <div className="flex items-center gap-2 text-cyber-cyan mb-4">
          <Search size={18} /><span className="font-bold">账号估值</span>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <select className="bg-cyber-panel border border-cyber-border rounded px-3 py-2 text-sm" value={game} onChange={(e) => { setGame(e.target.value); setServer("") }}>
            <option value="">选择游戏</option>
            {gameList.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select className="bg-cyber-panel border border-cyber-border rounded px-3 py-2 text-sm" value={server} onChange={(e) => setServer(e.target.value)} disabled={!game}>
            <option value="">选择区服</option>
            {(game ? serverList[game] || [] : []).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input className="bg-cyber-panel border border-cyber-border rounded px-3 py-2 text-sm w-40" placeholder="游戏UID" value={uid} onChange={(e) => setUid(e.target.value)} />
          <button className="btn-cyber text-sm" onClick={handleValuation} disabled={loading}>
            {loading ? "估值中..." : "开始估值"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {show && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="glass-panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-cyber-cyan" />
              <span className="font-bold text-cyber-cyan">账号信息</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-cyber-muted">游戏</span><div className="font-medium mt-1">{mock.gameName}</div></div>
              <div><span className="text-cyber-muted">区服</span><div className="font-medium mt-1">{mock.server}</div></div>
              <div><span className="text-cyber-muted">UID</span><div className="font-mono mt-1">{mock.gameUid}</div></div>
              <div><span className="text-cyber-muted">等级</span><div className="font-medium mt-1">Lv.{mock.level}</div></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-5">
              <div className="text-sm font-bold text-cyber-cyan mb-3">维度评估</div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1E2A4A" />
                  <PolarAngleAxis dataKey="dim" tick={{ fill: "#6B7280", fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="val" stroke="#00F0FF" fill="#00F0FF" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-panel p-5 flex flex-col justify-center">
              <div className="text-sm font-bold text-cyber-cyan mb-2">估值结果</div>
              <div className="font-orbitron text-5xl font-bold neon-text mb-2">¥{mock.valuation.toLocaleString()}</div>
              <div className="text-cyber-muted text-sm">基于多维度综合评估</div>
            </div>
          </div>

          <div className="glass-panel p-5">
            <div className="text-sm font-bold text-cyber-cyan mb-3">市场对比</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={{ stroke: "#1E2A4A" }} />
                <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={{ stroke: "#1E2A4A" }} />
                <Tooltip contentStyle={{ background: "#1A1F35", border: "1px solid #1E2A4A", borderRadius: 8, color: "#E2E8F0" }} />
                <Bar dataKey="price" fill="#00F0FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-panel p-5">
            <div className="text-sm font-bold text-cyber-cyan mb-3">链上凭证</div>
            <div className="space-y-3">
              {[
                { label: "快照哈希", value: mock.snapshotHash, key: "snap" },
                { label: "链上交易", value: mock.chainTxHash, key: "chain" },
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-3 text-sm">
                  <span className="text-cyber-muted w-20 shrink-0">{item.label}</span>
                  <span className="font-mono text-cyber-muted bg-cyber-bg px-3 py-1.5 rounded flex-1 truncate">{item.value}</span>
                  <button onClick={() => copyText(item.value, item.key)} className="text-cyber-cyan hover:text-cyber-green transition-colors">
                    {copied === item.key ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
