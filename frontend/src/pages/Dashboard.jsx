import React, { useState, useEffect } from 'react';
import { statsAPI, vehiclesAPI, ordersAPI } from '../api.js';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentVehicles, setRecentVehicles] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, vehiclesRes, ordersRes] = await Promise.all([
        statsAPI.get(),
        vehiclesAPI.getAll(),
        ordersAPI.getAll()
      ]);
      setStats(statsRes.data);
      setRecentVehicles(vehiclesRes.data.slice(0, 5));
      setRecentOrders(ordersRes.data.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      available: '可租',
      rented: '已租',
      maintenance: '维修中',
      confirmed: '已确认',
      picked_up: '已取车',
      returned: '已还车'
    };
    return labels[status] || status;
  };

  return (
    <div>
      <div className="page-header">
        <h1>仪表盘</h1>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>车辆总数</h3>
            <div className="value">{stats.vehicles.total}</div>
          </div>
          <div className="stat-card success">
            <h3>可租车辆</h3>
            <div className="value">{stats.vehicles.available}</div>
          </div>
          <div className="stat-card">
            <h3>出租中</h3>
            <div className="value">{stats.vehicles.rented}</div>
          </div>
          <div className="stat-card warning">
            <h3>维修中</h3>
            <div className="value">{stats.vehicles.maintenance}</div>
          </div>
          <div className="stat-card">
            <h3>订单总数</h3>
            <div className="value">{stats.orders.total}</div>
          </div>
          <div className="stat-card">
            <h3>进行中订单</h3>
            <div className="value">{stats.orders.confirmed + stats.orders.picked_up}</div>
          </div>
          <div className="stat-card danger">
            <h3>证件过期车辆</h3>
            <div className="value">{stats.expired_vehicles}</div>
          </div>
          <div className="stat-card success">
            <h3>累计收入</h3>
            <div className="value">¥{stats.revenue.total_revenue.toLocaleString()}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px', color: '#1e3a5f' }}>最近车辆</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>车牌</th>
                  <th>车型</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {recentVehicles.map(v => (
                  <tr key={v.id}>
                    <td>{v.plate_number}</td>
                    <td>{v.brand} {v.model}</td>
                    <td>
                      <span className={`status-badge status-${v.status}`}>
                        {getStatusLabel(v.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', color: '#1e3a5f' }}>最近订单</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>客户</th>
                  <th>金额</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id}>
                    <td>{o.order_no}</td>
                    <td>{o.customer_name}</td>
                    <td>¥{o.total_amount}</td>
                    <td>
                      <span className={`status-badge status-${o.status}`}>
                        {getStatusLabel(o.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
