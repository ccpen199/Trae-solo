import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Mappings() {
  const [activeTab, setActiveTab] = useState('hotel')
  const [hotelMappings, setHotelMappings] = useState([])
  const [roomMappings, setRoomMappings] = useState([])
  const [channels, setChannels] = useState([])
  const [hotels, setHotels] = useState([])
  const [rooms, setRooms] = useState([])
  const [showHotelForm, setShowHotelForm] = useState(false)
  const [showRoomForm, setShowRoomForm] = useState(false)
  const [hotelForm, setHotelForm] = useState({ channel_id: '', channel_hotel_id: '', channel_hotel_name: '', hotel_id: '', confidence: 0.5 })
  const [roomForm, setRoomForm] = useState({ hotel_mapping_id: '', channel_room_id: '', channel_room_name: '', room_type_id: '', breakfast: '', cancellation_policy: '', bed_type: '', confidence: 0.5 })
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadData()
  }, [activeTab, statusFilter])

  const loadData = async () => {
    const [channelsRes, hotelsRes] = await Promise.all([
      axios.get('/api/mappings/channels'),
      axios.get('/api/hotels')
    ])
    setChannels(channelsRes.data.data)
    setHotels(hotelsRes.data.data)

    if (activeTab === 'hotel') {
      const res = await axios.get(`/api/mappings/hotels${statusFilter ? `?status=${statusFilter}` : ''}`)
      setHotelMappings(res.data.data)
    } else {
      const res = await axios.get(`/api/mappings/rooms${statusFilter ? `?status=${statusFilter}` : ''}`)
      setRoomMappings(res.data.data)
    }
  }

  const loadRooms = async (hotelId) => {
    const res = await axios.get(`/api/rooms?hotel_id=${hotelId}`)
    setRooms(res.data.data)
  }

  const handleHotelSubmit = async (e) => {
    e.preventDefault()
    await axios.post('/api/mappings/hotels', hotelForm)
    setShowHotelForm(false)
    loadData()
  }

  const handleRoomSubmit = async (e) => {
    e.preventDefault()
    await axios.post('/api/mappings/rooms', roomForm)
    setShowRoomForm(false)
    loadData()
  }

  const confirmHotelMapping = async (id, hotelId) => {
    await axios.post(`/api/mappings/hotels/${id}/confirm`, { hotel_id: hotelId })
    loadData()
  }

  const confirmRoomMapping = async (id, roomId) => {
    await axios.post(`/api/mappings/rooms/${id}/confirm`, { room_type_id: roomId })
    loadData()
  }

  const rejectMapping = async (type, id) => {
    await axios.post(`/api/mappings/${type}/${id}/reject`)
    loadData()
  }

  const getStatusBadge = (status) => {
    const badges = {
      confirmed: 'badge-success',
      pending: 'badge-warning',
      rejected: 'badge-danger'
    }
    const labels = { confirmed: '已确认', pending: '待确认', rejected: '已拒绝' }
    return <span className={`badge ${badges[status]}`}>{labels[status]}</span>
  }

  return (
    <div>
      <div className="header">
        <h1>🔗 映射管理</h1>
        <div>
          {activeTab === 'hotel' && <button className="btn btn-primary" onClick={() => setShowHotelForm(true)}>+ 添加酒店映射</button>}
          {activeTab === 'room' && <button className="btn btn-primary" onClick={() => setShowRoomForm(true)}>+ 添加房型映射</button>}
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{display: 'flex', gap: 16, alignItems: 'center'}}>
          <div style={{display: 'flex', gap: 8}}>
            <button className={`btn ${activeTab === 'hotel' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('hotel')}>酒店映射</button>
            <button className={`btn ${activeTab === 'room' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('room')}>房型映射</button>
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{padding: '6px 12px', borderRadius: 4, border: '1px solid #ddd'}}>
            <option value="">全部状态</option>
            <option value="pending">待确认</option>
            <option value="confirmed">已确认</option>
            <option value="rejected">已拒绝</option>
          </select>
        </div>
      </div>

      {showHotelForm && (
        <div className="card">
          <div className="card-header"><h2>添加酒店映射</h2></div>
          <div className="card-body">
            <form onSubmit={handleHotelSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>渠道</label>
                  <select value={hotelForm.channel_id} onChange={e => setHotelForm({...hotelForm, channel_id: e.target.value})} required>
                    <option value="">请选择</option>
                    {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>渠道酒店ID</label>
                  <input type="text" value={hotelForm.channel_hotel_id} onChange={e => setHotelForm({...hotelForm, channel_hotel_id: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label>渠道酒店名称</label>
                <input type="text" value={hotelForm.channel_hotel_name} onChange={e => setHotelForm({...hotelForm, channel_hotel_name: e.target.value})} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>匹配酒店（可选，直接确认）</label>
                  <select value={hotelForm.hotel_id} onChange={e => setHotelForm({...hotelForm, hotel_id: e.target.value})}>
                    <option value="">待确认</option>
                    {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>匹配置信度</label>
                  <input type="number" step="0.1" min="0" max="1" value={hotelForm.confidence} onChange={e => setHotelForm({...hotelForm, confidence: parseFloat(e.target.value)})} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">保存</button>
              <button type="button" className="btn" style={{marginLeft: 8}} onClick={() => setShowHotelForm(false)}>取消</button>
            </form>
          </div>
        </div>
      )}

      {showRoomForm && (
        <div className="card">
          <div className="card-header"><h2>添加房型映射</h2></div>
          <div className="card-body">
            <form onSubmit={handleRoomSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>酒店映射</label>
                  <select value={roomForm.hotel_mapping_id} onChange={e => setRoomForm({...roomForm, hotel_mapping_id: e.target.value})} required>
                    <option value="">请选择</option>
                    {hotelMappings.filter(m => m.status === 'confirmed').map(m => <option key={m.id} value={m.id}>{m.channel_hotel_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>渠道房型ID</label>
                  <input type="text" value={roomForm.channel_room_id} onChange={e => setRoomForm({...roomForm, channel_room_id: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label>渠道房型名称</label>
                <input type="text" value={roomForm.channel_room_name} onChange={e => setRoomForm({...roomForm, channel_room_name: e.target.value})} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>早餐</label>
                  <input type="text" value={roomForm.breakfast} onChange={e => setRoomForm({...roomForm, breakfast: e.target.value})} placeholder="如：含双早" />
                </div>
                <div className="form-group">
                  <label>取消政策</label>
                  <input type="text" value={roomForm.cancellation_policy} onChange={e => setRoomForm({...roomForm, cancellation_policy: e.target.value})} placeholder="如：免费取消" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>床型</label>
                  <input type="text" value={roomForm.bed_type} onChange={e => setRoomForm({...roomForm, bed_type: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>匹配房型（可选，直接确认）</label>
                  <select value={roomForm.room_type_id} onChange={e => setRoomForm({...roomForm, room_type_id: e.target.value})}>
                    <option value="">待确认</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary">保存</button>
              <button type="button" className="btn" style={{marginLeft: 8}} onClick={() => setShowRoomForm(false)}>取消</button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'hotel' && (
        <div className="card">
          <div className="card-body">
            <table>
              <thead>
                <tr>
                  <th>渠道</th>
                  <th>渠道酒店</th>
                  <th>匹配酒店</th>
                  <th>置信度</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {hotelMappings.map(m => (
                  <tr key={m.id}>
                    <td>{m.channel_name}</td>
                    <td>{m.channel_hotel_name}</td>
                    <td>{m.hotel_name || '-'}</td>
                    <td>{(m.confidence * 100).toFixed(0)}%</td>
                    <td>{getStatusBadge(m.status)}</td>
                    <td>
                      {m.status === 'pending' && (
                        <>
                          <select style={{padding: '2px 6px', marginRight: 4}} onChange={e => e.target.value && confirmHotelMapping(m.id, e.target.value)}>
                            <option value="">确认匹配</option>
                            {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                          </select>
                          <button className="btn btn-sm btn-danger" onClick={() => rejectMapping('hotels', m.id)}>拒绝</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'room' && (
        <div className="card">
          <div className="card-body">
            <table>
              <thead>
                <tr>
                  <th>渠道</th>
                  <th>渠道房型</th>
                  <th>早餐</th>
                  <th>取消政策</th>
                  <th>匹配房型</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {roomMappings.map(m => (
                  <tr key={m.id}>
                    <td>{m.channel_name}</td>
                    <td>{m.channel_room_name}</td>
                    <td>{m.breakfast || '-'}</td>
                    <td>{m.cancellation_policy || '-'}</td>
                    <td>{m.room_name || '-'}</td>
                    <td>{getStatusBadge(m.status)}</td>
                    <td>
                      {m.status === 'pending' && (
                        <>
                          <select style={{padding: '2px 6px', marginRight: 4}} onClick={e => loadRooms(hotels[0]?.id)} onChange={e => e.target.value && confirmRoomMapping(m.id, e.target.value)}>
                            <option value="">确认匹配</option>
                            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                          <button className="btn btn-sm btn-danger" onClick={() => rejectMapping('rooms', m.id)}>拒绝</button>
                        </>
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
