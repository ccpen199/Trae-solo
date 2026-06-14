import { useState } from 'react';
import {
  Users,
  Search,
  ChevronDown,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  Star,
  GraduationCap,
  School,
  BookOpen,
} from 'lucide-react';
import type { Application, ApplicationStatus } from '../../../shared/types';
import { api } from '@/utils/api';
import { cn } from '@/lib/utils';

const jobOptions = [
  { id: 'all', title: '全部岗位' },
  { id: '1', title: '前端开发实习生' },
  { id: '2', title: 'Java后端开发实习生' },
];

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'interview', label: '面试中' },
  { key: 'accepted', label: '已录用' },
  { key: 'rejected', label: '已拒绝' },
];

const statusConfig: Record<ApplicationStatus, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-amber-100 text-amber-700' },
  interview: { label: '面试中', className: 'bg-blue-100 text-blue-700' },
  accepted: { label: '已录用', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '已拒绝', className: 'bg-red-100 text-red-700' },
  working: { label: '工作中', className: 'bg-violet-100 text-violet-700' },
  completed: { label: '已完成', className: 'bg-gray-100 text-gray-700' },
};

const mockApplications: Application[] = [
  {
    id: '1', studentId: '1', jobId: '1', status: 'pending', appliedAt: '2025-01-15',
    student: { id: '1', studentId: '2021001', name: '李明', school: '清华大学', major: '计算机科学与技术', grade: '大三', rating: 4.9, verified: true, createdAt: '' },
    job: { id: '1', companyId: '1', title: '前端开发实习生', description: '', location: '', salaryPerHour: 25, maxHoursPerDay: 8, maxHoursPerWeek: 40, majorRequired: [], workDays: [], workStartTime: '', workEndTime: '', status: 'published', createdAt: '' },
  },
  {
    id: '2', studentId: '2', jobId: '1', status: 'interview', appliedAt: '2025-01-14',
    student: { id: '2', studentId: '2021002', name: '王芳', school: '北京大学', major: '软件工程', grade: '大三', rating: 4.7, verified: true, createdAt: '' },
    job: { id: '1', companyId: '1', title: '前端开发实习生', description: '', location: '', salaryPerHour: 25, maxHoursPerDay: 8, maxHoursPerWeek: 40, majorRequired: [], workDays: [], workStartTime: '', workEndTime: '', status: 'published', createdAt: '' },
  },
  {
    id: '3', studentId: '3', jobId: '2', status: 'accepted', appliedAt: '2025-01-10',
    student: { id: '3', studentId: '2020003', name: '张伟', school: '北京邮电大学', major: '计算机科学与技术', grade: '大四', rating: 4.8, verified: true, createdAt: '' },
    job: { id: '2', companyId: '1', title: 'Java后端开发实习生', description: '', location: '', salaryPerHour: 30, maxHoursPerDay: 8, maxHoursPerWeek: 40, majorRequired: [], workDays: [], workStartTime: '', workEndTime: '', status: 'published', createdAt: '' },
  },
  {
    id: '4', studentId: '4', jobId: '1', status: 'rejected', appliedAt: '2025-01-12',
    student: { id: '4', studentId: '2022004', name: '刘洋', school: '北京理工大学', major: '电子信息工程', grade: '大二', rating: 4.5, verified: true, createdAt: '' },
    job: { id: '1', companyId: '1', title: '前端开发实习生', description: '', location: '', salaryPerHour: 25, maxHoursPerDay: 8, maxHoursPerWeek: 40, majorRequired: [], workDays: [], workStartTime: '', workEndTime: '', status: 'published', createdAt: '' },
  },
];

export default function CompanyCandidates() {
  const [applications, setApplications] = useState<Application[]>(mockApplications);
  const [selectedJob, setSelectedJob] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [jobDropdownOpen, setJobDropdownOpen] = useState(false);

  const filteredApplications = applications.filter((app) => {
    const matchesJob = selectedJob === 'all' || app.jobId === selectedJob;
    const matchesStatus = activeTab === 'all' || app.status === activeTab;
    const matchesSearch = app.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.student?.school.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesJob && matchesStatus && matchesSearch;
  });

  const getStatusCounts = () => {
    const filteredByJob = applications.filter((a) => selectedJob === 'all' || a.jobId === selectedJob);
    return {
      all: filteredByJob.length,
      pending: filteredByJob.filter((a) => a.status === 'pending').length,
      interview: filteredByJob.filter((a) => a.status === 'interview').length,
      accepted: filteredByJob.filter((a) => a.status === 'accepted').length,
      rejected: filteredByJob.filter((a) => a.status === 'rejected').length,
    };
  };

  const counts = getStatusCounts();

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    try {
      await api.patch(`/companies/applications/${appId}/status`, { status: newStatus });
      setApplications(applications.map((a) => (a.id === appId ? { ...a, status: newStatus } : a)));
    } catch (error) {
      console.error('状态更新失败', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">候选人管理</h1>
        <p className="text-gray-500 mt-1">查看和管理岗位候选人</p>
      </div>

      <div className="bg-white rounded-2xl shadow-card">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索候选人姓名或学校..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setJobDropdownOpen(!jobDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <Users className="w-4 h-4" />
                {jobOptions.find((j) => j.id === selectedJob)?.title || '选择岗位'}
                <ChevronDown className="w-4 h-4" />
              </button>
              {jobDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                  {jobOptions.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => { setSelectedJob(job.id); setJobDropdownOpen(false); }}
                      className={cn(
                        'w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors',
                        selectedJob === job.id ? 'text-primary-600 font-medium bg-primary-50' : 'text-gray-700'
                      )}
                    >
                      {job.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mt-4 w-fit">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {tab.label}
                <span className={cn(
                  'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
                  activeTab === tab.key ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-600'
                )}>
                  {counts[tab.key as keyof typeof counts]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApplications.length > 0 ? (
            filteredApplications.map((app) => (
              <div key={app.id} className="bg-gray-50 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{app.student?.name}</h3>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-sm font-medium">{app.student?.rating}</span>
                      </div>
                    </div>
                  </div>
                  <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', statusConfig[app.status].className)}>
                    {statusConfig[app.status].label}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <School className="w-4 h-4 text-gray-400" />
                    <span>{app.student?.school}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <span>{app.student?.major} · {app.student?.grade}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mb-4">申请岗位：{app.job?.title}</div>
                <div className="flex items-center gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Eye className="w-4 h-4" />简历
                  </button>
                  {app.status === 'pending' && (
                    <>
                      <button onClick={() => handleStatusChange(app.id, 'interview')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                        <Calendar className="w-4 h-4" />面试
                      </button>
                      <button onClick={() => handleStatusChange(app.id, 'rejected')} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {app.status === 'interview' && (
                    <button onClick={() => handleStatusChange(app.id, 'accepted')} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors">
                      <CheckCircle className="w-4 h-4" />录用
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无候选人</p>
              <p className="text-sm text-gray-400 mt-1">发布岗位后会有学生申请</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
