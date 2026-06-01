import React, { useState, useEffect } from 'react';
import { getServices, getStores, getStaff, createService, updateService, deleteService, getService } from '../api.js';

const roleLabels = {
  consultant: '顾问',
  technician: '技师',
  manager: '店长'
};

function Services() {
  const [services, setServices] = useState([]);
  const [stores, setStores] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    duration: 60,
    price: 0,
    description: '',
    preparation: '',
    cancellation_rule: '',
    store_ids: [],
    staff_ids: []
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [servicesData, storesData, staffData] = await Promise.all([
        getServices(),
        getStores(),
        getStaff()
      ]);
      setServices(servicesData);
      setStores(storesData);
      setStaff(staffData);
    } catch (err) {
      console.error('加载数据失败', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(id) {
    try {
      const service = await getService(id);
      setEditingService(service);
      setFormData({
        name: service.name,
        duration: service.duration,
        price: service.price,
        description: service.description || '',
        preparation: service.preparation || '',
        cancellation_rule: service.cancellation_rule || '',
        store_ids: service.stores?.map(s => s.id) || [],
        staff_ids: service.staff?.map(s => s.id) || []
      });
      setShowModal(true);
    } catch (err) {
      console.error('加载服务详情失败', err);
    }
  }

  function handleAdd() {
    setEditingService(null);
    setFormData({
      name: '',
      duration: 60,
      price: 0,
      description: '',
      preparation: '',
      cancellation_rule: '',
      store_ids: [],
      staff_ids: []
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingService) {
        await updateService(editingService.id, formData);
      } else {
        await createService(formData);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '保存失败');
    }
  }

  async function handleDelete(id) {
    if (!confirm('确认删除此服务项目？')) return;
    try {
      await deleteService(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '删除失败');
    }
  }

  function toggleStore(storeId) {
    const ids = formData.store_ids.includes(storeId)
      ? formData.store_ids.filter(id => id !== storeId)
      : [...formData.store_ids, storeId];
    setFormData({ ...formData, store_ids: ids });
  }

  function toggleStaff(staffId) {
    const ids = formData.staff_ids.includes(staffId)
      ? formData.staff_ids.filter(id => id !== staffId)
      : [...formData.staff_ids, staffId];
    setFormData({ ...formData, staff_ids: ids });
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>服务项目</h1>
        <button className="btn btn-primary" onClick={handleAdd}>+ 新增服务</button>
      </div>

      <div className="card">
        {loading ? (
          <div>加载中...</div>
        ) : services.length === 0 ? (
          <div className="empty-state">暂无服务项目</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>服务名称</th>
                <th>时长</th>
                <th>价格</th>
                <th>描述</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {services.map(service => (
                <tr key={service.id}>
                  <td><strong>{service.name}</strong></td>
                  <td>{service.duration}分钟</td>
                  <td style={{ color: '#2563eb', fontWeight: 600 }}>¥{service.price}</td>
                  <td style={{ maxWidth: '300px', color: '#6b7280' }}>{service.description || '-'}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(service.id)}>编辑</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(service.id)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingService ? '编辑服务' : '新增服务'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">服务名称 *</label>
                  <input className="form-input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="请输入服务名称" />
                </div>
                <div className="form-group">
                  <label className="form-label">时长 (分钟) *</label>
                  <input type="number" className="form-input" required min="1" value={formData.duration} onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">价格 (元) *</label>
                  <input type="number" className="form-input" required min="0" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">服务描述</label>
                <textarea className="form-textarea" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="请输入服务描述" />
              </div>

              <div className="form-group">
                <label className="form-label">准备事项</label>
                <textarea className="form-textarea" value={formData.preparation} onChange={e => setFormData({ ...formData, preparation: e.target.value })} placeholder="请输入顾客需要准备的事项" />
              </div>

              <div className="form-group">
                <label className="form-label">取消规则</label>
                <textarea className="form-textarea" value={formData.cancellation_rule} onChange={e => setFormData({ ...formData, cancellation_rule: e.target.value })} placeholder="请输入取消预约的规则" />
              </div>

              <div className="form-group">
                <label className="form-label">适用门店</label>
                <div className="checkbox-group">
                  {stores.map(store => (
                    <label key={store.id} className="checkbox-item">
                      <input type="checkbox" checked={formData.store_ids.includes(store.id)} onChange={() => toggleStore(store.id)} />
                      <span>{store.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">可预约人员</label>
                <div className="checkbox-group">
                  {staff.filter(s => s.role === 'technician').map(s => (
                    <label key={s.id} className="checkbox-item">
                      <input type="checkbox" checked={formData.staff_ids.includes(s.id)} onChange={() => toggleStaff(s.id)} />
                      <span>{s.name} ({roleLabels[s.role]})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Services;
