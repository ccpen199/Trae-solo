import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { videoApi, cartApi } from '../api'
import { useUserStore, useCartStore } from '../store'

function VideoPage() {
  const navigate = useNavigate()
  const { user, token } = useUserStore()
  const { setCart } = useCartStore()
  
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  
  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])
  
  useEffect(() => {
    fetchVideos(1)
  }, [])
  
  const fetchVideos = async (pageNum) => {
    if (loading) return
    
    setLoading(true)
    try {
      const result = await videoApi.getList({
        page: pageNum,
        page_size: 10
      })
      
      if (result.success) {
        const newVideos = pageNum === 1 ? result.data.list : [...videos, ...result.data.list]
        setVideos(newVideos)
        setHasMore(newVideos.length < result.data.total)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('获取视频列表失败:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleLike = async (videoId, isLiked) => {
    if (!token) {
      navigate('/login')
      return
    }
    
    try {
      const result = await videoApi.like({ video_id: videoId })
      if (result.success) {
        setVideos(videos.map(v => {
          if (v.id === videoId) {
            return {
              ...v,
              is_liked: result.data.is_liked,
              likes: result.data.is_liked ? v.likes + 1 : v.likes - 1
            }
          }
          return v
        }))
      }
    } catch (error) {
      showToast(error.message || '操作失败')
    }
  }
  
  const handleFavorite = async (videoId, isFavorited) => {
    if (!token) {
      navigate('/login')
      return
    }
    
    try {
      const result = await videoApi.favorite({ video_id: videoId })
      if (result.success) {
        setVideos(videos.map(v => {
          if (v.id === videoId) {
            return {
              ...v,
              is_favorited: result.data.is_favorited
            }
          }
          return v
        }))
        showToast(result.data.is_favorited ? '已收藏' : '已取消收藏')
      }
    } catch (error) {
      showToast(error.message || '操作失败')
    }
  }
  
  const addToCart = async (productId, quantity = 1) => {
    if (!token) {
      navigate('/login')
      return
    }
    
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
  
  const loadMore = () => {
    if (hasMore && !loading) {
      fetchVideos(page + 1)
    }
  }
  
  return (
    <div className="page-container">
      <Header showSearch={false} showLocation={false} title="美食视频" />
      
      <div style={{ paddingBottom: '60px' }}>
        {videos.map((video, index) => (
          <div key={video.id} className="video-card">
            <div
              className="video-card"
              onClick={() => navigate(`/video/${video.id}`)}
              style={{ position: 'relative' }}
            >
              <img src={video.cover} alt={video.title} className="video-cover" />
              <div className="video-play-icon">▶</div>
              
              <div className="video-actions">
                <div className="video-action-item">
                  <button
                    className="video-action-icon"
                    style={{ color: video.is_liked ? 'var(--danger-color)' : 'white' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLike(video.id, video.is_liked)
                    }}
                  >
                    {video.is_liked ? '❤️' : '🤍'}
                  </button>
                  <span className="video-action-count">{video.likes}</span>
                </div>
                <div className="video-action-item">
                  <button
                    className="video-action-icon"
                    style={{ color: video.is_favorited ? 'var(--warning-color)' : 'white' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFavorite(video.id, video.is_favorited)
                    }}
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
            
            <div className="video-info">
              <div className="video-title">{video.title}</div>
              <div className="video-meta">
                <span>@{video.author_name || '美食达人'}</span>
                <span>{video.description}</span>
              </div>
            </div>
            
            {video.products && video.products.length > 0 && (
              <div className="video-product-bar">
                <span className="video-product-label">同款食材:</span>
                <div className="video-product-list">
                  {video.products.slice(0, 4).map(product => (
                    <div
                      key={product.id}
                      className="video-product-item"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/product/${product.product_id}`)
                      }}
                    >
                      <img src={product.image} alt={product.name} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
        )}
        
        {hasMore && !loading && videos.length > 0 && (
          <div className="text-center text-muted p-md" onClick={loadMore} style={{ cursor: 'pointer' }}>
            加载更多
          </div>
        )}
        
        {!loading && videos.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🎬</div>
            <div className="empty-state-text">暂无视频</div>
          </div>
        )}
      </div>
      
      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  )
}

export default VideoPage
