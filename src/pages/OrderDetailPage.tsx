import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency, formatBytes, getStatusClass, getStatusLabel, shortenHash, timeAgo } from '@/utils';
import { getGame, TIER_LABEL_MAP } from '@/data/games';
import {
  ArrowLeft, FileCheck, Video, FileImage, Cpu, ShieldCheck, AlertTriangle,
  CheckCircle2, ChevronRight, Download, Hash, Fingerprint, Clock,
  Scale, MessageCircle, ChevronDown, ChevronUp, X, Send
} from 'lucide-react';
import { TierBadge3D } from '@/components/Badge3D';
import type { EvidenceType, MilestoneType } from '@/types';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const order = useAppStore(s => s.getOrderById(id || ''));
  const getUserById = useAppStore(s => s.getUserById);
  const completeOrder = useAppStore(s => s.completeOrder);
  const createDispute = useAppStore(s => s.createDispute);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeCategory, setDisputeCategory] = useState('quality_issue');
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null);

  if (!order) {
    return (
      <div className="pt-32 pb-24 container">
        <div className="glass-card p-16 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2">订单不存在</h2>
          <Link to="/orders" className="btn-primary mt-4 inline-flex">
            <ArrowLeft className="w-4 h-4" /> 返回订单中心
          </Link>
        </div>
      </div>
    );
  }

  const player = getUserById(order.playerId);
  const provider = getUserById(order.providerId);
  const game = order.requirement ? getGame(order.requirement.gameCode) : null;
  const fromTier = order.requirement?.fromTier;
  const toTier = order.requirement?.toTier;

  const milestoneIcons: Record<MilestoneType, any> = {
    GameStart: Clock, Win: CheckCircle2, RankUp: FileCheck,
    TierComplete: ShieldCheck, AllComplete: FileCheck, Checkpoint: Hash
  };

  const handleAccept = () => {
    if (!confirm('确认验收完成？验收通过后资金将结算给服务商。')) return;
    completeOrder(order.id);
  };

  const handleDispute = () => {
    if (!disputeReason.trim()) return;
    const dId = createDispute(order.id, order.playerId, disputeReason, disputeCategory);
    navigate(`/dispute/${dId}`);
  };

  const evidenceTypeInfo: Record<EvidenceType, { label: string; icon: any; color: string }> = {
    ScreenRecording: { label: '录屏存证', icon: Video, color: 'text-diamond-400' },
    Screenshot: { label: '截图证据', icon: FileImage, color: 'text-gold-400' },
    SDKLog: { label: 'SDK校验', icon: Cpu, color: 'text-esports-400' },
    ManualUpload: { label: '人工上传', icon: Upload, color: 'text-night-300' },
  };

  return (
    <div className="pt-28 pb-24">
      <div className="container max-w-6xl">
        <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-night-400 hover:text-esports-300 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> 返回订单中心
        </Link>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-6">
            <div className="glass-card p-6 md:p-8">
              <div className="flex items-start justify-between gap-6 flex-wrap mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h1 className="text-2xl heading-display text-night-100">订单合约 #{order.id}</h1>
                    <span className={getStatusClass(order.status)}>{getStatusLabel(order.status)}</span>
                  </div>
                  <div className="text-xs text-night-500 font-mono flex items-center gap-3 flex-wrap">
                    <span>签署于 {order.signedAt}</span>
                    <span>·</span>
                    <span>截止 {order.deadlineAt}</span>
                    {order.completedAt && <><span>·</span><span>完成于 {order.completedAt}</span></>}
                  </div>
                </div>
                {game && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-night-900/60 border border-white/5">
                    <span className="text-2xl">{game.icon}</span>
                    <div>
                      <div className="text-sm font-semibold">{game.name}</div>
                      <div className="text-[10px] text-night-500">{order.requirement?.serviceType}</div>
                    </div>
                  </div>
                )}
              </div>

              {fromTier && toTier && (
                <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 items-center p-6 rounded-2xl bg-gradient-to-r from-esports-500/10 via-night-800/60 to-gold-500/10 border border-white/5 mb-6">
                  <div className="text-center">
                    <div className="flex justify-center"><TierBadge3D tier={fromTier} size={64} /></div>
                    <div className="text-xs text-night-400 mt-1">{TIER_LABEL_MAP[fromTier]}</div>
                    <div className="text-[10px] text-night-600 mt-0.5">起始段位</div>
                  </div>
                  <motion.div animate={{ x: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} className="text-2xl text-esports-400">→</motion.div>
                  <div className="text-center">
                    <div className="flex justify-center"><TierBadge3D tier={toTier} size={64} /></div>
                    <div className="text-xs text-night-400 mt-1">{TIER_LABEL_MAP[toTier]}</div>
                    <div className="text-[10px] text-night-600 mt-0.5">目标段位</div>
                  </div>
                  <motion.div animate={{ x: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.3 }} className="text-2xl text-gold-400">→</motion.div>
                  <div className="text-center">
                    <div className="heading-display text-4xl text-gradient-gold">{order.progress}%</div>
                    <div className="text-xs text-night-400 mt-1">履约进度</div>
                  </div>
                </div>
              )}

              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm text-night-300 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-esports-400" />
                  履约节点
                </div>
                <span className="text-xs text-night-500">
                  {order.milestones.filter(m => m.verified).length}/{order.milestones.length} 已验证
                </span>
              </div>
              <div className="h-2 rounded-full bg-night-700 overflow-hidden mb-8">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${order.progress}%` }}
                  className="h-full bg-gradient-esports relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer bg-[length:200%_100%]" />
                </motion.div>
              </div>

              <div className="relative pl-8 space-y-6">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-esports-500/60 via-night-600 to-night-700" />
                {order.milestones.length === 0 ? (
                  <div className="text-sm text-night-500">服务商尚未开始履约...</div>
                ) : order.milestones.map((m, i) => {
                  const Icon = milestoneIcons[m.type] || CheckCircle2;
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="relative"
                    >
                      <div className={`absolute -left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center ${
                        m.verified ? 'bg-gradient-victory shadow-victory' : 'bg-night-700'
                      }`} style={m.verified ? { boxShadow: '0 0 20px rgba(16,185,129,0.5)' } : {}}>
                        <Icon className={`w-3 h-3 ${m.verified ? 'text-white' : 'text-night-500'}`} />
                      </div>
                      <div className={`p-4 rounded-xl ${m.verified ? 'bg-night-800/60 border border-white/5' : 'bg-night-900/50 border border-dashed border-night-700'}`}>
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <div className={`font-medium text-sm ${m.verified ? 'text-night-100' : 'text-night-400'}`}>
                              {m.description}
                            </div>
                            <div className="text-[11px] text-night-500 mt-1 font-mono">{m.timestamp}</div>
                          </div>
                          {m.gameResult && m.gameResult !== 'N/A' && (
                            <span className={`badge-base ${m.gameResult === 'Win' ? 'status-success' : m.gameResult === 'Loss' ? 'status-dispute' : 'status-pending'}`}>
                              {m.gameResult === 'Win' ? '胜利' : m.gameResult === 'Loss' ? '失败' : '平局'}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="glass-card p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-diamond-400" />
                  证据链存证
                </h3>
                <Link to={`/order/${order.id}/monitor`} className="text-xs text-esports-400 hover:text-esports-300 inline-flex items-center gap-1">
                  履约监控台 <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {order.evidence.length === 0 ? (
                  <div className="md:col-span-2 text-center py-8 text-sm text-night-500">暂无证据记录</div>
                ) : order.evidence.map(e => {
                  const info = evidenceTypeInfo[e.type];
                  const expanded = expandedEvidence === e.id;
                  return (
                    <motion.div key={e.id} layout className="rounded-2xl bg-night-900/60 border border-white/5 overflow-hidden">
                      <button
                        onClick={() => setExpandedEvidence(expanded ? null : e.id)}
                        className="w-full p-4 text-left flex items-start gap-3 hover:bg-white/5 transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-xl bg-night-800 flex items-center justify-center shrink-0 ${info.color}`}>
                          <info.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="font-medium text-sm">{e.title}</span>
                            <span className={`text-[10px] badge-base ${info.color.replace('text-', 'bg-').replace('400', '400/20 border').replace('500', '500/20 border')}`}>{info.label}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-night-500 flex-wrap">
                            <span className="inline-flex items-center gap-1"><Fingerprint className="w-3 h-3"/>SHA256: <code className="font-mono">{shortenHash(e.hash)}</code></span>
                            {e.size && <span>· {formatBytes(e.size)}</span>}
                          </div>
                        </div>
                        {expanded ? <ChevronUp className="w-4 h-4 text-night-500 shrink-0 mt-2"/> : <ChevronDown className="w-4 h-4 text-night-500 shrink-0 mt-2"/>}
                      </button>
                      <AnimatePresence>
                        {expanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-2.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-night-500">上传人</span>
                                <span className="text-night-200 font-medium">{getUserById(e.uploadedBy)?.nickname || '系统'}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-night-500">上传时间</span>
                                <span className="text-night-200 font-mono">{e.uploadedAt}</span>
                              </div>
                              <div className="flex items-start justify-between gap-3 text-xs">
                                <span className="text-night-500 shrink-0 mt-1">哈希校验</span>
                                <code className="font-mono text-esports-300 text-left break-all text-[10px]">{e.hash}</code>
                              </div>
                              <div className="flex gap-2 pt-1">
                                <button className="btn-ghost text-xs border border-white/10 rounded-lg flex-1 justify-center py-2">
                                  <Download className="w-3 h-3" /> 下载
                                </button>
                                <button className="btn-ghost text-xs border border-white/10 rounded-lg flex-1 justify-center py-2">
                                  预览
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="glass-card p-6 md:p-8">
              <h3 className="font-bold text-lg mb-5 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-gold-400" />
                合约保障条款
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {order.guaranteeClauses.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-night-900/50 border border-white/5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-gold flex items-center justify-center shrink-0 text-slate-900 font-bold text-xs shadow-gold-glow">
                      {i + 1}
                    </div>
                    <p className="text-sm text-night-200 leading-relaxed">{c}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="glass-card p-6">
              <h4 className="font-bold mb-4 text-sm">合约金额</h4>
              <div className="text-4xl heading-display text-gradient-gold mb-1">{formatCurrency(order.totalPrice)}</div>
              <div className="text-xs text-night-500 mb-5">含平台服务费 {formatCurrency(order.platformFee)}</div>
              <div className="space-y-2.5 text-sm border-t border-white/5 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-night-400 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5"/>已付定金</span>
                  <span className="font-semibold data-number text-victory-green">{formatCurrency(order.depositPaid)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-night-400">尾款（验收后）</span>
                  <span className="text-night-200 data-number">{formatCurrency(order.totalPrice - order.depositPaid)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-night-400">资金状态</span>
                  <span className="status-progress">平台担保中</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h4 className="font-bold mb-4 text-sm">交易双方</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-night-900/50 border border-white/5">
                  <img src={player?.avatar} className="w-10 h-10 rounded-xl ring-2 ring-diamond-500/40" alt=""/>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{player?.nickname}</div>
                    <div className="text-[10px] text-diamond-400">需求方（玩家）</div>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-white/5"><MessageCircle className="w-4 h-4 text-night-400"/></button>
                </div>
                <div className="flex justify-center">
                  <div className="w-px h-3 bg-gradient-to-b from-transparent via-night-600 to-transparent"/>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-night-900/50 border border-white/5">
                  <img src={provider?.avatar} className="w-10 h-10 rounded-xl ring-2 ring-gold-500/40" alt=""/>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{provider?.nickname}</div>
                    <div className="text-[10px] text-gold-400">供给方（代练）</div>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-white/5"><MessageCircle className="w-4 h-4 text-night-400"/></button>
                </div>
              </div>
            </div>

            {order.status === 'InProgress' || order.status === 'Checking' ? (
              <div className="space-y-3">
                {order.status === 'Checking' && (
                  <button onClick={handleAccept} className="btn-primary w-full py-3.5">
                    <CheckCircle2 className="w-5 h-5" />
                    确认验收并结算
                  </button>
                )}
                <button onClick={() => setShowDispute(true)} className="btn-danger w-full py-3.5">
                  <AlertTriangle className="w-5 h-5" />
                  发起争议仲裁
                </button>
              </div>
            ) : order.status === 'Completed' ? (
              <div className="glass-card p-5 bg-gradient-to-br from-emerald-500/10 to-diamond-500/10 border-emerald-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-victory flex items-center justify-center" style={{ boxShadow: '0 0 30px rgba(16,185,129,0.5)' }}>
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-lg text-emerald-300">订单圆满完成</div>
                    <div className="text-xs text-night-400">感谢使用 ELO Master</div>
                  </div>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {showDispute && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowDispute(false)}
          >
            <motion.div
              initial={{ y: 50, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 50, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg glass-card p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="heading-display text-2xl text-gradient-esports">发起争议仲裁</h3>
                <button onClick={() => setShowDispute(false)} className="p-2 rounded-lg hover:bg-white/5">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-night-300 mb-2 font-medium">争议类型</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { k: 'quality_issue', l: '质量未达标', i: '🎯' },
                      { k: 'delivery_delay', l: '交付超时', i: '⏱' },
                      { k: 'account_safety', l: '账号安全', i: '🔒' },
                      { k: 'other', l: '其他争议', i: '❓' },
                    ].map(c => (
                      <button
                        key={c.k}
                        onClick={() => setDisputeCategory(c.k)}
                        className={`p-3 rounded-xl text-left transition-all ${
                          disputeCategory === c.k
                            ? 'bg-esports-400/15 border-2 border-esports-400'
                            : 'bg-night-900/60 border border-white/5 hover:border-white/15'
                        }`}
                      >
                        <div className="text-xl mb-1">{c.i}</div>
                        <div className="text-xs font-medium">{c.l}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-night-300 mb-2 font-medium flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-esports-400"/>
                    详细描述（仲裁依据）
                  </label>
                  <textarea
                    value={disputeReason}
                    onChange={e => setDisputeReason(e.target.value)}
                    rows={5}
                    placeholder="请详细描述争议原因，平台将结合证据链与三方评审做出公正裁决..."
                    className="input-base resize-none"
                  />
                  <div className="text-[11px] text-night-500 mt-2">
                    提交后将进入 48 小时证据收集期，随后由 3 名评审员投票裁决
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowDispute(false)} className="btn-secondary flex-1">
                    取消
                  </button>
                  <button
                    onClick={handleDispute}
                    disabled={!disputeReason.trim()}
                    className="btn-primary flex-1 disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                    提交仲裁
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Upload({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
