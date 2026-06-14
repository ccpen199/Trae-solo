import { useState } from 'react';
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Save,
  Building2,
  FileText,
  CreditCard,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import { useAdminStore } from '@/store/useAdminStore';
import type { InsuranceProduct, InsurancePolicy } from '@/types';
import { cn } from '@/lib/utils';

interface ProductFormData {
  name: string;
  coverage: string;
  coverage_amount: number;
  premium: number;
  provider: string;
  description: string;
}

const emptyProduct: ProductFormData = {
  name: '',
  coverage: '',
  coverage_amount: 0,
  premium: 0,
  provider: '',
  description: '',
};

const mockPolicies: InsurancePolicy[] = [
  {
    id: 1,
    order_id: 1001,
    product_id: 1,
    product_name: '家政服务综合责任险',
    policy_no: 'PA202406140001',
    status: 'active',
    effective_date: '2024-06-14T09:00:00Z',
    expire_date: '2024-06-14T23:59:59Z',
  },
  {
    id: 2,
    order_id: 1002,
    product_id: 2,
    product_name: '家政人员意外险',
    policy_no: 'PA202406140002',
    status: 'active',
    effective_date: '2024-06-14T08:00:00Z',
    expire_date: '2024-06-14T23:59:59Z',
  },
  {
    id: 3,
    order_id: 998,
    product_id: 1,
    product_name: '家政服务综合责任险',
    policy_no: 'PA202406130088',
    status: 'expired',
    effective_date: '2024-06-13T10:00:00Z',
    expire_date: '2024-06-13T23:59:59Z',
  },
  {
    id: 4,
    order_id: 995,
    product_id: 3,
    product_name: '贵重物品专项保障',
    policy_no: 'PA202406120056',
    status: 'claimed',
    effective_date: '2024-06-12T14:00:00Z',
    expire_date: '2024-06-12T23:59:59Z',
  },
];

const statusLabels: Record<InsurancePolicy['status'], { label: string; class: string }> = {
  active: { label: '保障中', class: 'badge-green' },
  expired: { label: '已过期', class: 'badge-gray' },
  claimed: { label: '已理赔', class: 'badge-orange' },
};

