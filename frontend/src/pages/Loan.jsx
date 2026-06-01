import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { loan } from '../api'
import Header from '../components/Header'
import Loading from '../components/Loading'

function Loan() {
  const { showToast, setLoading } = useAppStore()
  const [products, setProducts] = useState([])
  const [myLoans, setMyLoans] = useState([])
  const [activeTab, setActiveTab] = useState('products')
  const [verificationStatus, setVerificationStatus] = useState({
    real_name_verified: false,
    operator_verified: false,
    phone_bound: false
  })
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verifyType, setVerifyType] = useState('real_name')
  const [verifyForm, setVerifyForm] = useState({
    real_name: '',
    id_card: '',
    phone: '',
    verify_code: ''
  })
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    fetchProducts()
    fetchMyLoans()
    fetchVerificationStatus()
  }, [])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const fetchProducts = async () => {
    try {
      const res = await loan.getProducts()
      if (res.success) {
        setProducts(res.data || [])
      }
    } catch (error) {
      showToast('获取贷款产品失败', 'error')
    }
  }

  const fetchMyLoans = async () => {
    try {
      const res = await loan.getMyLoans()
      if (res.success) {
        setMyLoans(res.data || [])
      }
    } catch (error) {
      showToast('获取贷款记录失败', 'error')
    }
  }

  const fetchVerificationStatus = async () => {
    try {
      const res = await loan.getVerificationStatus()
      if (res.success) {
        setVerificationStatus(res.data)
      }
    } catch (error) {
      // 静默失败
    }
  }

  const handleApply = async (product) => {
    if (!verificationStatus.real_name_verified) {
      setVerifyType('real_name')
      setShowVerifyModal(true)
      return
    }

    if (!verificationStatus.operator_verified) {
      setVerifyType('operator')
      setShowVerifyModal(true)
      return
    }

    try {
      setLoading(true)
      const res = await loan.apply({
        loan_amount: product.min_amount,
        term_months: 12,
        purpose: '日常消费'
      })

      if (res.success) {
        showToast('借款申请提交成功', 'success')
        fetchMyLoans()
      } else {
        showToast(res.message || '申请失败', 'error')
      }
    } catch (error) {
      showToast('申请失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    try {
      setLoading(true)
      let res

      if (verifyType === 'real_name') {
        res = await loan.verifyRealName({
          real_name: verifyForm.real_name,
          id_card: verifyForm.id_card
        })
      } else {
        res = await loan.verifyOperator({
          phone: verifyForm.phone,
          verify_code: verifyForm.verify_code
        })
      }

      if (res.success) {
        showToast('认证成功', 'success')
        setShowVerifyModal(false)
        fetchVerificationStatus()
      } else {
        showToast(res.message || '认证失败', 'error')
      }
    } catch (error) {
      showToast('认证失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSendVerifyCode = async () => {
    if (!verifyForm.phone) {
      showToast('请输入手机号', 'error')
      return
    }

    setCountdown(60)
    showToast('验证码已发送', 'success')
  }

  return (
    <div className="page">
      <Header title="借钱" />
      <div style={{ padding: '20px' }}>
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            marginBottom: '20px'
          }}
        >
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '12px' }}>
              可用额度（元）
            </p>
            <p style={{ fontSize: '40px', fontWeight: '600' }}>200,000.00</p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '40px',
              marginTop: '20px'
            }}>
              <div>
                <p style={{ fontSize: '12px', opacity: 0.9 }}>日利率</p>
                <p style={{ fontSize: '16px', fontWeight: '500', marginTop: '4px' }}>0.02%</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', opacity: 0.9 }}>最快到账</p>
                <p style={{ fontSize: '16px', fontWeight: '500', marginTop: '4px' }}>1分钟</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 className="section-title">认证状态</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="flex-between" style={{ alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#333' }}>实名认证</span>
              <span style={{
                fontSize: '12px',
                color: verificationStatus.real_name_verified ? '#52c41a' : '#ff6b6b'
              }}>
                {verificationStatus.real_name_verified ? '已认证 ✓' : '未认证'}
              </span>
            </div>
            <div className="flex-between" style={{ alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#333' }}>运营商认证</span>
              <span style={{
                fontSize: '12px',
                color: verificationStatus.operator_verified ? '#52c41a' : '#ff6b6b'
              }}>
                {verificationStatus.operator_verified ? '已认证 ✓' : '未认证'}
              </span>
            </div>
          </div>
        </div>

        <div className="tabs">
          <div
            className={`tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            贷款产品
          </div>
          <div
            className={`tab ${activeTab === 'myLoans' ? 'active' : ''}`}
            onClick={() => setActiveTab('myLoans')}
          >
            我的借款
          </div>
        </div>

        {activeTab === 'products' ? (
          <>
            {products.length > 0 ? (
              products.map((product) => (
                <div key={product.id} className="card">
                  <div className="flex-between" style={{ marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                        {product.name}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        {product.description}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '22px', fontWeight: '600', color: '#ff6b6b' }}>
                        {product.interest_rate * 100}%
                      </p>
                      <p style={{ fontSize: '12px', color: '#999' }}>年利率</p>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '20px',
                    padding: '12px 0',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#999' }}>额度范围</p>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                        ¥{product.min_amount} - {product.max_amount}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#999' }}>期限范围</p>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                        {product.min_term} - {product.max_term}期
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    paddingTop: '12px',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleApply(product)}
                      style={{ padding: '8px 20px' }}
                    >
                      立即申请
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="card empty-state">
                <div className="icon">💵</div>
                <p>暂未贷款产品</p>
              </div>
            )}
          </>
        ) : (
          <>
            {myLoans.length > 0 ? (
              myLoans.map((loan) => (
                <div key={loan.id} className="card">
                  <div className="flex-between" style={{ marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                        借款 ¥{loan.loan_amount?.toFixed(2)}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        申请时间: {loan.applied_at}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: loan.status === 'pending' ? '#faad14' : '#52c41a'
                      }}>
                        {loan.status === 'pending' ? '审核中' : '已放款'}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '20px',
                    paddingTop: '12px',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#999' }}>期数</p>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                        {loan.term_months}期
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#999' }}>月供</p>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                        ¥{loan.monthly_payment?.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#999' }}>总利息</p>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#ff6b6b' }}>
                        ¥{loan.total_interest?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card empty-state">
                <div className="icon">📋</div>
                <p>暂无借款记录</p>
              </div>
            )}
          </>
        )}

        {showVerifyModal && (
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
              margin: 0
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', textAlign: 'center' }}>
                {verifyType === 'real_name' ? '实名认证' : '运营商认证'}
              </h3>

              {verifyType === 'real_name' ? (
                <>
                  <div className="input-group">
                    <label>真实姓名</label>
                    <input
                      type="text"
                      value={verifyForm.real_name}
                      onChange={(e) => setVerifyForm({ ...verifyForm, real_name: e.target.value })}
                      placeholder="请输入真实姓名"
                    />
                  </div>
                  <div className="input-group">
                    <label>身份证号</label>
                    <input
                      type="text"
                      value={verifyForm.id_card}
                      onChange={(e) => setVerifyForm({ ...verifyForm, id_card: e.target.value })}
                      placeholder="请输入身份证号"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="input-group">
                    <label>手机号</label>
                    <input
                      type="tel"
                      value={verifyForm.phone}
                      onChange={(e) => setVerifyForm({ ...verifyForm, phone: e.target.value })}
                      placeholder="请输入手机号"
                    />
                  </div>
                  <div className="input-group input-row">
                    <div style={{ flex: 1 }}>
                      <label>验证码</label>
                      <input
                        type="text"
                        value={verifyForm.verify_code}
                        onChange={(e) => setVerifyForm({ ...verifyForm, verify_code: e.target.value })}
                        placeholder="请输入验证码"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-code"
                      onClick={handleSendVerifyCode}
                      disabled={countdown > 0}
                      style={{ marginTop: '30px' }}
                    >
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </button>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowVerifyModal(false)}
                >
                  取消
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleVerify}
                >
                  确认认证
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Loan
