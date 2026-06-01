import React, { useState, useEffect } from 'react';
import { resourcesAPI, schedulesAPI } from '../api';

export default function Resources() {
  const [activeTab, setActiveTab] = useState('crane');
  const [resources, setResources] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    schedule_id: '',
    resource_id: '',
    start_time: '',
    end_time: ''
  });
  const [message, setMessage] = useState(null);

  const resourceTypes = [
    { id: 'crane', name: '桥吊' },
    { id: 'gang', name: '工班' },
    { id: 'yard', name: '堆场' },
    { id: 'truck', name: '拖车' }
  ];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    const [resRes, assignRes, schedRes] = await Promise.all([
      resourcesAPI.getAll(activeTab),
      resourcesAPI.getAssignments(),
      schedulesAPI.getAll()
    ]);

    if (resRes.success) setResources(resRes.data);
    if (assignRes.success) setAssignments(assignRes.data);
    if (schedRes.success) setSchedules(schedRes.data);
  }

  function handleAssign() {
    setFormData({
      schedule_id: '',
      resource_id: '',
      start_time: '',
      end_time: ''
    });
    setShowModal(true);
  }

  async function handleDeleteAssignment(id) {
    if (!confirm('确定取消此资源分配？')) return;
    const res = await resourcesAPI.deleteAssignment(id);
    if (res.success) {
      setMessage({ type: 'success', text: '取消成功' });
      loadData();
    } else {
      setMessage({ type: 'error', text: res.error || '操作失败' });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await resourcesAPI.assign(formData);
    if (res.success) {
      setShowModal(false);
      setMessage({ type: 'success', text: '分配成功' });
      loadData();
    } else {
      setMessage({ type: 'error', text: res.error || '操作失败' });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  const currentAssignments = assignments.filter(a => 
    activeTab === 'all' || a.resource_type === activeTab
  );

  return (
    <div>
      <div className="page-header">
        <h1>资源分配</h1>
        <button className="btn btn-primary" onClick={handleAssign}>
          + 分配资源
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="tabs">
        {resourceTypes.map(type => (
          <div
            key={type.id}
            className={`tab ${activeTab === type.id ? 'active' : ''}`}
            onClick={() => setActiveTab(type.id)}
          >
            {type.name}
          </div>
        ))}
      </div>

      <div className="card">
        <h3>资源列表</h3>
        <table className="table">
          <thead>
            <tr>
              <th>资源名称</th>
              <th>类型</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {resources.map(res => (
              <tr key={res.id}>
                <td>{res.name}</td>
                <td>{res.type}</td>
                <td>
                  <span className={`badge ${res.status === 'available' ? 'badge-success' : 'badge-warning'}`}>
                    {res.status === 'available' ? '可用' : res.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>已分配资源</h3>
        <table className="table">
          <thead>
            <tr>
              <th>船舶</th>
              <th>航次</th>
              <th>泊位</th>
              <th>资源</th>
              <th>类型</th>
              <th>开始时间</th>
              <th>结束时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {currentAssignments.map(assign => (
              <tr key={assign.id}>
                <td>{assign.ship_name}</td>
                <td>{assign.voyage}</td>
                <td>{assign.berth_name || '-'}</td>
                <td>{assign.resource_name}</td>
                <td>{assign.resource_type}</td>
                <td>{assign.start_time ? new Date(assign.start_time).toLocaleString() : '-'}</td>
                <td>{assign.end_time ? new Date(assign.end_time).toLocaleString() : '-'}</td>
                <td>
                  <button 
                    className="btn btn-sm btn-danger" 
                    onClick={() => handleDeleteAssignment(assign.id)}
                  >
                    取消
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
              <h2>分配资源</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>选择排程 *</label>
                <select
                  required
                  value={formData.schedule_id}
                  onChange={e => setFormData({ ...formData, schedule_id: e.target.value })}
                >
                  <option value="">请选择排程</option>
                  {schedules.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.ship_name} - {s.berth_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>选择资源 *</label>
                <select
                  required
                  value={formData.resource_id}
                  onChange={e => setFormData({ ...formData, resource_id: e.target.value })}
                >
                  <option value="">请选择资源</option>
                  {resources.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>开始时间 *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_time}
                    onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>结束时间 *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.end_time}
                    onChange={e => setFormData({ ...formData, end_time: e.target.value })}
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
