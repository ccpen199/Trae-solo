import { useState, useEffect } from 'react';
import { Search, RefreshCw, Eye, CheckCircle, XCircle, AlertTriangle, RotateCcw, Filter } from 'lucide-react';
import { refundsApi, ordersApi, mastersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface Refund {
  id: number;
  refund_no: string;
  order_id: number;
  order_no: string;
  store_id: number;
  store_name: string;
  cashier_id: number;
  cashier_name: string;
  amount: number;
  reason: string;
  channel: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_id: number | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const statusMap: Record<string, { label: string; class: string }> = {
  pending: { label: '待审核', class: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '已通过', class: 'bg-green-100 text-green-700' },
  rejected: { label: '已拒绝', class: 'bg-red-100 text-red-700' }
};

const channelMap: Record<string, string> = {
  cash: '现金',
  qr: '扫码支付',
  bank_card: '银行卡',
  stored_value: '储值卡',
  coupon: '优惠券'
};

export default function Refunds() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [orderDetail, setOrderDetail] = useState<any>(null);
  const hasRole = useAuthStore(state => state.hasRole);
  const hasPermission = useAuthStore(state => state.hasPermission);

  const [filters, setFilters] = useState({
    store_id: '',
    cashier_id: '',
    status: '',
    start_date: '',
    end_date: '',
    keyword: ''
  });

  const [createForm, setCreateForm] = useState({
    order_id: '',
    amount: '',
    reason: '',
    channel: ''
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
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.keyword) params.keyword = filters.keyword;
      
      const res = await refundsApi.getRefunds(params);
      setRefunds(res.data.list || res.data || []);
    } catch (error: any) {
      alert('加载退款列表失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [storesRes, cashiersRes, ordersRes] = await Promise.all([
        mastersApi.getStores(),
        mastersApi.getUsers({ role: 'cashier' }),
        ordersApi.getOrders({ status: 'completed' })
      ]);
      setStores(storesRes.data.list || storesRes.data || []);
      setCashiers(cashiersRes.data.list || cashiersRes.data || []);
      setOrders(ordersRes.data.list || ordersRes.data || []);
    } catch (error) {
      console.error('加载选项失败', error);
    }
  };

  const handleOrderSelect = async (orderId: string) => {
    if (!orderId) {
      setOrderDetail(null);
      setCreateForm(prev => ({ ...prev, amount: '', channel: '' }));
      return;
    }
    try {
      const res = await ordersApi.getOrder(Number(orderId));
      const order = res.data;
      setOrderDetail(order);
      if (order.payments && order.payments.length > 0) {
        setCreateForm(prev => ({
          ...prev,
          amount: order.payments[0].amount.toString(),
          channel: order.payments[0].channel
        }));
      }
    } catch (error: any) {
      alert('加载订单详情失败: ' + error.message);
    }
  };

  const handleCreateRefund = async () => {
    if (!createForm.order_id || !createForm.amount || !createForm.reason || !createForm.channel) {
      alert('请填写完整退款信息');
      return;
    }
    if (parseFloat(createForm.amount) <= 0) {
      alert('退款金额必须大于0');
      return;
    }
    try {
      await refundsApi.createRefund({
        order_id: Number(createForm.order_id),
        amount: parseFloat(createForm.amount),
        reason: createForm.reason,
        channel: createForm.channel
      });
      alert('退款申请提交成功');
      setCreateModal(false);
      setCreateForm({ order_id: '', amount: '', reason: '', channel: '' });
      setOrderDetail(null);
      loadData();
    } catch (error: any) {
      alert('退款申请失败: ' + error.message);
    }
  };

  const handleReview = async () => {
    if (!selectedRefund) return;
    if (reviewForm.action === 'reject' && !reviewForm.remark) {
      alert('拒绝退款请填写备注');
      return;
    }
    try {
      await refundsApi.reviewRefund(selectedRefund.id, {
        action: reviewForm.action,
        remark: reviewForm.remark
      });
      alert(reviewForm.action === 'approve' ? '退款已通过' : '退款已拒绝');
      setDetailModal(false);
      setSelectedRefund(null);
      loadData();
    } catch (error: any) {
      alert('审核失败: ' + error.message);
    }
  };

  const viewDetail = async (refund: Refund) => {
    setSelectedRefund(refund);
    setReviewForm({ action: 'approve', remark: '' });
    try {
      const res = await refundsApi.getRefund(refund.id);
      setSelectedRefund(res.data);
      setDetailModal(true);
    } catch (error: any) {
      alert('加载退款详情失败: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">退款管理</h1>
        {hasPermission('refund:create') && (
          <button
            onClick={() => setCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            申请退款
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
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
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
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">搜索</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="订单号/退款号"
                value={filters.keyword}
                onChange={e => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={() => {
              setFilters({ store_id: '', cashier_id: '', status: '', start_date: '', end_date: '', keyword: '' });
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">退款单号</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">订单号</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">门店</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">收银员</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">退款金额</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">退款渠道</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">申请时间</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">加载中...</td></tr>
              ) : refunds.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">暂无退款记录</td></tr>
              ) : (
                refunds.map(refund => (
                  <tr key={refund.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-mono text-gray-900">{refund.refund_no}</td>
                    <td className="px-4 py-4 text-sm font-mono text-gray-600">{refund.order_no}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{refund.store_name}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{refund.cashier_name}</td>
                    <td className="px-4 py-4 text-sm font-medium text-red-600">-{formatCurrency(refund.amount)}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{channelMap[refund.channel] || refund.channel}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusMap[refund.status]?.class}`}>
                        {statusMap[refund.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{formatDateTime(refund.created_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewDetail(refund)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {refund.status === 'pending' && (hasRole('store_manager', 'admin') || hasPermission('refund:review')) && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setSelectedRefund(refund);
                                setReviewForm({ action: 'approve', remark: '' });
                                setDetailModal(true);
                              }}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="通过"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRefund(refund);
                                setReviewForm({ action: 'reject', remark: '' });
                                setDetailModal(true);
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="拒绝"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
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

      {detailModal && selectedRefund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">退款详情</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">退款单号</label>
                  <p className="mt-1 font-mono text-gray-900">{selectedRefund.refund_no}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">关联订单</label>
                  <p className="mt-1 font-mono text-gray-900">{selectedRefund.order_no}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">门店</label>
                  <p className="mt-1 text-gray-900">{selectedRefund.store_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">收银员</label>
                  <p className="mt-1 text-gray-900">{selectedRefund.cashier_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">退款金额</label>
                  <p className="mt-1 text-xl font-bold text-red-600">-{formatCurrency(selectedRefund.amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">退款渠道</label>
                  <p className="mt-1 text-gray-900">{channelMap[selectedRefund.channel] || selectedRefund.channel}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">状态</label>
                  <span className={`mt-1 inline-block px-2 py-1 text-xs font-medium rounded-full ${statusMap[selectedRefund.status]?.class}`}>
                    {statusMap[selectedRefund.status]?.label}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">申请时间</label>
                  <p className="mt-1 text-gray-900">{formatDateTime(selectedRefund.created_at)}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">退款原因</label>
                <p className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700">{selectedRefund.reason}</p>
              </div>

              {selectedRefund.amount > 100 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">店长复核</p>
                    <p className="text-xs text-yellow-700 mt-0.5">退款金额超过100元，需要店长或管理员审核</p>
                  </div>
                </div>
              )}

              {selectedRefund.reviewer_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">审核信息</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      审核人：{selectedRefund.reviewer_name} | 审核时间：{formatDateTime(selectedRefund.reviewed_at!)}
                    </p>
                  </div>
                </div>
              )}

              {selectedRefund.status === 'pending' && (hasRole('store_manager', 'admin') || hasPermission('refund:review')) && (
                <div className="border-t border-gray-200 pt-6 space-y-4">
                  <h4 className="font-medium text-gray-800">审核处理</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">处理方式</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="action"
                          value="approve"
                          checked={reviewForm.action === 'approve'}
                          onChange={e => setReviewForm(prev => ({ ...prev, action: e.target.value as 'approve' | 'reject' }))}
                          className="w-4 h-4 text-green-600"
                        />
                        <span className="text-green-600 font-medium">通过退款</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="action"
                          value="reject"
                          checked={reviewForm.action === 'reject'}
                          onChange={e => setReviewForm(prev => ({ ...prev, action: e.target.value as 'approve' | 'reject' }))}
                          className="w-4 h-4 text-red-600"
                        />
                        <span className="text-red-600 font-medium">拒绝退款</span>
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
                  setSelectedRefund(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
              >
                关闭
              </button>
              {selectedRefund.status === 'pending' && (hasRole('store_manager', 'admin') || hasPermission('refund:review')) && (
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
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">申请退款</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">选择订单 <span className="text-red-500">*</span></label>
                <select
                  value={createForm.order_id}
                  onChange={e => handleOrderSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择订单</option>
                  {orders.map(order => (
                    <option key={order.id} value={order.id}>
                      {order.order_no} - {formatCurrency(order.total_amount)} - {formatDateTime(order.created_at)}
                    </option>
                  ))}
                </select>
              </div>

              {orderDetail && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">订单号：</span>{orderDetail.order_no}
                  </p>
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">订单金额：</span>{formatCurrency(orderDetail.total_amount)}
                  </p>
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">商品：</span>
                    {orderDetail.items?.map((item: any, idx: number) => (
                      <span key={idx} className="ml-1">{item.product_name} x{item.quantity}</span>
                    ))}
                  </p>
                  {orderDetail.payments?.map((pay: any, idx: number) => (
                    <p key={idx} className="text-sm text-blue-800">
                      <span className="font-medium">支付方式：</span>{channelMap[pay.channel] || pay.channel}
                      <span className="ml-2 font-medium">支付金额：</span>{formatCurrency(pay.amount)}
                    </p>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">退款渠道 <span className="text-red-500">*</span></label>
                <select
                  value={createForm.channel}
                  onChange={e => setCreateForm(prev => ({ ...prev, channel: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择退款渠道</option>
                  <option value="cash">现金</option>
                  <option value="qr">扫码支付</option>
                  <option value="bank_card">银行卡</option>
                  <option value="stored_value">储值卡</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">银行卡支付必须原路退回</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">退款金额 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={createForm.amount}
                    onChange={e => setCreateForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">退款原因 <span className="text-red-500">*</span></label>
                <textarea
                  value={createForm.reason}
                  onChange={e => setCreateForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="请输入退款原因..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">退款规则</p>
                  <ul className="text-xs text-yellow-700 mt-0.5 space-y-1">
                    <li>• 退款金额超过100元需要店长复核</li>
                    <li>• 银行卡支付必须原路退回</li>
                    <li>• 退款成功后订单状态将更新</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setCreateModal(false);
                  setCreateForm({ order_id: '', amount: '', reason: '', channel: '' });
                  setOrderDetail(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
              >
                取消
              </button>
              <button
                onClick={handleCreateRefund}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                提交退款申请
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
