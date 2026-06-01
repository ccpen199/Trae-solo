import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReportSummary, getAppointments } from '../api.js';
import dayjs from 'dayjs';

const statusLabels = {
  pending: '待确认',
  confirmed: '已确认',
  checked_in: '已签到',
  in_service: '服务中',
  completed: '已完成',
  rescheduled: '已改约',
  cancelled: '已取消',
  no_show: '爽约',
  late: '迟到'
};

function Home() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const [summaryData, appointmentsData] = await Promise.all([
        getReportSummary({ start_date: today, end_date: today }).catch(() => ({})),
        getAppointments({ date: today }).catch(() => [])
      ]);
      setSummary(summaryData);
      setTodayAppointments(Array.isArray(appointmentsData) ? appointmentsData.slice(0, 5) : []);
    } catch (err) {
      console.error('加载数据失败', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <h1 className="page-title">工作台</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{summary?.today_appointments || 0}</div>
          <div className="stat-label">今日预约</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{summary?.checked_in_appointments || 0}</div>
          <div className="stat-label">已到店</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{summary?.completed_appointments || 0}</div>
          <div className="stat-label">已完成</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">¥{summary?.total_revenue || 0}</div>
          <div className="stat-label">今日营收</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">快捷操作</h2>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/booking')}>
            新建预约
          </button>
          <button className="btn btn-success" onClick={() => navigate('/appointments')}>
            预约管理
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/services')}>
            服务项目
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/reports')}>
            运营报表
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">今日预约</h2>
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/appointments')}>
            查看全部
          </button>
        </div>
        {todayAppointments.length === 0 ? (
          <div className="empty-state">暂无今日预约</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>时间</th>
                <th>顾客</th>
                <th>服务</th>
                <th>技师</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {todayAppointments.map(apt => (
                <tr key={apt.id}>
                  <td>{apt.start_time} - {apt.end_time}</td>
                  <td>{apt.customer_name}</td>
                  <td>{apt.service_name}</td>
                  <td>{apt.staff_name}</td>
                  <td><span className={`badge badge-${apt.status}`}>{statusLabels[apt.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Home;
