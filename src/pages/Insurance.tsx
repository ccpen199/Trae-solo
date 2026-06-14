import { useState } from "react"
import { motion } from "framer-motion"
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Zap } from "lucide-react"
import { mockInsuranceClaims, mockAccounts } from "@/data/mockData"

const statusCfg: Record<string, { color: string; label: string; bg: string }> = {
  active: { color: "text-cyber-green", label: "生效中", bg: "bg-cyber-green/20" },
  breached: { color: "text-cyber-red", label: "已违约", bg: "bg-cyber-red/20" },
  claimed: { color: "text-orange-400", label: "已理赔", bg: "bg-orange-400/20" },
}

const timeline = [
  { key: "生效", icon: CheckCircle, activeColor: "text-cyber-green" },
  { key: "履约中", icon: Clock, activeColor: "text-cyber-cyan" },
  { key: "异常告警", icon: AlertTriangle, activeColor: "text-cyber-red" },
  { key: "理赔触发", icon: Zap, activeColor: "text-orange-400" },
  { key: "赔付完成", icon: CheckCircle, activeColor: "text-cyber-green" },
]

function getActiveStep(status: string): number {
  if (status === "active") return 1
  if (status === "breached") return 2
  return 4
}

export default function Insurance() {
  const [selectedPolicy, setSelectedPolicy] = useState("")
  const [description, setDescription] = useState("")

  const getAccount = (accId: string) => mockAccounts.find((a) => a.id === accId)

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-cyber-red mb-4">
          <Shield size={18} /><span className="font-bold">保单列表</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockInsuranceClaims.map((claim) => {
            const acc = getAccount(claim.accountId)
            const cfg = statusCfg[claim.contractStatus]
            return (
              <motion.div key={claim.id} className="card-cyber" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-cyber-muted">{claim.policyId}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                </div>
                <div className="text-sm font-medium mb-1">{acc?.gameName || "未知"}</div>
                <div className="flex items-center justify-between">
                  <span className="font-orbitron text-lg text-cyber-cyan">¥{claim.claimAmount.toLocaleString()}</span>
                  {claim.contractStatus === "active" && (
                    <span className="flex items-center gap-1 text-xs text-cyber-green">
                      <Shield size={12} className="animate-pulse" />保障中
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 text-cyber-cyan mb-4">
          <FileText size={16} /><span className="font-bold">提交理赔</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select className="bg-cyber-panel border border-cyber-border rounded px-3 py-2 text-sm" value={selectedPolicy} onChange={(e) => setSelectedPolicy(e.target.value)}>
            <option value="">选择保单</option>
            {mockInsuranceClaims.map((c) => <option key={c.id} value={c.id}>{c.policyId} - {getAccount(c.accountId)?.gameName}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input type="file" className="text-xs text-cyber-muted file:btn-cyber file:text-xs file:mr-2 file:py-1 file:px-3" />
          </div>
          <textarea className="bg-cyber-panel border border-cyber-border rounded px-3 py-2 text-sm resize-none" rows={1} placeholder="理赔描述" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <button className="btn-cyber mt-4 text-sm">提交理赔</button>
      </div>

      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 text-cyber-purple mb-5">
          <Zap size={16} /><span className="font-bold">合约合规监控</span>
        </div>
        {mockInsuranceClaims.map((claim) => {
          const activeStep = getActiveStep(claim.contractStatus)
          return (
            <div key={claim.id} className="mb-6 last:mb-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium">{claim.policyId}</span>
                {claim.autoTriggered && (
                  <span className="text-xs px-2 py-0.5 rounded bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30">系统自动触发</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {timeline.map((step, i) => {
                  const isActive = i <= activeStep
                  const isCurrent = i === activeStep
                  return (
                    <div key={step.key} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${isActive ? `border-current ${step.activeColor} ${isCurrent ? "animate-pulse" : ""}` : "border-cyber-border text-cyber-border"}`}>
                          <step.icon size={14} />
                        </div>
                        <span className={`text-xs mt-1 ${isActive ? step.activeColor : "text-cyber-border"}`}>{step.key}</span>
                      </div>
                      {i < timeline.length - 1 && (
                        <div className={`h-0.5 flex-1 -mt-4 ${i < activeStep ? "bg-cyber-green" : "bg-cyber-border"}`} />
                      )}
                    </div>
                  )
                })}
              </div>
              {(claim.contractStatus === "breached" || claim.contractStatus === "claimed") && claim.triggeredAt && (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <AlertTriangle size={12} className={claim.contractStatus === "breached" ? "text-cyber-red" : "text-orange-400"} />
                  <span className={claim.contractStatus === "breached" ? "text-cyber-red" : "text-orange-400"}>
                    {claim.contractStatus === "breached" ? "违约告警" : "理赔已触发"} · {new Date(claim.triggeredAt).toLocaleString("zh-CN")}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
