import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { bill } from '../api'
import Header from '../components/Header'
import Loading from '../components/Loading'

function Bill() {
  const { showToast, setLoading } = useAppStore()
  const [cards, setCards] = useState([])
  const [bills, setBills] = useState([])
  const [activeTab, setActiveTab] = useState('cards')
  const [updatingCard, setUpdatingCard] = useState(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    fetchCreditCards()
    fetchBills()
  }, [])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const fetchCreditCards = async () => {
    try {
      const res = await bill.getCreditCards()
      if (res.success) {
        setCards(res.data || [])
      }
    } catch (error) {
      showToast('获取信用卡列表失败', 'error')
    }
  }

  const fetchBills = async () => {
    try {
      const res = await bill.getBills()
      if (res.success) {
        setBills(res.data || [])
      }
    } catch (error) {
      showToast('获取账单列表失败', 'error')
    }
  }

  const handleSendVerifyCode = async (cardId) => {
    try {
      await bill.sendUpdateCode(cardId)
      setUpdatingCard(cardId)
      setCountdown(60)
      showToast('验证码已发送', 'success')
    } catch (error) {
      showToast('发送验证码失败', 'error')
    }
  }

  const handleUpdateBill = async () => {
    if (!updatingCard || !verifyCode) {
      showToast('请输入验证码', 'error')
      return
    }

    try {
      setLoading(true)
      const res = await bill.updateBill({
        card_id: updatingCard,
        sms_code: verifyCode
      })

      if (res.success) {
        showToast('账单更新成功', 'success')
        setUpdatingCard(null)
        setVerifyCode('')
        fetchCreditCards()
        fetchBills()
      } else {
        showToast(res.message || '更新失败', 'error')
      }
    } catch (error) {
      showToast('更新失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <Header title="账单管理" />
      <div style={{ padding: '20px' }}>
        <div className="tabs">
          <div
            className={`tab ${activeTab === 'cards' ? 'active' : ''}`}
            onClick={() => setActiveTab('cards')}
          >
            信用卡
          </div>
          <div
            className={`tab ${activeTab === 'bills' ? 'active' : ''}`}
            onClick={() => setActiveTab('bills')}
          >
            账单列表
          </div>
        </div>

        {activeTab === 'cards' ? (
          <>
            {cards.length > 0 ? (
              cards.map((card) => (
                <div key={card.id} className="card">
                  <div className="flex-between" style={{ marginBottom: '12px' }}>
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                        {card.bank_name}
                      </p>
                      <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        {card.card_number}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '14px', color: '#999' }}>信用额度</p>
                      <p style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                        ¥{card.credit_limit?.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px 0',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#999' }}>已用</p>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#ff6b6b' }}>
                        ¥{card.used_limit?.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#999' }}>可用</p>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#52c41a' }}>
                        ¥{card.available_limit?.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#999' }}>账单日</p>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                        每月{card.bill_day || '-'}号
                      </p>
                    </div>
                  </div>

                  {updatingCard === card.id ? (
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid #f0f0f0'
                    }}>
                      <input
                        type="text"
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value)}
                        placeholder="请输入验证码"
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid #ddd',
                          borderRadius: '6px'
                        }}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={handleUpdateBill}
                        style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
                      >
                        确认更新
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      paddingTop: '12px',
                      borderTop: '1px solid #f0f0f0'
                    }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleSendVerifyCode(card.id)}
                        disabled={countdown > 0 && updatingCard === card.id}
                        style={{ padding: '8px 16px' }}
                      >
                        {countdown > 0 && updatingCard === card.id ? `${countdown}s后重新发送` : '更新账单'}
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="card empty-state">
                <div className="icon">💳</div>
                <p>暂无信用卡</p>
              </div>
            )}
          </>
        ) : (
          <>
            {bills.length > 0 ? (
              bills.map((bill) => (
                <div key={bill.id} className="card">
                  <div className="flex-between" style={{ marginBottom: '12px' }}>
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                        {bill.bill_month} 账单
                      </p>
                      <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        账单日: {bill.bill_date || '-'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: bill.is_paid ? '#52c41a' : '#ff6b6b'
                      }}>
                        ¥{bill.total_amount?.toFixed(2)}
                      </p>
                      <p style={{
                        fontSize: '12px',
                        color: bill.is_paid ? '#52c41a' : '#ff6b6b',
                        marginTop: '4px'
                      }}>
                        {bill.is_paid ? '已还清' : '待还款'}
                      </p>
                    </div>
                  </div>

                  {!bill.is_paid && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '12px',
                      borderTop: '1px solid #f0f0f0'
                    }}>
                      <div>
                        <p style={{ fontSize: '12px', color: '#999' }}>
                          最低还款: ¥{bill.min_repayment?.toFixed(2)}
                        </p>
                        <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                          还款日: {bill.repayment_date || '-'}
                        </p>
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '8px 20px' }}
                      >
                        立即还款
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="card empty-state">
                <div className="icon">📋</div>
                <p>暂无账单</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Bill
