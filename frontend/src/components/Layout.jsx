import React, { useEffect, useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import useStore from '../store'
import { channelApi, cartApi } from '../api'
import MessageCenter from './MessageCenter'
import AllChannels from './AllChannels'
import './Layout.css'

const Layout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { 
    user, cartCount, channels, currentChannel, showMessageCenter, showAllChannels,
    setChannels, updateCartCount, toggleMessageCenter, toggleAllChannels, setCurrentChannel
  } = useStore()
  const [searchKeyword, setSearchKeyword] = useState('')

  useEffect(() => {
    loadChannels()
    loadCartCount()
  }, [])

  const loadChannels = async () => {
    try {
      const res = await channelApi.getList()
      if (res.success) {
        setChannels(res.data)
      }
    } catch (e) {
      console.error('加载频道失败', e)
    }
  }

  const loadCartCount = async () => {
    try {
      const res = await cartApi.getList()
      if (res.success) {
        updateCartCount(res.data.total_count)
      }
    } catch (e) {
      console.error('加载购物车失败', e)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchKeyword.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(searchKeyword.trim())}`)
    }
  }

  const handleChannelClick = (code) => {
    setCurrentChannel(code)
    toggleAllChannels(false)
    if (code === 'recommend') {
      navigate('/')
    } else if (code === 'new') {
      navigate('/new')
    } else if (code === 'crowdfunding') {
      navigate('/crowdfunding')
    } else if (code === 'welfare') {
      navigate('/welfare')
    } else if (code === 'flash') {
      navigate('/flash-sale')
    }
  }

  const getActiveChannel = () => {
    const path = location.pathname
    if (path === '/' || path === '') return 'recommend'
    if (path === '/new') return 'new'
    if (path === '/crowdfunding') return 'crowdfunding'
    if (path === '/welfare') return 'welfare'
    if (path === '/flash-sale') return 'flash'
    return currentChannel
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-top">
          <div className="container">
            <div className="header-top-left">
              <span>欢迎来到精品自营</span>
              {user ? (
                <>
                  <span className="separator">|</span>
                  <Link to="/profile">{user.nickname}</Link>
                </>
              ) : (
                <>
                  <span className="separator">|</span>
                  <Link to="/login">请登录</Link>
                  <Link to="/register">免费注册</Link>
                </>
              )}
            </div>
            <div className="header-top-right">
              <button className="header-link" onClick={() => toggleMessageCenter(true)}>
                消息中心
              </button>
              <span className="separator">|</span>
              <Link to="/orders">我的订单</Link>
              {user && user.is_vip && (
                <>
                  <span className="separator">|</span>
                  <Link to="/member" className="vip-link">
                    👑 VIP会员
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="header-main">
          <div className="container">
            <Link to="/" className="logo">
              <span className="logo-icon">🎯</span>
              <span className="logo-text">精品自营</span>
            </Link>
            
            <form className="search-form" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="搜索商品、品牌、供应商..."
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">搜索</button>
            </form>
            
            <Link to="/cart" className="cart-btn">
              <span className="cart-icon">🛒</span>
              <span>购物车</span>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          </div>
        </div>
        
        <nav className="header-nav">
          <div className="container">
            <div className="nav-all" onClick={() => toggleAllChannels(true)}>
              <span className="nav-icon">☰</span>
              <span>全部频道</span>
            </div>
            <div className="nav-channels">
              {channels.slice(0, 6).map(ch => (
                <button
                  key={ch.code}
                  className={`nav-channel ${getActiveChannel() === ch.code ? 'active' : ''}`}
                  onClick={() => handleChannelClick(ch.code)}
                >
                  {ch.icon && <span className="channel-icon">{ch.icon}</span>}
                  {ch.name}
                </button>
              ))}
            </div>
            <div className="nav-links">
              <Link to="/categories">分类</Link>
              <Link to="/content">识物</Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <div className="container">
          <div className="footer-links">
            <div className="footer-section">
              <h4>购物指南</h4>
              <ul>
                <li><Link to="/">首页</Link></li>
                <li><Link to="/categories">商品分类</Link></li>
                <li><Link to="/new">新品上市</Link></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>用户服务</h4>
              <ul>
                <li><Link to="/profile">个人中心</Link></li>
                <li><Link to="/orders">我的订单</Link></li>
                <li><Link to="/coupons">我的优惠券</Link></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>会员中心</h4>
              <ul>
                <li><Link to="/member">会员俱乐部</Link></li>
                <li><Link to="/points">积分中心</Link></li>
                <li><Link to="/welfare">福利社</Link></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>联系我们</h4>
              <p className="footer-phone">400-123-4567</p>
              <p className="footer-time">周一至周日 9:00-21:00</p>
            </div>
          </div>
          <div className="footer-copyright">
            <p>© 2026 精品自营 版权所有</p>
          </div>
        </div>
      </footer>

      {showMessageCenter && <MessageCenter onClose={() => toggleMessageCenter(false)} />}
      {showAllChannels && (
        <AllChannels 
          channels={channels} 
          activeChannel={getActiveChannel()}
          onSelect={handleChannelClick}
          onClose={() => toggleAllChannels(false)} 
        />
      )}
    </div>
  )
}

export default Layout
