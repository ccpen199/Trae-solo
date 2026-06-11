import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, type TooltipProps
} from 'recharts';
import {
  Edit3, Heart, MessageCircle, Users, Trash2, Clock, Calendar, ChevronRight
} from 'lucide-react';
import { useProfileStore } from '@/store/useProfileStore';
import { useSessionStore } from '@/store/useSessionStore';
import { RISK_LEVEL_CONFIG, LIFE_EVENT_LABELS } from '@/types';
import type { SessionSummary } from '@/types';
import { DEMO_PROFILE, buildDemoEmotionTrends, buildDemoSessions } from '@/lib/demoData';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  scheduled: { label: '已预约', color: 'text-sky-500', bg: 'bg-sky-50' },
  completed: { label: '已完成', color: 'text-mint-500', bg: 'bg-mint-50' },
  cancelled: { label: '已取消', color: 'text-coral-500', bg: 'bg-coral-50' },
  in_progress: { label: '进行中', color: 'text-lavender-500', bg: 'bg-lavender-50' },
};

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-soft-lg border border-lavender-100 text-sm">
      <p className="text-slate-dark-500 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="font-medium" style={{ color: entry.color }}>
          {entry.dataKey === 'phq9_score' ? 'PHQ-9' : 'GAD-7'}：{entry.value}
        </p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { profile } = useProfileStore();
  const { sessions, setSessions, emotionTrends, setEmotionTrends, setCurrentSummary } = useSessionStore();
  const effectiveProfile = profile ?? DEMO_PROFILE;

  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [viewSummary, setViewSummary] = useState<SessionSummary | null>(null);
  const [, setViewSummaryLoading] = useState(false);

  const privacySettings = [
    { key: 'desensitize', label: '数据脱敏存储', defaultOn: true },
    { key: 'anonymous', label: '匿名等级：高', defaultOn: true },
    { key: 'counselorAccess', label: '允许咨询师查看档案摘要', defaultOn: true },
  ];
  const [privacyToggles, setPrivacyToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(privacySettings.map((s) => [s.key, s.defaultOn]))
  );

  useEffect(() => {
    fetch(`/api/emotion/trend?profileId=${effectiveProfile.id}&range=${range}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.length) {
          setEmotionTrends(json.data);
          return;
        }
        setEmotionTrends(buildDemoEmotionTrends(effectiveProfile.id, range));
      })
      .catch(() => {
        setEmotionTrends(buildDemoEmotionTrends(effectiveProfile.id, range));
      });

    fetch(`/api/sessions/history?profileId=${effectiveProfile.id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.length) {
          setSessions(json.data);
          return;
        }
        setSessions(buildDemoSessions(effectiveProfile.id));
      })
      .catch(() => {
        setSessions(buildDemoSessions(effectiveProfile.id));
      });
  }, [effectiveProfile.id, range, setEmotionTrends, setSessions]);

  const handleViewSummary = async (sessionId: string) => {
    setViewSummaryLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/summary`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setViewSummary(json.data);
          setCurrentSummary(json.data);
        }
      }
    } catch {
      setViewSummary({
        id: 'summary-demo',
        session_id: sessionId,
        emotion_state: '轻度焦虑',
        core_issues: ['工作压力与倦怠感', '人际关系中的边界模糊'],
        suggested_actions: ['每日进行10分钟正念冥想', '记录情绪日记识别压力源'],
        next_focus: '探索工作压力的具体来源，建立健康的情绪表达方式',
      });
    } finally {
      setViewSummaryLoading(false);
    }
  };

  const riskConf = RISK_LEVEL_CONFIG[effectiveProfile.risk_level] || RISK_LEVEL_CONFIG.low;

  const chartData = emotionTrends.map((t) => ({
    date: t.record_date.slice(5),
    phq9_score: Math.round(t.phq9_score),
    gad7_score: Math.round(t.gad7_score),
  }));

  const quickActions = [
    { icon: Heart, label: '继续倾诉', desc: '安全表达内心感受', to: '/vent' },
    { icon: Users, label: '匹配咨询师', desc: '找到适合你的专业支持', to: '/match' },
    { icon: MessageCircle, label: '咨询记录', desc: '回顾咨询历程与成长', to: '/dashboard' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        <div className="bg-white rounded-2xl p-6 shadow-soft flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-lavender-100 flex items-center justify-center shrink-0">
            <span className="text-lavender-600 text-xl font-serif">{effectiveProfile.anonymous_name[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif text-lg text-slate-dark font-medium">{effectiveProfile.anonymous_name}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${riskConf.bg} ${riskConf.color}`}>
                {riskConf.label}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-dark-400">
              <span>PHQ-9：<span className="text-lavender-600 font-medium">{effectiveProfile.phq9_score}</span></span>
              <span>GAD-7：<span className="text-coral-500 font-medium">{effectiveProfile.gad7_score}</span></span>
            </div>
          </div>
          <Link
            to="/profile"
            className="flex items-center gap-1 text-sm text-lavender-500 hover:text-lavender-600 transition-colors shrink-0"
          >
            <Edit3 size={14} />
            编辑档案
          </Link>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl text-lavender-600">情绪趋势</h2>
            <div className="flex items-center gap-1 bg-slate-dark-50 rounded-full p-1">
              {(['7d', '30d', '90d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    range === r ? 'bg-lavender-500 text-white' : 'text-slate-dark-400 hover:text-slate-dark-600'
                  }`}
                >
                  {r === '7d' ? '7天' : r === '30d' ? '30天' : '90天'}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-soft">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="lavenderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="coralGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FDA4AF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FDA4AF" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="phq9_score" stroke="#A78BFA" strokeWidth={2}
                  fill="url(#lavenderGrad)" dot={false} activeDot={{ r: 4, fill: '#A78BFA' }}
                />
                <Area
                  type="monotone" dataKey="gad7_score" stroke="#FDA4AF" strokeWidth={2}
                  fill="url(#coralGrad)" dot={false} activeDot={{ r: 4, fill: '#FDA4AF' }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-2 text-xs text-slate-dark-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-lavender rounded" /> PHQ-9
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-coral rounded" /> GAD-7
              </span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-serif text-2xl text-lavender-600 mb-4">咨询历史</h2>
          {sessions.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-soft text-center">
              <div className="w-16 h-16 rounded-full bg-lavender-50 flex items-center justify-center mx-auto mb-4">
                <Calendar size={28} className="text-lavender-300" />
              </div>
              <p className="text-slate-dark-400 mb-4">还没有咨询记录</p>
              <Link
                to="/match"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-lavender-500 text-white rounded-xl text-sm font-medium hover:bg-lavender-600 transition-colors"
              >
                <Users size={16} />
                开始匹配咨询师
              </Link>
            </div>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-lavender-100" />
              <div className="space-y-4">
                {sessions.map((session, idx) => {
                  const sc = statusConfig[session.status] || statusConfig.scheduled;
                  const scheduledDate = new Date(session.scheduled_at);
                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="relative"
                    >
                      <div className="absolute -left-6 top-4 w-3 h-3 rounded-full bg-lavender-400 border-2 border-white" />
                      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-soft hover:shadow-soft-md transition-shadow">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-slate-dark">{session.counselor_name}</span>
                              {session.counselor_tags?.map((tag) => (
                                <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-lavender-50 text-lavender-500">
                                  {LIFE_EVENT_LABELS[tag] || tag}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-dark-400">
                              <span className="flex items-center gap-1">
                                <Calendar size={13} />
                                {scheduledDate.toLocaleDateString('zh-CN')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={13} />
                                {scheduledDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {session.duration > 0 && (
                                <span>{session.duration}分钟</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}>
                              {sc.label}
                            </span>
                            {session.status === 'completed' && (
                              <button
                                onClick={() => handleViewSummary(session.id)}
                                className="flex items-center gap-0.5 text-xs text-lavender-500 hover:text-lavender-600 transition-colors"
                              >
                                摘要
                                <ChevronRight size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="font-serif text-2xl text-lavender-600 mb-4">隐私设置</h2>
            <div className="bg-white rounded-2xl p-5 shadow-soft space-y-4">
              {privacySettings.map((setting) => (
                <div key={setting.key} className="flex items-center justify-between">
                  <span className="text-sm text-slate-dark-700">{setting.label}</span>
                  <button
                    onClick={() =>
                      setPrivacyToggles((prev) => ({ ...prev, [setting.key]: !prev[setting.key] }))
                    }
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                      privacyToggles[setting.key] ? 'bg-lavender-500' : 'bg-slate-dark-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                        privacyToggles[setting.key] ? 'translate-x-5.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
              <div className="pt-3 border-t border-slate-dark-50">
                <button className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors">
                  <Trash2 size={15} />
                  注销账号
                </button>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-lavender-600 mb-4">快捷操作</h2>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.to}
                  className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-soft hover:shadow-soft-md transition-shadow group"
                >
                  <div className="w-11 h-11 rounded-xl bg-lavender-50 flex items-center justify-center shrink-0 group-hover:bg-lavender-100 transition-colors">
                    <action.icon size={20} className="text-lavender-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-dark">{action.label}</div>
                    <div className="text-xs text-slate-dark-400">{action.desc}</div>
                  </div>
                  <ChevronRight size={16} className="text-slate-dark-300 ml-auto shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {viewSummary && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setViewSummary(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-lavender-lg p-6 sm:p-8 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-serif text-2xl text-lavender-600">咨询摘要</h2>
            <div>
              <h3 className="text-sm font-medium text-slate-dark-500 mb-1.5">情绪状态</h3>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                RISK_LEVEL_CONFIG[viewSummary.emotion_state.includes('轻度') ? 'low' : 'medium']?.bg || 'bg-lavender-100'
              } ${
                RISK_LEVEL_CONFIG[viewSummary.emotion_state.includes('轻度') ? 'low' : 'medium']?.color || 'text-lavender-600'
              }`}>
                {viewSummary.emotion_state}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-dark-500 mb-1.5">核心议题</h3>
              <ul className="space-y-1">
                {viewSummary.core_issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-dark-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-lavender-400 mt-1.5 shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-dark-500 mb-1.5">建议行动</h3>
              <ol className="space-y-1">
                {viewSummary.suggested_actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-dark-700">
                    <span className="text-lavender-500 font-medium shrink-0">{i + 1}.</span>
                    {action}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-dark-500 mb-1.5">下次关注</h3>
              <div className="bg-lavender-50 rounded-xl px-4 py-3 text-sm text-lavender-700 leading-relaxed">
                {viewSummary.next_focus}
              </div>
            </div>
            <button
              onClick={() => setViewSummary(null)}
              className="w-full py-2.5 bg-slate-dark-50 text-slate-dark-600 rounded-xl text-sm font-medium hover:bg-slate-dark-100 transition-colors"
            >
              关闭
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
