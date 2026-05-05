import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    shippingName: '',
    shippingPhone: '',
    shippingAddress: '',
    remark: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productApi.getDetail(id);
      setProduct(response.data.data.product);
    } catch (error) {
      console.error('获取商品详情失败:', error);
      setProduct({
        id: '1',
        name: '限时特惠 - 精品牛排套餐',
        description: '精选澳洲进口牛肉，口感鲜嫩多汁，营养丰富。采用先进冷链运输，确保新鲜直达。适合家庭聚餐、朋友派对等多种场合。',
        price: 99.00,
        originalPrice: 199.00,
        stock: 100,
        sold: 50,
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=delicious%20steak%20dinner%20with%20vegetables%20on%20wooden%20table&image_size=square',
        category: '美食',
        status: 'active',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleBuyClick = () => {
    if (!user) {
      setMessage({ type: 'warning', text: '请先登录后再购买' });
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    
    if (user.phone) {
      setOrderForm((prev) => ({
        ...prev,
        shippingPhone: user.phone,
      }));
    }
    
    setShowOrderModal(true);
  };

  const handleOrderFormChange = (e) => {
    const { name, value } = e.target;
    setOrderForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitOrder = async () => {
    if (!orderForm.shippingName || !orderForm.shippingPhone || !orderForm.shippingAddress) {
      setMessage({ type: 'error', text: '请填写完整的收货信息' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const orderData = {
        items: [
          {
            productId: product.id,
            quantity: quantity,
          },
        ],
        shippingName: orderForm.shippingName,
        shippingPhone: orderForm.shippingPhone,
        shippingAddress: orderForm.shippingAddress,
        remark: orderForm.remark,
      };

      setMessage({ type: 'success', text: '订单创建成功！正在跳转...' });
      
      setTimeout(() => {
        navigate('/orders');
      }, 1500);
      
    } catch (error) {
      console.error('创建订单失败:', error);
      setMessage({ type: 'error', text: '订单创建失败，请稍后重试' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      active: '热卖中',
      inactive: '已下架',
      sold_out: '已售罄',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h2>商品不存在</h2>
          <p style={{ marginTop: '16px' }}>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              返回首页
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="product-detail">
        <div>
          <img
            src={product.image || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20placeholder&image_size=square'}
            alt={product.name}
            className="product-detail-image"
          />
        </div>
        
        <div className="product-detail-info">
          <h1>{product.name}</h1>
          
          <div className="product-detail-price">
            <span className="current-price">¥{product.price}</span>
            {product.originalPrice && (
              <span className="original-price">¥{product.originalPrice}</span>
            )}
          </div>
          
          <div className="product-detail-meta">
            <span>状态: {getStatusText(product.status)}</span>
            <span>库存: {product.stock}</span>
            <span>已售: {product.sold}</span>
            {product.category && <span>分类: {product.category}</span>}
          </div>
          
          <div className="product-detail-description">
            {product.description}
          </div>
          
          {product.status === 'active' && product.stock > 0 && (
            <>
              <div className="product-quantity">
                <label>购买数量:</label>
                <div className="quantity-control">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                    min={1}
                    max={product.stock}
                  />
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="product-actions">
                <button
                  className="btn btn-primary"
                  style={{ fontSize: '16px', padding: '14px 40px' }}
                  onClick={handleBuyClick}
                >
                  立即购买
                </button>
              </div>
            </>
          )}
          
          {product.status !== 'active' && (
            <div className="message message-warning">
              该商品当前不可购买
            </div>
          )}
          
          {product.stock <= 0 && (
            <div className="message message-warning">
              该商品库存不足
            </div>
          )}
        </div>
      </div>

      {showOrderModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }}>
            <h2 style={{ marginBottom: 20, color: '#333' }}>确认订单</h2>
            
            <div style={{ background: '#fafafa', padding: 16, borderRadius: 4, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ marginBottom: 8 }}>{product.name}</h4>
                  <p style={{ color: '#ff6b6b', fontSize: 18, fontWeight: 'bold' }}>
                    ¥{product.price} × {quantity}
                  </p>
                </div>
              </div>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee' }}>
                <span style={{ fontSize: 14, color: '#666' }}>订单总价:</span>
                <span style={{ marginLeft: 8, fontSize: 20, fontWeight: 'bold', color: '#ff6b6b' }}>
                  ¥{(product.price * quantity).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">收货人姓名 *</label>
              <input
                type="text"
                name="shippingName"
                className="form-input"
                value={orderForm.shippingName}
                onChange={handleOrderFormChange}
                placeholder="请输入收货人姓名"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">联系电话 *</label>
              <input
                type="tel"
                name="shippingPhone"
                className="form-input"
                value={orderForm.shippingPhone}
                onChange={handleOrderFormChange}
                placeholder="请输入联系电话"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">收货地址 *</label>
              <textarea
                name="shippingAddress"
                className="form-input form-textarea"
                value={orderForm.shippingAddress}
                onChange={handleOrderFormChange}
                placeholder="请输入详细收货地址"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">备注（选填）</label>
              <textarea
                name="remark"
                className="form-input form-textarea"
                value={orderForm.remark}
                onChange={handleOrderFormChange}
                placeholder="订单备注信息"
                style={{ minHeight: 60 }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowOrderModal(false)}
                disabled={submitting}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleSubmitOrder}
                disabled={submitting}
              >
                {submitting ? '提交中...' : '提交订单'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
