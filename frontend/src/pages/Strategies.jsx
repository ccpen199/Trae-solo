import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Strategies() {
  const [strategies, setStrategies] = useState([])
  const [tasks, setTasks] = useState([])
  const [activeTab, setActiveTab] = useState('strategy')
  const [showForm, setShowForm] = useState(false)
  const [rooms, setRooms] = useState([])
  const [formData, setFormData] = useState({
    room_type_id: '',
    target_price_difference: -10,
    target_difference_percent: '',
    promotion_suggestion: '',
    alert_threshold: 20,
    alert_threshold_percent: 5
  })
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    const roomsRes = await axios.get('/api/rooms')
    setRooms(roomsRes.data.data)

    if (activeTab === 'strategy') {
      const res = await axios.get('/api/strategies')
      setStrategies(res.data.data)
    } else {
      const res = await axios.get('/api/strategies/tasks')
      setTasks(res.data.data)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await axios.post('/api/strategies', formData)
    setShowForm(false)
    loadData()
  }

  const confirmStrategy = async (id) => {
    await axios.post(`/api/strategies/${id}/confirm`, { confirmed_by: 'admin' })
    loadData()
  }

  const generateTasks = async () => {
    if (confirm('确定根据当前比价结果生成调价任务？')) {
      await axios.post('/api/strategies/tasks/generate', { checkin_date: selectedDate })
      loadData()
    }
  }

  const executeTask = async (id) => {
    if (confirm('确定执行此调价任务？')) {
      await axios.post(`/api/strategies/tasks/${id}/execute`, { executed_by: 'admin' })
      loadData()
    }
  }

  const deleteStrategy = async (id) => {
    if (confirm('确定删除此策略？')) {
      await axios.delete(`/api/strategies/${id}`)
      loadData()
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      confirmed: 'badge-success',
      pending: 'badge-warning',
      executed: 'badge-success'
    }
    const labels = { confirmed: '已确认', pending: '待确认', executed: '已执行' }
    return <span className={`badge ${badges[status]}`}>{labels[status]}</span>
  }

  return (
    <div>
      <div className="header">
        <h1>📈 价格策略</h1>
        {activeTab === 'strategy' && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ 添加策略</button>}
        {activeTab === 'task' && (
          <div style={{display: 'flex', gap: 8}}>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{padding: '8px 12px', borderRadius: 4, border: '1px solid #ddd'}} />
            <button className="btn btn-warning" onClick={generateTasks}>生成调价任务</button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-body" style={{display: 'flex', gap: 8}}>
          <button className={`btn ${activeTab === 'strategy' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('strategy')}>策略配置</button>
          <button className={`btn ${activeTab === 'task' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('task')}>调价任务 ({tasks.length})</button>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-header"><h2>添加价格策略</h2></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>房型</label>
                <select value={formData.room_type_id} onChange={e => setFormData({...formData, room_type_id: e.target.value})} required>
                  <option value="">请选择</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.hotel_name} - {r.name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>目标价差（元，负数表示比竞品低）</label>
                  <input type="number" value={formData.target_price_difference} onChange={e => setFormData({...formData, target_price_difference: parseFloat(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>目标价差率（%）</label>
                  <input type="number" step="0.1" value={formData.target_difference_percent} onChange={e => setFormData({...formData, target_difference_percent: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>促销建议</label>
                <textarea value={formData.promotion_suggestion} onChange={e => setFormData({...formData, promotion_suggestion: e.target.value})} placeholder="如：建议推出周末连住特惠" rows="3" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>告警阈值（元）</label>
                  <input type="number" value={formData.alert_threshold} onChange={e => setFormData({...formData, alert_threshold: parseFloat(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>告警阈值率（%）</label>
                  <input type="number" step="0.1" value={formData.alert_threshold_percent} onChange={e => setFormData({...formData, alert_threshold_percent: parseFloat(e.target.value)})} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">保存</button>
              <button type="button" className="btn" style={{marginLeft: 8}} onClick={() => setShowForm(false)}>取消</button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'strategy' && (
        <div className="card">
          <div className="card-body">
            <table>
              <thead>
                <tr>
                  <th>酒店</th>
                  <th>房型</th>
                  <th>目标价差</th>
                  <th>告警阈值</th>
                  <th>促销建议</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {strategies.map(s => (
                  <tr key={s.id}>
                    <td>{s.hotel_name}</td>
                    <td>{s.room_name}</td>
                    <td>{s.target_price_difference}元</td>
                    <td>{s.alert_threshold}元</td>
                    <td>{s.promotion_suggestion || '-'}</td>
                    <td>{getStatusBadge(s.status)}</td>
                    <td>
                      {s.status === 'pending' && (
                        <button className="btn btn-sm btn-success" onClick={() => confirmStrategy(s.id)}>确认</button>
                      )}
                      <button className="btn btn-sm btn-danger" style={{marginLeft: 4}} onClick={() => deleteStrategy(s.id)}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'task' && (
        <div className="card">
          <div className="card-body">
            <table>
              <thead>
                <tr>
                  <th>酒店</th>
                  <th>房型</th>
                  <th>建议价格</th>
                  <th>原因</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id}>
                    <td>{t.hotel_name}</td>
                    <td>{t.room_name}</td>
                    <td><strong>¥{t.suggested_price}</strong></td>
                    <td>{t.reason}</td>
                    <td>{getStatusBadge(t.status)}</td>
                    <td>{t.created_at?.slice(0, 16)}</td>
                    <td>
                      {t.status === 'pending' && (
                        <button className="btn btn-sm btn-success" onClick={() => executeTask(t.id)}>执行</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
