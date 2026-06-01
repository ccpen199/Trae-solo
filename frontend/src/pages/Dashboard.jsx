import React, { useState, useEffect } from 'react';
import api from '../api';

function Dashboard() {
  const [stats, setStats] = useState({
    activePatients: 0,
    activePrescriptions: 0,
    todayTrainingCount: 0,
    pendingPrescriptions: 0
  });
  const [painRecords, setPainRecords] = useState([]);
  const [absentRecords, setAbsentRecords] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, painRes, absentRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/reports/pain-abnormal'),
        api.get('/reports/absent')
      ]);
      setStats(statsRes.data);
      setPainRecords(painRes.data);
      setAbsentRecords(absentRes.data);
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  return (
    <div>
      <div className="header">
        <h2>仪表盘</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>在训患者</h3>
          <div className="value">{stats.activePatients}</div>
        </div>
        <div className="stat-card">
          <h3>执行中处方</h3>
          <div className="value">{stats.activePrescriptions}</div>
        </div>
        <div className="stat-card">
          <h3>今日训练人次</h3>
          <div className="value">{stats.todayTrainingCount}</div>
        </div>
        <div className="stat-card">
          <h3>待确认处方</h3>
          <div className="value" style={{ color: '#f39c12' }}>{stats.pendingPrescriptions}</div>
        </div>
      </div>

      <div className="card">
        <h3>疼痛异常记录 (疼痛评分 ≥ 7)</h3>
        <table>
          <thead>
            <tr>
              <th>患者</th>
              <th>训练日期</th>
              <th>疼痛评分</th>
              <th>完成状态</th>
            </tr>
          </thead>
          <tbody>
            {painRecords.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', color: '#7f8c8d' }}>暂无异常记录</td></tr>
            ) : (
              painRecords.map(record => (
                <tr key={record.id}>
                  <td>{record.patient_name}</td>
                  <td>{record.training_date}</td>
                  <td><span className="badge badge-warning">{record.pain_score} 分</span></td>
                  <td>{record.completion_status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>训练缺席记录</h3>
        <table>
          <thead>
            <tr>
              <th>患者</th>
              <th>训练日期</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {absentRecords.length === 0 ? (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: '#7f8c8d' }}>暂无缺席记录</td></tr>
            ) : (
              absentRecords.map(record => (
                <tr key={record.id}>
                  <td>{record.patient_name}</td>
                  <td>{record.training_date}</td>
                  <td>{record.therapist_notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
