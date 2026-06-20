import { useEffect, useState } from 'react';
import {
  Shield, Search, Filter, CheckCircle, XCircle, Award, Plus, Minus,
  ChevronDown, ChevronUp, User, Briefcase, Clock, AlertCircle, X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Worker, CreditDistribution, PerformanceRecord } from '@shared/types';
import { cn } from '@/lib/utils';

interface CreditRecord { id: string; date: string; type: 'add' | 'deduct'; score: number; reason: string; operator: string; }

interface WorkerExt extends Worker {
  creditRecords?: CreditRecord[];
}

const mockWorkers: WorkerExt[] = [
  { id: 'W001', name: '陈建国', phone: '138****1234', avatar: '', idCardVerified: true, gender: 'male', age: 32,
    skills: [{ name: '电子装配', issuer: '人社局', certifiedAt: '2023-05-10' }, { name: '电焊操作', issuer: '安监局', certifiedAt: '2024-01-20' }],
    performanceHistory: [
      { factoryId: 'F001', factoryName: '富士康科技', jobId: 'J001', jobTitle: '电子装配工', startDate: '2025-09-01', endDate: '2026-01-15', daysWorked: 120, leaveType: 'normal', leaveReason: '春节返乡' },
      { factoryId: 'F002', factoryName: '立讯精密', jobId: 'J002', jobTitle: '品检员', startDate: '2026-02-20', daysWorked: 115 },
    ],
    creditScore: 92, currentLocation: { lat: 31.2, lng: 120.7, region: '苏州' }, status: 'employed', createdAt: '2025-08-01',
    creditRecords: [
      { id: 'c1', date: '2026-06-10', type: 'add', score: 3, reason: '提前到岗，表现优秀', operator: '经纪人张伟' },
      { id: 'c2', date: '2026-05-25', type: 'add', score: 5, reason: '完整履约4个月，按时在岗', operator: '系统' },
      { id: 'c3', date: '2026-04-12', type: 'deduct', score: 2, reason: '面试迟到30分钟', operator: '经纪人李娜' },
      { id: 'c4', date: '2026-03-01', type: 'add', score: 2, reason: '身份认证完成', operator: '系统' },
    ]
  },
  { id: 'W002', name: '刘美丽', phone: '139****5678', avatar: '', idCardVerified: true, gender: 'female', age: 28,
    skills: [{ name: '质量检验', issuer: 'ISO认证中心', certifiedAt: '2023-08-15' }],
    performanceHistory: [
      { factoryId: 'F002', factoryName: '立讯精密', jobId: 'J002', jobTitle: '品检员', startDate: '2025-11-01', endDate: '2026-05-30', daysWorked: 180, leaveType: 'normal', leaveReason: '合同到期' },
    ],
    creditScore: 88, currentLocation: { lat: 31.3, lng: 120.9, region: '昆山' }, status: 'idle', createdAt: '2025-10-15',
    creditRecords: [
      { id: 'c1', date: '2026-06-01', type: 'add', score: 8, reason: '完成6个月履约，无投诉', operator: '系统' },
      { id: 'c2', date: '2026-03-15', type: 'add', score: 2, reason: '推荐优质工人入职', operator: '系统' },
    ]
  },
  { id: 'W003', name: '王志强', phone: '137****9012', avatar: '', idCardVerified: true, gender: 'male', age: 35,
    skills: [{ name: '叉车驾驶', issuer: '质监局', certifiedAt: '2022-06-01' }, { name: '仓储管理', issuer: '物流协会', certifiedAt: '2023-11-10' }],
    performanceHistory: [
      { factoryId: 'F003', factoryName: '顺丰仓储', jobId: 'J003', jobTitle: '叉车司机', startDate: '2026-01-10', daysWorked: 140 },
    ],
    creditScore: 76, currentLocation: { lat: 31.1, lng: 121.2, region: '上海' }, status: 'employed', createdAt: '2025-12-20',
    creditRecords: [
      { id: 'c1', date: '2026-05-20', type: 'deduct', score: 5, reason: '旷工1天，未提前请假', operator: '工厂HR' },
      { id: 'c2', date: '2026-04-05', type: 'add', score: 3, reason: '大促期间加班支持', operator: '经纪人王磊' },
    ]
  },
  { id: 'W004', name: '张秀兰', phone: '136****3456', avatar: '', idCardVerified: true, gender: 'female', age: 40,
    skills: [],
    performanceHistory: [
      { factoryId: 'F004', factoryName: '宝洁日化', jobId: 'J004', jobTitle: '包装工', startDate: '2026-03-01', endDate: '2026-05-20', daysWorked: 65, leaveType: 'abnormal', leaveReason: '不告而别' },
    ],
    creditScore: 54, currentLocation: { lat: 30.3, lng: 120.2, region: '杭州' }, status: 'resigned', createdAt: '2026-02-10',
    creditRecords: [
      { id: 'c1', date: '2026-05-22', type: 'deduct', score: 20, reason: '异常离职，未办理手续', operator: '系统' },
      { id: 'c2', date: '2026-04-18', type: 'deduct', score: 3, reason: '与工友发生口角', operator: '工厂主管' },
    ]
  },
  { id: 'W005', name: '李海峰', phone: '135****7890', avatar: '', idCardVerified: true, gender: 'male', age: 30,
    skills: [{ name: 'CNC操作', issuer: '机械工程学会', certifiedAt: '2021-03-20' }, { name: '模具维修', issuer: '行业协会', certifiedAt: '2022-09-15' }, { name: '机械识图', issuer: '培训中心', certifiedAt: '2020-12-01' }],
    performanceHistory: [
      { factoryId: 'F005', factoryName: '比亚迪汽车', jobId: 'J005', jobTitle: 'CNC操作员', startDate: '2025-07-01', daysWorked: 280 },
    ],
    creditScore: 95, currentLocation: { lat: 30.2, lng: 120.5, region: '杭州' }, status: 'employed', createdAt: '2025-06-15',
    creditRecords: [
      { id: 'c1', date: '2026-06-15', type: 'add', score: 5, reason: '获得工厂月度优秀员工', operator: '工厂HR' },
      { id: 'c2', date: '2026-05-01', type: 'add', score: 10, reason: '连续在岗满10个月', operator: '系统' },
    ]
  },
  { id: 'W006', name: '周桂英', phone: '134****1122', avatar: '', idCardVerified: false, gender: 'female', age: 42,
    skills: [],
    performanceHistory: [
      { factoryId: 'F006', factoryName: '申洲针织', jobId: 'J006', jobTitle: '缝纫工', startDate: '2026-04-01', daysWorked: 55 },
    ],
    creditScore: 62, currentLocation: { lat: 29.9, lng: 121.8, region: '宁波' }, status: 'interviewing', createdAt: '2026-03-20',
    creditRecords: [
      { id: 'c1', date: '2026-05-30', type: 'deduct', score: 3, reason: '培训签到迟到', operator: '经纪人赵敏' },
    ]
  },
  { id: 'W007', name: '赵小飞', phone: '133****3344', avatar: '', idCardVerified: true, gender: 'male', age: 25,
    skills: [],
    performanceHistory: [
      { factoryId: 'F007', factoryName: '某电子厂', jobId: 'J007', jobTitle: '流水线工', startDate: '2026-03-10', endDate: '2026-03-15', daysWorked: 3, leaveType: 'fired', leaveReason: '打架斗殴' },
    ],
    creditScore: 35, currentLocation: { lat: 31.5, lng: 120.3, region: '无锡' }, status: 'resigned', createdAt: '2026-02-28',
    creditRecords: [
      { id: 'c1', date: '2026-03-16', type: 'deduct', score: 40, reason: '严重违纪，打架斗殴被开除', operator: '平台管理员' },
    ]
  },
];

