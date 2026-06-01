import React, { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch } from '../api.js';

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    batch_no: '',
    product_id: '',
    quantity: '',
    unit: '瓶',
    production_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const batchesData = await apiGet('/batches');
    const productsData = await apiGet('/products');
    setBatches(batchesData);
    setProducts(productsData);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await apiPost('/batches', form);
    setForm({ batch_no: '', product_id: '', quantity: '', unit: '瓶', production_date: new Date().toISOString().split('T')[0] });
    setShowForm(false);
    loadData();
  }

  async function updateStatus(id, status) {
    await apiPatch(`/batches/${id}`, { status });
    loadData();
  }

  function getStatusBadge(status) {
    const statusMap = {
      'in_progress': { class: 'badge-info', text: '生产中' },
      'completed': { class: 'badge-success', text: '已完成' },
      'isolated': { class: 'badge-warning', text: '已隔离' },
      'released': { class: 'badge-success', text: '已放行' },
      'rejected': { class: 'badge-danger', text: '已拒收' }
    };
    const s = statusMap[status] || { class: 'badge-info', text: status };
    return <span className={`badge ${s.class}`}>{s.text}</span>;
  }

  return (
    <div>
      <div className="header">
        <h1>批次管理</h1>
      </div>

      <div className="card">
        <div className="button-group" style={{ marginBottom: '15px' }}>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '取消' : '+ 创建批次'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
            <div className="form-row">
              <div className="form-group">
                <label>批次号</label>
                <input required value={form.batch_no} onChange={e => setForm({ ...form, batch_no: e.target.value })} placeholder="例如: B20260523001" />
              </div>
              <div className="form-group">
                <label>产品</label>
                <select required value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                  <option value="">-- 选择产品 --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>数量</label>
                <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div className="form-group">
                <label>单位</label>
                <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  <option value="瓶">瓶</option>
                  <option value="箱">箱</option>
                  <option value="kg">kg</option>
                  <option value="吨">吨</option>
                </select>
              </div>
              <div className="form-group">
                <label>生产日期</label>
                <input type="date" required value={form.production_date} onChange={e => setForm({ ...form, production_date: e.target.value })} />
              </div>
            </div>
            <div className="button-group">
              <button type="submit" className="btn btn-success">创建</button>
            </div>
          </form>
        )}

        <table>
          <thead>
            <tr>
              <th>批次号</th>
              <th>产品</th>
              <th>数量</th>
              <th>生产日期</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {batches.map(b => (
              <tr key={b.id}>
                <td><strong>{b.batch_no}</strong></td>
                <td>{b.product_name}</td>
                <td>{b.quantity} {b.unit}</td>
                <td>{b.production_date}</td>
                <td>{getStatusBadge(b.status)}</td>
                <td>
                  <div className="button-group">
                    {b.status === 'in_progress' && (
                      <>
                        <button className="btn btn-warning btn-sm" onClick={() => updateStatus(b.id, 'isolated')}>隔离</button>
                        <button className="btn btn-success btn-sm" onClick={() => updateStatus(b.id, 'completed')}>完成</button>
                      </>
                    )}
                    {b.status === 'isolated' && (
                      <>
                        <button className="btn btn-success btn-sm" onClick={() => updateStatus(b.id, 'released')}>放行</button>
                        <button className="btn btn-danger btn-sm" onClick={() => updateStatus(b.id, 'rejected')}>拒收</button>
                      </>
                    )}
                    {b.status === 'completed' && (
                      <button className="btn btn-success btn-sm" onClick={() => updateStatus(b.id, 'released')}>放行</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
