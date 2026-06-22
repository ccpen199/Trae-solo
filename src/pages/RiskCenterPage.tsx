import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import {
  ShieldAlert, Activity, AlertTriangle, Fingerprint,
  Eye, TrendingUp, CheckCircle2, XCircle, Search, Filter,
  Users, Clock, Cpu, Ban, PieChart as PieIcon, Smartphone, Network, Info
} from 'lucide-react';
import {
  ResponsiveContainer, Area, AreaChart,
  XAxis, YAxis, CartesianGrid, BarChart, Bar, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip
} from 'recharts';

const riskRadar = [
  { subject: '设备一致性', A: 92, fullMark: 100 },
  { subject: '行为序列', A: 78, fullMark: 100 },
  { subject: '地址稳定', A: 88, fullMark: 100 },
  { subject: '交易频率', A: 65, fullMark: 100 },
  { subject: '社交关系', A: 95, fullMark: 100 },
  { subject: '历史信誉', A: 90, fullMark: 100 },
];

export default function RiskCenterPage() {
  const events = useAppStore(s => s.riskEvents);
  const risk = useAppStore(s => s.riskScore);
  const [tab, setTab] = useState<'overview' | 'device' | 'behavior' | 'rules'>('overview');
  const [search, setSearch] = useState('');

  const mockAlerts = [
    { id: 'a1', user: '上分小哥哥', userId: 'u001', type: '设备异常', level: 'High' as const, reason: '检测到异地登录（IP归属北京，常用地上海）', time: '3分钟前' },
    { id: 'a2', user: '测试用户B', userId: 'u012', type: '刷单嫌疑', level: 'High' as const, reason: '10分钟内连续下单3次，收货地址高度重合', time: '22分钟前' },
    { id: 'a3', user: '小玩家X', userId: 'u034', type: '行为序列', level: 'Medium' as const, reason: '鼠标轨迹模拟度 89.6%，疑似脚本操作', time: '1小时前' },
    { id: 'a4', user: '新用户9527', userId: 'u099', type: '新号风险', level: 'Medium' as const, reason: '注册24h内充值 > ¥2000，触发新号风控', time: '2小时前' },
    { id: 'a5', user: '代练师F', userId: 'u044', type: '账号共享', level: 'Medium' as const, reason: '同设备24h内登录5个不同账号', time: '4小时前' },
    { id: 'a6', user: '玩家K', userId: 'u078', type: '正常', level: 'Low' as const, reason: '常规登录，无异常', time: '5小时前' },
  ];

  return (
    <div className="pt-12 pb-24">
      <div className="container max-w-7xl">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <h1 className="section-title text-3xl md:text-4xl mb-2">
              <ShieldAlert className="w-8 h-8 inline-block mr-3 text-victory-red" />
              <span className="text-night-100">风控</span>
              <span className="text-gradient-esports"> 运营中心</span>
            </h1>
            <p className="text-night-400">设备指纹 + 行为序列 + 关联网络，全方位反刷单</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-night-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="用户/设备/IP..." className="input-base pl-11 py-2.5 w-60" />
            </div>
            <button className="btn-secondary py-2.5 px-5 text-sm">
              <Filter className="w-4 h-4" /> 筛选
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { l: '今日拦截', v: 87, sub: '较昨日 +12', c: 'text-victory-red', i: Ban },
            { l: '高风险账户', v: 24, sub: '待人工审核', c: 'text-gold-400', i: AlertTriangle },
            { l: '在线设备', v: 1024, sub: '已识别', c: 'text-diamond-400', i: Smartphone },
            { l: '综合等级', v: risk.riskLevel, sub: `指纹 ${risk.deviceFingerprint.slice(0, 10)}`, c: 'text-victory-green', i: ShieldAlert },
          ].map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass-card p-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${i === 0 ? 'bg-victory-red/15 text-victory-red' : i === 1 ? 'bg-gold-500/15 text-gold-400' : i === 2 ? 'bg-diamond-500/15 text-diamond-400' : 'bg-victory-green/15 text-emerald-400'}`}>
                  <s.i className="w-5 h-5" />
                </div>
                <TrendingUp className="w-4 h-4 text-night-500" />
              </div>
              <div className={`heading-display text-4xl data-number font-bold ${s.c}`}>{s.v}</div>
              <div className="text-sm text-night-300 mt-1 mb-0.5">{s.l}</div>
              <div className="text-[11px] text-night-500 font-mono">{s.sub}</div>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-1 mb-6 p-1 rounded-xl glass-card w-fit overflow-x-auto max-w-full">
          {[
            { k: 'overview', l: '风险总览', i: Activity },
            { k: 'device', l: '设备指纹', i: Fingerprint },
            { k: 'behavior', l: '行为分析', i: Cpu },
            { k: 'rules', l: '规则引擎', i: Network },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k as typeof tab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.k ? 'bg-gradient-esports text-white shadow-esports-glow' : 'text-night-400 hover:text-night-100 hover:bg-white/5'
              }`}>
              <t.i className="w-4 h-4" />
              {t.l}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-esports-400" />
                    24小时风险事件趋势
                  </h3>
                  <span className="text-xs text-night-500">每4小时</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer>
                    <AreaChart data={events}>
                      <defs>
                        <linearGradient id="ra1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EF4444" stopOpacity={0.35} /><stop offset="100%" stopColor="#EF4444" stopOpacity={0} /></linearGradient>
                        <linearGradient id="ra2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} /><stop offset="100%" stopColor="#F59E0B" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="time" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} />
                      <Tooltip contentStyle={{ background: '#1F1F2E', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12 }} />
                      <Area type="monotone" dataKey="anomalyCount" name="异常" stroke="#EF4444" strokeWidth={2.5} fill="url(#ra1)" />
                      <Area type="monotone" dataKey="blockCount" name="拦截" stroke="#F59E0B" strokeWidth={2} fill="url(#ra2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="font-bold mb-5 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-victory-red" />
                  实时预警列表
                </h3>
                <div className="space-y-3">
                  {mockAlerts.filter(a => !search || a.user.includes(search)).map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-4 rounded-xl border transition-all ${
                        a.level === 'High' ? 'bg-victory-red/8 border-victory-red/30' : a.level === 'Medium' ? 'bg-gold-500/10 border-gold-500/30' : 'bg-victory-green/8 border-victory-green/30'
                      }`}>
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-start gap-3 flex-1 min-w-[260px]">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            a.level === 'High' ? 'bg-victory-red/15 text-victory-red animate-pulse' : a.level === 'Medium' ? 'bg-gold-500/15 text-gold-400' : 'bg-victory-green/15 text-emerald-400'
                          }`}>
                            {a.level === 'Low' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4 animate-pulse" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-sm">{a.user}</span>
                              <span className={`text-[10px] badge-base ${a.level === 'High' ? 'bg-victory-red/15 text-victory-red-200 border-victory-red/30' : a.level === 'Medium' ? 'bg-gold-500/15 text-gold-300 border-gold-500/30' : 'bg-victory-green/15 text-emerald-300 border-victory-green/30'}`}>
                                {a.type}
                              </span>
                              <span className="text-[10px] text-night-500 ml-auto font-mono">#{a.userId}</span>
                            </div>
                            <p className="text-xs text-night-300 leading-snug">{a.reason}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-night-500 flex items-center gap-1"><Clock className="w-3 h-3" />{a.time}</span>
                          <button className="p-2 rounded-lg bg-night-900/60 border border-white/10 hover:border-esports-400/30"><Eye className="w-4 h-4 text-night-400" /></button>
                          <button className="p-2 rounded-lg bg-victory-red/10 border border-victory-red/30 hover:bg-victory-red/20"><XCircle className="w-4 h-4 text-victory-red" /></button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-gold-400" />
                  多维度风险画像
                </h3>
                <div className="h-64">
                  <ResponsiveContainer>
                    <RadarChart data={riskRadar}>
                      <PolarGrid stroke="rgba(168,85,247,0.2)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <PolarRadiusAxis tick={{ fill: '#64748B', fontSize: 10 }} />
                      <Radar dataKey="A" stroke="#A855F7" fill="#A855F7" fillOpacity={0.35} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-diamond-400" />
                  设备指纹信息
                </h3>
                <div className="space-y-2.5 text-sm">
                  {[
                    { l: '指纹ID', v: risk.deviceFingerprint, c: 'text-esports-300' },
                    { l: '风险等级', v: risk.riskLevel, c: risk.riskLevel === 'Low' ? 'text-victory-green' : 'text-gold-400' },
                    { l: '异常标记', v: risk.anomalyFlags.length || '无', c: 'text-night-200' },
                    { l: '登录地点', v: '上海 · 浦东', c: 'text-night-200' },
                    { l: '最近检测', v: risk.lastCheck, c: 'text-night-400 font-mono text-xs' },
                  ].map(row => (
                    <div key={row.l} className="flex items-center justify-between py-2 border-b border-white/5">
                      <span className="text-night-400 text-xs">{row.l}</span>
                      <span className={`text-xs data-number ${row.c} font-mono`}>{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-esports-400" />
                  关联用户分布
                </h3>
                <div className="h-48">
                  <ResponsiveContainer>
                    <BarChart data={[
                      { n: '正常用户', v: 892 }, { n: '新注册', v: 128 }, { n: '待审核', v: 34 }, { n: '高风险', v: 18 },
                    ]}>
                      <CartesianGrid strokeDasharray="3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="n" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} />
                      <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} />
                      <Tooltip contentStyle={{ background: '#1F1F2E', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12 }} />
                      <Bar dataKey="v" radius={[6, 6, 0, 0]}>
                        {[
                          { fill: '#10B981' },
                          { fill: '#06B6D4' },
                          { fill: '#F59E0B' },
                          { fill: '#EF4444' },
                        ].map((c, i) => (
                          <rect key={i} data-index={i} fill={c.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'device' && (
          <div className="glass-card p-8 text-center">
            <Fingerprint className="w-16 h-16 mx-auto text-diamond-400 mb-4 opacity-60" />
            <h3 className="text-xl font-bold mb-2">设备指纹分析</h3>
            <p className="text-night-400 mb-8 max-w-md mx-auto">
              基于 Canvas指纹 + WebGL + AudioContext + 字体 + 时区综合计算
            </p>
            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { t: 'Canvas指纹', d: '99.2%', s: '唯一识别率' },
                { t: '跨Session稳定', d: '98.7%', s: '30天重合度' },
                { t: '对抗伪装识别', d: '97.1%', s: '伪装检测率' },
              ].map(x => (
                <div key={x.t} className="p-6 rounded-2xl bg-night-900/60 border border-white/5">
                  <div className="heading-display text-3xl text-gradient-diamond mb-1">{x.d}</div>
                  <div className="text-xs text-night-400">{x.t}</div>
                  <div className="text-[10px] text-night-500">{x.s}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'behavior' && (
          <div className="glass-card p-8 text-center">
            <Cpu className="w-16 h-16 mx-auto text-esports-400 mb-4 opacity-60" />
            <h3 className="text-xl font-bold mb-2">行为序列分析</h3>
            <p className="text-night-400 mb-8 max-w-md mx-auto">
              鼠标移动轨迹 + 键盘间隔 + 点击热力图 + 停留时长综合建模
            </p>
            <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
              {[
                { t: '鼠标轨迹模拟检测', v: '89.6%', d: '模拟度', c: 'text-gold-400' },
                { t: '点击间隔方差', v: '432ms', d: '均值', c: 'text-diamond-400' },
                { t: '页面停留模式', v: '正常', d: '熵值 3.8', c: 'text-victory-green' },
                { t: '脚本概率', v: '低', d: '置信度 92%', c: 'text-esports-400' },
              ].map(x => (
                <div key={x.t} className="p-5 rounded-2xl bg-night-900/60 border border-white/5">
                  <div className="text-xs text-night-500 mb-1">{x.t}</div>
                  <div className={`heading-display text-2xl data-number font-bold ${x.c} mb-0.5`}>{x.v}</div>
                  <div className="text-[10px] text-night-400">{x.d}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'rules' && (
          <div className="glass-card p-8 text-center">
            <Info className="w-16 h-16 mx-auto text-gold-400 mb-4 opacity-60" />
            <h3 className="text-xl font-bold mb-2">风控规则引擎</h3>
            <p className="text-night-400 mb-8">28条实时规则 + 3套关联图谱模型</p>
            <div className="max-w-3xl mx-auto text-left space-y-3">
              {[
                { n: 'R001 新注册24h内', c: 'Medium', d: '新号大额交易', act: '人工复核' },
                { n: 'R002 设备多账号登录', c: 'High', d: '同设备≥5个号/24h', act: '强制下线' },
                { n: 'R003 异常大金额', c: 'Medium', d: '单笔>¥2000 需人脸', act: '触发验证' },
                { n: 'R004 刷单关联网络', c: 'High', d: '收货/地址重合度>0.8', act: '冻结' },
              ].map(r => (
                <div key={r.n} className="flex items-center gap-4 p-4 rounded-xl bg-night-900/60 border border-white/5">
                  <div className="font-mono text-xs text-night-500 min-w-[120px]">{r.n}</div>
                  <div className="flex-1">
                    <div className="text-sm">{r.d}</div>
                    <div className="text-[11px] text-night-500">触发动作：<span className="text-victory-red">{r.act}</span></div>
                  </div>
                  <span className={`badge-base ${r.c === 'High' ? 'bg-victory-red/15 text-victory-red border-victory-red/30' : 'bg-gold-500/15 text-gold-400 border-gold-500/30'}`}>{r.c}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
