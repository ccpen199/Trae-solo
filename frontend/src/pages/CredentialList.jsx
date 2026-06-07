import React, { useState, useEffect } from 'react'
import { credentialApi, insuredApi } from '../services/api.js'

function CredentialList() {
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [insuredList, setInsuredList] = useState([])
  const [selectedPersonId, setSelectedPersonId] = useState('')

  useEffect(() => {
    loadData()
  }, [page])

  const loadData = async () => {
    try {
      const data = await credentialApi.getList({ page, pageSize })
      setList(data.list)
      setTotal(data.total)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const loadInsuredList = async () => {
    try {
      const data = await insuredApi.getList({ page: 1, pageSize: 100 })
      setInsuredList(data.list)
    } catch (error) {
      console.error('加载参保人列表失败:', error)
    }
  }

  const handleOpenModal = () => {
    loadInsuredList()
    setShowModal(true)
  }

  const handleCreate = async () => {
    if (!selectedPersonId) {
      alert('请选择参保人')
      return
    }
    try {
      await credentialApi.create({ insured_person_id: selectedPersonId })
      setShowModal(false)
      setSelectedPersonId('')
      loadData()
    } catch (error) {
      alert('创建失败: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await credentialApi.updateStatus(id, status)
      loadData()
    } catch (error) {
      console.error('状态更新失败:', error)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <div className="header">
        <h1>🎫 医保电子凭证</h1>
        <button className="btn btn-primary" onClick={handleOpenModal}>
          + 签发新凭证
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>凭证号</th>
                <th>参保人</th>
                <th>身份证号</th>
                <th>生物特征</th>
                <th>签发日期</th>
                <th>有效期至</th>
                <th>最后使用</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={9} style={{textAlign:'center',padding:'24px',color:'#8c8c8c'}}>暂无数据</td></tr>
              ) : list.map(item => (
                <tr key={item.id}>
                  <td style={{ fontFamily: 'monospace' }}>{item.credential_number}</td>
                  <td>{item.name}</td>
                  <td>{item.id_card}</td>
                  <td>{item.biometric_hash ? <span className="badge badge-info">已绑定</span> : <span className="badge badge-default">未绑定</span>}</td>
                  <td>{item.issued_at?.slice(0, 10)}</td>
                  <td>{item.expires_at}</td>
                  <td>{item.last_used_at?.slice(0, 10) || '-'}</td>
                  <td>
                    <span className={`badge ${item.status === '有效' ? 'badge-success' : item.status === '冻结' ? 'badge-warning' : 'badge-error'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    {item.status === '有效' && (
                      <button className="btn btn-sm btn-warning" onClick={() => handleStatusChange(item.id, '冻结')}>
                        冻结
                      </button>
                    )}
                    {item.status === '冻结' && (
                      <button className="btn btn-sm btn-success" onClick={() => handleStatusChange(item.id, '有效')}>
                        解冻
                      </button>
                    )}
                    {item.status === '失效' && (
                      <button className="btn btn-sm btn-default" onClick={() => handleStatusChange(item.id, '有效')}>
                        重新激活
                      </button>
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
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>签发电子凭证</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>选择参保人</label>
                <select value={selectedPersonId} onChange={e => setSelectedPersonId(e.target.value)}>
                  <option value="">-- 请选择参保人 --</option>
                  {insuredList.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.id_card}) - {item.medical_card_number}
                    </option>
                  ))}
                </select>
              </div>
              {selectedPersonId && (
                <div style={{marginTop:'12px',padding:'12px',background:'#f6f8fa',borderRadius:'4px',fontSize:'13px',color:'#595959'}}>
                  <p>📌 签发后将自动生成：</p>
                  <ul style={{marginLeft:'16px',marginTop:'8px'}}>
                    <li>唯一凭证编号</li>
                    <li>二维码数据（用于扫码核验）</li>
                    <li>生物特征加密绑定</li>
                    <li>有效期1年</li>
                  </ul>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!selectedPersonId}>确认签发</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CredentialList
