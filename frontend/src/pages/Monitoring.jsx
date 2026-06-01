import React, { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api.js';

export default function Monitoring() {
  const [records, setRecords] = useState([]);
  const [batches, setBatches] = useState([]);
  const [ccps, setCcps] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [form, setForm] = useState({
    batch_id: '',
    ccp_id: '',
    process_id: '',
    equipment: '',
    operator_id: '',
    temperature: '',
    time_value: '',
    metal_detected: false,
    cleanliness: '合格',
    other_data: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const recordsData = await apiGet('/monitoring-records');
    const batchesData = await apiGet('/batches');
    const ccpsData = await apiGet('/ccps');
    const usersData = await apiGet('/users');
    setRecords(recordsData);
    setBatches(batchesData.filter(b => b.status === 'in_progress'));
    setCcps(ccpsData);
    setUsers(usersData);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await apiPost('/monitoring-records', form);
    if (result.is_violation) {
      alert('警告：监测数据超限！已生成预警！');
    }
    setForm({
      batch_id: selectedBatch,
      ccp_id: '',
      process_id: '',
      equipment: '',
      operator_id: '',
      temperature: '',
      time_value: '',
      metal_detected: false,
      cleanliness: '合格',
      other_data: '',
      notes: ''
    });
    setShowForm(false);
    loadData();
  }

  function handleBatchChange(e) {
    const batchId = e.target.value;
    setSelectedBatch(batchId);
    setForm({ ...form, batch_id: batchId });
  }

  function handleCcpChange(e) {
    const ccpId = e.target.value;
    const ccp = ccps.find(c => c.id == ccpId);
    setForm({ ...form, ccp_id: ccpId, process_id: ccp?.process_id || '' });
  }

  return (
    <div>
      <div className="header">
        <h1>监测记录</h1>
      </div>

      <div className="card">
        <div className="button-group" style={{ marginBottom: '15px' }}>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '取消' : '+ 录入记录'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
            <div className="form-row">
              <div className="form-group">
                <label>生产批次</label>
                <select required value={selectedBatch} onChange={handleBatchChange}>
                  <option value="">-- 选择批次 --</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.batch_no} - {b.product_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>关键控制点</label>
                <select required value={form.ccp_id} onChange={handleCcpChange}>
                  <option value="">-- 选择CCP --</option>
                  {ccps.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.process_name})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>操作人员</label>
                <select required value={form.operator_id} onChange={e => setForm({ ...form, operator_id: e.target.value })}>
                  <option value="">-- 选择人员 --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>设备</label>
                <input value={form.equipment} onChange={e => setForm({ ...form, equipment: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>温度 (℃)</label>
                <input type="number" step="0.1" value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })} />
              </div>
              <div className="form-group">
                <label>时间 (分钟)</label>
                <input type="number" value={form.time_value} onChange={e => setForm({ ...form, time_value: e.target.value })} />
              </div>
              <div className="form-group">
                <label>清洁度</label>
                <select value={form.cleanliness} onChange={e => setForm({ ...form, cleanliness: e.target.value })}>
                  <option value="合格">合格</option>
                  <option value="待改进">待改进</option>
                  <option value="不合格">不合格</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input type="checkbox" checked={form.metal_detected} onChange={e => setForm({ ...form, metal_detected: e.target.checked })} />
                  检测到金属
                </label>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>其他数据</label>
                <input value={form.other_data} onChange={e => setForm({ ...form, other_data: e.target.value })} />
              </div>
              <div className="form-group">
                <label>备注</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div className="button-group">
              <button type="submit" className="btn btn-success">提交记录</button>
            </div>
          </form>
        )}

        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>批次</th>
              <th>控制点</th>
              <th>工序</th>
              <th>操作员</th>
              <th>温度</th>
              <th>时间</th>
              <th>金检</th>
              <th>状态</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} style={r.is_violation ? { background: '#fff3cd' } : {}}>
                <td>{r.record_time}</td>
                <td>{r.batch_no}</td>
                <td>{r.ccp_name}</td>
                <td>{r.process_name}</td>
                <td>{r.operator_name}</td>
                <td>{r.temperature ? `${r.temperature}℃` : '-'}</td>
                <td>{r.time_value ? `${r.time_value}min` : '-'}</td>
                <td>{r.metal_detected ? <span className="badge badge-danger">检出</span> : <span className="badge badge-success">正常</span>}</td>
                <td>
                  {r.is_violation ? (
                    <span className="badge badge-danger">超限</span>
                  ) : (
                    <span className="badge badge-success">正常</span>
                  )}
                </td>
                <td>{r.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
