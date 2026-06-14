import { useState } from 'react';
import {
  FileWarning,
  Clock,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  AlertOctagon,
  User,
  Building2,
  Briefcase,
  X,
  MessageSquare,
  CheckSquare,
} from 'lucide-react';
import type { Complaint, ComplaintStatus, ComplaintType } from '../../../../shared/types';
import { cn } from '@/lib/utils';

const mockComplaints: Complaint[] = [
  {
    id: '1',
    studentId: '1',
    companyId: '1',
    jobId: '1',
    type: 'salary',
    description: '公司未按照约定支付薪资，实际发放金额比合同少20%，多次沟通无果。',
    status: 'pending',
    createdAt: '2025-01-14 09:30',
    student: {
      id: '1',
      studentId: 'S001',
      name: '张三',
      school: '清华大学',
      major: '计算机科学',
      grade: '大三',
      rating: 4.8,
      verified: true,
      createdAt: '2024-09-01',
    },
    company: {
      id: '1',
      name: '字节跳动科技有限公司',
      email: 'contact@bytedance.com',
      licenseNo: '123456789',
      contactName: '李经理',
      contactPhone: '13800138000',
      address: '北京市海淀区',
      verified: true,
      createdAt: '2024-01-15',
    },
    job: {
      id: '1',
      companyId: '1',
      title: '前端开发实习生',
      description: '参与公司核心产品的前端开发工作',
      location: '北京',
      salaryPerHour: 35,
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      majorRequired: ['计算机科学'],
      workDays: ['周一', '周二', '周三', '周四', '周五'],
      workStartTime: '09:00',
      workEndTime: '18:00',
      status: 'published',
      createdAt: '2024-12-01',
    },
  },
  {
    id: '2',
    studentId: '2',
    companyId: '2',
    jobId: '2',
    type: 'safety',
    description: '实习岗位存在安全隐患，没有提供必要的劳保用品，工作环境不符合安全标准。',
    status: 'investigating',
    createdAt: '2025-01-13 14:20',
    student: {
      id: '2',
      studentId: 'S002',
      name: '李四',
      school: '北京大学',
      major: '机械工程',
      grade: '大二',
      rating: 4.5,
      verified: true,
      createdAt: '2024-09-05',
    },
    company: {
      id: '2',
      name: '阿里巴巴集团',
      email: 'hr@alibaba.com',
      licenseNo: '987654321',
      contactName: '王主管',
      contactPhone: '13900139000',
      address: '杭州市余杭区',
      verified: true,
      createdAt: '2024-02-20',
    },
    job: {
      id: '2',
      companyId: '2',
      title: '机械设计实习生',
      description: '参与产品机械设计工作',
      location: '杭州',
      salaryPerHour: 25,
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      majorRequired: ['机械工程'],
      workDays: ['周一', '周二', '周三', '周四', '周五'],
      workStartTime: '09:00',
      workEndTime: '18:00',
      status: 'published',
      createdAt: '2024-11-15',
    },
  },
  {
    id: '3',
    studentId: '3',
    companyId: '3',
    jobId: '3',
    type: 'discrimination',
    description: '在实习期间遭受性别歧视，分配的工作与岗位描述不符，且经常被安排做杂活。',
    status: 'resolved',
    createdAt: '2025-01-10 11:00',
    resolvedAt: '2025-01-12 16:30',
    result: '已协调企业整改，学生获得合理工作安排，企业提交整改报告。',
    student: {
      id: '3',
      studentId: 'S003',
      name: '王五',
      school: '复旦大学',
      major: '市场营销',
      grade: '大三',
      rating: 4.6,
      verified: true,
      createdAt: '2024-09-10',
    },
    company: {
      id: '3',
      name: '腾讯科技',
      email: 'hr@tencent.com',
      licenseNo: '456789123',
      contactName: '陈经理',
      contactPhone: '13700137000',
      address: '深圳市南山区',
      verified: true,
      createdAt: '2024-03-10',
    },
    job: {
      id: '3',
      companyId: '3',
      title: '市场运营实习生',
      description: '参与市场推广活动策划与执行',
      location: '深圳',
      salaryPerHour: 30,
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      majorRequired: ['市场营销'],
      workDays: ['周一', '周二', '周三', '周四', '周五'],
      workStartTime: '09:30',
      workEndTime: '18:30',
      status: 'published',
      createdAt: '2024-12-20',
    },
  },
  {
    id: '4',
    studentId: '4',
    companyId: '4',
    jobId: '4',
    type: 'fraud',
    description: '企业发布虚假招聘信息，实际工作内容与描述严重不符，涉嫌欺诈。',
    status: 'closed',
    createdAt: '2025-01-08 15:45',
    resolvedAt: '2025-01-09 10:00',
    result: '经查实企业存在虚假宣传，已下架相关岗位，企业纳入黑名单。',
    student: {
      id: '4',
      studentId: 'S004',
      name: '赵六',
      school: '浙江大学',
      major: '金融学',
      grade: '大四',
      rating: 4.3,
      verified: true,
      createdAt: '2024-08-20',
    },
    company: {
      id: '4',
      name: '某投资公司',
      email: 'info@invest.com',
      licenseNo: '111111111',
      contactName: '孙总',
      contactPhone: '13600136000',
      address: '上海市浦东新区',
      verified: false,
      createdAt: '2024-12-01',
    },
    job: {
      id: '4',
      companyId: '4',
      title: '金融分析实习生',
      description: '参与投资分析与研究工作',
      location: '上海',
      salaryPerHour: 50,
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      majorRequired: ['金融学'],
      workDays: ['周一', '周二', '周三', '周四', '周五'],
      workStartTime: '09:00',
      workEndTime: '18:00',
      status: 'closed',
      createdAt: '2024-12-10',
    },
  },
];

