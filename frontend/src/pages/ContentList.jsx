import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { contentApi } from '../api'

const ContentList = () => {
  const [contents, setContents] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
    loadContents()
  }, [activeCategory])

  const loadCategories = async () => {
    try {
      const res = await contentApi.getCategories()
      if (res.success) {
        setCategories(res.data)
      }
    } catch (e) {
      console.error('加载内容分类失败', e)
    }
  }

  const loadContents = async () => {
    setLoading(true)
    try {
      const params = { pageSize: 20 }
      if (activeCategory) params.category = activeCategory
      const res = await contentApi.getList(params)
      if (res.success) {
        setContents(res.data)
      }
    } catch (e) {
      console.error('加载内容失败', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20 }}>📖 识物</h1>

      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeCategory === '' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveCategory('')}
          >
            全部
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`btn ${activeCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : contents.length === 0 ? (
        <div className="empty">暂无内容</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {contents.map(content => (
            <Link
              key={content.id}
              to={`/content/${content.id}`}
              className="card"
              style={{ overflow: 'hidden', cursor: 'pointer' }}
            >
              <div style={{ height: 160, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
                📖
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'inline-block', padding: '2px 6px', background: '#f5f5f5', color: '#666', fontSize: 12, borderRadius: 2, marginBottom: 8 }}>
                  {content.category}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>{content.title}</h3>
                <p style={{ color: '#666', fontSize: 13, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 12 }}>
                  {content.summary}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999' }}>
                  <span>👁️ {content.view_count}</span>
                  <span>❤️ {content.like_count}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default ContentList
