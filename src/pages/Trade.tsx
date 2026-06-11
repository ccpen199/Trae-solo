import { useState, useEffect, useCallback } from "react"
import { ShoppingCart, Tag, ClipboardList, FileText, AlertTriangle, Plus, X, CheckCircle, Lock, Gavel, Stamp, Clock, Shield, ArrowLeft } from "lucide-react"
import { mockAccounts, mockTradeOrders, gameList, serverList } from "@/data/mockData"
import { useAppStore } from "@/store/useAppStore"

const stepLabels = ["下单", "合同签署", "资金托管", "过户确认", "资金释放", "完成"]
const stepKeys = ["order", "contract", "escrow", "transfer", "release", "done"] as const

const contractStatusCfg: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-yellow-500/20 text-yellow-400", label: "待签署" },
  signed: { color: "bg-cyber-cyan/20 text-cyber-cyan", label: "已签署" },
  escrow_frozen: { color: "bg-blue-500/20 text-blue-400", label: "资金冻结" },
  releasing: { color: "bg-cyber-green/20 text-cyber-green", label: "释放中" },
  completed: { color: "bg-cyber-green/20 text-cyber-green", label: "已完成" },
  disputed: { color: "bg-cyber-red/20 text-cyber-red", label: "争议中" },
}

type Tab = "buy" | "sell" | "orders"

interface DisputeEvent {
  time: string
  type: "submit" | "evidence" | "arbitrate_start" | "arbitrate_result" | "fund_action"
  title: string
  detail: string
}

interface FundRecord {
  time: string
  action: string
  amount: number
  status: "frozen" | "released" | "refunded"
}

export default function Trade() {
  const { flow, setFlow, resetFlow, accounts } = useAppStore()
  const [tab, setTab] = useState<Tab>("buy")
  const [loading, setLoading] = useState(false)
  const [stamped, setStamped] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [disputeInput, setDisputeInput] = useState("")

  const [disputeEvents, setDisputeEvents] = useState<DisputeEvent[]>([])
  const [fundRecords, setFundRecords] = useState<FundRecord[]>([])

  const [sellToast, setSellToast] = useState(false)
  const [sellSnapHash, setSellSnapHash] = useState("")
  const [sellChainHash, setSellChainHash] = useState("")
  const [sellGame, setSellGame] = useState("")
  const [sellServer, setSellServer] = useState("")
  const [sellUid, setSellUid] = useState("")
  const [sellLevel, setSellLevel] = useState("")
  const [sellPrice, setSellPrice] = useState("")
  const [sellEquipList, setSellEquipList] = useState<{ name: string; rarity: string; type: string }[]>([])
  const [newEq, setNewEq] = useState({ name: "", rarity: "rare", type: "" })

  const sellingAccounts = mockAccounts.filter((a) => a.status === "selling" || a.status === "available")
  const selectedAccount = flow.tradeAccountId ? mockAccounts.find((a) => a.id === flow.tradeAccountId) : null
  const stepIdx = stepKeys.indexOf(flow.tradeStep as typeof stepKeys[number])
  const autoValuation = sellPrice ? Math.round(+sellPrice * 0.9 + Math.random() * 200) : 0

  const now = () => new Date().toLocaleTimeString("zh-CN")

  useEffect(() => {
    if (flow.tradeStep === "release") {
      const t = setTimeout(() => {
        setFlow({ tradeStep: "done", fundsReleased: true })
        setFundRecords((prev) => [...prev, { time: now(), action: "资金释放至卖方", amount: selectedAccount?.price ?? 0, status: "released" }])
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [flow.tradeStep])

  useEffect(() => {
    if (flow.disputeStep === "evidence") {
      setDisputeEvents((prev) => [...prev, { time: now(), type: "evidence", title: "证据采集", detail: "平台正在采集交易记录、合同签署日志、资金流水等证据材料" }])
      const t = setTimeout(() => {
        setDisputeEvents((prev) => [...prev, { time: now(), type: "arbitrate_start", title: "仲裁启动", detail: "平台仲裁委员会已受理，3名仲裁员已指派" }])
        setFundRecords((prev) => [...prev, { time: now(), action: "争议冻结", amount: selectedAccount?.price ?? 0, status: "frozen" }])
        setFlow({ disputeStep: "arbitrating" })
      }, 2500)
      return () => clearTimeout(t)
    }
  }, [flow.disputeStep])

  useEffect(() => {
    if (flow.disputeStep === "arbitrating") {
      const t = setTimeout(() => {
        setDisputeEvents((prev) => [...prev,
          { time: now(), type: "arbitrate_result", title: "仲裁裁决", detail: "多数仲裁员裁定：买方退款，账号归还卖方。托管资金解冻退回买方。" },
        ])
        setFundRecords((prev) => [...prev, { time: now(), action: "资金退还买方", amount: selectedAccount?.price ?? 0, status: "refunded" }])
        setFlow({ disputeStep: "resolved" })
      }, 4000)
      return () => clearTimeout(t)
    }
  }, [flow.disputeStep])

  const switchTab = useCallback((t: Tab) => {
    setTab(t)
    resetFlow("trade")
    setStamped(false)
    setDisputeEvents([])
    setFundRecords([])
  }, [resetFlow])

  const addEquip = () => { if (!newEq.name || !newEq.type) return; setSellEquipList([...sellEquipList, { ...newEq }]); setNewEq({ name: "", rarity: "rare", type: "" }) }

  const handleOrder = (id: string) => {
    setFlow({ tradeAccountId: id, tradeStep: "contract", disputeStep: "none", contractSigned: false, escrowFrozen: false, transferConfirmed: false, fundsReleased: false })
    setStamped(false)
    setDisputeEvents([])
    setFundRecords([])
  }

  const handleSign = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStamped(true)
      setTimeout(() => {
        setFlow({ contractSigned: true, tradeStep: "escrow" })
        setFundRecords((prev) => [...prev, { time: now(), action: "合同签署完成", amount: 0, status: "frozen" }])
      }, 600)
    }, 1500)
  }

  const handleEscrow = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setFlow({ escrowFrozen: true, tradeStep: "transfer" })
      setFundRecords((prev) => [...prev, { time: now(), action: "资金托管冻结", amount: selectedAccount?.price ?? 0, status: "frozen" }])
    }, 1000)
  }

  const handleTransfer = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setFlow({ transferConfirmed: true, tradeStep: "release" })
      setFundRecords((prev) => [...prev, { time: now(), action: "账号过户完成", amount: 0, status: "frozen" }])
    }, 1500)
  }

  const handleDispute = () => {
    setDisputeEvents([{ time: now(), type: "submit", title: "争议提交", detail: `争议原因：${disputeInput}` }])
    setFlow({ disputeStep: "evidence", disputeReason: disputeInput })
    setShowDisputeModal(false)
    setDisputeInput("")
  }

  const handlePublish = () => {
    const snap = "0x" + Math.random().toString(16).slice(2, 6) + "..." + Math.random().toString(16).slice(2, 6)
    const chain = "0x" + Math.random().toString(16).slice(2, 8) + "..." + Math.random().toString(16).slice(2, 6)
    setSellSnapHash(snap); setSellChainHash(chain); setSellToast(true); setTimeout(() => setSellToast(false), 3000)
  }

  const renderProgressBar = () => (
    <div className="flex items-center gap-1 mb-6">
      {stepLabels.map((label, i) => (
        <div key={label} className="flex-1 flex flex-col items-center gap-1">
          <div className={`w-full h-2 rounded-full transition-all duration-500 ${i <= stepIdx ? "bg-cyber-cyan shadow-[0_0_8px_rgba(0,240,255,0.4)]" : "bg-cyber-border"}`} />
          <span className={`text-[10px] font-bold ${i <= stepIdx ? "text-cyber-cyan" : "text-cyber-muted"}`}>{label}</span>
        </div>
      ))}
    </div>
  )

  const renderDisputeSection = () => {
    if (flow.disputeStep === "none") return null
    return (
      <div className="glass-panel p-5 space-y-4 border border-cyber-red/30 mt-5">
        <div className="flex items-center justify-between">
          <span className="neon-text font-bold flex items-center gap-2 text-cyber-red"><Gavel size={18} />争议处理流程</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            flow.disputeStep === "evidence" ? "bg-yellow-500/20 text-yellow-400" :
            flow.disputeStep === "arbitrating" ? "bg-cyber-red/20 text-cyber-red" :
            "bg-cyber-green/20 text-cyber-green"
          }`}>
            {flow.disputeStep === "evidence" ? "证据采集中" : flow.disputeStep === "arbitrating" ? "仲裁中" : "已裁决"}
          </span>
        </div>

        <div className="space-y-3">
          <div className="text-sm text-cyber-cyan font-bold">处理时间轴</div>
          {disputeEvents.map((evt, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${
                  evt.type === "submit" ? "bg-yellow-400" :
                  evt.type === "evidence" ? "bg-blue-400" :
                  evt.type === "arbitrate_start" ? "bg-cyber-red" :
                  evt.type === "arbitrate_result" ? "bg-cyber-green" :
                  "bg-cyber-cyan"
                }`} />
                {i < disputeEvents.length - 1 && <div className="w-px h-full bg-cyber-border mt-1" />}
              </div>
              <div className="flex-1 pb-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-white/90">{evt.title}</span>
                  <span className="text-xs text-cyber-muted">{evt.time}</span>
                </div>
                <div className="text-xs text-cyber-muted mt-0.5">{evt.detail}</div>
              </div>
            </div>
          ))}
          {flow.disputeStep === "evidence" && (
            <div className="flex items-center gap-2 text-xs text-yellow-400"><Clock size={12} className="animate-spin" />正在采集证据...</div>
          )}
          {flow.disputeStep === "arbitrating" && (
            <div className="flex items-center gap-2 text-xs text-cyber-red"><Clock size={12} className="animate-spin" />仲裁进行中，请等待裁决...</div>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-sm text-cyber-cyan font-bold">资金冻结/释放记录</div>
          {fundRecords.length > 0 ? fundRecords.map((rec, i) => (
            <div key={i} className="flex items-center gap-3 text-xs glass-panel p-2">
              <span className="text-cyber-muted">{rec.time}</span>
              <span className={`font-bold ${rec.status === "frozen" ? "text-blue-400" : rec.status === "released" ? "text-cyber-green" : "text-cyber-gold"}`}>
                {rec.status === "frozen" ? "❄ 冻结" : rec.status === "released" ? "✓ 释放" : "↩ 退还"}
              </span>
              <span>{rec.action}</span>
              {rec.amount > 0 && <span className="text-cyber-cyan font-bold ml-auto">¥{rec.amount.toLocaleString()}</span>}
            </div>
          )) : <div className="text-xs text-cyber-muted">暂无资金记录</div>}
        </div>

        {flow.disputeStep === "resolved" && (
          <div className="space-y-3 pt-2 border-t border-cyber-border">
            <div className="flex items-center gap-2 text-cyber-green font-bold text-sm"><CheckCircle size={16} />仲裁已完成</div>
            <div className="text-xs text-cyber-muted">裁定结果：买方退款，账号归还卖方。托管资金已解冻退回买方支付账户。</div>
            <button onClick={() => { resetFlow("trade"); setStamped(false); setDisputeEvents([]); setFundRecords([]) }} className="btn-cyber text-xs py-1.5 px-4">关闭争议，返回重新下单</button>
          </div>
        )}
      </div>
    )
  }

  const renderDisputeBtn = () => stepIdx >= 1 && stepIdx < 5 && flow.disputeStep === "none" && (
    <button onClick={() => setShowDisputeModal(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded border border-cyber-red/40 text-cyber-red hover:bg-cyber-red/10 transition-colors">
      <AlertTriangle size={14} />发起争议
    </button>
  )

  const renderBuyStep = () => {
    if (flow.tradeStep === "order") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sellingAccounts.map((acc) => (
            <div key={acc.id} className="card-cyber group">
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
              <div className="text-xs text-cyber-muted mb-1">UID {acc.gameUid}</div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {acc.equipmentSnapshot.slice(0, 3).map((eq) => (
                  <span key={eq.id} className={`badge-rarity-${eq.rarity} text-xs px-1.5 py-0.5 rounded`}>{eq.name}</span>
                ))}
              </div>
              <div className="flex items-center gap-2 mb-2 text-xs">
                <span className="text-cyber-green flex items-center gap-0.5"><CheckCircle size={10} />{acc.snapshotHash} ✓</span>
                {acc.insuranceActive && <span className="text-cyber-gold flex items-center gap-0.5">🛡 已投保</span>}
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-cyber-cyan font-bold">¥{acc.price}</span>
                <span className="text-xs text-cyber-muted">估值 ¥{acc.valuation}~¥{acc.valuation + 300}</span>
              </div>
              <button onClick={() => handleOrder(acc.id)} className="btn-cyber text-xs w-full py-1.5">立即下单</button>
            </div>
          ))}
        </div>
      )
    }

    if (!selectedAccount) return null
    const acc = selectedAccount

    if (flow.tradeStep === "contract") {
      return (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="glass-panel p-4 space-y-2">
            <div className="flex items-center gap-2"><span className="neon-text font-bold">{acc.gameName}</span><span className="text-xs text-cyber-muted">{acc.server}</span></div>
            <div className="text-xs text-cyber-muted">UID {acc.gameUid} · Lv.{acc.level} · ¥{acc.price}</div>
          </div>
          <div className="glass-panel p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-cyber-cyan"><FileText size={14} />合同文本</div>
            <div className="text-xs text-cyber-muted leading-relaxed bg-cyber-bg/50 rounded p-3 max-h-40 overflow-y-auto">
              甲方（卖方）同意将游戏账号 {acc.gameUid} 以 ¥{acc.price} 转让给乙方（买方）。双方同意通过平台托管完成交易。资金在账号过户确认后释放。争议由平台仲裁解决。本合同基于区块链存证，哈希 {acc.snapshotHash}，链上交易哈希 {acc.chainTxHash}。
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={handleSign} disabled={loading || stamped} className={`flex-1 py-2.5 rounded text-sm font-bold flex items-center justify-center gap-2 ${stamped ? "bg-cyber-green/20 text-cyber-green border border-cyber-green/40" : "btn-cyber"}`}>
              {loading ? "签署中..." : stamped ? <><CheckCircle size={16} />已签署</> : <><Stamp size={16} />签署合同</>}
            </button>
            {renderDisputeBtn()}
          </div>
          {stamped && <div className="text-center text-cyber-green font-bold text-lg">✦ 合同签署成功，资金托管步骤即将显示 ✦</div>}
          {renderDisputeSection()}
        </div>
      )
    }

    if (flow.tradeStep === "escrow") {
      return (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="glass-panel p-6 text-center space-y-4">
            <Lock size={40} className="mx-auto text-cyber-cyan" />
            <div className="neon-text font-bold text-lg">资金托管</div>
            <div className="text-3xl font-bold text-cyber-cyan">¥{acc.price}</div>
            <div className="text-sm text-cyber-muted">买方支付金额将冻结于平台托管账户，过户确认后释放至卖方</div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleEscrow} disabled={loading} className="flex-1 btn-cyber py-2.5 text-sm font-bold">
              {loading ? "冻结中..." : "确认托管冻结"}
            </button>
            {renderDisputeBtn()}
          </div>
          {fundRecords.length > 0 && (
            <div className="glass-panel p-3 space-y-1">
              <div className="text-xs text-cyber-cyan font-bold mb-1">资金记录</div>
              {fundRecords.map((rec, i) => (
                <div key={i} className="flex items-center gap-2 text-xs"><span className="text-cyber-muted">{rec.time}</span><span className="text-cyber-cyan">{rec.action}</span></div>
              ))}
            </div>
          )}
          {renderDisputeSection()}
        </div>
      )
    }

    if (flow.tradeStep === "transfer") {
      return (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="glass-panel p-6 space-y-4">
            <div className="neon-text font-bold text-lg text-center">账号过户确认</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="glass-panel p-3"><span className="text-cyber-muted">游戏</span><div className="neon-text font-bold">{acc.gameName}</div></div>
              <div className="glass-panel p-3"><span className="text-cyber-muted">UID</span><div className="font-mono text-cyber-cyan">{acc.gameUid}</div></div>
              <div className="glass-panel p-3"><span className="text-cyber-muted">区服</span><div className="text-cyber-cyan">{acc.server}</div></div>
              <div className="glass-panel p-3"><span className="text-cyber-muted">等级</span><div className="text-cyber-cyan">Lv.{acc.level}</div></div>
            </div>
            <div className="text-xs text-cyber-muted text-center">确认后，卖方将账号控制权移交至买方</div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleTransfer} disabled={loading} className="flex-1 btn-cyber py-2.5 text-sm font-bold">
              {loading ? "过户中..." : "确认过户"}
            </button>
            {renderDisputeBtn()}
          </div>
          {fundRecords.length > 0 && (
            <div className="glass-panel p-3 space-y-1">
              <div className="text-xs text-cyber-cyan font-bold mb-1">资金记录</div>
              {fundRecords.map((rec, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-cyber-muted">{rec.time}</span>
                  <span className={rec.status === "frozen" ? "text-blue-400" : "text-cyber-green"}>{rec.action}</span>
                  {rec.amount > 0 && <span className="text-cyber-cyan">¥{rec.amount.toLocaleString()}</span>}
                </div>
              ))}
            </div>
          )}
          {renderDisputeSection()}
        </div>
      )
    }

    if (flow.tradeStep === "release") {
      return (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="glass-panel p-6 text-center space-y-4">
            <div className="text-4xl">💰</div>
            <div className="neon-text font-bold text-lg">资金释放中</div>
            <div className="text-2xl font-bold text-cyber-green">¥{acc.price}</div>
            <div className="text-sm text-cyber-muted">托管资金正在释放至卖方账户（秒级释放）...</div>
            <div className="flex items-center justify-center gap-2"><Clock size={14} className="text-cyber-cyan animate-spin" /><span className="text-xs text-cyber-muted">处理中</span></div>
          </div>
          {renderDisputeSection()}
        </div>
      )
    }

    if (flow.tradeStep === "done") {
      return (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="glass-panel p-8 text-center space-y-4">
            <CheckCircle size={56} className="mx-auto text-cyber-green" />
            <div className="text-cyber-green font-bold text-xl">交易完成</div>
            <div className="text-sm text-cyber-muted">交易哈希: <span className="font-mono text-cyber-cyan">{acc.chainTxHash}</span></div>
            <div className="grid grid-cols-2 gap-3 text-sm mt-4">
              <div className="glass-panel p-3"><span className="text-cyber-muted">账号</span><div className="neon-text font-bold">{acc.gameName}</div></div>
              <div className="glass-panel p-3"><span className="text-cyber-muted">金额</span><div className="text-cyber-green font-bold">¥{acc.price}</div></div>
            </div>
          </div>
          <div className="glass-panel p-3 space-y-1">
            <div className="text-xs text-cyber-cyan font-bold mb-1">资金流水</div>
            {fundRecords.map((rec, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="text-cyber-muted">{rec.time}</span>
                <span className={rec.status === "frozen" ? "text-blue-400" : rec.status === "released" ? "text-cyber-green" : "text-cyber-gold"}>
                  {rec.status === "frozen" ? "❄" : rec.status === "released" ? "✓" : "↩"} {rec.action}
                </span>
                {rec.amount > 0 && <span className="text-cyber-cyan ml-auto">¥{rec.amount.toLocaleString()}</span>}
              </div>
            ))}
          </div>
          <button onClick={() => { resetFlow("trade"); setStamped(false); setDisputeEvents([]); setFundRecords([]) }} className="btn-cyber w-full py-2.5 text-sm font-bold">返回继续购买</button>
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="flex gap-2 mb-6">
        {([["buy", "买号", ShoppingCart], ["sell", "卖号", Tag], ["orders", "我的订单", ClipboardList]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => switchTab(key)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === key ? "btn-cyber" : "bg-cyber-panel border border-cyber-border text-cyber-muted hover:text-cyber-cyan"}`}>
            <Icon size={16} />{label}
          </button>
        ))}
        {tab === "buy" && flow.tradeStep !== "order" && (
          <button onClick={() => { resetFlow("trade"); setStamped(false); setDisputeEvents([]); setFundRecords([]) }} className="ml-auto text-xs text-cyber-muted hover:text-cyber-cyan border border-cyber-border rounded px-3 py-1">重新下单</button>
        )}
      </div>

      {tab === "buy" && (
        <>
          {flow.tradeStep !== "order" && renderProgressBar()}
          {renderBuyStep()}
        </>
      )}

      {tab === "sell" && (
        <div className="max-w-lg mx-auto glass-panel p-6 space-y-4">
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
          <button onClick={handlePublish} disabled={!sellGame || !sellUid || !sellPrice} className="btn-cyber w-full py-2 text-sm font-bold">发布上架</button>
          {sellToast && (
            <div className="glass-panel p-3 space-y-1 border border-cyber-green/30">
              <div className="flex items-center gap-2 text-cyber-green text-sm font-bold"><CheckCircle size={14} />上架成功</div>
              <div className="text-xs text-cyber-muted">自动估值: ¥{autoValuation}</div>
              <div className="text-xs text-cyber-muted">装备快照: <span className="font-mono text-cyber-cyan">{sellSnapHash}</span></div>
              <div className="text-xs text-cyber-muted">链上证书: <span className="font-mono text-cyber-cyan">{sellChainHash}</span></div>
            </div>
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-3 max-w-2xl mx-auto">
          {mockTradeOrders.map((o) => {
            const acc = accounts.find((a) => a.id === o.accountId)
            const cfg = contractStatusCfg[o.contractStatus]
            return (
              <div key={o.id} className="glass-panel p-4 space-y-2">
                <div className="flex items-center gap-4">
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
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-cyber-muted">
                  <span>合约 <span className="font-mono text-cyber-cyan">{o.contractHash.slice(0, 12)}...</span></span>
                  <span className="flex items-center gap-1"><Lock size={10} />{o.escrowStatus === "frozen" ? "已冻结" : o.escrowStatus === "released" ? "已释放" : "待处理"}</span>
                  {o.disputeStatus && <span className="flex items-center gap-1 text-cyber-red"><AlertTriangle size={10} />争议: {o.disputeStatus === "pending" ? "待处理" : o.disputeStatus === "arbitrating" ? "仲裁中" : "已解决"}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showDisputeModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowDisputeModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-cyber-panel border border-cyber-red/40 rounded-xl z-50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg flex items-center gap-2 text-cyber-red"><AlertTriangle size={18} />发起争议</span>
              <button onClick={() => setShowDisputeModal(false)} className="text-cyber-muted hover:text-cyber-cyan"><X size={18} /></button>
            </div>
            <textarea className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-2 text-sm h-24 resize-none" placeholder="请描述争议原因..." value={disputeInput} onChange={(e) => setDisputeInput(e.target.value)} />
            <div className="text-xs text-cyber-muted">提交后平台将：①冻结托管资金 → ②采集证据 → ③指派仲裁员 → ④裁决结果</div>
            <button onClick={handleDispute} disabled={!disputeInput.trim()} className="w-full py-2 text-sm font-bold rounded bg-cyber-red/20 text-cyber-red border border-cyber-red/40 hover:bg-cyber-red/30 transition-colors disabled:opacity-50">提交争议</button>
          </div>
        </>
      )}
    </div>
  )
}
