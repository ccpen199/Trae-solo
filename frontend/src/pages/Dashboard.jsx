import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { statsAPI } from '../api'

export default function Dashboard({ user }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [overview, setOverview] = useState(null)
  const [dailyStats, setDailyStats] = useState([])
  const [staffStats, setStaffStats] = useState([])
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD')
  })

  useEffect(() => {
    loadData()
  }, [dateRange])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [overviewRes, dailyRes, staffRes] = await Promise.all([
        statsAPI.getOverview(dateRange),
        statsAPI.getDaily(dateRange),
        statsAPI.getStaff(dateRange)
      ])
      setOverview(overviewRes.data || {})
      setDailyStats(dailyRes.data || [])
      setStaffStats(staffRes.data || [])
    } catch (err) {
      setError('加载统计数据失败')
    } finally {
      setLoading(false)
    }
  }

  const maxDailyValue = Math.max(...dailyStats.map(d => d.appointments || 0), 1)
  const maxStaffValue = Math.max(...staffStats.map(s => s.completed || 0), 1)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2>运营统计</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="date"
            className="form-control"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
          />
          <span style={{ alignSelf: 'center' }}>至</span>
          <input
            type="date"
            className="form-control"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
          />
          <button className="btn btn-primary" onClick={loadData}>
            查询
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-4" style={{ marginBottom: '20px' }}>
        <div className="stat-card" style={{ borderLeftColor: 'var(--primary-color)' }}>
          <h3>总预约数</h3>
          <div className="value">{overview?.totalAppointments || 0}</div>
          <div className={`trend ${(overview?.appointmentGrowth || 0) >= 0 ? 'up' : 'down'}`}>
            {(overview?.appointmentGrowth || 0) >= 0 ? '↑' : '↓'} {Math.abs(overview?.appointmentGrowth || 0)}% 较上期
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--success-color)' }}>
          <h3>总收入</h3>
          <div className="value">¥{(overview?.totalRevenue || 0).toLocaleString()}</div>
          <div className={`trend ${(overview?.revenueGrowth || 0) >= 0 ? 'up' : 'down'}`}>
            {(overview?.revenueGrowth || 0) >= 0 ? '↑' : '↓'} {Math.abs(overview?.revenueGrowth || 0)}% 较上期
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--warning-color)' }}>
          <h3>复购率</h3>
          <div className="value">{(overview?.repurchaseRate || 0).toFixed(1)}%</div>
          <div className="progress-bar" style={{ marginTop: '8px' }}>
            <div className="progress-fill warning" style={{ width: `${Math.min(overview?.repurchaseRate || 0, 100)}%` }}></div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--danger-color)' }}>
          <h3>客诉率</h3>
          <div className="value">{(overview?.complaintRate || 0).toFixed(1)}%</div>
          <div className="progress-bar" style={{ marginTop: '8px' }}>
            <div className="progress-fill" style={{ 
              width: `${Math.min(overview?.complaintRate || 0, 100)}%`,
              background: (overview?.complaintRate || 0) > 5 ? 'var(--danger-color)' : 'var(--success-color)'
            }}></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>每日预约统计</h3>
        </div>
        <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '20px 0' }}>
          {dailyStats.length === 0 ? (
            <div className="empty-state" style={{ width: '100%' }}>
              <h3>暂无数据</h3>
            </div>
          ) : (
            dailyStats.map((day, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {day.appointments || 0}
                </div>
                <div 
                  className="progress-fill"
                  style={{ 
                    width: '100%', 
                    height: `${((day.appointments || 0) / maxDailyValue) * 80}%`,
                    minHeight: '4px',
                    borderRadius: '4px 4px 0 0',
                    background: 'linear-gradient(to top, var(--primary-color), #6366f1)'
                  }}
                ></div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                  {dayjs(day.date).format('MM-DD')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>员工绩效排行</h3>
        </div>
        {staffStats.length === 0 ? (
          <div className="empty-state">
            <h3>暂无数据</h3>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>排名</th>
                <th>员工</th>
                <th>完成服务</th>
                <th>完成率</th>
                <th>平均评分</th>
                <th>绩效进度</th>
              </tr>
            </thead>
            <tbody>
              {staffStats.map((staff, idx) => (
                <tr key={staff.id}>
                  <td>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                        {staff.name?.charAt(0)}
                      </div>
                      <span>{staff.name}</span>
                    </div>
                  </td>
                  <td>{staff.completed || 0}</td>
                  <td>{(staff.completionRate || 0).toFixed(1)}%</td>
                  <td>
                    <span style={{ color: 'var(--warning-color)' }}>
                      {'⭐'.repeat(Math.round(staff.rating || 0))}
                    </span>
                    <span style={{ marginLeft: '4px' }}>{(staff.rating || 0).toFixed(1)}</span>
                  </td>
                  <td style={{ width: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div 
                          className="progress-fill success" 
                          style={{ width: `${((staff.completed || 0) / maxStaffValue) * 100}%` }}
                        ></div>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '35px' }}>
                        {Math.round(((staff.completed || 0) / maxStaffValue) * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
