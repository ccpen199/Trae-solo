import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { userApi, eCurrencyApi, goldCoinsApi } from '../api'

function HomePage() {
  const [user, setUser] = useState(null)
  const [eCurrencyBalance, setECurrencyBalance] = useState(null)
  const [goldHotels, setGoldHotels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [userRes, eCurrencyRes, goldHotelsRes] = await Promise.all([
        userApi.getCurrentUser(),
        eCurrencyApi.getBalance(),
        goldCoinsApi.getHotelsWithGold()
      ])

      setUser(userRes.data)
      setECurrencyBalance(eCurrencyRes.data)
      setGoldHotels(goldHotelsRes.data)
    } catch (error) {
      console.error('获取首页数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">
          <div className="spinner"></div>
          <span>加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="home-page">
      <div className="welcome-section">
        <h2>欢迎回来，{user?.name || '用户'}</h2>
        <p>查看您的积分资产和奖励明细</p>
      </div>

      <div className="assets-section">
        {user?.is_main_account && (
          <Link to="/e-currency" className="asset-card e-currency">
            <div className="asset-card-header">
              <span className="asset-card-title">我的E币</span>
              <span className="asset-card-icon">💎</span>
            </div>
            <div className="asset-card-balance">
              {eCurrencyBalance?.balance?.toFixed(2) || '0.00'}
            </div>
            <div className="asset-card-footer">
              主账户专属资产 · 点击查看明细
            </div>
          </Link>
        )}

        <Link to="/gold-coins" className="asset-card gold-coins">
          <div className="asset-card-header">
            <span className="asset-card-title">我的金币</span>
            <span className="asset-card-icon">🪙</span>
          </div>
          <div className="asset-card-balance">
            {goldHotels.reduce((sum, hotel) => sum + (hotel.balance || 0), 0).toFixed(2)}
          </div>
          <div className="asset-card-footer">
            共 {goldHotels.length} 家客栈 · 按客栈维度统计
          </div>
        </Link>
      </div>

      <div className="page-container">
        <h3 className="page-title" style={{ fontSize: '18px', marginBottom: '16px' }}>客栈金币概览</h3>
        {goldHotels.length > 0 ? (
          <table className="records-table">
            <thead>
              <tr>
                <th>客栈名称</th>
                <th>客栈代码</th>
                <th>金币余额</th>
              </tr>
            </thead>
            <tbody>
              {goldHotels.map(hotel => (
                <tr key={hotel.id}>
                  <td>{hotel.name}</td>
                  <td>{hotel.code}</td>
                  <td>
                    <span className="amount-positive">{hotel.balance?.toFixed(2) || '0.00'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">暂无客栈金币数据</div>
        )}
      </div>
    </div>
  )
}

export default HomePage
