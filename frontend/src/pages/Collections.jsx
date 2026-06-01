import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Collections() {
  const [collections, setCollections] = useState([])
  const [failed, setFailed] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ room_mapping_id: '', checkin_date: '', checkout_date: '', price: '', tax: '', inventory: '', promotion: '', promotion_discount: '' })
  const [roomMappings, setRoomMappings] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadData()
  }, [activeTab, page])

  const loadData = async () => {
    const roomRes = await axios.get('/api/mappings/rooms?status=confirmed')
    setRoomMappings(roomRes.data.data)

    if (activeTab === 'failed') {
      const res = await axios.get('/api/collections/failed')
      setFailed(res.data.data)
    } else {
      const res = await axios.get(`/api/collections?page=${page}&pageSize=20`)
      setCollections(res.data.data)
      setTotal(res.data.total)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await axios.post('/api/collections', formData)
    setShowForm(false)
    loadData()
  }

  const retryCollection = async (id) => {
    await axios.post(`/api/collections/${id}/retry`)
    loadData()
  }

  const getStatusBadge = (status) => {
    if (status === 'success') return <span className="badge badge-success">成功</span>
    return <span className="badge badge-danger">失败</span>
  }

  return (
    <div>
      <div className="header">
        <h1>📡 价格采集</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ 录入价格</button>
      </div>

      <div className="card">
        <div className="card-body" style={{display: 'flex', gap: 8}}>
          <button className={`btn ${activeTab === 'all' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('all')}>全部记录</button>
          <button className={`btn ${activeTab === 'failed' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('failed')}>采集失败 ({failed.length})</button>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-header"><h2>录入价格数据</h2></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>房型映射</label>
                  <select value={formData.room_mapping_id} onChange={e => setFormData({...formData, room_mapping_id: e.target.value})} required>
                    <option value="">请选择</option>
                    {roomMappings.map(m => <option key={m.id} value={m.id}>{m.channel_name} - {m.channel_room_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>入住日期</label>
                  <input type="date" value={formData.checkin_date} onChange={e => setFormData({...formData, checkin_date: e.target.value})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>离店日期</label>
                  <input type="date" value={formData.checkout_date} onChange={e => setFormData({...formData, checkout_date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>房价</label>
                  <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>税费</label>
                  <input type="number" value={formData.tax} onChange={e => setFormData({...formData, tax: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                  <label>库存</label>
                  <input type="number" value={formData.inventory} onChange={e => setFormData({...formData, inventory: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>促销活动</label>
                  <input type="text" value={formData.promotion} onChange={e => setFormData({...formData, promotion: e.target.value})} placeholder="如：限时特惠" />
                </div>
                <div className="form-group">
                  <label>折扣金额</label>
                  <input type="number" value={formData.promotion_discount} onChange={e => setFormData({...formData, promotion_discount: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">保存</button>
              <button type="button" className="btn" style={{marginLeft: 8}} onClick={() => setShowForm(false)}>取消</button>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>渠道</th>
                <th>房型</th>
                <th>入住日期</th>
                <th>房价</th>
                <th>税费</th>
                <th>总价</th>
                <th>库存</th>
                <th>促销</th>
                <th>状态</th>
                <th>采集时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'failed' ? failed : collections).map(c => (
                <tr key={c.id}>
                  <td>{c.channel_name}</td>
                  <td>{c.channel_room_name}</td>
                  <td>{c.checkin_date}</td>
                  <td>¥{c.price}</td>
                  <td>¥{c.tax}</td>
                  <td><strong>¥{c.total_price}</strong></td>
                  <td>{c.inventory}间</td>
                  <td>{c.promotion || '-'}</td>
                  <td>{getStatusBadge(c.collection_status)}</td>
                  <td>{c.collected_at?.slice(0, 16)}</td>
                  <td>
                    {c.collection_status !== 'success' && (
                      <button className="btn btn-sm btn-warning" onClick={() => retryCollection(c.id)}>重试 ({c.retry_count})</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {activeTab === 'all' && total > 20 && (
            <div className="pagination">
              {Array.from({length: Math.ceil(total / 20)}, (_, i) => (
                <button key={i} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
