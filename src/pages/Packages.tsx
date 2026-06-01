import { useEffect, useState } from 'react';
import { Plus, Package, Calendar, Store, DollarSign, Users, X, Percent, FileText } from 'lucide-react';
import { api } from '@/lib/api';

function formatSettlementRule(rule: string | undefined | null) {
  if (!rule) return '未设置';
  if (rule.includes('%')) return rule;
  const map: Record<string, string> = {
    daily: '按日结算',
    weekly: '按周结算',
    monthly: '按月结算',
    per_verification: '按次结算',
  };
  return map[rule] || rule;
}

function parseCommissionRate(rule: string | undefined | null) {
  if (!rule || !rule.includes('%')) return null;
  const match = rule.match(/平台(\d+)%/);
  return match ? parseInt(match[1]) : null;
}

export default function Packages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [stores, setStores] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    total_count: 1,
    price: 0,
    cost_price: 0,
    valid_days: 30,
    purchase_limit: 1,
    requires_appointment: false,
    commission_rate: 0.1,
    store_ids: [] as number[],
    service_ids: [] as number[],
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [pkgRes, storeRes, serviceRes] = await Promise.all([
        api.coupons.getPackages(),
        api.coupons.getStores(),
        api.coupons.getServices(),
      ]);
      setPackages(pkgRes.data);
      setStores(storeRes.data);
      setServices(serviceRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.coupons.createPackage(form);
      setShowModal(false);
      loadData();
      setForm({
        name: '',
        description: '',
        total_count: 1,
        price: 0,
        cost_price: 0,
        valid_days: 30,
        purchase_limit: 1,
        requires_appointment: false,
        commission_rate: 0.1,
        store_ids: [],
        service_ids: [],
      });
    } catch (err: any) {
      setError(err.message || '创建失败');
    } finally {
      setLoading(false);
    }
  }

  function toggleStore(id: number) {
    setForm(prev => ({
      ...prev,
      store_ids: prev.store_ids.includes(id)
        ? prev.store_ids.filter(s => s !== id)
        : [...prev.store_ids, id]
    }));
  }

  function toggleService(id: number) {
    setForm(prev => ({
      ...prev,
      service_ids: prev.service_ids.includes(id)
        ? prev.service_ids.filter(s => s !== id)
        : [...prev.service_ids, id]
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">券包管理</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          新建券包
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {packages.map((pkg) => {
          const commissionRate = parseCommissionRate(pkg.settlement_rule);
          const storeDisplay = pkg.applicable_stores?.length > 0 && typeof pkg.applicable_stores[0] === 'object'
            ? pkg.applicable_stores.map((s: any) => s.name).join('、')
            : `${pkg.store_count || 0}家门店`;

          return (
            <div key={pkg.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package className="w-8 h-8 text-blue-500" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  pkg.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {pkg.status === 'active' ? '上架中' : '已下架'}
                </span>
              </div>

              {pkg.description && (
                <p className="text-sm text-gray-600 mb-3 bg-gray-50 p-2 rounded">{pkg.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  售价 ¥{pkg.price || 0}
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Users className="w-4 h-4" />
                  成本 ¥{pkg.cost_price || 0}
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {pkg.total_count || pkg.total_uses} 次
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Store className="w-4 h-4" />
                  {storeDisplay}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t space-y-1">
                <p className="text-xs text-gray-500">
                  有效期: {pkg.valid_from} 至 {pkg.valid_to}
                </p>
                <p className="text-xs text-gray-500">
                  服务内容: {pkg.service_content || '无'}
                </p>
                <p className="text-xs text-gray-500">
                  限购: 每人 {pkg.purchase_limit || 1} 份
                  {pkg.appointment_required ? ' · 需预约' : ' · 免预约'}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <FileText className="w-3.5 h-3.5" />
                  结算规则: {formatSettlementRule(pkg.settlement_rule)}
                </div>
                {commissionRate !== null && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Percent className="w-3.5 h-3.5" />
                    佣金比例: {commissionRate}%
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  适用门店: {storeDisplay}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">新建券包</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">券包名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">使用次数</label>
                  <input
                    type="number"
                    value={form.total_count}
                    onChange={(e) => setForm({ ...form, total_count: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">售价 (元)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    step="0.01"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">成本价 (元)</label>
                  <input
                    type="number"
                    value={form.cost_price}
                    onChange={(e) => setForm({ ...form, cost_price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    step="0.01"
                    min={0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">有效期 (天)</label>
                  <input
                    type="number"
                    value={form.valid_days}
                    onChange={(e) => setForm({ ...form, valid_days: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">限购数量</label>
                  <input
                    type="number"
                    value={form.purchase_limit}
                    onChange={(e) => setForm({ ...form, purchase_limit: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">佣金比例</label>
                  <input
                    type="number"
                    value={form.commission_rate}
                    onChange={(e) => setForm({ ...form, commission_rate: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    step="0.01"
                    min={0}
                    max={1}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requires_appointment"
                  checked={form.requires_appointment}
                  onChange={(e) => setForm({ ...form, requires_appointment: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="requires_appointment" className="text-sm text-gray-700">需要预约</label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">适用门店</label>
                <div className="flex flex-wrap gap-2">
                  {stores.map((store) => (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => toggleStore(store.id)}
                      className={`px-3 py-1 text-sm rounded-full border ${
                        form.store_ids.includes(store.id)
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-gray-50 border-gray-300 text-gray-700'
                      }`}
                    >
                      {store.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">适用服务</label>
                <div className="flex flex-wrap gap-2">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggleService(service.id)}
                      className={`px-3 py-1 text-sm rounded-full border ${
                        form.service_ids.includes(service.id)
                          ? 'bg-green-100 border-green-500 text-green-700'
                          : 'bg-gray-50 border-gray-300 text-gray-700'
                      }`}
                    >
                      {service.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError(''); }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
