import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { contentApi } from '../api'

const ContentDetail = () => {
  const { id } = useParams()
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadContent()
  }, [id])

  const loadContent = async () => {
    try {
      const res = await contentApi.getDetail(id)
      if (res.success) {
        setContent(res.data)
      }
    } catch (e) {
      console.error('加载内容失败', e)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    try {
      const res = await contentApi.like(id)
      if (res.success) {
        setContent(prev => ({ ...prev, like_count: res.data.like_count }))
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return <div className="loading" style={{ padding: '100px' }}>加载中...</div>
  }

  if (!content) {
    return <div className="container" style={{ padding: '100px', textAlign: 'center' }}>内容不存在</div>
  }

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <div className="card" style={{ padding: 40, marginBottom: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-block', padding: '4px 12px', background: '#f5f5f5', color: '#666', fontSize: 12, borderRadius: 4, marginBottom: 16 }}>
            {content.category}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 16 }}>{content.title}</h1>
          <div style={{ color: '#999', fontSize: 14 }}>
            {content.author ? `${content.author} · ` : ''}{content.created_at}
            <span style={{ marginLeft: 16 }}>👁️ {content.view_count} 阅读</span>
          </div>
        </div>

        <div style={{ fontSize: 16, lineHeight: 1.8, color: '#333' }}>
          {content.content || content.summary}
        </div>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <button className="btn btn-outline" onClick={handleLike}>
            ❤️ 点赞 ({content.like_count})
          </button>
        </div>
      </div>

      {content.related_products && content.related_products.length > 0 && (
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🛍️ 相关推荐</h2>
          <div className="grid-4">
            {content.related_products.map(product => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="product-card"
              >
                <div className="product-card-img" style={{ position: 'relative' }}>
                  <span>📦</span>
                  {!product.can_buy && (
                    <div className="product-card-sold-out">已售罄</div>
                  )}
                </div>
                <div className="product-card-body">
                  <div className="product-card-name">{product.name}</div>
                  <div className="product-card-price">
                    <span className="product-card-price-current">¥{product.display_price.toFixed(2)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ContentDetail
