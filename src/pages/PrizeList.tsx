import { useEffect, useState } from 'react';
import { prizeApi } from '../lib/api';
import type { Prize } from '../../shared/types.js';
import { Plus, Edit, Trash2, Package, Tag, Coins, Zap } from 'lucide-react';

const typeMap: Record<Prize['type'], { label: string; icon: any; className: string }> = {
  physical: { label: '实物', icon: Package, className: 'bg-blue-100 text-blue-600' },
  coupon: { label: '优惠券', icon: Tag, className: 'bg-green-100 text-green-600' },
  points: { label: '积分', icon: Coins, className: 'bg-yellow-100 text-yellow-600' },
  virtual: { label: '虚拟权益', icon: Zap, className: 'bg-purple-100 text-purple-600' },
};

export default function PrizeList() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState<Prize['type'] | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [formData, setFormData] = useState<Partial<Prize>>({
    name: '',
    type: 'physical',
    value: 0,
    totalStock: 0,
    imageUrl: '',
  });

  useEffect(() => {
    loadPrizes();
  }, [page, typeFilter]);

  const loadPrizes = async () => {
    try {
      setLoading(true);
      const res = await prizeApi.getList(page, 10, typeFilter || undefined);
      if (res.data.code === 200) {
        setPrizes(res.data.data.items);
        setTotal(res.data.data.total);
      }
    } catch (error) {
      console.error('Load prizes failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (prize?: Prize) => {
    if (prize) {
      setEditingPrize(prize);
      setFormData({
        name: prize.name,
        type: prize.type,
        value: prize.value,
        totalStock: prize.totalStock,
        imageUrl: prize.imageUrl || '',
        expireTime: prize.expireTime,
      });
    } else {
      setEditingPrize(null);
      setFormData({
        name: '',
        type: 'physical',
        value: 0,
        totalStock: 0,
        imageUrl: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPrize) {
        await prizeApi.update(editingPrize.id, formData);
      } else {
        await prizeApi.create(formData);
      }
      setShowModal(false);
      loadPrizes();
    } catch (error: any) {
      alert(error.response?.data?.message || '保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个奖品吗？')) return;
    try {
      await prizeApi.delete(id);
      loadPrizes();
    } catch (error) {
      console.error('Delete prize failed:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">奖品管理</h1>
          <p className="text-gray-500 mt-1">管理奖品库和库存</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
        >
          <Plus size={18} />
          新建奖品
        </button>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as Prize['type'] | '');
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">全部类型</option>
          <option value="physical">实物</option>
          <option value="coupon">优惠券</option>
          <option value="points">积分</option>
          <option value="virtual">虚拟权益</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : prizes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            暂无奖品数据
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">奖品名称</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">类型</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">价值</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">库存</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">创建时间</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {prizes.map((prize) => {
                  const typeInfo = typeMap[prize.type];
                  const Icon = typeInfo.icon;
                  const remainingStock = prize.totalStock - prize.usedStock;
                  return (
                    <tr key={prize.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {prize.imageUrl ? (
                            <img src={prize.imageUrl} alt={prize.name} className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Icon size={20} className="text-gray-400" />
                            </div>
                          )}
                          <span className="font-medium text-gray-800">{prize.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${typeInfo.className}`}>
                          <Icon size={14} />
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">¥{prize.value.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-gray-800 font-medium">{remainingStock}</span>
                          <span className="text-gray-400 text-sm"> / {prize.totalStock}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(prize.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(prize)}
                            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="编辑"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(prize.id)}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除"
                          >
                            <Trash2 size={18} />
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {editingPrize ? '编辑奖品' : '新建奖品'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">奖品名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">类型 *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Prize['type'] })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="physical">实物</option>
                    <option value="coupon">优惠券</option>
                    <option value="points">积分</option>
                    <option value="virtual">虚拟权益</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">价值 (元) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">总库存 *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalStock}
                    onChange={(e) => setFormData({ ...formData, totalStock: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">过期时间</label>
                  <input
                    type="datetime-local"
                    value={formData.expireTime ? new Date(formData.expireTime).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, expireTime: new Date(e.target.value).toISOString() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">图片URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
