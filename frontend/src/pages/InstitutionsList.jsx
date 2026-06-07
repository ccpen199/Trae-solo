import React, { useState, useEffect } from 'react'
import { institutionsApi } from '../services/api.js'

function InstitutionsList() {
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  useEffect(() => {
    loadData()
  }, [page])

  const loadData = async () => {
    try {
      const data = await institutionsApi.getList({ page, pageSize })
      setList(data.list)
      setTotal(data.total)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const getInspectionColor = (status) => {
    const colorMap = {
      '正常': 'badge-success',
      '待巡检': 'badge-warning',
      '整改中': 'badge-error',
      '已取消': 'badge-default'
    }
    return colorMap[status] || 'badge-default'
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="header">
        <h1>🏨 定点医药机构</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>机构名称</th>
                <th>类型</th>
                <th>等级</th>
                <th>地址</th>
                <th>联系方式</th>
                <th>定点</th>
                <th>巡检状态</th>
                <th>上次巡检</th>
              </tr>
            </thead>
            <tbody>
              {list.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.type}</td>
                  <td>{item.level || '-'}</td>
                  <td>{item.address}</td>
                  <td>{item.contact}</td>
                  <td>
                    {item.is_pointed ? (
                      <span className="badge badge-success">是</span>
                    ) : (
                      <span className="badge badge-default">否</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${getInspectionColor(item.inspection_status)}`}>
                      {item.inspection_status}
                    </span>
                  </td>
                  <td>{item.last_inspection_date?.slice(0, 10) || '-'}</td>
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

export default InstitutionsList
