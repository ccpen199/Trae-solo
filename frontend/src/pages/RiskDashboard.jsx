import React, { useEffect, useState } from 'react';
import { riskApi, orderApi } from '../api';
import dayjs from 'dayjs';

const RiskDashboard = () => {
  const [stats, setStats] = useState(null);
  const [interceptions, setInterceptions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, interceptionsRes, logsRes] = await Promise.all([
        riskApi.getStats(),
        riskApi.getInterceptions({ limit: 10 }),
        riskApi.getLogs({ limit: 20 })
      ]);

      setStats(statsRes.data);
      setInterceptions(interceptionsRes.data.interceptions);
      setLogs(logsRes.data.logs);
    } catch (err) {
      console.error('加载风控数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

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
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>今日风控检查</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            {stats?.todayStats?.reduce((sum, s) => sum + (s.count || 0), 0) || 0}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>风控通过</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            {stats?.totalChecks?.find(c => c.check_result === 'passed')?.count || 0}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>风控拦截</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
            {stats?.totalChecks?.find(c => c.check_result === 'failed')?.count || 0}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>拦截率</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
            {stats?.totalChecks && stats.totalChecks.length > 0
              ? (
                (stats.totalChecks.find(c => c.check_result === 'failed')?.count || 0) / 
                (stats.totalChecks.reduce((sum, c) => sum + (c.count || 0), 0) || 1) * 100
              ).toFixed(1)
              : '0.0'}%
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
            风控拦截记录
          </h3>
          
          {interceptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              暂无拦截记录
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {interceptions.map((item) => (
                <div key={item.id} style={{ 
                  padding: '14px', 
                  background: '#fef2f2', 
                  borderRadius: '6px',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600', color: '#dc2626' }}>
                      {item.check_type}
                    </span>
                    <span style={{ color: '#6b7280' }}>{formatTime(item.timestamp)}</span>
                  </div>
                  <div style={{ color: '#374151', marginBottom: '4px' }}>
                    <strong>{item.security_code}</strong> - {item.direction === 'buy' ? '买入' : '卖出'} 
                    {item.quantity}股 @ ¥{item.price?.toFixed(2)}
                  </div>
                  <div style={{ color: '#991b1b' }}>
                    原因: {item.check_message}
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                    用户: {item.user_name} ({item.username})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
            风控检查统计
          </h3>
          
          {stats?.failedReasons && stats.failedReasons.length > 0 ? (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                主要拦截原因
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stats.failedReasons.map((reason, idx) => {
                  const total = stats.failedReasons.reduce((sum, r) => sum + (r.count || 0), 0);
                  const percentage = total > 0 ? (reason.count / total * 100) : 0;
                  
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                        <span style={{ color: '#374151' }}>{reason.check_message}</span>
                        <span style={{ color: '#6b7280' }}>{reason.count}次 ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            background: '#ef4444',
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
            <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', marginBottom: '20px' }}>
              暂无统计数据
            </div>
          )}

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
              检查类型分布
            </h4>
            {stats?.todayStats && stats.todayStats.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stats.todayStats.map((stat, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: stat.check_result === 'passed' ? '#ecfdf5' : '#fef2f2',
                    borderRadius: '6px'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                        {stat.check_type}
                      </div>
                      <div style={{ fontSize: '12px', color: stat.check_result === 'passed' ? '#059669' : '#dc2626' }}>
                        {stat.check_result === 'passed' ? '通过' : '拦截'}
                      </div>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                      {stat.count}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                今日暂无检查记录
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

export default RiskDashboard;
