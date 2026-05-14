import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { statisticsAPI } from '../../utils/api';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    statisticsAPI.getOverview()
      .then((res) => {
        if (res.success) {
          setStats(res.data);
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return (
      <div className="error-state">
        <p>加载失败: {error}</p>
        <button className="btn" onClick={() => window.location.reload()}>重试</button>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>数据概览</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.totals?.users || 0}</div>
          <div className="stat-label">总用户数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.totals?.coupons || 0}</div>
          <div className="stat-label">总优惠券数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.totals?.orders || 0}</div>
          <div className="stat-label">总订单数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.rates?.couponUsageRate || 0}%</div>
          <div className="stat-label">优惠券使用率</div>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3 style={{ marginBottom: '16px' }}>今日数据</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats?.today?.share_count || 0}</div>
            <div className="stat-label">分享次数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats?.today?.open_count || 0}</div>
            <div className="stat-label">打开次数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats?.today?.receive_count || 0}</div>
            <div className="stat-label">领取次数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats?.today?.new_user_count || 0}</div>
            <div className="stat-label">新用户数</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3 style={{ marginBottom: '16px' }}>本周数据</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats?.week?.share_count || 0}</div>
            <div className="stat-label">分享次数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats?.week?.receive_count || 0}</div>
            <div className="stat-label">领取次数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats?.week?.use_count || 0}</div>
            <div className="stat-label">使用次数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats?.rates?.shareRate || 0}%</div>
            <div className="stat-label">分享率</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3 style={{ marginBottom: '16px' }}>关键指标</h3>
        <div className="card">
          <table className="table">
            <tbody>
              <tr>
                <td>分享率</td>
                <td style={{ fontWeight: 'bold', color: '#1890ff' }}>{stats?.rates?.shareRate || 0}%</td>
              </tr>
              <tr>
                <td>优惠券使用率</td>
                <td style={{ fontWeight: 'bold', color: '#52c41a' }}>{stats?.rates?.couponUsageRate || 0}%</td>
              </tr>
              <tr>
                <td>订单转化率</td>
                <td style={{ fontWeight: 'bold', color: '#722ed1' }}>{stats?.rates?.conversionRate || 0}%</td>
              </tr>
              <tr>
                <td>已使用优惠券</td>
                <td>{stats?.usage?.used || 0} / {stats?.usage?.total || 0}</td>
              </tr>
              <tr>
                <td>总分享次数 / 领取次数</td>
                <td>{stats?.share?.total_shares || 0} / {stats?.share?.total_received || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
