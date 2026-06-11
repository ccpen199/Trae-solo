import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Gamepad2, ArrowLeftRight, Search, Recycle, Shield, TrendingUp, Copy, Check, Link2, Lock, Fingerprint, Activity } from "lucide-react";
import { mockTransactions } from "@/data/mockData";
import { useAppStore } from "@/store/useAppStore";

function StatDisplay({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  return <span>{prefix}{target.toLocaleString()}{suffix}</span>
}

const typeColors: Record<string, string> = { buy: "text-cyber-cyan", sell: "text-cyber-green", rent: "text-cyber-purple", recycle: "text-cyber-gold" }
const typeLabels: Record<string, string> = { buy: "购买", sell: "出售", rent: "租号", recycle: "回收" }
const statusBadge: Record<string, { text: string; cls: string }> = {
  completed: { text: "已完成", cls: "bg-cyber-green/20 text-cyber-green border-cyber-green/30" },
  processing: { text: "进行中", cls: "bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/30" },
  pending: { text: "待处理", cls: "bg-cyber-gold/20 text-cyber-gold border-cyber-gold/30" },
}

const navCards = [
  { label: "租号中心", to: "/rent", icon: Gamepad2, color: "text-cyber-cyan border-cyber-cyan/30 hover:border-cyber-cyan/60 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]", flow: { rentalStep: "select" as const, rentalAccountId: null } },
  { label: "买卖市场", to: "/trade", icon: ArrowLeftRight, color: "text-cyber-green border-cyber-green/30 hover:border-cyber-green/60 hover:shadow-[0_0_20px_rgba(0,255,136,0.2)]", flow: { tradeStep: "order" as const, tradeAccountId: null } },
  { label: "智能估值", to: "/valuation", icon: Search, color: "text-cyber-purple border-cyber-purple/30 hover:border-cyber-purple/60 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]", flow: { valuationStep: "input" as const, valuationAccountId: null } },
  { label: "回收竞价", to: "/recycle", icon: Recycle, color: "text-cyber-gold border-cyber-gold/30 hover:border-cyber-gold/60 hover:shadow-[0_0_20px_rgba(255,215,0,0.2)]", flow: { recycleStep: "submit" as const, recycleAccountId: null } },
  { label: "保险理赔", to: "/insurance", icon: Shield, color: "text-cyber-red border-cyber-red/30 hover:border-cyber-red/60 hover:shadow-[0_0_20px_rgba(255,51,102,0.2)]", flow: { claimStep: "view" as const, claimPolicyId: null } },
]

const stats = [
  { label: "总交易额", value: 12856000, prefix: "¥", suffix: "", note: "含租/买/卖/回收全口径，按合同签署时间统计" },
  { label: "在线账号", value: 2847, prefix: "", suffix: "", note: "当前可租/可售账号数，每5分钟刷新" },
  { label: "安全保障", value: 98652, prefix: "", suffix: "次", note: "累计资金托管+保险理赔+风控拦截次数" },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return <button onClick={handleCopy} className="text-cyber-muted hover:text-cyber-cyan transition-colors">{copied ? <Check className="w-3 h-3 text-cyber-green" /> : <Copy className="w-3 h-3" />}</button>;
}

function StatusTag({ status }: { status: string }) {
  const map: Record<string, { text: string; cls: string }> = {
    selling: { text: "资金托管中", cls: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
    rented: { text: "租赁中", cls: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
    available: { text: "可交易", cls: "text-cyber-green bg-cyber-green/10 border-cyber-green/30" },
  };
  const s = map[status];
  if (!s) return null;
  return <span className={`text-[10px] px-1.5 py-0.5 rounded border ${s.cls}`}>{s.text}</span>;
}

export default function Home() {
  const accounts = useAppStore((s) => s.accounts);
  const flow = useAppStore((s) => s.flow);
  const setFlow = useAppStore((s) => s.setFlow);
  const navigate = useNavigate();
  const hotAccounts = accounts.slice(0, 4)

  const handleNav = (to: string, flow: Record<string, unknown>) => { setFlow(flow); navigate(to); };

  return (
    <div className="min-h-screen font-noto">
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute top-10 left-[10%] w-72 h-72 bg-cyber-cyan/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-10 right-[15%] w-96 h-96 bg-cyber-purple/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyber-red/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: "2s" }} />
        <div className="relative z-10 text-center">
          <motion.h1 className="font-orbitron text-6xl md:text-7xl font-bold neon-text mb-4" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>GameVault</motion.h1>
          <motion.p className="text-lg md:text-xl text-cyber-muted mb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>高安全等级游戏账号全生命周期交易平台</motion.p>
          <div className="flex justify-center gap-8 md:gap-16 flex-wrap">
            {stats.map((s, i) => (
              <motion.div key={s.label} className="text-center group relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.15 }}>
                <div className="font-orbitron text-2xl md:text-3xl font-bold text-cyber-cyan"><StatDisplay target={s.value} prefix={s.prefix} suffix={s.suffix} /></div>
                <div className="text-cyber-muted text-sm mt-1">{s.label}</div>
                <div className="text-[10px] text-cyber-muted/60 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">{s.note}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 max-w-6xl mx-auto mb-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {navCards.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}>
              <motion.div
                className={`glass-panel flex flex-col items-center justify-center gap-3 p-6 border transition-all duration-300 cursor-pointer ${card.color}`}
                whileHover={{ scale: 1.05, rotateX: 5, rotateY: 5 }}
                whileTap={{ scale: 0.97 }}
                style={{ transformPerspective: 800 }}
                onClick={() => handleNav(card.to, card.flow)}
              >
                <card.icon className="w-8 h-8" />
                <span className="text-sm font-medium">{card.label}</span>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mb-12 overflow-hidden">
        <div className="flex items-center gap-2 px-4 max-w-6xl mx-auto mb-3">
          <TrendingUp className="w-5 h-5 text-cyber-cyan" />
          <h2 className="font-orbitron text-lg neon-text">实时交易流</h2>
          <Link to="/admin" className="ml-auto text-xs text-cyber-muted hover:text-cyber-cyan flex items-center gap-1 border border-cyber-border rounded px-2 py-1 transition-colors">
            <Lock size={10} />合规审计看板
          </Link>
        </div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-cyber-bg to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-cyber-bg to-transparent z-10" />
          <div className="flex animate-scroll-left whitespace-nowrap">
            {mockTransactions.map((tx, i) => (
              <div key={`tx-${tx.id}-${i}`} className="glass-panel mx-2 px-4 py-2 inline-flex items-center gap-3 shrink-0">
                <span className="text-white/90 font-medium">{tx.gameName}</span>
                <span className={`text-xs font-bold ${typeColors[tx.type]}`}>{typeLabels[tx.type]}</span>
                <span className="text-cyber-cyan font-orbitron text-sm">¥{tx.amount.toLocaleString()}</span>
                <span className="text-cyber-muted text-xs">{new Date(tx.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
                {statusBadge[tx.status] && <span className={`text-[10px] px-1.5 py-0.5 rounded border ${statusBadge[tx.status].cls}`}>{statusBadge[tx.status].text}</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 max-w-6xl mx-auto mb-16">
        <h2 className="font-orbitron text-lg neon-text mb-6 flex items-center gap-2"><Gamepad2 className="w-5 h-5" />热门账号</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hotAccounts.map((acc, i) => (
            <motion.div key={acc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}>
              <div className="card-cyber group">
                <div className="relative overflow-hidden rounded-md mb-3">
                  <img src={acc.imageUrl} alt={acc.gameName} className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30">Lv.{acc.level}</div>
                </div>
                <div className="font-medium text-white/90 mb-1">{acc.gameName}</div>
                <div className="text-cyber-muted text-xs mb-2">{acc.server} · {acc.region}</div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Fingerprint className="w-3 h-3 text-cyber-muted" />
                  <span className="font-mono text-xs text-cyber-cyan">{acc.gameUid}</span>
                </div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Link2 className="w-3 h-3 text-cyber-muted" />
                  <span className="font-mono text-[10px] text-cyber-muted truncate max-w-[100px]">{acc.snapshotHash}</span>
                  <CopyButton text={acc.snapshotHash} />
                </div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-cyber-green text-xs">✓ 已上链</span>
                  <span className="font-mono text-[10px] text-cyber-muted truncate max-w-[90px]">{acc.chainTxHash}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <StatusTag status={acc.status} />
                  {acc.insuranceActive ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded border text-cyber-green bg-cyber-green/10 border-cyber-green/30 inline-flex items-center gap-1"><Shield className="w-3 h-3" />保险生效中</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded border text-cyber-muted bg-cyber-muted/10 border-cyber-muted/30">未投保</span>
                  )}
                </div>
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <div className="text-cyber-cyan font-orbitron text-lg">¥{acc.price.toLocaleString()}</div>
                    <div className="text-cyber-muted text-xs">售价</div>
                  </div>
                  <div className="text-right">
                    <div className="text-cyber-purple font-orbitron text-sm">¥{acc.rentPriceDaily}/天</div>
                    <div className="text-cyber-muted text-xs">租价</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setFlow({ rentalAccountId: acc.id, rentalStep: "period", rentalPeriod: "hourly", rentalHours: 2, deviceBound: false, depositPaid: false, circuitBreaker: false }); navigate("/rent") }} className="flex-1 text-center text-xs py-1.5 rounded border border-cyber-cyan/40 text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors">租用</button>
                  <button onClick={() => { setFlow({ tradeAccountId: acc.id, tradeStep: "contract", disputeStep: "none", contractSigned: false, escrowFrozen: false, transferConfirmed: false, fundsReleased: false }); navigate("/trade") }} className="flex-1 text-center text-xs py-1.5 rounded border border-cyber-green/40 text-cyber-green hover:bg-cyber-green/10 transition-colors">购买</button>
                  <Link to={`/preview/${acc.id}`} className="flex-1 text-center text-xs py-1.5 rounded border border-cyber-purple/40 text-cyber-purple hover:bg-cyber-purple/10 transition-colors">VR预览</Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-4 max-w-6xl mx-auto mb-16">
        <h2 className="font-orbitron text-lg neon-text mb-6 flex items-center gap-2"><Lock className="w-5 h-5" />快速开始交易</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="glass-panel p-6 border border-cyber-cyan/30 hover:border-cyber-cyan/60 transition-all cursor-pointer" onClick={() => { setFlow({ rentalStep: "select", rentalAccountId: null, deviceBound: false, depositPaid: false, circuitBreaker: false }); navigate("/rent"); }}>
              <Gamepad2 className="w-8 h-8 text-cyber-cyan mb-3" />
              <div className="font-medium text-white/90 mb-1">我要租号</div>
              <div className="text-cyber-muted text-xs">安全租用高等级游戏账号，设备绑定+保险保障</div>
              <div className="text-[10px] text-cyber-cyan/60 mt-2">选号→租期→设备绑定→押金→使用→归还</div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="glass-panel p-6 border border-cyber-green/30 hover:border-cyber-green/60 transition-all cursor-pointer" onClick={() => { setFlow({ tradeStep: "order", tradeAccountId: null, contractSigned: false, escrowFrozen: false, transferConfirmed: false, fundsReleased: false, disputeStep: "none" }); navigate("/trade"); }}>
              <ArrowLeftRight className="w-8 h-8 text-cyber-green mb-3" />
              <div className="font-medium text-white/90 mb-1">我要买号</div>
              <div className="text-cyber-muted text-xs">智能合约+资金托管，安全购买游戏账号</div>
              <div className="text-[10px] text-cyber-green/60 mt-2">下单→合同签署→托管冻结→过户→释放→完成</div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="glass-panel p-6 border border-cyber-gold/30 hover:border-cyber-gold/60 transition-all cursor-pointer" onClick={() => { setFlow({ tradeStep: "order", tradeAccountId: null, contractSigned: false, escrowFrozen: false, transferConfirmed: false, fundsReleased: false, disputeStep: "none" }); navigate("/trade"); }}>
              <TrendingUp className="w-8 h-8 text-cyber-gold mb-3" />
              <div className="font-medium text-white/90 mb-1">我要卖号</div>
              <div className="text-cyber-muted text-xs">一键发布账号，链上存证+竞价回收</div>
              <div className="text-[10px] text-cyber-gold/60 mt-2">上架→合同签署→托管→过户→资金释放</div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 max-w-6xl mx-auto mb-16">
        <h2 className="font-orbitron text-lg neon-text mb-4 flex items-center gap-2"><Activity className="w-5 h-5" />我的业务闭环</h2>
        <p className="text-cyber-muted text-xs mb-4">实时展示租号、买卖、回收、理赔流程的当前状态，点击可跳转到对应步骤继续操作</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {([
            { label: "租号流程", step: flow.rentalStep, account: flow.rentalAccountId ? accounts.find((a) => a.id === flow.rentalAccountId) : null, to: "/rent", icon: Gamepad2, color: "border-cyber-cyan/40 text-cyber-cyan", stepMap: { select: "选号", period: "确认租期", device: "设备绑定", deposit: "押金托管", active: "使用中", return: "归还", done: "已完成" } },
            { label: "买卖流程", step: flow.tradeStep, account: flow.tradeAccountId ? accounts.find((a) => a.id === flow.tradeAccountId) : null, to: "/trade", icon: ArrowLeftRight, color: "border-cyber-green/40 text-cyber-green", stepMap: { order: "选号下单", contract: "合同签署", escrow: "资金托管", transfer: "过户确认", release: "资金释放", done: "已完成" } },
            { label: "回收流程", step: flow.recycleStep, account: flow.recycleAccountId ? accounts.find((a) => a.id === flow.recycleAccountId) : null, to: "/recycle", icon: Recycle, color: "border-cyber-gold/40 text-cyber-gold", stepMap: { submit: "提交回收", bidding: "竞价中", accept: "接受报价", transfer: "移交确认", done: "已完成" } },
            { label: "理赔流程", step: flow.claimStep, account: null, to: "/insurance", icon: Shield, color: "border-cyber-red/40 text-cyber-red", stepMap: { view: "查看保单", apply: "申请理赔", verifying: "验证中", approved: "已批准", paid: "已赔付" } },
          ] as const).map((item) => {
            const isInProgress = (item.step !== "select" && item.step !== "order" && item.step !== "submit" && item.step !== "view") || item.account
            const stepLabel = item.stepMap[item.step as keyof typeof item.stepMap] ?? item.step
            return (
              <div key={item.label} className={`glass-panel p-4 border ${isInProgress ? item.color : "border-cyber-border opacity-50"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className="w-4 h-4" />
                  <span className="font-bold text-sm">{item.label}</span>
                </div>
                <div className="text-xs text-cyber-muted mb-1">当前状态：<span className={isInProgress ? "text-white/90" : ""}>{stepLabel}</span></div>
                {item.account && <div className="text-xs font-mono text-cyber-cyan truncate">{item.account.gameName} · {item.account.gameUid}</div>}
                {(item.step === "done" || item.step === "paid") && <div className="text-xs text-cyber-green mt-1">✓ 流程已完成</div>}
                {item.step === "active" && flow.circuitBreaker && <div className="text-xs text-cyber-red mt-1">⚠ 熔断保护已触发</div>}
                {isInProgress && (
                  <button onClick={() => navigate(item.to)} className="mt-2 text-xs px-3 py-1 rounded border border-cyber-border hover:border-cyber-cyan text-cyber-muted hover:text-cyber-cyan transition-colors">继续操作 →</button>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  );
}
