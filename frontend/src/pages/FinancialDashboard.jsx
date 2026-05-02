import React, { useEffect, useState } from 'react';
import { settlementApi, fundsApi, positionApi } from '../api';
import dayjs from 'dayjs';

const FinancialDashboard = () => {
  const [reports, setReports] = useState([]);
  const [allFunds, setAllFunds] = useState([]);
  const [allPositions, setAllPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runSettlementLoading, setRunSettlementLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsRes, fundsRes, positionsRes] = await Promise.all([
        settlementApi.getReports({ limit: 10 }),
        fundsApi.getAllFunds({}),
        positionApi.getAllPositions({})
      ]);

      setReports(reportsRes.data.reports);
      setAllFunds(fundsRes.data);
      setAllPositions(positionsRes.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunSettlement = async () => {
    try {
      setRunSettlementLoading(true);
      const res = await settlementApi.runDaily();
      alert(`日终清算完成，生成 ${res.data.reportCount} 份报表`);
      loadData();
    } catch (err) {
      console.error('执行清算失败:', err);
      alert(err.response?.data?.error || '执行清算失败');
    } finally {
      setRunSettlementLoading(false);
    }
  };

  const formatPrice = (price) => (price !== null && price !== undefined ? price.toFixed(2) : '--');

  const totalBalance = allFunds.reduce((sum, f) => sum + (f.total_balance || 0), 0);
  const totalMarketValue = allPositions.reduce((sum, p) => sum + (p.market_value || 0), 0);
  const totalAssets = totalBalance + totalMarketValue;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>加载中...</div>
    );
  }

  return (
    <div>
      <div style={{ 
        background: 'white', 
        borderRadius: '8px', 
        padding: '16px 20px', 
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          <span style={{ marginRight: '16px' }}>💡 T+1 清算模式：当日交易，次日清算</span>
          <span>清算时间：每日收盘后 15:00</span>
        </div>
        <button
          onClick={handleRunSettlement}
          disabled={runSettlementLoading}
          style={{
            padding: '10px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: runSettlementLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            opacity: runSettlementLoading ? 0.7 : 1
          }}
        >
          {runSettlementLoading ? '执行中...' : '执行日终清算'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>总资金余额</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            ¥{formatPrice(totalBalance)}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>总持仓市值</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
            ¥{formatPrice(totalMarketValue)}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>总资产</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            ¥{formatPrice(totalAssets)}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>结算报表数</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
            {reports.length}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
            结算报表
          </h3>
          
          {reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <div>暂无结算报表</div>
              <div style={{ fontSize: '13px', marginTop: '8px' }}>点击"执行日终清算"生成报表</div>
            </div>
          ) : (
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>报表日期</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>买入</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>卖出</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>净盈亏</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td style={{ padding: '10px 8px', fontSize: '14px', fontWeight: '500' }}>{report.report_date}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: '14px' }}>¥{formatPrice(report.total_buy_amount)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: '14px' }}>¥{formatPrice(report.total_sell_amount)}</td>
                      <td style={{ 
                        padding: '10px 8px', 
                        textAlign: 'right', 
                        fontSize: '14px',
                        color: report.net_profit_loss >= 0 ? '#e74c3c' : '#27ae60',
                        fontWeight: '500'
                      }}>
                        {report.net_profit_loss >= 0 ? '+' : ''}¥{formatPrice(report.net_profit_loss)}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#059669',
                          background: '#ecfdf5'
                        }}>
                          已生成
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
            资金账户监控
          </h3>
          
          {allFunds.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              暂无资金账户数据
            </div>
          ) : (
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>用户</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>总资产</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>可用</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>冻结</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>盈亏</th>
                  </tr>
                </thead>
                <tbody>
                  {allFunds.map((fund) => (
                    <tr key={fund.id}>
                      <td style={{ padding: '10px 8px', fontSize: '14px' }}>
                        <div style={{ fontWeight: '500' }}>{fund.user_name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{fund.username}</div>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: '14px', fontWeight: '500' }}>
                        ¥{formatPrice(fund.total_balance)}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: '14px' }}>
                        ¥{formatPrice(fund.available_balance)}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: '14px', color: '#f59e0b' }}>
                        ¥{formatPrice(fund.frozen_balance)}
                      </td>
                      <td style={{ 
                        padding: '10px 8px', 
                        textAlign: 'right', 
                        fontSize: '14px',
                        color: (fund.total_profit_loss || 0) >= 0 ? '#e74c3c' : '#27ae60'
                      }}>
                        {(fund.total_profit_loss || 0) >= 0 ? '+' : ''}¥{formatPrice(fund.total_profit_loss)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

export default FinancialDashboard;
