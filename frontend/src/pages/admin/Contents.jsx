import React, { useEffect, useState } from 'react'
import { contentApi, productApi } from '../../api'

const Contents = () => {
  const [contents, setContents] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    title: '',
    category: '好物推荐',
    summary: '',
    content: '',
    related_product_ids: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [contentsRes, productsRes] = await Promise.all([
        contentApi.getList({ pageSize: 100 }),
        productApi.getList({ pageSize: 100 })
      ])
      if (contentsRes.success) setContents(contentsRes.data)
      if (productsRes.success) setProducts(productsRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定删除？')) return
    try {
      await contentApi.delete(id)
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleSave = async () => {
    try {
      const relatedProductIds = form.related_product_ids
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id))
      
      if (editing) {
        await contentApi.update(editing, { ...form, related_product_ids: relatedProductIds.join(',') })
      } else {
        await contentApi.create({ ...form, related_product_ids: relatedProductIds.join(',') })
      }
      alert('保存成功')
      setEditing(null)
      setForm({ title: '', category: '好物推荐', summary: '', content: '', related_product_ids: '' })
      loadData()
    } catch (e) {
      alert(e.error || '保存失败')
    }
  }

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>📖 内容管理</h1>
        <button className="btn btn-primary" onClick={() => {
          setEditing(null)
          setForm({ title: '', category: '好物推荐', summary: '', content: '', related_product_ids: '' })
          setEditing('new')
        }}>
          + 新建内容
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>标题</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>分类</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>浏览/点赞</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>关联商品</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>时间</th>
              <th style={{ textAlign: 'right', padding: 16, fontSize: 13, color: '#666' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {contents.map(content => (
              <tr key={content.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: 16, fontWeight: 500 }}>{content.title}</td>
                <td style={{ padding: 16 }}>
                  <span style={{ padding: '2px 8px', background: '#f5f5f5', borderRadius: 4, fontSize: 12 }}>
                    {content.category}
                  </span>
                </td>
                <td style={{ padding: 16, color: '#666' }}>
                  👁️ {content.view_count} / ❤️ {content.like_count}
                </td>
                <td style={{ padding: 16, color: '#999', fontSize: 13 }}>
                  {content.related_product_ids ? `${content.related_product_ids.split(',').length}个` : '-'}
                </td>
                <td style={{ padding: 16, color: '#999', fontSize: 13 }}>{content.created_at}</td>
                <td style={{ padding: 16, textAlign: 'right' }}>
                  <button
                    className="btn btn-ghost"
                    style={{ marginRight: 8, fontSize: 12 }}
                    onClick={() => handleDelete(content.id)}
                  >
                    删除
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: 12 }}
                    onClick={() => {
                      setEditing(content.id)
                      setForm({
                        title: content.title,
                        category: content.category,
                        summary: content.summary,
                        content: content.content || '',
                        related_product_ids: content.related_product_ids || ''
                      })
                    }}
                  >
                    编辑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {contents.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无内容</div>
        )}
      </div>

      <div style={{ marginTop: 20, fontSize: 13, color: '#666' }}>
        <strong>可关联的商品ID：</strong>
        {products.map(p => `${p.id}(${p.name.slice(0, 10)})`).join('、')}
      </div>

      {editing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setEditing(null)}>
          <div className="card" style={{ width: 600, padding: 24, maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
              {editing === 'new' ? '新建内容' : '编辑内容'}
            </h2>
            
            <div className="form-group">
              <label className="form-label">标题</label>
              <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">分类</label>
              <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option>好物推荐</option>
                <option>使用技巧</option>
                <option>品牌故事</option>
                <option>生活方式</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">摘要</label>
              <textarea className="form-input" rows={2} value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">内容</label>
              <textarea className="form-input" rows={6} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">关联商品ID（多个用逗号分隔）</label>
              <input className="form-input" value={form.related_product_ids} onChange={e => setForm({ ...form, related_product_ids: e.target.value })} placeholder="例如：1,2,3" />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditing(null)}>取消</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Contents
