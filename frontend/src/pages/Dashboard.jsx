import React, { useState, useEffect } from 'react';
import api from '../api';

function Dashboard({ user }) {
  const [stats, setStats] = useState({});
  const [selfCheck, setSelfCheck] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, activitiesRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent-activity')
      ]);
      setStats(statsRes.data || {});
      setActivities(Array.isArray(activitiesRes.data) ? activitiesRes.data : []);

      if (['admin', 'nurse'].includes(user.role)) {
        const selfCheckRes = await api.get('/dashboard/self-check');
        setSelfCheck(selfCheckRes.data);
      }
    } catch (err) {
      console.error('加载数据失败:', err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: '在院老人', value: stats.elderlyCount, icon: '👴', color: '#4caf50' },
    { label: '活跃照护计划', value: stats.activePlans, icon: '📋', color: '#2196f3' },
    { label: '今日护理记录', value: stats.todayRecords, icon: '✅', color: '#ff9800' },
    { label: '待处理事件', value: stats.pendingIncidents, icon: '⚠️', color: '#f44336' },
  ];

  if (loading) {
    return <div style={{ padding: '2rem' }}>加载中...</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>护理看板</h2>
        <p style={{ color: '#666', marginTop: '4px' }}>欢迎回来，{user.name}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {statCards.map((card, index) => (
          <div key={index} style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: card.color + '20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px'
            }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>{card.value || 0}</div>
              <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {selfCheck && (
        <div style={{
          background: selfCheck.allPassed ? '#e8f5e9' : '#fff3e0',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: `2px solid ${selfCheck.allPassed ? '#81c784' : '#ffb74d'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>{selfCheck.allPassed ? '✅' : '⚠️'}</span>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: selfCheck.allPassed ? '#2e7d32' : '#e65100' }}>
              系统自测 {selfCheck.allPassed ? '全部通过' : '存在待处理项'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            <div style={{ fontSize: '13px' }}>
              <span style={{ color: selfCheck.missedDoses > 0 ? '#f44336' : '#4caf50' }}>
                {selfCheck.missedDoses > 0 ? '●' : '✓'}
              </span>
              漏服药物: {selfCheck.missedDoses}项
            </div>
            <div style={{ fontSize: '13px' }}>
              <span style={{ color: selfCheck.timeoutTasks > 0 ? '#f44336' : '#4caf50' }}>
                {selfCheck.timeoutTasks > 0 ? '●' : '✓'}
              </span>
              超时任务: {selfCheck.timeoutTasks}项
            </div>
            <div style={{ fontSize: '13px' }}>
              <span style={{ color: selfCheck.arrears > 0 ? '#f44336' : '#4caf50' }}>
                {selfCheck.arrears > 0 ? '●' : '✓'}
              </span>
              费用欠费: {selfCheck.arrears}项
            </div>
            <div style={{ fontSize: '13px' }}>
              <span style={{ color: selfCheck.pendingIncidents > 0 ? '#f44336' : '#4caf50' }}>
                {selfCheck.pendingIncidents > 0 ? '●' : '✓'}
              </span>
              待处理事件: {selfCheck.pendingIncidents}项
            </div>
            <div style={{ fontSize: '13px' }}>
              <span style={{ color: selfCheck.lowStock > 0 ? '#f44336' : '#4caf50' }}>
                {selfCheck.lowStock > 0 ? '●' : '✓'}
              </span>
              库存预警: {selfCheck.lowStock}项
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#333' }}>最近活动</h3>
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            {activities.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无活动记录</div>
            ) : (
              activities.map((activity, index) => (
                <div key={index} style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: index < activities.length - 1 ? '1px solid #f0f0f0' : 'none'
                }}>
                  <span style={{ fontSize: '20px' }}>
                    {activity.type === 'care' ? '✅' : 
                     activity.type === 'medication' ? '💊' : '⚠️'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', color: '#333' }}>
                      <strong>{activity.elderly_name}</strong> - {activity.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                      {activity.description}
                    </div>
                    <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                      {new Date(activity.time).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
