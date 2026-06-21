import { useState } from 'react';
import { Calendar, MapPin, MessageSquare, ChevronRight, Clock, FileText } from 'lucide-react';
import { mockInterviews, mockJobs } from '@/mock/data';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

type ApplicationStatus = 'all' | 'pending' | 'interview' | 'accepted' | 'rejected';

const mockApplications = [
  {
    id: 'app-001',
    jobId: 'job-001',
    jobTitle: '高级前端开发工程师',
    companyName: '云南云智科技有限公司',
    status: 'interview' as ApplicationStatus,
    appliedAt: '2026-06-18',
    salary: '18K-30K',
    location: '昆明市五华区',
    interview: mockInterviews[0],
  },
  {
    id: 'app-002',
    jobId: 'job-002',
    jobTitle: '产品经理',
    companyName: '云南云智科技有限公司',
    status: 'pending' as ApplicationStatus,
    appliedAt: '2026-06-19',
    salary: '15K-25K',
    location: '昆明市盘龙区',
  },
  {
    id: 'app-003',
    jobId: 'job-003',
    jobTitle: 'UI/UX 设计师',
    companyName: '云南云智科技有限公司',
    status: 'rejected' as ApplicationStatus,
    appliedAt: '2026-06-10',
    salary: '12K-20K',
    location: '昆明市呈贡区',
    rejectReason: '简历与岗位要求匹配度不高',
  },
  {
    id: 'app-004',
    jobId: 'job-005',
    jobTitle: 'ERP系统实施顾问（项目制）',
    companyName: '云南云智科技有限公司',
    status: 'accepted' as ApplicationStatus,
    appliedAt: '2026-05-28',
    salary: '25K-40K',
    location: '曲靖市麒麟区',
    acceptedAt: '2026-06-15',
  },
];

export default function ApplicantApplications() {
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus>('all');

  const statusConfig: Record<ApplicationStatus, { label: string; badge: string; color: string }> = {
    all: { label: '全部', badge: '', color: '' },
    pending: { label: '待处理', badge: 'bg-sand-100 text-sand-700', color: 'text-sand-600' },
    interview: { label: '面试中', badge: 'bg-terracotta-100 text-terracotta-700', color: 'text-terracotta-600' },
    accepted: { label: '已录用', badge: 'bg-spruce-100 text-spruce-700', color: 'text-spruce-600' },
    rejected: { label: '未通过', badge: 'bg-ash-100 text-ash-600', color: 'text-ash-500' },
  };

  const filtered = mockApplications.filter((a) => statusFilter === 'all' || a.status === statusFilter);

  const stats = [
    { status: 'all' as ApplicationStatus, label: '全部', count: mockApplications.length },
    { status: 'pending' as ApplicationStatus, label: '待处理', count: mockApplications.filter((a) => a.status === 'pending').length },
    { status: 'interview' as ApplicationStatus, label: '面试中', count: mockApplications.filter((a) => a.status === 'interview').length },
    { status: 'accepted' as ApplicationStatus, label: '已录用', count: mockApplications.filter((a) => a.status === 'accepted').length },
    { status: 'rejected' as ApplicationStatus, label: '未通过', count: mockApplications.filter((a) => a.status === 'rejected').length },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-5 gap-3">
        {stats.map((s) => (
          <button
            key={s.status}
            onClick={() => setStatusFilter(s.status)}
            className={`card p-4 text-left transition-all ${
              statusFilter === s.status
                ? 'border-terracotta-500 shadow-elevated'
                : 'hover:shadow-soft'
            }`}
          >
            <p className="text-3xl font-bold font-serif text-ash-700">{s.count}</p>
            <p className={`text-sm mt-1 ${statusFilter === s.status ? 'text-terracotta-600 font-medium' : 'text-ash-500'}`}>
              {s.label}
            </p>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="card p-12 text-center text-ash-400">
            <FileText size={48} className="mx-auto mb-4 opacity-40" />
            <p>暂无投递记录</p>
          </div>
        ) : (
          filtered.map((app) => {
            const job = mockJobs.find((j) => j.id === app.jobId);
            return (
              <div key={app.id} className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-spruce-400 to-spruce-600 flex items-center justify-center text-white font-serif text-xl font-bold">
                      {app.companyName[2]}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-serif text-lg font-bold text-ash-700">{app.jobTitle}</h3>
                        <span className={`badge ${statusConfig[app.status].badge}`}>
                          {statusConfig[app.status].label}
                        </span>
                      </div>
                      <p className="text-sm text-ash-500 mb-3">{app.companyName}</p>
                      <div className="flex items-center gap-4 text-sm text-ash-500">
                        <span className="text-terracotta-600 font-semibold">{app.salary}</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {app.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          投递于 {app.appliedAt}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {app.status === 'interview' && app.interview && (
                      <div className="p-4 bg-terracotta-50 rounded-xl text-right">
                        <p className="text-sm font-medium text-terracotta-700">面试安排</p>
                        <p className="text-sm text-ash-600 mt-1">
                          {format(new Date(app.interview.scheduledTime), 'M月d日 HH:mm', { locale: zhCN })}
                        </p>
                        <p className="text-xs text-ash-500 mt-0.5">
                          {app.interview.format === 'onsite' ? '现场面试' : app.interview.format === 'video' ? '视频面试' : '电话面试'}
                        </p>
                      </div>
                    )}
                    {app.status === 'rejected' && app.rejectReason && (
                      <div className="p-4 bg-ash-50 rounded-xl max-w-xs">
                        <p className="text-sm font-medium text-ash-600">反馈原因</p>
                        <p className="text-sm text-ash-500 mt-1">{app.rejectReason}</p>
                      </div>
                    )}
                    {app.status === 'accepted' && (
                      <div className="p-4 bg-spruce-50 rounded-xl">
                        <p className="text-sm font-medium text-spruce-700">🎉 恭喜您已被录用</p>
                        <p className="text-sm text-ash-600 mt-1">请查看offer详情</p>
                      </div>
                    )}
                    <button className="p-2 hover:bg-ash-100 rounded-lg transition-colors text-ash-400">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
