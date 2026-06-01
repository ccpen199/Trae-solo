import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    code: '', name: '', contact: '', phone: '', address: '', status: 'active'
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    const res = await api.get('/suppliers');
    setSuppliers(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingSupplier) {
      await api.put(`/suppliers/${editingSupplier.id}`, formData);
    } else {
      await api.post('/suppliers', formData);
    }
    setShowModal(false);
    loadSuppliers();
  };

  const openEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData(supplier);
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingSupplier(null);
    setFormData({ code: '', name: '', contact: '', phone: '', address: '', status: 'active' });
    setShowModal(true);
  };

  return (
    <div>
      <div className="page-header">
        <h1>供应商管理</h1>
        <button className="btn btn-primary" onClick={openCreate}>新增供应商</button>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>编码</th>
            <th>名称</th>
            <th>联系人</th>
            <th>电话</th>
            <th>地址</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map(s => (
            <tr key={s.id}>
              <td>{s.code}</td>
              <td>{s.name}</td>
              <td>{s.contact}</td>
              <td>{s.phone}</td>
              <td>{s.address}</td>
              <td>
                <span className={`badge ${s.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                  {s.status === 'active' ? '启用' : '停用'}
                </span>
              </td>
              <td>
                <button className="btn btn-sm btn-primary" onClick={() => openEdit(s)}>编辑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSupplier ? '编辑供应商' : '新增供应商'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>供应商编码</label>
                  <input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>供应商名称</label>
                  <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>联系人</label>
                  <input value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>电话</label>
                  <input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>地址</label>
                <input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="form-group">
                <label>状态</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option value="active">启用</option>
                  <option value="inactive">停用</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">保存</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
