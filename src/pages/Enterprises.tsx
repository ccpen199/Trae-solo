import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store';

export default function Enterprises() {
  const [enterprise, setEnterprise] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    credit_code: '',
    industry: '',
    region: '',
    address: '',
    contact_person: '',
    contact_phone: '',
  });

  useEffect(() => {
    loadEnterprise();
  }, []);

  const loadEnterprise = async () => {
    try {
      const res = await api.enterprises.my();
      if (res.data.enterprise) {
        setEnterprise(res.data.enterprise);
        setFormData(res.data.enterprise);
      }
    } catch (err) {
      console.error('加载企业信息失败', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (enterprise) {
        await api.enterprises.update(enterprise.id, formData);
        alert('企业信息更新成功');
      } else {
        await api.enterprises.create(formData);
        alert('企业信息创建成功');
      }
      loadEnterprise();
    } catch (err: any) {
      alert(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">企业信息管理</h1>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              企业名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入企业全称"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              统一社会信用代码
            </label>
            <input
              type="text"
              value={formData.credit_code}
              onChange={(e) => setFormData({ ...formData, credit_code: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入统一社会信用代码"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                所属行业
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">请选择</option>
                <option value="电子制造">电子制造</option>
                <option value="机械加工">机械加工</option>
                <option value="汽车零部件">汽车零部件</option>
                <option value="五金制品">五金制品</option>
                <option value="塑料制品">塑料制品</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                所在地区
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="如：广东省深圳市"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              企业地址
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入详细地址"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                联系人
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="联系人姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                联系电话
              </label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="联系电话"
              />
            </div>
          </div>

          {enterprise && enterprise.status && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                审核状态：
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  enterprise.status === 'approved' ? 'bg-green-100 text-green-600' :
                  enterprise.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {enterprise.status === 'approved' ? '已通过' :
                   enterprise.status === 'pending' ? '审核中' : '已拒绝'}
                </span>
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? '提交中...' : enterprise ? '更新企业信息' : '创建企业信息'}
          </button>
        </form>
      </div>
    </div>
  );
}
