import { useState } from 'react';
import {
  Briefcase,
  Building2,
  DollarSign,
  Clock,
  ChevronRight,
  Search,
} from 'lucide-react';
import type { Application, ApplicationStatus } from '../../../../shared/types';
import { api } from '@/utils/api';
import { cn } from '@/lib/utils';

const statusConfig: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  pending: { label: '待审核', className: 'bg-amber-100 text-amber-700' },
  interview: { label: '面试中', className: 'bg-blue-100 text-blue-700' },
  accepted: { label: '已录用', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '已拒绝', className: 'bg-red-100 text-red-700' },
  working: { label: '进行中', className: 'bg-violet-100 text-violet-700' },
  completed: { label: '已完成', className: 'bg-gray-100 text-gray-700' },
};

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '进行中' },
  { key: 'completed', label: '已完成' },
];

const mockApplications: Application[] = [
  {
    id: '1',
    studentId: '1',
    jobId: '1',
    status: 'pending',
    appliedAt: '2025-01-10',
    job: {
      id: '1',
      companyId: '1',
      title: '前端开发实习生',
      description: '',
      location: '北京',
      salaryPerHour: 25,
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      majorRequired: ['计算机科学与技术'],
      workDays: ['周一', '周二', '周三', '周四', '周五'],
      workStartTime: '09:00',
      workEndTime: '18:00',
      status: 'published',
      createdAt: '2024-12-01',
    },
    company: {
      id: '1',
      name: '字节跳动',
      email: '',
      licenseNo: '',
      contactName: '',
      contactPhone: '',
      address: '',
      verified: true,
      createdAt: '',
    },
  },
  {
    id: '2',
    studentId: '1',
    jobId: '2',
    status: 'interview',
    appliedAt: '2025-01-08',
    interviewTime: '2025-01-15 14:00',
    job: {
      id: '2',
      companyId: '2',
      title: 'Java后端开发',
      description: '',
      location: '上海',
      salaryPerHour: 30,
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      majorRequired: ['软件工程'],
      workDays: ['周一', '周二', '周三', '周四', '周五'],
      workStartTime: '10:00',
      workEndTime: '19:00',
      status: 'published',
      createdAt: '2024-11-15',
    },
    company: {
      id: '2',
      name: '阿里巴巴',
      email: '',
      licenseNo: '',
      contactName: '',
      contactPhone: '',
      address: '',
      verified: true,
      createdAt: '',
    },
  },
  {
    id: '3',
    studentId: '1',
    jobId: '3',
    status: 'working',
    appliedAt: '2024-12-20',
    workHours: 80,
    salary: 2000,
    job: {
      id: '3',
      companyId: '3',
      title: 'UI设计实习生',
      description: '',
      location: '深圳',
      salaryPerHour: 20,
      maxHoursPerDay: 6,
      maxHoursPerWeek: 30,
      majorRequired: ['视觉传达设计'],
      workDays: ['周一', '周三', '周五'],
      workStartTime: '09:30',
      workEndTime: '17:30',
      status: 'published',
      createdAt: '2024-11-01',
    },
    company: {
      id: '3',
      name: '腾讯科技',
      email: '',
      licenseNo: '',
      contactName: '',
      contactPhone: '',
      address: '',
      verified: true,
      createdAt: '',
    },
  },
  {
    id: '4',
    studentId: '1',
    jobId: '4',
    status: 'completed',
    appliedAt: '2024-11-01',
    workHours: 160,
    salary: 4800,
    rating: 4.8,
    comment: '表现优秀，学习能力强',
    job: {
      id: '4',
      companyId: '4',
      title: '数据分析师',
      description: '',
      location: '杭州',
      salaryPerHour: 30,
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      majorRequired: ['统计学', '数学'],
      workDays: ['周一', '周二', '周三', '周四', '周五'],
      workStartTime: '09:00',
      workEndTime: '18:00',
      status: 'published',
      createdAt: '2024-10-01',
    },
    company: {
      id: '4',
      name: '美团点评',
      email: '',
      licenseNo: '',
      contactName: '',
      contactPhone: '',
      address: '',
      verified: true,
      createdAt: '',
    },
  },
  {
    id: '5',
    studentId: '1',
    jobId: '5',
    status: 'rejected',
    appliedAt: '2025-01-05',
    job: {
      id: '5',
      companyId: '5',
      title: '产品经理助理',
      description: '',
      location: '北京',
      salaryPerHour: 22,
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      majorRequired: ['市场营销'],
      workDays: ['周一', '周二', '周三', '周四', '周五'],
      workStartTime: '09:00',
      workEndTime: '18:00',
      status: 'published',
      createdAt: '2024-12-10',
    },
    company: {
      id: '5',
      name: '京东集团',
      email: '',
      licenseNo: '',
      contactName: '',
      contactPhone: '',
      address: '',
      verified: true,
      createdAt: '',
    },
  },
];

