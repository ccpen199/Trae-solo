import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';

function Publish() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [poiId, setPoiId] = useState('');
  const [riskTips, setRiskTips] = useState('');
  const [pois, setPois] = useState([]);
  const [images, setImages] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('pois')
      .then(res => setPois(res.data.list || []))
      .catch(() => {});
  }, []);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 9 - images.length;
    files.slice(0, remaining).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (title.trim().length < 4) {
      setErrorMsg('标题至少4个字');
      return;
    }
    if (content.trim().length < 20) {
      setErrorMsg('内容至少20个字，分享更多体验吧');
      return;
    }

    setSubmitLoading(true);

    try {
      let uploadedUrls = [];
      for (const img of images) {
        try {
          const res = await api.post('upload', { image: img });
          uploadedUrls.push(res.data.url);
        } catch (err) {
          setErrorMsg('图片上传失败：' + (err.response?.data?.error || err.message));
          setSubmitLoading(false);
          return;
        }
      }

      await api.post('notes', {
        title,
        content,
        poi_id: poiId || null,
        images: uploadedUrls.join(','),
        risk_tips: riskTips || null
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
    } catch (err) {
      setErrorMsg('发布失败：' + (err.response?.data?.error || err.message) + '，请重试');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = () => {
    if (title || content || images.length > 0) {
      setShowCancelConfirm(true);
    } else {
      navigate(-1);
    }
  };

  const selectedPoi = pois.find(p => p.id == poiId);

  return (
    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom: '0.5rem' }}>📝 发布探店笔记</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        分享你的真实体验，帮助更多人做出消费决策
      </p>

      {submitSuccess ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h3 style={{ color: '#10b981' }}>笔记提交成功！</h3>
          <p style={{ color: '#666', marginTop: '0.5rem' }}>
            笔记已进入审核队列，审核通过后将在首页展示
          </p>
          <p style={{ color: '#999', marginTop: '0.5rem' }}>
            正在跳转到审核后台
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {errorMsg && (
            <div style={{
              background: '#fee2e2', color: '#991b1b', padding: '1rem',
              borderRadius: '8px', marginBottom: '1rem', fontWeight: 500
            }}>
              ❌ {errorMsg}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">笔记标题 * <span style={{color:'#999', fontWeight:'normal'}}>(至少4个字)</span></label>
            <input
              type="text"
              className="form-input"
              placeholder="给你的笔记起个吸引人的标题"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrorMsg(''); }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">关联商家 <span style={{color:'#999', fontWeight:'normal'}}>(可选)</span></label>
            <select
              className="form-select"
              value={poiId}
              onChange={(e) => setPoiId(e.target.value)}
            >
              <option value="">选择关联的商家/地点</option>
              {pois.map(poi => (
                <option key={poi.id} value={poi.id}>
                  【{poi.category_name}】{poi.name}
                </option>
              ))}
            </select>
            {selectedPoi && (
              <div style={{
                marginTop: '0.5rem', padding: '0.75rem', background: '#fff5f0',
                borderRadius: '6px', borderLeft: '3px solid #ff6b35', fontSize: '0.9rem'
              }}>
                已关联：{selectedPoi.name} | 人均¥{selectedPoi.avg_price} | {selectedPoi.address}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">上传图片（{images.length}/9）</label>
            <div
              className="image-upload-area"
              onClick={() => images.length < 9 && document.getElementById('imageInput').click()}
              style={{ opacity: images.length >= 9 ? 0.5 : 1 }}
            >
              <p>📷 点击上传图片</p>
              <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.5rem' }}>
                最多9张，建议上传真实探店照片
              </p>
              <input
                id="imageInput"
                type="file"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </div>
            {images.length > 0 && (
              <div className="image-preview-grid">
                {images.map((img, idx) => (
                  <div key={idx} className="image-preview">
                    <img src={img} alt="" />
                    <button
                      type="button"
                      className="image-remove"
                      onClick={() => removeImage(idx)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">笔记内容 * <span style={{color:'#999', fontWeight:'normal'}}>(至少20个字)</span></label>
            <textarea
              className="form-textarea"
              placeholder="分享你的真实探店体验：推荐菜品、环境服务、避坑提示、性价比评价等"
              value={content}
              onChange={(e) => { setContent(e.target.value); setErrorMsg(''); }}
              style={{ minHeight: '200px' }}
            />
            <div style={{ textAlign: 'right', color: content.length < 20 ? '#ef4444' : '#10b981', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              {content.length} 字 {content.length >= 20 ? '✓' : `（还需${20 - content.length}字）`}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">⚠️ 避坑提示 <span style={{color:'#999', fontWeight:'normal'}}>(可选)</span></label>
            <textarea
              className="form-textarea"
              placeholder="提醒其他用户注意的地方（如：排队时间长、性价比低等）"
              value={riskTips}
              onChange={(e) => setRiskTips(e.target.value)}
              style={{ minHeight: '80px', background: '#fff5f5' }}
            />
          </div>

          <div style={{
            background: '#f0f9ff',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            borderLeft: '4px solid #0ea5e9'
          }}>
            <div style={{ fontWeight: 600, color: '#0369a1', marginBottom: '0.5rem' }}>
              📋 内容合规须知
            </div>
            <ul style={{ color: '#666', fontSize: '0.9rem', paddingLeft: '1.2rem' }}>
              <li>禁止发布虚假信息、广告、低俗内容</li>
              <li>请确保内容为真实体验，禁止抄袭搬运</li>
              <li>图片请勿包含水印、二维码等广告信息</li>
              <li>提交后将进入审核队列，通过后展示在首页</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, fontSize: '1rem', padding: '0.8rem' }}
              disabled={submitLoading}
            >
              {submitLoading ? '⏳ 提交中...' : '📝 提交审核'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '1rem', padding: '0.8rem 1.5rem' }}
              onClick={handleCancel}
            >
              取消
            </button>
          </div>
        </form>
      )}

      {showCancelConfirm && (
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
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ marginBottom: '0.5rem' }}>确定取消？</h3>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>已填写的内容将不会保存</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowCancelConfirm(false)}
              >
                继续编辑
              </button>
              <button
                className="btn btn-reject"
                style={{ flex: 1 }}
                onClick={() => navigate(-1)}
              >
                确定取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Publish;
