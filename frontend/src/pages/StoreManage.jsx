import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { serviceAPI } from '../api'

const serviceTypeMap = {
  grooming: '美容洗护',
  boarding: '寄养服务',
  training: '训练服务',
  medical: '医疗服务',
  other: '其他服务'
}

const roomTypeMap = {
  single: '单人间',
  double: '双人间',
  suite: '豪华套房',
  cat_room: '猫咪专用'
}

export default function StoreManage({ user }) {
  const [activeTab, setActiveTab] = useState('services')
  const [services, setServices] = useState([])
  const [rooms, setRooms] = useState([])
  const [consumables, setConsumables] = useState([])
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showRoomModal, setShowRoomModal] = useState(false)
  const [showConsumableModal, setShowConsumableModal] = useState(false)
  const [showSlotModal, setShowSlotModal] = useState(false)
  const [serviceForm, setServiceForm] = useState({
    name: '',
    type: 'grooming',
    description: '',
    price: '',
    duration: '',
    max_pets: '1'
  })
  const [roomForm, setRoomForm] = useState({
    name: '',
    type: 'single',
    description: '',
    price_per_day: '',
    max_pets: '1',
    facilities: ''
  })
  const [consumableForm, setConsumableForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '0',
    unit: '瓶'
  })
  const [slotForm, setSlotForm] = useState({
    service_id: '',
    date: '',
    start_time: '',
    end_time: '',
    max_bookings: '3'
  })
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))

  useEffect(() => {
    fetchData()
  }, [activeTab, selectedDate])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      if (activeTab === 'services') {
        const res = await serviceAPI.getServices()
        setServices(res.data)
      } else if (activeTab === 'rooms') {
        const res = await serviceAPI.getRooms()
        setRooms(res.data)
      } else if (activeTab === 'consumables') {
        const res = await serviceAPI.getConsumables()
        setConsumables(res.data)
      } else if (activeTab === 'slots') {
        if (services.length === 0) {
          const res = await serviceAPI.getServices()
          setServices(res.data)
        }
        if (services.length > 0) {
          const firstServiceId = slotForm.service_id || services[0]?.id
          const res = await serviceAPI.getServiceSlots(firstServiceId, selectedDate)
          setSlots(res.data)
        }
      }
    } catch (err) {
      setError('加载数据失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateService = async () => {
    if (!serviceForm.name || !serviceForm.price) return
    setActionLoading(true)
    try {
      await serviceAPI.createService({
        ...serviceForm,
        price: parseFloat(serviceForm.price),
        duration: parseInt(serviceForm.duration),
        max_pets: parseInt(serviceForm.max_pets)
      })
      setShowServiceModal(false)
      setServiceForm({ name: '', type: 'grooming', description: '', price: '', duration: '', max_pets: '1' })
      fetchData()
    } catch (err) {
      setError(err.response?.data?.error || '创建失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateRoom = async () => {
    if (!roomForm.name || !roomForm.price_per_day) return
    setActionLoading(true)
    try {
      await serviceAPI.createRoom({
        ...roomForm,
        price_per_day: parseFloat(roomForm.price_per_day),
        max_pets: parseInt(roomForm.max_pets),
        facilities: roomForm.facilities.split(',').map(f => f.trim()).filter(f => f)
      })
      setShowRoomModal(false)
      setRoomForm({ name: '', type: 'single', description: '', price_per_day: '', max_pets: '1', facilities: '' })
      fetchData()
    } catch (err) {
      setError(err.response?.data?.error || '创建失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateConsumable = async () => {
    if (!consumableForm.name || !consumableForm.price) return
    setActionLoading(true)
    try {
      await serviceAPI.createConsumable({
        ...consumableForm,
        price: parseFloat(consumableForm.price),
        stock: parseInt(consumableForm.stock)
      })
      setShowConsumableModal(false)
      setConsumableForm({ name: '', description: '', price: '', stock: '0', unit: '瓶' })
      fetchData()
    } catch (err) {
      setError(err.response?.data?.error || '创建失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateSlot = async () => {
    if (!slotForm.service_id || !slotForm.date || !slotForm.start_time || !slotForm.end_time) return
    setActionLoading(true)
    try {
      await serviceAPI.createSlot({
        ...slotForm,
        max_bookings: parseInt(slotForm.max_bookings)
      })
      setShowSlotModal(false)
      setSlotForm({ service_id: slotForm.service_id, date: '', start_time: '', end_time: '', max_bookings: '3' })
      fetchData()
    } catch (err) {
      setError(err.response?.data?.error || '创建失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleServiceChange = (e) => {
    setSlotForm(prev => ({ ...prev, service_id: e.target.value }))
  }

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2>🏪 门店管理</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="tabs">
          {[
            { key: 'services', label: `服务项目 (${services.length})` },
            { key: 'rooms', label: `寄养房间 (${rooms.length})` },
            { key: 'consumables', label: `耗材管理 (${consumables.length})` },
            { key: 'slots', label: '可约时段' }
          ].map((tab) => (
            <div
              key={tab.key}
              className={`tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {activeTab === 'services' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4>服务项目列表</h4>
              <button className="btn btn-primary btn-sm" onClick={() => setShowServiceModal(true)}>
                + 新增服务
              </button>
            </div>
            {services.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <h3>暂无服务项目</h3>
                <p>点击右上角添加服务项目</p>
              </div>
            ) : (
              <div className="grid grid-2">
                {services.map((service) => (
                  <div key={service.id} className="card" style={{ marginBottom: '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h5 style={{ fontSize: '16px', marginBottom: '4px' }}>{service.name}</h5>
                        <span className="badge badge-info">{serviceTypeMap[service.type] || service.type}</span>
                      </div>
                      <strong style={{ color: 'var(--primary-color)', fontSize: '18px' }}>¥{service.price}</strong>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
                      {service.description || '暂无描述'}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span>⏱ {service.duration}分钟</span>
                      <span>🐾 最多{service.max_pets}只宠物</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'rooms' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4>寄养房间列表</h4>
              <button className="btn btn-primary btn-sm" onClick={() => setShowRoomModal(true)}>
                + 新增房间
              </button>
            </div>
            {rooms.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <h3>暂无房间</h3>
                <p>点击右上角添加寄养房间</p>
              </div>
            ) : (
              <div className="grid grid-2">
                {rooms.map((room) => (
                  <div key={room.id} className="card" style={{ marginBottom: '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h5 style={{ fontSize: '16px', marginBottom: '4px' }}>{room.name}</h5>
                        <span className="badge badge-info">{roomTypeMap[room.type] || room.type}</span>
                      </div>
                      <strong style={{ color: 'var(--primary-color)', fontSize: '18px' }}>¥{room.price_per_day}/天</strong>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
                      {room.description || '暂无描述'}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <span>🐾 最多{room.max_pets}只宠物</span>
                    </div>
                    {room.facilities && room.facilities.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {room.facilities.map((f, idx) => (
                          <span key={idx} className="badge badge-secondary" style={{ fontSize: '11px' }}>
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'consumables' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4>耗材列表</h4>
              <button className="btn btn-primary btn-sm" onClick={() => setShowConsumableModal(true)}>
                + 新增耗材
              </button>
            </div>
            {consumables.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <h3>暂无耗材</h3>
                <p>点击右上角添加耗材</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>耗材名称</th>
                    <th>描述</th>
                    <th>单价</th>
                    <th>库存</th>
                    <th>单位</th>
                  </tr>
                </thead>
                <tbody>
                  {consumables.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: '500' }}>{c.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{c.description || '-'}</td>
                      <td>¥{c.price?.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${c.stock < 10 ? 'badge-danger' : c.stock < 50 ? 'badge-warning' : 'badge-success'}`}>
                          {c.stock}
                        </span>
                      </td>
                      <td>{c.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'slots' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <h4>可约时段</h4>
                <select
                  value={slotForm.service_id}
                  onChange={handleServiceChange}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                >
                  <option value="">选择服务</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => {
                if (slotForm.service_id) setShowSlotModal(true)
                else setError('请先选择服务')
              }}>
                + 新增时段
              </button>
            </div>
            {slots.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <h3>暂无可约时段</h3>
                <p>选择服务和日期后，点击右上角添加时段</p>
              </div>
            ) : (
              <div className="grid grid-4">
                {slots.map((slot) => (
                  <div key={slot.id} className="card" style={{ marginBottom: '0', textAlign: 'center' }}>
                    <h5 style={{ fontSize: '18px', marginBottom: '4px' }}>
                      {slot.start_time} - {slot.end_time}
                    </h5>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>
                      已预约: {slot.current_bookings || 0}/{slot.max_bookings}
                    </p>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${slot.current_bookings >= slot.max_bookings ? 'success' : ''}`}
                        style={{ width: `${((slot.current_bookings || 0) / slot.max_bookings) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showServiceModal && (
        <div className="modal-overlay" onClick={() => setShowServiceModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新增服务项目</h3>
              <button className="modal-close" onClick={() => setShowServiceModal(false)}>×</button>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>服务名称</label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入服务名称"
                  required
                />
              </div>
              <div className="form-group">
                <label>服务类型</label>
                <select
                  value={serviceForm.type}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  {Object.entries(serviceTypeMap).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>服务描述</label>
              <textarea
                value={serviceForm.description}
                onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入服务描述"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>价格（元）</label>
                <input
                  type="number"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>时长（分钟）</label>
                <input
                  type="number"
                  value={serviceForm.duration}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="60"
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>最多宠物数</label>
                <input
                  type="number"
                  value={serviceForm.max_pets}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, max_pets: e.target.value }))}
                  min="1"
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowServiceModal(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={handleCreateService}
                disabled={!serviceForm.name || !serviceForm.price || !serviceForm.duration || actionLoading}
              >
                {actionLoading ? '创建中...' : '确认创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRoomModal && (
        <div className="modal-overlay" onClick={() => setShowRoomModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新增寄养房间</h3>
              <button className="modal-close" onClick={() => setShowRoomModal(false)}>×</button>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>房间名称</label>
                <input
                  type="text"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入房间名称"
                  required
                />
              </div>
              <div className="form-group">
                <label>房间类型</label>
                <select
                  value={roomForm.type}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  {Object.entries(roomTypeMap).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>房间描述</label>
              <textarea
                value={roomForm.description}
                onChange={(e) => setRoomForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入房间描述"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>每日价格（元）</label>
                <input
                  type="number"
                  value={roomForm.price_per_day}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, price_per_day: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>最多宠物数</label>
                <input
                  type="number"
                  value={roomForm.max_pets}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, max_pets: e.target.value }))}
                  min="1"
                />
              </div>
            </div>
            <div className="form-group">
              <label>设施（用逗号分隔）</label>
              <input
                type="text"
                value={roomForm.facilities}
                onChange={(e) => setRoomForm(prev => ({ ...prev, facilities: e.target.value }))}
                placeholder="例如: 空调, 监控, 独立卫生间"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowRoomModal(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={handleCreateRoom}
                disabled={!roomForm.name || !roomForm.price_per_day || actionLoading}
              >
                {actionLoading ? '创建中...' : '确认创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConsumableModal && (
        <div className="modal-overlay" onClick={() => setShowConsumableModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新增耗材</h3>
              <button className="modal-close" onClick={() => setShowConsumableModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>耗材名称</label>
              <input
                type="text"
                value={consumableForm.name}
                onChange={(e) => setConsumableForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入耗材名称"
                required
              />
            </div>
            <div className="form-group">
              <label>描述</label>
              <textarea
                value={consumableForm.description}
                onChange={(e) => setConsumableForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入耗材描述"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>单价（元）</label>
                <input
                  type="number"
                  value={consumableForm.price}
                  onChange={(e) => setConsumableForm(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>库存数量</label>
                <input
                  type="number"
                  value={consumableForm.stock}
                  onChange={(e) => setConsumableForm(prev => ({ ...prev, stock: e.target.value }))}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>单位</label>
                <input
                  type="text"
                  value={consumableForm.unit}
                  onChange={(e) => setConsumableForm(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="瓶/袋/个"
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowConsumableModal(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={handleCreateConsumable}
                disabled={!consumableForm.name || !consumableForm.price || actionLoading}
              >
                {actionLoading ? '创建中...' : '确认创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSlotModal && (
        <div className="modal-overlay" onClick={() => setShowSlotModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新增可约时段</h3>
              <button className="modal-close" onClick={() => setShowSlotModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>服务项目</label>
              <select
                value={slotForm.service_id}
                onChange={(e) => setSlotForm(prev => ({ ...prev, service_id: e.target.value }))}
                required
              >
                <option value="">请选择服务</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>日期</label>
                <input
                  type="date"
                  value={slotForm.date}
                  onChange={(e) => setSlotForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>开始时间</label>
                <input
                  type="time"
                  value={slotForm.start_time}
                  onChange={(e) => setSlotForm(prev => ({ ...prev, start_time: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>结束时间</label>
                <input
                  type="time"
                  value={slotForm.end_time}
                  onChange={(e) => setSlotForm(prev => ({ ...prev, end_time: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>最大预约数</label>
              <input
                type="number"
                value={slotForm.max_bookings}
                onChange={(e) => setSlotForm(prev => ({ ...prev, max_bookings: e.target.value }))}
                min="1"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowSlotModal(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={handleCreateSlot}
                disabled={!slotForm.service_id || !slotForm.date || !slotForm.start_time || !slotForm.end_time || actionLoading}
              >
                {actionLoading ? '创建中...' : '确认创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
