import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import Layout from '../../components/Layout';

const AdminAudit = () => {
  const [hashChainValid, setHashChainValid] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceTransactionId, setTraceTransactionId] = useState('');
  const [traceResult, setTraceResult] = useState(null);
  const [auditReport, setAuditReport] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const verifyHashChain = async () => {
    try {
      setVerifyLoading(true);
      setError('');
      const response = await adminAPI.verifyHashChain();
      if (response.data.success) {
        setHashChainValid(response.data.data.valid);
        if (response.data.data.valid) {
          setSuccess('哈希链验证通过！所有数据完整无篡改。');
          setTimeout(() => setSuccess(''), 5000);
        } else {
          setError('哈希链验证失败！数据可能被篡改。');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || '验证失败');
    } finally {
      setVerifyLoading(false);
    }
  };

  const traceTransaction = async () => {
    if (!traceTransactionId.trim()) {
      setError('请输入交易ID');
      return;
    }
    try {
      setTraceLoading(true);
      setError('');
      setTraceResult(null);
      const response = await adminAPI.traceTransaction(traceTransactionId.trim());
      if (response.data.success) {
        setTraceResult(response.data.data);
      } else {
        setError(response.data.error || '未找到该交易');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || '溯源失败');
    } finally {
      setTraceLoading(false);
    }
  };

  const fetchAuditReport = async () => {
    try {
      setError('');
      const response = await adminAPI.getAuditReport(startDate, endDate);
      if (response.data.success) {
        setAuditReport(response.data.data);
      }
    } catch (err) {
      console.error('获取审计报告失败:', err);
    }
  };

  return (
    <Layout title="审计溯源" showAdminMenu={true}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '18px' }}>
              🔗 哈希链完整性验证
            </h3>
            <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '14px' }}>
              验证整个哈希链的完整性，确保所有交易记录未被篡改。
            </p>
            
            {hashChainValid !== null && (
              <div style={{
                padding: '16px',
                background: hashChainValid ? '#e8f5e9' : '#ffebee',
                borderRadius: '8px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '32px' }}>
                  {hashChainValid ? '✅' : '❌'}
                </span>
                <p style={{
                  margin: '8px 0 0 0',
                  color: hashChainValid ? '#2e7d32' : '#c62828',
                  fontWeight: '500'
                }}>
                  {hashChainValid ? '哈希链完整，数据未被篡改' : '哈希链验证失败，数据可能被篡改'}
                </p>
              </div>
            )}

            <button
              onClick={verifyHashChain}
              disabled={verifyLoading}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: verifyLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: verifyLoading ? 0.7 : 1
              }}
            >
              {verifyLoading ? '验证中...' : '执行完整性验证'}
            </button>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '18px' }}>
              🔍 交易溯源
            </h3>
            <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px' }}>
              输入交易ID追踪资金路径和交易历史。
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                value={traceTransactionId}
                onChange={(e) => setTraceTransactionId(e.target.value)}
                placeholder="输入交易ID..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onKeyPress={(e) => e.key === 'Enter' && traceTransaction()}
              />
              <button
                onClick={traceTransaction}
                disabled={traceLoading}
                style={{
                  padding: '10px 20px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: traceLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: traceLoading ? 0.7 : 1
                }}
              >
                {traceLoading ? '查询中...' : '溯源'}
              </button>
            </div>

            {traceResult && (
              <div style={{
                padding: '16px',
                background: '#f5f7fa',
                borderRadius: '8px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {traceResult.found ? (
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#333', fontWeight: '500' }}>
                      ✅ 找到交易
                    </p>
                    <p style={{ margin: '4px 0', color: '#666', fontSize: '13px' }}>
                      交易号: {traceResult.transaction?.transaction_no}
                    </p>
                    <p style={{ margin: '4px 0', color: '#666', fontSize: '13px' }}>
                      金额: ¥ {traceResult.transaction?.amount?.toLocaleString()}
                    </p>
                    <p style={{ margin: '4px 0', color: '#666', fontSize: '13px' }}>
                      区块高度: {traceResult.blockHeight}
                    </p>
                    {traceResult.fundPath && traceResult.fundPath.length > 0 && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
                        <p style={{ margin: '0 0 8px 0', color: '#333', fontSize: '13px', fontWeight: '500' }}>
                          资金路径:
                        </p>
                        {traceResult.fundPath.map((path, idx) => (
                          <p key={idx} style={{ margin: '4px 0', color: '#666', fontSize: '12px' }}>
                            {idx + 1}. {path}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ margin: '0', color: '#999', textAlign: 'center' }}>
                    未找到该交易
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: '24px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px' }}>
            📊 审计报告
          </h3>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '14px' }}>
                开始日期
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: '10px 14px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '14px' }}>
                结束日期
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: '10px 14px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ marginTop: '24px' }}>
              <button
                onClick={fetchAuditReport}
                style={{
                  padding: '10px 20px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                生成报告
              </button>
            </div>
          </div>

          {auditReport && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div style={{
                padding: '16px',
                background: '#e3f2fd',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 8px 0', color: '#1565c0', fontSize: '14px' }}>总交易数</p>
                <h3 style={{ margin: '0', color: '#0d47a1', fontSize: '28px' }}>
                  {auditReport.totalTransactions || 0}
                </h3>
              </div>

              <div style={{
                padding: '16px',
                background: '#e8f5e9',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 8px 0', color: '#2e7d32', fontSize: '14px' }}>成功交易</p>
                <h3 style={{ margin: '0', color: '#1b5e20', fontSize: '28px' }}>
                  {auditReport.successfulTransactions || 0}
                </h3>
              </div>

              <div style={{
                padding: '16px',
                background: '#fff3e0',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 8px 0', color: '#ef6c00', fontSize: '14px' }}>风险交易</p>
                <h3 style={{ margin: '0', color: '#e65100', fontSize: '28px' }}>
                  {auditReport.riskTransactions || 0}
                </h3>
              </div>

              <div style={{
                padding: '16px',
                background: '#fce4ec',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 8px 0', color: '#c2185b', fontSize: '14px' }}>AML预警</p>
                <h3 style={{ margin: '0', color: '#880e4f', fontSize: '28px' }}>
                  {auditReport.amlAlerts || 0}
                </h3>
              </div>
            </div>
          )}
        </div>

        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px' }}>
            📜 系统特性说明
          </h3>
          
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{
              padding: '16px',
              background: '#f5f7fa',
              borderRadius: '8px'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '16px' }}>
                🔗 哈希链保护机制
              </h4>
              <p style={{ margin: '0', color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
                所有金额变动、转账历史、系统对账日志均通过 SHA256 哈希算法生成区块链结构。
                每个区块包含前区块哈希和默克尔根，确保数据不可篡改且可追溯。
              </p>
            </div>

            <div style={{
              padding: '16px',
              background: '#f5f7fa',
              borderRadius: '8px'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '16px' }}>
                🔍 全量支付审计
              </h4>
              <p style={{ margin: '0', color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
                支持通过交易ID进行完整溯源，包括交易详情、区块位置、资金路径等。
                可生成指定日期范围的审计报告，便于监管和合规检查。
              </p>
            </div>

            <div style={{
              padding: '16px',
              background: '#f5f7fa',
              borderRadius: '8px'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '16px' }}>
                💰 资金路径溯源
              </h4>
              <p style={{ margin: '0', color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
                对于转账类交易，可追踪资金从发起方到接收方的完整路径。
                支持多级溯源，适用于 AML 反洗钱监控和可疑交易调查。
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminAudit;
