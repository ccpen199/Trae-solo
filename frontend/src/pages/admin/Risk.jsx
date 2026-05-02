import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import Layout from '../../components/Layout';

const AdminRisk = () => {
  const [riskSummary, setRiskSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterLevel, setFilterLevel] = useState('all');

  useEffect(() => {
    fetchRiskSummary();
  }, []);

  const fetchRiskSummary = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getRiskSummary();
      if (response.data.success) {
        setRiskSummary(response.data.data);
      }
    } catch (err) {
      console.error('获取风险汇总失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelBadge = (level) => {
    const styles = {
      low: { bg: '#e8f5e9', color: '#2e7d32', text: '低风险' },
      medium: { bg: '#fff3e0', color: '#ef6c00', text: '中风险' },
      high: { bg: '#ffe0b2', color: '#e65100', text: '高风险' },
      critical: { bg: '#ffebee', color: '#c62828', text: '严重' }
    };
    const style = styles[level] || styles.low;
    return (
      <span style={{
        padding: '4px 12px',
        background: style.bg,
        color: style.color,
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        {style.text}
      </span>
    );
  };

  const getRiskScoreColor = (score) => {
    if (score >= 80) return '#c62828';
    if (score >= 50) return '#ef6c00';
    if (score >= 30) return '#ff9800';
    return '#4caf50';
  };

  return (
    <Layout title="风险监控" showAdminMenu={true}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>今日风险数</p>
            <h2 style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#ff9800' }}>
              {riskSummary?.todayCount || 0}
            </h2>
          </div>

          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>严重风险</p>
            <h2 style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#c62828' }}>
              {riskSummary?.criticalCount || 0}
            </h2>
          </div>

          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>高风险</p>
            <h2 style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#ef6c00' }}>
              {riskSummary?.highCount || 0}
            </h2>
          </div>

          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>待处理</p>
            <h2 style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#ff9800' }}>
              {riskSummary?.pendingCount || 0}
            </h2>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 24px',
            background: '#f5f7fa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <h3 style={{ margin: '0', color: '#333', fontSize: '16px' }}>📋 风险检测记录</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { value: 'all', label: '全部' },
                { value: 'critical', label: '严重' },
                { value: 'high', label: '高风险' },
                { value: 'medium', label: '中风险' },
                { value: 'low', label: '低风险' }
              ].map(item => (
                <button
                  key={item.value}
                  onClick={() => setFilterLevel(item.value)}
                  style={{
                    padding: '6px 14px',
                    background: filterLevel === item.value ? '#667eea' : '#fff',
                    color: filterLevel === item.value ? 'white' : '#333',
                    border: filterLevel === item.value ? 'none' : '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
              <span style={{ fontSize: '32px' }}>🔄</span>
              <p style={{ marginTop: '12px' }}>加载中...</p>
            </div>
          ) : !riskSummary?.risks?.length ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
              <span style={{ fontSize: '48px' }}>✅</span>
              <p style={{ marginTop: '16px', fontSize: '16px' }}>暂无风险记录</p>
            </div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '80px 120px 1fr 100px 100px 120px',
                padding: '12px 24px',
                background: '#fafafa',
                fontWeight: '500',
                color: '#666',
                fontSize: '13px',
                borderBottom: '1px solid #e0e0e0'
              }}>
                <span>ID</span>
                <span>风险等级</span>
                <span>风险原因</span>
                <span>风险分数</span>
                <span>状态</span>
                <span>检测时间</span>
              </div>
              
              {riskSummary.risks
                .filter(r => filterLevel === 'all' || r.risk_level === filterLevel)
                .map((risk, index) => (
                <div key={risk.id || index} style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 120px 1fr 100px 100px 120px',
                  padding: '14px 24px',
                  alignItems: 'center',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <span style={{ color: '#666', fontSize: '13px' }}>
                    {risk.transaction_id?.substring(0, 8) || '-'}
                  </span>
                  <div>
                    {getRiskLevelBadge(risk.risk_level)}
                  </div>
                  <div>
                    <p style={{ margin: '0', color: '#333', fontSize: '14px' }}>
                      {risk.risk_reason || '-'}
                    </p>
                    {risk.details && (
                      <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: '12px' }}>
                        {typeof risk.details === 'string' ? risk.details : JSON.stringify(risk.details)}
                      </p>
                    )}
                  </div>
                  <div>
                    <span style={{
                      fontWeight: 'bold',
                      color: getRiskScoreColor(risk.risk_score),
                      fontSize: '16px'
                    }}>
                      {risk.risk_score || 0}
                    </span>
                    <span style={{ color: '#999', fontSize: '12px' }}>/100</span>
                  </div>
                  <span style={{
                    color: risk.status === 'pending' ? '#ff9800' : 
                           risk.status === 'resolved' ? '#4caf50' : 
                           risk.status === 'blocked' ? '#c62828' : '#666',
                    fontSize: '13px'
                  }}>
                    {risk.status === 'pending' ? '待处理' :
                     risk.status === 'resolved' ? '已处理' :
                     risk.status === 'blocked' ? '已拦截' : risk.status}
                  </span>
                  <span style={{ color: '#999', fontSize: '12px' }}>
                    {risk.created_at ? new Date(risk.created_at).toLocaleString() : '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {riskSummary?.amlAlerts?.length > 0 && (
          <div style={{
            marginTop: '24px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 24px',
              background: '#ffebee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #ef9a9a'
            }}>
              <h3 style={{ margin: '0', color: '#c62828', fontSize: '16px' }}>
                🚨 AML 反洗钱预警
              </h3>
              <span style={{
                padding: '4px 12px',
                background: '#c62828',
                color: 'white',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {riskSummary.amlAlerts.length} 条预警
              </span>
            </div>

            <div style={{ padding: '20px' }}>
              {riskSummary.amlAlerts.map((alert, index) => (
                <div key={index} style={{
                  padding: '16px',
                  background: '#fff5f5',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  border: '1px solid #ffcdd2'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ margin: '0 0 8px 0', color: '#c62828', fontWeight: '500' }}>
                        {alert.alert_type === 'large_transaction' ? '大额交易预警' :
                         alert.alert_type === 'structuring' ? '疑似分拆交易' :
                         alert.alert_type === 'suspicious_pattern' ? '异常交易模式' : alert.alert_type}
                      </p>
                      <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                        {alert.description}
                      </p>
                      {alert.involved_users && (
                        <p style={{ margin: '8px 0 0 0', color: '#999', fontSize: '12px' }}>
                          涉及用户: {alert.involved_users}
                        </p>
                      )}
                    </div>
                    <span style={{ color: '#999', fontSize: '12px' }}>
                      {alert.created_at ? new Date(alert.created_at).toLocaleString() : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminRisk;
