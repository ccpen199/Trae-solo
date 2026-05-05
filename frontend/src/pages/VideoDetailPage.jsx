import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { videoApi, cartApi } from '../api'
import { useUserStore, useCartStore } from '../store'

function VideoDetailPage() {
  const navigate = useNavigate()
  const { videoId } = useParams()
  const { user, token } = useUserStore()
  const { setCart } = useCartStore()
  
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  
  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])
  
  const fetchVideoDetail = useCallback(async () => {
    if (!videoId) return
    setLoading(true)
    try {
      const result = await videoApi.getDetail(videoId)
      if (result.success) {
        setVideo(result.data)
      } else {
        showToast(result.message || '获取视频详情失败')
      }
    } catch (error) {
      showToast(error.message || '获取视频详情失败')
    } finally {
      setLoading(false)
    }
  }, [videoId, showToast])
  
  useEffect(() => {
    fetchVideoDetail()
  }, [fetchVideoDetail])
  
  const handleLike = async () => {
    if (!token) {
      navigate('/login')
      return
    }
    if (!video) return
    
    try {
      const result = await videoApi.like({ video_id: video.id })
      if (result.success) {
        setVideo({
          ...video,
          is_liked: result.data.is_liked,
          likes: result.data.is_liked ? video.likes + 1 : video.likes - 1
        })
      }
    } catch (error) {
      showToast(error.message || '操作失败')
    }
  }
  
  const handleFavorite = async () => {
    if (!token) {
      navigate('/login')
      return
    }
    if (!video) return
    
    try {
      const result = await videoApi.favorite({ video_id: video.id })
      if (result.success) {
        setVideo({
          ...video,
          is_favorited: result.data.is_favorited
        })
        showToast(result.data.is_favorited ? '已收藏' : '已取消收藏')
      }
    } catch (error) {
      showToast(error.message || '操作失败')
    }
  }
  
  const addToCart = async (productId, quantity = 1) => {
    try {
      const result = await cartApi.add({ product_id: productId, quantity })
      if (result.success) {
        showToast('已添加到购物车')
        const cartRes = await cartApi.getList()
        if (cartRes.success) {
          setCart(cartRes.data.list, cartRes.data.total_count, cartRes.data.total_amount)
        }
      } else {
        showToast(result.message || '添加失败')
      }
    } catch (error) {
      showToast(error.message || '添加失败')
    }
  }
  
  if (loading) {
    return (
      <div className="page-container" style={{ paddingBottom: 0 }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--primary-color)', padding: '12px 16px' }}>
          <div className="flex-between">
            <button onClick={() => navigate(-1)} style={{ color: 'white', fontSize: '20px' }}>
              ←
            </button>
            <span style={{ color: 'white', fontWeight: 500 }}>视频详情</span>
            <div style={{ width: '20px' }}></div>
          </div>
        </div>
        <div className="loading" style={{ marginTop: '100px' }}>
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }
  
  if (!video) {
    return (
      <div className="page-container" style={{ paddingBottom: 0 }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--primary-color)', padding: '12px 16px' }}>
          <div className="flex-between">
            <button onClick={() => navigate(-1)} style={{ color: 'white', fontSize: '20px' }}>
              ←
            </button>
            <span style={{ color: 'white', fontWeight: 500 }}>视频详情</span>
            <div style={{ width: '20px' }}></div>
          </div>
        </div>
        <div className="empty-state" style={{ marginTop: '100px' }}>
          <div className="empty-state-icon">🎬</div>
          <div className="empty-state-text">视频不存在</div>
          <button
            className="btn btn-primary mt-md"
            onClick={() => navigate('/video')}
          >
            返回视频列表
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="page-container" style={{ paddingBottom: 0 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--primary-color)', padding: '12px 16px' }}>
        <div className="flex-between">
          <button onClick={() => navigate(-1)} style={{ color: 'white', fontSize: '20px' }}>
            ←
          </button>
          <span style={{ color: 'white', fontWeight: 500 }}>视频详情</span>
          <div style={{ width: '20px' }}></div>
        </div>
      </div>
      
      <div style={{ paddingBottom: '80px' }}>
        <div className="video-card" style={{ marginBottom: 0 }}>
          <div style={{ position: 'relative' }}>
            <img src={video.cover} alt={video.title} className="video-cover" />
            <div className="video-play-icon" style={{ fontSize: '32px' }}>▶</div>
            
            <div className="video-actions" style={{ right: '16px' }}>
              <div className="video-action-item">
                <button
                  className="video-action-icon"
                  style={{ color: video.is_liked ? 'var(--danger-color)' : 'white' }}
                  onClick={handleLike}
                >
                  {video.is_liked ? '❤️' : '🤍'}
                </button>
                <span className="video-action-count">{video.likes}</span>
              </div>
              <div className="video-action-item">
                <button
                  className="video-action-icon"
                  style={{ color: video.is_favorited ? 'var(--warning-color)' : 'white' }}
                  onClick={handleFavorite}
                >
                  {video.is_favorited ? '⭐' : '☆'}
                </button>
                <span className="video-action-count">收藏</span>
              </div>
              <div className="video-action-item">
                <span className="video-action-icon">👁️</span>
                <span className="video-action-count">{video.views}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h1 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>{video.title}</h1>
          <div className="flex-between" style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                👤
              </div>
              <div>
                <div style={{ fontWeight: 500 }}>@{video.author_name || '美食达人'}</div>
                <div className="text-muted" style={{ fontSize: '12px' }}>
                  {video.created_at?.slice(0, 10)}
                </div>
              </div>
            </div>
            <button className="btn btn-primary btn-sm">
              + 关注
            </button>
          </div>
          <p className="text-muted mt-md">{video.description}</p>
        </div>
        
        {video.products && video.products.length > 0 && (
          <div className="card">
            <div className="card-title">
              <div className="card-title-text">
                <span>🛒</span>
                <span>同款食材</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {video.products.map(product => (
                <div
                  key={product.id}
                  className="flex-row"
                  style={{ gap: '12px', padding: '8px 0' }}
                  onClick={() => navigate(`/product/${product.product_id}`)}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <div className="product-name" style={{ marginBottom: '8px' }}>{product.name}</div>
                    <div className="flex-between" style={{ alignItems: 'flex-end' }}>
                      <div className="product-price">
                        <span className="product-price-current">¥{product.show_price || product.price}</span>
                        {product.member_price && user?.is_member && (
                          <span className="tag tag-member">会员价</span>
                        )}
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          addToCart(product.product_id)
                        }}
                      >
                        加入购物车
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  )
}

export default VideoDetailPage