export default function StudentApplications() {
  const [applications] = useState<Application[]>(mockApplications);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getFilteredApplications = () => {
    let filtered = applications;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.job?.title.toLowerCase().includes(term) ||
          app.company?.name.toLowerCase().includes(term)
      );
    }

    switch (activeTab) {
      case 'pending':
        return filtered.filter((app) => app.status === 'pending');
      case 'processing':
        return filtered.filter((app) =>
          ['interview', 'accepted', 'working'].includes(app.status)
        );
      case 'completed':
        return filtered.filter((app) =>
          ['completed', 'rejected'].includes(app.status)
        );
      default:
        return filtered;
    }
  };

  const filteredApplications = getFilteredApplications();

  const getStatusCounts = () => {
    const counts = {
      all: applications.length,
      pending: applications.filter((a) => a.status === 'pending').length,
      processing: applications.filter((a) =>
        ['interview', 'accepted', 'working'].includes(a.status)
      ).length,
      completed: applications.filter((a) =>
        ['completed', 'rejected'].includes(a.status)
      ).length,
    };
    return counts;
  };

  const counts = getStatusCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的投递</h1>
          <p className="text-gray-500 mt-1">查看你的投递记录和面试进度</p>
        </div>
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
                placeholder="搜索岗位或企业..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              />
            </div>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {tabs.map((tab) => (
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
          {filteredApplications.length > 0 ? (
            filteredApplications.map((app) => (
              <div
                key={app.id}
                className="p-5 hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {app.job?.title}
                      </h3>
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0',
                          statusConfig[app.status].className
                        )}
                      >
                        {statusConfig[app.status].label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" />
                        {app.company?.name}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" />
                        {app.job?.salaryPerHour}元/小时
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" />
                        {app.job?.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {app.appliedAt} 投递
                      </span>
                    </div>
                    {app.interviewTime && (
                      <div className="mt-3 px-3 py-2 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">面试时间：</span>
                          {app.interviewTime}
                        </p>
                      </div>
                    )}
                    {app.status === 'working' && (
                      <div className="mt-3 flex items-center gap-4">
                        <div>
                          <span className="text-sm text-gray-500">已工作</span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {app.workHours}小时
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">预估薪资</span>
                          <span className="ml-2 font-semibold text-accent-500">
                            ¥{app.salary}
                          </span>
                        </div>
                      </div>
                    )}
                    {app.status === 'completed' && app.rating && (
                      <div className="mt-3 flex items-center gap-4">
                        <div>
                          <span className="text-sm text-gray-500">总工时</span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {app.workHours}小时
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">获得薪资</span>
                          <span className="ml-2 font-semibold text-accent-500">
                            ¥{app.salary}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">企业评价</span>
                          <span className="ml-2 font-semibold text-yellow-500">
                            ⭐ {app.rating}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0 mt-1" />
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无投递记录</p>
              <p className="text-sm text-gray-400 mt-1">快去浏览感兴趣的岗位吧</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