function getScoreColor(score: number) {
  if (score >= 85) return 'text-success-600 bg-success-50';
  if (score >= 70) return 'text-blue-600 bg-blue-50';
  if (score >= 55) return 'text-warning-600 bg-warning-50';
  if (score >= 40) return 'text-orange-600 bg-orange-50';
  return 'text-danger-600 bg-danger-50';
}

function getScoreGrade(score: number) {
  if (score >= 85) return { label: '优秀', cls: 'bg-success-500' };
  if (score >= 70) return { label: '良好', cls: 'bg-blue-500' };
  if (score >= 55) return { label: '一般', cls: 'bg-warning-500' };
  if (score >= 40) return { label: '较差', cls: 'bg-orange-500' };
  return { label: '危险', cls: 'bg-danger-500' };
}

function CreditGauge({ score, size = 180 }: { score: number; size?: number }) {
  const radius = (size - 30) / 2;
  const circumference = Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const grade = getScoreGrade(score);
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size / 2 + 40 }}>
      <svg width={size} height={size / 2 + 20} className="overflow-visible">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="25%" stopColor="#FF7A00" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="75%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <path d={`M ${15} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 15} ${size / 2}`} stroke="#E2E8F0" strokeWidth="16" fill="none" strokeLinecap="round" />
        <path d={`M ${15} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 15} ${size / 2}`} stroke="url(#gaugeGrad)" strokeWidth="16" fill="none" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center">
        <div className="text-4xl font-bold text-gray-900 leading-none">{score}</div>
        <span className={cn('mt-1.5 badge text-white', grade.cls)}>{grade.label}</span>
      </div>
    </div>
  );
}

