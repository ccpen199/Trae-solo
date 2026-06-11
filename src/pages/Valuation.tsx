import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Copy, Check, Shield, CheckCircle, ArrowLeft } from "lucide-react"
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts"
import { mockAccounts, gameList, serverList } from "@/data/mockData"
import { useAppStore } from "@/store/useAppStore"

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

const rarityLabel: Record<string, string> = { common: "普通", rare: "稀有", epic: "史诗", legendary: "传说" }

export default function Valuation() {
  const { flow, setFlow, resetFlow } = useAppStore()
  const [game, setGame] = useState("")
  const [server, setServer] = useState("")
  const [uid, setUid] = useState("")
  const [progress, setProgress] = useState(0)
  const [copied, setCopied] = useState<string | null>(null)

  const handleStart = () => {
    setFlow({ valuationStep: "loading", valuationAccountId: uid })
    setProgress(0)
    const t1 = setInterval(() => setProgress((p) => Math.min(p + 5, 90)), 50)
    setTimeout(() => { clearInterval(t1); setProgress(100); setFlow({ valuationStep: "report" }) }, 2000)
  }

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-5xl mx-auto">
      <AnimatePresence mode="wait">
        {flow.valuationStep === "input" && (
          <motion.div key="input" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="glass-panel p-6">
            <div className="flex items-center gap-2 text-cyber-cyan mb-5">
              <Search size={18} /><span className="font-bold text-lg">账号估值</span>
            </div>
            <div className="space-y-4 max-w-md">
              <select className="w-full bg-cyber-panel border border-cyber-border rounded px-3 py-2.5 text-sm" value={game} onChange={(e) => { setGame(e.target.value); setServer("") }}>
                <option value="">选择游戏</option>
                {gameList.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <select className="w-full bg-cyber-panel border border-cyber-border rounded px-3 py-2.5 text-sm" value={server} onChange={(e) => setServer(e.target.value)} disabled={!game}>
                <option value="">选择区服</option>
                {(game ? serverList[game] || [] : []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input className="w-full bg-cyber-panel border border-cyber-border rounded px-3 py-2.5 text-sm" placeholder="游戏UID" value={uid} onChange={(e) => setUid(e.target.value)} />
              <button className="btn-cyber w-full py-2.5 text-sm font-bold" onClick={handleStart} disabled={!game || !uid}>{(!game || !uid) ? "请填写游戏和UID" : "开始估值"}</button>
            </div>
          </motion.div>
        )}

        {flow.valuationStep === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-panel p-10 text-center">
            <div className="w-14 h-14 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin mx-auto mb-5" />
            <div className="neon-text font-bold text-lg mb-2">正在拉取角色数据...</div>
            <div className="text-cyber-muted text-sm mb-6">UID: {flow.valuationAccountId}</div>
            <div className="max-w-xs mx-auto">
              <div className="h-2 bg-cyber-border rounded-full overflow-hidden">
                <motion.div className="h-full bg-cyber-cyan rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
              </div>
              <div className="text-xs text-cyber-muted mt-2">{progress}%</div>
            </div>
          </motion.div>
        )}

        {flow.valuationStep === "report" && (
          <motion.div key="report" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="glass-panel p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={16} className="text-cyber-cyan" /><span className="font-bold text-cyber-cyan">账号信息</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-cyber-muted">游戏</span><div className="font-medium mt-1">{mock.gameName}</div></div>
                <div><span className="text-cyber-muted">区服</span><div className="font-medium mt-1">{mock.server}</div></div>
                <div><span className="text-cyber-muted">UID</span><div className="font-mono mt-1">{mock.gameUid}</div></div>
                <div><span className="text-cyber-muted">等级</span><div className="font-medium mt-1">Lv.{mock.level}</div></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              <div className="glass-panel p-5 flex flex-col justify-center items-center">
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
              <div className="text-sm font-bold text-cyber-cyan mb-3">装备快照</div>
              <div className="space-y-2 mb-4">
                {mock.equipmentSnapshot.map((eq) => (
                  <div key={eq.id} className="flex items-center gap-3 p-2 rounded bg-cyber-bg/50">
                    <span className={`badge-rarity-${eq.rarity} text-xs px-2 py-0.5 rounded border`}>{rarityLabel[eq.rarity]}</span>
                    <span className="text-sm font-medium flex-1">{eq.name}</span>
                    <span className="text-xs text-cyber-muted">{eq.type} Lv.{eq.level}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-cyber-muted">快照哈希</span>
                <span className="font-mono text-cyber-muted bg-cyber-bg px-3 py-1.5 rounded flex-1 truncate">{mock.snapshotHash}</span>
                <button onClick={() => copyText(mock.snapshotHash, "snap")} className="text-cyber-cyan hover:text-cyber-green transition-colors">
                  {copied === "snap" ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div className="glass-panel p-5">
              <div className="text-sm font-bold text-cyber-cyan mb-3">链上凭证</div>
              <div className="space-y-3">
                {[
                  { label: "快照哈希", value: mock.snapshotHash, key: "snap2" },
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
              <button className="btn-cyber w-full py-2.5 mt-4 text-sm font-bold" onClick={() => setFlow({ valuationStep: "confirmed", chainConfirmed: true })}>
                <Shield size={14} className="inline mr-1.5" />确认链上存证
              </button>
            </div>
          </motion.div>
        )}

        {flow.valuationStep === "confirmed" && (
          <motion.div key="confirmed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-8 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-cyber-green/20 border-2 border-cyber-green flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-cyber-green" />
            </div>
            <div className="neon-text-green font-bold text-xl mb-3">链上存证已确认</div>
            <div className="space-y-2 text-sm text-cyber-muted mb-5">
              <div>区块高度: <span className="font-mono text-cyber-cyan">#18,429,571</span></div>
              <div>交易哈希: <span className="font-mono text-cyber-cyan">{mock.chainTxHash}</span></div>
              <div>确认时间: <span className="font-mono text-cyber-cyan">{new Date().toLocaleString("zh-CN")}</span></div>
            </div>
            <button className="btn-cyber px-6 py-2" onClick={() => resetFlow("valuation")}>
              <ArrowLeft size={14} className="inline mr-1.5" />返回
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
