import { useState, useEffect } from 'react';
import { Plus, Eye, CheckCircle, XCircle, AlertTriangle, Download, Search, RefreshCw, Filter, Flag } from 'lucide-react';
import { reconciliationApi, mastersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface Reconciliation {
  id: number;
  recon_no: string;
  store_id: number;
  store_name: string;
  cashier_id: number | null;
  cashier_name: string | null;
  channel: string | null;
  recon_date: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  total_order_amount: number;
  total_payment_amount: number;
  total_refund_amount: number;
  total_expected: number;
  total_actual: number;
  total_difference: number;
  over_amount: number;
  short_amount: number;
  match_count: number;
  mismatch_count: number;
  total_count: number;
  reviewer_id: number | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  created_at: string;
  items?: ReconciliationItem[];
}

interface ReconciliationItem {
  id: number;
  recon_id: number;
  order_id: number | null;
  order_no: string | null;
  payment_id: number | null;
  refund_id: number | null;
  type: 'order' | 'payment' | 'refund';
  channel: string;
  expected_amount: number;
  actual_amount: number;
  difference: number;
  status: 'matched' | 'over' | 'short' | 'pending';
  marked_by: number | null;
  marked_at: string | null;
  remark: string | null;
}

const statusMap: Record<string, { label: string; class: string }> = {
  draft: { label: '草稿', class: 'bg-gray-100 text-gray-700' },
  pending: { label: '待审核', class: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '已通过', class: 'bg-green-100 text-green-700' },
  rejected: { label: '已拒绝', class: 'bg-red-100 text-red-700' }
};

const itemStatusMap: Record<string, { label: string; class: string }> = {
  matched: { label: '一致', class: 'bg-green-100 text-green-700' },
  over: { label: '长款', class: 'bg-blue-100 text-blue-700' },
  short: { label: '短款', class: 'bg-red-100 text-red-700' },
  pending: { label: '待核对', class: 'bg-gray-100 text-gray-700' }
};

const channelMap: Record<string, string> = {
  cash: '现金',
  qr: '扫码支付',
  bank_card: '银行卡',
  stored_value: '储值卡',
  coupon: '优惠券'
};

const typeMap: Record<string, string> = {
  order: '订单',
  payment: '支付',
  refund: '退款'
};

export default function Reconciliation() {
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecon, setSelectedRecon] = useState<Reconciliation | null>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [markModal, setMarkModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReconciliationItem | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [cashiers, setCashiers] = useState<any[]>([]);
  const hasRole = useAuthStore(state => state.hasRole);
  const hasPermission = useAuthStore(state => state.hasPermission);

  const [filters, setFilters] = useState({
    store_id: '',
    cashier_id: '',
    status: '',
    channel: '',
    start_date: '',
    end_date: ''
  });

  const [createForm, setCreateForm] = useState({
    store_id: '',
    cashier_id: '',
    channel: '',
    recon_date: new Date().toISOString().split('T')[0]
  });

  const [markForm, setMarkForm] = useState({
    status: 'matched' as 'matched' | 'over' | 'short',
    actual_amount: '',
    remark: ''
  });

  const [reviewForm, setReviewForm] = useState({
    action: 'approve' as 'approve' | 'reject',
    remark: ''
  });

  useEffect(() => {
    loadData();
    loadOptions();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.store_id) params.store_id = filters.store_id;
      if (filters.cashier_id) params.cashier_id = filters.cashier_id;
      if (filters.status) params.status = filters.status;
      if (filters.channel) params.channel = filters.channel;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      
      const res = await reconciliationApi.getReconciliations(params);
      setReconciliations(res.data.list || res.data || []);
    } catch (error: any) {
      alert('加载对账记录失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [storesRes, cashiersRes] = await Promise.all([
        mastersApi.getStores(),
        mastersApi.getUsers({ role: 'cashier' })
      ]);
      setStores(storesRes.data.list || storesRes.data || []);
      setCashiers(cashiersRes.data.list || cashiersRes.data || []);
    } catch (error) {
      console.error('加载选项失败', error);
    }
  };

  const handleCreateRecon = async () => {
    if (!createForm.store_id || !createForm.recon_date) {
      alert('请填写门店和对账日期');
      return;
    }
    try {
      const data: any = {
        store_id: Number(createForm.store_id),
        recon_date: createForm.recon_date
      };
      if (createForm.cashier_id) data.cashier_id = Number(createForm.cashier_id);
      if (createForm.channel) data.channel = createForm.channel;
      
      await reconciliationApi.createReconciliation(data);
      alert('对账已创建');
      setCreateModal(false);
      setCreateForm({
        store_id: '',
        cashier_id: '',
        channel: '',
        recon_date: new Date().toISOString().split('T')[0]
      });
      loadData();
    } catch (error: any) {
      alert('创建对账失败: ' + error.message);
    }
  };

  const handleReview = async () => {
    if (!selectedRecon) return;
    if (reviewForm.action === 'reject' && !reviewForm.remark) {
      alert('拒绝请填写备注');
      return;
    }
    try {
      await reconciliationApi.reviewReconciliation(selectedRecon.id, {
        action: reviewForm.action,
        remark: reviewForm.remark
      });
      alert(reviewForm.action === 'approve' ? '对账已通过' : '对账已拒绝');
      setDetailModal(false);
      setSelectedRecon(null);
      loadData();
    } catch (error: any) {
      alert('审核失败: ' + error.message);
    }
  };

  const handleMarkItem = async () => {
    if (!selectedItem) return;
    try {
      const data: any = {
        status: markForm.status
      };
      if (markForm.actual_amount) {
        data.actual_amount = parseFloat(markForm.actual_amount);
      }
      if (markForm.remark) {
        data.remark = markForm.remark;
      }
      
      await reconciliationApi.markItem(selectedItem.id, data);
      alert('标记成功');
      setMarkModal(false);
      setSelectedItem(null);
      if (selectedRecon) {
        viewDetail(selectedRecon);
      }
    } catch (error: any) {
      alert('标记失败: ' + error.message);
    }
  };

  const viewDetail = async (recon: Reconciliation) => {
    try {
      const res = await reconciliationApi.getReconciliation(recon.id);
      setSelectedRecon(res.data);
      setReviewForm({ action: 'approve', remark: '' });
      setDetailModal(true);
    } catch (error: any) {
      alert('加载对账详情失败: ' + error.message);
    }
  };

  const openMarkModal = (item: ReconciliationItem) => {
    setSelectedItem(item);
    setMarkForm({
      status: item.status === 'pending' ? 'matched' : item.status,
      actual_amount: item.actual_amount.toString(),
      remark: item.remark || ''
    });
    setMarkModal(true);
  };

  const exportRecon = async (recon: Reconciliation) => {
    try {
      const res = await reconciliationApi.exportReconciliation(recon.id);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `对账报告_${recon.recon_no}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert('导出失败: ' + error.message);
    }
  };

  const getDiffClass = (diff: number) => {
    if (diff === 0) return 'text-green-600';
    if (diff > 0) return 'text-blue-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">财务对账</h1>
        {hasPermission('reconciliation:create') && (
          <button
            onClick={() => setCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            创建对账
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700">筛选条件</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">门店</label>
            <select
              value={filters.store_id}
              onChange={e => setFilters(prev => ({ ...prev, store_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部门店</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">收银员</label>
            <select
              value={filters.cashier_id}
              onChange={e => setFilters(prev => ({ ...prev, cashier_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部</option>
              {cashiers.map(c => (
                <option key={c.id} value={c.id}>{c.real_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">状态</label>
            <select
              value={filters.status}
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">支付渠道</label>
            <select
              value={filters.channel}
              onChange={e => setFilters(prev => ({ ...prev, channel: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部渠道</option>
              <option value="cash">现金</option>
              <option value="qr">扫码支付</option>
              <option value="bank_card">银行卡</option>
              <option value="stored_value">储值卡</option>
              <option value="coupon">优惠券</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">开始日期</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={e => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">结束日期</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={e => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={() => {
              setFilters({ store_id: '', cashier_id: '', status: '', channel: '', start_date: '', end_date: '' });
              loadData();
            }}
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            重置
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            查询
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">对账号</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">门店</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">对账日期</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">应收总额</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">实收总额</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">差额</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">长款</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">短款</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-500">加载中...</td></tr>
              ) : reconciliations.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-500">暂无对账记录</td></tr>
              ) : (
                reconciliations.map(recon => (
                  <tr key={recon.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-mono text-gray-900">{recon.recon_no}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{recon.store_name}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{recon.recon_date}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{formatCurrency(recon.total_expected)}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{formatCurrency(recon.total_actual)}</td>
                    <td className="px-4 py-4">
                      <span className={`text-sm font-medium ${getDiffClass(recon.total_difference)}`}>
                        {recon.total_difference > 0 ? '+' : ''}{formatCurrency(recon.total_difference)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-blue-600">{formatCurrency(recon.over_amount)}</td>
                    <td className="px-4 py-4 text-sm font-medium text-red-600">{formatCurrency(recon.short_amount)}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusMap[recon.status]?.class}`}>
                        {statusMap[recon.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewDetail(recon)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {recon.status !== 'draft' && (
                          <button
                            onClick={() => exportRecon(recon)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="导出"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailModal && selectedRecon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">对账详情 - {selectedRecon.recon_no}</h3>
              {selectedRecon.status !== 'draft' && (
                <button
                  onClick={() => exportRecon(selectedRecon)}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  导出
                </button>
              )}
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">应收总额</div>
                  <div className="text-xl font-bold text-blue-700 mt-1">{formatCurrency(selectedRecon.total_expected)}</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">实收总额</div>
                  <div className="text-xl font-bold text-green-700 mt-1">{formatCurrency(selectedRecon.total_actual)}</div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="text-sm text-yellow-600 font-medium">长款</div>
                  <div className="text-xl font-bold text-yellow-700 mt-1">{formatCurrency(selectedRecon.over_amount)}</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-sm text-red-600 font-medium">短款</div>
                  <div className="text-xl font-bold text-red-700 mt-1">{formatCurrency(selectedRecon.short_amount)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <label className="block text-gray-500">门店</label>
                  <p className="font-medium text-gray-900 mt-1">{selectedRecon.store_name}</p>
                </div>
                <div>
                  <label className="block text-gray-500">收银员</label>
                  <p className="font-medium text-gray-900 mt-1">{selectedRecon.cashier_name || '全部'}</p>
                </div>
                <div>
                  <label className="block text-gray-500">支付渠道</label>
                  <p className="font-medium text-gray-900 mt-1">{selectedRecon.channel ? channelMap[selectedRecon.channel] : '全部'}</p>
                </div>
                <div>
                  <label className="block text-gray-500">对账日期</label>
                  <p className="font-medium text-gray-900 mt-1">{selectedRecon.recon_date}</p>
                </div>
                <div>
                  <label className="block text-gray-500">状态</label>
                  <span className={`mt-1 inline-block px-2 py-1 text-xs font-medium rounded-full ${statusMap[selectedRecon.status]?.class}`}>
                    {statusMap[selectedRecon.status]?.label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{selectedRecon.match_count}</div>
                    <div className="text-sm text-gray-500">一致</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{selectedRecon.mismatch_count}</div>
                    <div className="text-sm text-gray-500">差异</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Search className="w-8 h-8 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{selectedRecon.total_count}</div>
                    <div className="text-sm text-gray-500">合计笔数</div>
                  </div>
                </div>
              </div>

              {selectedRecon.items && selectedRecon.items.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">明细记录</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">类型</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">单号</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">渠道</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">应收</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">实收</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">差额</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500">状态</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500">备注</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedRecon.items.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-sm text-gray-900">{typeMap[item.type]}</td>
                              <td className="px-3 py-2 text-sm font-mono text-gray-600">{item.order_no || '-'}</td>
                              <td className="px-3 py-2 text-sm text-gray-600">{channelMap[item.channel]}</td>
                              <td className="px-3 py-2 text-sm text-right text-gray-900">{formatCurrency(item.expected_amount)}</td>
                              <td className="px-3 py-2 text-sm text-right text-gray-900">{formatCurrency(item.actual_amount)}</td>
                              <td className="px-3 py-2 text-sm text-right">
                                <span className={`font-medium ${getDiffClass(item.difference)}`}>
                                  {item.difference > 0 ? '+' : ''}{formatCurrency(item.difference)}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${itemStatusMap[item.status]?.class}`}>
                                  {itemStatusMap[item.status]?.label}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-500 text-center">{item.remark || '-'}</td>
                              <td className="px-3 py-2 text-center">
                                {selectedRecon.status === 'draft' && hasPermission('reconciliation:mark') && (
                                  <button
                                    onClick={() => openMarkModal(item)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                                    title="标记"
                                  >
                                    <Flag className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {selectedRecon.status === 'pending' && (hasRole('finance', 'admin') || hasPermission('reconciliation:review')) && (
                <div className="border-t border-gray-200 pt-6 space-y-4">
                  <h4 className="font-medium text-gray-800">审核处理</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">处理方式</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="recon_action"
                          value="approve"
                          checked={reviewForm.action === 'approve'}
                          onChange={e => setReviewForm(prev => ({ ...prev, action: e.target.value as 'approve' | 'reject' }))}
                          className="w-4 h-4 text-green-600"
                        />
                        <span className="text-green-600 font-medium">通过对账</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="recon_action"
                          value="reject"
                          checked={reviewForm.action === 'reject'}
                          onChange={e => setReviewForm(prev => ({ ...prev, action: e.target.value as 'approve' | 'reject' }))}
                          className="w-4 h-4 text-red-600"
                        />
                        <span className="text-red-600 font-medium">拒绝对账</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">审核备注 {reviewForm.action === 'reject' && <span className="text-red-500">*</span>}</label>
                    <textarea
                      value={reviewForm.remark}
                      onChange={e => setReviewForm(prev => ({ ...prev, remark: e.target.value }))}
                      placeholder="请输入审核备注..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setDetailModal(false);
                  setSelectedRecon(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
              >
                关闭
              </button>
              {selectedRecon.status === 'pending' && (hasRole('finance', 'admin') || hasPermission('reconciliation:review')) && (
                <button
                  onClick={handleReview}
                  className={`px-4 py-2 text-white rounded-lg transition ${
                    reviewForm.action === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {reviewForm.action === 'approve' ? '确认通过' : '确认拒绝'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {createModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">创建对账</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">门店 <span className="text-red-500">*</span></label>
                <select
                  value={createForm.store_id}
                  onChange={e => setCreateForm(prev => ({ ...prev, store_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择门店</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">收银员（可选）</label>
                <select
                  value={createForm.cashier_id}
                  onChange={e => setCreateForm(prev => ({ ...prev, cashier_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">全部收银员</option>
                  {cashiers.map(c => (
                    <option key={c.id} value={c.id}>{c.real_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">支付渠道（可选）</label>
                <select
                  value={createForm.channel}
                  onChange={e => setCreateForm(prev => ({ ...prev, channel: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">全部渠道</option>
                  <option value="cash">现金</option>
                  <option value="qr">扫码支付</option>
                  <option value="bank_card">银行卡</option>
                  <option value="stored_value">储值卡</option>
                  <option value="coupon">优惠券</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">对账日期 <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={createForm.recon_date}
                  onChange={e => setCreateForm(prev => ({ ...prev, recon_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setCreateModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
              >
                取消
              </button>
              <button
                onClick={handleCreateRecon}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                创建对账
              </button>
            </div>
          </div>
        </div>
      )}

      {markModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">标记差异项</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                <p className="text-sm"><span className="text-gray-500">单号：</span>{selectedItem.order_no}</p>
                <p className="text-sm"><span className="text-gray-500">类型：</span>{typeMap[selectedItem.type]} | <span className="text-gray-500">渠道：</span>{channelMap[selectedItem.channel]}</p>
                <p className="text-sm"><span className="text-gray-500">应收：</span>{formatCurrency(selectedItem.expected_amount)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">标记状态</label>
                <select
                  value={markForm.status}
                  onChange={e => setMarkForm(prev => ({ ...prev, status: e.target.value as 'matched' | 'over' | 'short' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="matched">一致</option>
                  <option value="over">长款（多收）</option>
                  <option value="short">短款（少收）</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">实收金额</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={markForm.actual_amount}
                    onChange={e => setMarkForm(prev => ({ ...prev, actual_amount: e.target.value }))}
                    placeholder="输入实际金额"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">备注说明</label>
                <textarea
                  value={markForm.remark}
                  onChange={e => setMarkForm(prev => ({ ...prev, remark: e.target.value }))}
                  placeholder="请输入差异原因说明..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setMarkModal(false);
                  setSelectedItem(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
              >
                取消
              </button>
              <button
                onClick={handleMarkItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                确认标记
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
