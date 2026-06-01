import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { wealth } from '../api'
import Header from '../components/Header'
import Loading from '../components/Loading'

function Wealth() {
  const { showToast, setLoading } = useAppStore()
  const [products, setProducts] = useState([])
  const [investments, setInvestments] = useState([])
  const [activeTab, setActiveTab] = useState('products')
  const [rpInfo, setRpInfo] = useState(null)

  useEffect(() => {
    fetchProducts()
    fetchInvestments()
    fetchRpInfo()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await wealth.getProducts()
      if (res.success) {
        setProducts(res.data || [])
      }
    } catch (error) {
      showToast('获取产品列表失败', 'error')
    }
  }

  const fetchInvestments = async () => {
    try {
      const res = await wealth.getMyInvestments()
      if (res.success) {
        setInvestments(res.data || [])
      }
    } catch (error) {
      showToast('获取投资记录失败', 'error')
    }
  }

  const fetchRpInfo = async () => {
    try {
      const res = await wealth.getRpInfo()
      if (res.success) {
        setRpInfo(res.data)
      }
    } catch (error) {
      // 静默失败
    }
  }

  const handleInvest = async (product) => {
    if (!rpInfo?.bank_account_opened) {
      showToast('请先开通银行账户', 'error')
      return
    }

    try {
      setLoading(true)
      const res = await wealth.invest({
        product_id: product.id,
        amount: product.min_investment
      })

      if (res.success) {
        showToast('投资成功', 'success')
        fetchInvestments()
      } else {
        showToast(res.message || '投资失败', 'error')
      }
    } catch (error) {
      showToast('投资失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <Header title="财富管理" />
      <div style={{ padding: '20px' }}>
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            marginBottom: '20px'
          }}
        >
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '60px' }}>
              <div>
                <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>总资产（元）</p>
                <p style={{ fontSize: '28px', fontWeight: '600' }}>
                  {investments.reduce((sum, inv) => sum + (inv.amount || 0), 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>预期收益（元）</p>
                <p style={{ fontSize: '28px', fontWeight: '600', color: '#52c41a' }}>
                  +{investments.reduce((sum, inv) => sum + (inv.expected_earnings || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="tabs">
          <div
            className={`tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            理财产品
          </div>
          <div
            className={`tab ${activeTab === 'investments' ? 'active' : ''}`}
            onClick={() => setActiveTab('investments')}
          >
            我的持仓
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
                      <p style={{ fontSize: '24px', fontWeight: '600', color: '#ff6b6b' }}>
                        {product.expected_annual_rate}%
                      </p>
                      <p style={{ fontSize: '12px', color: '#999' }}>
                        预期年化
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '20px',
                    padding: '12px 0',
                    borderTop: '1px solid #f0f0f0'
                  }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#999' }}>起投金额</p>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                        ¥{product.min_investment}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#999' }}>期限</p>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                        {product.term_days ? `${product.term_days}天` : '灵活存取'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#999' }}>风险等级</p>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                        {product.risk_level === 'low' ? '低风险' : '中风险'}
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
                      onClick={() => handleInvest(product)}
                      style={{ padding: '8px 20px' }}
                    >
                      立即购买
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="card empty-state">
                <div className="icon">💰</div>
                <p>暂未理财产品</p>
              </div>
            )}
          </>
        ) : (
          <>
            {investments.length > 0 ? (
              investments.map((inv) => (
                <div key={inv.id} className="card">
                  <div className="flex-between" style={{ marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                        {inv.product_name}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        购买时间: {inv.purchase_date}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                        ¥{inv.amount?.toFixed(2)}
                      </p>
                      <p style={{
                        fontSize: '14px',
                        color: '#52c41a',
                        marginTop: '4px'
                      }}>
                        预期收益: +¥{inv.expected_earnings?.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {inv.maturity_date && (
                    <div style={{
                      paddingTop: '12px',
                      borderTop: '1px solid #f0f0f0'
                    }}>
                      <p style={{ fontSize: '12px', color: '#999' }}>
                        到期时间: {inv.maturity_date}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="card empty-state">
                <div className="icon">📈</div>
                <p>暂无投资记录</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Wealth
