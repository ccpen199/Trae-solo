import { useState } from "react"
import { motion } from "framer-motion"
import { Shield, AlertTriangle, Users, Bug, Download, Gavel, FileText, Eye } from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { mockTradeOrders, mockAccounts } from "@/data/mockData"
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

export default function Admin() {
  const [tab, setTab] = useState<number>(0)
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

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mb-6">
        <h1 className="font-orbitron text-2xl font-bold neon-text">运营后台</h1>
        <p className="text-sm text-cyber-muted mt-1">后台管理控制台，覆盖反作弊、合规审计和仲裁处理</p>
      </div>
      <div className="flex gap-2 mb-6">
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-5 py-2 rounded-lg font-bold transition-all ${
              tab === i ? "btn-cyber" : "bg-cyber-panel text-cyber-muted hover:bg-cyber-hover"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

          <div className="card-cyber p-4 mb-6 overflow-x-auto">
            <h3 className="neon-text text-sm font-bold mb-3">风险告警</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-cyber-muted border-b border-cyber-border">
                  <th className="text-left py-2 px-2">时间</th>
                  <th className="text-left py-2 px-2">类型</th>
                  <th className="text-left py-2 px-2">严重等级</th>
                  <th className="text-left py-2 px-2">账号</th>
                  <th className="text-left py-2 px-2">描述</th>
                  <th className="text-left py-2 px-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {riskAlerts.map((r) => (
                  <tr key={r.id} className="border-b border-cyber-border/50 hover:bg-cyber-hover/30">
                    <td className="py-2 px-2 text-cyber-muted whitespace-nowrap">{new Date(r.timestamp).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="py-2 px-2">{typeLabels[r.type]}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${severityColors[r.severity]} ${r.severity === "critical" ? "animate-pulse" : ""}`}>
                        {r.severity === "low" ? "低危" : r.severity === "medium" ? "中危" : r.severity === "high" ? "高危" : "严重"}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-mono text-xs">{accountsMap[r.accountId]?.gameUid ?? r.accountId}</td>
                    <td className="py-2 px-2 text-cyber-muted max-w-[200px] truncate">{r.description}</td>
                    <td className="py-2 px-2">
                      <button className="btn-cyber px-2 py-1 text-xs">处理</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card-cyber p-4">
              <h3 className="neon-text text-sm font-bold mb-3">严重等级分布</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}:${value}`}>
                    {severityData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card-cyber p-4">
              <h3 className="neon-text text-sm font-bold mb-3">告警类型分布</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {tab === 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="neon-text font-bold">三流合一审计</h3>
            <button className="btn-cyber flex items-center gap-2 px-4 py-2">
              <Download size={16} /> 导出审计报告
            </button>
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
                      <motion.div
                        key={i}
                        className={`relative mb-4 ${isCross ? "ring-1 ring-cyber-gold/50 rounded-lg p-2 bg-cyber-gold/5" : ""}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                      >
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
        </motion.div>
      )}

      {tab === 2 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="neon-text font-bold mb-4">仲裁管理</h3>
          <div className="space-y-4">
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
                    <div className="flex items-center gap-2 text-xs text-cyber-muted">
                      <FileText size={14} /> 买家:{d.buyerId} / 卖家:{d.sellerId}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-cyber flex items-center gap-1 px-3 py-1.5 text-sm">
                      <Eye size={14} /> 审查证据
                    </button>
                    <button className="btn-cyber-danger flex items-center gap-1 px-3 py-1.5 text-sm">
                      <Gavel size={14} /> 裁决
                    </button>
                  </div>
                </div>
              )
            })}
            {disputes.length === 0 && (
              <div className="card-cyber p-8 text-center text-cyber-muted">暂无争议订单</div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
