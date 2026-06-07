import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '../store'
import api from '../api'

const statusLabels = {
  pending_confirm: '待确认',
  confirmed: '已确认',
  in_progress: '进行中',
  delivered: '待验收',
  completed: '已完成',
  disputed: '纠纷中',
  cancelled: '已取消'
}

export default function OrderDetail() {
  const { id } = useParams()
  const { user } = useStore()
  const [order, setOrder] = useState(null)
  const [showDispute, setShowDispute] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeDesc, setDisputeDesc] = useState('')

  useEffect(() => {
    api.get(`/orders/${id}`).then(res => setOrder(res.data))
  }, [id])

  const handleAction = async (action) => {
    try {
      await api.post(`/orders/${id}/${action}`)
      const res = await api.get(`/orders/${id}`)
      setOrder(res.data)
    } catch (err) {
      alert('操作失败')
    }
  }

  const handleDispute = async () => {
    try {
      await api.post(`/orders/${id}/dispute`, {
        reason: disputeReason,
        description: disputeDesc
      })
      alert('纠纷已提交')
      setShowDispute(false)
      const res = await api.get(`/orders/${id}`)
      setOrder(res.data)
    } catch (err) {
      alert('提交失败')
    }
  }

  const getTimeline = () => {
    if (!order) return []
    const statusOrder = ['pending_confirm', 'confirmed', 'in_progress', 'pending_delivery', 'pending_accept', 'completed']
    const currentIdx = statusOrder.indexOf(order.status)
    const isDisputed = order.status === 'disputed'
    
    return [
      { title: '预约下单', desc: '需求方提交订单', time: order.created_at, completed: true },
      { title: '预约确认', desc: '服务者确认接单', time: currentIdx >= 1 ? order.updated_at : null, completed: currentIdx >= 1, active: currentIdx === 0 },
      { title: '现场打卡', desc: '服务者到达服务现场', time: order.checkin_time, completed: currentIdx >= 2, active: currentIdx === 1 },
      { title: '服务交付', desc: '服务者提交交付物', time: order.checkout_time, completed: currentIdx >= 3, active: currentIdx === 2 },
      { title: '验收确认', desc: '需求方确认验收', time: currentIdx >= 5 ? order.updated_at : null, completed: currentIdx >= 5, active: currentIdx === 4 },
      { title: '分阶段付款', desc: '定金+尾款分步到账', time: currentIdx >= 5 ? order.updated_at : null, completed: currentIdx >= 5, active: false },
    ].concat(isDisputed ? [{ title: '纠纷仲裁', desc: '平台介入处理', time: order.updated_at, completed: true, active: true }] : [])
  }

  if (!order) {
    return <div className="container" style={{ padding: '40px' }}>加载中...</div>
  }

  const isClient = user && user.id === order.client_id
  const isProvider = user && user.id === order.provider_id

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div>
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>{order.title}</h1>
                <div style={{ color: 'var(--gray-600)' }}>订单号: #{order.id}</div>
              </div>
              <span className={`status-badge status-${order.status === 'delivered' ? 'matched' : order.status}`}>
                {statusLabels[order.status] || order.status}
              </span>
            </div>
            <p style={{ color: 'var(--gray-700)', whiteSpace: 'pre-wrap' }}>{order.description}</p>
          </div>

          <div className="card" style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>服务进度</h2>
            <div style={{ position: 'relative' }}>
              {getTimeline().map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '24px', position: 'relative' }}>
                  {i < getTimeline().length - 1 && (
                    <div style={{ position: 'absolute', left: '15px', top: '32px', width: '2px', height: '20px', background: item.completed ? '#10b981' : '#e5e7eb' }} />
                  )}
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: item.completed ? '#10b981' : item.active ? '#3b82f6' : '#e5e7eb',
                    color: item.completed || item.active ? 'white' : '#9ca3af',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: '600', flexShrink: 0, zIndex: 1
                  }}>
                    {item.completed ? '✓' : i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', color: item.completed ? '#15803d' : item.active ? '#1d4ed8' : 'var(--gray-500)' }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: '12px', color: item.completed ? '#10b981' : 'var(--gray-400)' }}>
                        {item.time ? new Date(item.time).toLocaleString() : '待完成'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '2px' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {order.delivery_note && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>交付内容</h2>
              <p style={{ color: 'var(--gray-700)' }}>{order.delivery_note}</p>
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>分阶段付款</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: order.status === 'completed' || order.status === 'pending_accept' || order.status === 'in_progress' || order.status === 'pending_delivery' ? '#f0fdf4' : 'var(--gray-50)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>定金 ({order.deposit_amount ? Math.round(order.deposit_amount / order.total_amount * 100) : 30}%)</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>确认订单后支付</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '600', color: 'var(--success)' }}>¥{order.deposit_amount}</div>
                  <div style={{ fontSize: '12px', color: order.status === 'pending_confirm' ? '#dc2626' : '#10b981' }}>
                    {order.status === 'pending_confirm' ? '待支付' : '已支付'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: order.status === 'completed' ? '#f0fdf4' : 'var(--gray-50)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>尾款 ({order.deposit_amount ? 100 - Math.round(order.deposit_amount / order.total_amount * 100) : 70}%)</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>验收通过后支付</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '600', color: order.status === 'completed' ? 'var(--success)' : 'var(--gray-400)' }}>¥{order.total_amount - order.deposit_amount}</div>
                  <div style={{ fontSize: '12px', color: order.status === 'completed' ? '#10b981' : '#dc2626' }}>
                    {order.status === 'completed' ? '已支付' : '待支付'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {order.status === 'disputed' && (
            <div className="card" style={{ marginBottom: '24px', border: '1px solid #fecaca' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#dc2626' }}>⚠ 纠纷仲裁中</h3>
              <div style={{ fontSize: '14px', color: 'var(--gray-600)', lineHeight: '1.6' }}>
                <div>• 平台已介入处理</div>
                <div>• 涉事款项已冻结</div>
                <div>• 服务者信用分暂时冻结</div>
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#dc2626' }}>冻结金额: ¥{order.total_amount}</div>
              </div>
            </div>
          )}

          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>服务信息</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div>📍 {order.service_address || '未设置'}</div>
              <div>📅 {order.service_date ? new Date(order.service_date).toLocaleString() : '未设置'}</div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>订单操作</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {order.status === 'pending_confirm' && (
                <button className="btn btn-primary" onClick={() => handleAction('confirm')}>
                  确认订单
                </button>
              )}
              {isProvider && order.status === 'confirmed' && (
                <button className="btn btn-primary" onClick={() => handleAction('checkin')}>
                  现场打卡
                </button>
              )}
              {isProvider && order.status === 'in_progress' && (
                <button className="btn btn-primary" onClick={() => handleAction('deliver')}>
                  提交交付
                </button>
              )}
              {isClient && order.status === 'delivered' && (
                <button className="btn btn-success" onClick={() => handleAction('accept')}>
                  确认验收
                </button>
              )}
              {order.status !== 'completed' && order.status !== 'disputed' && order.status !== 'cancelled' && (
                <button className="btn btn-outline" onClick={() => setShowDispute(true)}>
                  申请纠纷
                </button>
              )}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>双方信息</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'var(--gray-200)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontWeight: '600'
                }}>
                  {order.client_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '500' }}>{order.client_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>需求方</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'var(--gray-200)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontWeight: '600'
                }}>
                  {order.provider_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '500' }}>{order.provider_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>服务方</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDispute && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
            <h3 style={{ marginBottom: '20px' }}>申请纠纷仲裁</h3>
            <div className="form-group">
              <label className="form-label">纠纷原因</label>
              <select
                className="form-input"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
              >
                <option value="">请选择原因</option>
                <option value="quality">服务质量问题</option>
                <option value="delay">未按时交付</option>
                <option value="communication">沟通问题</option>
                <option value="other">其他原因</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">详细描述</label>
              <textarea
                className="form-input"
                rows={4}
                value={disputeDesc}
                onChange={(e) => setDisputeDesc(e.target.value)}
                placeholder="请详细描述纠纷情况..."
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowDispute(false)}>
                取消
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleDispute}>
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
