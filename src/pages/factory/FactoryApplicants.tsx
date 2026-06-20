import { useEffect, useState } from 'react';
import {
  Search, User, Phone, Star, Briefcase, Clock, CheckCircle, XCircle,
  Calendar, FileText, ArrowLeft, ChevronRight, Award, TrendingUp,
  MapPin, Shield, X, Send, Filter, Download
} from 'lucide-react';
import type { Worker } from '@shared/types';
import { cn } from '@/lib/utils';

type StatusTab = 'pending' | 'passed' | 'hired';

interface ApplicantDetail {
  id: string;
  workerId: string;
  name: string;
  avatar?: string;
  gender: 'male' | 'female';
  age: number;
  phone: string;
  idCardVerified: boolean;
  creditScore: number;
  skills: { name: string; issuer?: string; certifiedAt?: string }[];
  status: StatusTab | 'interview_scheduled' | 'interviewed' | 'rejected';
  appliedAt: string;
  jobId: string;
  jobTitle: string;
  salaryRange: string;
  interviewTime?: string;
  matchScore: number;
  expectedSalary: number;
  hometown: string;
  experienceYears: number;
  education: string;
  languages: string[];
  performanceHistory: {
    factoryName: string;
    jobTitle: string;
    startDate: string;
    endDate?: string;
    daysWorked: number;
    leaveType?: 'normal' | 'abnormal' | 'fired';
    managerComment?: string;
  }[];
  resumeHighlights: string[];
  emergencyContact?: { name: string; relation: string; phone: string };
}

