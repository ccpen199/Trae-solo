import React, { useState, useEffect } from 'react'
import { verificationApi } from '../services/api.js'

function VerificationList() {
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)

  useEffect(() => {
    loadData()
  }, [page])

  const loadData = async () => {
    try {
      const data = await verificationApi.getList({ page, pageSize })
      setList(data.list)
      setTotal(data.total)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const getResultColor = (result) => {
    const colorMap = { '通过': 'badge-success', '未通过': 'badge-error', '待核验': 'badge-warning' }
    return colorMap[result] || 'badge-default'
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="header">
        <h1>📹 待遇资格认证</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>参保人</th>
                <th>认证类型</th>
                <th>认证时间</th>
                <th>相似度</th>
                <th>认证结果</th>
                <th>核验人</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {list.map(item => (
                <tr key={item.id}>
                  <td>{item.insured_name}</td>
                  <td>{item.verify_type}</td>
                  <td>{item.verify_time?.slice(0, 19)}</td>
                  <td>
                    {item.similarity_score ? `${item.similarity_score}%` : '-'}
                  </td>
                  <td>
                    <span className={`badge ${getResultColor(item.result)}`}>
                      {item.result}
                    </span>
                  </td>
                  <td>{item.verifier || '-'}</td>
                  <td>{item.remarks || '-'}</td>
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

export default VerificationList
