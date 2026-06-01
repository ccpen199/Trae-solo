import React, { useState, useEffect } from 'react';
import { suppliersAPI } from '../api/index.js';

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    status: 'active'
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

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
      if (editingSupplier) {
        await suppliersAPI.update(editingSupplier.id, formData);
      } else {
        await suppliersAPI.create(formData);
      }
      fetchSuppliers();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save supplier:', error);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact: supplier.contact || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      status: supplier.status || 'active'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('确定要删除这个供应商吗？相关资源可能会受到影响。')) {
      try {
        await suppliersAPI.delete(id);
        fetchSuppliers();
      } catch (error) {
        console.error('Failed to delete supplier:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact: '',
      phone: '',
      email: '',
      status: 'active'
    });
    setEditingSupplier(null);
  };

  return (
    <div>
      <div className="page-header">
        <h2>🏢 供应商管理</h2>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + 添加供应商
        </button>
      </div>

      <div className="grid">
        {suppliers.map(supplier => (
          <div key={supplier.id} className="card">
            <div className="card-header">
              <h3 className="card-title">{supplier.name}</h3>
              <span className={`card-status ${supplier.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                {supplier.status === 'active' ? '合作中' : '已下架'}
              </span>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span>👤</span>
                <span style={{ color: '#4a5568' }}>{supplier.contact}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span>📞</span>
                <span style={{ color: '#4a5568' }}>{supplier.phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📧</span>
                <span style={{ color: '#4a5568' }}>{supplier.email}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-small btn-secondary" onClick={() => handleEdit(supplier)}>
                编辑
              </button>
              <button className="btn btn-small btn-danger" onClick={() => handleDelete(supplier.id)}>
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingSupplier ? '编辑供应商' : '添加供应商'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>供应商名称</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>联系人</label>
                    <input type="text" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>联系电话</label>
                    <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>邮箱</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>状态</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                      <option value="active">合作中</option>
                      <option value="inactive">已下架</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                  <button type="submit" className="btn btn-primary">{editingSupplier ? '保存' : '创建'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Suppliers;
