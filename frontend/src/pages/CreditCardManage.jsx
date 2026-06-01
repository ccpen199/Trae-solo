import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { bill } from '../api'
import Header from '../components/Header'
import Loading from '../components/Loading'

function CreditCardManage() {
  const { showToast, setLoading } = useAppStore()
  const [cards, setCards] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    bank_name: '',
    card_number: '',
    credit_limit: '',
    bill_day: '',
    repayment_day: ''
  })

  useEffect(() => {
    fetchCreditCards()
  }, [])

  const fetchCreditCards = async () => {
    try {
      setLoading(true)
      const res = await bill.getCreditCards()
      if (res.success) {
        setCards(res.data || [])
      }
    } catch (error) {
      showToast('获取信用卡列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCard = async () => {
    if (!formData.bank_name) {
      showToast('请输入银行名称', 'error')
      return
    }
    if (!formData.card_number) {
      showToast('请输入卡号', 'error')
      return
    }

    try {
      setLoading(true)
      const res = await bill.addCreditCard({
        ...formData,
        credit_limit: parseFloat(formData.credit_limit) || 0,
        bill_day: parseInt(formData.bill_day) || null,
        repayment_day: parseInt(formData.repayment_day) || null
      })

      if (res.success) {
        showToast('添加成功', 'success')
        setShowAddModal(false)
        setFormData({
          bank_name: '',
          card_number: '',
          credit_limit: '',
          bill_day: '',
          repayment_day: ''
        })
        fetchCreditCards()
      } else {
        showToast(res.message || '添加失败', 'error')
      }
    } catch (error) {
      showToast('添加失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('确定要删除这张信用卡吗？')) {
      return
    }

    try {
      const res = await bill.deleteCreditCard(cardId)
      if (res.success) {
        showToast('删除成功', 'success')
        fetchCreditCards()
      } else {
        showToast(res.message || '删除失败', 'error')
      }
    } catch (error) {
      showToast('删除失败', 'error')
    }
  }

  return (
    <div className="page">
      <Header title="信用卡管理" />
      <div style={{ padding: '20px' }}>
        {cards.length > 0 ? (
          cards.map((card) => (
            <div key={card.id} className="card">
              <div className="flex-between" style={{ marginBottom: '16px', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                    {card.bank_name}
                  </h4>
                  <p style={{ fontSize: '14px', color: '#999', marginTop: '4px' }}>
                    {card.card_number}
                  </p>
                </div>
                <button
                  style={{
                    padding: '4px 12px',
                    border: 'none',
                    background: '#fff1f0',
                    color: '#ff4d4f',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleDeleteCard(card.id)}
                >
                  删除
                </button>
              </div>

              <div style={{
                display: 'flex',
                gap: '20px',
                paddingTop: '16px',
                borderTop: '1px solid #f0f0f0'
              }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#999' }}>信用额度</p>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                    ¥{card.credit_limit?.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#999' }}>已使用</p>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#ff6b6b' }}>
                    ¥{card.used_limit?.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#999' }}>可用</p>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#52c41a' }}>
                    ¥{card.available_limit?.toFixed(2)}
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '20px',
                paddingTop: '12px',
                marginTop: '12px',
                borderTop: '1px solid #f0f0f0'
              }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#999' }}>账单日</p>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                    {card.bill_day ? `每月${card.bill_day}日` : '-'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#999' }}>还款日</p>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                    {card.repayment_day ? `每月${card.repayment_day}日` : '-'}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card empty-state">
            <div className="icon">💳</div>
            <p>暂无信用卡</p>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
              点击下方按钮添加您的信用卡
            </p>
          </div>
        )}

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: '20px' }}
          onClick={() => setShowAddModal(true)}
        >
          添加信用卡
        </button>

        {showAddModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="card" style={{
              width: '90%',
              maxWidth: '400px',
              margin: 0,
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', textAlign: 'center' }}>
                添加信用卡
              </h3>

              <div className="input-group">
                <label>银行名称</label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="请输入银行名称"
                />
              </div>
              <div className="input-group">
                <label>卡号</label>
                <input
                  type="text"
                  value={formData.card_number}
                  onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                  placeholder="请输入卡号"
                />
              </div>
              <div className="input-group">
                <label>信用额度（元）</label>
                <input
                  type="number"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                  placeholder="请输入信用额度"
                />
              </div>
              <div className="input-group">
                <label>账单日（1-31）</label>
                <input
                  type="number"
                  value={formData.bill_day}
                  onChange={(e) => setFormData({ ...formData, bill_day: e.target.value })}
                  placeholder="请输入账单日"
                />
              </div>
              <div className="input-group">
                <label>还款日（1-31）</label>
                <input
                  type="number"
                  value={formData.repayment_day}
                  onChange={(e) => setFormData({ ...formData, repayment_day: e.target.value })}
                  placeholder="请输入还款日"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowAddModal(false)}
                >
                  取消
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleAddCard}
                >
                  确认添加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreditCardManage
