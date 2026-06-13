import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Lock, Accessibility, CheckCircle2, Clock,
  FileText, ChevronRight, XCircle, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/useUserStore';
import { mockServiceRecords } from '@/data/mockData';
import type { RecordStatus } from '@/types';

type TabKey = 'all' | 'processing' | 'completed';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'processing', label: '办理中' },
  { key: 'completed', label: '已完成' },
];

const STATUS_MAP: Record<RecordStatus, { label: string; cls: string }> = {
  pending: { label: '待受理', cls: 'badge-warning' },
  processing: { label: '办理中', cls: 'badge-gov' },
  completed: { label: '已完成', cls: 'badge-success' },
  rejected: { label: '已驳回', cls: 'badge-danger' },
  overdue: { label: '已逾期', cls: 'badge-danger' },
};

const STATUS_ICON: Record<RecordStatus, typeof Clock> = {
  pending: Clock,
  processing: Clock,
  completed: CheckCircle2,
  rejected: XCircle,
  overdue: AlertCircle,
};

function maskIdCard(id: string): string {
  if (id.length < 10) return id;
  return id.slice(0, 6) + '********' + id.slice(-4);
}

function maskPhone(phone: string): string {
  if (phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

export default function Profile() {
  const user = useUserStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const allRecords = useMemo(
    () => mockServiceRecords
      .filter((r) => r.userId === user?.id)
      .sort((a, b) => b.submitTime.localeCompare(a.submitTime)),
    [user?.id],
  );

  const filteredRecords = useMemo(() => {
    if (activeTab === 'all') return allRecords;
    if (activeTab === 'processing') {
      return allRecords.filter((r) => r.status === 'pending' || r.status === 'processing');
    }
    return allRecords.filter((r) => r.status === 'completed');
  }, [allRecords, activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 pb-8 animate-fade-in">
      <div className="container pt-6 space-y-6">
        {/* 用户信息卡片 */}
        <section className="card p-6 animate-slide-up">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-full bg-gov-gradient flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {user?.name?.charAt(0) ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-slate-900">{user?.name ?? '未登录'}</h2>
                {user?.isRealNameVerified && (
                  <span className="badge-success">
                    <CheckCircle2 className="w-3 h-3" />
                    已实名
                  </span>
                )}
              </div>
              <div className="space-y-1.5 mt-2">
                <p className="text-sm text-slate-500">
                  身份证号：<span className="text-slate-700">{maskIdCard(user?.idCard ?? '')}</span>
                </p>
                <p className="text-sm text-slate-500">
                  手机号码：<span className="text-slate-700">{maskPhone(user?.phone ?? '')}</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 我的办件 */}
        <section className="animate-slide-up">
          <h3 className="section-title mb-3">
            <FileText className="w-5 h-5 text-gov-600" />
            我的办件
          </h3>
          <div className="flex gap-2 mb-4">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  activeTab === tab.key ? 'tab-btn-active' : 'tab-btn',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {filteredRecords.length > 0 ? (
            <div className="space-y-3">
              {filteredRecords.map((record) => {
                const statusInfo = STATUS_MAP[record.status];
                const StatusIcon = STATUS_ICON[record.status];
                return (
                  <div key={record.id} className="card px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">{record.serviceName}</p>
                      <span className={cn(statusInfo.cls, 'shrink-0 ml-3')}>{statusInfo.label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <StatusIcon className="w-3.5 h-3.5" />
                        {record.bureau}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {record.submitTime}
                      </span>
                    </div>
                    {record.rejectReason && (
                      <p className="mt-2 text-xs text-danger-600 bg-danger-50 rounded px-3 py-1.5">
                        驳回原因：{record.rejectReason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card p-8 text-center text-slate-400 text-sm">暂无相关办件记录</div>
          )}
        </section>

        {/* 快捷入口 */}
        <section className="animate-slide-up">
          <h3 className="section-title mb-3">
            <User className="w-5 h-5 text-gov-600" />
            快捷入口
          </h3>
          <div className="card divide-y divide-slate-100">
            {[
              { icon: User, label: '个人信息修改', to: '/profile/edit' },
              { icon: Lock, label: '密码修改', to: '/profile/password' },
              { icon: Accessibility, label: '无障碍设置', to: '/profile/accessibility' },
            ].map(({ icon: Icon, label, to }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gov-50 flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-gov-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
