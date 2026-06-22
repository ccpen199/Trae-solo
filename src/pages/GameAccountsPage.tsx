import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency } from '@/utils';
import { GAMES } from '@/data/games';
import type { GameCode, TierRank } from '@/types';
import {
  Gamepad2, Plus, CheckCircle2, AlertCircle, RefreshCw,
  ShieldCheck, Link2, Camera, UserCheck, Trash2, ExternalLink, Star
} from 'lucide-react';
import { TierBadge3D } from '@/components/Badge3D';
import { TIER_LABEL_MAP } from '@/data/games';

export default function GameAccountsPage() {
  const currentUser = useAppStore(s => s.getCurrentUser());
  const accounts = useAppStore(s => s.gameAccounts.filter(a => a.userId === currentUser?.id));
  const [showAdd, setShowAdd] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState<string | null>(null);
  const [newAccount, setNewAccount] = useState({ game: 'LOL' as GameCode, uid: '' });

  const triggerVerify = (id: string) => {
    setVerifyLoading(id);
    setTimeout(() => setVerifyLoading(null), 1800);
  };

  return (
    <div className="pt-28 pb-24">
      <div className="container max-w-6xl">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <h1 className="section-title text-3xl md:text-4xl mb-2">
              <Gamepad2 className="w-8 h-8 inline-block mr-3 text-diamond-400"/>
              <span className="text-night-100">游戏账号</span>
              <span className="text-gradient-diamond"> 管理中心</span>
            </h1>
            <p className="text-night-400">对接主流游戏厂商开放平台，实名+段位双核验</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus className="w-4 h-4"/>
            绑定新账号
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { l: '已绑定账号', v: accounts.length, c: 'text-gradient-esports', i: Gamepad2 },
            { l: '已通过核验', v: accounts.filter(a => a.verified).length, c: 'text-gradient-gold', i: ShieldCheck },
            { l: '核验进行中', v: 0, c: 'text-diamond-400', i: RefreshCw },
            { l: '累计段位跃升', v: 12, c: 'text-victory-green', i: Star },
          ].map(s => (
            <div key={s.l} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <s.i className={`w-5 h-5 ${s.c.includes('gold') ? 'text-gold-400' : s.c.includes('emerald') ? 'text-emerald-400' : s.c.includes('diamond') ? 'text-diamond-400' : 'text-esports-400'}`}/>
              </div>
              <div className={`text-3xl font-bold heading-display data-number ${s.c}`}>{s.v}</div>
              <div className="text-xs text-night-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {accounts.length === 0 ? (
            <div className="md:col-span-2 glass-card p-16 text-center">
              <Gamepad2 className="w-16 h-16 mx-auto text-night-600 mb-4"/>
              <h3 className="text-xl font-bold mb-2">还没有绑定游戏账号</h3>
              <p className="text-night-400 mb-6 max-w-md mx-auto">
                绑定账号后可快速发布代练需求，平台通过厂商开放平台API核验段位真实性
              </p>
              <button onClick={() => setShowAdd(true)} className="btn-primary inline-flex">
                <Plus className="w-4 h-4"/> 立即绑定
              </button>
            </div>
          ) : accounts.map(a => {
            const game = GAMES.find(g => g.code === a.gameCode);
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                layout
                className="glass-card-hover p-6 relative overflow-hidden"
              >
                <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-esports-600/20 blur-[60px]" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-night-700 to-night-800 border border-white/10 flex items-center justify-center text-4xl">
                        {game?.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-xl mb-1">{game?.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-night-500 font-mono">
                          <Link2 className="w-3 h-3"/>
                          UID: {a.gameUid}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.verified ? (
                        <span className="cert-diamond">
                          <CheckCircle2 className="w-3 h-3"/>厂商核验通过
                        </span>
                      ) : (
                        <span className="status-pending">
                          <AlertCircle className="w-3 h-3"/>待核验
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-night-900/50 border border-white/5 flex items-center gap-5 mb-5">
                    <div className="flex justify-center"><TierBadge3D tier={a.currentTier as TierRank} size={72}/></div>
                    <div className="flex-1">
                      <div className="text-xs text-night-500 mb-1">当前段位</div>
                      <div className="heading-display text-2xl text-gradient-gold mb-1">{TIER_LABEL_MAP[a.currentTier]}</div>
                      <div className="text-[11px] text-night-400">
                        最近核验：{a.verifiedAt.slice(0, 10)}
                      </div>
                    </div>
                    <div className="text-right">
                      <button
                        onClick={() => triggerVerify(a.id)}
                        disabled={verifyLoading === a.id}
                        className="btn-secondary py-2 text-xs disabled:opacity-50"
                      >
                        {verifyLoading === a.id ? (
                          <><RefreshCw className="w-3 h-3 animate-spin"/>核验中</>
                        ) : (
                          <><ShieldCheck className="w-3 h-3"/>重新核验</>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-night-900/40 border border-white/5">
                      <div className="text-night-500 mb-1 text-[10px]">实名核验</div>
                      <div className="flex items-center justify-center gap-1 text-victory-green"><CheckCircle2 className="w-3.5 h-3.5"/>已通过</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-night-900/40 border border-white/5">
                      <div className="text-night-500 mb-1 text-[10px]">OCR识别</div>
                      <div className="flex items-center justify-center gap-1 text-victory-green"><Camera className="w-3.5 h-3.5"/>已通过</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-night-900/40 border border-white/5">
                      <div className="text-night-500 mb-1 text-[10px]">UID校验</div>
                      <div className="flex items-center justify-center gap-1 text-victory-green"><UserCheck className="w-3.5 h-3.5"/>匹配</div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                    <button className="btn-ghost text-xs text-night-500 hover:text-victory-red inline-flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5"/>解除绑定
                    </button>
                    <div className="flex gap-2">
                      <button className="btn-secondary py-2 text-xs">
                        <ExternalLink className="w-3 h-3"/>访问厂商
                      </button>
                      <button className="btn-primary py-2 text-xs">
                        <Plus className="w-3 h-3"/>以此账号发布需求
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg glass-card p-8"
          >
            <h3 className="heading-display text-2xl text-gradient-esports mb-6 flex items-center gap-2">
              <Gamepad2 className="w-6 h-6"/>
              绑定新游戏账号
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-night-300 mb-2 font-medium">选择游戏</label>
                <div className="grid grid-cols-3 gap-2">
                  {GAMES.map(g => (
                    <button
                      key={g.code}
                      onClick={() => setNewAccount(p => ({ ...p, game: g.code }))}
                      className={`p-3 rounded-xl text-center transition-all ${
                        newAccount.game === g.code
                          ? 'bg-esports-400/15 border-2 border-esports-400 scale-[1.02]'
                          : 'bg-night-900/60 border border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="text-2xl mb-1">{g.icon}</div>
                      <div className="text-xs font-medium">{g.name}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-night-300 mb-2 font-medium">游戏 UID / 召唤师名称</label>
                <input
                  value={newAccount.uid}
                  onChange={e => setNewAccount(p => ({ ...p, uid: e.target.value }))}
                  placeholder="请输入游戏内UID或召唤师名称"
                  className="input-base"
                />
              </div>
              <div className="p-4 rounded-2xl bg-diamond-500/10 border border-diamond-500/30 text-xs text-diamond-200 leading-relaxed">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5"/>
                  <div>
                    平台将通过<strong>游戏厂商开放平台 OAuth 授权</strong>核验账号真实性，
                    结合<strong>段位截图 OCR 智能识别</strong>与<strong>登录IP交叉验证</strong>，
                    三重重合校验确保账号归属真实有效。
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">取消</button>
                <button className="btn-primary flex-1">
                  <Link2 className="w-4 h-4"/>
                  前往厂商授权
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
