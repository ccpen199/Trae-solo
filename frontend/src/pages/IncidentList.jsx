import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function IncidentList() {
  const [incidents, setIncidents] = useState([])
  const [filters, setFilters] = useState({ status: '', type: '', urgency: '' })
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    loadIncidents()
  }, [filters, page])

  const loadIncidents = async () => {
    try {
      const params = new URLSearchParams({ page, pageSize: 20 })
      if (filters.status) params.append('status', filters.status)
      if (filters.type) params.append('type', filters.type)
      if (filters.urgency) params.append('urgency', filters.urgency)
      
      const res = await api.get(`/incidents?${params}`)
      setIncidents(res.data.incidents)
      setTotal(res.data.total)
    } catch (err) {
      console.error('加载事件列表失败', err)
    }
  }

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 20 }}>
        <h2>📋 事件列表</h2>
        <button className="btn btn-primary" onClick={() => navigate('/report')}>
          + 新建上报
        </button>
      </div>

      <div className="card">
        <div className="flex" style={{ marginBottom: 20, gap: 12 }}>
          <select 
            className="form-control" 
            style={{ width: 140, padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd' }}
            value={filters.status}
            onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1) }}
          >
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="closed">已结案</option>
          </select>

          <select 
            style={{ width: 140, padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd' }}
            value={filters.type}
            onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(1) }}
          >
            <option value="">全部类型</option>
            <option value="bullying">校园欺凌</option>
            <option value="injury">意外伤害</option>
            <option value="food_safety">食品安全</option>
            <option value="facility">设施故障</option>
            <option value="security">治安事件</option>
            <option value="other">其他</option>
          </select>

          <select 
            style={{ width: 140, padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd' }}
            value={filters.urgency}
            onChange={(e) => { setFilters({ ...filters, urgency: e.target.value }); setPage(1) }}
          >
            <option value="">全部紧急度</option>
            <option value="critical">紧急</option>
            <option value="high">高</option>
            <option value="normal">普通</option>
            <option value="low">低</option>
          </select>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>事件编号</th>
              <th>标题</th>
              <th>类型</th>
              <th>地点</th>
              <th>紧急程度</th>
              <th>状态</th>
              <th>责任部门</th>
              <th>上报时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  暂无事件数据
                </td>
              </tr>
            ) : (
              incidents.map(incident => (
                <tr key={incident.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{incident.incident_no}</td>
                  <td>{incident.title}</td>
                  <td><span className="tag">{getTypeLabel(incident.type)}</span></td>
                  <td>{incident.location}</td>
                  <td>
                    <span className={`badge badge-${incident.urgency}`}>
                      {getUrgencyLabel(incident.urgency)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${incident.status}`}>
                      {getStatusLabel(incident.status)}
                    </span>
                  </td>
                  <td>{getDeptLabel(incident.assigned_department)}</td>
                  <td style={{ fontSize: 12 }}>{formatDate(incident.created_at)}</td>
                  <td>
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate(`/incidents/${incident.id}`)}
                    >
                      详情
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {total > 20 && (
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button 
              className="btn btn-outline btn-sm" 
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              style={{ marginRight: 8 }}
            >
              上一页
            </button>
            <span style={{ margin: '0 12px' }}>第 {page} 页 / 共 {Math.ceil(total / 20)} 页</span>
            <button 
              className="btn btn-outline btn-sm"
              disabled={page >= Math.ceil(total / 20)}
              onClick={() => setPage(p => p + 1)}
              style={{ marginLeft: 8 }}
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function getTypeLabel(type) {
  const labels = {
    bullying: '校园欺凌',
    injury: '意外伤害',
    food_safety: '食品安全',
    facility: '设施故障',
    security: '治安事件',
    other: '其他'
  }
  return labels[type] || type
}

function getUrgencyLabel(urgency) {
  const labels = { critical: '紧急', high: '高', normal: '普通', low: '低' }
  return labels[urgency] || urgency
}

function getStatusLabel(status) {
  const labels = { pending: '待处理', processing: '处理中', closed: '已结案' }
  return labels[status] || status
}

function getDeptLabel(dept) {
  const labels = {
    student_affairs: '学生处',
    medical: '校医院',
    logistics: '后勤处',
    security: '保卫处',
    general: '综合办'
  }
  return labels[dept] || dept
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}