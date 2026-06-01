import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recipes } from '../api';

export default function Recipes() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    version: '1.0',
    category: '',
    status: 'draft',
    type: 'formal',
    description: '',
    process_loss_rate: 0
  });

  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    try {
      const res = await recipes.getAll();
      setList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await recipes.create(form);
      setShowModal(false);
      loadList();
      setForm({ name: '', code: '', version: '1.0', category: '', status: 'draft', type: 'formal', description: '', process_loss_rate: 0 });
    } catch (err) {
      alert('创建失败');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      active: <span className="badge badge-success">已启用</span>,
      draft: <span className="badge badge-warning">草稿</span>,
      archived: <span className="badge badge-danger">已归档</span>
    };
    return map[status] || status;
  };

  const getTypeBadge = (type) => {
    return type === 'trial' 
      ? <span className="badge badge-info">试制</span>
      : <span className="badge badge-success">正式</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h2>配方库</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 新建配方
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>配方编号</th>
              <th>配方名称</th>
              <th>版本</th>
              <th>分类</th>
              <th>类型</th>
              <th>工艺损耗</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map(r => (
              <tr key={r.id}>
                <td>{r.code}</td>
                <td>{r.name}</td>
                <td>{r.version}</td>
                <td>{r.category || '-'}</td>
                <td>{getTypeBadge(r.type)}</td>
                <td>{r.process_loss_rate}%</td>
                <td>{getStatusBadge(r.status)}</td>
                <td>{r.created_at?.slice(0, 10)}</td>
                <td>
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => navigate(`/recipes/${r.id}`)}
                  >
                    详情
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan="9" className="empty-state">暂无配方数据</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新建配方</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>配方名称</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>配方编号</label>
                  <input required value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>版本</label>
                  <input value={form.version} onChange={e => setForm({...form, version: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>分类</label>
                  <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>类型</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="formal">正式配方</option>
                    <option value="trial">研发试制</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>工艺损耗率 (%)</label>
                  <input type="number" step="0.1" value={form.process_loss_rate} 
                    onChange={e => setForm({...form, process_loss_rate: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              <div className="form-group">
                <label>状态</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="draft">草稿</option>
                  <option value="active">已启用</option>
                </select>
              </div>
              <div className="form-group">
                <label>描述</label>
                <textarea rows="3" value={form.description} 
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
