import React, { useState, useEffect } from 'react';
import { customersAPI } from '../api.js';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', id_card: '', license_number: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const res = await customersAPI.getAll();
    setCustomers(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await customersAPI.update(editingCustomer.id, formData);
      } else {
        await customersAPI.create(formData);
      }
      setShowModal(false);
      setEditingCustomer(null);
      resetForm();
      loadData();
    } catch (err) {
      alert('操作失败');
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      id_card: customer.id_card || '',
      license_number: customer.license_number || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('确定要删除这个客户吗？')) {
      try {
        await customersAPI.delete(id);
        loadData();
      } catch (err) {
        alert('删除失败：该客户可能有关联订单');
      }
    }
  };

  const resetForm = () => setFormData({ name: '', phone: '', id_card: '', license_number: '' });

  return (
    <div>
      <div className="page-header">
        <h1>客户管理</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setEditingCustomer(null); setShowModal(true); }}>
          + 添加客户
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>姓名</th>
                <th>电话</th>
                <th>身份证号</th>
                <th>驾驶证号</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.id_card}</td>
                  <td>{c.license_number}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-sm btn-primary" onClick={() => handleEdit(c)}>编辑</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>删除</button>
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
              <h2>{editingCustomer ? '编辑客户' : '添加客户'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>姓名 *</label>
                  <input type="text" required value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>电话 *</label>
                  <input type="text" required value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>身份证号</label>
                  <input type="text" value={formData.id_card}
                    onChange={e => setFormData({...formData, id_card: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>驾驶证号</label>
                  <input type="text" value={formData.license_number}
                    onChange={e => setFormData({...formData, license_number: e.target.value})} />
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

export default Customers;
