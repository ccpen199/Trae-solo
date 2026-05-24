import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { feeAPI } from '../api'

const statusMap = {
  pending: { label: '待支付', className: 'badge-warning' },
  paid: { label: '已支付', className: 'badge-success' },
  disputed: { label: '争议中', className: 'badge-danger' },
  resolved: { label: '已解决', className: 'badge-info' },
  adjusted: { label: '已调整', className: 'badge-secondary' },
  cancelled: { label: '已取消', className: 'badge-secondary' }
}

export default function Fees({ user }) {
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [showPayModal, setShowPayModal] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [selectedFee, setSelectedFee] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('wechat')
  const [disputeReason, setDisputeReason] = useState('')
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [resolveNote, setResolveNote] = useState('')
  const [resolveAction, setResolveAction] = useState('maintain')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchFees()
  }, [filter])

  const fetchFees = async () => {
    setLoading(true)
    setError('')
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const res = await feeAPI.getFees(params)
      setFees(res.data)
    } catch (err) {
      setError('加载费用单失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handlePay = (fee) => {
    setSelectedFee(fee)
    setPaymentMethod('wechat')
    setShowPayModal(true)
  }

  const submitPay = async () => {
    setActionLoading(true)
    try {
      await feeAPI.payFee(selectedFee.id, {
        payment_method: paymentMethod,
        paid_amount: selectedFee.total_amount
      })
      setShowPayModal(false)
      fetchFees()
    } catch (err) {
      setError(err.response?.data?.error || '支付失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDispute = (fee) => {
    setSelectedFee(fee)
    setDisputeReason('')
    setShowDisputeModal(true)
  }

  const submitDispute = async () => {
    if (!disputeReason.trim()) return
    setActionLoading(true)
    try {
      await feeAPI.disputeFee(selectedFee.id, {
        reason: disputeReason
      })
      setShowDisputeModal(false)
      fetchFees()
    } catch (err) {
      setError(err.response?.data?.error || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResolve = (fee) => {
    setSelectedFee(fee)
    setResolveNote('')
    setResolveAction('maintain')
    setShowResolveModal(true)
  }

  const submitResolve = async () => {
    if (!resolveNote.trim()) return
    setActionLoading(true)
    try {
      await feeAPI.resolveDispute(selectedFee.id, {
        action: resolveAction,
        note: resolveNote
      })
      setShowResolveModal(false)
      fetchFees()
    } catch (err) {
      setError(err.response?.data?.error || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAdjust = (fee) => {
    setSelectedFee(fee)
    setAdjustAmount(fee.total_amount.toString())
    setAdjustReason('')
    setShowAdjustModal(true)
  }

  const submitAdjust = async () => {
    if (!adjustAmount || !adjustReason.trim()) return
    setActionLoading(true)
    try {
      await feeAPI.adjustFee(selectedFee.id, {
        new_amount: parseFloat(adjustAmount),
        reason: adjustReason
      })
      setShowAdjustModal(false)
      fetchFees()
    } catch (err) {
      setError(err.response?.data?.error || '调整失败')
    } finally {
      setActionLoading(false)
    }
  }

  const renderActions = (fee) => {
    const isAdmin = user?.role === 'admin' || user?.role === 'store'
    const isOwner = user?.role === 'owner'

    switch (fee.status) {
      case 'pending':
        return (
          <div style={{ display: 'flex', gap: '6px' }}>
            {isOwner && (
              <button
                className="btn btn-success btn-sm"
                onClick={() => handlePay(fee)}
                disabled={actionLoading}
              >
                支付
              </button>
            )}
            {isOwner && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDispute(fee)}
                disabled={actionLoading}
              >
                争议
              </button>
            )}
            {isAdmin && (
              <button
                className="btn btn-warning btn-sm"
                onClick={() => handleAdjust(fee)}
                disabled={actionLoading}
              >
                调整
              </button>
            )}
          </div>
        )
      case 'disputed':
        return (
          <div style={{ display: 'flex', gap: '6px' }}>
            {isAdmin && (
              <button
                className="btn btn-info btn-sm"
                onClick={() => handleResolve(fee)}
                disabled={actionLoading}
              >
                处理争议
              </button>
            )}
          </div>
        )
      default:
        return null
    }
  }

  const totalAmount = fees.reduce((sum, f) => sum + (f.status === 'paid' ? f.total_amount : 0), 0)
  const pendingAmount = fees.reduce((sum, f) => sum + (f.status === 'pending' ? f.total_amount : 0), 0)

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
        <h2>💰 费用管理</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-2">
        <div className="stat-card" style={{ borderLeftColor: 'var(--success-color)' }}>
          <h3>已收金额</h3>
          <div className="value">¥{totalAmount.toFixed(2)}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--warning-color)' }}>
          <h3>待收金额</h3>
          <div className="value">¥{pendingAmount.toFixed(2)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>费用单列表</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'pending', 'paid', 'disputed', 'resolved'].map((f) => (
              <button
                key={f}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? '全部' : statusMap[f]?.label}
              </button>
            ))}
          </div>
        </div>

        {fees.length === 0 ? (
          <div className="empty-state">
            <h3>暂无费用单</h3>
            <p>当前没有费用单</p>
          </div>
        ) : (
          <div className="list">
            {fees.map((fee) => (
              <div key={fee.id} className="list-item">
                <div className="list-item-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <strong>{fee.description}</strong>
                    <span className={`badge ${statusMap[fee.status]?.className}`}>
                      {statusMap[fee.status]?.label}
                    </span>
                    <span className="badge badge-info">
                      ¥{fee.total_amount?.toFixed(2)}
                    </span>
                  </div>
                  <p style={{ marginBottom: '4px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    📋 关联预约: {fee.appointment_id ? `#${fee.appointment_id}` : '无'}
                  </p>
                  <p style={{ marginBottom: '4px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    👤 用户: {fee.user_name}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    创建时间: {dayjs(fee.created_at).format('YYYY-MM-DD HH:mm')}
                  </p>
                  {fee.payment_method && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      支付方式: {fee.payment_method === 'wechat' ? '微信支付' : fee.payment_method === 'alipay' ? '支付宝' : '现金'}
                    </p>
                  )}
                  {fee.dispute_reason && (
                    <p style={{ color: 'var(--danger-color)', fontSize: '13px', marginTop: '4px' }}>
                      争议原因: {fee.dispute_reason}
                    </p>
                  )}
                  {fee.adjust_reason && (
                    <p style={{ color: 'var(--warning-color)', fontSize: '13px', marginTop: '4px' }}>
                      调整原因: {fee.adjust_reason}
                    </p>
                  )}
                </div>
                <div className="list-item-actions">
                  {renderActions(fee)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>确认支付</h3>
              <button className="modal-close" onClick={() => setShowPayModal(false)}>×</button>
            </div>
            <p style={{ marginBottom: '16px', fontSize: '16px' }}>
              支付金额: <strong style={{ color: 'var(--primary-color)' }}>¥{selectedFee?.total_amount?.toFixed(2)}</strong>
            </p>
            <div className="form-group">
              <label>支付方式</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                required
              >
                <option value="wechat">微信支付</option>
                <option value="alipay">支付宝</option>
                <option value="cash">现金</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowPayModal(false)}>取消</button>
              <button className="btn btn-success" onClick={submitPay} disabled={actionLoading}>
                {actionLoading ? '支付中...' : '确认支付'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDisputeModal && (
        <div className="modal-overlay" onClick={() => setShowDisputeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>发起争议</h3>
              <button className="modal-close" onClick={() => setShowDisputeModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>争议原因</label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="请详细说明争议原因..."
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowDisputeModal(false)}>取消</button>
              <button
                className="btn btn-danger"
                onClick={submitDispute}
                disabled={!disputeReason.trim() || actionLoading}
              >
                {actionLoading ? '提交中...' : '确认提交'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResolveModal && (
        <div className="modal-overlay" onClick={() => setShowResolveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>处理争议</h3>
              <button className="modal-close" onClick={() => setShowResolveModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>处理方式</label>
              <select
                value={resolveAction}
                onChange={(e) => setResolveAction(e.target.value)}
                required
              >
                <option value="maintain">维持原判</option>
                <option value="refund">全额退款</option>
                <option value="partial_refund">部分退款</option>
                <option value="adjust">调整金额</option>
              </select>
            </div>
            <div className="form-group">
              <label>处理说明</label>
              <textarea
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                placeholder="请说明处理结果..."
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowResolveModal(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={submitResolve}
                disabled={!resolveNote.trim() || actionLoading}
              >
                {actionLoading ? '处理中...' : '确认处理'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdjustModal && (
        <div className="modal-overlay" onClick={() => setShowAdjustModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>调整费用</h3>
              <button className="modal-close" onClick={() => setShowAdjustModal(false)}>×</button>
            </div>
            <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              原金额: ¥{selectedFee?.total_amount?.toFixed(2)}
            </p>
            <div className="form-group">
              <label>新金额</label>
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="请输入新的费用金额"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label>调整原因</label>
              <textarea
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="请说明调整原因..."
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>取消</button>
              <button
                className="btn btn-warning"
                onClick={submitAdjust}
                disabled={!adjustAmount || !adjustReason.trim() || actionLoading}
              >
                {actionLoading ? '调整中...' : '确认调整'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
