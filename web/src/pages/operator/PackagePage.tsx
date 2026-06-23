import { useState, useEffect } from 'react';
import { adminApi } from '../../api';
import type { Package, DeviceType } from '../../types';

const typeLabelMap: Record<string, string> = {
  washer: '洗衣机',
  water_dispenser: '饮水机',
  shower: '淋浴终端'
};

const typeIconMap: Record<string, string> = {
  washer: '🧺',
  water_dispenser: '💧',
  shower: '🚿'
};

interface PackageWithActive extends Package {
  _isActive: boolean;
}

const PackagePage = () => {
  const [packages, setPackages] = useState<PackageWithActive[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    deviceType: 'washer' as DeviceType,
    totalMinutes: 60,
    price: 0,
    description: ''
  });

  useEffect(() => {
    loadPackages();
  }, [filterType]);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPackages({
        deviceType: filterType !== 'all' ? filterType : undefined,
        pageSize: 200
      });
      const items = res.map((p: any) => ({ ...p, _isActive: true }));
      setPackages(items);
    } catch (error) {
      console.error('加载套餐列表失败', error);
      alert('加载套餐列表失败');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      deviceType: 'washer',
      totalMinutes: 60,
      price: 0,
      description: ''
    });
  };

  const openCreateModal = () => {
    setEditingPkg(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (pkg: Package) => {
    setEditingPkg(pkg);
    setForm({
      name: pkg.name,
      deviceType: pkg.deviceType,
      totalMinutes: pkg.totalMinutes,
      price: pkg.price,
      description: pkg.description
    });
    setShowModal(true);
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      alert('请输入套餐名称');
      return false;
    }
    if (form.totalMinutes <= 0) {
      alert('总分钟数必须大于 0');
      return false;
    }
    if (form.price < 0) {
      alert('价格不能为负数');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setActionLoading(true);
    try {
      if (editingPkg) {
        await adminApi.updatePackage(editingPkg.id, {
          name: form.name,
          deviceType: form.deviceType,
          totalMinutes: form.totalMinutes,
          price: form.price,
          description: form.description
        });
        alert('套餐更新成功');
      } else {
        await adminApi.createPackage({
          name: form.name,
          deviceType: form.deviceType,
          totalMinutes: form.totalMinutes,
          price: form.price,
          description: form.description
        });
        alert('套餐创建成功');
      }
      setShowModal(false);
      resetForm();
      setEditingPkg(null);
      loadPackages();
    } catch (error) {
      console.error(error);
      alert(editingPkg ? '更新失败' : '创建失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = (pkg: PackageWithActive) => {
    setPackages(prev => prev.map(p =>
      p.id === pkg.id ? { ...p, _isActive: !p._isActive } : p
    ));
    alert(pkg._isActive ? '套餐已停用' : '套餐已启用');
  };

  const calcUnitPrice = (price: number, minutes: number) => {
    if (minutes <= 0) return '0.000';
    return (price / minutes).toFixed(3);
  };

  const filteredPackages = packages;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">套餐管理</h1>
        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors shadow-sm"
        >
          + 新建套餐
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <span className="text-sm text-gray-500 self-center mr-2">设备类型：</span>
        {[
          { value: 'all', label: '全部' },
          { value: 'washer', label: '洗衣机' },
          { value: 'water_dispenser', label: '饮水机' },
          { value: 'shower', label: '淋浴终端' }
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilterType(item.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filterType === item.value
                ? 'bg-primary-500 text-white shadow'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl shadow-sm">加载中...</div>
      ) : filteredPackages.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
          <div className="text-6xl mb-4">💎</div>
          <p className="text-gray-500 mb-2">暂无套餐</p>
          <p className="text-sm text-gray-400">点击右上角按钮创建第一个套餐</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">套餐名称</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">设备类型</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">总分钟数</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">价格</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">每分钟单价</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">描述</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">状态</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{pkg.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5 font-mono">{pkg.id.slice(0, 10)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{typeIconMap[pkg.deviceType] || '📱'}</span>
                        <span className="text-sm text-gray-700">{typeLabelMap[pkg.deviceType] || pkg.deviceType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-800">{pkg.totalMinutes}</span>
                      <span className="text-xs text-gray-400 ml-1">分钟</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-green-600">¥{pkg.price.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                        ¥{calcUnitPrice(pkg.price, pkg.totalMinutes)}/分钟
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm text-gray-500 line-clamp-2">
                        {pkg.description || <span className="text-gray-300">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        pkg._isActive
                          ? 'bg-green-50 text-green-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          pkg._isActive ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        {pkg._isActive ? '启用中' : '已停用'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleToggleActive(pkg)}
                          className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                            pkg._isActive
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {pkg._isActive ? '停用' : '启用'}
                        </button>
                        <button
                          onClick={() => openEditModal(pkg)}
                          className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          编辑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                {editingPkg ? '编辑套餐' : '新建套餐'}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); setEditingPkg(null); }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">套餐名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="如：标准洗衣套餐"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">适用设备类型 <span className="text-red-500">*</span></label>
                <select
                  value={form.deviceType}
                  onChange={(e) => setForm({ ...form, deviceType: e.target.value as DeviceType })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white transition-all"
                >
                  <option value="washer">🧺 洗衣机</option>
                  <option value="water_dispenser">💧 饮水机</option>
                  <option value="shower">🚿 淋浴终端</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">总分钟数 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={form.totalMinutes || ''}
                      onChange={(e) => setForm({ ...form, totalMinutes: Math.max(0, Number(e.target.value)) })}
                      className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">分钟</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">价格 (元) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">¥</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price || ''}
                      onChange={(e) => setForm({ ...form, price: Math.max(0, Number(e.target.value)) })}
                      className="w-full px-4 py-2.5 pl-8 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {form.totalMinutes > 0 && form.price >= 0 && (
                <div className="p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-600">折合单价</span>
                    <span className="font-bold text-blue-700">¥{calcUnitPrice(form.price, form.totalMinutes)} / 分钟</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">套餐描述</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="描述套餐内容、使用说明等..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); resetForm(); setEditingPkg(null); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {actionLoading ? '处理中...' : editingPkg ? '保存修改' : '确认创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagePage;
