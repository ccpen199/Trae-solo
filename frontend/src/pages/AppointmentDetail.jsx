import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { appointmentAPI, transportAPI, recordAPI, feeAPI } from '../api'

export default function AppointmentDetail({ user }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [appointment, setAppointment] = useState(null)
  const [transport, setTransport] = useState(null)
  const [record, setRecord] = useState(null)
  const [fee, setFee] = useState(null)
  const [activeTab, setActiveTab] = useState('info')

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [aptRes, transRes, recRes, feeRes] = await Promise.all([
        appointmentAPI.getAppointment(id),
        transportAPI.getTasks({ appointment_id: id }).catch(() => ({ data: null })),
        recordAPI.getRecords({ appointment_id: id }).catch(() => ({ data: null })),
        feeAPI.getFees({ appointment_id: id }).catch(() => ({ data: null }))
      ])
      setAppointment(aptRes.data)
      const transportList = transRes?.data?.items || transRes?.data
      setTransport(Array.isArray(transportList) ? transportList[0] : transportList)
      const recordList = recRes?.data?.items || recRes?.data
      setRecord(Array.isArray(recordList) ? recordList[0] : recordList)
      const feeList = feeRes?.data?.items || feeRes?.data
      setFee(Array.isArray(feeList) ? feeList[0] : feeList)
    } catch (err) {
      setError('加载预约详情失败，请刷新重试')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      checked_in: 'badge-primary',
      in_progress: 'badge-primary',
      completed: 'badge-success',
      cancelled: 'badge-danger'
    }
    const labels = {
      pending: '待确认',
      confirmed: '已确认',
      checked_in: '已签到',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消'
    }
    return { className: badges[status] || 'badge-secondary', label: labels[status] || status }
  }

  const getStatusTimeline = () => {
    const flow = [
      { key: 'pending', label: '创建预约', time: appointment?.created_at },
      { key: 'confirmed', label: '确认预约', time: appointment?.confirmed_at },
      { key: 'checked_in', label: '已签到', time: appointment?.checked_in_at },
      { key: 'in_progress', label: '服务中', time: appointment?.started_at },
      { key: 'completed', label: '已完成', time: appointment?.completed_at }
    ]
    const statusOrder = ['pending', 'confirmed', 'checked_in', 'in_progress', 'completed']
    const currentIndex = statusOrder.indexOf(appointment?.status)
    return flow.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }))
  }

  const getTransportStatusBadge = (status) => {
    const badges = {
      pending: 'badge-secondary',
      assigned: 'badge-info',
      picking_up: 'badge-warning',
      arrived: 'badge-primary',
      delivering: 'badge-warning',
      completed: 'badge-success',
      cancelled: 'badge-danger'
    }
    const labels = {
      pending: '待分配',
      assigned: '已分配',
      picking_up: '接驾中',
      arrived: '已到达',
      delivering: '送回中',
      completed: '已完成',
      cancelled: '已取消'
    }
    return { className: badges[status] || 'badge-secondary', label: labels[status] || status }
  }

  const handleConfirm = async () => {
    try {
      await appointmentAPI.confirmAppointment(id, {})
      fetchData()
    } catch (err) {
      setError(err.response?.data?.error || '确认失败，请重试')
    }
  }

  const handleCancel = async () => {
    if (!confirm('确定要取消这个预约吗？')) return
    try {
      await appointmentAPI.cancelAppointment(id, { reason: '用户取消' })
      fetchData()
    } catch (err) {
      setError(err.response?.data?.error || '取消失败，请重试')
    }
  }

  const handleCheckIn = async () => {
    try {
      await appointmentAPI.checkIn(id)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.error || '签到失败，请重试')
    }
  }

  const handleCheckOut = async () => {
    try {
      await appointmentAPI.checkOut(id)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.error || '签出失败，请重试')
    }
  }

  const handlePayFee = async (feeId) => {
    try {
      await feeAPI.payFee(feeId, { method: 'online' })
      fetchData()
    } catch (err) {
      setError(err.response?.data?.error || '支付失败，请重试')
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="card">
        <div className="empty-state">
          <h3>预约不存在</h3>
          <button className="btn btn-primary" onClick={() => navigate('/appointments')}>
            返回列表
          </button>
        </div>
      </div>
    )
  }

  const badge = getStatusBadge(appointment.status)
  const timeline = getStatusTimeline()

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>预约详情</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
            预约编号: {appointment.order_no || appointment.id}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {appointment.status === 'pending' && (
            <>
              <button className="btn btn-success" onClick={handleConfirm}>
                确认预约
              </button>
              <button className="btn btn-danger" onClick={handleCancel}>
                取消预约
              </button>
            </>
          )}
          {appointment.status === 'confirmed' && (
            <>
              <button className="btn btn-primary" onClick={handleCheckIn}>
                签到
              </button>
              <button className="btn btn-danger" onClick={handleCancel}>
                取消预约
              </button>
            </>
          )}
          {appointment.status === 'in_progress' && (
            <>
              <button className="btn btn-primary" onClick={() => navigate(`/progress/${id}`)}>
                查看进度
              </button>
              <button className="btn btn-success" onClick={handleCheckOut}>
                完成服务
              </button>
            </>
          )}
          <button className="btn btn-secondary" onClick={() => navigate('/appointments')}>
            返回列表
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ marginBottom: '8px' }}>{appointment.service_name || appointment.service_type}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              🐾 {appointment.pet_name || '未知宠物'} · 📅 {dayjs(appointment.appointment_time).format('YYYY-MM-DD HH:mm')}
            </p>
          </div>
          <span className={`badge ${badge.className}`} style={{ fontSize: '14px', padding: '6px 14px' }}>
            {badge.label}
          </span>
        </div>

        <div className="timeline">
          {timeline.map((step, idx) => (
            <div
              key={step.key}
              className={`timeline-item ${step.completed ? 'completed' : 'pending'}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: step.current ? 600 : 400, color: step.current ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {step.label}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {step.time ? dayjs(step.time).format('YYYY-MM-DD HH:mm') : '--'}
                </span>
              </div>
            </div>
          ))}
          {appointment.status === 'cancelled' && (
            <div className="timeline-item completed">
              <span style={{ color: 'var(--danger-color)', fontWeight: 600 }}>
                已取消
              </span>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {appointment.cancel_reason || '用户取消'}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          <div className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>预约信息</div>
          <div className={`tab ${activeTab === 'transport' ? 'active' : ''}`} onClick={() => setActiveTab('transport')}>接送任务</div>
          <div className={`tab ${activeTab === 'record' ? 'active' : ''}`} onClick={() => setActiveTab('record')}>服务记录</div>
          <div className={`tab ${activeTab === 'fee' ? 'active' : ''}`} onClick={() => setActiveTab('fee')}>费用单</div>
        </div>

        {activeTab === 'info' && (
          <div className="grid grid-2">
            <div>
              <div className="form-group">
                <label style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>服务类型</label>
                <div style={{ fontWeight: 500 }}>{appointment.service_name || appointment.service_type}</div>
              </div>
              <div className="form-group">
                <label style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>宠物信息</label>
                <div style={{ fontWeight: 500 }}>{appointment.pet_name || '-'}</div>
              </div>
              <div className="form-group">
                <label style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>预约时间</label>
                <div style={{ fontWeight: 500 }}>{dayjs(appointment.appointment_time).format('YYYY-MM-DD HH:mm')}</div>
              </div>
              <div className="form-group">
                <label style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>服务时长</label>
                <div style={{ fontWeight: 500 }}>{appointment.duration || 60}分钟</div>
              </div>
            </div>
            <div>
              <div className="form-group">
                <label style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>是否接送</label>
                <div style={{ fontWeight: 500 }}>{appointment.need_transport ? '是' : '否'}</div>
              </div>
              {appointment.need_transport && (
                <div className="form-group">
                  <label style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>接送地址</label>
                  <div style={{ fontWeight: 500 }}>{appointment.transport_address || '-'}</div>
                </div>
              )}
              <div className="form-group">
                <label style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>服务人员</label>
                <div style={{ fontWeight: 500 }}>{appointment.staff_name || '未分配'}</div>
              </div>
              <div className="form-group">
                <label style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>备注</label>
                <div style={{ fontWeight: 500 }}>{appointment.notes || '-'}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transport' && (
          <div>
            {!transport ? (
              <div className="empty-state">
                <h3>暂无接送任务</h3>
                <p>该预约不包含接送服务</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                      任务编号: {transport.task_no || transport.id}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      司机: {transport.driver_name || '未分配'}
                    </div>
                  </div>
                  <span className={`badge ${getTransportStatusBadge(transport.status).className}`}>
                    {getTransportStatusBadge(transport.status).label}
                  </span>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>出发地</label>
                    <div style={{ fontWeight: 500 }}>{transport.pickup_address || '-'}</div>
                  </div>
                  <div className="form-group">
                    <label style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>目的地</label>
                    <div style={{ fontWeight: 500 }}>{transport.dropoff_address || '-'}</div>
                  </div>
                </div>
                {transport.estimated_arrival_time && (
                  <div className="form-group">
                    <label style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>预计到达时间</label>
                    <div style={{ fontWeight: 500 }}>
                      {dayjs(transport.estimated_arrival_time).format('YYYY-MM-DD HH:mm')}
                    </div>
                  </div>
                )}
                {transport.actual_arrival_time && (
                  <div className="form-group">
                    <label style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>实际到达时间</label>
                    <div style={{ fontWeight: 500 }}>
                      {dayjs(transport.actual_arrival_time).format('YYYY-MM-DD HH:mm')}
                    </div>
                  </div>
                )}
                {transport.notes && (
                  <div className="form-group">
                    <label style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>备注</label>
                    <div style={{ fontWeight: 500 }}>{transport.notes}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'record' && (
          <div>
            {!record ? (
              <div className="empty-state">
                <h3>暂无服务记录</h3>
                <p>服务开始后将生成服务记录</p>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                    服务记录编号: {record.record_no || record.id}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    服务人员: {record.staff_name || '-'}
                  </div>
                </div>
                {record.steps && record.steps.length > 0 && (
                  <div className="form-group">
                    <label style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>服务步骤</label>
                    <div className="timeline">
                      {record.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className={`timeline-item ${step.completed ? 'completed' : 'pending'}`}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: step.completed ? 500 : 400 }}>
                              {step.name}
                            </span>
                            {step.completed_at && (
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {dayjs(step.completed_at).format('HH:mm')}
                              </span>
                            )}
                          </div>
                          {step.notes && (
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              {step.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {record.photos && record.photos.length > 0 && (
                  <div className="form-group">
                    <label style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>服务照片</label>
                    <div className="photo-grid">
                      {record.photos.map((photo, idx) => (
                        <div key={idx} className="photo-item">
                          <img src={photo.url} alt={`服务照片 ${idx + 1}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {record.exceptions && record.exceptions.length > 0 && (
                  <div className="form-group">
                    <label style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>异常情况</label>
                    {record.exceptions.map((ex, idx) => (
                      <div key={idx} className="alert alert-warning" style={{ marginBottom: '8px' }}>
                        <strong>{ex.type}:</strong> {ex.description}
                      </div>
                    ))}
                  </div>
                )}
                {record.notes && (
                  <div className="form-group">
                    <label style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>服务备注</label>
                    <div style={{ fontWeight: 500 }}>{record.notes}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'fee' && (
          <div>
            {!fee ? (
              <div className="empty-state">
                <h3>暂无费用单</h3>
                <p>服务完成后将生成费用单</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                      费用单编号: {fee.fee_no || fee.id}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      生成时间: {dayjs(fee.created_at).format('YYYY-MM-DD HH:mm')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary-color)' }}>
                      ¥{fee.total_amount || 0}
                    </div>
                    <span className={`badge ${fee.status === 'paid' ? 'badge-success' : fee.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                      {fee.status === 'paid' ? '已支付' : fee.status === 'pending' ? '待支付' : '已取消'}
                    </span>
                  </div>
                </div>

                <table className="table">
                  <thead>
                    <tr>
                      <th>项目</th>
                      <th>单价</th>
                      <th>数量</th>
                      <th>金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(fee.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name}</td>
                        <td>¥{item.price || 0}</td>
                        <td>{item.quantity || 1}</td>
                        <td>¥{item.amount || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                  {fee.discount > 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'right', fontWeight: 500 }}>优惠</td>
                        <td style={{ color: 'var(--success-color)' }}>-¥{fee.discount || 0}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '4px' }}>
                      合计: ¥{fee.total_amount || 0}
                    </div>
                    {fee.status === 'pending' && (
                      <button className="btn btn-primary" onClick={() => handlePayFee(fee.id)}>
                        立即支付
                      </button>
                    )}
                  </div>
                </div>

                {fee.paid_at && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      支付时间: {dayjs(fee.paid_at).format('YYYY-MM-DD HH:mm')}
                    </div>
                    {fee.payment_method && (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        支付方式: {fee.payment_method === 'online' ? '线上支付' : '线下支付'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
