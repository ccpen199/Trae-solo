import React, { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  Package,
  AlertTriangle,
  MapPin,
  Calendar,
  Check
} from 'lucide-react';
import { useHomeContext } from '../context/HomeContext';
import type { InventoryItem } from '../types';

interface InventoryFormProps {
  item?: InventoryItem;
  onClose: () => void;
}

const InventoryForm: React.FC<InventoryFormProps> = ({ item, onClose }) => {
  const { addInventoryItem, updateInventoryItem } = useHomeContext();
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || 'food',
    quantity: item?.quantity || 0,
    unit: item?.unit || '',
    minStock: item?.minStock || 1,
    location: item?.location || '',
    purchaseDate: item?.purchaseDate || '',
    expiryDate: item?.expiryDate || '',
    notes: item?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item) {
      updateInventoryItem(item.id, formData);
    } else {
      addInventoryItem(formData);
    }
    onClose();
  };

  const categories = [
    { id: 'food', label: '食品' },
    { id: 'supplies', label: '日用品' },
    { id: 'parts', label: '零配件' },
    { id: 'other', label: '其他' },
  ];
  const locations = ['厨房', '餐厅', '客厅', '卧室', '阳台', '卫生间', '储物室', '其他'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{item ? '编辑库存' : '添加库存'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">物品名称 *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：大米"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
              <select
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">存放位置</label>
              <select
                value={formData.location}
                onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">请选择</option>
                {locations.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">当前数量</label>
              <input
                type="number"
                min="0"
                value={formData.quantity || ''}
                onChange={e => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">单位</label>
              <input
                type="text"
                value={formData.unit}
                onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：公斤"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最低库存</label>
              <input
                type="number"
                min="0"
                value={formData.minStock || ''}
                onChange={e => setFormData(prev => ({ ...prev, minStock: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">购买日期</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={e => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">有效期</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={e => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="输入备注信息"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {item ? '保存修改' : '添加库存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const InventoryView: React.FC<{ showAddForm: boolean; onCloseForm: () => void }> = ({ showAddForm, onCloseForm }) => {
  const { inventory, updateInventoryItem, deleteInventoryItem } = useHomeContext();
  const [filter, setFilter] = useState<'all' | 'lowStock'>('all');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const filteredItems = inventory.filter(i => filter === 'all' || i.lowStock);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'food': return '食品';
      case 'supplies': return '日用品';
      case 'parts': return '零配件';
      default: return '其他';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'food': return 'bg-green-100 text-green-700';
      case 'supplies': return 'bg-blue-100 text-blue-700';
      case 'parts': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 7;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          全部 ({inventory.length})
        </button>
        <button
          onClick={() => setFilter('lowStock')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
            filter === 'lowStock'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          库存预警 ({inventory.filter(i => i.lowStock).length})
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredItems.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  item.lowStock ? 'bg-red-50/50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      item.lowStock ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      {item.lowStock ? (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      ) : (
                        <Package className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-800">{item.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                          {getCategoryLabel(item.category)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          库存: {item.quantity} {item.unit}
                        </span>
                        {item.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {item.location}
                          </span>
                        )}
                        {item.lowStock && (
                          <span className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                            低于最低库存 ({item.minStock} {item.unit})
                          </span>
                        )}
                        {isExpiringSoon(item.expiryDate) && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <Calendar className="w-4 h-4" />
                            即将过期: {item.expiryDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateInventoryItem(item.id, { quantity: item.quantity + 1 })}
                      className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="增加库存"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateInventoryItem(item.id, { quantity: Math.max(0, item.quantity - 1) })}
                      className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                      title="减少库存"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteInventoryItem(item.id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">暂无库存</p>
            <p className="text-sm mt-1">点击右上角"添加"按钮记录库存</p>
          </div>
        )}
      </div>

      {showAddForm && <InventoryForm onClose={onCloseForm} />}
      {editingItem && (
        <InventoryForm item={editingItem} onClose={() => setEditingItem(null)} />
      )}
    </div>
  );
};