const mockApplicants: ApplicantDetail[] = [
  {
    id: 'A001', workerId: 'W401', name: '李明华', gender: 'male', age: 28, phone: '138****2345', idCardVerified: true,
    creditScore: 88, skills: [
      { name: '电子装配', issuer: '富士康', certifiedAt: '2024-03' },
      { name: 'SMT操作', issuer: '职业技能中心', certifiedAt: '2023-08' },
      { name: '电焊基础', issuer: '安监部门', certifiedAt: '2024-01' },
    ],
    status: 'pending', appliedAt: '2026-06-19T08:30:00Z', jobId: 'J401', jobTitle: '电子装配工', salaryRange: '6500-8500',
    matchScore: 92, expectedSalary: 7500, hometown: '安徽阜阳', experienceYears: 5, education: '高中', languages: ['普通话(流利)'],
    performanceHistory: [
      { factoryName: '富士康科技（昆山）', jobTitle: '装配员', startDate: '2025-01-15', endDate: '2025-08-20', daysWorked: 186, leaveType: 'normal', managerComment: '工作认真，服从管理，出勤稳定' },
      { factoryName: '比亚迪汽车（西安）', jobTitle: '普工', startDate: '2024-03-10', endDate: '2024-12-30', daysWorked: 295, leaveType: 'normal', managerComment: '优秀员工，技能熟练' },
    ],
    resumeHighlights: ['5年电子厂工作经验', '3家大厂稳定履约', '无不良离职记录', '会操作SMT机台', '接受两班倒'],
    emergencyContact: { name: '李建国', relation: '父亲', phone: '139****8888' },
  },
  {
    id: 'A002', workerId: 'W402', name: '王桂芳', gender: 'female', age: 35, phone: '139****6789', idCardVerified: true,
    creditScore: 95, skills: [
      { name: '品检(QC)', issuer: '立讯精密', certifiedAt: '2023-05' },
      { name: '电子测试', issuer: '内部认证', certifiedAt: '2023-09' },
      { name: '质量记录', issuer: 'ISO培训', certifiedAt: '2024-02' },
    ],
    status: 'pending', appliedAt: '2026-06-19T09:15:00Z', jobId: 'J402', jobTitle: '品检员（QC）', salaryRange: '7000-9000',
    matchScore: 96, expectedSalary: 8000, hometown: '河南周口', experienceYears: 8, education: '中专', languages: ['普通话(流利)', '粤语(基础)'],
    performanceHistory: [
      { factoryName: '立讯精密（深圳）', jobTitle: '品检员', startDate: '2023-06-01', endDate: '2025-04-15', daysWorked: 684, leaveType: 'normal', managerComment: '金牌员工，连续两年零投诉，质量意识强' },
      { factoryName: '蓝思科技（东莞）', jobTitle: 'QC', startDate: '2022-02-20', endDate: '2023-05-20', daysWorked: 455, leaveType: 'normal', managerComment: '技能扎实，可培养为线长' },
    ],
    resumeHighlights: ['8年品检工作经验', '连续3年优秀员工', '零质量事故记录', '熟悉ISO流程', '长白班/两班倒均可'],
  },
  {
    id: 'A003', workerId: 'W403', name: '张铁柱', gender: 'male', age: 42, phone: '137****1234', idCardVerified: true,
    creditScore: 76, skills: [
      { name: '仓储管理', issuer: '顺丰', certifiedAt: '2023-11' },
      { name: '叉车驾驶(有证)', issuer: '质监局', certifiedAt: '2022-07' },
    ],
    status: 'pending', appliedAt: '2026-06-18T14:20:00Z', jobId: 'J403', jobTitle: '仓库管理员', salaryRange: '6000-7500',
    matchScore: 88, expectedSalary: 6800, hometown: '江苏徐州', experienceYears: 12, education: '初中', languages: ['普通话(流利)'],
    performanceHistory: [
      { factoryName: '顺丰仓储（苏州）', jobTitle: '仓管', startDate: '2024-01-10', endDate: '2025-08-10', daysWorked: 578, leaveType: 'normal', managerComment: '工作勤勉，叉车技术熟练，账务准确' },
    ],
    resumeHighlights: ['12年仓储经验', '持有有效叉车证', '会基本电脑操作', '熟悉货物进出库流程', '可接受加班'],
  },
  {
    id: 'A004', workerId: 'W404', name: '赵小花', gender: 'female', age: 24, phone: '136****5678', idCardVerified: true,
    creditScore: 82, skills: [{ name: '电子装配' }],
    status: 'passed', appliedAt: '2026-06-18T10:00:00Z', jobId: 'J401', jobTitle: '电子装配工', salaryRange: '6500-8500',
    interviewTime: '2026-06-19 14:00',
    matchScore: 85, expectedSalary: 7000, hometown: '贵州毕节', experienceYears: 2, education: '高中', languages: ['普通话(流利)'],
    performanceHistory: [
      { factoryName: '歌尔股份（潍坊）', jobTitle: '装配员', startDate: '2025-03-01', endDate: '2026-05-20', daysWorked: 446, leaveType: 'normal', managerComment: '手脚麻利，学习能力强' },
    ],
    resumeHighlights: ['年轻学习快', '手脚灵活', '可接受两班倒', '稳定性好'],
  },
  {
    id: 'A005', workerId: 'W405', name: '孙大强', gender: 'male', age: 31, phone: '135****9012', idCardVerified: true,
    creditScore: 90, skills: [
      { name: 'SMT操作', issuer: 'JUKI认证', certifiedAt: '2023-02' },
      { name: '设备维护', issuer: '松下', certifiedAt: '2024-06' },
    ],
    status: 'hired', appliedAt: '2026-06-17T16:30:00Z', jobId: 'J404', jobTitle: 'SMT操作员', salaryRange: '7500-9500',
    matchScore: 94, expectedSalary: 8500, hometown: '山东菏泽', experienceYears: 7, education: '中专', languages: ['普通话(流利)'],
    performanceHistory: [
      { factoryName: '纬创资通（昆山）', jobTitle: 'SMT技术员', startDate: '2023-08-15', endDate: '2026-06-10', daysWorked: 1030, leaveType: 'normal', managerComment: '核心技术骨干，精通松下NPM系列' },
    ],
    resumeHighlights: ['7年SMT经验', '精通松下JUKI机台', '可带新人', '零重大设备事故'],
    emergencyContact: { name: '孙秀琴', relation: '妻子', phone: '134****6666' },
  },
  {
    id: 'A006', workerId: 'W406', name: '吴秀兰', gender: 'female', age: 29, phone: '133****7890', idCardVerified: true,
    creditScore: 86, skills: [
      { name: '品检', issuer: '申洲', certifiedAt: '2023-10' },
      { name: '电子装配' },
      { name: '流水线作业' },
    ],
    status: 'passed', appliedAt: '2026-06-19T10:45:00Z', jobId: 'J401', jobTitle: '电子装配工', salaryRange: '6500-8500',
    interviewTime: '2026-06-20 09:30',
    matchScore: 90, expectedSalary: 7200, hometown: '四川南充', experienceYears: 6, education: '初中', languages: ['普通话(流利)', '四川话'],
    performanceHistory: [
      { factoryName: '申洲针织（宁波）', jobTitle: '检验员', startDate: '2024-02-20', endDate: '2026-05-15', daysWorked: 815, leaveType: 'normal', managerComment: '检验仔细，返工率极低' },
    ],
    resumeHighlights: ['品检+装配双经验', '6年稳定工龄', '手脚快，效率高'],
  },
];

