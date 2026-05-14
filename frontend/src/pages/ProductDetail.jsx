import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, MessageCircle, Share2, ChevronUp, Star, Heart, Home } from 'lucide-react'
import useStore from '../store/useStore'
import api from '../utils/api'
import { showToast } from '../utils/toast'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [relatedProducts, setRelatedProducts] = useState([])
  const [activeTab, setActiveTab] = useState('product')
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showSpecModal, setShowSpecModal] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [actionType, setActionType] = useState(null)
  const [liked, setLiked] = useState(false)
  const reviewsRef = useRef(null)
  const detailRef = useRef(null)
  const pageRef = useRef(null)
  
  const addToCart = useStore((state) => state.addToCart)
  const cartCount = useStore((state) => state.cartCount)
  
  useEffect(() => {
    fetchProduct()
    handleScroll()
  }, [id])
  
  const fetchProduct = async () => {
    try {
      const response = await api.get(`/product/${id}`)
      setProduct(response.product)
      setReviews(response.reviews || [])
      setRelatedProducts(response.relatedProducts || [])
    } catch (error) {
      console.error('Failed to fetch product:', error)
    }
  }
  
  const handleScroll = () => {
    const handleScrollEvent = () => {
      const scrollTop = pageRef.current?.scrollTop || window.scrollY
      setShowScrollTop(scrollTop > 300)
    }
    
    window.addEventListener('scroll', handleScrollEvent)
    return () => window.removeEventListener('scroll', handleScrollEvent)
  }
  
  const scrollToReviews = () => {
    setActiveTab('reviews')
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  const scrollToDetail = () => {
    setActiveTab('detail')
    detailRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  const handleAction = (type) => {
    setActionType(type)
    setShowSpecModal(true)
  }
  
  const confirmAction = async () => {
    if (!product) return
    
    if (actionType === 'cart') {
      try {
        await addToCart(product.id, null, quantity)
        showToast('已加入购物车')
        setShowSpecModal(false)
      } catch (error) {
        showToast('加入购物车失败')
      }
    } else if (actionType === 'buy') {
      localStorage.setItem('checkoutData', JSON.stringify({
        items: [{
          product_id: product.id,
          product,
          quantity,
          price: product.price
        }]
      }))
      navigate('/checkout')
    }
  }
  
  const buyNow = async () => {
    if (!product) return
    
    try {
      const response = await api.post('/order/create', {
        product_id: product.id,
        quantity: 1,
        address: { name: '测试用户', phone: '13800000000', address: '测试地址' }
      })
      
      if (response.order?.id) {
        await api.post(`/order/${response.order.id}/pay`)
        showToast('下单成功')
        navigate(`/order/${response.order.id}`)
      }
    } catch (error) {
      showToast(error.response?.data?.error || '下单失败')
    }
  }
  
  if (!product) {
    return <div className="loading">加载中...</div>
  }
  
  return (
    <div ref={pageRef} className="product-detail-page">
      <div className="header">
        <div className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </div>
        <div className="header-title">商品详情</div>
        <div className="back-btn" onClick={() => navigate('/')}>
          <Home size={22} />
        </div>
      </div>
      
      <div className="detail-images">
        <img
          src={product.images?.[0] || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20placeholder&image_size=square_hd'}
          alt={product.name}
        />
      </div>
      
      <div className="detail-info">
        <div className="detail-price">
          <span className="price-current">¥{product.price?.toFixed(2)}</span>
          {product.original_price && (
            <span className="price-original">¥{product.original_price?.toFixed(2)}</span>
          )}
        </div>
        <div className="detail-name">{product.name}</div>
        <div className="detail-desc">{product.description}</div>
        <div className="detail-stats">
          <span>销量 {product.sales}</span>
          <span>库存 {product.stock}</span>
          <span onClick={scrollToReviews} style={{ cursor: 'pointer' }}>评价 {reviews.length}</span>
        </div>
      </div>
      
      <div className="detail-tabs">
        <div
          className={`detail-tab ${activeTab === 'product' ? 'active' : ''}`}
          onClick={() => setActiveTab('product')}
        >
          商品
        </div>
        <div
          className={`detail-tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={scrollToReviews}
        >
          评价({reviews.length})
        </div>
        <div
          className={`detail-tab ${activeTab === 'detail' ? 'active' : ''}`}
          onClick={scrollToDetail}
        >
          详情
        </div>
      </div>
      
      <div ref={reviewsRef} className="review-section">
        <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>用户评价</h4>
        {reviews.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无评价</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-user">
                <img
                  src={review.avatar || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=avatar&image_size=square'}
                  alt={review.nickname}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{review.nickname}</span>
                    <div className="review-stars">
                      {Array(review.rating).fill('★').join('')}
                    </div>
                  </div>
                </div>
              </div>
              <div className="review-content">{review.content}</div>
            </div>
          ))
        )}
      </div>
      
      {relatedProducts.length > 0 && (
        <div style={{ backgroundColor: '#fff', marginBottom: 8 }}>
          <div className="section-title">
            <h3>相关推荐</h3>
          </div>
          <div className="product-grid" style={{ padding: '0 8px 16px' }}>
            {relatedProducts.map((product) => (
              <div
                key={product.id}
                className="product-card"
                onClick={() => {
                  setProduct(null)
                  navigate(`/product/${product.id}`, { replace: true })
                }}
              >
                <img
                  src={product.images?.[0] || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20placeholder&image_size=square_hd'}
                  alt={product.name}
                />
                <div className="product-info">
                  <div className="product-name">{product.name}</div>
                  <div className="product-price">
                    <span className="price-current">¥{product.price?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div ref={detailRef} style={{ backgroundColor: '#fff', padding: 16 }}>
        <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>图文详情</h4>
        {product.detail_images?.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`detail-${idx}`}
            style={{ width: '100%', marginBottom: 8 }}
          />
        ))}
      </div>
      
      <div className="detail-bottom">
        <div className="detail-action-icons">
          <div className="action-icon" onClick={() => navigate('/')}>
            <Home size={22} color="#666" />
            <span>首页</span>
          </div>
          <div className="action-icon" onClick={() => setLiked(!liked)}>
            <Heart size={22} color={liked ? '#ff4d4f' : '#666'} fill={liked ? '#ff4d4f' : 'none'} />
            <span>收藏</span>
          </div>
          <div className="action-icon" onClick={() => navigate('/cart')}>
            <div style={{ position: 'relative' }}>
              <ShoppingCart size={22} color="#666" />
              {cartCount > 0 && (
                <span className="nav-badge" style={{ top: -8, right: -8 }}>
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
            <span>购物车</span>
          </div>
          <div className="action-icon">
            <MessageCircle size={22} color="#666" />
            <span>客服</span>
          </div>
        </div>
        <div className="detail-action-btns">
          <button className="btn-cart" onClick={() => handleAction('cart')}>加入购物车</button>
          <button className="btn-buy" onClick={buyNow}>立即购买</button>
        </div>
      </div>
      
      {showScrollTop && (
        <div className="scroll-top-btn visible" onClick={scrollToTop}>
          <ChevronUp size={24} color="#999" />
        </div>
      )}
      
      {showSpecModal && (
        <div className="modal-overlay" onClick={() => setShowSpecModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>确认</h3>
              <button onClick={() => setShowSpecModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <img
                  src={product.images?.[0]}
                  alt={product.name}
                  style={{ width: 80, height: 80, borderRadius: 8 }}
                />
                <div>
                  <p style={{ fontWeight: 600 }}>{product.name}</p>
                  <p style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 700, marginTop: 8 }}>
                    ¥{product.price?.toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>数量</span>
                <div className="quantity-control">
                  <button
                    className="quantity-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </button>
                  <span className="quantity-input">{quantity}</span>
                  <button
                    className="quantity-btn"
                    onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
              <button
                className="btn-primary"
                style={{ width: '100%', height: 44, borderRadius: 22, fontSize: 15 }}
                onClick={confirmAction}
              >
                {actionType === 'cart' ? '加入购物车' : '立即购买'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetail
