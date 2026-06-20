import { useEffect, useState } from 'react';
import {
  Search, Plus, Edit2, Trash2, Eye, Users, DollarSign, MapPin,
  Briefcase, X, Check, Clock, Star, TrendingUp, AlertCircle,
  ChevronRight, Settings, Copy, Tag, Zap
} from 'lucide-react';
import type { Job, Worker } from '@shared/types';
import { cn } from '@/lib/utils';

type JobTab = 'published' | 'applicants';

interface FactoryJob extends Job {
  applicantCount?: number;
  viewedCount?: number;
  interviewedCount?: number;
  hiredCount?: number;
  factoryName?: string;
}

interface Applicant {
  id: string;
  workerId: string;
  name: string;
  avatar?: string;
  gender?: 'male' | 'female';
  age?: number;
  creditScore: number;
  skills: string[];
  status: 'pending' | 'interview_scheduled' | 'interviewed' | 'passed' | 'hired' | 'rejected';
  appliedAt: string;
  jobId: string;
  jobTitle: string;
  matchScore: number;
  performanceHistory?: { factoryName: string; jobTitle: string; daysWorked: number }[];
  phone: string;
}

const mockJobs: FactoryJob[] = [
  {
    id: 'J301', factoryId: 'F301', title: '电子装配工', factoryName: '立讯精密电子（苏州）',
    salaryRange: { min: 6500, max: 8500 }, workHours: '两班倒（8:00-20:00）', overtimeRule: '平时1.5倍/周末2倍/节假日3倍',
    overtimeRate: { weekday: 1.5, weekend: 2, holiday: 3 }, board: { provided: true, costPerMonth: 300 },
    lodging: { provided: true, costPerMonth: 200, roomType: '4人间' }, processNodes: [],
    requirements: ['年龄18-45岁', '身体健康，无传染疾病', '能吃苦耐劳，适应两班倒'],
    benefits: ['五险一金', '包吃住', '年终奖金', '节日福利', '带薪年假', '免费班车'],
    status: 'published', vacancy: 50, createdAt: '2026-06-10', urgent: true, highSubsidy: true,
    applicantCount: 128, viewedCount: 1560, interviewedCount: 42, hiredCount: 18,
  },
  {
    id: 'J302', factoryId: 'F301', title: '品检员（QC）', factoryName: '立讯精密电子（苏州）',
    salaryRange: { min: 7000, max: 9000 }, workHours: '长白班（8:30-20:30）', overtimeRule: '平时1.5倍/周末2倍',
    overtimeRate: { weekday: 1.5, weekend: 2, holiday: 3 }, board: { provided: true, costPerMonth: 300 },
    lodging: { provided: true, costPerMonth: 200, roomType: '4人间' }, processNodes: [],
    requirements: ['年龄18-40岁', '有电子厂品检经验优先', '视力良好'],
    benefits: ['五险一金', '包吃住', '绩效奖金', '节日福利'],
    status: 'published', vacancy: 20, createdAt: '2026-06-12', urgent: false, highSubsidy: false,
    applicantCount: 56, viewedCount: 890, interviewedCount: 18, hiredCount: 7,
  },
  {
    id: 'J303', factoryId: 'F301', title: '仓库管理员', factoryName: '立讯精密电子（苏州）',
    salaryRange: { min: 6000, max: 7500 }, workHours: '长白班（9:00-18:00）', overtimeRule: '加班另算',
    overtimeRate: { weekday: 1.5, weekend: 2, holiday: 3 }, board: { provided: true },
    lodging: { provided: false }, processNodes: [],
    requirements: ['年龄20-45岁', '有仓管经验1年以上', '会基本电脑操作'],
    benefits: ['五险一金', '工作餐', '节日福利', '生日礼金'],
    status: 'published', vacancy: 5, createdAt: '2026-06-15', urgent: false, highSubsidy: true,
    applicantCount: 32, viewedCount: 456, interviewedCount: 8, hiredCount: 2,
  },
  {
    id: 'J304', factoryId: 'F301', title: 'SMT操作员', factoryName: '立讯精密电子（苏州）',
    salaryRange: { min: 7500, max: 9500 }, workHours: '两班倒（8:00-20:00）', overtimeRule: '平时1.5倍/周末2倍/节假日3倍',
    overtimeRate: { weekday: 1.5, weekend: 2, holiday: 3 }, board: { provided: true, costPerMonth: 300 },
    lodging: { provided: true, costPerMonth: 200, roomType: '4人间' }, processNodes: [],
    requirements: ['年龄18-35岁', '有SMT机台操作经验优先', '能吃苦耐劳'],
    benefits: ['五险一金', '包吃住', '岗位津贴', '技能补贴', '年终奖金'],
    status: 'published', vacancy: 15, createdAt: '2026-06-08', urgent: true, highSubsidy: false,
    applicantCount: 78, viewedCount: 1120, interviewedCount: 30, hiredCount: 12,
  },
  {
    id: 'J305', factoryId: 'F301', title: '维修技术员', factoryName: '立讯精密电子（苏州）',
    salaryRange: { min: 8000, max: 12000 }, workHours: '长白班（8:30-17:30）', overtimeRule: '加班另算',
    overtimeRate: { weekday: 1.5, weekend: 2, holiday: 3 }, board: { provided: true },
    lodging: { provided: true, costPerMonth: 200 }, processNodes: [],
    requirements: ['年龄22-40岁', '电子相关专业中专以上', '有电子产品维修经验2年以上'],
    benefits: ['五险一金', '包吃住', '技术津贴', '节日福利', '晋升通道'],
    status: 'reviewing', vacancy: 3, createdAt: '2026-06-18', urgent: false, highSubsidy: false,
    applicantCount: 0, viewedCount: 0, interviewedCount: 0, hiredCount: 0,
  },
  {
    id: 'J306', factoryId: 'F301', title: '门卫保安', factoryName: '立讯精密电子（苏州）',
    salaryRange: { min: 4500, max: 5500 }, workHours: '两班倒（7:00-19:00）', overtimeRule: '月休2天',
    overtimeRate: { weekday: 1.5, weekend: 2, holiday: 3 }, board: { provided: true },
    lodging: { provided: true }, processNodes: [],
    requirements: ['年龄25-50岁', '身体健康，无不良记录', '有保安证优先'],
    benefits: ['五险', '包吃住', '节日福利'],
    status: 'closed', vacancy: 0, createdAt: '2026-05-20', urgent: false, highSubsidy: false,
    applicantCount: 45, viewedCount: 670, interviewedCount: 12, hiredCount: 4,
  },
];

