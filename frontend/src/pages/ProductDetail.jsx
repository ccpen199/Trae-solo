import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [formData, setFormData] = useState({
    travelDate: '',
    travelerCount: 1,
    travelerName: '',
    travelerPhone: '',
    remark: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [id]);

  async function loadProduct() {
    const res = await fetch(`/api/products/${id}`).then(r => r.json());
    if (res.success) {
      setProduct(res.data);
    }
    setLoading(false);
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const orderData = {
      product_id: product.id,
      price: product.price,
      total_price: product.price * formData.travelerCount,
      travel_date: formData.travelDate,
      traveler_count: formData.travelerCount,
      traveler_name: formData.travelerName,
      traveler_phone: formData.travelerPhone,
      contact_name: formData.travelerName,
      contact_phone: formData.travelerPhone,
      remark: formData.remark
    };

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    }).then(r => r.json());

    if (res.success) {
      navigate(`/order-result/${res.data.id}`);
    } else {
      alert('下单失败，请重试');
    }
  }

  if (loading) return <div className="loading">加载中...</div>;
  if (!product) return <div className="empty">商品不存在</div>;

  const totalPrice = product.price * formData.travelerCount;

  return (
    <div>
      <Link to="/" className="back-link">← 返回首页</Link>
      
      <div className="product-detail">
        <div className="detail-header">
          <img className="detail-image" src={product.images} alt={product.title} />
          <div className="detail-info">
            <h1>{product.title}</h1>
            <p className="detail-subtitle">{product.subtitle}</p>
            
            {product.tags && product.tags.length > 0 && (
              <div className="product-tags">
                {product.tags.map((tag, i) => (
                  <span key={i} className="product-tag">{tag}</span>
                ))}
              </div>
            )}

            <div className="detail-price">
              <span className="current-price">¥{product.price}</span>
              <span className="original-price"> / 人起</span>
            </div>
          </div>
        </div>

        <form className="booking-form" onSubmit={handleSubmit}>
          <h3>填写预订信息</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>出行日期</label>
              <input
                type="date"
                name="travelDate"
                value={formData.travelDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>出行人数</label>
              <input
                type="number"
                name="travelerCount"
                min="1"
                value={formData.travelerCount}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>出行人姓名</label>
              <input
                type="text"
                name="travelerName"
                value={formData.travelerName}
                onChange={handleInputChange}
                placeholder="请输入姓名"
                required
              />
            </div>
            <div className="form-group">
              <label>联系电话</label>
              <input
                type="tel"
                name="travelerPhone"
                value={formData.travelerPhone}
                onChange={handleInputChange}
                placeholder="请输入手机号"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>备注（选填）</label>
            <textarea
              name="remark"
              value={formData.remark}
              onChange={handleInputChange}
              placeholder="有特殊需求请备注"
              rows="3"
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '16px', fontSize: '16px' }}>
            总计：<span style={{ color: 'var(--primary-color)', fontSize: '24px', fontWeight: 'bold' }}>¥{totalPrice}</span>
          </div>

          <button type="submit" className="btn btn-primary">立即预订</button>
        </form>

        <div className="share-section">
          <button className="share-btn" onClick={() => alert('分享到微信')}>
            分享到微信
          </button>
          <button className="share-btn" onClick={() => alert('生成海报')}>
            生成海报
          </button>
          <button className="share-btn" onClick={() => navigator.clipboard.writeText(window.location.href) && alert('链接已复制')}>
            复制链接
          </button>
        </div>
      </div>
    </div>
  );
}
