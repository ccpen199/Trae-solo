import { useEffect, useState } from 'react';
import { riskApi } from '../lib/api';
import type { RiskItem } from '../../shared/types.js';
import { AlertTriangle, CheckCircle, XCircle, Info, RefreshCw, UserX } from 'lucide-react';

const levelMap: Record<RiskItem['level'], { label: string; className: string }> = {
  low: { label: '低', className: 'bg-yellow-100 text-yellow-600' },
  medium: { label: '中', className: 'bg-orange-100 text-orange-600' },
  high: { label: '高', className: 'bg-red-100 text-red-600' },
};

const typeMap: Record<RiskItem['type'], string> = {
  abnormal_account: '异常账号',
  device_fraud: '设备刷量',
  address_cluster: '地址集中',
  high_frequency: '高频操作',
};

const statusMap: Record<RiskItem['status'], { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-blue-100 text-blue-600' },
  processed: { label: '已处理', className: 'bg-green-100 text-green-600' },
  dismissed: { label: '已忽略', className: 'bg-gray-100 text-gray-600' },
};

export default function RiskList() {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<RiskItem['status'] | ''>('');
  const [pendingCount, setPendingCount] = useState(0);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null);
  const [processForm, setProcessForm] = useState({
    action: 'approve' as 'approve' | 'reject' | 'dismiss' | 'ban',
    note: '',
  });
  const [evidenceData, setEvidenceData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [page, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [riskRes, countRes] = await Promise.all([
        riskApi.getQueue(page, 10, statusFilter || undefined),
        riskApi.getPendingCount(),
      ]);
      if (riskRes.data.code === 200) {
        setRisks(riskRes.data.data.items);
        setTotal(riskRes.data.data.total);
      }
      if (countRes.data.code === 200) {
        setPendingCount(countRes.data.data?.count || 0);
      }
    } catch (error) {
      console.error('Load risks failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvidence = async (id: number) => {
    try {
      const res = await riskApi.getEvidence(id);
      if (res.data.code === 200) {
        setEvidenceData(res.data.data);
      }
    } catch (error) {
      console.error('Load evidence failed:', error);
    }
  };

  const openProcessModal = (risk: RiskItem) => {
    setSelectedRisk(risk);
    setProcessForm({ action: 'approve', note: '' });
    loadEvidence(risk.id);
    setShowProcessModal(true);
  };

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRisk) return;
    try {
      await riskApi.process(selectedRisk.id, processForm.action, processForm.note);
      setShowProcessModal(false);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || '操作失败');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">风控管理</h1>
          <p className="text-gray-500 mt-1">处理风险事件，保障活动公平</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg">
            <AlertTriangle size={18} />
            <span className="font-medium">待处理: {pendingCount}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as RiskItem['status'] | '');
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="processed">已处理</option>
          <option value="dismissed">已忽略</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : risks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            暂无风控数据
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">风险类型</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">等级</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">用户</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">状态</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">检测时间</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {risks.map((risk) => {
                  const level = levelMap[risk.level];
                  const status = statusMap[risk.status];
                  return (
                    <tr key={risk.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={16} className="text-orange-500" />
                          <span className="text-gray-800">{typeMap[risk.type]}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${level.className}`}>
                          {level.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-600">{risk.userId || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(risk.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {risk.status === 'pending' && (
                            <button
                              onClick={() => openProcessModal(risk)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              处理
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="px-6 py-4 border-t flex items-center justify-between">
              <span className="text-sm text-gray-500">共 {total} 条记录</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                <span className="text-sm text-gray-600">第 {page} 页</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 10 >= total}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showProcessModal && selectedRisk && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">处理风控项</h2>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 w-20">风险类型:</span>
                <span className="text-gray-800 font-medium">{typeMap[selectedRisk.type]}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 w-20">风险等级:</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${levelMap[selectedRisk.level].className}`}>
                  {levelMap[selectedRisk.level].label}
                </span>
              </div>
              {evidenceData && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">风险证据:</p>
                  <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(evidenceData, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <form onSubmit={handleProcess} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">处理动作 *</label>
                <select
                  value={processForm.action}
                  onChange={(e) => setProcessForm({ ...processForm, action: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="approve">通过（正常发放）</option>
                  <option value="reject">驳回（取消中奖）</option>
                  <option value="dismiss">忽略（标记为误报）</option>
                  <option value="ban">封禁（禁止参与）</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">处理备注 *</label>
                <textarea
                  value={processForm.note}
                  onChange={(e) => setProcessForm({ ...processForm, note: e.target.value })}
                  rows={3}
                  placeholder="请输入处理说明..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProcessModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
                >
                  {processForm.action === 'approve' && <CheckCircle size={16} />}
                  {processForm.action === 'reject' && <XCircle size={16} />}
                  {processForm.action === 'dismiss' && <Info size={16} />}
                  {processForm.action === 'ban' && <UserX size={16} />}
                  确认处理
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
