import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Calendar, Check, X, Eye, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockTeams } from '@/mock/teams';
import { TeamStatus } from '@/constants/enums';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';

const allStatuses = [
  { key: 'all', label: '全部' },
  ...Object.entries(TeamStatus).map(([key, val]) => ({ key, label: val.label })),
];

export default function TeamList() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'school_admin' || user?.role === 'department_admin';
  const [activeStatus, setActiveStatus] = useState('all');
  const [teams, setTeams] = useState(mockTeams);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = activeStatus === 'all'
    ? teams
    : teams.filter((t) => t.status === activeStatus);

  const pendingCount = teams.filter((t) => t.status === 'pending').length;

  const handleApprove = (teamId: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, status: 'approved' as const } : t))
    );
  };

  const handleReject = (teamId: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, status: 'rejected' as const } : t))
    );
    setShowRejectModal(null);
    setRejectReason('');
  };

  const captainName = (team: typeof mockTeams[0]) => {
    const captain = team.members.find((m) => m.role === 'leader');
    return captain ? captain.name : '待指定';
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">三下乡团队</h1>
          <p className="text-surface-500 text-sm mt-1">
            {isAdmin ? '管理全校三下乡实践团队申报' : '查看和创建实践团队'}
          </p>
        </div>
        {!isAdmin ? (
          <Link to="/sanxiaxiang/teams/create" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            创建团队
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <span className="status-badge bg-danger-50 text-danger-600 font-medium">
              待审核 {pendingCount}
            </span>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="grid grid-cols-4 gap-3">
          <div className="card p-4">
            <p className="text-xs text-surface-500">团队总数</p>
            <p className="text-2xl font-bold font-mono text-surface-800 mt-1">{teams.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-surface-500">待审核</p>
            <p className="text-2xl font-bold font-mono text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-surface-500">已通过</p>
            <p className="text-2xl font-bold font-mono text-success-600 mt-1">
              {teams.filter((t) => t.status === 'approved' || t.status === 'ongoing').length}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-surface-500">总参与人数</p>
            <p className="text-2xl font-bold font-mono text-primary-600 mt-1">
              {teams.reduce((acc, t) => acc + t.members.length, 0)}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allStatuses.map((tab) => {
            const count = tab.key === 'all'
              ? teams.length
              : teams.filter((t) => t.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveStatus(tab.key)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5',
                  activeStatus === tab.key
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                )}
              >
                <Filter className="w-3.5 h-3.5" />
                {tab.label}
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  activeStatus === tab.key ? 'bg-white/20' : 'bg-surface-200'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filtered.map((team) => (
            <motion.div
              key={team.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="card card-hover p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-surface-900 leading-snug">{team.name}</h3>
                <span className={cn(
                  'status-badge shrink-0',
                  TeamStatus[team.status as keyof typeof TeamStatus]?.color
                )}>
                  {TeamStatus[team.status as keyof typeof TeamStatus]?.label}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="status-badge bg-primary-100 text-primary-700">
                  {team.theme}
                </span>
                <span className="text-xs text-surface-500 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {team.members.length} 人
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-surface-500">
                <p className="flex items-center gap-1.5">
                  <span className="w-14 text-surface-400">队长：</span>
                  <span className="text-surface-700">{captainName(team)}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(team.startDate)} - {formatDate(team.endDate)}</span>
                </p>
              </div>

              {isAdmin && team.status === 'pending' ? (
                <div className="flex gap-2 pt-2 border-t border-surface-100">
                  <button
                    onClick={() => handleApprove(team.id)}
                    className="flex-1 py-2 rounded-lg bg-success-500 hover:bg-success-600 text-white text-sm font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    通过
                  </button>
                  <button
                    onClick={() => setShowRejectModal(team.id)}
                    className="flex-1 py-2 rounded-lg bg-danger-500 hover:bg-danger-600 text-white text-sm font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    驳回
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t border-surface-100">
                  <Link
                    to={`/sanxiaxiang/teams/${team.id}`}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    查看详情
                  </Link>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-surface-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无团队</p>
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
              <h3 className="text-lg font-bold text-surface-800 mb-2">驳回团队申请</h3>
              <p className="text-sm text-surface-500 mb-4">请填写驳回理由，团队将收到通知</p>
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
