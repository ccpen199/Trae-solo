import { useState } from "react"
import { motion } from "framer-motion"
import { Shield, AlertTriangle, Users, Bug, Download, Gavel, FileText, Eye, Network, Activity, CheckCircle, X } from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { mockTradeOrders, mockAccounts, mockRecycleBids, mockInsuranceClaims } from "@/data/mockData"
import { useAppStore } from "@/store/useAppStore"

const tabs = ["反作弊看板", "合规审计", "仲裁管理"] as const

const severityColors: Record<string, string> = {
  low: "bg-green-500/20 text-green-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  high: "bg-orange-500/20 text-orange-400",
  critical: "bg-red-500/20 text-red-400",
}

const severityChartColors: Record<string, string> = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
}

const typeLabels: Record<string, string> = {
  device_change: "设备变更",
  behavior_anomaly: "行为异常",
  remote_login: "异地登录",
  cluster_anomaly: "异常聚集",
  brush_order: "刷单嫌疑",
}

const clusters = [
  { id: "CL-001", accounts: 5, ip: "114.88.xxx.xxx", risk: "high", game: "原神", time: "2025-06-05 08:45" },
  { id: "CL-002", accounts: 3, ip: "61.149.xxx.xxx", risk: "medium", game: "DNF手游", time: "2025-06-06 14:20" },
  { id: "CL-003", accounts: 8, ip: "223.104.xxx.xxx", risk: "critical", game: "王者荣耀", time: "2025-06-08 09:00" },
]

const riskColor: Record<string, string> = {
  critical: "border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.3)]",
  high: "border-orange-500/50 shadow-[0_0_12px_rgba(249,115,22,0.3)]",
  medium: "border-yellow-500/50 shadow-[0_0_12px_rgba(234,179,8,0.3)]",
}

const riskBadge: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 animate-pulse",
  high: "bg-orange-500/20 text-orange-400",
  medium: "bg-yellow-500/20 text-yellow-400",
}

const buyerNodes = [
  { id: "user-B1", tx: 1 }, { id: "user-B2", tx: 1 }, { id: "user-B3", tx: 1 },
  { id: "user-B4", tx: 2 }, { id: "user-B5", tx: 1 }, { id: "user-B6", tx: 1 }, { id: "user-B7", tx: 1 },
]

const moneyFlow = [
  { ts: "2025-06-07 10:00", amount: "+1680", desc: "买家支付托管" },
  { ts: "2025-06-07 10:05", amount: "-1680", desc: "冻结至合约" },
  { ts: "2025-06-07 14:30", amount: "+500", desc: "押金冻结" },
  { ts: "2025-06-07 16:00", amount: "+2580", desc: "交易完成释放" },
  { ts: "2025-06-08 09:00", amount: "-500", desc: "押金退还" },
  { ts: "2025-06-08 14:00", amount: "+3680", desc: "新交易托管" },
]

const accountFlow = [
  { ts: "2025-06-07 10:00", desc: "卖家→平台托管" },
  { ts: "2025-06-07 10:05", desc: "权限锁定" },
  { ts: "2025-06-07 14:30", desc: "买家开始租用" },
  { ts: "2025-06-07 16:00", desc: "异常行为检测" },
  { ts: "2025-06-08 09:00", desc: "租用结束归还" },
  { ts: "2025-06-08 14:00", desc: "账号转入买家" },
]

const contractFlow = [
  { ts: "2025-06-07 10:00", desc: "合约创建", status: "创建" },
  { ts: "2025-06-07 10:05", desc: "双方签署", status: "签署" },
  { ts: "2025-06-07 14:30", desc: "托管生效", status: "托管" },
  { ts: "2025-06-07 16:00", desc: "争议标记", status: "争议" },
  { ts: "2025-06-08 09:00", desc: "合约解除", status: "解除" },
  { ts: "2025-06-08 14:00", desc: "新合约签署", status: "签署" },
]

const crossRefs = ["2025-06-07 10:00", "2025-06-07 16:00", "2025-06-08 14:00"]

const mockEvidence = [
  { ts: "2025-06-06 22:15", desc: "设备指纹变更截图" },
  { ts: "2025-06-06 22:20", desc: "异常登录IP记录" },
  { ts: "2025-06-07 10:00", desc: "交易聊天记录" },
]