export default function CreditScoreMgmt() {
  const [workers, setWorkers] = useState<WorkerExt[]>([]);
  const [creditDist, setCreditDist] = useState<CreditDistribution | null>(null);
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adjustModal, setAdjustModal] = useState<{ worker: WorkerExt; type: 'add' | 'deduct' } | null>(null);
  const [adjustScore, setAdjustScore] = useState(5);
  const [adjustReason, setAdjustReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/workers').then(r => r.json()).catch(() => ({ success: false })),
      fetch('/api/workers/credit-distribution').then(r => r.json()).catch(() => ({ success: false })),
    ]).then(([wRes, cdRes]) => {
      if (wRes.success && wRes.data.length > 0) setWorkers(wRes.data.map((w: Worker) => ({ ...w, creditRecords: mockWorkers.find(mw => mw.id === w.id)?.creditRecords || [] })));
      else setWorkers(mockWorkers);
      if (cdRes.success) setCreditDist(cdRes.data);
      setLoading(false);
    });
  }, []);

  const filteredWorkers = workers.filter(w => {
    if (search && !w.name.includes(search) && !w.phone.includes(search)) return false;
    if (scoreFilter) {
      if (scoreFilter === 'excellent' && w.creditScore < 85) return false;
      if (scoreFilter === 'good' && (w.creditScore < 70 || w.creditScore >= 85)) return false;
      if (scoreFilter === 'fair' && (w.creditScore < 55 || w.creditScore >= 70)) return false;
      if (scoreFilter === 'poor' && (w.creditScore < 40 || w.creditScore >= 55)) return false;
      if (scoreFilter === 'veryPoor' && w.creditScore >= 40) return false;
    }
    return true;
  }).sort((a, b) => b.creditScore - a.creditScore);

  const avgScore = workers.length ? Math.round(workers.reduce((s, w) => s + w.creditScore, 0) / workers.length) : 0;

  const histogramData = creditDist?.ranges?.length ? creditDist.ranges.map(r => ({ range: r.label, count: r.count })) : [
    { range: '0-40', count: workers.filter(w => w.creditScore < 40).length },
    { range: '40-55', count: workers.filter(w => w.creditScore >= 40 && w.creditScore < 55).length },
    { range: '55-70', count: workers.filter(w => w.creditScore >= 55 && w.creditScore < 70).length },
    { range: '70-85', count: workers.filter(w => w.creditScore >= 70 && w.creditScore < 85).length },
    { range: '85-100', count: workers.filter(w => w.creditScore >= 85).length },
  ];

  const handleAdjustSubmit = async () => {
    if (!adjustModal || !adjustReason.trim()) return;
    const { worker, type } = adjustModal;
    const delta = type === 'add' ? adjustScore : -adjustScore;
    try {
      const res = await fetch(`/api/workers/${worker.id}/credit-score`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: worker.creditScore + delta, reason: adjustReason }),
      });
      const data = await res.json();
      if (data.success) {
        setWorkers(prev => prev.map(w => {
          if (w.id !== worker.id) return w;
          const newRecord: CreditRecord = { id: 'c' + Date.now(), date: new Date().toISOString().slice(0, 10), type, score: adjustScore, reason: adjustReason, operator: '管理员' };
          return { ...w, creditScore: w.creditScore + delta, creditRecords: [newRecord, ...(w.creditRecords || [])] };
        }));
      }
    } catch {
      setWorkers(prev => prev.map(w => {
        if (w.id !== worker.id) return w;
        const newRecord: CreditRecord = { id: 'c' + Date.now(), date: new Date().toISOString().slice(0, 10), type, score: adjustScore, reason: adjustReason, operator: '管理员' };
        return { ...w, creditScore: w.creditScore + delta, creditRecords: [newRecord, ...(w.creditRecords || [])] };
      }));
    }
    setAdjustModal(null);
    setAdjustScore(5);
    setAdjustReason('');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-brand-600 text-lg">加载中...</div></div>;

  const excellent = workers.filter(w => w.creditScore >= 85).length;
  const good = workers.filter(w => w.creditScore >= 70 && w.creditScore < 85).length;
  const fair = workers.filter(w => w.creditScore >= 55 && w.creditScore < 70).length;
  const poor = workers.filter(w => w.creditScore >= 40 && w.creditScore < 55).length;
  const veryPoor = workers.filter(w => w.creditScore < 40).length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工人信用分管理</h1>
          <p className="text-gray-500 text-sm mt-1">信用体系 · 分档管理 · 加减分明细</p>
        </div>
      </div>

      <div className="card p-6 mb-5 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute right-20 bottom-0 w-40 h-40 rounded-full bg-accent-500/10 translate-y-1/2" />
        <div className="relative grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
          <div className="lg:col-span-1 flex flex-col items-center lg:items-start">
            <div className="flex items-center gap-2 mb-3 opacity-90"><Shield className="w-5 h-5" /> <span className="text-sm">信用分总览</span></div>
            <CreditGauge score={avgScore} size={220} />
            <div className="text-center lg:text-left text-white/80 text-sm mt-2">基于 {workers.length} 名工人综合评估</div>
          </div>
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: '优秀', count: excellent, score: '85-100', cls: 'bg-success-500/20 border-success-300/30', text: 'text-success-200' },
              { label: '良好', count: good, score: '70-84', cls: 'bg-blue-500/20 border-blue-300/30', text: 'text-blue-200' },
              { label: '一般', count: fair, score: '55-69', cls: 'bg-warning-500/20 border-warning-300/30', text: 'text-warning-200' },
              { label: '较差', count: poor, score: '40-54', cls: 'bg-orange-500/20 border-orange-300/30', text: 'text-orange-200' },
              { label: '危险', count: veryPoor, score: '0-39', cls: 'bg-danger-500/20 border-danger-300/30', text: 'text-danger-200' },
            ].map(tier => (
              <div key={tier.label} className={cn('rounded-xl border backdrop-blur-sm p-4', tier.cls)}>
                <div className="text-xs mb-1 opacity-80">{tier.label} · {tier.score}</div>
                <div className="text-3xl font-bold">{tier.count}</div>
                <div className={cn('text-xs mt-1', tier.text)}>人 · 占比 {workers.length ? Math.round(tier.count / workers.length * 100) : 0}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 mb-5">
        <div className="card p-5 xl:col-span-1">
          <h3 className="section-title mb-4"><Award className="w-5 h-5 text-brand-600" /> 信用分分布直方图</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <Tooltip />
                <Bar dataKey="count" name="人数" radius={[6, 6, 0, 0]}>
                  {histogramData.map((_, i) => {
                    const colors = ['#EF4444', '#FF7A00', '#F59E0B', '#3B82F6', '#10B981'];
                    return <rect key={i} fill={colors[Math.min(i, 4)]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 xl:col-span-3">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between mb-4">
            <h3 className="section-title"><User className="w-5 h-5 text-accent-600" /> 工人列表（{filteredWorkers.length}）</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input-field pl-9 max-w-[240px] text-sm py-2" placeholder="搜索姓名/手机号" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select className="input-field max-w-[160px] text-sm py-2" value={scoreFilter} onChange={e => setScoreFilter(e.target.value)}>
                  <option value="">全部档位</option>
                  <option value="excellent">优秀 (85+)</option>
                  <option value="good">良好 (70-84)</option>
                  <option value="fair">一般 (55-69)</option>
                  <option value="poor">较差 (40-54)</option>
                  <option value="veryPoor">危险 (0-39)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-100">
                  <th className="text-left font-medium px-4 py-3"></th>
                  <th className="text-left font-medium px-4 py-3 whitespace-nowrap">工人信息</th>
                  <th className="text-left font-medium px-4 py-3 whitespace-nowrap">性别/年龄</th>
                  <th className="text-left font-medium px-4 py-3 whitespace-nowrap">信用分</th>
                  <th className="text-left font-medium px-4 py-3 whitespace-nowrap">身份认证</th>
                  <th className="text-left font-medium px-4 py-3 whitespace-nowrap">技能数</th>
                  <th className="text-left font-medium px-4 py-3 whitespace-nowrap">履约记录</th>
                  <th className="text-left font-medium px-4 py-3 whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map(w => {
                  const grade = getScoreGrade(w.creditScore);
                  const isExpanded = expandedId === w.id;
                  return (
                    <>
                      <tr key={w.id}
                        className={cn('border-b border-gray-50 hover:bg-brand-50/30 cursor-pointer transition', isExpanded && 'bg-brand-50/40')}
                        onClick={() => setExpandedId(isExpanded ? null : w.id)}>
                        <td className="px-4 py-3">{isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">{w.name.charAt(0)}</div>
                            <div>
                              <div className="font-semibold text-gray-900">{w.name}</div>
                              <div className="text-xs text-gray-400">{w.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                          <span className="tag border-gray-200 text-gray-600">{w.gender === 'male' ? '男' : '女'}</span>
                          <span className="ml-2 text-gray-500">{w.age}岁</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={cn('font-bold text-lg w-12 h-12 rounded-xl flex items-center justify-center', getScoreColor(w.creditScore))}>{w.creditScore}</div>
                            <div>
                              <span className={cn('badge text-white', grade.cls)}>{grade.label}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {w.idCardVerified
                            ? <span className="badge bg-success-50 text-success-600 gap-1"><CheckCircle className="w-3 h-3" />已认证</span>
                            : <span className="badge bg-danger-50 text-danger-600 gap-1"><XCircle className="w-3 h-3" />未认证</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-semibold text-brand-600">{w.skills.length}</span>
                          <span className="text-xs text-gray-400 ml-1">项</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-semibold text-gray-900">{w.performanceHistory.length}</span>
                          <span className="text-xs text-gray-400 ml-1">次</span>
                          <span className="text-xs text-success-600 ml-2">在岗{w.performanceHistory.reduce((s, p) => s + p.daysWorked, 0)}天</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button className="btn-primary px-3 py-1.5 text-xs gap-1" onClick={e => { e.stopPropagation(); setAdjustModal({ worker: w, type: 'add' }); }}>
                            <Plus className="w-3 h-3" />加分
                          </button>
                          <button className="btn-ghost px-3 py-1.5 text-xs gap-1 ml-2 text-danger-600 border-danger-200 hover:bg-danger-50" onClick={e => { e.stopPropagation(); setAdjustModal({ worker: w, type: 'deduct' }); }}>
                            <Minus className="w-3 h-3" />扣分
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50/80">
                          <td colSpan={8} className="px-4 py-5 border-b border-gray-100">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-brand-600" /> 信用分变动明细</h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                  {(w.creditRecords || []).length === 0 && <div className="text-sm text-gray-400 py-8 text-center">暂无记录</div>}
                                  {(w.creditRecords || []).map(r => (
                                    <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-start gap-3">
                                      <div className={cn(
                                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                                        r.type === 'add' ? 'bg-success-50' : 'bg-danger-50'
                                      )}>
                                        {r.type === 'add' ? <Plus className="w-4 h-4 text-success-600" /> : <Minus className="w-4 h-4 text-danger-600" />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className={cn('font-bold', r.type === 'add' ? 'text-success-600' : 'text-danger-600')}>{r.type === 'add' ? '+' : '-'}{r.score}分</span>
                                          <span className="text-xs text-gray-400 shrink-0">{r.date}</span>
                                        </div>
                                        <div className="text-sm text-gray-700 mt-0.5">{r.reason}</div>
                                        <div className="text-xs text-gray-400 mt-1">操作人：{r.operator}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4 text-accent-600" /> 历史履约详情</h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                  {w.performanceHistory.length === 0 && <div className="text-sm text-gray-400 py-8 text-center">暂无记录</div>}
                                  {w.performanceHistory.map((p: PerformanceRecord, i) => (
                                    <div key={i} className="bg-white rounded-xl border border-gray-100 p-3">
                                      <div className="flex items-center justify-between mb-1.5">
                                        <div className="font-semibold text-gray-900 text-sm">{p.factoryName}</div>
                                        {p.endDate
                                          ? <span className={cn('badge text-xs',
                                              p.leaveType === 'normal' ? 'bg-success-50 text-success-600' :
                                              p.leaveType === 'abnormal' ? 'bg-warning-50 text-warning-600' : 'bg-danger-50 text-danger-600')}>
                                            {p.leaveType === 'normal' ? '正常离职' : p.leaveType === 'abnormal' ? '异常离职' : '违纪辞退'}
                                          </span>
                                          : <span className="badge bg-success-50 text-success-600 text-xs">在职中</span>}
                                      </div>
                                      <div className="text-xs text-brand-600 font-medium">{p.jobTitle}</div>
                                      <div className="flex items-center justify-between text-xs text-gray-500 mt-1.5">
                                        <span>{p.startDate} ~ {p.endDate || '至今'}</span>
                                        <span>在岗 <b className="text-gray-700">{p.daysWorked}</b> 天</span>
                                      </div>
                                      {p.leaveReason && <div className="text-xs text-gray-400 mt-1">离职原因：{p.leaveReason}</div>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {adjustModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-card-hover p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                {adjustModal.type === 'add'
                  ? <span className="text-success-600"><Plus className="w-5 h-5 inline" /> 信用加分</span>
                  : <span className="text-danger-600"><Minus className="w-5 h-5 inline" /> 信用扣分</span>}
              </h3>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 transition" onClick={() => setAdjustModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-lg">{adjustModal.worker.name.charAt(0)}</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{adjustModal.worker.name}</div>
                  <div className="text-xs text-gray-500">当前信用分：<span className={cn('font-bold', getScoreColor(adjustModal.worker.creditScore).split(' ')[0])}>{adjustModal.worker.creditScore}</span></div>
                </div>
                <div className="text-2xl font-bold text-gray-300">→</div>
                <div className={cn('text-2xl font-bold w-14 h-14 rounded-xl flex items-center justify-center',
                  getScoreColor(adjustModal.type === 'add' ? adjustModal.worker.creditScore + adjustScore : adjustModal.worker.creditScore - adjustScore))}>
                  {adjustModal.type === 'add' ? adjustModal.worker.creditScore + adjustScore : adjustModal.worker.creditScore - adjustScore}
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">调整分数</label>
              <div className="flex items-center gap-3">
                <button className="btn-ghost w-10 h-10 p-0" onClick={() => setAdjustScore(Math.max(1, adjustScore - 1))}><Minus className="w-4 h-4" /></button>
                <div className="flex-1 relative">
                  <input type="range" min={1} max={adjustModal.type === 'deduct' ? Math.min(40, adjustModal.worker.creditScore) : 30} value={adjustScore} onChange={e => setAdjustScore(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600" />
                </div>
                <button className="btn-ghost w-10 h-10 p-0" onClick={() => setAdjustScore(Math.min(adjustModal.type === 'deduct' ? Math.min(40, adjustModal.worker.creditScore) : 30, adjustScore + 1))}><Plus className="w-4 h-4" /></button>
                <div className={cn('w-16 text-center text-xl font-bold rounded-xl py-2', adjustModal.type === 'add' ? 'text-success-600 bg-success-50' : 'text-danger-600 bg-danger-50')}>
                  {adjustModal.type === 'add' ? '+' : '-'}{adjustScore}
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">调整原因 <span className="text-danger-500">*</span></label>
              <textarea className="input-field min-h-[90px] resize-none" placeholder="请详细说明加减分的具体原因..." value={adjustReason} onChange={e => setAdjustReason(e.target.value)} />
              <div className="flex flex-wrap gap-2 mt-2">
                {adjustModal.type === 'add'
                  ? ['表现优秀推荐', '按期完整履约', '身份认证完成', '推荐优质工人'].map(t => (
                    <button key={t} className="tag border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100 transition" onClick={() => setAdjustReason(t)}>{t}</button>
                  ))
                  : ['旷工迟到', '异常离职', '违纪违规', '面试爽约'].map(t => (
                    <button key={t} className="tag border-danger-200 bg-danger-50 text-danger-600 hover:bg-danger-100 transition" onClick={() => setAdjustReason(t)}>{t}</button>
                  ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="btn-ghost flex-1" onClick={() => setAdjustModal(null)}>取消</button>
              <button className={cn('flex-1', adjustModal.type === 'add' ? 'btn-primary' : 'bg-danger-500 hover:bg-danger-600 text-white font-medium px-5 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 shadow-card')}
                onClick={handleAdjustSubmit} disabled={!adjustReason.trim()}>
                确认{adjustModal.type === 'add' ? '加分' : '扣分'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
