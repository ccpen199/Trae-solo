import React, { useEffect, useState } from 'react';
import { settlementApi } from '../api';
import dayjs from 'dayjs';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDetail, setReportDetail] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await settlementApi.getMyReports();
      setReports(res.data.reports);
    } catch (err) {
      console.error('加载结算报表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReportDetail = async (reportId) => {
    try {
      const res = await settlementApi.getReport(reportId);
      setReportDetail(res.data);
    } catch (err) {
      console.error('加载报表详情失败:', err);
    }
  };

  const handleExportVoucher = async (reportId) => {
    try {
      const res = await settlementApi.exportVoucher(reportId);
      const voucher = res.data;
      
      const blob = new Blob([JSON.stringify(voucher, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voucher-${voucher.voucherNo}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('导出凭证失败:', err);
      alert('导出失败');
    }
  };

  const formatPrice = (price) => (price !== null && price !== undefined ? price.toFixed(2) : '--');
  const formatTime = (timestamp) => dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');

  return (
    <div>
      <div style={{ 
        background: 'white', 
        borderRadius: '8px', 
        padding: '16px 20px', 
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          <span style={{ marginRight: '16px' }}>💡 T+1 清算规则：当日交易，次日清算</span>
          <span>交易时间：9:30-11:30, 13:00-15:00</span>
        </div>
        <button
          onClick={loadReports}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          刷新
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
            结算报表列表
          </h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>加载中...</div>
          ) : reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <div>暂无结算报表</div>
              <div style={{ fontSize: '13px', marginTop: '8px' }}>每日收盘后自动生成结算报表</div>
            </div>
          ) : (
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>报表日期</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>买入金额</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>卖出金额</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>净盈亏</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr 
                      key={report.id} 
                      style={{ 
                        cursor: 'pointer',
                        background: selectedReport?.id === report.id ? '#eff6ff' : 'transparent'
                      }}
                      onClick={() => {
                        setSelectedReport(report);
                        loadReportDetail(report.id);
                      }}
                    >
                      <td style={{ padding: '12px 8px', fontSize: '14px', fontWeight: '500' }}>{report.report_date}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px' }}>¥{formatPrice(report.total_buy_amount)}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px' }}>¥{formatPrice(report.total_sell_amount)}</td>
                      <td style={{ 
                        padding: '12px 8px', 
                        textAlign: 'right', 
                        fontSize: '14px',
                        color: report.net_profit_loss >= 0 ? '#e74c3c' : '#27ae60',
                        fontWeight: '500'
                      }}>
                        {report.net_profit_loss >= 0 ? '+' : ''}¥{formatPrice(report.net_profit_loss)}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportVoucher(report.id);
                          }}
                          style={{
                            padding: '4px 12px',
                            background: '#dbeafe',
                            color: '#1d4ed8',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          导出凭证
                        </button>
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
            报表详情
          </h3>
          
          {reportDetail ? (
            <div>
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '6px', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                  结算日期：{reportDetail.report.report_date}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  {[
                    { label: '期初余额', value: reportDetail.report.opening_balance },
                    { label: '期末余额', value: reportDetail.report.closing_balance },
                    { label: '买入总额', value: reportDetail.report.total_buy_amount },
                    { label: '卖出总额', value: reportDetail.report.total_sell_amount },
                    { label: '手续费', value: reportDetail.report.total_commission },
                    { label: '印花税', value: reportDetail.report.total_stamp_tax },
                    { label: '过户费', value: reportDetail.report.total_transfer_fee },
                    { label: '持仓盈亏', value: reportDetail.report.position_profit_loss }
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>{item.label}</span>
                      <span style={{ fontWeight: '500' }}>¥{formatPrice(item.value)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ 
                  marginTop: '12px', 
                  paddingTop: '12px', 
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: '600', color: '#374151' }}>净盈亏</span>
                  <span style={{ 
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: reportDetail.report.net_profit_loss >= 0 ? '#e74c3c' : '#27ae60'
                  }}>
                    {reportDetail.report.net_profit_loss >= 0 ? '+' : ''}¥{formatPrice(reportDetail.report.net_profit_loss)}
                  </span>
                </div>
              </div>

              {reportDetail.positions && reportDetail.positions.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                    持仓情况
                  </h4>
                  <div style={{ overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', color: '#6b7280' }}>证券</th>
                          <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>数量</th>
                          <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>成本</th>
                          <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>盈亏</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportDetail.positions.map((pos, idx) => (
                          <tr key={idx}>
                            <td style={{ padding: '8px' }}>{pos.security_code}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>{pos.total_quantity.toLocaleString()}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>¥{formatPrice(pos.avg_cost_price)}</td>
                            <td style={{ 
                              padding: '8px', 
                              textAlign: 'right',
                              color: pos.profit_loss >= 0 ? '#e74c3c' : '#27ae60'
                            }}>
                              {pos.profit_loss >= 0 ? '+' : ''}¥{formatPrice(pos.profit_loss)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {reportDetail.trades && reportDetail.trades.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                    当日成交记录
                  </h4>
                  <div style={{ overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', color: '#6b7280' }}>成交号</th>
                          <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', color: '#6b7280' }}>证券</th>
                          <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>方向</th>
                          <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>价格</th>
                          <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>数量</th>
                          <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>金额</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportDetail.trades.map((trade) => (
                          <tr key={trade.id}>
                            <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '12px' }}>{trade.trade_no}</td>
                            <td style={{ padding: '8px' }}>{trade.security_code}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <span style={{ 
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                color: trade.direction === 'buy' ? '#dc2626' : '#059669',
                                background: trade.direction === 'buy' ? '#fef2f2' : '#ecfdf5'
                              }}>
                                {trade.direction === 'buy' ? '买' : '卖'}
                              </span>
                            </td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>{formatPrice(trade.price)}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>{trade.quantity.toLocaleString()}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>¥{formatPrice(trade.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
              <div>请选择报表查看详情</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
