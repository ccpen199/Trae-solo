import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { standardsApi } from '@/services/api';
import { City, GarbageCategory, GarbageItem } from '../../../shared/types';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, MapPin, Save, X } from 'lucide-react';

export default function StandardManagement() {
  const { currentCity, setCurrentCity } = useAppStore();
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<(GarbageCategory & { items?: GarbageItem[] })[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; data?: GarbageCategory }>({ open: false });
  const [itemModal, setItemModal] = useState<{ open: boolean; categoryId?: string; data?: GarbageItem }>({ open: false });
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (currentCity) {
      loadCategories(currentCity.id);
    }
  }, [currentCity]);

  const loadCities = async () => {
    try {
      const res = await standardsApi.getCities();
      setCities(res.cities);
      if (res.cities.length > 0 && !currentCity) {
        setCurrentCity(res.cities[0]);
      }
    } catch (error) {
      console.error('加载城市列表失败:', error);
    }
  };

  const loadCategories = async (cityId: string) => {
    setLoading(true);
    try {
      const res = await standardsApi.getCategories(cityId);
      setCategories(res.categories);
    } catch (error) {
      console.error('加载分类列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryItems = async (categoryId: string) => {
    try {
      const res = await standardsApi.getCategoryItems(categoryId);
      setCategories(prev => prev.map(c => 
        c.id === categoryId ? { ...c, items: res.items } : c
      ));
    } catch (error) {
      console.error('加载分类条目失败:', error);
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
      loadCategoryItems(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const openCategoryModal = (category?: GarbageCategory) => {
    setCategoryModal({ open: true, data: category });
    setFormData(category || { name: '', code: 'recyclable', color: '#22c55e', guidelines: '', misconceptions: '', icon: '' });
  };

  const openItemModal = (categoryId: string, item?: GarbageItem) => {
    setItemModal({ open: true, categoryId, data: item });
    setFormData(item || { name: '', aliases: '', categoryId, requirements: '', misconceptions: '' });
  };

  const saveCategory = async () => {
    if (!currentCity) return;
    try {
      if (categoryModal.data) {
        await standardsApi.updateCategory(categoryModal.data.id, formData);
      } else {
        await standardsApi.createCategory(currentCity.id, formData);
      }
      loadCategories(currentCity.id);
      setCategoryModal({ open: false });
    } catch (error) {
      console.error('保存分类失败:', error);
    }
  };

  const saveItem = async () => {
    if (!currentCity) return;
    const data = { ...formData, aliases: formData.aliases ? formData.aliases.split(',').map((s: string) => s.trim()) : [] };
    try {
      if (itemModal.data) {
        await standardsApi.updateItem(itemModal.data.id, data);
      } else {
        await standardsApi.createItem(currentCity.id, data);
      }
      if (itemModal.categoryId) {
        loadCategoryItems(itemModal.categoryId);
      }
      setItemModal({ open: false });
    } catch (error) {
      console.error('保存条目失败:', error);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!currentCity || !confirm('确定删除该分类及其下所有条目？')) return;
    try {
      await standardsApi.deleteCategory(id);
      loadCategories(currentCity.id);
    } catch (error) {
      console.error('删除分类失败:', error);
    }
  };

  const deleteItem = async (id: string, categoryId: string) => {
    if (!confirm('确定删除该条目？')) return;
    try {
      await standardsApi.deleteItem(id);
      loadCategoryItems(categoryId);
    } catch (error) {
      console.error('删除条目失败:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">标准包管理</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2">
            <MapPin className="w-5 h-5 text-green-400" />
            <select
              value={currentCity?.id || ''}
              onChange={(e) => {
                const city = cities.find(c => c.id === e.target.value);
                if (city) setCurrentCity(city);
              }}
              className="bg-transparent border-none outline-none text-white min-w-32"
            >
              {cities.map(city => (
                <option key={city.id} value={city.id} className="bg-gray-800">
                  {city.province} - {city.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => openCategoryModal()}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            新增分类
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : (
        <div className="space-y-4">
          {categories.map(category => (
            <div key={category.id} className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleCategory(category.id)} className="p-1 hover:bg-gray-700 rounded">
                    {expandedCategories.has(category.id) ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-gray-400">编码: {category.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openItemModal(category.id)}
                    className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                    title="新增条目"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openCategoryModal(category)}
                    className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                    title="编辑分类"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteCategory(category.id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="删除分类"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {expandedCategories.has(category.id) && category.items && (
                <div className="border-t border-gray-700">
                  {category.items.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">暂无条目</div>
                  ) : (
                    <div className="divide-y divide-gray-700">
                      {category.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-4 pl-12 hover:bg-gray-700/30 transition-colors">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            {item.aliases?.length > 0 && (
                              <p className="text-sm text-gray-400">别名: {item.aliases.join(', ')}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openItemModal(category.id, item)}
                              className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteItem(item.id, category.id)}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {categoryModal.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{categoryModal.data ? '编辑分类' : '新增分类'}</h2>
              <button onClick={() => setCategoryModal({ open: false })} className="p-2 hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">分类名称</label>
                <input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">分类编码</label>
                  <select
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="recyclable">可回收物</option>
                    <option value="harmful">有害垃圾</option>
                    <option value="kitchen">厨余垃圾</option>
                    <option value="other">其他垃圾</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">标识颜色</label>
                  <input
                    type="color"
                    value={formData.color || '#22c55e'}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 bg-gray-700 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">投放指南</label>
                <textarea
                  value={formData.guidelines || ''}
                  onChange={(e) => setFormData({ ...formData, guidelines: e.target.value })}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-green-500 min-h-20"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">常见误区</label>
                <textarea
                  value={formData.misconceptions || ''}
                  onChange={(e) => setFormData({ ...formData, misconceptions: e.target.value })}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-green-500 min-h-20"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setCategoryModal({ open: false })}
                className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveCategory}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-500 hover:bg-green-600 transition-colors"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {itemModal.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{itemModal.data ? '编辑条目' : '新增条目'}</h2>
              <button onClick={() => setItemModal({ open: false })} className="p-2 hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">物品名称</label>
                <input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">别名（用逗号分隔）</label>
                <input
                  value={formData.aliases || ''}
                  onChange={(e) => setFormData({ ...formData, aliases: e.target.value })}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="例如：塑料瓶, PET瓶"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">投放要求</label>
                <textarea
                  value={formData.requirements || ''}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-green-500 min-h-20"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">常见误区</label>
                <textarea
                  value={formData.misconceptions || ''}
                  onChange={(e) => setFormData({ ...formData, misconceptions: e.target.value })}
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-green-500 min-h-20"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setItemModal({ open: false })}
                className="px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveItem}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-green-500 hover:bg-green-600 transition-colors"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
