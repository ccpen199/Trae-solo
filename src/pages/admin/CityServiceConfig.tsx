import { useState } from 'react';
import {
  Settings,
  Plus,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  MapPin,
  Save,
  X,
  Search,
} from 'lucide-react';
import Modal from '@/components/Modal';
import { mockCityConfigs } from '@/data/mock';
import type { CityConfig, LocalizedService } from '@/types';

const cities = [
  { code: '130100', name: '石家庄市' },
  { code: '130200', name: '唐山市' },
  { code: '130300', name: '秦皇岛市' },
  { code: '130400', name: '邯郸市' },
  { code: '130500', name: '邢台市' },
  { code: '130600', name: '保定市' },
  { code: '130700', name: '张家口市' },
  { code: '130800', name: '承德市' },
  { code: '130900', name: '沧州市' },
  { code: '131000', name: '廊坊市' },
  { code: '131100', name: '衡水市' },
];

export default function CityServiceConfig() {
  const [configs, setConfigs] = useState<CityConfig[]>(mockCityConfigs);
  const [activeCityCode, setActiveCityCode] = useState('130100');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<LocalizedService | null>(null);
  const [form, setForm] = useState<Omit<LocalizedService, 'id'>>({
    name: '',
    description: '',
    linkUrl: '',
    icon: 'home',
    enabled: true,
  });
  const [searchTerm, setSearchTerm] = useState('');

  const activeConfig = configs.find((c) => c.cityCode === activeCityCode);

  const openAddModal = () => {
    setEditingService(null);
    setForm({ name: '', description: '', linkUrl: '', icon: 'home', enabled: true });
    setModalOpen(true);
  };

  const openEditModal = (svc: LocalizedService) => {
    setEditingService(svc);
    setForm({
      name: svc.name,
      description: svc.description,
      linkUrl: svc.linkUrl,
      icon: svc.icon,
      enabled: svc.enabled,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      alert('请输入服务名称');
      return;
    }
    setConfigs((prev) => {
      return prev.map((c) => {
        if (c.cityCode !== activeCityCode) return c;
        if (editingService) {
          return {
            ...c,
            localizedServices: c.localizedServices.map((s) =>
              s.id === editingService.id ? { ...s, ...form } : s
            ),
            updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
            updatedBy: 'admin_sjz',
          };
        }
        return {
          ...c,
          localizedServices: [
            ...c.localizedServices,
            { id: 'LS-' + Date.now(), ...form },
          ],
          updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
          updatedBy: 'admin_sjz',
        };
      });
    });
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('确定删除该本地化服务吗？')) return;
    setConfigs((prev) =>
      prev.map((c) =>
        c.cityCode === activeCityCode
          ? { ...c, localizedServices: c.localizedServices.filter((s) => s.id !== id) }
          : c
      )
    );
  };

  const toggleService = (id: string) => {
    setConfigs((prev) =>
      prev.map((c) =>
        c.cityCode === activeCityCode
          ? {
              ...c,
              localizedServices: c.localizedServices.map((s) =>
                s.id === id ? { ...s, enabled: !s.enabled } : s
              ),
            }
          : c
      )
    );
  };

  const filteredServices =
    activeConfig?.localizedServices.filter(
      (s) =>
        s.name.includes(searchTerm) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gov-red" />
            地市本地化服务配置
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            各地市管理员可配置本地特色服务入口，发布后将在对应地市用户首页展示
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="gov-card p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gov-red" />
            选择地市
          </h3>
          <ul className="space-y-1">
            {cities.map((city) => {
              const cfg = configs.find((c) => c.cityCode === city.code);
              const count = cfg?.localizedServices.filter((s) => s.enabled).length || 0;
              const isActive = city.code === activeCityCode;
              return (
                <li key={city.code}>
                  <button
                    onClick={() => setActiveCityCode(city.code)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition ${
                      isActive
                        ? 'bg-gov-red text-white'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span>{city.name}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {count} 项
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="gov-card p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h3 className="font-semibold text-gray-800">
                  {cities.find((c) => c.code === activeCityCode)?.name} · 本地化服务
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  最后更新：{activeConfig?.updatedAt || '暂无配置'} · 操作人：
                  {activeConfig?.updatedBy || '-'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="搜索服务..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md w-56 focus:outline-none focus:ring-2 focus:ring-gov-red/30 focus:border-gov-red"
                  />
                </div>
                <button
                  onClick={openAddModal}
                  className="gov-btn-primary inline-flex items-center gap-1.5 text-sm px-4 py-2"
                >
                  <Plus className="w-4 h-4" />
                  新增服务
                </button>
              </div>
            </div>

            {filteredServices.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <Settings className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>暂无本地化服务，点击"新增服务"添加</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                      <th className="pb-3 font-medium">服务名称</th>
                      <th className="pb-3 font-medium">描述</th>
                      <th className="pb-3 font-medium">跳转链接</th>
                      <th className="pb-3 font-medium text-center">状态</th>
                      <th className="pb-3 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.map((svc) => (
                      <tr key={svc.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {svc.icon === 'home'
                                ? '🏠'
                                : svc.icon === 'award'
                                ? '🎖️'
                                : svc.icon === 'anchor'
                                ? '⚓'
                                : '📌'}
                            </span>
                            <span className="font-medium text-gray-800">{svc.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-gray-600 max-w-xs truncate">{svc.description}</td>
                        <td className="py-3 text-xs text-gov-red font-mono truncate max-w-[200px]">
                          {svc.linkUrl}
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => toggleService(svc.id)}
                            className="inline-flex items-center"
                          >
                            {svc.enabled ? (
                              <ToggleRight className="w-9 h-9 text-green-500" />
                            ) : (
                              <ToggleLeft className="w-9 h-9 text-gray-300" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => openEditModal(svc)}
                            className="text-gray-500 hover:text-gov-red p-1.5 inline-flex"
                            title="编辑"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(svc.id)}
                            className="text-gray-500 hover:text-red-600 p-1.5 inline-flex"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="gov-card p-5 bg-blue-50 border-blue-200">
            <div className="flex gap-3">
              <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">配置说明</p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1 list-disc list-inside">
                  <li>各地市最多配置 5 项本地化特色服务；</li>
                  <li>服务链接需为 HTTPS 协议的政务服务域名；</li>
                  <li>开关关闭后，用户端将不再展示该入口；</li>
                  <li>所有操作均记录审计日志，可追溯变更历史。</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingService ? '编辑本地化服务' : '新增本地化服务'}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModalOpen(false)} className="gov-btn-secondary">
              <X className="w-4 h-4 inline mr-1" />
              取消
            </button>
            <button onClick={handleSave} className="gov-btn-primary">
              <Save className="w-4 h-4 inline mr-1" />
              保存
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">服务名称 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="如：公积金提取、人才补贴申报"
              className="gov-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">服务描述</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="简要描述服务内容，将在服务卡片上展示"
              className="gov-input resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">跳转链接 *</label>
            <input
              type="url"
              value={form.linkUrl}
              onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
              placeholder="https://..."
              className="gov-input font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">图标</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { k: 'home', v: '🏠' },
                { k: 'award', v: '🎖️' },
                { k: 'anchor', v: '⚓' },
                { k: 'heart', v: '❤️' },
                { k: 'book', v: '📚' },
                { k: 'car', v: '🚗' },
              ].map((i) => (
                <button
                  key={i.k}
                  type="button"
                  onClick={() => setForm({ ...form, icon: i.k })}
                  className={`w-11 h-11 rounded-lg border text-2xl transition ${
                    form.icon === i.k
                      ? 'border-gov-red bg-red-50 ring-2 ring-gov-red/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {i.v}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="w-4 h-4 text-gov-red rounded focus:ring-gov-red"
            />
            <label htmlFor="enabled" className="text-sm text-gray-700">
              立即启用（保存后用户端立即可见）
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
