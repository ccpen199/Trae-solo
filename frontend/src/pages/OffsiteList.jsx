import React, { useState, useEffect } from 'react'
import { offsiteApi } from '../services/api.js'

function OffsiteList() {
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    insured_person_id: '',
    record_type: '异地就医备案',
    from_area: '',
    to_area: '',
    start_date: '',
    end_date: '',
    reason: ''
  })

  useEffect(() => {
    loadData()
  }, [page])

  const loadData = async () => {
    try {
      const data = await offsiteApi.getList({ page, pageSize })
      setList(data.list)
      setTotal(data.total)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await offsiteApi.create(formData)
      setShowModal(false)
      loadData()
    } catch (error) {
      alert('创建失败: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleAudit = async (id, status) => {
    try {
      await offsiteApi.audit(id, status, '管理员')
      loadData()
    } catch (error) {
      console.error('审核失败:', error)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="header">
        <h1>🌍 异地就医备案</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 新增备案
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>参保人</th>
                <th>备案类型</th>
                <th>转出地</th>
                <th>转入地</th>
                <th>开始日期</th>
                <th>结束日期</th>
                <th>申请原因</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map(item => (
                <tr key={item.id}>
                  <td>{item.insured_name}</td>
                  <td>{item.record_type}</td>
                  <td>{item.from_area}</td>
                  <td>{item.to_area}</td>
                  <td>{item.start_date}</td>
                  <td>{item.end_date}</td>
                  <td>{item.reason}</td>
                  <td>
                    <span className={`badge ${item.status === '已通过' ? 'badge-success' : item.status === '待审核' ? 'badge-warning' : 'badge-error'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    {item.status === '待审核' && (
                      <>
                        <button className="btn btn-sm btn-success" onClick={() => handleAudit(item.id, '已通过')}>
                          通过
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleAudit(item.id, '已驳回')} style={{ marginLeft: '4px' }}>
                          驳回
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

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>新增异地就医备案</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>参保人ID</label>
                  <input required value={formData.insured_person_id} onChange={e => setFormData({...formData, insured_person_id: e.target.value})} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>备案类型</label>
                    <select value={formData.record_type} onChange={e => setFormData({...formData, record_type: e.target.value})}>
                      <option value="异地就医备案">异地就医备案</option>
                      <option value="转诊转院">转诊转院</option>
                      <option value="异地安置">异地安置</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>转出地</label>
                    <input value={formData.from_area} onChange={e => setFormData({...formData, from_area: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>转入地</label>
                    <input value={formData.to_area} onChange={e => setFormData({...formData, to_area: e.target.value})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>开始日期</label>
                    <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>结束日期</label>
                    <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>申请原因</label>
                  <textarea value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} rows={3} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">提交</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default OffsiteList
