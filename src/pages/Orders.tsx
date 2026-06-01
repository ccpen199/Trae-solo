import { useState, useEffect } from 'react';
import { ordersApi, mastersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Search, Eye, XCircle, ShieldCheck, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    store_id: '',
    cashier_id: '',
    status: '',
    start_date: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD'),
    keyword: ''
  });

  const hasPermission = useAuthStore(state => state.hasPermission);

  useEffect(() => {
    loadMasters();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [page, filters]);

  const loadMasters = async () => {
    try {
      const [storeRes, userRes] = await Promise.all([
        mastersApi.getStores(),
        mastersApi.getUsers({ role_id: 4 })
      ]);
      setStores(storeRes.data as any);
      setUsers(userRes.data as any);
    } catch (err) {
      console.error(err);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page,
        pageSize,
        store_id: filters.store_id || undefined,
        cashier_id: filters.cashier_id || undefined,
        status: filters.status || undefined,
        keyword: filters.keyword || undefined
      };
      const res = await ordersApi.getOrders(params);
      setOrders((res.data as any).list);
      setTotal((res.data as any).total);
    } finally {
      setLoading(false);
    }
  };

  const viewOrder = async (id: number) => {
    const res = await ordersApi.getOrder(id);
    setSelectedOrder(res.data);
  };

  const cancelOrder = async (id: number) => {
    if (!confirm('确定要取消此订单吗？')) return;
    try {
      await ordersApi.cancelOrder(id);
      loadOrders();
      alert('订单已取消');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const verifyOrder = async (id: number) => {
    try {
      const res = await ordersApi.verifyOrder(id);
      alert((res.data as any).is_valid ? '订单验真通过，数据未被篡改' : '订单数据可能已被篡改！');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-700',
      refunded: 'bg-red-100 text-red-700',
      partial_refund: 'bg-yellow-100 text-yellow-700'
    };
    const textMap: Record<string, string> = {
      completed: '已完成',
      cancelled: '已取消',
      refunded: '已退款',
      partial_refund: '部分退款'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100'}`}>
        {textMap[status] || status}
      </span>
    );
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">订单管理</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">门店</label>
            <select
              value={filters.store_id}
              onChange={(e) => setFilters({ ...filters, store_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">全部</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">收银员</label>
            <select
              value={filters.cashier_id}
              onChange={(e) => setFilters({ ...filters, cashier_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">全部</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.real_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">状态</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">全部</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
              <option value="refunded">已退款</option>
              <option value="partial_refund">部分退款</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">开始日期</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">结束日期</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">订单号</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg"
                placeholder="搜索订单号"
              />
            </div>
          </div>
        </div>

        <button
          onClick={loadOrders}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Filter className="w-4 h-4" />
          查询
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">订单号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">门店</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">收银员</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">会员</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    加载中...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">暂无数据</td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm">{order.order_no}</td>
                    <td className="px-6 py-4 text-sm">{order.store_name}</td>
                    <td className="px-6 py-4 text-sm">{order.cashier_name}</td>
                    <td className="px-6 py-4 text-sm">{order.member_name || '-'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-red-600">¥{order.payable_amount.toFixed(2)}</td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{order.created_at}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewOrder(order.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => verifyOrder(order.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="验真"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                        {hasPermission('order:cancel') && order.status === 'completed' && (
                          <button
                            onClick={() => cancelOrder(order.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="取消订单"
                          >
                            <XCircle className="w-4 h-4" />
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

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            共 {total} 条，第 {page} / {totalPages || 1} 页
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 py-2">{page}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold">订单详情</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">订单号</p>
                  <p className="font-medium font-mono">{selectedOrder.order_no}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">状态</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">门店</p>
                  <p className="font-medium">{selectedOrder.store_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">收银员</p>
                  <p className="font-medium">{selectedOrder.cashier_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">创建时间</p>
                  <p className="font-medium">{selectedOrder.created_at}</p>
                </div>
                {selectedOrder.member_name && (
                  <div>
                    <p className="text-sm text-gray-500">会员</p>
                    <p className="font-medium">{selectedOrder.member_name} ({selectedOrder.member_code})</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-3">商品明细</h4>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">商品</th>
                        <th className="px-4 py-2 text-right">单价</th>
                        <th className="px-4 py-2 text-right">数量</th>
                        <th className="px-4 py-2 text-right">小计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item: any, idx: number) => (
                        <tr key={idx} className="border-t border-gray-200">
                          <td className="px-4 py-2">{item.product_name}</td>
                          <td className="px-4 py-2 text-right">¥{item.price.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right">{item.quantity} {item.unit}</td>
                          <td className="px-4 py-2 text-right font-medium">¥{item.subtotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">商品合计：¥{selectedOrder.total_amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">优惠：-¥{selectedOrder.discount_amount.toFixed(2)}</p>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  应付：¥{selectedOrder.payable_amount.toFixed(2)}
                </div>
              </div>

              {selectedOrder.payments?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">支付记录</h4>
                  <div className="space-y-2">
                    {selectedOrder.payments.map((p: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span>
                          {{
                            cash: '现金',
                            qrcode: '扫码支付',
                            bank_card: '银行卡',
                            stored_card: '储值卡',
                            coupon: '优惠券'
                          }[p.method as string] || p.method}
                        </span>
                        <span className="font-medium">¥{p.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder.refunds?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">退款记录</h4>
                  <div className="space-y-2">
                    {selectedOrder.refunds.map((r: any, idx: number) => (
                      <div key={idx} className="p-3 bg-red-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{r.refund_no}</span>
                          <span className="text-red-600 font-medium">-¥{r.amount.toFixed(2)}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          原因：{r.reason} · {r.operator_name} · {r.created_at}
                        </p>
                        <p className="text-sm text-gray-500">
                          状态：{{
                            pending: '待审核',
                            approved: '已通过',
                            rejected: '已拒绝'
                          }[r.status as string] || r.status}
                          {r.reviewer_name && ` · ${r.reviewer_name} 审核`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder.invoice_needed && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="font-medium mb-1">发票信息</p>
                  <p className="text-sm">抬头：{selectedOrder.invoice_title}</p>
                  {selectedOrder.invoice_tax_no && (
                    <p className="text-sm">税号：{selectedOrder.invoice_tax_no}</p>
                  )}
                </div>
              )}

              {selectedOrder.hash && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">订单哈希（防篡改）</p>
                  <p className="font-mono text-xs break-all">{selectedOrder.hash}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