export default function AdminInsurance() {
  const products = useAdminStore((state) => state.insuranceProducts);
  const addInsuranceProduct = useAdminStore((state) => state.addInsuranceProduct);
  const updateInsuranceProduct = useAdminStore((state) => state.updateInsuranceProduct);
  const deleteInsuranceProduct = useAdminStore((state) => state.deleteInsuranceProduct);

  const [activeTab, setActiveTab] = useState<'products' | 'policies'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InsuranceProduct | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyProduct);

  const filteredProducts = products.filter(
    (p) =>
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPolicies = mockPolicies.filter(
    (p) =>
      !searchQuery ||
      p.policy_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.order_id).includes(searchQuery)
  );

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData(emptyProduct);
    setShowEditor(true);
  };

  const handleEdit = (product: InsuranceProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      coverage: product.coverage,
      coverage_amount: product.coverage_amount,
      premium: product.premium,
      provider: product.provider,
      description: product.description,
    });
    setShowEditor(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.provider.trim()) return;
    if (editingProduct) {
      updateInsuranceProduct(editingProduct.id, formData);
    } else {
      addInsuranceProduct(formData);
    }
    setShowEditor(false);
  };

  const handleDelete = (id: number) => {
    if (confirm('确定删除该保险产品吗？')) {
      deleteInsuranceProduct(id);
    }
  };

  return (
    <div className="flex min-h-screen bg-cream-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="保险配置" subtitle="管理保险产品与客户投保保单" />
        <main className="flex-1 p-6 space-y-5 overflow-auto">
          <div className="card p-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-secondary-50 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('products')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                  activeTab === 'products'
                    ? 'bg-white text-secondary-700 shadow-sm'
                    : 'text-secondary-500 hover:text-secondary-700'
                )}
              >
                <Shield className="w-4 h-4" />
                保险产品
              </button>
              <button
                onClick={() => setActiveTab('policies')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                  activeTab === 'policies'
                    ? 'bg-white text-secondary-700 shadow-sm'
                    : 'text-secondary-500 hover:text-secondary-700'
                )}
              >
                <FileText className="w-4 h-4" />
                保单查询
              </button>
            </div>
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'products' ? '搜索产品名称或承保公司...' : '搜索保单号或订单号...'
                }
                className="w-full pl-9 pr-4 py-2 bg-secondary-50 border border-transparent rounded-xl text-sm focus:outline-none focus:border-secondary-300 focus:bg-white transition-all"
              />
            </div>
            {activeTab === 'products' && (
              <button
                onClick={handleCreate}
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-secondary-600 text-white rounded-xl font-medium hover:bg-secondary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                新增产品
              </button>
            )}
          </div>

          {activeTab === 'products' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((product) => (
                <div key={product.id} className="card p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center text-white">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 rounded-lg hover:bg-secondary-50 text-secondary-500 transition-colors"
                        title="编辑"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-secondary-800 mb-1">{product.name}</h3>
                  <p className="text-sm text-secondary-500 mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="space-y-2.5 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-secondary-400" />
                      <span className="text-secondary-500">承保公司</span>
                      <span className="ml-auto font-medium text-secondary-700">
                        {product.provider}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="w-4 h-4 text-secondary-400" />
                      <span className="text-secondary-500">保障额度</span>
                      <span className="ml-auto font-medium text-secondary-700">
                        ¥{product.coverage_amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-secondary-400" />
                      <span className="text-secondary-500">保障范围</span>
                      <span className="ml-auto font-medium text-secondary-700 text-right line-clamp-1 max-w-[60%]">
                        {product.coverage}
                      </span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex items-baseline justify-between">
                    <span className="text-sm text-secondary-500">每单保费</span>
                    <span className="text-2xl font-bold text-primary-600">
                      ¥{product.premium.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full card p-16 text-center">
                  <Shield className="w-14 h-14 mx-auto text-secondary-300 mb-3" />
                  <p className="text-secondary-500">暂无保险产品</p>
                </div>
              )}
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary-50/50">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        保单号
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        关联订单
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        保险产品
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        生效时间
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        过期时间
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPolicies.map((policy) => {
                      const status = statusLabels[policy.status];
                      return (
                        <tr key={policy.id} className="hover:bg-secondary-50/30 transition-colors">
                          <td className="px-5 py-4 text-sm font-medium text-secondary-800 font-mono">
                            {policy.policy_no}
                          </td>
                          <td className="px-5 py-4 text-sm text-secondary-700">
                            #{policy.order_id}
                          </td>
                          <td className="px-5 py-4 text-sm text-secondary-700">
                            {policy.product_name}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 text-sm text-secondary-600">
                              <Calendar className="w-4 h-4" />
                              {new Date(policy.effective_date).toLocaleString('zh-CN', {
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-secondary-600">
                            {new Date(policy.expire_date).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-5 py-4">
                            <span className={cn('badge', status.class)}>{status.label}</span>
                          </td>
                          <td className="px-5 py-4">
                            <button className="flex items-center gap-1 text-sm text-secondary-600 hover:text-secondary-800 font-medium">
                              详情
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredPolicies.length === 0 && (
                <div className="p-16 text-center">
                  <FileText className="w-14 h-14 mx-auto text-secondary-300 mb-3" />
                  <p className="text-secondary-500">暂无符合条件的保单</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {showEditor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg animate-fade-up">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-secondary-800">
                {editingProduct ? '编辑保险产品' : '新增保险产品'}
              </h3>
              <button
                onClick={() => setShowEditor(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-secondary-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  产品名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field py-2 text-sm"
                  placeholder="如：家政服务综合责任险"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  承保公司
                </label>
                <input
                  type="text"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="input-field py-2 text-sm"
                  placeholder="如：中国平安保险"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                    保障额度（元）
                  </label>
                  <input
                    type="number"
                    value={formData.coverage_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, coverage_amount: Number(e.target.value) })
                    }
                    className="input-field py-2 text-sm"
                    placeholder="500000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                    每单保费（元）
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.premium}
                    onChange={(e) =>
                      setFormData({ ...formData, premium: Number(e.target.value) })
                    }
                    className="input-field py-2 text-sm"
                    placeholder="3.5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  保障范围
                </label>
                <input
                  type="text"
                  value={formData.coverage}
                  onChange={(e) => setFormData({ ...formData, coverage: e.target.value })}
                  className="input-field py-2 text-sm"
                  placeholder="服务过程中造成的人身伤害及财产损失"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                  产品描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="input-field py-2 text-sm resize-none"
                  placeholder="详细描述产品特点和适用场景"
                />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowEditor(false)}
                className="flex-1 py-2.5 bg-white text-secondary-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name.trim() || !formData.provider.trim()}
                className="flex-1 py-2.5 bg-secondary-600 text-white rounded-xl font-medium hover:bg-secondary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                保存产品
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
