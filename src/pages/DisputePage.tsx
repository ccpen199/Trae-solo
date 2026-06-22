import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { DISPUTE_CATEGORIES } from '@/data/games';
import { formatBytes, shortenHash, getStatusLabel, getStatusClass } from '@/utils';
import type { DisputeSide } from '@/types';
import {
  ArrowLeft, Scale, AlertCircle, FileCheck, Upload, Check, Users,
  Clock, ShieldAlert, ChevronRight, User, MessageSquare, ThumbsUp,
  Swords, AlertTriangle, CheckCircle2, XCircle, Eye, Send
} from 'lucide-react';

export default function DisputePage() {
  const { id } = useParams();
  const listMode = !id;
  const getDisputeById = useAppStore(s => s.getDisputeById);
  const disputes = useAppStore(s => s.disputes);
  const currentUser = useAppStore(s => s.getCurrentUser());
  const getUserById = useAppStore(s => s.getUserById);
  const submitVote = useAppStore(s => s.submitVote);
  const resolveDispute = useAppStore(s => s.resolveDispute);

  const dispute = id ? getDisputeById(id) : null;
  const [vote, setVote] = useState<DisputeSide | null>(null);
  const [reason, setReason] = useState('');
  const [filter, setFilter] = useState<'all' | 'involved' | 'review'>('all');

  if (listMode) {
    const filtered = disputes.filter(d => {
      if (filter === 'involved') return d.initiatorId === currentUser?.id || d.respondentId === currentUser?.id;
      if (filter === 'review') return d.reviewers.includes(currentUser?.id || '');
      return true;
    });
    return (
      <div className="pt-28 pb-24">
        <div className="container max-w-5xl">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <h1 className="section-title text-3xl md:text-4xl mb-2">
                <Scale className="w-8 h-8 inline-block mr-3 text-victory-red" />
                <span className="text-night-100">争议</span>
                <span className="text-gradient-esports"> 仲裁中心</span>
              </h1>
              <p className="text-night-400">公正、透明、三方评审陪审团机制</p>
            </div>
          </div>
          <div className="flex gap-2 mb-6">
            {[
              { k: 'all', l: '全部争议', c: disputes.length },
              { k: 'involved', l: '我参与的', c: disputes.filter(d => d.initiatorId === currentUser?.id || d.respondentId === currentUser?.id).length },
              { k: 'review', l: '待我评审', c: disputes.filter(d => d.reviewers.includes(currentUser?.id || '')).length },
            ].map(t => (
              <button
                key={t.k}
                onClick={() => setFilter(t.k as typeof filter)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === t.k
                    ? 'bg-gradient-esports text-white shadow-esports-glow'
                    : 'glass-card text-night-300 hover:text-white'
                }`}
              >
                {t.l} <span className="opacity-70 ml-1 data-number">({t.c})</span>
              </button>
            ))}
          </div>
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="glass-card p-16 text-center">
                <div className="text-6xl mb-4">⚖️</div>
                <h3 className="text-xl font-bold mb-2">暂无争议</h3>
                <p className="text-night-400">当前筛选条件下暂无争议记录</p>
              </div>
            ) : filtered.map(d => {
              const cat = DISPUTE_CATEGORIES.find(c => c.key === d.reasonCategory);
              const ini = getUserById(d.initiatorId);
              const res = getUserById(d.respondentId);
              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  layout
                  className="glass-card-hover p-6"
                >
                  <div className="flex items-start justify-between gap-6 flex-wrap">
                    <div className="flex-1 min-w-[240px]">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-bold text-lg">争议 #{d.id}</h3>
                        <span className={getStatusClass(d.status === 'Resolved' ? 'Completed' : 'Disputed')}>
                          {d.status === 'Submitted' ? '证据收集中' : d.status === 'EvidenceGathering' ? '证据收集中' : d.status === 'Reviewing' ? '评审中' : d.status === 'Resolved' ? '已裁决' : d.status}
                        </span>
                        <span className="badge-base bg-victory-red/15 text-victory-red-200 border border-victory-red/30">
                          {cat?.label || d.reasonCategory}
                        </span>
                      </div>
                      <p className="text-sm text-night-300 mb-4 line-clamp-2 leading-relaxed">{d.description}</p>
                      <div className="flex items-center gap-4 text-xs text-night-500 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <img src={ini?.avatar} className="w-5 h-5 rounded-full" alt=""/>
                          <span className="text-night-300">{ini?.nickname}</span>
                          <span>发起</span>
                        </div>
                        <Swords className="w-3 h-3"/>
                        <div className="flex items-center gap-1.5">
                          <img src={res?.avatar} className="w-5 h-5 rounded-full" alt=""/>
                          <span className="text-night-300">{res?.nickname}</span>
                          <span>被诉</span>
                        </div>
                        <span>·</span>
                        <span>申请于 {d.createdAt.slice(0, 10)}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3"/>
                          {d.votes.length}/{d.reviewers.length} 已投票
                        </span>
                      </div>
                    </div>
                    <Link to={`/dispute/${d.id}`} className="btn-primary py-2.5 px-5 text-sm shrink-0">
                      查看详情
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="pt-32 pb-24 container">
        <Link to="/arbitration" className="btn-primary inline-flex">
          <ArrowLeft className="w-4 h-4" /> 返回列表
        </Link>
      </div>
    );
  }

  const cat = DISPUTE_CATEGORIES.find(c => c.key === dispute.reasonCategory);
  const initiator = getUserById(dispute.initiatorId);
  const respondent = getUserById(dispute.respondentId);
  const isReviewer = currentUser && dispute.reviewers.includes(currentUser.id);
  const votedVote = currentUser ? dispute.votes.find(v => v.reviewerId === currentUser.id) : null;

  const plaintiffVotes = dispute.votes.filter(v => v.votedFor === 'plaintiff').length;
  const defendantVotes = dispute.votes.filter(v => v.votedFor === 'defendant').length;
  const splitVotes = dispute.votes.filter(v => v.votedFor === 'split').length;
  const totalVotes = dispute.reviewers.length;

  const confirmVote = () => {
    if (!vote || !reason.trim() || !currentUser) return;
    submitVote(dispute.id, { reviewerId: currentUser.id, votedFor: vote, reason, votedAt: new Date().toISOString() });
    if (dispute.votes.length + 1 >= 3) {
      const win: DisputeSide = plaintiffVotes > defendantVotes ? 'plaintiff' : defendantVotes > plaintiffVotes ? 'defendant' : 'split';
      resolveDispute(dispute.id, {
        winner: win, refundRatio: win === 'plaintiff' ? 0.7 : win === 'defendant' ? 0 : 0.35,
        reason: '陪审团多数票裁决：' + (win === 'plaintiff' ? '原告证据充分' : win === 'defendant' ? '被告履约有效' : '双方各承担部分责任'),
        decidedAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="pt-28 pb-24">
      <div className="container max-w-7xl">
        <Link to="/arbitration" className="inline-flex items-center gap-2 text-sm text-night-400 hover:text-esports-300 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> 返回争议列表
        </Link>

        <div className="glass-card p-6 md:p-8 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl heading-display text-night-100">争议仲裁 #{dispute.id}</h1>
                <span className={getStatusClass(dispute.status === 'Resolved' ? 'Completed' : 'Disputed')}>
                  {dispute.status === 'Submitted' ? '证据收集中' : dispute.status === 'EvidenceGathering' ? '证据收集中' : dispute.status === 'Reviewing' ? '评审中' : '已裁决'}
                </span>
                <span className="badge-base bg-victory-red/15 text-victory-red-200 border border-victory-red/30 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3"/>
                  {cat?.label}
                </span>
              </div>
              <div className="text-xs text-night-500 font-mono">
                申请时间 {dispute.createdAt} · 关联订单 <Link to={`/order/${dispute.orderId}`} className="text-esports-400 hover:underline">#{dispute.orderId}</Link>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-night-400 mb-1">评审进度</div>
              <div className="heading-display text-2xl text-gradient-esports">
                {dispute.votes.length}<span className="text-lg text-night-500"> / {totalVotes}</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5 p-5 rounded-2xl bg-gradient-to-r from-victory-red/10 via-night-800/60 to-diamond-500/10 border border-white/5">
            {[
              { side: 'plaintiff' as const, name: initiator?.nickname, avatar: initiator?.avatar, role: '申请人（需求方）', count: plaintiffVotes, color: 'from-diamond-500/20 to-diamond-500/5 ring-diamond-400/40' },
              {
                side: 'split' as const, name: '分摊责任', avatar: '', role: '各承担部分责任', count: splitVotes,
                color: 'from-gold-500/20 to-gold-500/5 ring-gold-400/40',
                icon: <Scale className="w-8 h-8 text-gold-400"/>
              },
              { side: 'defendant' as const, name: respondent?.nickname, avatar: respondent?.avatar, role: '被申请人（供给方）', count: defendantVotes, color: 'from-victory-red/20 to-victory-red/5 ring-victory-red/40' },
            ].map(s => (
              <div key={s.side} className={`p-5 rounded-xl bg-gradient-to-br ${s.color} ring-1 relative overflow-hidden`}>
                <div className="flex items-center gap-3 mb-4">
                  {s.avatar ? (
                    <img src={s.avatar} className="w-12 h-12 rounded-xl ring-2 ring-white/10" alt=""/>
                  ) : <div className="w-12 h-12 rounded-xl bg-night-800/50 flex items-center justify-center ring-2 ring-white/10">{s.icon}</div>}
                  <div>
                    <div className="font-bold">{s.name}</div>
                    <div className="text-xs text-night-400">{s.role}</div>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-night-900/50 overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(s.count / totalVotes) * 100}%` }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className={`h-full ${s.side === 'plaintiff' ? 'bg-diamond-400' : s.side === 'defendant' ? 'bg-victory-red' : 'bg-gold-400'}`}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-night-500">得票</span>
                  <span className={`heading-display text-xl font-bold data-number ${s.side === 'plaintiff' ? 'text-diamond-400' : s.side === 'defendant' ? 'text-victory-red' : 'text-gold-400'}`}>
                    {s.count} 票
                  </span>
                </div>
                {dispute.verdict?.winner === s.side && (
                  <div className="mt-3 p-2 rounded-lg bg-victory-green/20 border border-victory-green/40 text-xs flex items-center gap-1.5 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5"/>
                    裁决胜诉
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {[
            { title: '申请人举证', side: 'plaintiff' as const, data: dispute.plaintiffEvidence, user: initiator, color: 'diamond', border: 'border-diamond-500/30' },
            { title: '被申请人举证', side: 'defendant' as const, data: dispute.defendantEvidence, user: respondent, color: 'red', border: 'border-victory-red/30' },
          ].map(side => (
            <div key={side.side} className={`glass-card p-6 border-t-4 ${side.border} relative`}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold flex items-center gap-2">
                  <MessageSquare className={`w-4 h-4 text-${side.color === 'red' ? 'victory-red' : 'diamond'}-400`}/>
                  {side.title}
                </h3>
                <div className="flex items-center gap-2">
                  <img src={side.user?.avatar} className="w-6 h-6 rounded-full" alt=""/>
                  <span className="text-sm text-night-300">{side.user?.nickname}</span>
                </div>
              </div>
              {side.data.length === 0 ? (
                <div className="text-center py-8 text-sm text-night-500 border-2 border-dashed border-night-700 rounded-2xl">
                  <Upload className="w-8 h-8 mx-auto mb-2 opacity-40"/>
                  暂未提交证据
                </div>
              ) : (
                <div className="space-y-3">
                  {side.data.map(e => (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-night-900/60 border border-white/5 flex items-start gap-3 hover:border-white/10 transition-all"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-${side.color === 'red' ? 'victory-red' : 'diamond'}-500/10 flex items-center justify-center shrink-0`}>
                        <FileCheck className={`w-5 h-5 text-${side.color === 'red' ? 'victory-red' : 'diamond'}-400`}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-sm">{e.title}</span>
                          <span className="text-[10px] text-night-500">{e.uploadedAt.slice(-8)}</span>
                        </div>
                        <div className="text-[11px] text-night-500 flex items-center gap-2 flex-wrap">
                          <code className="font-mono">SHA256: {shortenHash(e.hash, 6, 4)}</code>
                          {e.size && <span>· {formatBytes(e.size)}</span>}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button className="text-xs text-esports-400 hover:text-esports-300 inline-flex items-center gap-1">
                            <Eye className="w-3 h-3"/> 预览
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {isReviewer && !votedVote && !dispute.verdict && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 md:p-8 bg-gradient-to-br from-esports-500/10 via-night-800/60 to-gold-500/10 border-esports-400/30 relative overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-esports-600/20 blur-[80px]" />
            <div className="relative">
              <h3 className="heading-display text-xl text-gradient-esports mb-2 flex items-center gap-2">
                <ShieldAlert className="w-6 h-6"/>
                作为评审员投票
              </h3>
              <p className="text-sm text-night-400 mb-6 max-w-xl">
                请基于双方提供的证据链和陈述做出公正裁决。您的投票将决定平台最终裁决结果，3票以上多数胜。
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {[
                  { k: 'plaintiff' as const, l: '支持申请人', desc: '证据充分，全额/部分退款', c: 'diamond' },
                  { k: 'split' as const, l: '分摊责任', desc: '双方各承担部分责任', c: 'gold' },
                  { k: 'defendant' as const, l: '支持被申请人', desc: '履约有效，拒绝退款', c: 'red' },
                ].map(o => (
                  <button
                    key={o.k}
                    onClick={() => setVote(o.k)}
                    className={`p-5 rounded-2xl text-left transition-all relative ${
                      vote === o.k
                        ? `bg-gradient-to-br from-${o.c === 'red' ? 'victory-red' : o.c}-500/20 ring-2 ring-${o.c === 'red' ? 'victory-red' : o.c}-400 scale-[1.02] shadow-lg`
                        : 'bg-night-900/60 border border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className={`inline-flex items-center gap-2 text-xs badge-base mb-3 ${{
                      diamond: 'bg-diamond-500/15 text-diamond-400 border-diamond-500/30',
                      gold: 'bg-gold-500/15 text-gold-400 border-gold-500/30',
                      red: 'bg-victory-red/15 text-victory-red-200 border-victory-red/30',
                    }[o.c]}`}>
                      {o.k === vote && <Check className="w-3 h-3"/>}
                      {o.k !== vote && <User className="w-3 h-3"/>}
                      {o.l}
                    </div>
                    <div className="text-xs text-night-400">{o.desc}</div>
                  </button>
                ))}
              </div>
              <div className="grid md:grid-cols-[1fr_auto] gap-4 items-end">
                <div>
                  <label className="block text-sm text-night-300 mb-2 font-medium flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-esports-400"/>
                    裁决理由（必填，公开可见）
                  </label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    rows={3}
                    placeholder="请详细描述裁决依据，结合双方证据链进行说明..."
                    className="input-base resize-none"
                  />
                </div>
                <button
                  onClick={confirmVote}
                  disabled={!vote || !reason.trim()}
                  className="btn-primary px-8 py-4 text-base disabled:opacity-40 h-[60px]"
                >
                  <Send className="w-5 h-5"/>
                  提交裁决意见
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {isReviewer && votedVote && (
          <div className="glass-card p-6 bg-gradient-to-br from-emerald-500/10 to-diamond-500/10 border-emerald-500/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-victory flex items-center justify-center shrink-0" style={{ boxShadow: '0 0 30px rgba(16,185,129,0.5)' }}>
                <CheckCircle2 className="w-6 h-6 text-white"/>
              </div>
              <div>
                <h4 className="font-bold text-lg text-emerald-300 mb-1">您已完成投票</h4>
                <p className="text-sm text-night-300 mb-2">支持：
                  <span className={`data-number font-bold ${votedVote.votedFor === 'plaintiff' ? 'text-diamond-400' : votedVote.votedFor === 'defendant' ? 'text-victory-red' : 'text-gold-400'}`}>
                    {votedVote.votedFor === 'plaintiff' ? '申请人胜诉' : votedVote.votedFor === 'defendant' ? '被申请人胜诉' : '分摊责任'}
                  </span>
                  <span className="text-night-500 mx-2">·</span>
                  <span className="text-xs text-night-500">{votedVote.votedAt}</span>
                </p>
                <p className="text-sm text-night-400">理由：{votedVote.reason}</p>
              </div>
            </div>
          </div>
        )}

        {dispute.verdict && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 text-center bg-gradient-to-br from-night-900 via-esports-950/40 to-night-900 border-esports-400/30 relative overflow-hidden"
          >
            <div className="absolute inset-0 radial-glow" />
            <div className="relative">
              <Scale className="w-16 h-16 mx-auto text-gradient-gold mb-4"/>
              <h3 className="heading-display text-3xl text-gradient-gold mb-2">最终裁决结果</h3>
              <p className="text-sm text-night-400 mb-6">陪审团 {dispute.votes.length} 票一致裁决 · 不可上诉</p>
              <div className="max-w-2xl mx-auto text-left p-6 rounded-2xl bg-night-900/60 border border-white/5 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-night-400">胜诉方</span>
                    <span className={`font-bold heading-display text-xl data-number ${
                      dispute.verdict.winner === 'plaintiff' ? 'text-diamond-400'
                        : dispute.verdict.winner === 'defendant' ? 'text-victory-red'
                          : 'text-gold-400'
                    }`}>
                      {dispute.verdict.winner === 'plaintiff' ? '申请人（需求方）'
                        : dispute.verdict.winner === 'defendant' ? '被申请人（供给方）'
                          : '双方分摊责任'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-night-400">退款比例</span>
                    <span className="font-bold text-esports-300 data-number text-lg">{Math.round(dispute.verdict.refundRatio * 100)}%</span>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-night-600 to-transparent my-2"/>
                  <div className="text-xs text-night-300 leading-relaxed pt-2">
                    <span className="text-night-500 block mb-1">裁决说明：</span>
                    {dispute.verdict.reason}
                  </div>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-night-800/60 border border-white/5 text-xs text-night-400">
                <Clock className="w-3.5 h-3.5"/>
                裁决于 {dispute.verdict.decidedAt} · 即刻生效
              </div>
            </div>
          </motion.div>
        )}

        <div className="glass-card p-6 mt-6">
          <h4 className="font-bold mb-4 flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-esports-400"/>
            评审团成员
          </h4>
          <div className="flex flex-wrap gap-3">
            {dispute.reviewers.map((rid, i) => {
              const reviewer = getUserById(rid);
              const v = dispute.votes.find(x => x.reviewerId === rid);
              return (
                <div key={rid} className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-night-900/60 border transition-all ${v ? 'border-victory-green/30' : 'border-white/5'}`}>
                  <div className="relative">
                    <img src={reviewer?.avatar} className="w-10 h-10 rounded-xl" alt=""/>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-night-900 border-2 border-night-800 flex items-center justify-center text-[10px] font-bold text-esports-300">
                      {i + 1}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{reviewer?.nickname}</div>
                    <div className="text-[10px] text-night-500">
                      {v ? `已投票 · ${v.votedAt.slice(11, 16)}` : '待投票'}
                    </div>
                  </div>
                  {v && (
                    <ThumbsUp className={`w-4 h-4 ml-2 ${
                      v.votedFor === 'plaintiff' ? 'text-diamond-400' : v.votedFor === 'defendant' ? 'text-victory-red' : 'text-gold-400'
                    }`}/>
                  )}
                  {!v && <XCircle className="w-4 h-4 ml-2 text-night-600"/>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
