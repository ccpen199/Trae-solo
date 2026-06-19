import { useState, useEffect } from 'react';
import { adminApi } from '../../api';
import type { Package } from '../../types';

const typeLabelMap: Record<string, string> = {
  washing_machine: '洗衣机',
  water_purifier: '饮水机',
  shower: '淋浴终端'
};

const PackagePage = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPackage, setNewPackage] = useState({
    name: '',
    description: '',
    price: 0,
    durationMinutes: 30,
    type: 'washing_machine' as Package['type'],
    isActive: true
  });
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadPackages();
  }, [filterType]);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPackages({
        type: filterType !== 'all' ? filterType : undefined,
        pageSize: 100
      });
      setPackages(res.items);
    } catch (error) {
      console.error('加载套餐列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newPackage.name || newPackage.price <= 0 || newPackage.durationMinutes <= 0) {
      alert('请填写完整信息');
      return;
    }
    try {
      await adminApi.createPackage(newPackage);
      setShowCreateModal(false);
      setNewPackage({
        name: '',
        description: '',
        price: 0,
        durationMinutes: 30,
        type: 'washing_machine',
        isActive: true
      });
      loadPackages();
      alert('套餐创建成功');
    } catch (error) {
      alert('创建失败');
    }
  };

  const handleToggleActive = async (pkg: Package) => {
    try {
      await adminApi.updatePackage(pkg.id, { isActive: !pkg.isActive });
      loadPackages();
    } catch (error) {
      alert('更新失败');
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">套餐管理</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
        >
          + 新建套餐
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: 'all', label: '全部设备' },
          { value: 'washing_machine', label: '洗衣机' },
          { value: 'water_purifier', label: '饮水机' },
          { value: 'shower', label: '淋浴终端' }
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilterType(item.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === item.value
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : packages.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="text-5xl mb-3">💎</div>
          <p className="text-gray-400">暂无套餐</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className={`h-2 ${pkg.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{pkg.name}</h3>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {typeLabelMap[pkg.type] || pkg.type}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">¥{pkg.price}</p>
                    <p className="text-xs text-gray-400">{pkg.durationMinutes} 分钟</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4 min-h-[40px]">{pkg.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className={`text-sm ${pkg.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                    {pkg.isActive ? '● 启用中' : '○ 已停用'}
                  </span>
                  <button
                    onClick={() => handleToggleActive(pkg)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      pkg.isActive
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {pkg.isActive ? '停用' : '启用'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-5">新建套餐</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">套餐名称</label>
                <input
                  type="text"
                  value={newPackage.name}
                  onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                  placeholder="如：标准洗衣模式"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">套餐描述</label>
                <textarea
                  value={newPackage.description}
                  onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                  placeholder="描述套餐内容"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">价格 (元)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newPackage.price || ''}
                    onChange={(e) => setNewPackage({ ...newPackage, price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">时长 (分钟)</label>
                  <input
                    type="number"
                    min="1"
                    value={newPackage.durationMinutes || ''}
                    onChange={(e) => setNewPackage({ ...newPackage, durationMinutes: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">适用设备类型</label>
                <select
                  value={newPackage.type}
                  onChange={(e) => setNewPackage({ ...newPackage, type: e.target.value as Package['type'] })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
                >
                  {Object.entries(typeLabelMap).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newPackage.isActive}
                  onChange={(e) => setNewPackage({ ...newPackage, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  创建后立即启用
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                确认创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagePage;