const mockApplicants: Applicant[] = [
  {
    id: 'APP001', workerId: 'W301', name: '李明华', gender: 'male', age: 28, phone: '138****2345',
    creditScore: 88, skills: ['电子装配', 'SMT操作', '电焊基础'],
    status: 'pending', appliedAt: '2026-06-19T08:30:00Z', jobId: 'J301', jobTitle: '电子装配工', matchScore: 92,
    performanceHistory: [{ factoryName: '富士康科技', jobTitle: '装配员', daysWorked: 186 }, { factoryName: '比亚迪', jobTitle: '普工', daysWorked: 95 }],
  },
  {
    id: 'APP002', workerId: 'W302', name: '王桂芳', gender: 'female', age: 35, phone: '139****6789',
    creditScore: 95, skills: ['品检(QC)', '电子测试', '质量记录'],
    status: 'interview_scheduled', appliedAt: '2026-06-19T09:15:00Z', jobId: 'J302', jobTitle: '品检员（QC）', matchScore: 96,
    performanceHistory: [{ factoryName: '立讯精密', jobTitle: '品检员', daysWorked: 320 }, { factoryName: '蓝思科技', jobTitle: 'QC', daysWorked: 150 }],
  },
  {
    id: 'APP003', workerId: 'W303', name: '张铁柱', gender: 'male', age: 42, phone: '137****1234',
    creditScore: 76, skills: ['仓储管理', '叉车驾驶(有证)', '货物盘点'],
    status: 'interviewed', appliedAt: '2026-06-18T14:20:00Z', jobId: 'J303', jobTitle: '仓库管理员', matchScore: 88,
    performanceHistory: [{ factoryName: '顺丰仓储', jobTitle: '仓管', daysWorked: 210 }],
  },
  {
    id: 'APP004', workerId: 'W304', name: '赵小花', gender: 'female', age: 24, phone: '136****5678',
    creditScore: 82, skills: ['电子装配'],
    status: 'passed', appliedAt: '2026-06-18T10:00:00Z', jobId: 'J301', jobTitle: '电子装配工', matchScore: 85,
    performanceHistory: [{ factoryName: '歌尔股份', jobTitle: '装配员', daysWorked: 78 }],
  },
  {
    id: 'APP005', workerId: 'W305', name: '孙大强', gender: 'male', age: 31, phone: '135****9012',
    creditScore: 90, skills: ['SMT操作', '设备维护', '松下机台'],
    status: 'hired', appliedAt: '2026-06-17T16:30:00Z', jobId: 'J304', jobTitle: 'SMT操作员', matchScore: 94,
    performanceHistory: [{ factoryName: '纬创资通', jobTitle: 'SMT技术员', daysWorked: 420 }],
  },
  {
    id: 'APP006', workerId: 'W306', name: '周建国', gender: 'male', age: 38, phone: '134****3456',
    creditScore: 68, skills: ['仓库管理', '装卸'],
    status: 'rejected', appliedAt: '2026-06-17T11:20:00Z', jobId: 'J303', jobTitle: '仓库管理员', matchScore: 72,
    performanceHistory: [{ factoryName: '京东物流', jobTitle: '装卸工', daysWorked: 45 }],
  },
  {
    id: 'APP007', workerId: 'W307', name: '吴秀兰', gender: 'female', age: 29, phone: '133****7890',
    creditScore: 86, skills: ['品检', '电子装配', '流水线作业'],
    status: 'pending', appliedAt: '2026-06-19T10:45:00Z', jobId: 'J301', jobTitle: '电子装配工', matchScore: 90,
    performanceHistory: [{ factoryName: '申洲针织', jobTitle: '检验员', daysWorked: 165 }],
  },
  {
    id: 'APP008', workerId: 'W308', name: '郑德胜', gender: 'male', age: 33, phone: '132****1122',
    creditScore: 78, skills: ['SMT操作', '电子装配'],
    status: 'interview_scheduled', appliedAt: '2026-06-19T07:50:00Z', jobId: 'J304', jobTitle: 'SMT操作员', matchScore: 82,
    performanceHistory: [{ factoryName: '富士康', jobTitle: '操作员', daysWorked: 120 }],
  },
];

