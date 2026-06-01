import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    total: 0,
    registered: 0,
    investigating: 0,
    mediating: 0,
    closed: 0,
    highRisk: 0
  })
  const [recentCases, setRecentCases] = useState([])

  useEffect(() => {
    loadStats()
    loadRecentCases()
  }, [])

  const loadStats = async () => {
    try {
      const res = await fetch('/api/cases/stats/summary')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('加载统计数据失败', err)
    }
  }

  const loadRecentCases = async () => {
    try {
      const res = await fetch('/api/cases?pageSize=5')
      const data = await res.json()
      setRecentCases(data.data || [])
    } catch (err) {
      console.error('加载最近案件失败', err)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      registered: { text: '待登记', class: 'badge-registered' },
      investigating: { text: '调查中', class: 'badge-investigating' },
      mediating: { text: '调解中', class: 'badge-mediating' },
      agreed: { text: '已达成协议', class: 'badge-agreed' },
      closed: { text: '已结案', class: 'badge-closed' },
      reopened: { text: '重新开启', class: 'badge-reopened' }
    }
    const s = statusMap[status] || { text: status, class: '' }
    return <span className={`badge ${s.class}`}>{s.text}</span>
  }

  return (
    <div>
      <div className="page-header">
        <h1>工作台</h1>
        <p>欢迎使用社区矛盾调解系统</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">案件总数</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-value">{stats.registered}</div>
          <div className="stat-label">待处理</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.investigating}</div>
          <div className="stat-label">调查中</div>
        </div>
        <div className="stat-card success">
          <div className="stat-value">{stats.mediating}</div>
          <div className="stat-label">调解中</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.closed}</div>
          <div className="stat-label">已结案</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-value">{stats.highRisk}</div>
          <div className="stat-label">高风险案件</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px' }}>最近案件</h3>
          <button 
            className="btn btn-sm btn-primary"
            onClick={() => navigate('/cases')}
          >
            查看全部
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>案件编号</th>
                <th>矛盾类型</th>
                <th>发生地点</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {recentCases.map(caseItem => (
                <tr key={caseItem.id}>
                  <td>{caseItem.case_number}</td>
                  <td>{caseItem.conflict_type}</td>
                  <td>{caseItem.incident_location}</td>
                  <td>{getStatusBadge(caseItem.status)}</td>
                  <td>{caseItem.created_at}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => navigate(`/cases/${caseItem.id}`)}
                    >
                      查看
                    </button>
                  </td>
                </tr>
              ))}
              {recentCases.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#999' }}>
                    暂无案件数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>快速操作</h3>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={() => navigate('/register')}>
            ➕ 新建案件
          </button>
          <button className="btn btn-success" onClick={() => navigate('/cases')}>
            📋 案件列表
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
