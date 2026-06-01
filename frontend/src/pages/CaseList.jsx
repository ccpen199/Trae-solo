import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function CaseList() {
  const navigate = useNavigate()
  const [cases, setCases] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 })
  const [filters, setFilters] = useState({
    status: '',
    conflict_type: '',
    is_sensitive: ''
  })

  useEffect(() => {
    loadCases()
  }, [pagination.page, filters])

  const loadCases = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters
      })
      const res = await fetch(`/api/cases?${params}`)
      const data = await res.json()
      setCases(data.data || [])
      setPagination(prev => ({
        ...prev,
        total: data.total || 0
      }))
    } catch (err) {
      console.error('加载案件列表失败', err)
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

  const getUrgencyBadge = (level) => {
    const levelMap = {
      high: { text: '紧急', class: 'badge-high' },
      medium: { text: '一般', class: 'badge-medium' },
      normal: { text: '普通', class: 'badge-low' }
    }
    const l = levelMap[level] || { text: level, class: '' }
    return <span className={`badge ${l.class}`}>{l.text}</span>
  }

  const totalPages = Math.ceil(pagination.total / pagination.pageSize)

  return (
    <div>
      <div className="page-header">
        <h1>案件列表</h1>
        <p>查看和管理所有调解案件</p>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="form-group">
            <label>状态</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">全部</option>
              <option value="registered">待登记</option>
              <option value="investigating">调查中</option>
              <option value="mediating">调解中</option>
              <option value="agreed">已达成协议</option>
              <option value="closed">已结案</option>
              <option value="reopened">重新开启</option>
            </select>
          </div>
          <div className="form-group">
            <label>矛盾类型</label>
            <select
              value={filters.conflict_type}
              onChange={(e) => setFilters(prev => ({ ...prev, conflict_type: e.target.value }))}
            >
              <option value="">全部</option>
              <option value="邻里纠纷">邻里纠纷</option>
              <option value="家庭纠纷">家庭纠纷</option>
              <option value="物业纠纷">物业纠纷</option>
              <option value="土地纠纷">土地纠纷</option>
              <option value="经济纠纷">经济纠纷</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div className="form-group">
            <label>敏感案件</label>
            <select
              value={filters.is_sensitive}
              onChange={(e) => setFilters(prev => ({ ...prev, is_sensitive: e.target.value }))}
            >
              <option value="">全部</option>
              <option value="1">是</option>
              <option value="0">否</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/register')}>
            ➕ 新建案件
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>案件编号</th>
                <th>矛盾类型</th>
                <th>发生地点</th>
                <th>紧急程度</th>
                <th>状态</th>
                <th>敏感</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {cases.map(caseItem => (
                <tr key={caseItem.id}>
                  <td>{caseItem.case_number}</td>
                  <td>{caseItem.conflict_type}</td>
                  <td>{caseItem.incident_location}</td>
                  <td>{getUrgencyBadge(caseItem.urgency_level)}</td>
                  <td>{getStatusBadge(caseItem.status)}</td>
                  <td>{caseItem.is_sensitive ? '是' : '否'}</td>
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
              {cases.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: '#999' }}>
                    暂无案件数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="page-btn"
              disabled={pagination.page <= 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              上一页
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1
              if (totalPages > 5) {
                if (pagination.page > 3) {
                  pageNum = pagination.page - 2 + i
                }
                if (pagination.page > totalPages - 2) {
                  pageNum = totalPages - 4 + i
                }
              }
              return (
                <button
                  key={pageNum}
                  className={`page-btn ${pagination.page === pageNum ? 'active' : ''}`}
                  onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                >
                  {pageNum}
                </button>
              )
            })}
            <button 
              className="page-btn"
              disabled={pagination.page >= totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CaseList