function getJobStatusBadge(status: FactoryJob['status']) {
  const map = {
    draft: { label: '草稿', cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
    reviewing: { label: '审核中', cls: 'bg-warning-50 text-warning-700 border-warning-200', dot: 'bg-warning-500' },
    published: { label: '招聘中', cls: 'bg-success-50 text-success-700 border-success-200', dot: 'bg-success-500' },
    closed: { label: '已关闭', cls: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' },
  } as const;
  return map[status];
}

function getApplicantStatusBadge(status: Applicant['status']) {
  const map = {
    pending: { label: '待处理', cls: 'bg-warning-50 text-warning-700 border-warning-200' },
    interview_scheduled: { label: '已约面', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    interviewed: { label: '已面试', cls: 'bg-brand-50 text-brand-700 border-brand-200' },
    passed: { label: '已通过', cls: 'bg-success-50 text-success-700 border-success-200' },
    hired: { label: '已入职', cls: 'bg-success-100 text-success-800 border-success-300' },
    rejected: { label: '已拒绝', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  } as const;
  return map[status];
}

function getScoreColor(s: number) {
  if (s >= 85) return 'text-success-600 bg-success-50';
  if (s >= 70) return 'text-blue-600 bg-blue-50';
  if (s >= 55) return 'text-warning-600 bg-warning-50';
  return 'text-danger-600 bg-danger-50';
}

export default function FactoryJobsMgmt() {
  const [jobs, setJobs] = useState<FactoryJob[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [activeTab, setActiveTab] = useState<JobTab>('published');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [viewingApplicantsJob, setViewingApplicantsJob] = useState<FactoryJob | null>(null);
  const [newJobForm, setNewJobForm] = useState({
    title: '', salaryMin: '', salaryMax: '', vacancy: '', workHours: '',
    boardProvided: true, lodgingProvided: true, urgent: false,
  });

  useEffect(() => {
    fetch('/api/factories/F301/jobs')
      .then(r => r.json())
      .then(res => { if (res.success && res.data?.length) setJobs(res.data); else setJobs(mockJobs); })
      .catch(() => setJobs(mockJobs));
    setApplicants(mockApplicants);
  }, []);

  const filteredJobs = jobs.filter(j => {
    const matchSearch = !search || j.title.includes(search);
    const matchStatus = statusFilter === 'all' || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const displayApplicants = viewingApplicantsJob
    ? applicants.filter(a => a.jobId === viewingApplicantsJob.id)
    : applicants;

  const stats = {
    totalJobs: jobs.length,
    published: jobs.filter(j => j.status === 'published').length,
    totalVacancy: jobs.filter(j => j.status === 'published').reduce((s, j) => s + j.vacancy, 0),
    totalApplicants: applicants.length,
    hired: applicants.filter(a => a.status === 'hired').length,
  };

  const submitNewJob = () => {
    const nj: FactoryJob = {
      id: `J${Date.now()}`, factoryId: 'F301', title: newJobForm.title, factoryName: '立讯精密电子（苏州）',
      salaryRange: { min: Number(newJobForm.salaryMin) || 5000, max: Number(newJobForm.salaryMax) || 7000 },
      workHours: newJobForm.workHours || '两班倒', overtimeRule: '平时1.5倍/周末2倍',
      overtimeRate: { weekday: 1.5, weekend: 2, holiday: 3 },
      board: { provided: newJobForm.boardProvided }, lodging: { provided: newJobForm.lodgingProvided },
      processNodes: [], requirements: [], benefits: [],
      status: 'reviewing', vacancy: Number(newJobForm.vacancy) || 10,
      createdAt: new Date().toISOString().split('T')[0], urgent: newJobForm.urgent, highSubsidy: false,
      applicantCount: 0, viewedCount: 0, interviewedCount: 0, hiredCount: 0,
    };
    setJobs(prev => [nj, ...prev]);
    setShowNewJobModal(false);
    setNewJobForm({ title: '', salaryMin: '', salaryMax: '', vacancy: '', workHours: '', boardProvided: true, lodgingProvided: true, urgent: false });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">岗位管理</h1>
            <p className="text-gray-500 mt-1">发布与管理在招岗位，处理应聘者申请</p>
          </div>
          <button
            onClick={() => setShowNewJobModal(true)}
            className="btn-accent"
          >
            <Plus className="w-5 h-5" />
            发布新岗位
          </button>
        </div>

        <div className="grid grid-cols-5 gap-6 mb-8">
          <div className="card p-6 border-l-4 border-brand-600">
            <div className="text-sm text-gray-500 mb-2">全部岗位</div>
            <div className="text-3xl font-bold text-brand-700">{stats.totalJobs}</div>
          </div>
          <div className="card p-6 border-l-4 border-success-500">
            <div className="text-sm text-gray-500 mb-2">招聘中</div>
            <div className="text-3xl font-bold text-success-600">{stats.published}</div>
          </div>
          <div className="card p-6 border-l-4 border-accent-500">
            <div className="text-sm text-gray-500 mb-2">总空缺数</div>
            <div className="text-3xl font-bold text-accent-600">{stats.totalVacancy}</div>
          </div>
          <div className="card p-6 border-l-4 border-blue-500">
            <div className="text-sm text-gray-500 mb-2">收到申请</div>
            <div className="text-3xl font-bold text-blue-600">{stats.totalApplicants}</div>
          </div>
          <div className="card p-6 border-l-4 border-warning-500">
            <div className="text-sm text-gray-500 mb-2">成功入职</div>
            <div className="text-3xl font-bold text-warning-600">{stats.hired}</div>
          </div>
        </div>

        <div className="card p-2 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setActiveTab('published'); setViewingApplicantsJob(null); }}
                className={cn(
                  'px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all',
                  activeTab === 'published' && !viewingApplicantsJob ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Briefcase className="w-4 h-4" />
                在招岗位
                <span className={cn('px-2 py-0.5 rounded-full text-xs', activeTab === 'published' && !viewingApplicantsJob ? 'bg-white/20' : 'bg-gray-100 text-gray-500')}>{stats.published}</span>
              </button>
              <button
                onClick={() => setActiveTab('applicants')}
                className={cn(
                  'px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all',
                  activeTab === 'applicants' || viewingApplicantsJob ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Users className="w-4 h-4" />
                应聘者列表
                <span className={cn('px-2 py-0.5 rounded-full text-xs', activeTab === 'applicants' || viewingApplicantsJob ? 'bg-white/20' : 'bg-gray-100 text-gray-500')}>{stats.totalApplicants}</span>
              </button>
              {viewingApplicantsJob && (
                <div className="ml-4 flex items-center gap-2 text-sm">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <span className="text-accent-600 font-medium">{viewingApplicantsJob.title}</span>
                  <button onClick={() => setViewingApplicantsJob(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {(activeTab === 'published' && !viewingApplicantsJob) && (
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="input-field w-32"
                >
                  <option value="all">全部状态</option>
                  <option value="published">招聘中</option>
                  <option value="reviewing">审核中</option>
                  <option value="draft">草稿</option>
                  <option value="closed">已关闭</option>
                </select>
              )}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={activeTab === 'published' && !viewingApplicantsJob ? '搜索岗位名称' : '搜索工人姓名/岗位'}
                  className="input-field pl-10 w-72"
                />
              </div>
            </div>
          </div>
        </div>

        {(activeTab === 'published' && !viewingApplicantsJob) ? (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">岗位信息</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">薪资范围</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">空缺/申请</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">入职转化</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">状态</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">发布时间</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredJobs.map(job => {
                  const badge = getJobStatusBadge(job.status);
                  const convRate = job.applicantCount ? Math.round(job.hiredCount / job.applicantCount * 100) : 0;
                  return (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-5">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 text-base">{job.title}</span>
                            {job.urgent && <span className="px-2 py-0.5 bg-danger-50 text-danger-600 rounded text-[11px] font-medium flex items-center gap-1"><Zap className="w-3 h-3" />急招</span>}
                            {job.highSubsidy && <span className="px-2 py-0.5 bg-accent-50 text-accent-600 rounded text-[11px] font-medium flex items-center gap-1"><Tag className="w-3 h-3" />高补贴</span>}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.workHours}</span>
                            <span className="flex items-center gap-1">
                              {job.board.provided ? <><Check className="w-3.5 h-3.5 text-success-500" />包吃</> : <><X className="w-3.5 h-3.5 text-gray-400" />不包吃</>}
                            </span>
                            <span className="flex items-center gap-1">
                              {job.lodging.provided ? <><Check className="w-3.5 h-3.5 text-success-500" />包住</> : <><X className="w-3.5 h-3.5 text-gray-400" />不包住</>}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {job.benefits.slice(0, 4).map(b => (
                              <span key={b} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px]">{b}</span>
                            ))}
                            {job.benefits.length > 4 && <span className="text-[11px] text-gray-400 self-end">+{job.benefits.length - 4}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-accent-500" />
                          <span className="font-bold text-accent-600 text-lg">¥{job.salaryRange.min.toLocaleString()}</span>
                          <span className="text-gray-400 mx-0.5">-</span>
                          <span className="font-bold text-accent-600 text-lg">¥{job.salaryRange.max.toLocaleString()}</span>
                          <span className="text-xs text-gray-400 ml-1">/月</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">空缺</span>
                            <span className="font-semibold text-brand-700">{job.vacancy}人</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">申请</span>
                            <span className="font-semibold text-blue-600">{job.applicantCount}人</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="w-40">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-gray-500">申请→入职</span>
                            <span className="font-semibold text-success-600">{convRate}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                            <div className="h-full bg-gradient-to-r from-brand-500 to-success-500 rounded-full" style={{ width: `${convRate}%` }} />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-gray-400">
                            <span>面试{job.interviewedCount}</span>
                            <span>入职{job.hiredCount}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium', badge.cls)}>
                          <span className={cn('w-2 h-2 rounded-full', badge.dot)} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600">{job.createdAt}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setActiveTab('applicants'); setViewingApplicantsJob(job); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 flex items-center gap-1"
                          >
                            <Users className="w-3.5 h-3.5" />
                            {job.applicantCount}人申请
                          </button>
                          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"><Eye className="w-4 h-4" /></button>
                          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"><Edit2 className="w-4 h-4" /></button>
                          <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"><Copy className="w-4 h-4" /></button>
                          <button className="p-2 rounded-lg text-danger-500 hover:bg-danger-50"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {displayApplicants.map(app => {
              const badge = getApplicantStatusBadge(app.status);
              return (
                <div key={app.id} className="card p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0', app.gender === 'female' ? 'bg-gradient-to-br from-pink-400 to-pink-600' : 'bg-gradient-to-br from-blue-400 to-blue-600')}>
                      {app.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-900 text-lg">{app.name}</span>
                        <span className={cn('px-2.5 py-1 rounded-lg border text-xs font-medium', badge.cls)}>{badge.label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                        <span>{app.age || '-'}岁</span>
                        <span>·</span>
                        <span>{app.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('px-2.5 py-0.5 rounded-full text-sm font-bold', getScoreColor(app.creditScore))}>
                          信用分 {app.creditScore}
                        </span>
                        <span className={cn('px-2.5 py-0.5 rounded-full text-sm font-bold', app.matchScore >= 90 ? 'bg-success-50 text-success-700' : 'bg-blue-50 text-blue-700')}>
                          匹配度 {app.matchScore}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      应聘岗位
                    </div>
                    <div className="font-medium text-brand-700">{app.jobTitle}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      申请于 {new Date(app.appliedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5" />
                      技能标签
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {app.skills.map(sk => (
                        <span key={sk} className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-md text-xs font-medium">{sk}</span>
                      ))}
                    </div>
                  </div>

                  {app.performanceHistory && app.performanceHistory.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        历史履约（{app.performanceHistory.length}条）
                      </div>
                      <div className="space-y-1.5">
                        {app.performanceHistory.slice(0, 2).map((p, i) => (
                          <div key={i} className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-success-50/50 rounded-md">
                            <span className="text-gray-700 truncate max-w-[160px]">{p.factoryName} · {p.jobTitle}</span>
                            <span className="font-semibold text-success-700 whitespace-nowrap">{p.daysWorked}天</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    {app.status === 'pending' && (
                      <>
                        <button className="btn-primary flex-1 !py-2 text-sm">
                          <Calendar className="w-4 h-4" />
                          安排面试
                        </button>
                        <button className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">拒绝</button>
                      </>
                    )}
                    {app.status === 'interview_scheduled' && (
                      <>
                        <button className="btn-accent flex-1 !py-2 text-sm">
                          <Check className="w-4 h-4" />
                          已通过面试
                        </button>
                        <button className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">未通过</button>
                      </>
                    )}
                    {app.status === 'interviewed' && (
                      <button className="btn-primary flex-1 !py-2 text-sm">
                        <Eye className="w-4 h-4" />
                        查看面试反馈
                      </button>
                    )}
                    {app.status === 'passed' && (
                      <button className="btn-accent flex-1 !py-2 text-sm">
                        <Check className="w-4 h-4" />
                        确认已入职
                      </button>
                    )}
                    {app.status === 'hired' && (
                      <div className="flex-1 text-center py-2 text-success-700 text-sm font-medium flex items-center justify-center gap-1">
                        <Check className="w-4 h-4" />
                        已成功入职
                      </div>
                    )}
                    {app.status === 'rejected' && (
                      <div className="flex-1 text-center py-2 text-gray-400 text-sm">已拒绝申请</div>
                    )}
                  </div>
                </div>
              );
            })}
            {displayApplicants.length === 0 && (
              <div className="col-span-full py-20 text-center text-gray-400">
                <Users className="w-16 h-16 mx-auto mb-3 opacity-40" />
                <p className="text-lg">暂无应聘者数据</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showNewJobModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="text-xl font-bold text-gray-900">发布新岗位</h3>
                <p className="text-sm text-gray-500 mt-0.5">填写岗位信息，提交后将进入审核</p>
              </div>
              <button onClick={() => setShowNewJobModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">岗位名称 <span className="text-danger-500">*</span></label>
                <input
                  value={newJobForm.title}
                  onChange={e => setNewJobForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="如：电子装配工、品检员、叉车司机等"
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">最低月薪(元)</label>
                  <input type="number" value={newJobForm.salaryMin} onChange={e => setNewJobForm(p => ({ ...p, salaryMin: e.target.value }))} placeholder="5000" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">最高月薪(元)</label>
                  <input type="number" value={newJobForm.salaryMax} onChange={e => setNewJobForm(p => ({ ...p, salaryMax: e.target.value }))} placeholder="8000" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">招聘人数</label>
                  <input type="number" value={newJobForm.vacancy} onChange={e => setNewJobForm(p => ({ ...p, vacancy: e.target.value }))} placeholder="20" className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">工作时间</label>
                <select value={newJobForm.workHours} onChange={e => setNewJobForm(p => ({ ...p, workHours: e.target.value }))} className="input-field">
                  <option value="">请选择工作时间模式</option>
                  <option value="两班倒（8:00-20:00）">两班倒（8:00-20:00）</option>
                  <option value="长白班（8:30-20:30）">长白班（8:30-20:30）</option>
                  <option value="常日班（9:00-18:00）">常日班（9:00-18:00）</option>
                  <option value="三班倒">三班倒</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-brand-300">
                  <input type="checkbox" checked={newJobForm.boardProvided} onChange={e => setNewJobForm(p => ({ ...p, boardProvided: e.target.checked }))} className="w-5 h-5 accent-brand-600" />
                  <div>
                    <div className="font-medium text-gray-900">提供工作餐</div>
                    <div className="text-xs text-gray-500">包吃或补贴餐费</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-brand-300">
                  <input type="checkbox" checked={newJobForm.lodgingProvided} onChange={e => setNewJobForm(p => ({ ...p, lodgingProvided: e.target.checked }))} className="w-5 h-5 accent-brand-600" />
                  <div>
                    <div className="font-medium text-gray-900">提供住宿</div>
                    <div className="text-xs text-gray-500">包住或补贴住宿</div>
                  </div>
                </label>
              </div>
              <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-accent-200 bg-accent-50/50 cursor-pointer hover:border-accent-400">
                <input type="checkbox" checked={newJobForm.urgent} onChange={e => setNewJobForm(p => ({ ...p, urgent: e.target.checked }))} className="w-5 h-5 accent-accent-500" />
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent-600" />
                  <div>
                    <div className="font-medium text-accent-700">标记为急招岗位</div>
                    <div className="text-xs text-accent-600/80">将在首页优先推荐给工人与经纪人</div>
                  </div>
                </div>
              </label>
              <div className="p-4 bg-brand-50/50 rounded-xl border border-brand-100 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <div className="text-sm text-brand-800">
                  <div className="font-medium mb-0.5">温馨提示</div>
                  <div className="text-brand-700/80">提交后岗位将进入平台审核，预计 1-2 小时内完成审核。审核通过后自动上架并推送匹配求职者。</div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowNewJobModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-100">取消</button>
              <button onClick={submitNewJob} className="btn-accent">
                <Check className="w-4 h-4" />
                提交审核
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Calendar(props: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
}
