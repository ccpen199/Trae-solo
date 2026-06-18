import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, MapPin, Calendar, Users, Clock, Check, X, Eye, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockActivities } from '@/mock/activities';
import { ActivityStatus } from '@/constants/enums';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

const statusTabs = [
  { key: 'all', label: '全部' },
  ...Object.entries(ActivityStatus).map(([key, val]) => ({ key, label: val.label })),
];

export default function ActivityList() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [activities, setActivities] = useState(mockActivities);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'school_admin' || user?.role === 'department_admin';

  const filtered = activities.filter((a) => {
    const matchFilter = activeFilter === 'all' || a.status === activeFilter;
    const matchSearch = a.title.includes(search) || a.organizer.includes(search);
    return matchFilter && matchSearch;
  });

  const pendingCount = activities.filter((a) => a.status === 'pending').length;

  const handleApprove = (id: string) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'approved' as const } : a))
    );
  };

  const handleReject = (id: string) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'rejected' as const } : a))
    );
    setShowRejectModal(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">实践活动</h1>
          <p className="text-surface-500 text-sm mt-1">
            {isAdmin ? '管理全校社会实践活动' : '发现并报名感兴趣的实践活动'}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <span className="status-badge bg-danger-50 text-danger-600 font-medium">
              待审核 {pendingCount}
            </span>
            <button className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              发布活动
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="grid grid-cols-4 gap-3">
          <div className="card p-4">
            <p className="text-xs text-surface-500">活动总数</p>
            <p className="text-2xl font-bold font-mono text-surface-800 mt-1">{activities.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-surface-500">报名中</p>
            <p className="text-2xl font-bold font-mono text-primary-600 mt-1">
              {activities.filter((a) => a.status === 'approved').length}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-surface-500">待审核</p>
            <p className="text-2xl font-bold font-mono text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-surface-500">总参与人次</p>
            <p className="text-2xl font-bold font-mono text-success-600 mt-1">
              {activities.reduce((acc, a) => acc + a.participants.length, 0)}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusTabs.map((tab) => {
            const count = tab.key === 'all'
              ? activities.length
              : activities.filter((a) => a.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5',
                  activeFilter === tab.key
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                )}
              >
                <Filter className="w-3.5 h-3.5" />
                {tab.label}
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  activeFilter === tab.key ? 'bg-white/20' : 'bg-surface-200'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="搜索活动..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filtered.map((activity, i) => (
            <motion.div
              key={activity.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.03, duration: 0.25 }}
            >
              <div className="block card card-hover overflow-hidden">
                <Link to={`/activities/${activity.id}`} className="block">
                  <div className="h-40 bg-gradient-to-br from-primary-100 to-accent-100 relative">
                    {activity.coverImage ? (
                      <img src={activity.coverImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Calendar className="w-12 h-12 text-primary-300" />
                      </div>
                    )}
                    <span className={cn(
                      'status-badge absolute top-3 right-3',
                      ActivityStatus[activity.status as keyof typeof ActivityStatus]?.color
                    )}>
                      {ActivityStatus[activity.status as keyof typeof ActivityStatus]?.label}
                    </span>
                  </div>
                </Link>

                <div className="p-4 space-y-3">
                  <Link to={`/activities/${activity.id}`}>
                    <h3 className="font-semibold text-surface-900 line-clamp-2 hover:text-primary-700 transition-colors">
                      {activity.title}
                    </h3>
                  </Link>

                  <div className="flex flex-wrap gap-2 text-xs text-surface-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {activity.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(activity.startTime)} - {formatDate(activity.endTime)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-surface-500">
                      <Users className="w-3 h-3" />
                      {activity.registeredCount}/{activity.maxParticipants}
                    </span>
                    <span className="status-badge bg-accent-100 text-accent-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activity.creditStandard}学分
                    </span>
                  </div>

                  <span className="text-xs text-surface-400">主办：{activity.organizer}</span>

                  {isAdmin && activity.status === 'pending' ? (
                    <div className="flex gap-2 pt-2 border-t border-surface-100">
                      <button
                        onClick={() => handleApprove(activity.id)}
                        className="flex-1 py-2 rounded-lg bg-success-500 hover:bg-success-600 text-white text-sm font-medium flex items-center justify-center gap-1 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        通过
                      </button>
                      <button
                        onClick={() => setShowRejectModal(activity.id)}
                        className="flex-1 py-2 rounded-lg bg-danger-500 hover:bg-danger-600 text-white text-sm font-medium flex items-center justify-center gap-1 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        驳回
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-surface-100">
                      <Link
                        to={`/activities/${activity.id}`}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        查看详情
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-surface-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无符合条件的活动</p>
        </div>
      )}

      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowRejectModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-surface-800 mb-2">驳回活动申请</h3>
              <p className="text-sm text-surface-500 mb-4">请填写驳回理由，主办方将收到通知</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入驳回原因..."
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowRejectModal(null)}
                  className="flex-1 py-2.5 rounded-lg border border-surface-200 text-surface-600 text-sm font-medium hover:bg-surface-50"
                >
                  取消
                </button>
                <button
                  onClick={() => handleReject(showRejectModal)}
                  disabled={!rejectReason.trim()}
                  className="flex-1 py-2.5 rounded-lg bg-danger-500 hover:bg-danger-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium"
                >
                  确认驳回
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
