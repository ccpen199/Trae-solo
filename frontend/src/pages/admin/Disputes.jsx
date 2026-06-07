import React, { useState, useEffect } from 'react'
import api from '../../api'

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([])
  const [selectedDispute, setSelectedDispute] = useState(null)
  const [result, setResult] = useState('')

  useEffect(() => {
    loadDisputes()
  }, [])

  const loadDisputes = () => {
    api.get('/admin/disputes').then(res => setDisputes(res.data))
  }

  const handleResolve = async (id) => {
    try {
      await api.put(`/admin/disputes/${id}/resolve`, { result })
      setSelectedDispute(null)
      setResult('')
      loadDisputes()
    } catch (err) {
      alert('操作失败')
    }
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '24px' }}>纠纷管理</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {disputes.map(dispute => (
          <div key={dispute.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '18px', margin: 0 }}>{dispute.order_title}</h3>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: dispute.status === 'pending' ? '#fef3c7' : '#dcfce7',
                    color: dispute.status === 'pending' ? '#d97706' : '#15803d'
                  }}>
                    {dispute.status === 'pending' ? '待处理' : '已处理'}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                  投诉人: {dispute.complainant_name} · 被投诉人: {dispute.respondent_name}
                </div>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--gray-500)' }}>
                {new Date(dispute.created_at).toLocaleString()}
              </div>
            </div>
            <div style={{ padding: '12px', background: 'var(--gray-50)', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>纠纷原因: {dispute.reason}</div>
              <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>{dispute.description}</div>
              <div style={{ fontSize: '14px', color: 'var(--danger)', marginTop: '8px' }}>
                冻结金额: ¥{dispute.frozen_amount}
              </div>
            </div>
            {dispute.status === 'pending' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <select
                  className="form-input"
                  style={{ flex: 1 }}
                  value={selectedDispute === dispute.id ? result : ''}
                  onChange={(e) => { setSelectedDispute(dispute.id); setResult(e.target.value) }}
                >
                  <option value="">选择处理结果</option>
                  <option value="refund_client">退款给客户</option>
                  <option value="pay_provider">付款给服务者</option>
                  <option value="split">双方分摊</option>
                </select>
                <button
                  className="btn btn-primary"
                  onClick={() => handleResolve(dispute.id)}
                  disabled={selectedDispute !== dispute.id || !result}
                >
                  处理
                </button>
              </div>
            )}
            {dispute.status === 'resolved' && (
              <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                处理结果: {dispute.result}
              </div>
            )}
          </div>
        ))}
      </div>

      {disputes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
          暂无纠纷
        </div>
      )}
    </div>
  )
}
