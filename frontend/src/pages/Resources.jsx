import React, { useState, useEffect } from 'react';
import { resourcesAPI, suppliersAPI } from '../api/index.js';

function Resources() {
  const [resources, setResources] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [showChangelog, setShowChangelog] = useState(null);
  const [changelogs, setChangelogs] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    type: 'scenic',
    name: '',
    description: '',
    location: '',
    latitude: '',
    longitude: '',
    opening_hours: '',
    suitable_for: '',
    price: '',
    stock: '',
    notes: '',
    is_closed: false,
    season_start: '',
    season_end: '',
    supplier_id: ''
  });

  useEffect(() => {
    fetchResources();
    fetchSuppliers();
  }, [filterType]);

  const fetchResources = async () => {
    try {
      const response = await resourcesAPI.getAll(filterType || undefined);
      setResources(response.data);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersAPI.getAll();
      setSuppliers(response.data);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingResource) {
        await resourcesAPI.update(editingResource.id, formData);
      } else {
        await resourcesAPI.create(formData);
      }
      fetchResources();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save resource:', error);
    }
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setFormData({
      type: resource.type,
      name: resource.name,
      description: resource.description || '',
      location: resource.location || '',
      latitude: resource.latitude || '',
      longitude: resource.longitude || '',
      opening_hours: resource.opening_hours || '',
      suitable_for: resource.suitable_for || '',
      price: resource.price,
      stock: resource.stock,
      notes: resource.notes || '',
      is_closed: resource.is_closed,
      season_start: resource.season_start || '',
      season_end: resource.season_end || '',
      supplier_id: resource.supplier_id || ''
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (showDeleteConfirm) {
      try {
        await resourcesAPI.delete(showDeleteConfirm);
        fetchResources();
      } catch (error) {
        console.error('Failed to delete resource:', error);
      }
    }
    setShowDeleteConfirm(null);
  };

  const handleViewChangelog = async (id) => {
    try {
      const response = await resourcesAPI.getChangeLogs(id);
      setChangelogs(response.data);
      setShowChangelog(id);
    } catch (error) {
      console.error('Failed to fetch changelog:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'scenic',
      name: '',
      description: '',
      location: '',
      latitude: '',
      longitude: '',
      opening_hours: '',
      suitable_for: '',
      price: '',
      stock: '',
      notes: '',
      is_closed: false,
      season_start: '',
      season_end: '',
      supplier_id: ''
    });
    setEditingResource(null);
  };

  const getBadgeClass = (type) => {
    const classes = {
      scenic: 'badge-scenic',
      hotel: 'badge-hotel',
      restaurant: 'badge-restaurant',
      transport: 'badge-transport',
      activity: 'badge-activity'
    };
    return classes[type] || '';
  };

  const getTypeName = (type) => {
    const names = {
      scenic: '景点',
      hotel: '酒店',
      restaurant: '餐厅',
      transport: '交通',
      activity: '活动'
    };
    return names[type] || type;
  };

  return (
    <div>
      <div className="page-header">
        <h2>🏛️ 资源管理</h2>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + 添加资源
        </button>
      </div>

      <div className="filter-bar">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">全部类型</option>
          <option value="scenic">景点</option>
          <option value="hotel">酒店</option>
          <option value="restaurant">餐厅</option>
          <option value="transport">交通</option>
          <option value="activity">活动</option>
        </select>
      </div>

      <div className="grid">
        {resources.map(resource => (
          <div key={resource.id} className="card">
            <div className="card-header">
              <div>
                <span className={`badge ${getBadgeClass(resource.type)}`}>{getTypeName(resource.type)}</span>
                <h3 className="card-title" style={{ marginTop: '0.5rem' }}>{resource.name}</h3>
              </div>
              <span className={`card-status ${resource.is_closed ? 'status-closed' : 'status-active'}`}>
                {resource.is_closed ? '已停业' : '运营中'}
              </span>
            </div>
            
            <div className="resource-meta">
              <span>📍 {resource.location}</span>
              <span>🕐 {resource.opening_hours}</span>
              <span>👥 {resource.suitable_for}</span>
              {resource.supplier_name && <span>🏢 {resource.supplier_name}</span>}
            </div>
            
            <p style={{ color: '#4a5568', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {resource.description}
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="price">¥{resource.price}</span>
              <div>
                <button className="btn btn-small btn-secondary" style={{ marginRight: '0.5rem' }} 
                        onClick={() => handleViewChangelog(resource.id)}>
                  📜 历史
                </button>
                <button className="btn btn-small btn-secondary" style={{ marginRight: '0.5rem' }}
                        onClick={() => handleEdit(resource)}>
                  编辑
                </button>
                <button className="btn btn-small btn-danger" 
                        onClick={() => handleDelete(resource.id)}>
                  删除
                </button>
              </div>
            </div>
            
            {resource.notes && (
              <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#fffaf0', borderRadius: '4px', fontSize: '0.85rem', color: '#744210' }}>
                ⚠️ {resource.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingResource ? '编辑资源' : '添加资源'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>资源类型</label>
                    <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                      <option value="scenic">景点</option>
                      <option value="hotel">酒店</option>
                      <option value="restaurant">餐厅</option>
                      <option value="transport">交通</option>
                      <option value="activity">活动</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>供应商</label>
                    <select value={formData.supplier_id} onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}>
                      <option value="">请选择供应商</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>资源名称</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                
                <div className="form-group">
                  <label>描述</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows="3" />
                </div>
                
                <div className="form-group">
                  <label>地理位置</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>纬度</label>
                    <input type="number" step="0.0001" value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>经度</label>
                    <input type="number" step="0.0001" value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: e.target.value})} />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>开放时间</label>
                    <input type="text" value={formData.opening_hours} onChange={(e) => setFormData({...formData, opening_hours: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>适合人群</label>
                    <input type="text" value={formData.suitable_for} onChange={(e) => setFormData({...formData, suitable_for: e.target.value})} />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>价格 (¥)</label>
                    <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>库存</label>
                    <input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>季节开始</label>
                    <input type="date" value={formData.season_start} onChange={(e) => setFormData({...formData, season_start: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>季节结束</label>
                    <input type="date" value={formData.season_end} onChange={(e) => setFormData({...formData, season_end: e.target.value})} />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>注意事项</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
                </div>
                
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" checked={formData.is_closed} onChange={(e) => setFormData({...formData, is_closed: e.target.checked})} />
                    标记为停业
                  </label>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                  <button type="submit" className="btn btn-primary">{editingResource ? '保存' : '创建'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showChangelog && (
        <div className="modal-overlay" onClick={() => setShowChangelog(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>变更历史</h3>
              <button className="modal-close" onClick={() => setShowChangelog(null)}>×</button>
            </div>
            <div className="modal-body">
              {changelogs.length === 0 ? (
                <div className="empty-state">暂无变更记录</div>
              ) : (
                changelogs.map(log => (
                  <div key={log.id} className="changelog-item">
                    <div className="changelog-header">
                      <span>{log.field_name}</span>
                      <span>{log.created_at}</span>
                    </div>
                    <div className="changelog-content">
                      {log.old_value} → {log.new_value}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>确认删除</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.1rem' }}>
                ⚠️ 确定要删除这个资源吗？
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                  取消
                </button>
                <button className="btn btn-danger" onClick={confirmDelete}>
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Resources;