const statusConfig: Record<ComplaintStatus, { label: string; icon: typeof Clock; className: string; bgClass: string }> = {
  pending: { label: '待处理', icon: Clock, className: 'text-amber-400', bgClass: 'bg-amber-500/20' },
  investigating: { label: '处理中', icon: AlertOctagon, className: 'text-blue-400', bgClass: 'bg-blue-500/20' },
  resolved: { label: '已解决', icon: CheckCircle, className: 'text-emerald-400', bgClass: 'bg-emerald-500/20' },
  closed: { label: '已关闭', icon: XCircle, className: 'text-slate-400', bgClass: 'bg-slate-500/20' },
};

const typeConfig: Record<ComplaintType, { label: string; color: string }> = {
  salary: { label: '薪资问题', color: 'text-amber-400' },
  safety: { label: '安全问题', color: 'text-red-400' },
  discrimination: { label: '歧视问题', color: 'text-purple-400' },
  fraud: { label: '欺诈问题', color: 'text-rose-400' },
  other: { label: '其他问题', color: 'text-slate-400' },
};

export default function ComplaintList() {
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [filterStatus, setFilterStatus] = useState<ComplaintStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredComplaints = complaints.filter((c) => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        c.student?.name.toLowerCase().includes(query) ||
        c.company?.name.toLowerCase().includes(query) ||
        c.job?.title.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleStartInvestigation = (id: string) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'investigating' as ComplaintStatus } : c))
    );
    if (selectedComplaint?.id === id) {
      setSelectedComplaint((prev) => (prev ? { ...prev, status: 'investigating' } : null));
    }
  };

  const handleResolve = (id: string) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: 'resolved' as ComplaintStatus, resolvedAt: new Date().toISOString() }
          : c
      )
    );
    if (selectedComplaint?.id === id) {
      setSelectedComplaint((prev) =>
        prev ? { ...prev, status: 'resolved', resolvedAt: new Date().toISOString() } : null
      );
    }
  };

  const handleClose = (id: string) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: 'closed' as ComplaintStatus, resolvedAt: new Date().toISOString() }
          : c
      )
    );
    if (selectedComplaint?.id === id) {
      setSelectedComplaint((prev) =>
        prev ? { ...prev, status: 'closed', resolvedAt: new Date().toISOString() } : null
      );
    }
  };

  const statusCounts = {
    all: complaints.length,
    pending: complaints.filter((c) => c.status === 'pending').length,
    investigating: complaints.filter((c) => c.status === 'investigating').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
    closed: complaints.filter((c) => c.status === 'closed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">投诉处理</h1>
          <p className="text-slate-400 mt-1">处理学生投诉，维护实习秩序</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索投诉..."
            className="pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-64"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'pending', 'investigating', 'resolved', 'closed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
              filterStatus === status
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            )}
          >
            {status === 'all' ? '全部' : statusConfig[status].label}
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-slate-700/50">
              {statusCounts[status]}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredComplaints.map((complaint) => {
          const status = statusConfig[complaint.status];
          const type = typeConfig[complaint.type];
          const StatusIcon = status.icon;

          return (
            <div
              key={complaint.id}
              className="bg-slate-800/60 backdrop-blur rounded-2xl p-5 border border-slate-700/50 hover:border-slate-600/50 transition-all"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                      status.bgClass,
                      status.className
                    )}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.label}
                    </span>
                    <span className={cn('text-sm font-medium', type.color)}>
                      {type.label}
                    </span>
                    <span className="text-xs text-slate-500">
                      {complaint.createdAt}
                    </span>
                  </div>

                  <p className="text-white font-medium mb-3 line-clamp-2">
                    {complaint.description}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <User className="w-4 h-4" />
                      <span>{complaint.student?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Building2 className="w-4 h-4" />
                      <span>{complaint.company?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Briefcase className="w-4 h-4" />
                      <span>{complaint.job?.title}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedComplaint(complaint)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-xl text-sm font-medium hover:bg-slate-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    详情
                  </button>
                  {complaint.status === 'pending' && (
                    <button
                      onClick={() => handleStartInvestigation(complaint.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-500 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      受理
                    </button>
                  )}
                  {complaint.status === 'investigating' && (
                    <button
                      onClick={() => handleResolve(complaint.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-500 transition-colors"
                    >
                      <CheckSquare className="w-4 h-4" />
                      解决
                    </button>
                  )}
                  {(complaint.status === 'resolved' || complaint.status === 'investigating') && (
                    <button
                      onClick={() => handleClose(complaint.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-600 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      关闭
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredComplaints.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <FileWarning className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">暂无投诉</p>
          <p className="text-sm mt-1">当前筛选条件下没有投诉记录</p>
        </div>
      )}

      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-700">
            <div className="sticky top-0 bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-white">投诉详情</h3>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                  statusConfig[selectedComplaint.status].bgClass,
                  statusConfig[selectedComplaint.status].className
                )}>
                  {(() => {
                    const Icon = statusConfig[selectedComplaint.status].icon;
                    return <Icon className="w-4 h-4" />;
                  })()}
                  {statusConfig[selectedComplaint.status].label}
                </span>
                <span className={cn('text-sm font-medium', typeConfig[selectedComplaint.type].color)}>
                  {typeConfig[selectedComplaint.type].label}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">投诉内容</h4>
                <p className="text-white bg-slate-700/30 rounded-xl p-4 leading-relaxed">
                  {selectedComplaint.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 text-slate-400 text-sm">
                    <User className="w-4 h-4" />
                    学生信息
                  </div>
                  <p className="text-white font-medium">{selectedComplaint.student?.name}</p>
                  <p className="text-sm text-slate-400">{selectedComplaint.student?.school}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 text-slate-400 text-sm">
                    <Building2 className="w-4 h-4" />
                    企业信息
                  </div>
                  <p className="text-white font-medium">{selectedComplaint.company?.name}</p>
                  <p className="text-sm text-slate-400">{selectedComplaint.company?.contactName}</p>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2 text-slate-400 text-sm">
                  <Briefcase className="w-4 h-4" />
                  相关岗位
                </div>
                <p className="text-white font-medium">{selectedComplaint.job?.title}</p>
                <p className="text-sm text-slate-400">
                  薪资：¥{selectedComplaint.job?.salaryPerHour}/小时
                </p>
              </div>

              {selectedComplaint.result && (
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">处理结果</h4>
                  <p className="text-emerald-400 bg-emerald-500/10 rounded-xl p-4 leading-relaxed">
                    {selectedComplaint.result}
                  </p>
                </div>
              )}

              <div className="flex gap-2 text-xs text-slate-500">
                <span>提交时间：{selectedComplaint.createdAt}</span>
                {selectedComplaint.resolvedAt && (
                  <span>处理时间：{selectedComplaint.resolvedAt}</span>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-800 px-6 py-4 border-t border-slate-700 flex gap-3">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
              >
                关闭
              </button>
              {selectedComplaint.status === 'pending' && (
                <button
                  onClick={() => {
                    handleStartInvestigation(selectedComplaint.id);
                  }}
                  className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-500 transition-colors"
                >
                  受理投诉
                </button>
              )}
              {selectedComplaint.status === 'investigating' && (
                <button
                  onClick={() => {
                    handleResolve(selectedComplaint.id);
                  }}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-500 transition-colors"
                >
                  标记已解决
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
