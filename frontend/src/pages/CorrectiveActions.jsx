import React, { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch } from '../api.js';

export default function CorrectiveActions() {
  const [actions, setActions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    alert_id: '',
    batch_id: '',
    violation_cause: '',
    isolation_details: '',
    treatment_measures: '',
    responsible_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const actionsData = await apiGet('/corrective-actions');
    const alertsData = await apiGet('/alerts');
    const usersData = await apiGet('/users');
    setActions(actionsData);
    setAlerts(alertsData.filter(a => a.status === 'pending'));
    setUsers(usersData);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await apiPost('/corrective-actions', form);
    setForm({ alert_id: '', batch_id: '', violation_cause: '', isolation_details: '', treatment_measures: '', responsible_id: '' });
    setShowForm(false);
    loadData();
  }

  function handleAlertChange(e) {
    const alertId = e.target.value;
    const alert = alerts.find(a => a.id == alertId);
    setForm({ ...form, alert_id: alertId, batch_id: alert?.batch_id || '' });
  }

  async function handleComplete(id) {
    const retest = prompt('请输入复检结果:');
    if (retest) {
      await apiPatch(`/corrective-actions/${id}`, { retest_result: retest, status: 'completed' });
      loadData();
    }
  }

  return (
    <div>
      <div className="header">
        <h1>纠偏行动管理</h1>
      </div>

      <div className="card">
        <div className="button-group" style={{ marginBottom: '15px' }}>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '取消' : '+ 创建纠偏行动'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
            <div className="form-row">
              <div className="form-group">
                <label>关联预警</label>
                <select required value={form.alert_id} onChange={handleAlertChange}>
                  <option value="">-- 选择预警 --</option>
                  {alerts.map(a => (
                    <option key={a.id} value={a.id}>{a.batch_no} - {a.message}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>责任人</label>
                <select required value={form.responsible_id} onChange={e => setForm({ ...form, responsible_id: e.target.value })}>
                  <option value="">-- 选择责任人 --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>超限原因分析</label>
              <textarea required rows="2" value={form.violation_cause} onChange={e => setForm({ ...form, violation_cause: e.target.value })} />
            </div>
            <div className="form-group">
              <label>隔离措施</label>
              <textarea rows="2" value={form.isolation_details} onChange={e => setForm({ ...form, isolation_details: e.target.value })} />
            </div>
            <div className="form-group">
              <label>处理措施</label>
              <textarea required rows="2" value={form.treatment_measures} onChange={e => setForm({ ...form, treatment_measures: e.target.value })} />
            </div>
            <div className="button-group">
              <button type="submit" className="btn btn-success">创建</button>
            </div>
          </form>
        )}

        <table>
          <thead>
            <tr>
              <th>创建时间</th>
              <th>批次</th>
              <th>预警信息</th>
              <th>原因分析</th>
              <th>处理措施</th>
              <th>责任人</th>
              <th>复检结果</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {actions.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center' }}>暂无纠偏行动</td></tr>
            ) : actions.map(a => (
              <tr key={a.id} style={a.status === 'pending' ? { background: '#fff3cd' } : {}}>
                <td>{a.created_at}</td>
                <td>{a.batch_no}</td>
                <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.alert_message}</td>
                <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.violation_cause}</td>
                <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.treatment_measures}</td>
                <td>{a.responsible_name}</td>
                <td>{a.retest_result || '-'}</td>
                <td>
                  <span className={`badge ${a.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>
                    {a.status === 'pending' ? '处理中' : '已完成'}
                  </span>
                </td>
                <td>
                  {a.status === 'pending' && (
                    <button className="btn btn-success btn-sm" onClick={() => handleComplete(a.id)}>
                      完成纠偏
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
