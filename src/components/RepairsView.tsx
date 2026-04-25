import React, { useState } from 'react';
import { 
  Edit2, 
  Trash2, 
  X,
  Wrench,
  DollarSign,
  Calendar,
  Tv,
  Shield,
  Clock
} from 'lucide-react';
import { useHomeContext } from '../context/HomeContext';
import type { RepairRecord } from '../types';

interface RepairFormProps {
  record?: RepairRecord;
  onClose: () => void;
}

const RepairForm: React.FC<RepairFormProps> = ({ record, onClose }) => {
  const { appliances, addRepairRecord, updateRepairRecord } = useHomeContext();
  const [formData, setFormData] = useState({
    applianceId: record?.applianceId || '',
    title: record?.title || '',
    description: record?.description || '',
    date: record?.date || new Date().toISOString().split('T')[0],
    technician: record?.technician || '',
    cost: record?.cost || 0,
    status: record?.status || 'pending',
    warranty: record?.warranty || false,
    warrantyDetails: record?.warrantyDetails || '',
    nextCheckDate: record?.nextCheckDate || '',
    notes: record?.notes || '',
    receiptUrl: record?.receiptUrl || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (record) {
      updateRepairRecord(record.id, formData);
    } else {
      addRepairRecord(formData);
    }
    onClose();
  };

  const statuses = [
    { id: 'pending', label: '待处理' },
    { id: 'in_progress', label: '处理中' },
    { id: 'completed', label: '已完成' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{record ? '编辑维修记录' : '添加维修记录'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关联设备 *</label>
            <select
              required
              value={formData.applianceId}
              onChange={e => setFormData(prev => ({ ...prev, applianceId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">请选择设备</option>
              {appliances.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">维修标题 *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：冰箱制冷问题检修"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">问题描述</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="详细描述问题和维修内容"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">维修日期</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statuses.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">维修人员</label>
              <input
                type="text"
                value={formData.technician}
                onChange={e => setFormData(prev => ({ ...prev, technician: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：王师傅"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">费用 (元)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.cost || ''}
                onChange={e => setFormData(prev => ({ ...prev, cost: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如：200"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="warranty"
              checked={formData.warranty}
              onChange={e => setFormData(prev => ({ ...prev, warranty: e.target.checked }))}
              className="w-4 h-4 text-green-600 rounded"
            />
            <label htmlFor="warranty" className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Shield className="w-4 h-4" />
              保修服务
            </label>
          </div>
          
          {formData.warranty && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">保修详情</label>
              <textarea
                value={formData.warrantyDetails}
                onChange={e => setFormData(prev => ({ ...prev, warrantyDetails: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="保修期限、范围等信息"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">下次检查日期</label>
            <input
              type="date"
              value={formData.nextCheckDate}
              onChange={e => setFormData(prev => ({ ...prev, nextCheckDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="其他备注信息"
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
              {record ? '保存修改' : '添加记录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const RepairsView: React.FC<{ showAddForm: boolean; onCloseForm: () => void }> = ({ showAddForm, onCloseForm }) => {
  const { repairs, appliances, deleteRepairRecord } = useHomeContext();
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [editingRecord, setEditingRecord] = useState<RepairRecord | null>(null);

  const filteredRepairs = repairs.filter(r => filter === 'all' || r.status === filter);

  const getApplianceName = (id: string) => {
    return appliances.find(a => a.id === id)?.name || '未知设备';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">待处理</span>;
      case 'in_progress':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">处理中</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">已完成</span>;
      default:
        return null;
    }
  };

  const isCheckSoon = (nextDate?: string) => {
    if (!nextDate) return false;
    const next = new Date(nextDate);
    const now = new Date();
    const diffDays = (next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= 14;
  };

  const totalCost = repairs.reduce((sum, r) => sum + r.cost, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总维修记录</p>
              <p className="text-2xl font-bold text-gray-800">{repairs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">待处理</p>
              <p className="text-2xl font-bold text-gray-800">
                {repairs.filter(r => r.status === 'pending' || r.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">累计费用</p>
              <p className="text-2xl font-bold text-gray-800">¥{totalCost.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: '全部' },
          { id: 'pending', label: '待处理' },
          { id: 'in_progress', label: '处理中' },
          { id: 'completed', label: '已完成' },
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
            {f.label} ({f.id === 'all' ? repairs.length : repairs.filter(r => r.status === f.id).length})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredRepairs.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredRepairs
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(record => (
                <div 
                  key={record.id} 
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    record.status !== 'completed' ? 'bg-yellow-50/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        record.status === 'completed' ? 'bg-green-100' : 
                        record.status === 'in_progress' ? 'bg-blue-100' : 'bg-yellow-100'
                      }`}>
                        <Wrench className={`w-5 h-5 ${
                          record.status === 'completed' ? 'text-green-600' : 
                          record.status === 'in_progress' ? 'text-blue-600' : 'text-yellow-600'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-800">{record.title}</h4>
                          {getStatusBadge(record.status)}
                          {record.warranty && (
                            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                              <Shield className="w-3 h-3" />
                              保修
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Tv className="w-4 h-4" />
                            {getApplianceName(record.applianceId)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {record.date}
                          </span>
                          {record.technician && (
                            <span className="flex items-center gap-1">
                              <Wrench className="w-4 h-4" />
                              {record.technician}
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-medium text-gray-700">
                            <DollarSign className="w-4 h-4" />
                            ¥{record.cost.toLocaleString()}
                          </span>
                        </div>
                        {record.description && (
                          <p className="mt-2 text-sm text-gray-600">{record.description}</p>
                        )}
                        {isCheckSoon(record.nextCheckDate) && (
                          <p className="mt-2 text-sm text-orange-600 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            下次检查: {record.nextCheckDate}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingRecord(record)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteRepairRecord(record.id)}
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
            <Wrench className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">暂无维修记录</p>
            <p className="text-sm mt-1">点击右上角"添加"按钮记录维修</p>
          </div>
        )}
      </div>

      {showAddForm && <RepairForm onClose={onCloseForm} />}
      {editingRecord && (
        <RepairForm record={editingRecord} onClose={() => setEditingRecord(null)} />
      )}
    </div>
  );
};
