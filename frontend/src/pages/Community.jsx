import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Share2, Plus, Search, ShoppingCart } from 'lucide-react'
import useStore from '../store/useStore'
import api from '../utils/api'
import { showToast } from '../utils/toast'

function Community() {
  const navigate = useNavigate()
  const cartCount = useStore((state) => state.cartCount)
  const [activeTab, setActiveTab] = useState('discover')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [showFAB, setShowFAB] = useState(true)
  const lastScrollY = useRef(0)
  const pageRef = useRef(null)
  
  useEffect(() => {
    fetchPosts()
    setupScrollListener()
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [activeTab])
  
  const setupScrollListener = () => {
    window.addEventListener('scroll', handleScroll)
  }
  
  const handleScroll = () => {
    const currentScrollY = window.scrollY
    if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
      setShowFAB(false)
    } else {
      setShowFAB(true)
    }
    lastScrollY.current = currentScrollY
  }
  
  const fetchPosts = async () => {
    try {
      setLoading(true)
      const type = activeTab === 'following' ? 'following' : activeTab === 'my' ? 'my' : 'discover'
      const response = await api.get('/community/posts', { params: { type } })
      setPosts(response.posts || [])
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleLike = async (post, idx) => {
    try {
      const response = await api.post(`/community/posts/${post.id}/like`)
      const newPosts = [...posts]
      newPosts[idx] = {
        ...newPosts[idx],
        is_liked: response.liked,
        likes_count: response.liked ? (newPosts[idx].likes_count || 0) + 1 : (newPosts[idx].likes_count || 0) - 1
      }
      setPosts(newPosts)
    } catch (error) {
      showToast('操作失败')
    }
  }
  
  const handleFollow = async (userId) => {
    try {
      await api.post(`/community/follow/${userId}`)
      showToast('关注成功')
    } catch (error) {
      showToast('操作失败')
    }
  }
  
  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return timeStr.split(' ')[0]
  }
  
  const tabs = [
    { key: 'discover', label: '发现好货' },
    { key: 'following', label: '关注' },
    { key: 'my', label: '我的' }
  ]
  
  return (
    <div ref={pageRef} className="community-page">
      <div className="header">
        <div className="search-bar" onClick={() => navigate('/search')}>
          <Search size={18} color="#999" />
          <input type="text" placeholder="搜索心得" readOnly />
        </div>
        <div className="back-btn" onClick={() => navigate('/cart')} style={{ position: 'relative' }}>
          <ShoppingCart size={22} />
          {cartCount > 0 && (
            <span className="nav-badge" style={{ top: -2, right: -4 }}>{cartCount > 99 ? '99+' : cartCount}</span>
          )}
        </div>
      </div>
      
      <div className="community-tabs">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            className={`community-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </div>
        ))}
      </div>
      
      {loading ? (
        <div className="loading">加载中...</div>
      ) : posts.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📝</div>
          <p>暂无内容</p>
          <button
            onClick={() => navigate('/publish')}
            style={{ marginTop: 20, padding: '10px 30px', backgroundColor: '#ff4d4f', color: '#fff', borderRadius: 20 }}
          >
            发布心得
          </button>
        </div>
      ) : (
        <div style={{ padding: '8px 0' }}>
          {posts.map((post, idx) => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <img
                  src={post.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=avatar&image_size=square'}
                  alt={post.nickname}
                  className="post-avatar"
                />
                <div className="post-user-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="post-nickname">{post.nickname}</span>
                    {post.is_shop_owner && (
                      <span style={{ fontSize: 10, padding: '2px 6px', backgroundColor: '#fff1f0', color: '#ff4d4f', borderRadius: 4 }}>店主</span>
                    )}
                  </div>
                  <div className="post-time">{formatTime(post.created_at)}</div>
                </div>
                {!post.is_following && post.is_shop_owner && (
                  <button
                    style={{ padding: '4px 12px', backgroundColor: '#fff1f0', color: '#ff4d4f', borderRadius: 12, fontSize: 12 }}
                    onClick={() => handleFollow(post.user_id)}
                  >
                    + 关注
                  </button>
                )}
              </div>
              
              <div className="post-content">
                {post.title && <div className="post-title">{post.title}</div>}
                <div className="post-text">{post.content}</div>
              </div>
              
              {post.images?.length > 0 && (
                <div className={`post-images ${post.images.length === 1 ? 'single' : ''}`}>
                  {post.images.slice(0, 9).map((img, imgIdx) => (
                    <img key={imgIdx} src={img} alt={`post-${imgIdx}`} />
                  ))}
                </div>
              )}
              
              {post.product_id && (
                <div
                  className="post-product-link"
                  onClick={() => navigate(`/product/${post.product_id}`)}
                >
                  {post.product && (
                    <>
                      <img src={post.product.images?.[0]} alt={post.product.name} />
                      <div className="post-product-info">
                        <div className="post-product-name">{post.product.name}</div>
                        <div className="post-product-price">¥{post.product.price?.toFixed(2)}</div>
                      </div>
                      <span style={{ color: '#999' }}>去购买</span>
                    </>
                  )}
                </div>
              )}
              
              <div className="post-actions">
                <div
                  className={`post-action ${post.is_liked ? 'liked' : ''}`}
                  onClick={() => handleLike(post, idx)}
                >
                  <Heart size={18} fill={post.is_liked ? '#ff4d4f' : 'none'} />
                  <span>{post.likes_count || 0}</span>
                </div>
                <div className="post-action">
                  <MessageCircle size={18} />
                  <span>{post.comments_count || 0}</span>
                </div>
                <div className="post-action">
                  <Share2 size={18} />
                  <span>{post.shares_count || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div
        className={`fab-publish ${!showFAB ? 'hidden' : ''}`}
        onClick={() => navigate('/publish')}
      >
        <Plus size={28} />
      </div>
    </div>
  )
}

export default Community
