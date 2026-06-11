import { useState } from 'react';
import { agents } from '@/mock/data';
import { Phone, MapPin, Award, Building2, Clock, CheckCircle2, HourglassIcon, XCircle, ChevronDown, ChevronUp, Star } from 'lucide-react';

const agent = agents[0];

type S = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface Task {
  id: string; propertyTitle: string; clientName: string; scheduledAt: string; status: S;
  dispatchReason: string; propertyAddress: string; clientBudget: string;
  distanceScore: number; intentScore: number; transactionRateScore: number; totalScore: number;
  cancelReason?: string; feedback?: { stars: number; text: string };
}

const initTasks: Task[] = [
  { id: 't1', propertyTitle: '翠湖天地 雅苑', clientName: '王先生', scheduledAt: '2026-06-09 14:00', status: 'pending', dispatchReason: '客户意向区域与经纪人服务区域高度匹配', propertyAddress: '黄浦区顺昌路168号', clientBudget: '1000-1500万', distanceScore: 92, intentScore: 88, transactionRateScore: 90, totalScore: 90 },
  { id: 't2', propertyTitle: '绿地海珀', clientName: '赵女士', scheduledAt: '2026-06-09 16:30', status: 'pending', dispatchReason: '学区房专业匹配，需求与擅长领域一致', propertyAddress: '静安区北京西路1399号', clientBudget: '800-1200万', distanceScore: 85, intentScore: 91, transactionRateScore: 86, totalScore: 87 },
  { id: 't3', propertyTitle: '仁恒河滨花园', clientName: '陈先生', scheduledAt: '2026-06-09 10:00', status: 'confirmed', dispatchReason: '浦东区域专家，距离最近响应快', propertyAddress: '浦东新区陆家嘴环路1288号', clientBudget: '800-1000万', distanceScore: 95, intentScore: 82, transactionRateScore: 78, totalScore: 85 },
  { id: 't4', propertyTitle: '万科翡翠公园', clientName: '刘女士', scheduledAt: '2026-06-10 09:00', status: 'confirmed', dispatchReason: '豪宅资深经纪人，预算匹配度高', propertyAddress: '徐汇区龙腾大道2555号', clientBudget: '1500-2000万', distanceScore: 78, intentScore: 95, transactionRateScore: 93, totalScore: 89 },
  { id: 't5', propertyTitle: '翠湖天地 雅苑', clientName: '李先生', scheduledAt: '2026-06-08 10:00', status: 'completed', dispatchReason: '高端住宅专业匹配，转化率领先', propertyAddress: '黄浦区顺昌路168号', clientBudget: '1000-1500万', distanceScore: 90, intentScore: 87, transactionRateScore: 92, totalScore: 90, feedback: { stars: 5, text: '非常专业，讲解详细，对周边配套熟悉' } },
  { id: 't6', propertyTitle: '融创滨江壹号', clientName: '张女士', scheduledAt: '2026-06-07 15:00', status: 'completed', dispatchReason: '改善房推荐专家，交通便利', propertyAddress: '杨浦区大连路950号', clientBudget: '600-800万', distanceScore: 88, intentScore: 80, transactionRateScore: 85, totalScore: 84, feedback: { stars: 4, text: '服务态度好，房源准确，建议多推荐几套' } },
  { id: 't7', propertyTitle: '保利西岸', clientName: '孙先生', scheduledAt: '2026-06-06 11:00', status: 'cancelled', dispatchReason: '距离较近但客户临时变更需求', propertyAddress: '长宁区天山路767号', clientBudget: '400-600万', distanceScore: 72, intentScore: 65, transactionRateScore: 70, totalScore: 69, cancelReason: '客户因个人原因取消，已重新安排时间' },
];

const sCfg: Record<S, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: '待确认', color: 'bg-gold-100 text-gold-700', icon: <HourglassIcon className="w-3 h-3" /> },
  confirmed: { label: '进行中', color: 'bg-primary-50 text-primary-500', icon: <Clock className="w-3 h-3" /> },
  completed: { label: '已完成', color: 'bg-green-50 text-status-success', icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled: { label: '已取消', color: 'bg-red-50 text-status-danger', icon: <XCircle className="w-3 h-3" /> },
};

const tabs: { key: S; label: string }[] = [
  { key: 'pending', label: '待确认' },
  { key: 'confirmed', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];

function CreditRing({ score }: { score: number }) {
  const r = 36, c = 2 * Math.PI * r, p = (score / 100) * c;
  const stroke = score > 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
  const cls = score > 80 ? 'text-status-success' : score >= 60 ? 'text-status-warning' : 'text-status-danger';
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#E8EAED" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={stroke} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - p} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-lg font-bold ${cls}`}>{score}</span>
        <span className="text-[10px] text-surface-500">信用分</span>
      </div>
    </div>
  );
}

function FunnelChart() {
  const f = agent.conversionFunnel;
  const stages = [
    { label: '线索', value: f.leads, color: 'bg-primary-400' },
    { label: '带看', value: f.viewings, color: 'bg-primary-500' },
    { label: '意向', value: f.intentions, color: 'bg-gold-400' },
    { label: '成交', value: f.transactions, color: 'bg-gold-500' },
  ];
  const max = stages[0].value;
  return (
    <div className="space-y-2">
      {stages.map((s, i) => {
        const w = (s.value / max) * 100;
        const rate = i > 0 ? ((s.value / stages[i - 1].value) * 100).toFixed(1) : null;
        return (
          <div key={s.label} className="space-y-1">
            {rate && <div className="text-xs text-surface-400 text-center">↓ 转化率 {rate}%</div>}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex justify-center">
                <div className={`${s.color} rounded-md flex items-center justify-between px-3 py-2`} style={{ width: `${w}%` }}>
                  <span className="text-white text-sm font-medium">{s.label}</span>
                  <span className="text-white text-sm font-bold">{s.value}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-surface-500 w-16">{label}</span>
      <div className="flex-1 h-2 bg-surface-200 rounded-full"><div className={`h-2 ${color} rounded-full`} style={{ width: `${score}%` }} /></div>
      <span className="text-xs font-medium w-8 text-right">{score}</span>
    </div>
  );
}

export default function AgentWorkspace() {
  const [tasks, setTasks] = useState<Task[]>(initTasks);
  const [activeTab, setActiveTab] = useState<S>('pending');
  const [expandedId, setExpandedId] = useState('');
  const [toast, setToast] = useState('');

  const updateStatus = (id: string, status: S) => setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000); };
  const filtered = tasks.filter(t => t.status === activeTab);
  const cnt = (s: S) => tasks.filter(t => t.status === s).length;

  return (
    <div className="min-h-screen bg-surface-100 p-6">
      {toast && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-surface-800 text-white text-sm rounded-lg shadow-lg">{toast}</div>}
      <div className="max-w-7xl mx-auto flex gap-6">
        <div className="flex-[2] space-y-6">
          <div className="bg-surface-50 rounded-xl shadow-card p-6">
            <h2 className="text-lg font-bold text-primary-700 mb-4">数字名片</h2>
            <div className="flex gap-6">
              <img src={agent.avatar} alt={agent.name} className="w-20 h-20 rounded-full object-cover border-2 border-gold-300" />
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-xl font-bold text-primary-800">{agent.name}</h3>
                  <div className="flex items-center gap-1 text-surface-500 text-sm mt-1"><Building2 className="w-3.5 h-3.5" /><span>{agent.storeName}</span></div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {agent.specializations.map(s => <span key={s} className="px-2 py-0.5 text-xs rounded-full bg-primary-50 text-primary-600 border border-primary-200">{s}</span>)}
                </div>
                <div className="flex items-center gap-1 text-surface-500 text-sm"><MapPin className="w-3.5 h-3.5" /><span>服务区域：{agent.serviceAreas.join('、')}</span></div>
                <div className="flex items-center gap-1 text-surface-500 text-sm"><Phone className="w-3.5 h-3.5" /><span>{agent.phone}</span></div>
              </div>
              <CreditRing score={agent.creditScore} />
            </div>
            <div className="flex gap-4 mt-4 pt-4 border-t border-surface-200">
              <div className="flex items-center gap-1.5 text-sm"><Award className="w-4 h-4 text-gold-500" /><span className="text-surface-600">成交 <strong className="text-primary-700">{agent.totalTransactions}</strong> 套</span></div>
              <div className="flex items-center gap-1.5 text-sm"><CheckCircle2 className="w-4 h-4 text-status-success" /><span className="text-surface-600">带看 <strong className="text-primary-700">{agent.viewingsCompleted}</strong> 次</span></div>
            </div>
          </div>

          <div className="bg-surface-50 rounded-xl shadow-card p-6">
            <h2 className="text-lg font-bold text-primary-700 mb-4">带看任务</h2>
            <div className="flex gap-2 mb-4 flex-wrap">
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-3 py-1.5 text-sm rounded-full transition-colors ${activeTab === tab.key ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>
                  {tab.label}({cnt(tab.key)})
                </button>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-surface-400 text-sm">暂无{sCfg[activeTab].label}任务</div>
            ) : (
              <div className="space-y-3">
                {filtered.map(task => (
                  <div key={task.id} className="p-4 rounded-lg bg-white border border-surface-200 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-primary-800">{task.propertyTitle}</div>
                        <div className="text-xs text-surface-500 mt-1">客户：{task.clientName} · {task.scheduledAt}</div>
                        <div className="text-xs text-surface-400">{task.propertyAddress} · 预算 {task.clientBudget}</div>
                      </div>
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${sCfg[task.status].color}`}>{sCfg[task.status].icon}{sCfg[task.status].label}</span>
                    </div>
                    {task.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(task.id, 'confirmed')} className="px-3 py-1 text-sm rounded-md bg-green-500 text-white hover:bg-green-600">接单</button>
                        <button onClick={() => showToast('已转交')} className="px-3 py-1 text-sm rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300">转交</button>
                      </div>
                    )}
                    {task.status === 'confirmed' && (
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(task.id, 'completed')} className="px-3 py-1 text-sm rounded-md bg-gold-500 text-white hover:bg-gold-600">完成带看</button>
                        <button onClick={() => showToast('正在拨打客户电话...')} className="px-3 py-1 text-sm rounded-md border border-primary-300 text-primary-600 hover:bg-primary-50">联系客户</button>
                      </div>
                    )}
                    {task.status === 'completed' && task.feedback && (
                      <div className="bg-green-50 rounded-md p-3 space-y-1">
                        <div className="text-xs font-medium text-green-700">带看反馈</div>
                        <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= task.feedback!.stars ? 'text-gold-400 fill-gold-400' : 'text-gray-300'}`} />)}</div>
                        <div className="text-xs text-green-600">{task.feedback.text}</div>
                      </div>
                    )}
                    {task.status === 'cancelled' && task.cancelReason && (
                      <div className="bg-red-50 rounded-md p-3 text-xs text-red-600">{task.cancelReason}</div>
                    )}
                    <div>
                      <button onClick={() => setExpandedId(expandedId === task.id ? '' : task.id)} className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700">
                        派单依据 {expandedId === task.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      {expandedId === task.id && (
                        <div className="mt-2 space-y-2 p-3 bg-surface-50 rounded-md">
                          <ScoreBar label="距离匹配" score={task.distanceScore} color="bg-blue-400" />
                          <ScoreBar label="意向匹配" score={task.intentScore} color="bg-green-400" />
                          <ScoreBar label="成交匹配" score={task.transactionRateScore} color="bg-purple-400" />
                          <div className="flex items-center gap-2 pt-1 border-t border-surface-200">
                            <span className="text-xs text-surface-500 w-16">综合评分</span>
                            <span className="text-sm font-bold text-gold-500">{task.totalScore}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="bg-surface-50 rounded-xl shadow-card p-6">
            <h2 className="text-lg font-bold text-primary-700 mb-4">转化漏斗</h2>
            <FunnelChart />
            <div className="mt-4 pt-4 border-t border-surface-200 text-center">
              <div className="text-sm text-surface-500">整体转化率</div>
              <div className="text-2xl font-bold text-gold-500">{((agent.conversionFunnel.transactions / agent.conversionFunnel.leads) * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
