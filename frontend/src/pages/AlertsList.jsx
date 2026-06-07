import React, { useState, useEffect } from 'react'
import { alertsApi } from '../services/api.js'

function AlertsList() {
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  useEffect(() => {
    loadData()
  }, [page])

  const loadData = async () => {
    try {
      const data = await alertsApi.getList({ page, pageSize })
      setList(data.list)
      setTotal(data.total)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const handleStatusUpdate = async (id, status) => {
    try {
      await alertsApi.updateStatus(id, { status, handler: '管理员' })
      loadData()
    } catch (error) {
      console.error('状态更新失败:', error)
    }
  }

  const getLevelColor = (level) => {
    const colorMap = { '高': 'badge-error', '中': 'badge-warning', '低': 'badge-info' }
    return colorMap[level] || 'badge-default'
  }

  const getStatusColor = (status) => {
    const colorMap = {
      '待处理': 'badge-warning',
      '处理中': 'badge-info',
      '已排除': 'badge-success',
      '已处罚': 'badge-error'
    }
    return colorMap[status] || 'badge-default'
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="header">
        <h1>⚠️ 基金异常行为预警</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>参保人</th>
                <th>预警类型</th>
                <th>预警级别</th>
                <th>描述</th>
                <th>检测时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map(item => (
                <tr key={item.id}>
                  <td>{item.insured_name}</td>
                  <td>{item.alert_type}</td>
                  <td>
                    <span className={`badge ${getLevelColor(item.alert_level)}`}>
                      {item.alert_level}
                    </span>
                  </td>
                  <td style={{ maxWidth: '300px' }}>{item.description}</td>
                  <td>{item.detect_time?.slice(0, 10)}</td>
                  <td>
                    <span className={`badge ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    {item.status === '待处理' && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleStatusUpdate(item.id, '处理中')}>
                        开始处理
                      </button>
                    )}
                    {item.status === '处理中' && (
                      <>
                        <button className="btn btn-sm btn-success" onClick={() => handleStatusUpdate(item.id, '已排除')}>
                          排除
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleStatusUpdate(item.id, '已处罚')} style={{ marginLeft: '4px' }}>
                          处罚
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一页</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>下一页</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlertsList
