import React, { useState, useEffect } from 'react';
import { liquors, recipes, sales, common } from '../api.js';

function Dashboard() {
  const [stats, setStats] = useState({
    totalLiquors: 0,
    totalRecipes: 0,
    todaySales: 0,
    todayRevenue: 0,
    lowStockItems: 0,
  });
  const [recentSales, setRecentSales] = useState([]);
  const [profitData, setProfitData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [liquorsRes, recipesRes, salesRes, profitRes] = await Promise.all([
        liquors.getAll(),
        recipes.getAll(),
        sales.getAll(),
        common.getProfitReport(),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todaySalesList = salesRes.data.filter(
        s => s.created_at && s.created_at.startsWith(today)
      );

      setStats({
        totalLiquors: liquorsRes.data.length,
        totalRecipes: recipesRes.data.length,
        todaySales: todaySalesList.reduce((sum, s) => sum + s.quantity, 0),
        todayRevenue: todaySalesList.reduce((sum, s) => sum + s.total_amount, 0),
        lowStockItems: liquorsRes.data.filter(l => l.total_bottles <= l.min_stock).length,
      });
      setRecentSales(salesRes.data.slice(0, 10));
      setProfitData(profitRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="card">加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>数据看板</h2>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">酒水种类</div>
          <div className="value">{stats.totalLiquors}</div>
          <div className="change positive">库存管理中</div>
        </div>
        <div className="stat-card">
          <div className="label">在售配方</div>
          <div className="value">{stats.totalRecipes}</div>
          <div className="change positive">持续更新中</div>
        </div>
        <div className="stat-card">
          <div className="label">今日出杯</div>
          <div className="value">{stats.todaySales}</div>
          <div className="change positive">杯</div>
        </div>
        <div className="stat-card">
          <div className="label">今日营收</div>
          <div className="value">¥{stats.todayRevenue.toFixed(2)}</div>
          <div className="change positive">继续加油</div>
        </div>
        <div className="stat-card">
          <div className="label">库存预警</div>
          <div className="value" style={{ color: stats.lowStockItems > 0 ? 'var(--danger)' : 'var(--gold)' }}>
            {stats.lowStockItems}
          </div>
          <div className={stats.lowStockItems > 0 ? 'change negative' : 'change positive'}>
            {stats.lowStockItems > 0 ? '需要补货' : '库存充足'}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">毛利率</div>
          <div className="value">{profitData?.totals?.gross_margin ? profitData.totals.gross_margin.toFixed(1) : 0}%</div>
          <div className="change positive">近30天平均</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div className="card">
          <div className="card-header">
            <h3>营收趋势</h3>
          </div>
          {profitData?.summary && profitData.summary.length > 0 ? (
            <div className="report-chart">
              {profitData.summary.slice(-14).map((day, i) => {
                const max = Math.max(...profitData.summary.map(d => d.total_revenue || 0));
                const height = max > 0 ? (day.total_revenue / max) * 100 : 0;
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
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📈</div>
              <div>暂无销售数据</div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>最近销售</h3>
          </div>
          {recentSales.length > 0 ? (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {recentSales.map((sale) => (
                <div key={sale.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {sale.recipe_name || sale.liquor_name || '未知'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(sale.created_at).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div>¥{sale.total_amount.toFixed(2)}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      ×{sale.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">💰</div>
              <div>暂无销售记录</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