const moneyFlowDetail = [
  { id: "MF-001", ts: "2025-06-07 10:00:12", from: "买家 user-3821", to: "平台托管", amount: 1680, type: "托管冻结", status: "frozen", txHash: "0x3a7f...c8d2" },
  { id: "MF-002", ts: "2025-06-07 10:05:33", from: "平台托管", to: "合约锁定", amount: 1680, type: "合约锁定", status: "frozen", txHash: "0x4b2e...1f9a" },
  { id: "MF-003", ts: "2025-06-07 14:30:08", from: "买家 user-3821", to: "押金托管", amount: 500, type: "押金", status: "frozen", txHash: "0x5c1d...7e3b" },
  { id: "MF-004", ts: "2025-06-07 16:00:45", from: "合约锁定", to: "卖家 user-1094", amount: 1680, type: "资金释放", status: "released", txHash: "0x6d0c...2a4f" },
  { id: "MF-005", ts: "2025-06-08 09:00:22", from: "押金托管", to: "买家 user-3821", amount: 500, type: "押金退还", status: "refunded", txHash: "0x7e9b...8d5c" },
  { id: "MF-006", ts: "2025-06-08 14:00:18", from: "买家 user-5567", to: "平台托管", amount: 3680, type: "托管冻结", status: "frozen", txHash: "0x8f8a...3b6e" },
  { id: "MF-007", ts: "2025-06-08 15:20:55", from: "合约锁定", to: "买家 user-5567", amount: 3680, type: "争议退还", status: "refunded", txHash: "0x9a7d...4c1f" },
]

const accountTransferLog = [
  { id: "AT-001", ts: "2025-06-07 10:00:00", accountId: "GS-001", gameUid: "88001234", from: "卖家 user-1094", to: "平台托管", action: "托管锁定", status: "locked" },
  { id: "AT-002", ts: "2025-06-07 10:05:00", accountId: "GS-001", gameUid: "88001234", from: "平台托管", to: "平台托管", action: "权限锁定", status: "locked" },
  { id: "AT-003", ts: "2025-06-07 14:30:00", accountId: "GS-001", gameUid: "88001234", from: "平台托管", to: "买家 user-3821", action: "租用授权", status: "rented" },
  { id: "AT-004", ts: "2025-06-08 09:00:00", accountId: "GS-001", gameUid: "88001234", from: "买家 user-3821", to: "卖家 user-1094", action: "租用归还", status: "returned" },
  { id: "AT-005", ts: "2025-06-08 14:00:00", accountId: "GS-003", gameUid: "66004567", from: "卖家 user-2208", to: "平台托管", action: "买卖托管", status: "locked" },
  { id: "AT-006", ts: "2025-06-08 16:30:00", accountId: "GS-003", gameUid: "66004567", from: "平台托管", to: "买家 user-5567", action: "过户完成", status: "transferred" },
]

const contractSignLog = [
  { id: "CT-001", ts: "2025-06-07 10:00:05", orderId: "TO-2025-001", action: "合约创建", signer: "系统", hash: "0xa1b2...c3d4" },
  { id: "CT-002", ts: "2025-06-07 10:02:18", orderId: "TO-2025-001", action: "卖方签署", signer: "user-1094", hash: "0xe5f6...g7h8" },
  { id: "CT-003", ts: "2025-06-07 10:04:33", orderId: "TO-2025-001", action: "买方签署", signer: "user-3821", hash: "0xi9j0...k1l2" },
  { id: "CT-004", ts: "2025-06-07 16:00:40", orderId: "TO-2025-001", action: "合约履约完成", signer: "系统", hash: "0xm3n4...o5p6" },
  { id: "CT-005", ts: "2025-06-08 14:00:05", orderId: "TO-2025-002", action: "合约创建", signer: "系统", hash: "0xq7r8...s9t0" },
  { id: "CT-006", ts: "2025-06-08 14:03:22", orderId: "TO-2025-002", action: "争议标记", signer: "user-5567", hash: "0xu1v2...w3x4" },
  { id: "CT-007", ts: "2025-06-08 15:20:50", orderId: "TO-2025-002", action: "合约解除-仲裁", signer: "仲裁员-01", hash: "0xy5z6...a7b8" },
]

