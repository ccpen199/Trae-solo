import React, { useState, useEffect } from 'react';
import { materials } from '../api';

export default function Materials() {
  const [list, setList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    category: '',
    unit: '',
    spec: '',
    description: '',
    status: 'active'
  });

  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    try {
      const res = await materials.getAll();
      setList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await materials.create(form);
      setShowModal(false);
      loadList();
      setForm({ name: '', code: '', category: '', unit: '', spec: '', description: '', status: 'active' });
    } catch (err) {
      alert('创建失败');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>原料管理</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 新增原料
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>原料编码</th>
              <th>原料名称</th>
              <th>分类</th>
              <th>规格</th>
              <th>单位</th>
              <th>状态</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {list.map(m => (
              <tr key={m.id}>
                <td>{m.code}</td>
                <td>{m.name}</td>
                <td>{m.category || '-'}</td>
                <td>{m.spec || '-'}</td>
                <td>{m.unit}</td>
                <td>
                  <span className={`badge ${m.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {m.status === 'active' ? '启用' : '停用'}
                  </span>
                </td>
                <td>{m.created_at?.slice(0, 10)}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan="7" className="empty-state">暂无原料数据</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新增原料</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>原料名称</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>原料编码</label>
                  <input required value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>分类</label>
                  <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>单位</label>
                  <input required value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} placeholder="如: kg, g, 个, L" />
                </div>
              </div>
              <div className="form-group">
                <label>规格</label>
                <input value={form.spec} onChange={e => setForm({...form, spec: e.target.value})} />
              </div>
              <div className="form-group">
                <label>描述</label>
                <textarea rows="2" value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
