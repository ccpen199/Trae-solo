import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Image, ShoppingBag } from 'lucide-react'
import api from '../utils/api'
import { showToast } from '../utils/toast'

function PublishPost() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  
  const mockImages = [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shopping%20review&image_size=square_hd',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20review%20photo&image_size=square_hd'
  ]
  
  const addImage = () => {
    if (images.length >= 9) {
      showToast('最多上传9张图片')
      return
    }
    setImages([...images, mockImages[images.length % mockImages.length]])
  }
  
  const removeImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx))
  }
  
  const handleSubmit = async () => {
    if (!content.trim()) {
      showToast('请输入内容')
      return
    }
    
    setLoading(true)
    
    try {
      await api.post('/community/posts', {
        title: title.trim(),
        content: content.trim(),
        images: images.length > 0 ? images : null
      })
      
      showToast('发布成功')
      navigate('/community', { replace: true })
    } catch (error) {
      showToast(error.response?.data?.error || '发布失败')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="publish-modal">
      <div className="publish-header">
        <div className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </div>
        <h3>发布心得</h3>
        <button
          className="btn-publish"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '发布中...' : '发布'}
        </button>
      </div>
      
      <div className="publish-content">
        <input
          type="text"
          className="publish-input"
          placeholder="输入标题（选填）"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 16, marginBottom: 16 }}
        />
        
        <textarea
          className="publish-input"
          placeholder="分享你的购物心得..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
        />
        
        <div className="publish-image-grid">
          {images.map((img, idx) => (
            <div key={idx} className="publish-image-item" style={{ position: 'relative' }}>
              <img src={img} alt={`img-${idx}`} />
              <button
                onClick={() => removeImage(idx)}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: '#fff',
                  fontSize: 12
                }}
              >
                ✕
              </button>
            </div>
          ))}
          
          {images.length < 9 && (
            <div className="publish-add-image" onClick={addImage}>
              <Plus size={24} color="#999" />
              <span>添加图片</span>
            </div>
          )}
        </div>
        
        <div className="publish-product" onClick={() => showToast('选择商品功能开发中')}>
          <ShoppingBag size={20} color="#666" />
          <span style={{ flex: 1, marginLeft: 12 }}>关联商品</span>
          <span style={{ color: '#999' }}>选填</span>
        </div>
      </div>
    </div>
  )
}

export default PublishPost
