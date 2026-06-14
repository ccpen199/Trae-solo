import { useState } from 'react';
import {
  Wallet,
  DollarSign,
  Users,
  FileText,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import type { PayrollRecord, Application } from '../../../shared/types';
import { api } from '@/utils/api';
import { cn } from '@/lib/utils';

const mockPayrollRecords: PayrollRecord[] = [
  { id: '1', applicationId: '1', companyId: '1', studentId: '1', amount: 2000, status: 'paid', batchId: 'batch-001', paidAt: '2025-01-10', createdAt: '2025-01-08' },
  { id: '2', applicationId: '2', companyId: '1', studentId: '2', amount: 2400, status: 'paid', batchId: 'batch-001', paidAt: '2025-01-10', createdAt: '2025-01-08' },
  { id: '3', applicationId: '3', companyId: '1', studentId: '3', amount: 1800, status: 'pending', createdAt: '2025-01-15' },
  { id: '4', applicationId: '4', companyId: '1', studentId: '4', amount: 2200, status: 'pending', createdAt: '2025-01-15' },
];

const mockPendingApplications: Application[] = [
  {
    id: '1', studentId: '1', jobId: '1', status: 'working', appliedAt: '2024-12-01',
    workHours: 80, salary: 2000,
    student: { id: '1', studentId: '2021001', name: '李明', school: '清华大学', major: '计算机科学与技术', grade: '大三', rating: 4.9, verified: true, createdAt: '' },
    job: { id: '1', companyId: '1', title: '前端开发实习生', description: '', location: '', salaryPerHour: 25, maxHoursPerDay: 8, maxHoursPerWeek: 40, majorRequired: [], workDays: [], workStartTime: '', workEndTime: '', status: 'published', createdAt: '' },
  },
  {
    id: '2', studentId: '2', jobId: '2', status: 'working', appliedAt: '2024-12-05',
    workHours: 96, salary: 2880,
    student: { id: '2', studentId: '2021002', name: '王芳', school: '北京大学', major: '软件工程', grade: '大三', rating: 4.7, verified: true, createdAt: '' },
    job: { id: '2', companyId: '1', title: 'Java后端开发实习生', description: '', location: '', salaryPerHour: 30, maxHoursPerDay: 8, maxHoursPerWeek: 40, majorRequired: [], workDays: [], workStartTime: '', workEndTime: '', status: 'published', createdAt: '' },
  },
];

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  pending: { label: '待处理', className: 'bg-amber-100 text-amber-700', icon: Clock },
  processing: { label: '处理中', className: 'bg-blue-100 text-blue-700', icon: Clock },
  paid: { label: '已发放', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  failed: { label: '发放失败', className: 'bg-red-100 text-red-700', icon: AlertCircle },
};

export default function CompanyPayroll() {
  const [pendingApps] = useState<Application[]>(mockPendingApplications);
  const [payrollRecords] = useState<PayrollRecord[]>(mockPayrollRecords);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('pending');

  const totalPending = payrollRecords.filter((r) => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);
  const totalPaid = payrollRecords.filter((r) => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0);

  const toggleSelect = (appId: string) => {
    setSelectedApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedApps(selectedApps.length === pendingApps.length ? [] : pendingApps.map((a) => a.id));
  };

  const selectedTotal = pendingApps.filter((a) => selectedApps.includes(a.id)).reduce((sum, a) => sum + (a.salary || 0), 0);

  const handleBatchPay = async () => {
    try {
      await api.post('/companies/payroll/batch', { applicationIds: selectedApps });
      alert('代发申请已提交');
    } catch (error) {
      console.error('代发失败', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">工资代发</h1>
        <p className="text-gray-500 mt-1">管理员工薪资发放</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">待发金额</p>
              <p className="text-2xl font-bold text-gray-900">¥{totalPending.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已发金额</p>
              <p className="text-2xl font-bold text-gray-900">¥{totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">在职员工</p>
              <p className="text-2xl font-bold text-gray-900">{pendingApps.length} 人</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card">
        <div className="p-4 border-b border-gray-100">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            <button onClick={() => setActiveTab('pending')}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'pending' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900')}>
              待发薪岗位
            </button>
            <button onClick={() => setActiveTab('records')}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === 'records' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900')}>
              代发记录
            </button>
          </div>
        </div>

        {activeTab === 'pending' && (
          <div>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={selectedApps.length === pendingApps.length && pendingApps.length > 0}
                  onChange={toggleSelectAll} className="w-4 h-4 text-primary-600 rounded" />
                <span className="text-sm text-gray-700">全选</span>
              </label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  已选 {selectedApps.length} 项，合计
                  <span className="text-accent-500 font-semibold ml-1">¥{selectedTotal.toLocaleString()}</span>
                </span>
                <button onClick={handleBatchPay} disabled={selectedApps.length === 0}
                  className={cn('flex items-center gap-2 px-5 py-2 rounded-xl font-medium transition-colors',
                    selectedApps.length > 0 ? 'bg-accent-500 text-white hover:bg-accent-600 shadow-md shadow-accent-500/20' : 'bg-gray-200 text-gray-400 cursor-not-allowed')}>
                  <Send className="w-4 h-4" />批量代发
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {pendingApps.map((app) => (
                <div key={app.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <input type="checkbox" checked={selectedApps.includes(app.id)}
                    onChange={() => toggleSelect(app.id)} className="w-4 h-4 text-primary-600 rounded" />
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{app.student?.name}</p>
                    <p className="text-sm text-gray-500">{app.job?.title} · {app.student?.school}</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="font-semibold text-gray-900">¥{app.salary?.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{app.workHours} 小时</p>
                  </div>
                  <button className="px-4 py-2 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors font-medium">
                    生成工资单
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="divide-y divide-gray-100">
            {payrollRecords.map((record) => {
              const StatusIcon = statusConfig[record.status].icon;
              return (
                <div key={record.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">工资单 #{record.id}</p>
                    <p className="text-sm text-gray-500">{record.createdAt}</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="font-semibold text-gray-900">¥{record.amount.toLocaleString()}</p>
                    {record.batchId && <p className="text-xs text-gray-400">批次：{record.batchId}</p>}
                  </div>
                  <span className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium', statusConfig[record.status].className)}>
                    <StatusIcon className="w-3.5 h-3.5" />{statusConfig[record.status].label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />薪资明细
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">员工</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">岗位</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">工时</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">时薪</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">应发工资</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pendingApps.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary-600" />
                      </div>
                      <span className="font-medium text-gray-900">{app.student?.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{app.job?.title}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{app.workHours} 小时</td>
                  <td className="py-3 px-4 text-right text-gray-600">¥{app.job?.salaryPerHour}/时</td>
                  <td className="py-3 px-4 text-right font-semibold text-accent-500">¥{app.salary?.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">待发薪</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
