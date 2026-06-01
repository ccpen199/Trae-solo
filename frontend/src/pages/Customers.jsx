import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    gender: '',
    age: '',
    is_child: false,
    is_special: false,
    special_notes: '',
    frame_preference: '',
    health_tips: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadCustomers();
  }, [page]);

  const loadCustomers = async () => {
    const res = await api.get('/customers', { params: { page, keyword } });
    setCustomers(res.data.data);
    setTotal(res.data.total);
  };

  const handleSearch = () => {
    setPage(1);
    loadCustomers();
  };

  const handleEdit = (customer) => {
    setEditId(customer.id);
    setForm(customer);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('确定删除该客户吗？')) {
      await api.delete(`/customers/${id}`);
      loadCustomers();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(form.phone)) {
      alert('请输入正确的11位手机号码');
      return;
    }
    if (editId) {
      await api.put(`/customers/${editId}`, form);
    } else {
      await api.post('/customers', form);
    }
    setShowForm(false);
    setEditId(null);
    resetForm();
    loadCustomers();
  };

  const resetForm = () => {
    setForm({
      name: '',
      phone: '',
      gender: '',
      age: '',
      is_child: false,
      is_special: false,
      special_notes: '',
      frame_preference: '',
      health_tips: ''
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>客户管理</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + 新增客户
        </button>
      </div>

      <div className="card">
        <div className="search-bar">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>搜索</label>
            <input
              type="text"
              placeholder="输入姓名或手机号"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="btn btn-primary" onClick={handleSearch}>搜索</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>姓名</th>
              <th>手机号</th>
              <th>性别</th>
              <th>年龄</th>
              <th>标签</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id}>
                <td>
                  <a href="#" onClick={e => { e.preventDefault(); navigate(`/customers/${c.id}`); }} style={{ color: '#1890ff' }}>
                    {c.name}
                  </a>
                </td>
                <td>{c.phone}</td>
                <td>{c.gender || '-'}</td>
                <td>{c.age || '-'}</td>
                <td>
                  {Boolean(c.is_child) && <span className="badge badge-warning" style={{ marginRight: 4 }}>儿童</span>}
                  {Boolean(c.is_special) && <span className="badge badge-error">特殊</span>}
                  {!Boolean(c.is_child) && !Boolean(c.is_special) && <span className="text-muted">-</span>}
                </td>
                <td>{c.created_at?.split('T')[0]}</td>
                <td>
                  <button className="btn btn-sm btn-default" style={{ marginRight: 8 }} onClick={() => handleEdit(c)}>编辑</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <span>共 {total} 条</span>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>上一页</button>
          <span>第 {page} 页</span>
          <button onClick={() => setPage(p => p + 1)} disabled={customers.length < 20}>下一页</button>
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 600, maxHeight: '90vh', overflow: 'auto' }}>
            <div className="card-title">{editId ? '编辑客户' : '新增客户'}</div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>姓名 *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>手机号 *</label>
                  <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>性别</label>
                  <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                    <option value="">请选择</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>年龄</label>
                  <input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="checkbox-group">
                  <label>
                    <input type="checkbox" checked={Boolean(form.is_child)} onChange={e => setForm({ ...form, is_child: e.target.checked })} />
                    儿童客户
                  </label>
                  <label>
                    <input type="checkbox" checked={Boolean(form.is_special)} onChange={e => setForm({ ...form, is_special: e.target.checked })} />
                    特殊人群
                  </label>
                </div>
              </div>
              {Boolean(form.is_special) && (
                <div className="form-group">
                  <label>特殊说明</label>
                  <textarea value={form.special_notes} onChange={e => setForm({ ...form, special_notes: e.target.value })} />
                </div>
              )}
              <div className="form-group">
                <label>镜架偏好</label>
                <input value={form.frame_preference} onChange={e => setForm({ ...form, frame_preference: e.target.value })} />
              </div>
              <div className="form-group">
                <label>眼健康提示</label>
                <textarea value={form.health_tips} onChange={e => setForm({ ...form, health_tips: e.target.value })} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-default" onClick={() => { setShowForm(false); setEditId(null); resetForm(); }}>取消</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
