import React, { useState } from 'react';
import { 
  Edit2, 
  Trash2, 
  Tv, 
  Wrench, 
  Calendar,
  X,
  AlertTriangle,
  MapPin,
  DollarSign,
  Shield
} from 'lucide-react';
import { useHomeContext } from '../context/HomeContext';
import type { Appliance } from '../types';

interface ApplianceFormProps {
  appliance?: Appliance;
  onClose: () => void;
}

const ApplianceForm: React.FC<ApplianceFormProps> = ({ appliance, onClose }) => {
  const { addAppliance, updateAppliance } = useHomeContext();
  const [formData, setFormData] = useState({
    name: appliance?.name || '',
    category: appliance?.category || '',
    brand: appliance?.brand || '',
    model: appliance?.model || '',
    purchaseDate: appliance?.purchaseDate || '',
    purchasePrice: appliance?.purchasePrice || 0,
    warrantyMonths: appliance?.warrantyMonths || 12,
    location: appliance?.location || '',
    status: appliance?.status || 'active' as const,
    lastMaintenanceDate: appliance?.lastMaintenanceDate || '',
    nextMaintenanceDate: appliance?.nextMaintenanceDate || '',
    notes: appliance?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (appliance) {
      updateAppliance(appliance.id, formData);
    } else {
      addAppliance(formData);
    }
    onClose();
  };

  const categories = ['冰箱', '空调', '洗衣机', '电视', '油烟机', '热水器', '微波炉', '烤箱', '洗碗机', '其他'];
  const locations = ['客厅', '卧室', '厨房', '卫生间', '阳台', '书房', '其他'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{appliance ? '编辑设备' : '添加设备'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">设备名称 *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：海尔冰箱"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
              <select
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">请选择</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">位置</label>
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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">品牌</label>
              <input
                type="text"
                value={formData.brand}
                onChange={e => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：海尔"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">型号</label>
              <input
                type="text"
                value={formData.model}
                onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：BCD-500W"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">购买价格 (元)</label>
              <input
                type="number"
                value={formData.purchasePrice || ''}
                onChange={e => setFormData(prev => ({ ...prev, purchasePrice: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：5999"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">保修期限 (月)</label>
              <input
                type="number"
                value={formData.warrantyMonths || ''}
                onChange={e => setFormData(prev => ({ ...prev, warrantyMonths: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：24"
              />
            </div>
            {appliance && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">正常使用</option>
                  <option value="maintenance">维护中</option>
                  <option value="inactive">停用</option>
                </select>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">上次维护日期</label>
              <input
                type="date"
                value={formData.lastMaintenanceDate}
                onChange={e => setFormData(prev => ({ ...prev, lastMaintenanceDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">下次维护日期</label>
              <input
                type="date"
                value={formData.nextMaintenanceDate}
                onChange={e => setFormData(prev => ({ ...prev, nextMaintenanceDate: e.target.value }))}
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
              rows={3}
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
              {appliance ? '保存修改' : '添加设备'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ApplianceDetail: React.FC<{ appliance: Appliance; onClose: () => void }> = ({ appliance, onClose }) => {
  const { tasks, repairs } = useHomeContext();
  
  const relatedTasks = tasks.filter(t => t.applianceId === appliance.id);
  const relatedRepairs = repairs.filter(r => r.applianceId === appliance.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'maintenance': return 'bg-orange-100 text-orange-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '正常使用';
      case 'maintenance': return '维护中';
      case 'inactive': return '停用';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Tv className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{appliance.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appliance.status)}`}>
                {getStatusLabel(appliance.status)}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">品牌型号</p>
              <p className="font-medium">{appliance.brand} {appliance.model}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">位置</p>
              <p className="font-medium flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {appliance.location}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">购买日期</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {appliance.purchaseDate}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">购买价格</p>
              <p className="font-medium flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                ¥{appliance.purchasePrice.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">保修期限</p>
              <p className="font-medium flex items-center gap-1">
                <Shield className="w-4 h-4" />
                {appliance.warrantyMonths}个月
              </p>
            </div>
            {appliance.nextMaintenanceDate && (
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">下次维护</p>
                <p className="font-medium flex items-center gap-1 text-orange-600">
                  <Wrench className="w-4 h-4" />
                  {appliance.nextMaintenanceDate}
                </p>
              </div>
            )}
          </div>
          
          {appliance.notes && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">备注</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{appliance.notes}</p>
            </div>
          )}
          
          <div>
            <h4 className="font-medium text-gray-800 mb-3">关联任务 ({relatedTasks.length})</h4>
            {relatedTasks.length > 0 ? (
              <div className="space-y-2">
                {relatedTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        task.status === 'completed' ? 'bg-green-500' : 
                        task.priority === 'high' ? 'bg-red-500' : 'bg-orange-500'
                      }`}></div>
                      <span className={`text-sm ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                        {task.title}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{task.dueDate || '无截止日期'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">暂无关联任务</p>
            )}
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 mb-3">维修记录 ({relatedRepairs.length})</h4>
            {relatedRepairs.length > 0 ? (
              <div className="space-y-2">
                {relatedRepairs.map(repair => (
                  <div key={repair.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{repair.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{repair.date}</span>
                      <span className="text-sm font-medium">¥{repair.cost}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">暂无维修记录</p>
            )}
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AppliancesView: React.FC<{ showAddForm: boolean; onCloseForm: () => void }> = ({ showAddForm, onCloseForm }) => {
  const { appliances, deleteAppliance } = useHomeContext();
  const [filter, setFilter] = useState<'all' | 'active' | 'maintenance' | 'inactive'>('all');
  const [editingAppliance, setEditingAppliance] = useState<Appliance | null>(null);
  const [viewingAppliance, setViewingAppliance] = useState<Appliance | null>(null);

  const filteredAppliances = appliances.filter(a => filter === 'all' || a.status === filter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">正常</span>;
      case 'maintenance':
        return <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">维护中</span>;
      case 'inactive':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">停用</span>;
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '冰箱': return '🧊';
      case '空调': return '❄️';
      case '洗衣机': return '🧺';
      case '电视': return '📺';
      case '油烟机': return '🍳';
      case '热水器': return '🚿';
      case '微波炉': return '🔔';
      case '烤箱': return '🍞';
      case '洗碗机': return '🍽️';
      default: return '🔌';
    }
  };

  const isWarrantyExpiring = (purchaseDate: string, warrantyMonths: number) => {
    const purchase = new Date(purchaseDate);
    const warrantyEnd = new Date(purchase.setMonth(purchase.getMonth() + warrantyMonths));
    const now = new Date();
    const diffMonths = (warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return diffMonths > 0 && diffMonths <= 3;
  };

  const isMaintenanceSoon = (nextDate?: string) => {
    if (!nextDate) return false;
    const next = new Date(nextDate);
    const now = new Date();
    const diffDays = (next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 14;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: '全部' },
          { id: 'active', label: '正常' },
          { id: 'maintenance', label: '维护中' },
          { id: 'inactive', label: '停用' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {f.label} ({f.id === 'all' ? appliances.length : appliances.filter(a => a.status === f.id).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAppliances.length > 0 ? (
          filteredAppliances.map(appliance => (
            <div 
              key={appliance.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setViewingAppliance(appliance)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{getCategoryIcon(appliance.category)}</div>
                    <div>
                      <h4 className="font-medium text-gray-800">{appliance.name}</h4>
                      <p className="text-xs text-gray-500">{appliance.brand} {appliance.model}</p>
                    </div>
                  </div>
                  {getStatusBadge(appliance.status)}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {appliance.location}
                    </span>
                    <span className="text-gray-500 flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      ¥{appliance.purchasePrice.toLocaleString()}
                    </span>
                  </div>
                  
                  {appliance.nextMaintenanceDate && (
                    <div className={`flex items-center gap-1 text-xs p-2 rounded ${
                      isMaintenanceSoon(appliance.nextMaintenanceDate) 
                        ? 'bg-orange-50 text-orange-600' 
                        : 'bg-gray-50 text-gray-600'
                    }`}>
                      <Wrench className="w-4 h-4" />
                      <span>下次维护: {appliance.nextMaintenanceDate}</span>
                      {isMaintenanceSoon(appliance.nextMaintenanceDate) && (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                    </div>
                  )}
                  
                  {isWarrantyExpiring(appliance.purchaseDate, appliance.warrantyMonths) && (
                    <div className="flex items-center gap-1 text-xs p-2 rounded bg-yellow-50 text-yellow-700">
                      <Shield className="w-4 h-4" />
                      <span>保修即将到期</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setEditingAppliance(appliance)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    编辑
                  </button>
                  <button
                    onClick={() => deleteAppliance(appliance.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
            <Tv className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">暂无设备</p>
            <p className="text-sm mt-1">点击右上角"添加"按钮添加新设备</p>
          </div>
        )}
      </div>

      {showAddForm && <ApplianceForm onClose={onCloseForm} />}
      {editingAppliance && (
        <ApplianceForm appliance={editingAppliance} onClose={() => setEditingAppliance(null)} />
      )}
      {viewingAppliance && (
        <ApplianceDetail appliance={viewingAppliance} onClose={() => setViewingAppliance(null)} />
      )}
    </div>
  );
};
