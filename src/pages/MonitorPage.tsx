import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import {
  ArrowLeft, Video, Play, Pause, Volume2, VolumeX, Maximize,
  Clock, CheckCircle2, Target, Gauge, AlertTriangle, FileImage,
  SkipForward, SkipBack, Trophy, Hash, Users, Activity
} from 'lucide-react';
import { getGame, TIER_LABEL_MAP } from '@/data/games';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid
} from 'recharts';

export default function MonitorPage() {
  const { id } = useParams();
  const order = useAppStore(s => s.getOrderById(id || ''));
  const getUserById = useAppStore(s => s.getUserById);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(42);
  const [speed, setSpeed] = useState(1);
  const [activeMilestone, setActiveMilestone] = useState(1);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setProgress(p => (p >= 100 ? 0 : +(p + 0.1 * speed).toFixed(2)));
    }, 100);
    return () => clearInterval(t);
  }, [playing, speed]);

  if (!order) {
    return (
      <div className="pt-32 pb-24 container text-center">
        <Link to="/orders" className="btn-primary inline-flex">
          <ArrowLeft className="w-4 h-4" /> 返回订单
        </Link>
      </div>
    );
  }

  const game = order.requirement ? getGame(order.requirement.gameCode) : null;
  const provider = getUserById(order.providerId);
  const milestones = order.milestones;

  const kdaData = milestones.filter(m => m.gameResult && m.gameResult !== 'N/A').map((m, i) => ({
    game: `G${i + 1}`,
    kill: 12 + Math.floor(Math.random() * 15),
    death: Math.floor(Math.random() * 6),
    assist: 8 + Math.floor(Math.random() * 12),
  }));

  const riskData = [
    { time: '00:00', anomaly: 0 }, { time: '15:00', anomaly: 0 }, { time: '30:00', anomaly: 1 },
    { time: '45:00', anomaly: 0 }, { time: '1:00', anomaly: 0 }, { time: '1:15', anomaly: 0 },
    { time: '1:30', anomaly: 0 }, { time: '1:45', anomaly: 2 }, { time: '2:00', anomaly: 0 },
  ];

  const currentDuration = `${Math.floor(progress * 1.8 / 60)}:${String(Math.floor(progress * 1.8) % 60).padStart(2, '0')}`;

  return (
    <div className="pt-28 pb-12 min-h-screen">
      <div className="container max-w-7xl">
        <Link to={`/order/${order.id}`} className="inline-flex items-center gap-2 text-sm text-night-400 hover:text-esports-300 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> 返回订单详情
        </Link>

        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="section-title text-2xl md:text-3xl">
                <Video className="w-7 h-7 inline-block mr-2 text-diamond-400" />
                履约监控台
              </h1>
              <span className="badge-base bg-diamond-500/15 text-diamond-400 border border-diamond-500/30 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-diamond-400 mr-1 animate-ping"/>
                LIVE 实时监控
              </span>
            </div>
            <div className="text-xs text-night-500 font-mono">
              订单 #{order.id} · {game?.name} · 服务商：{provider?.nickname}
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-esports-400" />
              <span className="text-night-400">进度</span>
              <span className="heading-display text-lg text-gradient-esports data-number">{order.progress}%</span>
            </div>
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gold-400" />
              <span className="text-night-400">胜率</span>
              <span className="heading-display text-lg text-gradient-gold data-number">
                {milestones.filter(m => m.gameResult === 'Win').length}/{Math.max(1, milestones.filter(m => m.gameResult && m.gameResult !== 'N/A').length)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-5">
            <div className="glass-card overflow-hidden">
              <div className="relative aspect-video bg-gradient-to-br from-night-900 via-night-950 to-night-900 overflow-hidden">
                <div className="absolute inset-0 grid-bg opacity-30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-7xl mb-4 opacity-60 animate-float">{game?.icon}</div>
                    <div className="heading-display text-3xl text-gradient-esports mb-2">游戏画面模拟</div>
                    <div className="text-sm text-night-500">SDK 实时采集画面 · {game?.name}</div>
                  </div>
                </div>

                <div className="absolute top-4 left-4 flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-lg bg-victory-red/90 text-white text-xs font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/>
                    REC {currentDuration}
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-night-900/80 backdrop-blur border border-white/10 text-xs text-night-200 flex items-center gap-1.5">
                    <Hash className="w-3 h-3 text-esports-400"/>
                    <code className="font-mono text-[10px]">
                      {order.evidence[0]?.hash.slice(0, 12)}...
                    </code>
                  </div>
                </div>

                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-night-900/80 backdrop-blur border border-white/10 text-xs text-diamond-400 flex items-center gap-1.5">
                    <Activity className="w-3 h-3"/>
                    FPS 稳定 144
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-night-950 via-night-950/60 to-transparent">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {milestones.map((m, i) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setActiveMilestone(i);
                            setProgress(Math.round((i + 1) * (100 / (milestones.length + 1))));
                          }}
                          className={`relative w-3 h-3 rounded-full transition-all ${
                            i === activeMilestone
                              ? 'bg-diamond-400 scale-150 shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                              : m.verified ? 'bg-victory-green' : 'bg-night-600'
                          }`}
                          title={m.description}
                          style={{ marginLeft: i === 0 ? 0 : 8 }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-night-700 mb-3 overflow-hidden cursor-pointer group"
                    onClick={e => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setProgress(Math.round(((e.clientX - rect.left) / rect.width) * 100));
                    }}
                  >
                    <div
                      className="h-full bg-gradient-diamond relative group-hover:brightness-110 transition-all"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"/>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setProgress(p => Math.max(0, p - 10))} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <SkipBack className="w-4 h-4"/>
                      </button>
                      <button onClick={() => setPlaying(p => !p)} className="w-9 h-9 rounded-full bg-gradient-esports flex items-center justify-center shadow-esports-glow">
                        {playing ? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4 ml-0.5"/>}
                      </button>
                      <button onClick={() => setProgress(p => Math.min(100, p + 10))} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <SkipForward className="w-4 h-4"/>
                      </button>
                      <button onClick={() => setMuted(m => !m)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        {muted ? <VolumeX className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}
                      </button>
                      <div className="h-4 w-20 rounded-full bg-night-700/50 overflow-hidden cursor-pointer ml-2">
                        <div className="h-full bg-gradient-diamond" style={{ width: muted ? 0 : '65%' }}/>
                      </div>
                      <div className="text-xs font-mono text-night-400 ml-2">
                        {currentDuration} / 3:00:00
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 p-1 rounded-lg bg-night-800/60">
                        {[0.5, 1, 1.5, 2].map(s => (
                          <button
                            key={s}
                            onClick={() => setSpeed(s)}
                            className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                              speed === s ? 'bg-esports-400/20 text-esports-300' : 'text-night-500 hover:text-night-200'
                            }`}
                          >{s}×</button>
                        ))}
                      </div>
                      <button className="p-1.5 rounded-lg hover:bg-white/10">
                        <Maximize className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="glass-card p-6">
                <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-gold-400"/>
                  KDA 表现趋势
                </h4>
                <div className="h-52">
                  <ResponsiveContainer>
                    <AreaChart data={kdaData}>
                      <defs>
                        <linearGradient id="g-k" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#A855F7" stopOpacity={0.4}/><stop offset="100%" stopColor="#A855F7" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="g-a" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.4}/><stop offset="100%" stopColor="#06B6D4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                      <XAxis dataKey="game" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false}/>
                      <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false}/>
                      <Tooltip contentStyle={{ background: '#1F1F2E', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12 }}/>
                      <Area type="monotone" dataKey="kill" stroke="#A855F7" strokeWidth={2.5} fill="url(#g-k)"/>
                      <Area type="monotone" dataKey="assist" stroke="#06B6D4" strokeWidth={2.5} fill="url(#g-a)"/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-5 text-xs mt-3">
                  <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-esports-400"/>击杀</span>
                  <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-diamond-400"/>助攻</span>
                </div>
              </div>

              <div className="glass-card p-6">
                <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-victory-red"/>
                  行为风控检测
                </h4>
                <div className="h-52">
                  <ResponsiveContainer>
                    <BarChart data={riskData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                      <XAxis dataKey="time" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false}/>
                      <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} domain={[0, 3]}/>
                      <Tooltip contentStyle={{ background: '#1F1F2E', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12 }}/>
                      <Bar dataKey="anomaly" fill="#EF4444" radius={[4, 4, 0, 0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 p-3 rounded-xl bg-victory-red/10 border border-victory-red/20 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-victory-red shrink-0 mt-0.5"/>
                  <div>
                    <span className="font-semibold text-victory-red-200">共检测到 3 次异常波动</span>
                    <span className="text-night-400"> · 暂未触发规则引擎告警</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="glass-card p-6">
              <h4 className="font-bold mb-4 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-victory-green"/>
                关键节点记录
              </h4>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {milestones.map((m, i) => {
                  const active = i === activeMilestone;
                  return (
                    <motion.button
                      key={m.id}
                      onClick={() => { setActiveMilestone(i); setProgress(Math.round((i + 1) * (100 / (milestones.length + 1)))); }}
                      className={`w-full text-left p-4 rounded-xl transition-all border ${
                        active
                          ? 'bg-gradient-to-r from-esports-500/20 to-diamond-500/10 border-esports-400/40 scale-[1.02]'
                          : 'bg-night-900/50 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          m.verified ? 'bg-gradient-victory text-white' : 'bg-night-700 text-night-400'
                        }`} style={m.verified ? { boxShadow: '0 0 16px rgba(16,185,129,0.4)' } : {}}>
                          <span className="font-bold text-sm">{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium leading-snug mb-1">{m.description}</div>
                          <div className="flex items-center gap-2 flex-wrap text-[10px] text-night-500 font-mono">
                            <Clock className="w-3 h-3"/>
                            {m.timestamp.slice(-8)}
                            {m.proofUrl && <FileImage className="w-3 h-3 text-diamond-400"/>}
                          </div>
                        </div>
                        {m.gameResult === 'Win' && <span className="status-success text-[10px] shrink-0">WIN</span>}
                        {m.gameResult === 'Loss' && <span className="status-dispute text-[10px] shrink-0">LOSS</span>}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="glass-card p-6 bg-gradient-to-br from-diamond-500/10 via-night-800/60 to-esports-500/10 border-diamond-500/20">
              <h4 className="font-bold mb-4 flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-diamond-400"/>
                完成度分析
              </h4>
              <div className="flex items-center justify-center mb-5 relative">
                <svg width="160" height="160" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8"/>
                  <motion.circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke="url(#dashG)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${order.progress * 2.64} 264`}
                    initial={{ strokeDasharray: '0 264' }}
                    animate={{ strokeDasharray: `${order.progress * 2.64} 264` }}
                    transform="rotate(-90 50 50)"
                  />
                  <defs>
                    <linearGradient id="dashG">
                      <stop offset="0%" stopColor="#06B6D4"/>
                      <stop offset="50%" stopColor="#A855F7"/>
                      <stop offset="100%" stopColor="#F59E0B"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="heading-display text-4xl text-gradient-gold">{order.progress}%</div>
                    <div className="text-[11px] text-night-400 mt-1">总体进度</div>
                  </div>
                </div>
              </div>
              <div className="space-y-2.5 text-sm">
                {[
                  { l: '预计剩余时间', v: `${Math.max(1, Math.ceil((100 - order.progress) / 10))} 小时`, c: 'text-esports-300' },
                  { l: '关键节点完成', v: `${milestones.filter(m => m.verified).length}/${milestones.length || 5}`, c: 'text-diamond-400' },
                  { l: '录屏存储量', v: `${(progress * 1.2).toFixed(1)} MB`, c: 'text-gold-400' },
                  { l: '风险评分', v: '低 (23/100)', c: 'text-victory-green' },
                ].map(s => (
                  <div key={s.l} className="flex items-center justify-between">
                    <span className="text-night-500 text-xs">{s.l}</span>
                    <span className={`font-semibold data-number ${s.c}`}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
