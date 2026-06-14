import { useState } from 'react';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Search,
  Plus,
  Edit3,
  Eye,
  XCircle,
  Filter,
} from 'lucide-react';
import type { Job } from '../../../shared/types';
import { api } from '@/utils/api';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const mockJobs: Job[] = [
  {
    id: '1',
    companyId: '1',
    title: '前端开发实习生',
    description: '负责公司Web产品的前端开发工作，参与产品需求讨论和技术方案设计。',
    location: '北京',
    salaryPerHour: 25,
    maxHoursPerDay: 8,
    maxHoursPerWeek: 40,
    majorRequired: ['计算机科学与技术', '软件工程'],
    workDays: ['周一', '周二', '周三', '周四', '周五'],
    workStartTime: '09:00',
    workEndTime: '18:00',
    status: 'published',
    applicationCount: 32,
    createdAt: '2025-01-10',
  },
  {
    id: '2',
    companyId: '1',
    title: 'Java后端开发实习生',
    description: '参与后端服务的开发与维护，优化系统性能，保障服务稳定。',
    location: '北京',
    salaryPerHour: 30,
    maxHoursPerDay: 8,
    maxHoursPerWeek: 40,
    majorRequired: ['软件工程', '计算机科学与技术'],
    workDays: ['周一', '周二', '周三', '周四', '周五'],
    workStartTime: '10:00',
    workEndTime: '19:00',
    status: 'published',
    applicationCount: 28,
    createdAt: '2025-01-05',
  },
  {
    id: '3',
    companyId: '1',
    title: 'UI设计实习生',
    description: '负责产品界面设计、图标设计、运营活动设计等工作。',
    location: '北京',
    salaryPerHour: 20,
    maxHoursPerDay: 6,
    maxHoursPerWeek: 30,
    majorRequired: ['视觉传达设计', '数字媒体艺术'],
    workDays: ['周一', '周三', '周五'],
    workStartTime: '09:30',
    workEndTime: '17:30',
    status: 'closed',
    applicationCount: 45,
    createdAt: '2024-12-20',
  },
  {
    id: '4',
    companyId: '1',
    title: '数据分析师实习生',
    description: '负责业务数据的收集、整理和分析，为决策提供数据支持。',
    location: '北京',
    salaryPerHour: 28,
    maxHoursPerDay: 8,
    maxHoursPerWeek: 40,
    majorRequired: ['统计学', '数学', '数据科学'],
    workDays: ['周一', '周二', '周三', '周四', '周五'],
    workStartTime: '09:00',
    workEndTime: '18:00',
    status: 'draft',
    applicationCount: 0,
    createdAt: '2025-01-12',
  },
];

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'published', label: '已发布' },
  { key: 'closed', label: '已下架' },
  { key: 'draft', label: '草稿' },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  published: { label: '已发布', className: 'bg-success-100 text-success-600' },
  closed: { label: '已下架', className: 'bg-gray-100 text-gray-600' },
  draft: { label: '草稿', className: 'bg-amber-100 text-amber-600' },
};

export default function CompanyJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = activeTab === 'all' || job.status === activeTab;
    return matchesSearch && matchesStatus;
  });

  const getStatusCounts = () => {
    return {
      all: jobs.length,
      published: jobs.filter((j) => j.status === 'published').length,
      closed: jobs.filter((j) => j.status === 'closed').length,
      draft: jobs.filter((j) => j.status === 'draft').length,
    };
  };

  const counts = getStatusCounts();

  const handleCloseJob = async (jobId: string) => {
    try {
      await api.patch(`/companies/jobs/${jobId}/close`);
      setJobs(jobs.map((j) => (j.id === jobId ? { ...j, status: 'closed' as const } : j)));
    } catch (error) {
      console.error('下架失败', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">岗位管理</h1>
          <p className="text-gray-500 mt-1">管理你发布的所有岗位</p>
        </div>
        <button
          onClick={() => navigate('/company/jobs/new')}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent-500 text-white rounded-xl font-medium hover:bg-accent-600 transition-colors shadow-md shadow-accent-500/20"
        >
          <Plus className="w-5 h-5" />
          发布新岗位
        </button>
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
                placeholder="搜索岗位..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              />
            </div>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    activeTab === tab.key
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
                      activeTab === tab.key
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-gray-200 text-gray-600'
                    )}
                  >
                    {counts[tab.key as keyof typeof counts]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <div key={job.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0',
                          statusConfig[job.status].className
                        )}
                      >
                        {statusConfig[job.status].label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" />
                        {job.salaryPerHour}元/小时
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {job.workStartTime}-{job.workEndTime}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" />
                        {job.applicationCount} 人投递
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                      {job.description}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">发布于 {job.createdAt}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                      <Edit3 className="w-5 h-5" />
                    </button>
                    {job.status === 'published' && (
                      <button
                        onClick={() => handleCloseJob(job.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无岗位</p>
              <p className="text-sm text-gray-400 mt-1">点击右上角发布新岗位</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
