import React, { useState, useEffect } from 'react';
import { common, sales } from '../api.js';

function Reports() {
  const [profitData, setProfitData] = useState(null);
  const [dailyReport, setDailyReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    try {
      const [profitRes, dailyRes] = await Promise.all([
        common.getProfitReport(dateRange),
        sales.getDailyReport(new Date().toISOString().split('T')[0]),
      ]);
      setProfitData(profitRes.data);
      setDailyReport(dailyRes.data);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="card">加载中...</div>;
  }

  const maxRevenue = Math.max(...(profitData?.summary?.map(d => d.total_revenue || 0) || [0]));

  return (
    <div>
      <div className="page-header">
        <h2>毛利报表</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="date"
            className="form-control"
            style={{ width: 'auto' }}
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          />
          <span>至</span>
          <input
            type="date"
            className="form-control"
            style={{ width: 'auto' }}
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          />
          <button className="btn btn-secondary" onClick={loadData}>查询</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">总订单数</div>
          <div className="value">{profitData?.totals?.total_orders || 0}</div>
          <div className="change positive">笔</div>
        </div>
        <div className="stat-card">
          <div className="label">总营收</div>
          <div className="value">¥{(profitData?.totals?.total_revenue || 0).toFixed(2)}</div>
          <div className="change positive">元</div>
        </div>
        <div className="stat-card">
          <div className="label">总成本</div>
          <div className="value">¥{(profitData?.totals?.total_cost || 0).toFixed(2)}</div>
          <div className="change negative">元</div>
        </div>
        <div className="stat-card">
          <div className="label">总毛利</div>
          <div className="value" style={{ color: 'var(--success)' }}>
            ¥{(profitData?.totals?.gross_profit || 0).toFixed(2)}
          </div>
          <div className="change positive">元</div>
        </div>
        <div className="stat-card">
          <div className="label">毛利率</div>
          <div className="value" style={{ color: (profitData?.totals?.gross_margin || 0) >= 60 ? 'var(--success)' : 'var(--warning)' }}>
            {(profitData?.totals?.gross_margin || 0).toFixed(1)}%
          </div>
          <div className={(profitData?.totals?.gross_margin || 0) >= 60 ? 'change positive' : 'change negative'}>
            {(profitData?.totals?.gross_margin || 0) >= 60 ? '优秀' : '需提升'}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">客单价</div>
          <div className="value">
            ¥{profitData?.totals?.total_orders ? (profitData.totals.total_revenue / profitData.totals.total_orders).toFixed(2) : '0.00'}
          </div>
          <div className="change positive">元/单</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>营收趋势</h3>
        </div>
        {profitData?.summary && profitData.summary.length > 0 ? (
          <div>
            <div className="report-chart">
              {profitData.summary.map((day, i) => {
                const height = maxRevenue > 0 ? (day.total_revenue / maxRevenue) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="chart-bar"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    data-value={`¥${day.total_revenue?.toFixed(2) || 0}`}
                    title={`${day.report_date}: ¥${day.total_revenue?.toFixed(2) || 0}`}
                  />
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>{profitData.summary[0]?.report_date}</span>
              <span>{profitData.summary[Math.floor(profitData.summary.length / 2)]?.report_date}</span>
              <span>{profitData.summary[profitData.summary.length - 1]?.report_date}</span>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📈</div>
            <div>暂无数据</div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <div className="card-header">
            <h3>今日销售排行</h3>
          </div>
          {dailyReport?.by_recipe && dailyReport.by_recipe.length > 0 ? (
            <div>
              {dailyReport.by_recipe.slice(0, 10).map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: index < 3 ? 'var(--gold)' : 'var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: index < 3 ? 'var(--primary)' : 'var(--text)'
                    }}>
                      {index + 1}
                    </span>
                    <span>{item.recipe_name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">×{item.total_sold}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      ¥{item.total_revenue.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🏆</div>
              <div>今日暂无销售</div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>每日明细</h3>
          </div>
          {profitData?.summary && profitData.summary.length > 0 ? (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {[...profitData.summary].reverse().map((day, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div>
                    <div className="font-bold">{day.report_date}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {day.order_count} 笔订单
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">¥{day.total_revenue?.toFixed(2) || '0.00'}</div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: day.gross_profit > 0 ? 'var(--success)' : 'var(--danger)' 
                    }}>
                      毛利: ¥{day.gross_profit?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div>暂无数据</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;
