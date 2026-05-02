import React, { useEffect, useState } from 'react';
import { marketApi, orderApi, auditApi } from '../api';
import dayjs from 'dayjs';

const AdminDashboard = () => {
  const [securities, setSecurities] = useState([]);
  const [auditStats, setAuditStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [securitiesRes, auditStatsRes, ordersRes] = await Promise.all([
        marketApi.getSecurities(),
        auditApi.getStats(),
        orderApi.getAllOrders({ limit: 20 })
      ]);

      setSecurities(securitiesRes.data);
      setAuditStats(auditStatsRes.data);
      setOrders(ordersRes.data.orders);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => (price ? price.toFixed(2) : '--');
  const formatTime = (timestamp) => dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>加载中...</div>
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>交易品种</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            {securities.length}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>今日操作记录</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
            {auditStats?.todayStats?.reduce((sum, s) => sum + (s.count || 0), 0) || 0}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>订单总数</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
            {orders.length}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>交易状态</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            正常
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
            行情监控
          </h3>
          
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>代码</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>名称</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>现价</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>涨跌</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>状态</th>
                </tr>
              </thead>
              <tbody>
                {securities.map((sec) => {
                  const change = sec.change || 0;
                  const changePercent = sec.changePercent || 0;
                  
                  return (
                    <tr key={sec.code}>
                      <td style={{ padding: '10px 8px', fontSize: '14px', fontWeight: '500' }}>{sec.code}</td>
                      <td style={{ padding: '10px 8px', fontSize: '14px' }}>{sec.name}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: '14px' }}>{formatPrice(sec.currentPrice)}</td>
                      <td style={{ 
                        padding: '10px 8px', 
                        textAlign: 'right', 
                        fontSize: '14px',
                        color: change >= 0 ? '#e74c3c' : '#27ae60'
                      }}>
                        {change >= 0 ? '+' : ''}{formatPrice(change)}
                        <span style={{ marginLeft: '4px' }}>
                          ({change >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#059669',
                          background: '#ecfdf5'
                        }}>
                          交易中
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
            系统操作统计
          </h3>
          
          {auditStats?.actionsStats && auditStats.actionsStats.length > 0 ? (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                操作类型分布
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {auditStats.actionsStats.slice(0, 10).map((stat, idx) => {
                  const total = auditStats.actionsStats.reduce((sum, s) => sum + (s.count || 0), 0);
                  const percentage = total > 0 ? (stat.count / total * 100) : 0;
                  
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                        <span style={{ color: '#374151' }}>{stat.action}</span>
                        <span style={{ color: '#6b7280' }}>{stat.count}次</span>
                      </div>
                      <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            background: '#3b82f6',
                            width: `${percentage}%`,
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', marginBottom: '24px' }}>
              暂无操作统计
            </div>
          )}

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
              活跃用户
            </h4>
            {auditStats?.userActivity && auditStats.userActivity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {auditStats.userActivity.map((user, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '50%', 
                        background: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        {user.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                          {user.username}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          最后活跃: {formatTime(user.last_active)}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6' }}>
                      {user.action_count} 次操作
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                暂无活跃用户数据
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const statCardStyle = {
  background: 'white',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

export default AdminDashboard;
