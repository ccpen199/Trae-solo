import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useStore from '../store'
import { productApi, channelApi, promotionApi } from '../api'
import ProductCard from '../components/ProductCard'
import './Home.css'

const Home = () => {
  const [recommendProducts, setRecommendProducts] = useState([])
  const [guessLikeProducts, setGuessLikeProducts] = useState([])
  const [hotProducts, setHotProducts] = useState([])
  const [flashSaleProducts, setFlashSaleProducts] = useState([])
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [recommendRes, guessLikeRes, hotRes, flashRes, modulesRes] = await Promise.all([
        productApi.getRecommend({ limit: 8 }),
        productApi.getGuessLike({ limit: 8 }),
        productApi.getHot({ limit: 6 }),
        promotionApi.getFlashSale(),
        channelApi.getRecommendModules()
      ])

      if (recommendRes.success) setRecommendProducts(recommendRes.data)
      if (guessLikeRes.success) setGuessLikeProducts(guessLikeRes.data)
      if (hotRes.success) setHotProducts(hotRes.data)
      if (flashRes.success) setFlashSaleProducts(flashRes.data)
      if (modulesRes.success) setModules(modulesRes.data.modules)
    } catch (e) {
      console.error('加载首页数据失败', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div className="home-page">
      <section className="home-banner">
        <div className="container">
          <div className="banner-content">
            <h1>品质生活 从这里开始</h1>
            <p>严选全球好物，只为品质生活</p>
            <Link to="/new" className="btn btn-primary btn-lg">
              立即探索
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="container">
          <div className="section-header">
            <div className="section-title">
              <span className="title-icon">🔥</span>
              <h2>限时抢购</h2>
            </div>
            <Link to="/flash-sale" className="more-link">查看更多 →</Link>
          </div>
          <div className="flash-sale-list">
            {flashSaleProducts.slice(0, 4).map(product => (
              <div key={product.id} className="flash-item">
                <div className="flash-discount">-{product.discount}%</div>
                <ProductCard product={product} showAddCart={false} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="container">
          <div className="section-header">
            <div className="section-title">
              <span className="title-icon">🎯</span>
              <h2>为你推荐</h2>
            </div>
          </div>
          <div className="grid-4">
            {recommendProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="home-section modules-section">
        <div className="container">
          <div className="module-grid">
            {modules.map((module, index) => (
              <div key={module.id} className={`module-card ${module.link ? 'clickable' : ''}`}>
                {module.link ? (
                  <Link to={module.link}>
                    <div className="module-header">
                      <span className="module-icon">{module.icon}</span>
                      <div>
                        <h3>{module.name}</h3>
                        <p>{module.description}</p>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <>
                    <div className="module-header">
                      <span className="module-icon">{module.icon}</span>
                      <div>
                        <h3>{module.name}</h3>
                        <p>{module.description}</p>
                      </div>
                    </div>
                    {module.products && (
                      <div className="module-products">
                        {module.products.map(product => (
                          <Link key={product.id} to={`/product/${product.id}`} className="mini-product">
                            <span className="mini-img">📦</span>
                            <span className="mini-price">¥{product.display_price.toFixed(2)}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="container">
          <div className="section-header">
            <div className="section-title">
              <span className="title-icon">🔥</span>
              <h2>人气榜</h2>
            </div>
          </div>
          <div className="grid-5">
            {hotProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="container">
          <div className="section-header">
            <div className="section-title">
              <span className="title-icon">❤️</span>
              <h2>猜你喜欢</h2>
            </div>
          </div>
          <div className="grid-4">
            {guessLikeProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
