import React, { useState, useEffect } from 'react';
import { getReportSummary, getStaffLoad, getNoShowReasons, getServicePopularity, getDailyTrend } from '../api.js';
import dayjs from 'dayjs';

function Reports() {
  const [filters, setFilters] = useState({
    start_date: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    end_date: dayjs().format('YYYY-MM-DD'),
    store_id: ''
  });
  const [summary, setSummary] = useState(null);
  const [staffLoad, setStaffLoad] = useState([]);
  const [noShowReasons, setNoShowReasons] = useState([]);
  const [servicePopularity, setServicePopularity] = useState([]);
  const [dailyTrend, setDailyTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filters]);

  async function loadData() {
    try {
      setLoading(true);
      const params = {};
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.store_id) params.store_id = filters.store_id;

      const [summaryData, staffData, reasonsData, servicesData, trendData] = await Promise.all([
        getReportSummary(params),
        getStaffLoad(params),
        getNoShowReasons(params),
        getServicePopularity(params),
        getDailyTrend(params)
      ]);
      setSummary(summaryData);
      setStaffLoad(staffData);
      setNoShowReasons(reasonsData);
      setServicePopularity(servicesData);
      setDailyTrend(trendData);
    } catch (err) {
      console.error('加载报表失败', err);
    } finally {
      setLoading(false);
    }
  }

  function renderBar(value, max) {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
      <div style={{ width: '100%', background: '#e5e7eb', borderRadius: '4px', height: '12px', overflow: 'hidden' }}>
        <div style={{ width: `${percentage}%`, height: '100%', background: '#2563eb', borderRadius: '4px', transition: 'width 0.3s' }} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">运营报表</h1>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-item">
            <label className="form-label">开始日期</label>
            <input type="date" className="form-input" value={filters.start_date} onChange={e => setFilters({ ...filters, start_date: e.target.value })} />
          </div>
          <div className="filter-item">
            <label className="form-label">结束日期</label>
            <input type="date" className="form-input" value={filters.end_date} onChange={e => setFilters({ ...filters, end_date: e.target.value })} />
          </div>
          <div className="filter-item">
            <button className="btn btn-secondary" onClick={loadData}>刷新</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div>加载中...</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{summary?.total_appointments || 0}</div>
              <div className="stat-label">总预约数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{summary?.conversion_rate || 0}%</div>
              <div className="stat-label">预约转化率</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{summary?.show_up_rate || 0}%</div>
              <div className="stat-label">到店率</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">¥{summary?.total_revenue || 0}</div>
              <div className="stat-label">总营收</div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
              <div className="stat-value" style={{ color: '#10b981' }}>{summary?.completed_appointments || 0}</div>
              <div className="stat-label">已完成</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div className="stat-value" style={{ color: '#f59e0b' }}>{summary?.no_show_appointments || 0}</div>
              <div className="stat-label">爽约数</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <div className="stat-value" style={{ color: '#ef4444' }}>{summary?.cancelled_appointments || 0}</div>
              <div className="stat-label">取消数</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div className="stat-value" style={{ color: '#3b82f6' }}>{summary?.checked_in_appointments || 0}</div>
              <div className="stat-label">到店数</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '1rem' }}>技师负载</h3>
              {staffLoad.length === 0 ? (
                <div className="empty-state" style={{ padding: '1.5rem' }}>暂无数据</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>技师</th>
                      <th>服务人次</th>
                      <th>服务时长</th>
                      <th>评分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffLoad.map(s => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{s.appointment_count}</td>
                        <td>{Math.round(s.total_minutes / 60)}小时</td>
                        <td>{s.avg_rating > 0 ? '⭐'.repeat(Math.round(s.avg_rating)) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '1rem' }}>服务热度</h3>
              {servicePopularity.length === 0 ? (
                <div className="empty-state" style={{ padding: '1.5rem' }}>暂无数据</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>服务项目</th>
                      <th>预约数</th>
                      <th>营收</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicePopularity.map((s, i) => (
                      <tr key={s.id}>
                        <td>{i + 1}. {s.name}</td>
                        <td>{s.booking_count}</td>
                        <td>¥{s.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '1rem' }}>取消原因分布</h3>
              {noShowReasons.length === 0 ? (
                <div className="empty-state" style={{ padding: '1.5rem' }}>暂无数据</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {noShowReasons.map((r, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span>{r.reason}</span>
                        <span style={{ fontWeight: 600 }}>{r.count}次</span>
                      </div>
                      {renderBar(r.count, noShowReasons[0]?.count || 1)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '1rem' }}>每日趋势</h3>
              {dailyTrend.length === 0 ? (
                <div className="empty-state" style={{ padding: '1.5rem' }}>暂无数据</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>预约数</th>
                      <th>到店数</th>
                      <th>营收</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyTrend.slice(-10).reverse().map(d => (
                      <tr key={d.date}>
                        <td>{d.date}</td>
                        <td>{d.total}</td>
                        <td>{d.checked_in}</td>
                        <td>¥{d.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Reports;
