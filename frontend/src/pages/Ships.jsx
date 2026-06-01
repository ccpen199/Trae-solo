import React, { useState, useEffect } from 'react';
import { shipsAPI } from '../api';

const defaultShip = {
  name: '',
  voyage: '',
  eta: '',
  draft: '',
  cargo_type: '',
  agent: '',
  load_volume: '',
  unload_volume: '',
  priority: 1
};

export default function Ships() {
  const [ships, setShips] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingShip, setEditingShip] = useState(null);
  const [formData, setFormData] = useState(defaultShip);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadShips();
  }, []);

  async function loadShips() {
    const res = await shipsAPI.getAll();
    if (res.success) setShips(res.data);
  }

  function handleAdd() {
    setEditingShip(null);
    setFormData(defaultShip);
    setShowModal(true);
  }

  function handleEdit(ship) {
    setEditingShip(ship);
    setFormData({ ...ship });
    setShowModal(true);
  }

  async function handleDelete(id) {
    if (!confirm('确定删除此船舶？')) return;
    const res = await shipsAPI.delete(id);
    if (res.success) {
      setMessage({ type: 'success', text: '删除成功' });
      loadShips();
    } else {
      setMessage({ type: 'error', text: res.error || '删除失败' });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const data = {
      name: formData.name,
      voyage: formData.voyage,
      eta: formData.eta,
      draft: formData.draft ? parseFloat(formData.draft) : null,
      cargo_type: formData.cargo_type,
      agent: formData.agent,
      load_volume: formData.load_volume ? parseFloat(formData.load_volume) : null,
      unload_volume: formData.unload_volume ? parseFloat(formData.unload_volume) : null,
      priority: parseInt(formData.priority)
    };

    let res;
    if (editingShip) {
      res = await shipsAPI.update(editingShip.id, data);
    } else {
      res = await shipsAPI.create(data);
    }

    if (res.success) {
      setShowModal(false);
      setMessage({ type: 'success', text: editingShip ? '更新成功' : '创建成功' });
      loadShips();
    } else {
      setMessage({ type: 'error', text: res.error || '操作失败' });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div>
      <div className="page-header">
        <h1>船舶管理</h1>
        <button className="btn btn-primary" onClick={handleAdd}>
          + 新增船舶
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>船名</th>
              <th>航次</th>
              <th>预计到港</th>
              <th>吃水(m)</th>
              <th>货类</th>
              <th>代理</th>
              <th>资料状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {ships.map(ship => (
              <tr key={ship.id}>
                <td>{ship.name}</td>
                <td>{ship.voyage}</td>
                <td>{ship.eta ? new Date(ship.eta).toLocaleString() : '-'}</td>
                <td>{ship.draft || '-'}</td>
                <td>{ship.cargo_type || '-'}</td>
                <td>{ship.agent || '-'}</td>
                <td>
                  <span className={`badge ${ship.data_complete ? 'badge-success' : 'badge-warning'}`}>
                    {ship.data_complete ? '完整' : '不完整'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm btn-primary" onClick={() => handleEdit(ship)} style={{ marginRight: 8 }}>
                    编辑
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(ship.id)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingShip ? '编辑船舶' : '新增船舶'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>船名 *</label>
                  <input
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>航次 *</label>
                  <input
                    required
                    value={formData.voyage}
                    onChange={e => setFormData({ ...formData, voyage: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>预计到港时间</label>
                <input
                  type="datetime-local"
                  value={formData.eta ? formData.eta.slice(0, 16) : ''}
                  onChange={e => setFormData({ ...formData, eta: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>吃水(m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.draft}
                    onChange={e => setFormData({ ...formData, draft: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>优先级 (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>货类</label>
                  <input
                    value={formData.cargo_type}
                    onChange={e => setFormData({ ...formData, cargo_type: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>代理</label>
                  <input
                    value={formData.agent}
                    onChange={e => setFormData({ ...formData, agent: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>装载量(吨)</label>
                  <input
                    type="number"
                    value={formData.load_volume}
                    onChange={e => setFormData({ ...formData, load_volume: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>卸载量(吨)</label>
                  <input
                    type="number"
                    value={formData.unload_volume}
                    onChange={e => setFormData({ ...formData, unload_volume: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
