import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Zap, ArrowLeft } from "lucide-react"
import { mockInsuranceClaims, mockAccounts } from "@/data/mockData"
import { useAppStore } from "@/store/useAppStore"

const statusCfg: Record<string, { color: string; label: string; bg: string }> = {
  active: { color: "text-cyber-green", label: "生效中", bg: "bg-cyber-green/20" },
  breached: { color: "text-cyber-red", label: "已违约", bg: "bg-cyber-red/20" },
  claimed: { color: "text-orange-400", label: "已理赔", bg: "bg-orange-400/20" },
}

const timeline = [
  { key: "合同生效", icon: CheckCircle, activeColor: "text-cyber-green" },
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

const getAccount = (accId: string) => mockAccounts.find((a) => a.id === accId)

export default function Insurance() {
  const { flow, setFlow, resetFlow } = useAppStore()
  const [description, setDescription] = useState("")
  const [selectedPolicy, setSelectedPolicy] = useState("")

  const selectedClaim = flow.claimPolicyId ? mockInsuranceClaims.find((c) => c.policyId === flow.claimPolicyId) : null

  const handleApply = () => {
    if (!selectedPolicy) return
    const claim = mockInsuranceClaims.find((c) => c.id === selectedPolicy)
    setFlow({ claimStep: "apply", claimPolicyId: claim?.policyId ?? null })
  }

  const handleSubmitClaim = () => {
    setFlow({ claimStep: "verifying", claimDescription: description })
    setTimeout(() => setFlow({ claimStep: "approved" }), 2000)
  }

  const handleApprove = () => {
    setFlow({ claimStep: "paid" })
  }

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {flow.claimStep === "view" && (
        <>
          <div>
            <div className="flex items-center gap-2 text-cyber-red mb-4">
              <Shield size={18} /><span className="font-bold text-lg">保单列表</span>
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
                    {claim.autoTriggered && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-xs px-2 py-0.5 rounded bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30">系统自动触发</span>
                        {claim.triggeredAt && <span className="text-xs text-cyber-muted">{new Date(claim.triggeredAt).toLocaleString("zh-CN")}</span>}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>

          <div className="glass-panel p-5">
            <div className="flex items-center gap-2 text-cyber-purple mb-5">
              <Zap size={16} /><span className="font-bold text-lg">合约合规监控</span>
            </div>
            {mockInsuranceClaims.map((claim) => {
              const activeStep = getActiveStep(claim.contractStatus)
              return (
                <div key={claim.id} className="mb-8 last:mb-0">
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
                  <div className="mt-3 glass-panel p-3">
                    <div className="text-xs font-bold text-cyber-muted mb-2">理赔触发记录</div>
                    {claim.autoTriggered && claim.triggeredAt ? (
                      <div className="flex items-center gap-2 text-xs">
                        <Zap size={10} className="text-cyber-cyan" />
                        <span className="text-cyber-cyan">系统自动触发</span>
                        <span className="text-cyber-muted">{new Date(claim.triggeredAt).toLocaleString("zh-CN")}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-cyber-muted">暂无触发记录</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="glass-panel p-5">
            <div className="flex items-center gap-2 text-cyber-cyan mb-4">
              <FileText size={16} /><span className="font-bold text-lg">提交理赔</span>
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
            <button className="btn-cyber mt-4 text-sm" onClick={handleApply}>申请理赔</button>
          </div>
        </>
      )}

      <AnimatePresence mode="wait">
        {flow.claimStep === "apply" && selectedClaim && (
          <motion.div key="apply" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="glass-panel p-6 max-w-lg mx-auto">
            <div className="flex items-center gap-2 text-cyber-cyan mb-5">
              <FileText size={18} /><span className="font-bold text-lg">理赔申请</span>
            </div>
            <div className="glass-panel p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-cyber-muted">保单号</span><span className="font-mono">{selectedClaim.policyId}</span></div>
              <div className="flex justify-between"><span className="text-cyber-muted">游戏</span><span>{getAccount(selectedClaim.accountId)?.gameName}</span></div>
              <div className="flex justify-between"><span className="text-cyber-muted">保额</span><span className="font-orbitron text-cyber-cyan">¥{selectedClaim.claimAmount.toLocaleString()}</span></div>
            </div>
            <textarea className="w-full bg-cyber-panel border border-cyber-border rounded px-3 py-2.5 text-sm mb-4 resize-none h-24" placeholder="详细描述理赔原因..." value={description} onChange={(e) => setDescription(e.target.value)} />
            <input type="file" className="w-full text-xs text-cyber-muted file:btn-cyber file:text-xs file:mr-2 file:py-1 file:px-3 mb-4" />
            <button className="btn-cyber w-full py-2.5 font-bold" onClick={handleSubmitClaim}>提交理赔</button>
          </motion.div>
        )}

        {flow.claimStep === "verifying" && (
          <motion.div key="verifying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-panel p-10 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin mx-auto mb-5" />
            <div className="neon-text font-bold text-lg mb-2">正在验证合同履约状态...</div>
            <div className="text-cyber-muted text-sm">请稍候，系统正在核验保单信息</div>
          </motion.div>
        )}

        {flow.claimStep === "approved" && selectedClaim && (
          <motion.div key="approved" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-cyber-green/20 border-2 border-cyber-green flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-cyber-green" />
            </div>
            <div className="neon-text-green font-bold text-xl mb-3">理赔已通过</div>
            <div className="glass-panel p-4 mb-5 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-cyber-muted">保单号</span><span className="font-mono">{selectedClaim.policyId}</span></div>
              <div className="flex justify-between"><span className="text-cyber-muted">赔付金额</span><span className="font-orbitron text-cyber-cyan text-lg">¥{selectedClaim.claimAmount.toLocaleString()}</span></div>
            </div>
            <button className="btn-cyber w-full py-2.5 font-bold" onClick={handleApprove}>确认赔付</button>
          </motion.div>
        )}

        {flow.claimStep === "paid" && selectedClaim && (
          <motion.div key="paid" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-8 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-cyber-green/20 border-2 border-cyber-green flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-cyber-green" />
            </div>
            <div className="neon-text-green font-bold text-xl mb-3">赔付已完成</div>
            <div className="font-orbitron text-4xl font-bold text-cyber-cyan mb-2">¥{selectedClaim.claimAmount.toLocaleString()}</div>
            <div className="space-y-1 text-sm text-cyber-muted mb-5">
              <div>保单号: <span className="font-mono text-cyber-cyan">{selectedClaim.policyId}</span></div>
              <div>赔付时间: <span className="font-mono text-cyber-cyan">{new Date().toLocaleString("zh-CN")}</span></div>
            </div>
            <button className="btn-cyber px-6 py-2" onClick={() => { resetFlow("claim"); setDescription(""); setSelectedPolicy("") }}>
              <ArrowLeft size={14} className="inline mr-1.5" />返回
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
