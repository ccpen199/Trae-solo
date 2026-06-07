import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('获取数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
        加载中...
      </div>
    );
  }

  const statCards = [
    { label: '今日订单', value: data?.today_orders?.count || 0, color: '#1677ff', icon: '📦' },
    { label: '今日营收', value: `¥${data?.today_orders?.revenue || 0}`, color: '#52c41a', icon: '💰' },
    { label: '在线司机', value: data?.driver_stats?.online_drivers || 0, color: '#fa8c16', icon: '🚚' },
    { label: '待处理投诉', value: data?.complaint_stats?.pending_complaints || 0, color: '#ff4d4f', icon: '⚠️' }
  ];

  const orderStats = data?.order_stats || {};

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <h2 style={{ marginBottom: '24px' }}>数据看板</h2>

      <div className="grid grid-4" style={{ marginBottom: '24px' }}>
        {statCards.map((card, i) => (
          <div key={i} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: card.color }}>
                  {card.value}
                </div>
                <div style={{ color: '#666', marginTop: '4px' }}>{card.label}</div>
              </div>
              <div style={{ fontSize: '32px' }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>订单统计</h3>
          <div className="grid grid-3" style={{ gap: '12px' }}>
            {[
              { label: '总订单', value: orderStats.total_orders, color: '#1677ff' },
              { label: '待接单', value: orderStats.pending_orders, color: '#fa8c16' },
              { label: '进行中', value: (orderStats.accepted_orders || 0) + (orderStats.picked_orders || 0), color: '#722ed1' },
              { label: '已送达', value: orderStats.delivered_orders, color: '#13c2c2' },
              { label: '已完成', value: orderStats.completed_orders, color: '#52c41a' },
              { label: '总营收', value: `¥${orderStats.total_revenue || 0}`, color: '#eb2f96' }
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: item.color }}>{item.value}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>司机统计</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {[
              { label: '认证司机总数', value: data?.driver_stats?.approved_drivers || 0 },
              { label: '待审核司机', value: data?.driver_stats?.pending_drivers || 0 },
              { label: '在线司机数', value: data?.driver_stats?.online_drivers || 0 },
              { label: '平均服务评分', value: data?.driver_stats?.avg_score?.toFixed(1) || 0 }
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#666' }}>{item.label}</span>
                <span style={{ fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>快捷入口</h3>
        <div className="grid grid-4">
          <Link to="/admin/quality" className="card" style={{ textAlign: 'center', background: '#f5f5f5', textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
            <div>质量监控中心</div>
          </Link>
          <Link to="/admin/capacity" className="card" style={{ textAlign: 'center', background: '#f5f5f5', textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗺️</div>
            <div>运力调度看板</div>
          </Link>
          <Link to="/admin/audit" className="card" style={{ textAlign: 'center', background: '#f5f5f5', textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
            <div>运费审计模块</div>
          </Link>
          <Link to="/admin/drivers" className="card" style={{ textAlign: 'center', background: '#f5f5f5', textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
            <div>司机管理</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
