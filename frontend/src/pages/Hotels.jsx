import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Hotels() {
  const [hotels, setHotels] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', address: '', city: '', star_rating: 4 })
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [showRoomForm, setShowRoomForm] = useState(false)
  const [roomForm, setRoomForm] = useState({ name: '', bed_type: '大床', max_guests: 2, area: 30 })

  useEffect(() => {
    loadHotels()
  }, [])

  const loadHotels = async () => {
    const res = await axios.get('/api/hotels')
    setHotels(res.data.data)
  }

  const loadRooms = async (hotelId) => {
    const res = await axios.get(`/api/rooms?hotel_id=${hotelId}`)
    setRooms(res.data.data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await axios.post('/api/hotels', formData)
    setFormData({ name: '', address: '', city: '', star_rating: 4 })
    setShowForm(false)
    loadHotels()
  }

  const handleRoomSubmit = async (e) => {
    e.preventDefault()
    await axios.post('/api/rooms', { ...roomForm, hotel_id: selectedHotel.id })
    setRoomForm({ name: '', bed_type: '大床', max_guests: 2, area: 30 })
    setShowRoomForm(false)
    loadRooms(selectedHotel.id)
  }

  const selectHotel = async (hotel) => {
    setSelectedHotel(hotel)
    loadRooms(hotel.id)
  }

  const deleteHotel = async (id) => {
    if (confirm('确定删除此酒店？')) {
      await axios.delete(`/api/hotels/${id}`)
      loadHotels()
      if (selectedHotel?.id === id) setSelectedHotel(null)
    }
  }

  const deleteRoom = async (id) => {
    if (confirm('确定删除此房型？')) {
      await axios.delete(`/api/rooms/${id}`)
      loadRooms(selectedHotel.id)
    }
  }

  return (
    <div>
      <div className="header">
        <h1>🏢 酒店房型管理</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ 添加酒店</button>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-header"><h2>添加酒店</h2></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>酒店名称</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>城市</label>
                  <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label>地址</label>
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="form-group">
                <label>星级</label>
                <select value={formData.star_rating} onChange={e => setFormData({...formData, star_rating: parseInt(e.target.value)})}>
                  {[3,4,5].map(s => <option key={s} value={s}>{s}星</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary">保存</button>
              <button type="button" className="btn" style={{marginLeft: 8}} onClick={() => setShowForm(false)}>取消</button>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><h2>酒店列表</h2></div>
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>酒店名称</th>
                <th>城市</th>
                <th>星级</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {hotels.map(h => (
                <tr key={h.id} onClick={() => selectHotel(h)} style={{cursor: 'pointer', background: selectedHotel?.id === h.id ? '#e3f2fd' : ''}}>
                  <td>{h.name}</td>
                  <td>{h.city}</td>
                  <td>{h.star_rating}星</td>
                  <td>{h.created_at?.split('T')[0]}</td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={e => {e.stopPropagation(); deleteHotel(h.id)}}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedHotel && (
        <div className="card">
          <div className="card-header">
            <h2>{selectedHotel.name} - 房型列表</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowRoomForm(true)}>+ 添加房型</button>
          </div>
          <div className="card-body">
            {showRoomForm && (
              <form onSubmit={handleRoomSubmit} style={{marginBottom: 20, padding: 16, background: '#f8f9fa', borderRadius: 4}}>
                <div className="form-row">
                  <div className="form-group">
                    <label>房型名称</label>
                    <input type="text" value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>床型</label>
                    <select value={roomForm.bed_type} onChange={e => setRoomForm({...roomForm, bed_type: e.target.value})}>
                      <option>大床</option>
                      <option>双床</option>
                      <option>单人床</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>入住人数</label>
                    <input type="number" value={roomForm.max_guests} onChange={e => setRoomForm({...roomForm, max_guests: parseInt(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label>面积(㎡)</label>
                    <input type="number" value={roomForm.area} onChange={e => setRoomForm({...roomForm, area: parseInt(e.target.value)})} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-sm">保存</button>
                <button type="button" className="btn btn-sm" style={{marginLeft: 8}} onClick={() => setShowRoomForm(false)}>取消</button>
              </form>
            )}
            <table>
              <thead>
                <tr>
                  <th>房型名称</th>
                  <th>床型</th>
                  <th>入住人数</th>
                  <th>面积</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.bed_type}</td>
                    <td>{r.max_guests}人</td>
                    <td>{r.area}㎡</td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteRoom(r.id)}>删除</button>
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