const statusConfig: Record<string, { label: string; cls: string }> = {
  frozen: { label: "❄ 冻结", cls: "text-blue-400 bg-blue-400/10" },
  released: { label: "✓ 释放", cls: "text-cyber-green bg-cyber-green/10" },
  refunded: { label: "↩ 退还", cls: "text-cyber-gold bg-cyber-gold/10" },
  locked: { label: "🔒 锁定", cls: "text-blue-400 bg-blue-400/10" },
  rented: { label: "🎮 租用", cls: "text-cyber-cyan bg-cyber-cyan/10" },
  returned: { label: "↩ 归还", cls: "text-cyber-gold bg-cyber-gold/10" },
  transferred: { label: "✓ 过户", cls: "text-cyber-green bg-cyber-green/10" },
}

export default function Admin() {
  const [tab, setTab] = useState<number>(0)
  const [arbitrationModal, setArbitrationModal] = useState<string | null>(null)
  const [verdict, setVerdict] = useState<string>("")
  const [toast, setToast] = useState(false)
  const { riskAlerts } = useAppStore()

  const disputes = mockTradeOrders.filter((o) => o.disputeStatus)
  const accountsMap = Object.fromEntries(mockAccounts.map((a) => [a.id, a]))

  const totalAlerts = riskAlerts.length
  const highAlerts = riskAlerts.filter((r) => r.severity === "high" || r.severity === "critical").length
  const brushCount = riskAlerts.filter((r) => r.type === "brush_order").length
  const clusterCount = riskAlerts.filter((r) => r.type === "cluster_anomaly").length

  const severityData = ["low", "medium", "high", "critical"].map((s) => ({
    name: s === "low" ? "低危" : s === "medium" ? "中危" : s === "high" ? "高危" : "严重",
    value: riskAlerts.filter((r) => r.severity === s).length,
    color: severityChartColors[s],
  }))

  const typeData = Object.entries(typeLabels).map(([key, label]) => ({
    name: label,
    count: riskAlerts.filter((r) => r.type === key).length,
  }))

  const statCards = [
    { icon: AlertTriangle, label: "总告警数", value: totalAlerts, color: "text-cyber-cyan" },
    { icon: Shield, label: "高危告警", value: highAlerts, color: "text-cyber-red" },
    { icon: Bug, label: "刷单嫌疑", value: brushCount, color: "text-cyber-gold" },
    { icon: Users, label: "异常聚集", value: clusterCount, color: "text-cyber-purple" },
  ]

  const autoClaims = mockInsuranceClaims.filter((c) => c.autoTriggered)
  const recycleBids = mockRecycleBids

  const handleVerdict = () => {
    setArbitrationModal(null)
    setVerdict("")
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  return (
    <div className="min-h-screen p-4 md:p-6 relative">
      {toast && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="fixed top-4 right-4 z-50 glass-panel p-3 flex items-center gap-2 text-cyber-green border border-cyber-green/30">
          <CheckCircle className="w-5 h-5" /> 裁决已提交
        </motion.div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold neon-text">运营后台 · 后台管理中心</h1>
        <p className="mt-2 text-sm text-cyber-muted">
          管理端数据概览，覆盖订单管理、用户管理、风险告警、合规审计和仲裁管理。
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} className={`px-5 py-2 rounded-lg font-bold transition-all ${tab === i ? "btn-cyber" : "bg-cyber-panel text-cyber-muted hover:bg-cyber-hover"}`}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((c) => (
              <div key={c.label} className="card-cyber p-4 flex items-center gap-3">
                <c.icon className={`w-8 h-8 ${c.color}`} />
                <div>
                  <div className="text-cyber-muted text-sm">{c.label}</div>
                  <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card-cyber p-4 overflow-x-auto">
            <h3 className="neon-text text-sm font-bold mb-3">风险告警</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-cyber-muted border-b border-cyber-border">
                  <th className="text-left py-2 px-2">时间</th><th className="text-left py-2 px-2">类型</th><th className="text-left py-2 px-2">严重等级</th><th className="text-left py-2 px-2">账号</th><th className="text-left py-2 px-2">描述</th><th className="text-left py-2 px-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {riskAlerts.map((r) => (
                  <tr key={r.id} className="border-b border-cyber-border/50 hover:bg-cyber-hover/30">
                    <td className="py-2 px-2 text-cyber-muted whitespace-nowrap">{new Date(r.timestamp).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="py-2 px-2">{typeLabels[r.type]}</td>
                    <td className="py-2 px-2"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${severityColors[r.severity]} ${r.severity === "critical" ? "animate-pulse" : ""}`}>{r.severity === "low" ? "低危" : r.severity === "medium" ? "中危" : r.severity === "high" ? "高危" : "严重"}</span></td>
                    <td className="py-2 px-2 font-mono text-xs">{accountsMap[r.accountId]?.gameUid ?? r.accountId}</td>
                    <td className="py-2 px-2 text-cyber-muted max-w-[200px] truncate">{r.description}</td>
                    <td className="py-2 px-2"><button className="btn-cyber px-2 py-1 text-xs">处理</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card-cyber p-4">
              <h3 className="neon-text text-sm font-bold mb-3">严重等级分布</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}:${value}`}>{severityData.map((d, i) => <Cell key={i} fill={d.color} />)}</Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card-cyber p-4">
              <h3 className="neon-text text-sm font-bold mb-3">告警类型分布</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={typeData}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" /><XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} /><YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} /><Tooltip /><Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="neon-text text-sm font-bold mb-3 flex items-center gap-2"><Network className="w-4 h-4" /> 异常账号聚集分析</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {clusters.map((cl) => (
                <div key={cl.id} className={`glass-panel p-4 border ${riskColor[cl.risk]} ${cl.risk === "critical" ? "animate-pulse" : ""}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm neon-text">{cl.id}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${riskBadge[cl.risk]}`}>{cl.risk === "critical" ? "严重" : cl.risk === "high" ? "高危" : "中危"}</span>
                  </div>
                  <div className="text-xs text-cyber-muted space-y-1">
                    <div>关联账号: <span className="text-white">{cl.accounts}个</span></div>
                    <div>共享IP: <span className="font-mono text-cyber-cyan">{cl.ip}</span></div>
                    <div>游戏: {cl.game}</div>
                    <div>检测时间: {cl.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-cyber p-4">
            <h3 className="neon-text text-sm font-bold mb-3 flex items-center gap-2"><Activity className="w-4 h-4" /> 刷单行为图谱</h3>
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="w-16 h-16 rounded-full bg-cyber-red/20 border-2 border-cyber-red flex items-center justify-center text-xs font-bold text-cyber-red animate-pulse">卖家A</div>
              <div className="text-xs text-cyber-red animate-pulse font-bold">3天内7笔交易</div>
              <div className="flex items-center justify-center gap-1 my-2">
                <div className="w-8 h-0.5 bg-cyber-border" />
                <div className="w-16 h-0.5 bg-gradient-to-r from-cyber-border via-cyber-red/50 to-cyber-border" />
                <div className="w-8 h-0.5 bg-cyber-border" />
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {buyerNodes.map((b) => (
                  <div key={b.id} className="flex flex-col items-center gap-1">
                    <div className="w-0.5 h-4 bg-cyber-border" />
                    <div className="w-12 h-12 rounded-full bg-cyber-panel border border-cyber-border flex items-center justify-center text-[10px] text-cyber-muted">{b.id.slice(-2)}</div>
                    <div className="text-[10px] text-cyber-muted">{b.tx}笔</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {tab === 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="neon-text font-bold">三流合一审计</h3>
            <button className="btn-cyber flex items-center gap-2 px-4 py-2"><Download size={16} /> 导出审计报告</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "资金流", data: moneyFlow, color: "bg-cyber-green", textColor: "text-cyber-green", renderExtra: (d: typeof moneyFlow[0]) => <span className="font-mono text-sm text-cyber-green">{d.amount}</span> },
              { title: "账号流", data: accountFlow, color: "bg-cyber-cyan", textColor: "text-cyber-cyan", renderExtra: () => null },
              { title: "合同流", data: contractFlow, color: "bg-cyber-purple", textColor: "text-cyber-purple", renderExtra: (d: typeof contractFlow[0]) => <span className={`text-xs ${d.status === "争议" ? "neon-text-red" : d.status === "签署" ? "neon-text-green" : "text-cyber-muted"}`}>{d.status}</span> },
            ].map((flow) => (
              <div key={flow.title} className="card-cyber p-4">
                <h4 className={`${flow.textColor} font-bold mb-4`}>{flow.title}</h4>
                <div className="relative pl-6">
                  <div className={`absolute left-2 top-0 bottom-0 w-0.5 ${flow.color}/30`} />
                  {flow.data.map((item: Record<string, unknown>, i: number) => {
                    const isCross = crossRefs.includes(item.ts as string)
                    return (
                      <motion.div key={i} className={`relative mb-4 ${isCross ? "ring-1 ring-cyber-gold/50 rounded-lg p-2 bg-cyber-gold/5" : ""}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                        <div className={`absolute -left-4 top-1.5 w-3 h-3 rounded-full ${flow.color} ${isCross ? "shadow-[0_0_8px_rgba(234,179,8,0.6)]" : ""}`} />
                        <div className="text-xs text-cyber-muted mb-0.5">{item.ts as string}</div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm">{String(item.desc)}</span>
                          {flow.renderExtra(item as never)}
                        </div>
                        {isCross && <div className="text-[10px] text-cyber-gold mt-1">⚡ 交叉关联点</div>}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="card-cyber p-4 overflow-x-auto">
            <h3 className="neon-text text-sm font-bold mb-3">回收商竞价权重</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-cyber-muted border-b border-cyber-border">
                  <th className="text-left py-2 px-2">回收商</th><th className="text-left py-2 px-2">出价</th><th className="text-left py-2 px-2">热度(30%)</th><th className="text-left py-2 px-2">估值(40%)</th><th className="text-left py-2 px-2">时效(30%)</th><th className="text-left py-2 px-2">综合权重</th>
                </tr>
              </thead>
              <tbody>
                {recycleBids.map((b) => {
                  const composite = (b.heatScore * 0.3 + b.valuationScore * 0.4 + b.timelinessScore * 0.3).toFixed(1)
                  return (
                    <tr key={b.id} className="border-b border-cyber-border/50 hover:bg-cyber-hover/30">
                      <td className="py-2 px-2">{b.recyclerName}</td>
                      <td className="py-2 px-2 neon-text-green font-mono">¥{b.bidAmount}</td>
                      {[
                        { v: b.heatScore, c: "bg-cyber-cyan" },
                        { v: b.valuationScore, c: "bg-cyber-purple" },
                        { v: b.timelinessScore, c: "bg-cyber-gold" },
                      ].map((w, i) => (
                        <td key={i} className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-cyber-border rounded-full overflow-hidden"><div className={`h-full ${w.c} rounded-full`} style={{ width: `${w.v}%` }} /></div>
                            <span className="text-xs font-mono">{w.v}</span>
                          </div>
                        </td>
                      ))}
                      <td className="py-2 px-2 font-bold neon-text font-mono">{composite}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="card-cyber p-4 overflow-x-auto">
            <h3 className="neon-text text-sm font-bold mb-3 flex items-center gap-2"><Activity className="w-4 h-4" /> 资金流水明细</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-cyber-muted border-b border-cyber-border">
                  <th className="text-left py-2 px-2">流水号</th><th className="text-left py-2 px-2">时间</th><th className="text-left py-2 px-2">类型</th><th className="text-left py-2 px-2">来源</th><th className="text-left py-2 px-2">去向</th><th className="text-left py-2 px-2">金额</th><th className="text-left py-2 px-2">状态</th><th className="text-left py-2 px-2">链上凭证</th>
                </tr>
              </thead>
              <tbody>
                {moneyFlowDetail.map((r) => {
                  const sc = statusConfig[r.status]
                  return (
                    <tr key={r.id} className="border-b border-cyber-border/50 hover:bg-cyber-hover/30">
                      <td className="py-2 px-2 font-mono text-xs">{r.id}</td>
                      <td className="py-2 px-2 text-cyber-muted text-xs whitespace-nowrap">{r.ts}</td>
                      <td className="py-2 px-2">{r.type}</td>
                      <td className="py-2 px-2 text-xs">{r.from}</td>
                      <td className="py-2 px-2 text-xs">{r.to}</td>
                      <td className="py-2 px-2 neon-text-green font-mono">¥{r.amount.toLocaleString()}</td>
                      <td className="py-2 px-2"><span className={`px-2 py-0.5 rounded text-xs ${sc?.cls ?? ""}`}>{sc?.label ?? r.status}</span></td>
                      <td className="py-2 px-2 font-mono text-[10px] text-cyber-cyan">{r.txHash}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="card-cyber p-4 overflow-x-auto">
            <h3 className="neon-text text-sm font-bold mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> 账号过户记录</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-cyber-muted border-b border-cyber-border">
                  <th className="text-left py-2 px-2">记录号</th><th className="text-left py-2 px-2">时间</th><th className="text-left py-2 px-2">账号ID</th><th className="text-left py-2 px-2">游戏UID</th><th className="text-left py-2 px-2">操作</th><th className="text-left py-2 px-2">来源</th><th className="text-left py-2 px-2">去向</th><th className="text-left py-2 px-2">状态</th>
                </tr>
              </thead>
              <tbody>
                {accountTransferLog.map((r) => {
                  const sc = statusConfig[r.status]
                  return (
                    <tr key={r.id} className="border-b border-cyber-border/50 hover:bg-cyber-hover/30">
                      <td className="py-2 px-2 font-mono text-xs">{r.id}</td>
                      <td className="py-2 px-2 text-cyber-muted text-xs whitespace-nowrap">{r.ts}</td>
                      <td className="py-2 px-2 font-mono text-xs">{r.accountId}</td>
                      <td className="py-2 px-2 font-mono text-xs text-cyber-cyan">{r.gameUid}</td>
                      <td className="py-2 px-2">{r.action}</td>
                      <td className="py-2 px-2 text-xs">{r.from}</td>
                      <td className="py-2 px-2 text-xs">{r.to}</td>
                      <td className="py-2 px-2"><span className={`px-2 py-0.5 rounded text-xs ${sc?.cls ?? ""}`}>{sc?.label ?? r.status}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="card-cyber p-4 overflow-x-auto">
            <h3 className="neon-text text-sm font-bold mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> 合同签署日志</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-cyber-muted border-b border-cyber-border">
                  <th className="text-left py-2 px-2">日志号</th><th className="text-left py-2 px-2">时间</th><th className="text-left py-2 px-2">订单号</th><th className="text-left py-2 px-2">操作</th><th className="text-left py-2 px-2">签署方</th><th className="text-left py-2 px-2">链上哈希</th>
                </tr>
              </thead>
              <tbody>
                {contractSignLog.map((r) => (
                  <tr key={r.id} className="border-b border-cyber-border/50 hover:bg-cyber-hover/30">
                    <td className="py-2 px-2 font-mono text-xs">{r.id}</td>
                    <td className="py-2 px-2 text-cyber-muted text-xs whitespace-nowrap">{r.ts}</td>
                    <td className="py-2 px-2 font-mono text-xs">{r.orderId}</td>
                    <td className="py-2 px-2">{r.action}</td>
                    <td className="py-2 px-2 text-xs">{r.signer}</td>
                    <td className="py-2 px-2 font-mono text-[10px] text-cyber-cyan">{r.hash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card-cyber p-4 overflow-x-auto">
            <h3 className="neon-text text-sm font-bold mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> 理赔触发记录</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-cyber-muted border-b border-cyber-border">
                  <th className="text-left py-2 px-2">保单ID</th><th className="text-left py-2 px-2">游戏账号</th><th className="text-left py-2 px-2">触发时间</th><th className="text-left py-2 px-2">触发类型</th><th className="text-left py-2 px-2">赔付金额</th><th className="text-left py-2 px-2">赔付状态</th>
                </tr>
              </thead>
              <tbody>
                {autoClaims.map((c) => (
                  <tr key={c.id} className="border-b border-cyber-border/50 hover:bg-cyber-hover/30">
                    <td className="py-2 px-2 font-mono text-xs">{c.policyId}</td>
                    <td className="py-2 px-2 font-mono text-xs">{accountsMap[c.accountId]?.gameUid ?? c.accountId}</td>
                    <td className="py-2 px-2 text-cyber-muted text-xs">{c.triggeredAt ? new Date(c.triggeredAt).toLocaleString("zh-CN") : "-"}</td>
                    <td className="py-2 px-2"><span className="px-2 py-0.5 rounded text-xs bg-cyber-cyan/20 text-cyber-cyan">自动</span></td>
                    <td className="py-2 px-2 neon-text-green font-mono">¥{c.claimAmount}</td>
                    <td className="py-2 px-2"><span className={`px-2 py-0.5 rounded text-xs font-bold ${c.claimStatus === "paid" ? "bg-cyber-green/20 text-cyber-green" : "bg-yellow-500/20 text-yellow-400"}`}>{c.claimStatus === "paid" ? "已赔付" : c.claimStatus === "approved" ? "已批准" : "待审核"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {tab === 2 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <h3 className="neon-text font-bold mb-4">仲裁管理</h3>
          {disputes.map((d) => {
            const acc = accountsMap[d.accountId]
            const statusCfg: Record<string, { label: string; cls: string }> = {
              pending: { label: "待处理", cls: "bg-yellow-500/20 text-yellow-400" },
              arbitrating: { label: "仲裁中", cls: "bg-cyber-cyan/20 text-cyber-cyan" },
              resolved: { label: "已裁决", cls: "bg-cyber-green/20 text-cyber-green" },
            }
            const s = statusCfg[d.disputeStatus ?? "pending"]
            return (
              <div key={d.id} className="card-cyber p-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm neon-text">{d.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.cls}`}>{s.label}</span>
                  </div>
                  <div className="text-sm text-cyber-muted">
                    {acc?.gameName ?? ""} · 金额 <span className="neon-text-green">¥{d.amount}</span> · 合约 <span className="text-cyber-muted font-mono text-xs">{d.contractHash.slice(0, 18)}…</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-cyber-muted"><FileText size={14} /> 买家:{d.buyerId} / 卖家:{d.sellerId}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-cyber flex items-center gap-1 px-3 py-1.5 text-sm"><Eye size={14} /> 审查证据</button>
                  <button onClick={() => { setArbitrationModal(d.id); setVerdict("") }} className="btn-cyber-danger flex items-center gap-1 px-3 py-1.5 text-sm"><Gavel size={14} /> 裁决</button>
                </div>
              </div>
            )
          })}
          {disputes.length === 0 && <div className="card-cyber p-8 text-center text-cyber-muted">暂无争议订单</div>}

          {arbitrationModal && (
            <motion.div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setArbitrationModal(null)}>
              <motion.div className="glass-panel glow-border p-6 rounded-xl max-w-md w-full mx-4 relative" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setArbitrationModal(null)} className="absolute top-3 right-3 text-cyber-muted hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
                <h3 className="font-orbitron text-lg text-white mb-4">裁决 - {arbitrationModal}</h3>
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm text-cyber-muted font-bold">证据审查</h4>
                  {mockEvidence.map((e, i) => (
                    <div key={i} className="flex gap-2 text-xs"><span className="text-cyber-muted shrink-0">{e.ts}</span><span>{e.desc}</span></div>
                  ))}
                </div>
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm text-cyber-muted font-bold">裁决选项</h4>
                  {[
                    { val: "buyer", label: "支持买家(退款)", cls: "border-cyber-cyan text-cyber-cyan" },
                    { val: "seller", label: "支持卖家(放款)", cls: "border-cyber-green text-cyber-green" },
                    { val: "partial", label: "部分退款", cls: "border-cyber-gold text-cyber-gold" },
                  ].map((v) => (
                    <button key={v.val} onClick={() => setVerdict(v.val)} className={`w-full p-2 rounded border text-sm transition-all cursor-pointer ${verdict === v.val ? `${v.cls} bg-opacity-20` : "border-cyber-border text-cyber-muted hover:bg-cyber-hover"}`}>{v.label}</button>
                  ))}
                </div>
                <button onClick={handleVerdict} disabled={!verdict} className="btn-cyber w-full py-2 disabled:opacity-30 disabled:cursor-not-allowed">提交裁决</button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}
