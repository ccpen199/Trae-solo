import React, { useState, useEffect } from 'react';
import { statsApi, orderApi } from '../api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        statsApi.get(),
        orderApi.getAll()
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.slice(0, 5));
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-pending',
      picking: 'badge-picking',
      picked: 'badge-picking',
      reviewing: 'badge-pending',
      delivering: 'badge-picking',
      out_for_delivery: 'badge-picking',
      completed: 'badge-success',
      delivery_failed: 'badge-danger',
      after_sale: 'badge-warning',
      closed: 'badge-info'
    };
    return badges[status] || 'badge-info';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: '待处理',
      picking: '拣货中',
      picked: '已拣货',
      reviewing: '复核中',
      delivering: '配送中',
      out_for_delivery: '配送中',
      completed: '已完成',
      delivery_failed: '配送失败',
      after_sale: '售后中',
      closed: '已关闭'
    };
    return texts[status] || status;
  };

  if (!stats) return <div>加载中...</div>;

  return (
    <div>
      <h1 className="page-title">运营看板</h1>
      
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="label">今日订单</div>
          <div className="value">{stats.today.today_orders || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">今日营收</div>
          <div className="value">¥{(stats.today.today_revenue || 0).toFixed(2)}</div>
        </div>
        <div className="stat-card warning">
          <div className="label">待处理订单</div>
          <div className="value">{stats.orders.pending_orders || 0}</div>
        </div>
        <div className="stat-card primary">
          <div className="label">拣货中</div>
          <div className="value">{stats.orders.picking_orders || 0}</div>
        </div>
        <div className="stat-card primary">
          <div className="label">配送中</div>
          <div className="value">{stats.orders.delivering_orders || 0}</div>
        </div>
        <div className="stat-card success">
          <div className="label">已完成</div>
          <div className="value">{stats.orders.completed_orders || 0}</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">总订单数</div>
          <div className="value">{stats.orders.total_orders || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">总营收</div>
          <div className="value">¥{(stats.orders.total_revenue || 0).toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="label">库存SKU数</div>
          <div className="value">{stats.inventory.total_items || 0}</div>
        </div>
        <div className="stat-card danger">
          <div className="label">异常库存</div>
          <div className="value">{stats.inventory.abnormal_items || 0}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>最近订单</h3>
        <table className="table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>客户</th>
              <th>金额</th>
              <th>状态</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map(order => (
              <tr key={order.id}>
                <td>{order.order_no}</td>
                <td>{order.customer_name}</td>
                <td>¥{order.total_amount.toFixed(2)}</td>
                <td><span className={`badge ${getStatusBadge(order.status)}`}>{getStatusText(order.status)}</span></td>
                <td>{new Date(order.created_at).toLocaleString('zh-CN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
