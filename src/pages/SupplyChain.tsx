import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../utils/api';
import {
  SUPPLIER_TYPE_MAP, SUPPLIER_STATUS_MAP, SUPPLIER_STATUS_COLOR
} from '../utils/constants';
import { Users, Plus, Building2, Phone, User, Edit3, CheckCircle, XCircle } from 'lucide-react';

const SupplyChain: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '', type: 'material' as const, contact: '', phone: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.supplyChain();
      setSuppliers(res.suppliers);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!newSupplier.name) { alert('请填写供应商名称'); return; }
    try {
      await dashboardApi.createSupplier(newSupplier);
      setShowCreate(false);
      setNewSupplier({ name: '', type: 'material', contact: '', phone: '' });
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await dashboardApi.updateSupplier(id, { status });
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const handleEditSave = async () => {
    if (!editForm.name) { alert('请填写供应商名称'); return; }
    try {
      await dashboardApi.updateSupplier(editingId!, editForm);
      setEditingId(null);
      setEditForm({});
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const typeStats: Record<string, number> = {};
  suppliers.forEach(s => {
    typeStats[s.type] = (typeStats[s.type] || 0) + 1;
  });

  const activeCount = suppliers.filter(s => s.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">供应链协同中心</h2>
          <p className="text-sm text-gray-500">装修建材商、家政服务商管理与合作协同</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增供应商
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-gray-800">{suppliers.length}</div>
          <div className="text-sm text-gray-500">供应商总数</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="text-3xl font-bold text-green-600">{activeCount}</div>
          <div className="text-sm text-gray-500">合作中</div>
        </div>
        {Object.entries(SUPPLIER_TYPE_MAP).map(([k, v]) => (
          <div key={k} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="text-3xl font-bold text-primary-600">{typeStats[k] || 0}</div>
            <div className="text-sm text-gray-500">{v}</div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">新增供应商</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">供应商类型</label>
                <select
                  value={newSupplier.type}
                  onChange={e => setNewSupplier({ ...newSupplier, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {Object.entries(SUPPLIER_TYPE_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">供应商名称</label>
                <input
                  type="text"
                  value={newSupplier.name}
                  onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  placeholder="如：宜家建材"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
                <input
                  type="text"
                  value={newSupplier.contact}
                  onChange={e => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                  placeholder="如：采购经理-王经理"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                <input
                  type="tel"
                  value={newSupplier.phone}
                  onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  placeholder="如：13900000001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* Suppliers list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map(s => (
          <div key={s.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              {editingId === s.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={editForm.contact || ''}
                    onChange={e => setEditForm({ ...editForm, contact: e.target.value })}
                    placeholder="联系人"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="tel"
                    value={editForm.phone || ''}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="电话"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50">取消</button>
                    <button onClick={handleEditSave} className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700">保存</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        s.type === 'material' ? 'bg-blue-50 text-blue-600' :
                        s.type === 'housekeeping' ? 'bg-green-50 text-green-600' :
                        s.type === 'moving' ? 'bg-indigo-50 text-indigo-600' :
                        'bg-rose-50 text-rose-600'
                      }`}>
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-800">{s.name}</h5>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          s.type === 'material' ? 'bg-blue-100 text-blue-700' :
                          s.type === 'housekeeping' ? 'bg-green-100 text-green-700' :
                          s.type === 'moving' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {SUPPLIER_TYPE_MAP[s.type]}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => { setEditingId(s.id); setEditForm({ ...s }); }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{s.contact || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{s.phone || '-'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs rounded-full ${SUPPLIER_STATUS_COLOR[s.status]}`}>
                      {SUPPLIER_STATUS_MAP[s.status]}
                    </span>
                    <div className="flex gap-2">
                      {s.status === 'active' ? (
                        <button
                          onClick={() => handleUpdateStatus(s.id, 'suspended')}
                          className="text-xs text-accent-600 hover:text-accent-700 flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" /> 暂停
                        </button>
                      ) : s.status === 'suspended' ? (
                        <button
                          onClick={() => handleUpdateStatus(s.id, 'active')}
                          className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" /> 恢复
                        </button>
                      ) : null}
                      {s.status !== 'terminated' && (
                        <button
                          onClick={() => handleUpdateStatus(s.id, 'terminated')}
                          className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" /> 终止
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {!loading && suppliers.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <div className="text-gray-500 mb-4">暂无供应商</div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            添加第一个供应商
          </button>
        </div>
      )}
    </div>
  );
};

export default SupplyChain;
