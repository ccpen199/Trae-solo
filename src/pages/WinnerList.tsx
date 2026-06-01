import { useEffect, useState } from 'react';
import { prizeApi } from '../lib/api';
import type { Winner } from '../../shared/types.js';
import { Send, Truck, CheckCircle, RefreshCw, Package, Tag, Coins, Zap } from 'lucide-react';

const statusMap: Record<Winner['status'], { label: string; className: string }> = {
  pending: { label: '待发放', className: 'bg-yellow-100 text-yellow-600' },
  distributed: { label: '已发放', className: 'bg-blue-100 text-blue-600' },
  shipped: { label: '已发货', className: 'bg-purple-100 text-purple-600' },
  delivered: { label: '已签收', className: 'bg-indigo-100 text-indigo-600' },
  redeemed: { label: '已核销', className: 'bg-green-100 text-green-600' },
  cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-600' },
};

const typeMap: Record<string, { label: string; icon: any }> = {
  physical: { label: '实物', icon: Package },
  coupon: { label: '优惠券', icon: Tag },
  points: { label: '积分', icon: Coins },
  virtual: { label: '虚拟权益', icon: Zap },
};

export default function WinnerList() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<Winner['status'] | ''>('');
  const [showShipModal, setShowShipModal] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<Winner | null>(null);
  const [shippingForm, setShippingForm] = useState({
    name: '',
    phone: '',
    address: '',
    trackingNumber: '',
    courier: '',
  });

  useEffect(() => {
    loadWinners();
  }, [page, statusFilter]);

  const loadWinners = async () => {
    try {
      setLoading(true);
      const res = await prizeApi.getWinners(page, 10, statusFilter || undefined);
      if (res.data.code === 200) {
        setWinners(res.data.data.items);
        setTotal(res.data.data.total);
      }
    } catch (error) {
      console.error('Load winners failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDistribute = async (id: number) => {
    if (!confirm('确认发放此奖品？')) return;
    try {
      await prizeApi.distribute(id);
      loadWinners();
    } catch (error) {
      console.error('Distribute failed:', error);
    }
  };

  const openShipModal = (winner: Winner) => {
    setSelectedWinner(winner);
    if (winner.shippingInfo) {
      setShippingForm({
        name: winner.shippingInfo.name,
        phone: winner.shippingInfo.phone,
        address: winner.shippingInfo.address,
        trackingNumber: winner.shippingInfo.trackingNumber || '',
        courier: winner.shippingInfo.courier || '',
      });
    }
    setShowShipModal(true);
  };

  const handleShip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWinner) return;
    try {
      await prizeApi.ship(selectedWinner.id, shippingForm);
      setShowShipModal(false);
      loadWinners();
    } catch (error: any) {
      alert(error.response?.data?.message || '操作失败');
    }
  };

  const handleRedeem = async (id: number) => {
    if (!confirm('确认核销此奖品？')) return;
    try {
      await prizeApi.redeem(id);
      loadWinners();
    } catch (error) {
      console.error('Redeem failed:', error);
    }
  };

  const handleReissue = async (id: number) => {
    if (!confirm('确认补发此奖品？')) return;
    try {
      await prizeApi.reissue(id);
      loadWinners();
    } catch (error) {
      console.error('Reissue failed:', error);
    }
  };

  const formatDate = (dateStr?: string) => {
    return dateStr ? new Date(dateStr).toLocaleString('zh-CN') : '-';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">中奖发放</h1>
        <p className="text-gray-500 mt-1">管理中奖用户的奖品发放、物流和核销</p>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as Winner['status'] | '');
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">全部状态</option>
          <option value="pending">待发放</option>
          <option value="distributed">已发放</option>
          <option value="shipped">已发货</option>
          <option value="delivered">已签收</option>
          <option value="redeemed">已核销</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : winners.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            暂无中奖记录
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">用户ID</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">奖品</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">活动</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">状态</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">中奖时间</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {winners.map((winner) => {
                  const status = statusMap[winner.status];
                  const prizeType = winner.prize?.type || 'physical';
                  const typeInfo = typeMap[prizeType];
                  const TypeIcon = typeInfo.icon;
                  return (
                    <tr key={winner.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-600">{winner.userId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <TypeIcon size={16} className="text-gray-400" />
                          <span className="text-gray-800">{winner.prize?.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{winner.activity?.name}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(winner.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {winner.status === 'pending' && (
                            <button
                              onClick={() => handleDistribute(winner.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              <Send size={14} />
                              发放
                            </button>
                          )}
                          {winner.status === 'distributed' && winner.prize?.type === 'physical' && (
                            <button
                              onClick={() => openShipModal(winner)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                            >
                              <Truck size={14} />
                              发货
                            </button>
                          )}
                          {(winner.status === 'distributed' || winner.status === 'shipped') && winner.prize?.type !== 'physical' && (
                            <button
                              onClick={() => handleRedeem(winner.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                            >
                              <CheckCircle size={14} />
                              核销
                            </button>
                          )}
                          <button
                            onClick={() => handleReissue(winner.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                          >
                            <RefreshCw size={14} />
                            补发
                          </button>
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

      {showShipModal && selectedWinner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-6">录入物流信息</h2>
            <form onSubmit={handleShip} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">收货人 *</label>
                <input
                  type="text"
                  value={shippingForm.name}
                  onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">联系电话 *</label>
                <input
                  type="tel"
                  value={shippingForm.phone}
                  onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">收货地址 *</label>
                <textarea
                  value={shippingForm.address}
                  onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">快递公司</label>
                  <input
                    type="text"
                    value={shippingForm.courier}
                    onChange={(e) => setShippingForm({ ...shippingForm, courier: e.target.value })}
                    placeholder="如：顺丰速运"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">物流单号</label>
                  <input
                    type="text"
                    value={shippingForm.trackingNumber}
                    onChange={(e) => setShippingForm({ ...shippingForm, trackingNumber: e.target.value })}
                    placeholder="物流单号"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowShipModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
                >
                  确认发货
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
