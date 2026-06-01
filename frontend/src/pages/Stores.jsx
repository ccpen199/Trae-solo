import React, { useState, useEffect } from 'react';
import { storesAPI } from '../api.js';

function Stores() {
  const [stores, setStores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formData, setFormData] = useState({ name: '', address: '', phone: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await storesAPI.getAll();
    setStores(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStore) {
        await storesAPI.update(editingStore.id, formData);
      } else {
        await storesAPI.create(formData);
      }
      setShowModal(false);
      setEditingStore(null);
      resetForm();
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleEdit = (store) => {
    setEditingStore(store);
    setFormData({ name: store.name, address: store.address, phone: store.phone });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('确定要删除这个门店吗？关联车辆的门店归属将被解除。')) {
      try {
        await storesAPI.delete(id);
        loadData();
      } catch (err) {
        alert('删除失败');
      }
    }
  };

  const resetForm = () => setFormData({ name: '', address: '', phone: '' });

  return (
    <div>
      <div className="page-header">
        <h1>门店管理</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setEditingStore(null); setShowModal(true); }}>
          + 添加门店
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>门店名称</th>
                <th>地址</th>
                <th>电话</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {stores.map(s => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.address}</td>
                  <td>{s.phone}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-sm btn-primary" onClick={() => handleEdit(s)}>编辑</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingStore ? '编辑门店' : '添加门店'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>门店名称 *</label>
                  <input type="text" required value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>地址</label>
                  <input type="text" value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>电话</label>
                  <input type="text" value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                  <button type="submit" className="btn btn-primary">保存</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Stores;
