import React, { useState, useEffect } from 'react'
import { policyApi } from '../services/api.js'

function PolicyList() {
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [selectedPolicy, setSelectedPolicy] = useState(null)

  useEffect(() => {
    loadData()
  }, [page, keyword])

  const loadData = async () => {
    try {
      const data = await policyApi.getList({ page, pageSize, keyword })
      setList(data.list)
      setTotal(data.total)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const handleViewDetail = async (id) => {
    try {
      const data = await policyApi.getDetail(id)
      setSelectedPolicy(data)
    } catch (error) {
      console.error('加载详情失败:', error)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="header">
        <h1>📚 医保政策知识图谱</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="search-bar">
            <input
              type="text"
              placeholder="搜索政策标题、关键词..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ maxWidth: '400px' }}
            />
            <button className="btn btn-primary" onClick={loadData}>搜索</button>
          </div>

          <table>
            <thead>
              <tr>
                <th>政策标题</th>
                <th>分类</th>
                <th>关键词</th>
                <th>生效日期</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map(item => (
                <tr key={item.id}>
                  <td style={{ maxWidth: '300px' }}>{item.title}</td>
                  <td>{item.category}</td>
                  <td style={{ maxWidth: '200px' }}>{item.keywords}</td>
                  <td>{item.effective_date}</td>
                  <td>
                    <span className={`badge ${item.status === '生效中' ? 'badge-success' : 'badge-default'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-default" onClick={() => handleViewDetail(item.id)}>
                      查看
                    </button>
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

      {selectedPolicy && (
        <div className="modal">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>{selectedPolicy.title}</h2>
              <button className="modal-close" onClick={() => setSelectedPolicy(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid" style={{ marginBottom: '16px' }}>
                <div className="detail-item">
                  <span className="detail-label">分类：</span>
                  <span className="detail-value">{selectedPolicy.category}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">状态：</span>
                  <span className="detail-value">
                    <span className={`badge ${selectedPolicy.status === '生效中' ? 'badge-success' : 'badge-default'}`}>
                      {selectedPolicy.status}
                    </span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">生效日期：</span>
                  <span className="detail-value">{selectedPolicy.effective_date}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">失效日期：</span>
                  <span className="detail-value">{selectedPolicy.expiry_date || '-'}</span>
                </div>
                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                  <span className="detail-label">关键词：</span>
                  <span className="detail-value">{selectedPolicy.keywords}</span>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                <h4 style={{ marginBottom: '8px' }}>政策内容</h4>
                <p style={{ lineHeight: '1.8', color: '#595959' }}>{selectedPolicy.content}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setSelectedPolicy(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PolicyList