const tabs: { key: StatusTab; label: string; icon: typeof Clock; color: string }[] = [
  { key: 'pending', label: '待面试', icon: Clock, color: 'warning' },
  { key: 'passed', label: '已通过', icon: CheckCircle, color: 'success' },
  { key: 'hired', label: '已入职', icon: Shield, color: 'brand' },
];

function getScoreColor(s: number) {
  if (s >= 85) return { text: 'text-success-600', bg: 'bg-success-50', ring: 'ring-success-200' };
  if (s >= 70) return { text: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-200' };
  if (s >= 55) return { text: 'text-warning-600', bg: 'bg-warning-50', ring: 'ring-warning-200' };
  return { text: 'text-danger-600', bg: 'bg-danger-50', ring: 'ring-danger-200' };
}

function getLeaveBadge(t?: string) {
  if (t === 'normal') return { label: '正常离职', cls: 'bg-success-50 text-success-700' };
  if (t === 'abnormal') return { label: '异常离职', cls: 'bg-warning-50 text-warning-700' };
  if (t === 'fired') return { label: '被辞退', cls: 'bg-danger-50 text-danger-700' };
  return { label: '-', cls: 'bg-gray-100 text-gray-500' };
}

export default function FactoryApplicants() {
  const [applicants, setApplicants] = useState<ApplicantDetail[]>([]);
  const [activeTab, setActiveTab] = useState<StatusTab>('pending');
  const [search, setSearch] = useState('');
  const [jobFilter, setJobFilter] = useState('all');
  const [viewing, setViewing] = useState<ApplicantDetail | null>(null);
  const [scheduleFor, setScheduleFor] = useState<ApplicantDetail | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ date: '', time: '09:30', note: '' });
  const [batchSelect, setBatchSelect] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/factories/F401/applicants')
      .then(r => r.json())
      .then(res => { if (res.success && res.data?.length) setApplicants(res.data); else setApplicants(mockApplicants); })
      .catch(() => setApplicants(mockApplicants));
  }, []);

  const filtered = applicants.filter(a => {
    const matchTab = a.status === activeTab;
    const matchSearch = !search || a.name.includes(search) || a.phone.includes(search) || a.jobTitle.includes(search);
    const matchJob = jobFilter === 'all' || a.jobId === jobFilter;
    return matchTab && matchSearch && matchJob;
  });

  const jobList = Array.from(new Set(applicants.map(a => ({ id: a.jobId, title: a.jobTitle }))));

  const stats = {
    pending: applicants.filter(a => a.status === 'pending').length,
    passed: applicants.filter(a => a.status === 'passed').length,
    hired: applicants.filter(a => a.status === 'hired').length,
    avgCredit: applicants.length ? Math.round(applicants.reduce((s, a) => s + a.creditScore, 0) / applicants.length) : 0,
  };

  const submitSchedule = () => {
    if (!scheduleFor) return;
    setApplicants(prev => prev.map(a => a.id === scheduleFor.id ? { ...a, status: 'interview_scheduled', interviewTime: `${scheduleForm.date} ${scheduleForm.time}` } : a));
    setScheduleFor(null);
    setScheduleForm({ date: '', time: '09:30', note: '' });
  };

  const markPassed = (id: string) => {
    setApplicants(prev => prev.map(a => a.id === id ? { ...a, status: 'passed' } : a));
  };

  const markHired = (id: string) => {
    setApplicants(prev => prev.map(a => a.id === id ? { ...a, status: 'hired' } : a));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">应聘者管理</h1>
            <p className="text-gray-500 mt-1">处理工人申请，安排面试与入职</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-ghost">
              <Download className="w-4 h-4" />
              导出名单
            </button>
            <button className="btn-accent">
              <Calendar className="w-4 h-4" />
              批量安排面试
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="card p-6 bg-gradient-to-br from-warning-50 to-warning-100/50 border border-warning-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-warning-500 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-4xl font-bold text-warning-600">{stats.pending}</span>
            </div>
            <div className="font-semibold text-warning-800">待面试</div>
            <div className="text-xs text-warning-700/70 mt-1">需要尽快安排面试</div>
          </div>
          <div className="card p-6 bg-gradient-to-br from-success-50 to-success-100/50 border border-success-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-success-500 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-4xl font-bold text-success-600">{stats.passed}</span>
            </div>
            <div className="font-semibold text-success-800">已通过</div>
            <div className="text-xs text-success-700/70 mt-1">面试通过，等待入职</div>
          </div>
          <div className="card p-6 bg-gradient-to-br from-brand-50 to-brand-100/50 border border-brand-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-brand-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-4xl font-bold text-brand-700">{stats.hired}</span>
            </div>
            <div className="font-semibold text-brand-800">已入职</div>
            <div className="text-xs text-brand-700/70 mt-1">成功入职到岗</div>
          </div>
          <div className="card p-6 bg-gradient-to-br from-accent-50 to-accent-100/50 border border-accent-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-accent-500 flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <span className="text-4xl font-bold text-accent-600">{stats.avgCredit}</span>
            </div>
            <div className="font-semibold text-accent-800">平均信用分</div>
            <div className="text-xs text-accent-700/70 mt-1">全部应聘者质量</div>
          </div>
        </div>

        <div className="card p-2 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const count = stats[tab.key as keyof typeof stats];
                const active = activeTab === tab.key;
                const colorMap: Record<string, string> = {
                  warning: active ? 'bg-warning-500 text-white shadow-lg shadow-warning-500/25' : 'text-gray-600 hover:bg-gray-100',
                  success: active ? 'bg-success-500 text-white shadow-lg shadow-success-500/25' : 'text-gray-600 hover:bg-gray-100',
                  brand: active ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25' : 'text-gray-600 hover:bg-gray-100',
                };
                return (
                  <button
                    key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setBatchSelect(new Set()); }}
                    className={cn(
                      'px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all',
                      colorMap[tab.color]
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    <span className={cn('px-2 py-0.5 rounded-full text-xs', active ? 'bg-white/20' : 'bg-gray-100 text-gray-500')}>{count as number}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              <select value={jobFilter} onChange={e => setJobFilter(e.target.value)} className="input-field w-48">
                <option value="all">全部岗位</option>
                {jobList.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="搜索姓名/电话/岗位"
                  className="input-field pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </div>

        {filtered.length > 0 && activeTab === 'pending' && (
          <div className="mb-4 flex items-center gap-3 px-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={batchSelect.size === filtered.length}
                onChange={e => setBatchSelect(e.target.checked ? new Set(filtered.map(f => f.id)) : new Set())}
                className="w-4 h-4 accent-brand-600"
              />
              全选 ({batchSelect.size}/{filtered.length})
            </label>
            {batchSelect.size > 0 && (
              <button className="btn-primary !py-2 text-sm">
                <Calendar className="w-4 h-4" />
                批量安排 ({batchSelect.size})
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {filtered.map(app => {
            const sc = getScoreColor(app.creditScore);
            const checked = batchSelect.has(app.id);
            return (
              <div key={app.id} className="card overflow-hidden hover:shadow-lg transition-all group">
                <div className={cn('h-1.5', app.status === 'pending' ? 'bg-warning-500' : app.status === 'passed' ? 'bg-success-500' : 'bg-brand-600')} />
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl ring-4', app.gender === 'female' ? 'bg-gradient-to-br from-pink-400 to-pink-600 ring-pink-100' : 'bg-gradient-to-br from-blue-400 to-blue-600 ring-blue-100')}>
                        {app.name.charAt(0)}
                      </div>
                      {app.idCardVerified && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success-500 flex items-center justify-center ring-2 ring-white">
                          <Shield className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-gray-900 text-xl">{app.name}</span>
                        {activeTab === 'pending' && (
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={e => {
                              const ns = new Set(batchSelect);
                              e.target.checked ? ns.add(app.id) : ns.delete(app.id);
                              setBatchSelect(ns);
                            }}
                            className="w-4 h-4 accent-brand-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                        <User className="w-3.5 h-3.5" />
                        {app.gender === 'male' ? '男' : '女'} · {app.age}岁 · {app.education}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Phone className="w-3.5 h-3.5" />
                        {app.phone}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className={cn('flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold', sc.bg, sc.text)}>
                      <Award className="w-4 h-4" />
                      信用分 {app.creditScore}
                    </div>
                    <div className={cn('flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold', app.matchScore >= 90 ? 'bg-success-50 text-success-700' : 'bg-brand-50 text-brand-700')}>
                      <TrendingUp className="w-4 h-4" />
                      匹配 {app.matchScore}%
                    </div>
                  </div>

                  <div className="p-3.5 bg-gradient-to-br from-brand-50 to-accent-50/50 rounded-xl mb-4 border border-brand-100/50">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      应聘岗位
                    </div>
                    <div className="font-bold text-brand-800 mb-1">{app.jobTitle}</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-accent-600 font-semibold">参考薪资 ¥{app.salaryRange}</span>
                      <span className="text-gray-500">期望 ¥{app.expectedSalary}</span>
                    </div>
                    {app.interviewTime && (
                      <div className="mt-2 pt-2 border-t border-brand-100 flex items-center gap-1.5 text-xs text-success-700 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        面试时间：{app.interviewTime}
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-warning-500" />
                      技能标签
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {app.skills.slice(0, 4).map(sk => (
                        <span key={sk.name} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                          {sk.name}{sk.certifiedAt ? '✓' : ''}
                        </span>
                      ))}
                      {app.skills.length > 4 && <span className="px-2 py-1 text-xs text-gray-400 self-end">+{app.skills.length - 4}</span>}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-success-500" />
                      历史履约 · 共{app.performanceHistory.length}段
                    </div>
                    <div className="space-y-1.5">
                      {app.performanceHistory.slice(0, 2).map((p, i) => {
                        const lb = getLeaveBadge(p.leaveType);
                        return (
                          <div key={i} className="p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-medium text-gray-800 truncate max-w-[160px]">{p.factoryName}</span>
                              <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', lb.cls)}>{lb.label}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-gray-500">
                              <span>{p.jobTitle}</span>
                              <span className="font-semibold text-success-700">{p.daysWorked}天</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setViewing(app)}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      查看简历
                    </button>
                    {app.status === 'pending' && (
                      <button
                        onClick={() => setScheduleFor(app)}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700 flex items-center justify-center gap-1.5 shadow-lg shadow-accent-500/25 transition-all"
                      >
                        <Calendar className="w-4 h-4" />
                        安排面试
                      </button>
                    )}
                    {app.status === 'passed' && (
                      <button
                        onClick={() => markHired(app.id)}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-success-500 to-success-600 text-white hover:from-success-600 hover:to-success-700 flex items-center justify-center gap-1.5 shadow-lg shadow-success-500/25 transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                        确认入职
                      </button>
                    )}
                    {app.status === 'hired' && (
                      <div className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-50 text-brand-700 flex items-center justify-center gap-1.5">
                        <Shield className="w-4 h-4" />
                        已在职
                      </div>
                    )}
                  </div>
                  {app.status === 'pending' && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => markPassed(app.id)}
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-success-50 text-success-700 hover:bg-success-100 flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        直接通过
                      </button>
                      <button className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        婉拒
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="card py-20 text-center">
            <User className="w-20 h-20 mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-semibold text-gray-500">暂无{tabs.find(t => t.key === activeTab)?.label}应聘者</p>
            <p className="text-sm text-gray-400 mt-1">请切换其他状态或修改筛选条件</p>
          </div>
        )}
      </div>

      {viewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex">
            <div className="flex-1 overflow-y-auto">
              <div className={cn('p-6 text-white relative', viewing.gender === 'female' ? 'bg-gradient-to-r from-pink-500 to-pink-700' : 'bg-gradient-to-r from-blue-500 to-blue-700')}>
                <button onClick={() => setViewing(null)} className="absolute top-4 right-4 p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"><X className="w-5 h-5" /></button>
                <div className="flex items-center gap-5">
                  <div className="w-24 h-24 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center text-4xl font-bold ring-4 ring-white/20">
                    {viewing.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-3xl font-bold">{viewing.name}</h3>
                      {viewing.idCardVerified && <span className="px-2.5 py-1 rounded-full bg-white/25 text-xs font-medium flex items-center gap-1"><Shield className="w-3.5 h-3.5" />实名已认证</span>}
                    </div>
                    <div className="text-white/90 text-lg mb-2">{viewing.gender === 'male' ? '男' : '女'} · {viewing.age}岁 · {viewing.education} · {viewing.experienceYears}年工龄</div>
                    <div className="flex items-center gap-4 text-white/90 text-sm">
                      <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{viewing.phone}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{viewing.hometown}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-6">
                  {[
                    { label: '信用分', value: viewing.creditScore, color: 'from-warning-400 to-warning-600' },
                    { label: '匹配度', value: `${viewing.matchScore}%`, color: 'from-success-400 to-success-600' },
                    { label: '期望薪资', value: `¥${viewing.expectedSalary}`, color: 'from-accent-400 to-accent-600' },
                    { label: '履约次数', value: `${viewing.performanceHistory.length}次`, color: 'from-brand-400 to-brand-600' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/15 backdrop-blur-sm rounded-xl p-4">
                      <div className="text-white/75 text-xs mb-1">{s.label}</div>
                      <div className={cn('text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent', s.color)}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="p-5 bg-gradient-to-r from-accent-50 to-success-50 rounded-2xl border border-accent-100">
                  <div className="flex items-center gap-2 mb-3 font-semibold text-accent-800">
                    <Star className="w-5 h-5 text-accent-500" />
                    简历亮点
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {viewing.resumeHighlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl text-sm text-gray-700 shadow-sm">
                        <span className="w-5 h-5 rounded-full bg-gradient-to-br from-accent-500 to-success-500 text-white text-xs flex items-center justify-center font-bold">{i + 1}</span>
                        {h}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="section-title mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-brand-600" />
                    技能证书 <span className="text-sm font-normal text-gray-400">（共 {viewing.skills.length} 项）</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {viewing.skills.map((sk, i) => (
                      <div key={i} className="p-4 rounded-xl border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900">{sk.name}</span>
                          {sk.certifiedAt && <span className="w-6 h-6 rounded-full bg-success-100 text-success-600 flex items-center justify-center"><CheckCircle className="w-4 h-4" /></span>}
                        </div>
                        {sk.issuer && <div className="text-xs text-gray-500">发证机构：{sk.issuer}</div>}
                        {sk.certifiedAt && <div className="text-xs text-brand-600 mt-0.5">认证时间：{sk.certifiedAt}</div>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="section-title mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-brand-600" />
                    历史履约记录 <span className="text-sm font-normal text-gray-400">（共 {viewing.performanceHistory.length} 段）</span>
                  </div>
                  <div className="space-y-3">
                    {viewing.performanceHistory.map((p, i) => {
                      const lb = getLeaveBadge(p.leaveType);
                      return (
                        <div key={i} className="p-5 rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-gray-900 text-lg">{p.factoryName}</span>
                                <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', lb.cls)}>{lb.label}</span>
                              </div>
                              <div className="text-gray-600 text-sm flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded text-xs font-medium">{p.jobTitle}</span>
                                <span className="text-gray-400">|</span>
                                <span>{p.startDate} ~ {p.endDate || '至今'}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-400 mb-0.5">在岗天数</div>
                              <div className="text-3xl font-bold bg-gradient-to-r from-success-500 to-brand-600 bg-clip-text text-transparent">{p.daysWorked}<span className="text-base ml-1">天</span></div>
                            </div>
                          </div>
                          {p.managerComment && (
                            <div className="p-3.5 bg-gradient-to-r from-brand-50/50 to-success-50/50 rounded-xl border-l-4 border-brand-500">
                              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Star className="w-3.5 h-3.5 text-warning-500" />主管评价</div>
                              <p className="text-sm text-gray-700 leading-relaxed">{p.managerComment}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {viewing.emergencyContact && (
                  <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="section-title mb-3 text-sm">紧急联系人</div>
                    <div className="flex items-center gap-6 text-sm">
                      <span><span className="text-gray-500">姓名：</span><span className="font-semibold">{viewing.emergencyContact.name}</span></span>
                      <span><span className="text-gray-500">关系：</span><span className="font-semibold">{viewing.emergencyContact.relation}</span></span>
                      <span><span className="text-gray-500">电话：</span><span className="font-semibold text-brand-600">{viewing.emergencyContact.phone}</span></span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="w-80 bg-gray-50 border-l border-gray-100 flex flex-col">
              <div className="p-5 border-b border-gray-100">
                <div className="section-title mb-4">快速操作</div>
                <div className="space-y-2.5">
                  {viewing.status === 'pending' && (
                    <button
                      onClick={() => { setScheduleFor(viewing); setViewing(null); }}
                      className="w-full btn-accent justify-center"
                    >
                      <Calendar className="w-4 h-4" />
                      安排面试
                    </button>
                  )}
                  {viewing.status === 'pending' && (
                    <button
                      onClick={() => { markPassed(viewing.id); setViewing(null); }}
                      className="w-full px-4 py-3 rounded-xl font-semibold bg-success-50 text-success-700 hover:bg-success-100 border border-success-200 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      面试通过
                    </button>
                  )}
                  {viewing.status === 'passed' && (
                    <button
                      onClick={() => { markHired(viewing.id); setViewing(null); }}
                      className="w-full btn-accent justify-center"
                    >
                      <CheckCircle className="w-4 h-4" />
                      确认入职
                    </button>
                  )}
                  <button className="w-full px-4 py-3 rounded-xl font-semibold bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 flex items-center justify-center gap-2 shadow-sm">
                    <Phone className="w-4 h-4" />
                    拨打电话
                  </button>
                  <button className="w-full px-4 py-3 rounded-xl font-semibold bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 flex items-center justify-center gap-2 shadow-sm">
                    <Send className="w-4 h-4" />
                    发送消息
                  </button>
                  <button className="w-full px-4 py-3 rounded-xl font-semibold bg-white text-danger-600 hover:bg-danger-50 border border-danger-200 flex items-center justify-center gap-2 shadow-sm">
                    <XCircle className="w-4 h-4" />
                    婉拒申请
                  </button>
                </div>
              </div>

              <div className="p-5 flex-1">
                <div className="section-title mb-4">应聘进度</div>
                <div className="space-y-1">
                  {[
                    { label: '提交申请', done: true, time: new Date(viewing.appliedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) },
                    { label: '资料审核', done: viewing.idCardVerified },
                    { label: activeTab === 'hired' ? '面试通过' : '安排面试', done: viewing.status !== 'pending' || !!viewing.interviewTime, time: viewing.interviewTime },
                    { label: '参加面试', done: ['passed', 'hired'].includes(viewing.status) },
                    { label: '面试通过', done: ['passed', 'hired'].includes(viewing.status) },
                    { label: '办理入职', done: viewing.status === 'hired' },
                  ].map((s, i, arr) => (
                    <div key={i} className="relative pl-7 pb-4 last:pb-0">
                      {i < arr.length - 1 && (
                        <div className={cn('absolute left-[11px] top-6 bottom-0 w-0.5', s.done ? 'bg-success-400' : 'bg-gray-200')} />
                      )}
                      <div className={cn('absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all',
                        s.done ? 'bg-success-500 border-success-500 text-white shadow-lg shadow-success-500/30' : 'bg-white border-gray-300 text-gray-400'
                      )}>
                        {s.done ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                      </div>
                      <div>
                        <div className={cn('text-sm font-semibold', s.done ? 'text-gray-900' : 'text-gray-400')}>{s.label}</div>
                        {s.time && <div className="text-xs text-gray-400 mt-0.5">{s.time}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {scheduleFor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-brand-600 to-brand-800 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2"><Calendar className="w-5 h-5" />安排面试</h3>
                  <p className="text-white/80 text-sm mt-0.5">为 <span className="font-semibold">{scheduleFor.name}</span> 预约面试时间</p>
                </div>
                <button onClick={() => setScheduleFor(null)} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="p-4 bg-brand-50 rounded-xl border border-brand-100 flex items-center gap-4">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold', scheduleFor.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500')}>
                  {scheduleFor.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{scheduleFor.name} · {scheduleFor.age}岁</div>
                  <div className="text-sm text-gray-500">{scheduleFor.jobTitle}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">匹配度</div>
                  <div className="text-xl font-bold text-success-600">{scheduleFor.matchScore}%</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">面试日期 <span className="text-danger-500">*</span></label>
                <input
                  type="date"
                  value={scheduleForm.date}
                  onChange={e => setScheduleForm(p => ({ ...p, date: e.target.value }))}
                  className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">面试时段</label>
                <div className="grid grid-cols-4 gap-2">
                  {['08:30', '09:30', '10:30', '11:30', '13:30', '14:30', '15:30', '16:30'].map(t => (
                    <button
                      key={t}
                      onClick={() => setScheduleForm(p => ({ ...p, time: t }))}
                      className={cn(
                        'py-2.5 rounded-xl text-sm font-semibold border transition-all',
                        scheduleForm.time === t ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-600/25' : 'bg-white text-gray-700 border-gray-200 hover:border-brand-400 hover:text-brand-600'
                      )}
                    >{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">备注信息</label>
                <textarea
                  value={scheduleForm.note}
                  onChange={e => setScheduleForm(p => ({ ...p, note: e.target.value }))}
                  placeholder="请携带身份证原件、学历证明等材料，请提前10分钟到达..."
                  className="input-field min-h-[90px] resize-none"
                />
              </div>
              <div className="p-4 bg-warning-50 rounded-xl border border-warning-100 flex items-start gap-3">
                <Clock className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
                <div className="text-sm text-warning-800">
                  <div className="font-semibold mb-0.5">温馨提示</div>
                  <div className="text-warning-700/80">安排后系统将通过短信+APP消息同步通知工人，请确保时段准确。若需修改请至少提前2小时。</div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
              <button onClick={() => setScheduleFor(null)} className="px-5 py-2.5 rounded-xl font-semibold text-gray-700 hover:bg-gray-200">取消</button>
              <button
                onClick={submitSchedule}
                disabled={!scheduleForm.date}
                className="btn-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                确认安排
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
