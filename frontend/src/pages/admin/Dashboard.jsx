import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api';
import Layout from '../../components/Layout';

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [transactionTrend, setTransactionTrend] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, statusRes, trendRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getSystemStatus(),
        adminAPI.getTransactionTrend(7)
      ]);

      if (dashboardRes.data.success) setDashboard(dashboardRes.data.data);
      if (statusRes.data.success) setSystemStatus(statusRes.data.data);
      if (trendRes.data.success) setTransactionTrend(trendRes.data.data);
    } catch (err) {
      console.error('获取管理仪表盘数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      healthy: { bg: '#e8f5e9', color: '#2e7d32', text: '正常' },
      warning: { bg: '#fff3e0', color: '#ef6c00', text: '警告' },
      critical: { bg: '#ffebee', color: '#c62828', text: '危险' }
    };
    const style = colors[status] || colors.healthy;
    return (
      <span style={{
        padding: '4px 12px',
        background: style.bg,
        color: style.color,
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '500'
      }}>
        {style.text}
      </span>
    );
  };

  if (loading && !dashboard) {
    return (
      <Layout title="管理仪表盘" showAdminMenu={true}>
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <span style={{ fontSize: '32px' }}>🔄</span>
          <p style={{ color: '#666', marginTop: '20px' }}>加载中...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="管理仪表盘" showAdminMenu={true}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '24px',
            borderRadius: '12px',
            color: 'white'
          }}>
            <p style={{ margin: '0 0 8px 0', opacity: 0.9, fontSize: '14px' }}>今日交易额</p>
            <h2 style={{ margin: '0', fontSize: '32px', fontWeight: 'bold' }}>
              ¥ {dashboard?.todayVolume?.toLocaleString() || 0}
            </h2>
            <p style={{ margin: '8px 0 0 0', opacity: 0.8, fontSize: '13px' }}>
              {dashboard?.todayTransactions || 0} 笔交易
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>活跃用户</p>
            <h2 style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#4caf50' }}>
              {dashboard?.activeUsers || 0}
            </h2>
            <p style={{ margin: '8px 0 0 0', color: '#999', fontSize: '13px' }}>
              总用户: {dashboard?.totalUsers || 0}
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>待处理风险</p>
            <h2 style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#ff9800' }}>
              {dashboard?.pendingRisks || 0}
            </h2>
            <p style={{ margin: '8px 0 0 0', color: '#999', fontSize: '13px' }}>
              今日风险: {dashboard?.todayRisks || 0}
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>调账池</p>
            <h2 style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color: '#ef5350' }}>
              {dashboard?.adjustmentPool || 0}
            </h2>
            <p style={{ margin: '8px 0 0 0', color: '#999', fontSize: '13px' }}>
              待对账: {dashboard?.pendingReconciliation || 0}
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '24px'
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0', color: '#333', fontSize: '18px' }}>📈 近7日交易趋势</h3>
            </div>
            
            {transactionTrend.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                暂无交易数据
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {transactionTrend.map((day, index) => (
                  <div key={index} style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr 120px',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <span style={{ color: '#666', fontSize: '14px' }}>{day.date}</span>
                    <div style={{
                      background: '#f5f7fa',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      height: '24px'
                    }}>
                      <div style={{
                        width: `${Math.min((day.transaction_count / (Math.max(...transactionTrend.map(d => d.transaction_count), 1))) * 100, 100)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #667eea, #764ba2)',
                        borderRadius: '4px',
                        minWidth: '4px'
                      }} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0', color: '#333', fontWeight: '500', fontSize: '14px' }}>
                        ¥ {day.total_amount?.toLocaleString()}
                      </p>
                      <p style={{ margin: '0', color: '#999', fontSize: '12px' }}>
                        {day.transaction_count} 笔
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px' }}>🖥️ 系统状态</h3>
            
            {systemStatus ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#f5f7fa',
                  borderRadius: '8px'
                }}>
                  <div>
                    <p style={{ margin: '0', color: '#333', fontWeight: '500' }}>账本引擎</p>
                    <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: '12px' }}>Ledger-Kernel</p>
                  </div>
                  {getStatusBadge(systemStatus.ledgerKernel)}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#f5f7fa',
                  borderRadius: '8px'
                }}>
                  <div>
                    <p style={{ margin: '0', color: '#333', fontWeight: '500' }}>反欺诈引擎</p>
                    <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: '12px' }}>Anti-Fraud</p>
                  </div>
                  {getStatusBadge(systemStatus.antiFraud)}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#f5f7fa',
                  borderRadius: '8px'
                }}>
                  <div>
                    <p style={{ margin: '0', color: '#333', fontWeight: '500' }}>AML监测引擎</p>
                    <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: '12px' }}>AML-Monitor</p>
                  </div>
                  {getStatusBadge(systemStatus.amlMonitor)}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#f5f7fa',
                  borderRadius: '8px'
                }}>
                  <div>
                    <p style={{ margin: '0', color: '#333', fontWeight: '500' }}>汇率引擎</p>
                    <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: '12px' }}>Currency-Convert</p>
                  </div>
                  {getStatusBadge(systemStatus.currencyConvert)}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#f5f7fa',
                  borderRadius: '8px'
                }}>
                  <div>
                    <p style={{ margin: '0', color: '#333', fontWeight: '500' }}>哈希链</p>
                    <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: '12px' }}>HashChain</p>
                  </div>
                  {getStatusBadge(systemStatus.hashChain)}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#f5f7fa',
                  borderRadius: '8px'
                }}>
                  <div>
                    <p style={{ margin: '0', color: '#333', fontWeight: '500' }}>数据库</p>
                    <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: '12px' }}>SQLite</p>
                  </div>
                  {getStatusBadge(systemStatus.database)}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                暂无系统状态数据
              </div>
            )}
          </div>
        </div>

        <div style={{
          marginTop: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          <div
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
            onClick={() => navigate('/admin/risk')}
          >
            <span style={{ fontSize: '36px' }}>⚠️</span>
            <div>
              <p style={{ margin: '0', color: '#333', fontWeight: '500' }}>风险监控</p>
              <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: '13px' }}>
                查看和处理风险交易
              </p>
            </div>
          </div>

          <div
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
            onClick={() => navigate('/admin/reconciliation')}
          >
            <span style={{ fontSize: '36px' }}>📑</span>
            <div>
              <p style={{ margin: '0', color: '#333', fontWeight: '500' }}>财务对账</p>
              <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: '13px' }}>
                执行日结对账和调账
              </p>
            </div>
          </div>

          <div
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
            onClick={() => navigate('/admin/audit')}
          >
            <span style={{ fontSize: '36px' }}>🔍</span>
            <div>
              <p style={{ margin: '0', color: '#333', fontWeight: '500' }}>审计溯源</p>
              <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: '13px' }}>
                哈希链验证和交易溯源
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
