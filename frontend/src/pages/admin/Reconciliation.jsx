import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import Layout from '../../components/Layout';

const AdminReconciliation = () => {
  const [reconciliationList, setReconciliationList] = useState([]);
  const [adjustmentPool, setAdjustmentPool] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reconLoading, setReconLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reconRes, adjustRes] = await Promise.all([
        adminAPI.getReconciliationList(30),
        adminAPI.getAdjustmentPool()
      ]);

      if (reconRes.data.success) setReconciliationList(reconRes.data.data);
      if (adjustRes.data.success) setAdjustmentPool(adjustRes.data.data);
    } catch (err) {
      console.error('获取对账数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeReconciliation = async () => {
    try {
      setReconLoading(true);
      setError('');
      setSuccess('');
      
      const response = await adminAPI.executeReconciliation(selectedDate);
      
      if (response.data.success) {
        setSuccess(`对账执行成功！共 ${response.data.data.total || 0} 笔交易`);
        fetchData();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(response.data.error || '对账执行失败');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || '对账执行失败');
    } finally {
      setReconLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      success: { bg: '#e8f5e9', color: '#2e7d32', text: '对账成功' },
      failed: { bg: '#ffebee', color: '#c62828', text: '对账失败' },
      pending: { bg: '#fff3e0', color: '#ef6c00', text: '待对账' },
      partial: { bg: '#fff8e1', color: '#f57f17', text: '部分匹配' }
    };
    const style = styles[status] || styles.pending;
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

  const handleAdjustment = async (adjustmentId, action) => {
    try {
      const response = await adminAPI.handleAdjustment({
        adjustmentId,
        action
      });
      if (response.data.success) {
        setSuccess(`调账处理成功`);
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || '处理失败');
    }
  };

  return (
    <Layout title="财务对账" showAdminMenu={true}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {success && (
          <div style={{
            background: '#e8f5e9',
            color: '#2e7d32',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            ✅ {success}
          </div>
        )}

        {error && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            ⚠️ {error}
          </div>
        )}

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
            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>待对账日期</p>
            <h2 style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#ff9800' }}>
              {reconciliationList.filter(r => r.status === 'pending').length || 0}
            </h2>
          </div>

          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>对账成功</p>
            <h2 style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#4caf50' }}>
              {reconciliationList.filter(r => r.status === 'success').length || 0}
            </h2>
          </div>

          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>对账失败</p>
            <h2 style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#ef5350' }}>
              {reconciliationList.filter(r => r.status === 'failed' || r.status === 'partial').length || 0}
            </h2>
          </div>

          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>待调账</p>
            <h2 style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#e91e63' }}>
              {adjustmentPool.length || 0}
            </h2>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: '24px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px' }}>📅 执行日结对账</h3>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '14px' }}>
                选择日期
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ marginTop: '24px' }}>
              <button
                onClick={executeReconciliation}
                disabled={reconLoading}
                style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: reconLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: reconLoading ? 0.7 : 1
                }}
              >
                {reconLoading ? '对账中...' : '执行对账'}
              </button>
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          marginBottom: '24px'
        }}>
          <div style={{
            padding: '16px 24px',
            background: '#f5f7fa',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <h3 style={{ margin: '0', color: '#333', fontSize: '16px' }}>📋 对账历史记录</h3>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
              <span style={{ fontSize: '32px' }}>🔄</span>
              <p style={{ marginTop: '12px' }}>加载中...</p>
            </div>
          ) : reconciliationList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
              <span style={{ fontSize: '48px' }}>📭</span>
              <p style={{ marginTop: '16px', fontSize: '16px' }}>暂无对账记录</p>
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '120px 100px 100px 100px 100px 120px',
                padding: '12px 24px',
                background: '#fafafa',
                fontWeight: '500',
                color: '#666',
                fontSize: '13px',
                borderBottom: '1px solid #e0e0e0'
              }}>
                <span>日期</span>
                <span>总笔数</span>
                <span>匹配</span>
                <span>不匹配</span>
                <span>状态</span>
                <span>对账时间</span>
              </div>
              
              {reconciliationList.map((item, index) => (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 100px 100px 100px 100px 120px',
                  padding: '14px 24px',
                  alignItems: 'center',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <span style={{ color: '#333', fontSize: '14px' }}>{item.date || '-'}</span>
                  <span style={{ color: '#666', fontSize: '14px' }}>{item.total_count || 0}</span>
                  <span style={{ color: '#4caf50', fontSize: '14px' }}>{item.matched_count || 0}</span>
                  <span style={{ color: '#ef5350', fontSize: '14px' }}>{item.unmatched_count || 0}</span>
                  <div>{getStatusBadge(item.status)}</div>
                  <span style={{ color: '#999', fontSize: '12px' }}>
                    {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 24px',
            background: '#fff3e0',
            borderBottom: '1px solid #ffe0b2'
          }}>
            <h3 style={{ margin: '0', color: '#ef6c00', fontSize: '16px' }}>
              🐟 调账池 (异常项)
            </h3>
          </div>

          {adjustmentPool.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
              <span style={{ fontSize: '48px' }}>✅</span>
              <p style={{ marginTop: '16px', fontSize: '16px' }}>调账池为空</p>
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {adjustmentPool.map((item, index) => (
                <div key={index} style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ margin: '0 0 8px 0', color: '#333', fontWeight: '500' }}>
                        {item.transaction_no || item.id}
                      </p>
                      <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '14px' }}>
                        异常类型: {item.error_type || '未知'}
                      </p>
                      <p style={{ margin: '0', color: '#999', fontSize: '13px' }}>
                        描述: {item.description || '-'}
                      </p>
                      {item.amount && (
                        <p style={{ margin: '4px 0 0 0', color: '#ef5350', fontSize: '14px', fontWeight: '500' }}>
                          金额: ¥ {item.amount.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleAdjustment(item.id, 'resolve')}
                        style={{
                          padding: '6px 14px',
                          background: '#e8f5e9',
                          color: '#2e7d32',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        标记解决
                      </button>
                      <button
                        onClick={() => handleAdjustment(item.id, 'escalate')}
                        style={{
                          padding: '6px 14px',
                          background: '#ffebee',
                          color: '#c62828',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        升级处理
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminReconciliation;
