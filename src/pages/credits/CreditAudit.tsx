import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { mockCreditApplications } from '@/mock/credits';
import { CreditStatus } from '@/constants/enums';
import dayjs from 'dayjs';
import type { CreditApplication } from '@/types';

const statusTabs = [
  { key: 'all', label: '全部' },
  ...Object.entries(CreditStatus).map(([key, val]) => ({ key, label: val.label })),
];

const typeLabels: Record<string, string> = {
  sanxiaxiang: '三下乡',
  activity: '活动',
  volunteer: '志愿者',
  other: '其他',
};

export default function CreditAudit() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [applications, setApplications] = useState<CreditApplication[]>(mockCreditApplications);

  const filtered = applications.filter((a) => activeFilter === 'all' || a.status === activeFilter);

  const handleApprove = (id: string) => {
    setApplications((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: 'approved' as const, reviewedAt: new Date().toISOString() } : a
      )
    );
  };

  const handleReject = (id: string) => {
    setApplications((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: 'rejected' as const, reviewedAt: new Date().toISOString() } : a
      )
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-surface-900">学分审核</h1>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === tab.key
                ? 'bg-primary-800 text-white'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50">
                <th className="text-left py-3 px-4 text-surface-500 font-medium">学生姓名</th>
                <th className="text-left py-3 px-4 text-surface-500 font-medium">学号</th>
                <th className="text-left py-3 px-4 text-surface-500 font-medium">类型</th>
                <th className="text-left py-3 px-4 text-surface-500 font-medium">关联名称</th>
                <th className="text-left py-3 px-4 text-surface-500 font-medium">学时</th>
                <th className="text-left py-3 px-4 text-surface-500 font-medium">状态</th>
                <th className="text-left py-3 px-4 text-surface-500 font-medium">申请日期</th>
                <th className="text-left py-3 px-4 text-surface-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => (
                <tr key={app.id} className="border-b border-surface-100 hover:bg-surface-50/50">
                  <td className="py-3 px-4 text-surface-700 font-medium">{app.studentId}</td>
                  <td className="py-3 px-4 text-surface-600 font-mono">{app.studentId}</td>
                  <td className="py-3 px-4 text-surface-600">{typeLabels[app.type] || app.type}</td>
                  <td className="py-3 px-4 text-surface-700 max-w-[200px] truncate">{app.relatedName}</td>
                  <td className="py-3 px-4 text-surface-700 font-mono">{app.creditHours}</td>
                  <td className="py-3 px-4">
                    <span className={`status-badge ${CreditStatus[app.status as keyof typeof CreditStatus]?.color}`}>
                      {CreditStatus[app.status as keyof typeof CreditStatus]?.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-surface-500">{dayjs(app.appliedAt).format('YYYY-MM-DD')}</td>
                  <td className="py-3 px-4">
                    {app.status === 'pending' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(app.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-success-50 text-success-600 hover:bg-success-100 transition-colors"
                        >
                          <CheckCircle className="w-3 h-3" />
                          通过
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-danger-50 text-danger-500 hover:bg-danger-100 transition-colors"
                        >
                          <XCircle className="w-3 h-3" />
                          驳回
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-surface-400">已处理</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-surface-400">暂无待审核申请</div>
        )}
      </div>
    </div>
  );
}
