import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

function Tryon({ currentUser }) {
  const navigate = useNavigate();
  const { orderId } = useParams();
  
  const [step, setStep] = useState(1);
  const [order, setOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    cameraInfo: '',
    responsiblePerson: '',
    expectedTime: ''
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [productsResponse, usersResponse] = await Promise.all([
        api.getProducts(),
        api.getUsers()
      ]);
      
      if (productsResponse.success) {
        setProducts(productsResponse.data);
      }
      if (usersResponse.success) {
        setUsers(usersResponse.data);
      }
    } catch (error) {
      console.error('加载初始数据失败:', error);
    }
  };

  const handleCreateOrder = async () => {
    if (!formData.responsiblePerson) {
      setMessage({ type: 'error', text: '请选择责任人' });
      return;
    }

    try {
      setLoading(true);
      const response = await api.createOrder({
        consumerId: currentUser.id,
        consumerName: currentUser.name
      }, currentUser);

      if (response.success) {
        setOrder(response.order);
        setMessage({ type: 'success', text: '订单创建成功！' });
        setTimeout(() => {
          handleOpenCamera(response.order.id);
        }, 500);
      } else {
        setMessage({ type: 'error', text: response.message || '创建订单失败' });
      }
    } catch (error) {
      console.error('创建订单失败:', error);
      setMessage({ type: 'error', text: error.message || '创建订单失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCamera = async (orderIdToUse) => {
    try {
      setLoading(true);
      const targetOrderId = orderIdToUse || order?.id;
      
      const response = await api.openCamera(targetOrderId, {
        cameraInfo: formData.cameraInfo || { type: 'front', resolution: '1080p' },
        cameraAttachments: null,
        responsiblePerson: formData.responsiblePerson,
        expectedTime: formData.expectedTime
      }, currentUser);

      if (response.success) {
        setOrder(response.order);
        setStep(2);
        setMessage({ type: 'success', text: '摄像头已打开，准备识别...' });
      } else {
        setMessage({ type: 'error', text: response.message || '打开摄像头失败' });
      }
    } catch (error) {
      console.error('打开摄像头失败:', error);
      setMessage({ type: 'error', text: error.message || '打开摄像头失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleRecognize = async () => {
    try {
      setLoading(true);
      const response = await api.recognize(order.id, { recognitionType: 'both' }, currentUser);

      if (response.success) {
        setOrder(response.order);
        setStep(3);
        setMessage({ type: 'success', text: '识别完成！请选择商品进行试穿' });
      } else {
        setMessage({ type: 'error', text: response.message || '识别失败' });
      }
    } catch (error) {
      console.error('识别失败:', error);
      setMessage({ type: 'error', text: error.message || '识别失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartTryon = async (product) => {
    try {
      setLoading(true);
      const response = await api.startTryon(order.id, product.id, currentUser);

      if (response.success) {
        setSelectedProduct(product);
        setOrder(response.order);
        setStep(4);
        setMessage({ type: 'success', text: `已选择 ${product.name}，正在渲染试穿效果...` });
      } else {
        setMessage({ type: 'error', text: response.message || '开始试穿失败' });
      }
    } catch (error) {
      console.error('开始试穿失败:', error);
      setMessage({ type: 'error', text: error.message || '开始试穿失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTryon = async () => {
    try {
      setLoading(true);
      const response = await api.completeTryon(order.id, {
        productId: selectedProduct.id,
        tryonResult: {
          fitScore: 95,
          offset: { x: 0, y: 0 },
          scale: 1.0
        }
      }, currentUser);

      if (response.success) {
        setOrder(response.order);
        setStep(5);
        setMessage({ type: 'success', text: '试穿完成！可以保存分享了' });
      } else {
        setMessage({ type: 'error', text: response.message || '完成试穿失败' });
      }
    } catch (error) {
      console.error('完成试穿失败:', error);
      setMessage({ type: 'error', text: error.message || '完成试穿失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveShare = async () => {
    try {
      setLoading(true);
      const response = await api.saveShare(order.id, {
        screenshotIds: [],
        sharePlatforms: [],
        comment: '试穿效果满意'
      }, currentUser);

      if (response.success) {
        setOrder(response.order);
        setStep(6);
        setMessage({ type: 'success', text: '保存分享完成！' });
      } else {
        setMessage({ type: 'error', text: response.message || '保存分享失败' });
      }
    } catch (error) {
      console.error('保存分享失败:', error);
      setMessage({ type: 'error', text: error.message || '保存分享失败' });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, label: '打开摄像头', icon: '📷' },
    { id: 2, label: '人脸/人体识别', icon: '👤' },
    { id: 3, label: '选择商品', icon: '👕' },
    { id: 4, label: '叠加试穿', icon: '✨' },
    { id: 5, label: '保存分享', icon: '📤' },
    { id: 6, label: '完成', icon: '✅' }
  ];

  const guideUsers = users.filter(u => ['guide', 'operator', 'brand'].includes(u.role));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>AR 试穿体验</h2>
        <button className="btn btn-default" onClick={() => navigate('/orders')}>
          查看订单列表
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`}>
          {message.text}
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          {steps.map((s, index) => (
            <React.Fragment key={s.id}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                opacity: step >= s.id ? 1 : 0.4
              }}>
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: '50%',
                  background: step > s.id ? '#52c41a' : step === s.id ? '#1890ff' : '#f0f0f0',
                  color: step >= s.id ? 'white' : '#999',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  marginBottom: 4
                }}>
                  {step > s.id ? '✓' : s.icon}
                </div>
                <div style={{ fontSize: 12, color: step === s.id ? '#1890ff' : '#666' }}>
                  {s.label}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div style={{ 
                  flex: 1, 
                  height: 2, 
                  background: step > s.id ? '#52c41a' : '#f0f0f0',
                  maxWidth: 80,
                  minWidth: 20
                }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {order && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 500 }}>订单号:</span> {order.order_no}
              <span style={{ marginLeft: 16 }}>
                <span className={`status-badge status-${order.status}`}>
                  {getStatusLabel(order.status)}
                </span>
              </span>
            </div>
            <button 
              className="btn btn-default"
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              查看订单详情
            </button>
          </div>
        </div>
      )}

      <div className="card">
        {step === 1 && (
          <div>
            <h2>步骤 1: 打开摄像头</h2>
            <div className="alert alert-info">
              请填写摄像头相关信息，系统将为您创建试穿订单。
            </div>
            
            <div style={{ maxWidth: 500 }}>
              <div className="form-group">
                <label>摄像头配置</label>
                <select
                  className="form-control"
                  value={formData.cameraInfo}
                  onChange={(e) => setFormData({ ...formData, cameraInfo: e.target.value })}
                >
                  <option value="">选择摄像头</option>
                  <option value="front">前置摄像头</option>
                  <option value="back">后置摄像头</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>责任人 <span style={{ color: '#ff4d4f' }}>*</span></label>
                <select
                  className="form-control"
                  value={formData.responsiblePerson}
                  onChange={(e) => setFormData({ ...formData, responsiblePerson: e.target.value })}
                >
                  <option value="">请选择责任人</option>
                  {guideUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({getRoleLabel(user.role)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>期望完成时间</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formData.expectedTime}
                  onChange={(e) => setFormData({ ...formData, expectedTime: e.target.value })}
                />
              </div>
              
              <div className="action-bar" style={{ borderTop: 'none', marginTop: 0 }}>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateOrder}
                  disabled={loading}
                >
                  {loading ? '创建中...' : '开始试穿体验'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2>步骤 2: 人脸/人体识别</h2>
            <div className="alert alert-info">
              系统正在执行人脸和人体识别，请确保摄像头对准您的面部和身体。
            </div>
            
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ 
                width: 200, 
                height: 200, 
                margin: '0 auto 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 80,
                color: 'white'
              }}>
                👤
              </div>
              <p style={{ color: '#666', marginBottom: 20 }}>
                识别模块已就绪，点击下方按钮开始识别
              </p>
              
              <div className="action-bar" style={{ borderTop: 'none', marginTop: 0, justifyContent: 'center' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleRecognize}
                  disabled={loading}
                >
                  {loading ? '识别中...' : '开始识别'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2>步骤 3: 选择商品</h2>
            <div className="alert alert-info">
              识别完成！请从商品库中选择您想试穿的商品。
            </div>
            
            <div className="product-grid">
              {products.map(product => (
                <div 
                  key={product.id} 
                  className="product-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleStartTryon(product)}
                >
                  <div className="product-image">
                    {product.category === 'eyewear' && '👓'}
                    {product.category === 'clothing' && '👕'}
                    {product.category === 'accessories' && '🎩'}
                    {!['eyewear', 'clothing', 'accessories'].includes(product.category) && '📦'}
                  </div>
                  <div className="product-info">
                    <div className="product-name">{product.name}</div>
                    <div className="product-category">
                      {getCategoryLabel(product.category)}
                    </div>
                    <div className="product-price">¥{product.price}</div>
                    {product.model_3d_url && (
                      <div style={{ fontSize: 12, color: '#1890ff', marginTop: 4 }}>
                        ✨ 支持3D试穿
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && selectedProduct && (
          <div>
            <h2>步骤 4: 叠加试穿</h2>
            <div className="alert alert-info">
              正在为您渲染 <strong>{selectedProduct.name}</strong> 的试穿效果...
            </div>
            
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ 
                width: 300, 
                height: 400, 
                margin: '0 auto 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                position: 'relative'
              }}>
                <div style={{ fontSize: 100 }}>👤</div>
                <div style={{ 
                  position: 'absolute', 
                  top: 80, 
                  fontSize: 60,
                  opacity: 0.8
                }}>
                  {selectedProduct.category === 'eyewear' && '👓'}
                  {selectedProduct.category === 'clothing' && '👕'}
                  {selectedProduct.category === 'accessories' && '🎩'}
                </div>
                <div style={{ marginTop: 16, fontSize: 14, opacity: 0.8 }}>
                  试穿效果预览
                </div>
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ marginBottom: 8 }}>{selectedProduct.name}</h3>
                <p style={{ color: '#666' }}>
                  价格: <span style={{ color: '#ff4d4f', fontWeight: 500 }}>¥{selectedProduct.price}</span>
                </p>
              </div>
              
              <div className="action-bar" style={{ borderTop: 'none', marginTop: 0, justifyContent: 'center' }}>
                <button
                  className="btn btn-default"
                  onClick={() => setStep(3)}
                  disabled={loading}
                >
                  换一件商品
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCompleteTryon}
                  disabled={loading}
                >
                  {loading ? '处理中...' : '确认试穿效果'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2>步骤 5: 保存分享</h2>
            <div className="alert alert-info">
              试穿效果已生成！您可以保存截图并分享给朋友。
            </div>
            
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ 
                width: 300, 
                height: 200, 
                margin: '0 auto 20px',
                background: '#fafafa',
                border: '2px dashed #d9d9d9',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999'
              }}>
                📸 截图预览区域
              </div>
              
              <div className="action-bar" style={{ borderTop: 'none', marginTop: 0, justifyContent: 'center' }}>
                <button
                  className="btn btn-success"
                  onClick={handleSaveShare}
                  disabled={loading}
                >
                  {loading ? '保存中...' : '保存并分享'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            <h2>🎉 试穿完成！</h2>
            <div className="alert alert-success">
              您的 AR 试穿体验已完成！订单已更新，您可以继续下单或查看订单详情。
            </div>
            
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 80, marginBottom: 20 }}>✅</div>
              <h3 style={{ marginBottom: 20 }}>试穿体验已完成</h3>
              <p style={{ color: '#666', marginBottom: 20 }}>
                您可以继续查看订单详情，或返回订单列表管理您的试穿订单。
              </p>
              
              <div className="action-bar" style={{ borderTop: 'none', marginTop: 0, justifyContent: 'center' }}>
                <button
                  className="btn btn-default"
                  onClick={() => navigate('/orders')}
                >
                  查看订单列表
                </button>
                {order && (
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    查看订单详情
                  </button>
                )}
                <button
                  className="btn btn-success"
                  onClick={() => {
                    setStep(1);
                    setOrder(null);
                    setSelectedProduct(null);
                    setFormData({ cameraInfo: '', responsiblePerson: '', expectedTime: '' });
                  }}
                >
                  开始新的试穿
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusLabel(status) {
  const labels = {
    draft: '草稿',
    camera_opened: '摄像头已打开',
    pending_recognition: '待识别',
    recognition_in_progress: '识别中',
    recognition_completed: '识别完成',
    pending_tryon: '待试穿',
    tryon_in_progress: '试穿中',
    tryon_completed: '试穿完成',
    shared: '已分享',
    pending_approval: '待审批',
    approved: '已通过',
    rejected: '已驳回',
    order_placed: '已下单',
    paid: '已支付',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
    reversed: '已逆向'
  };
  return labels[status] || status;
}

function getRoleLabel(role) {
  const labels = {
    consumer: '消费者',
    guide: '导购',
    operator: '运营',
    brand: '品牌管理员'
  };
  return labels[role] || role;
}

function getCategoryLabel(category) {
  const labels = {
    eyewear: '眼镜',
    clothing: '服饰',
    accessories: '配饰'
  };
  return labels[category] || category;
}

export default Tryon;
