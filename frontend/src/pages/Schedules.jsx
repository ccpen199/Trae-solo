import React, { useState, useEffect } from 'react';
import { schedulesAPI, shipsAPI, berthsAPI } from '../api';

export default function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [ships, setShips] = useState([]);
  const [berths, setBerths] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [validation, setValidation] = useState({ valid: true, conflicts: [] });
  const [formData, setFormData] = useState({
    ship_id: '',
    berth_id: '',
    start_time: '',
    end_time: '',
    status: 'confirmed'
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [schedRes, shipsRes, berthsRes] = await Promise.all([
      schedulesAPI.getAll(),
      shipsAPI.getAll(),
      berthsAPI.getAll()
    ]);

    if (schedRes.success) setSchedules(schedRes.data);
    if (shipsRes.success) setShips(shipsRes.data);
    if (berthsRes.success) setBerths(berthsRes.data);
  }

  useEffect(() => {
    if (formData.ship_id && formData.berth_id && formData.start_time && formData.end_time) {
      validateSchedule();
    }
  }, [formData.ship_id, formData.berth_id, formData.start_time, formData.end_time]);

  async function validateSchedule() {
    const res = await schedulesAPI.validate({
      ...formData,
      exclude_schedule_id: editingSchedule?.id
    });
    if (res.success) {
      setValidation({ valid: res.valid, conflicts: res.conflicts || [] });
    }
  }

  function handleAdd() {
    setEditingSchedule(null);
    setFormData({
      ship_id: '',
      berth_id: '',
      start_time: '',
      end_time: '',
      status: 'confirmed'
    });
    setValidation({ valid: true, conflicts: [] });
    setShowModal(true);
  }

  function handleEdit(schedule) {
    setEditingSchedule(schedule);
    setFormData({
      ship_id: schedule.ship_id,
      berth_id: schedule.berth_id || '',
      start_time: schedule.start_time ? schedule.start_time.slice(0, 16) : '',
      end_time: schedule.end_time ? schedule.end_time.slice(0, 16) : '',
      status: schedule.status || 'confirmed'
    });
    setValidation({ valid: true, conflicts: [] });
    setShowModal(true);
  }

  async function handleDelete(id) {
    if (!confirm('确定删除此排程？')) return;
    const res = await schedulesAPI.delete(id);
    if (res.success) {
      setMessage({ type: 'success', text: '删除成功' });
      loadData();
    } else {
      setMessage({ type: 'error', text: res.error || '删除失败' });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validation.valid) {
      setMessage({ type: 'error', text: '存在冲突，无法保存排程' });
      return;
    }

    let res;
    if (editingSchedule) {
      res = await schedulesAPI.update(editingSchedule.id, {
        ...formData,
        adjustment_reason: '手动调整'
      });
    } else {
      res = await schedulesAPI.create(formData);
    }

    if (res.success) {
      setShowModal(false);
      setMessage({ type: 'success', text: editingSchedule ? '更新成功' : '创建成功' });
      loadData();
    } else {
      setMessage({ type: 'error', text: res.error || '操作失败' });
    }
    setTimeout(() => setMessage(null), 3000);
  }

  const availableShips = ships.filter(s => s.data_complete);

  return (
    <div>
      <div className="page-header">
        <h1>泊位排程</h1>
        <button className="btn btn-primary" onClick={handleAdd}>
          + 新增排程
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>船舶</th>
              <th>航次</th>
              <th>泊位</th>
              <th>开始时间</th>
              <th>结束时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map(sched => (
              <tr key={sched.id}>
                <td>{sched.ship_name}</td>
                <td>{sched.voyage}</td>
                <td>{sched.berth_name || '-'}</td>
                <td>{sched.start_time ? new Date(sched.start_time).toLocaleString() : '-'}</td>
                <td>{sched.end_time ? new Date(sched.end_time).toLocaleString() : '-'}</td>
                <td>
                  <span className={`badge ${
                    sched.status === 'confirmed' ? 'badge-success' :
                    sched.status === 'delayed' ? 'badge-warning' : 'badge-info'
                  }`}>
                    {sched.status === 'confirmed' ? '已确认' :
                     sched.status === 'delayed' ? '已延误' : sched.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm btn-primary" onClick={() => handleEdit(sched)} style={{ marginRight: 8 }}>
                    编辑
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(sched.id)}>
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
              <h2>{editingSchedule ? '编辑排程' : '新增排程'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            {validation.conflicts.length > 0 && (
              <div className="alert alert-error">
                {validation.conflicts.map((c, i) => (
                  <div key={i}>• {c}</div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>选择船舶 *</label>
                <select
                  required
                  value={formData.ship_id}
                  onChange={e => setFormData({ ...formData, ship_id: e.target.value })}
                  disabled={!!editingSchedule}
                >
                  <option value="">请选择船舶</option>
                  {availableShips.map(ship => (
                    <option key={ship.id} value={ship.id}>
                      {ship.name} ({ship.voyage})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>选择泊位 *</label>
                <select
                  required
                  value={formData.berth_id}
                  onChange={e => setFormData({ ...formData, berth_id: e.target.value })}
                >
                  <option value="">请选择泊位</option>
                  {berths.map(berth => (
                    <option key={berth.id} value={berth.id}>
                      {berth.name} (吃水限制: {berth.draft_limit}m)
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

              {editingSchedule && (
                <div className="form-group">
                  <label>状态</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="confirmed">已确认</option>
                    <option value="delayed">已延误</option>
                    <option value="completed">已完成</option>
                  </select>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>取消</button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!validation.valid}
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
