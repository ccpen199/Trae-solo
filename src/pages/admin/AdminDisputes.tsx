import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  User,
  FileText,
  Eye,
  Gavel,
  DollarSign,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { disputeApi } from '../../lib/api';
import type { Dispute, DisputeStatus } from '../../../shared/types';
import { cn } from '../../lib/utils';

const AdminDisputes = () => {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | ''>('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolveForm, setResolveForm] = useState({
    status: 'resolved' as DisputeStatus,
    resolution: '',
    amountDistribution: {} as { [key: number]: number },
  });

  useEffect(() => {
    const fetchDisputes = async () => {
      setLoading(true);
      try {
        const query: any = { page, pageSize };
        if (statusFilter) query.status = statusFilter;
        const data = await disputeApi.getList(query);
        setDisputes(data.data);
        setTotal(data.total);
      } catch (err) {
        console.error('Failed to fetch disputes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();
  }, [page, statusFilter]);

  const handleResolve = async () => {
    if (!selectedDispute) return;
    try {
      await disputeApi.resolve(selectedDispute.id, resolveForm);
      setShowResolveModal(false);
      setSelectedDispute(null);
      const query: any = { page, pageSize };
      if (statusFilter) query.status = statusFilter;
      const data = await disputeApi.getList(query);
      setDisputes(data.data);
    } catch (err) {
      console.error('Failed to resolve dispute:', err);
    }
  };

  const filteredDisputes = disputes.filter(dispute =>
    !searchKeyword ||
    dispute.reason.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    dispute.description.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    dispute.task?.title?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    dispute.initiator?.name?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    dispute.respondent?.name?.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const statuses: { value: DisputeStatus | ''; label: string; color: string }[] = [
    { value: '', label: '全部状态', color: 'bg-slate-100 text-slate-700' },
    { value: 'pending', label: '待处理', color: 'bg-amber-100 text-amber-700' },
    { value: 'reviewing', label: '处理中', color: 'bg-blue-100 text-blue-700' },
    { value: 'resolved', label: '已解决', color: 'bg-green-100 text-green-700' },
    { value: 'closed', label: '已关闭', color: 'bg-slate-100 text-slate-700' },
  ];

  const getStatusColor = (status: DisputeStatus) => {
    const statusInfo = statuses.find(s => s.value === status);
    return statusInfo?.color || 'bg-slate-100 text-slate-700';
  };

  const getStatusLabel = (status: DisputeStatus) => {
    const statusInfo = statuses.find(s => s.value === status);
    return statusInfo?.label || status;
  };

  const getStatusIcon = (status: DisputeStatus) => {
    const icons: Record<DisputeStatus, typeof Clock> = {
      pending: Clock,
      reviewing: AlertTriangle,
      resolved: CheckCircle,
      closed: XCircle,
    };
    return icons[status] || Clock;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">争议仲裁</h2>
          <p className="text-slate-500 mt-1">处理平台交易争议和纠纷</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {['pending', 'reviewing', 'resolved', 'closed'].map((status, idx) => {
          const count = disputes.filter(d => d.status === status).length;
          const statusInfo = statuses.find(s => s.value === status)!;
          const colors = [
            'from-amber-500 to-orange-500',
            'from-blue-500 to-indigo-500',
            'from-green-500 to-emerald-500',
            'from-slate-500 to-slate-600',
          ];
          return (
            <div key={status} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br', colors[idx])}>
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <span className={cn('text-xs px-2 py-1 rounded-full font-medium', statusInfo.color)}>
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{count}</p>
              <p className="text-sm text-slate-500 mt-1">个争议</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索争议内容或相关任务..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DisputeStatus | '')}
              className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {statuses.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredDisputes.length > 0 ? (
          filteredDisputes.map(dispute => {
            const StatusIcon = getStatusIcon(dispute.status);
            return (
              <div key={dispute.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h3 className="text-lg font-semibold text-slate-800">{dispute.reason}</h3>
                        <span className={cn('px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1', getStatusColor(dispute.status))}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {getStatusLabel(dispute.status)}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm mb-3">{dispute.description}</p>
                      {dispute.task && (
                        <p className="text-sm text-blue-600 cursor-pointer hover:underline" onClick={() => navigate(`/tasks/${dispute.taskId}`)}>
                          关联任务: {dispute.task.title}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => navigate(`/tasks/${dispute.taskId}`)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4 text-slate-500" />
                      </button>
                      {(dispute.status === 'pending' || dispute.status === 'reviewing') && (
                        <button
                          onClick={() => {
                            setSelectedDispute(dispute);
                            setResolveForm({
                              status: 'resolved',
                              resolution: '',
                              amountDistribution: {
                                [dispute.initiatorId]: Math.floor((dispute.task?.finalBudget || 0) * 0.5),
                                [dispute.respondentId]: Math.floor((dispute.task?.finalBudget || 0) * 0.5),
                              },
                            });
                            setShowResolveModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Gavel className="w-4 h-4" />
                          仲裁处理
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {dispute.initiator?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{dispute.initiator?.name}</p>
                        <p className="text-xs text-slate-500">发起方</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {dispute.respondent?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{dispute.respondent?.name}</p>
                        <p className="text-xs text-slate-500">被诉方</p>
                      </div>
                    </div>
                  </div>

                  {dispute.resolution && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                      <p className="text-sm font-medium text-blue-800 mb-1">仲裁结果</p>
                      <p className="text-sm text-blue-600">{dispute.resolution}</p>
                      {dispute.resolvedBy && (
                        <p className="text-xs text-blue-500 mt-2">
                          由 {dispute.resolver?.name} 于 {new Date(dispute.resolvedAt!).toLocaleString()} 处理
                        </p>
                      )}
                    </div>
                  )}

                  {dispute.evidence.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-slate-700 mb-2">证据材料</p>
                      <div className="flex flex-wrap gap-2">
                        {dispute.evidence.map((ev, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                            <FileText className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-600">{ev}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">暂无争议</h3>
            <p className="text-slate-500">目前没有需要处理的争议</p>
          </div>
        )}
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-slate-600">
            {page} / {Math.ceil(total / pageSize)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / pageSize)}
            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}

      {showResolveModal && selectedDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-6">争议仲裁处理</h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="font-semibold text-slate-800">{selectedDispute.reason}</span>
                </div>
                <p className="text-sm text-slate-600">{selectedDispute.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-600 mb-1">发起方</p>
                  <p className="font-medium text-slate-800">{selectedDispute.initiator?.name}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl">
                  <p className="text-sm text-purple-600 mb-1">被诉方</p>
                  <p className="font-medium text-slate-800">{selectedDispute.respondent?.name}</p>
                </div>
              </div>

              {selectedDispute.task && (
                <div className="p-4 bg-amber-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-amber-600 mb-1">关联任务</p>
                      <p className="font-medium text-slate-800">{selectedDispute.task.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-amber-600 mb-1">争议金额</p>
                      <p className="text-xl font-bold text-slate-800">
                        ¥{selectedDispute.task.finalBudget?.toLocaleString() || selectedDispute.task.budgetMax.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">处理结果</label>
                <select
                  value={resolveForm.status}
                  onChange={(e) => setResolveForm({ ...resolveForm, status: e.target.value as DisputeStatus })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="resolved">已解决</option>
                  <option value="closed">已关闭</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">仲裁说明</label>
                <textarea
                  value={resolveForm.resolution}
                  onChange={(e) => setResolveForm({ ...resolveForm, resolution: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="请详细说明仲裁结果和理由"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">资金分配</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-700">{selectedDispute.initiator?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-slate-500" />
                      <input
                        type="number"
                        value={resolveForm.amountDistribution[selectedDispute.initiatorId] || ''}
                        onChange={(e) => setResolveForm({
                          ...resolveForm,
                          amountDistribution: {
                            ...resolveForm.amountDistribution,
                            [selectedDispute.initiatorId]: Number(e.target.value),
                          },
                        })}
                        className="w-32 px-3 py-1.5 border border-slate-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-700">{selectedDispute.respondent?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-slate-500" />
                      <input
                        type="number"
                        value={resolveForm.amountDistribution[selectedDispute.respondentId] || ''}
                        onChange={(e) => setResolveForm({
                          ...resolveForm,
                          amountDistribution: {
                            ...resolveForm.amountDistribution,
                            [selectedDispute.respondentId]: Number(e.target.value),
                          },
                        })}
                        className="w-32 px-3 py-1.5 border border-slate-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowResolveModal(false);
                  setSelectedDispute(null);
                }}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleResolve}
                disabled={!resolveForm.resolution}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Gavel className="w-4 h-4" />
                确认仲裁
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDisputes;
