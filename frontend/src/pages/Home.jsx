import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ShoppingCart } from 'lucide-react'
import useStore from '../store/useStore'
import api from '../utils/api'

function Home() {
  const navigate = useNavigate()
  const cartCount = useStore((state) => state.cartCount)
  const [homeData, setHomeData] = useState(null)
  const [currentBanner, setCurrentBanner] = useState(0)
  const timerRef = useRef(null)
  
  useEffect(() => {
    fetchHomeData()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])
  
  const fetchHomeData = async () => {
    try {
      const response = await api.get('/product/home-recommend')
      setHomeData(response)
      
      if (response.banners && response.banners.length > 1) {
        timerRef.current = setInterval(() => {
          setCurrentBanner(prev => (prev + 1) % response.banners.length)
        }, 3000)
      }
    } catch (error) {
      console.error('Failed to fetch home data:', error)
    }
  }
  
  if (!homeData) {
    return <div className="loading">加载中...</div>
  }
  
  return (
    <div className="page-container">
      <div className="header">
        <div className="search-bar" onClick={() => navigate('/search')}>
          <Search size={18} color="#999" />
          <input
            type="text"
            placeholder="搜索商品"
            readOnly
          />
        </div>
        <div className="back-btn" onClick={() => navigate('/cart')} style={{ position: 'relative' }}>
          <ShoppingCart size={22} />
          {cartCount > 0 && (
            <span className="nav-badge" style={{ top: -2, right: -4 }}>{cartCount > 99 ? '99+' : cartCount}</span>
          )}
        </div>
      </div>
      
      {homeData.banners && homeData.banners.length > 0 && (
        <div className="banner-swiper">
          <img
            src={homeData.banners[currentBanner].image}
            alt="banner"
            onClick={() => navigate(homeData.banners[currentBanner].link)}
          />
          <div className="banner-indicators">
            {homeData.banners.map((_, idx) => (
              <div
                key={idx}
                className={`banner-dot ${idx === currentBanner ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>
      )}
      
      <div className="quick-entries">
        {homeData.quickEntries?.map((entry) => (
          <div key={entry.id} className="quick-entry">
            <img src={entry.icon} alt={entry.name} />
            <span>{entry.name}</span>
          </div>
        ))}
      </div>
      
      <div className="section-title">
        <h3>为你推荐</h3>
        <span className="more">查看更多</span>
      </div>
      
      <div className="product-grid">
        {homeData.products?.map((product) => (
          <div
            key={product.id}
            className="product-card"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            <img
              src={product.images?.[0] || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20placeholder&image_size=square_hd'}
              alt={product.name}
            />
            <div className="product-info">
              <div className="product-name">{product.name}</div>
              <div className="product-price">
                <span className="price-current">¥{product.price?.toFixed(2)}</span>
                {product.original_price && (
                  <span className="price-original">¥{product.original_price?.toFixed(2)}</span>
                )}
              </div>
              <div className="product-sales">已售 {product.sales} 件</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Home
