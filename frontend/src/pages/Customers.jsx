import React, { useState, useEffect } from 'react';
import { customers } from '../api';

function Customers() {
  const [customerList, setCustomerList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await customers.getAll();
      setCustomerList(res.data);
    } catch (error) {
      console.error('加载客户失败:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await customers.create(formData);
      setShowModal(false);
      loadCustomers();
      setFormData({ name: '', contact: '', phone: '', address: '' });
    } catch (error) {
      alert('创建客户失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (confirm('确定要删除该客户吗？')) {
      try {
        await customers.delete(id);
        loadCustomers();
      } catch (error) {
        alert('删除失败: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '1.5rem' }}>
        <h2>🏢 客户管理</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 添加客户
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>公司名称</th>
              <th>联系人</th>
              <th>联系电话</th>
              <th>地址</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {customerList.map(customer => (
              <tr key={customer.id}>
                <td><strong>{customer.name}</strong></td>
                <td>{customer.contact || '-'}</td>
                <td>{customer.phone || '-'}</td>
                <td>{customer.address || '-'}</td>
                <td>{new Date(customer.created_at).toLocaleString('zh-CN')}</td>
                <td>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(customer.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customerList.length === 0 && <div className="empty-state">暂无客户数据</div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>添加客户</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>公司名称</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>联系人</label>
                <input type="text" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
              </div>
              <div className="form-group">
                <label>联系电话</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>地址</label>
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">添加客户</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
