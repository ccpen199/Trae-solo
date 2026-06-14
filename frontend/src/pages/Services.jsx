import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

const serviceCategories = [
  {
    key: 'inspection',
    name: '验房服务',
    icon: '📋',
    description: '专业验房师上门核验，保障房屋质量',
    services: [
      { id: 1, name: '基础验房', price: 299, features: ['房屋外观检查', '水电设施检测', '门窗密封测试', '基础结构检查'], duration: '1-2小时' },
      { id: 2, name: '标准验房', price: 599, features: ['包含基础验房全部', 'VR全景拍摄', '空气质量检测', '噪音测试', '出具专业报告'], duration: '2-3小时' },
      { id: 3, name: '深度验房', price: 999, features: ['包含标准验房全部', '产权核验代办', '邻里背景调查', '周边配套评估', '一对一咨询'], duration: '3-4小时' }
    ]
  },
  {
    key: 'legal',
    name: '法务服务',
    icon: '⚖️',
    description: '专业律师团队，保障交易安全',
    services: [
      { id: 4, name: '合同审核', price: 199, features: ['租赁合同审核', '风险条款提示', '修改建议'], duration: '1个工作日' },
      { id: 5, name: '合同定制', price: 499, features: ['一对一沟通', '专属合同定制', '律师见证', '电子存证'], duration: '2个工作日' },
      { id: 6, name: '纠纷代理', price: 1999, features: ['案件分析', '证据整理', '调解代理', '诉讼指导'], duration: '按实际情况' }
    ]
  },
  {
    key: 'loan',
    name: '贷款服务',
    icon: '💰',
    description: '对接多家银行，最优利率方案',
    services: [
      { id: 7, name: '贷款咨询', price: 99, features: ['资质评估', '方案推荐', '利率对比'], duration: '1小时' },
      { id: 8, name: '贷款代办', price: '1%', features: ['材料准备', '银行对接', '进度跟进', '直到放款'], duration: '15-30天' },
      { id: 9, name: '公积金提取', price: 299, features: ['材料指导', '流程代办', '快速到账'], duration: '3-7天' }
    ]
  }
];

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(/\//g, '-');
};

const formatMoney = (amount) => {
  if (!amount && amount !== 0) return '-';
  return `¥${Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const Services = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState('inspection');
  const [activeTab, setActiveTab] = useState('services');
  const [selectedService, setSelectedService] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [serviceOrders, setServiceOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [completing, setCompleting] = useState(null);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrderId, setReviewOrderId] = useState(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderStep, setOrderStep] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [orderRemark, setOrderRemark] = useState('');

  useEffect(() => {
    fetchServiceOrders();
  }, []);

  const fetchServiceOrders = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/service-orders');
      setServiceOrders(response.data.data || response.data.orders || []);
    } catch (error) {
      console.error('获取服务订单失败:', error);
      if (error.response?.status === 401) {
        setError('请先登录后查看服务订单');
      } else {
        setError(error.response?.data?.message || '获取服务订单失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: '待支付', className: 'badge-warning' },
      paid: { label: '已支付', className: 'badge-info' },
      processing: { label: '服务中', className: 'badge-primary' },
      completed: { label: '已完成', className: 'badge-success' },
      cancelled: { label: '已取消', className: 'badge-danger' }
    };
    return statusMap[status] || { label: status || '未知', className: '' };
  };

  const handleOrder = (service) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedService(service);
    setShowModal(true);
    setOrderSuccess(false);
    setPaySuccess(false);
    setOrderStep(1);
    setSelectedProperty('');
    setOrderRemark('');
  };

  const confirmOrder = async () => {
    setSubmitting(true);
    try {
      const response = await api.post('/service-orders', {
        service_id: selectedService.id,
        service_type: activeCategory,
        service_name: selectedService.name,
        category: activeCategory,
        price: typeof selectedService.price === 'number' ? selectedService.price : 0,
        amount: typeof selectedService.price === 'number' ? selectedService.price : 0,
        property_id: selectedProperty || undefined,
        remark: orderRemark || undefined,
        description: `${selectedService.name}服务选购订单`
      });
      const newOrder = response.data.data || response.data;
      const orderId = newOrder.id || newOrder.order_id;
      setSelectedService(prev => ({ ...prev, currentOrderId: orderId }));
      setServiceOrders(prev => [newOrder, ...prev]);
      setOrderSuccess(true);
      setOrderStep(2);
    } catch (error) {
      console.error('下单失败:', error);
      alert(error.response?.data?.message || '下单失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePay = async (orderId) => {
    setPaying(true);
    try {
      await api.post(`/service-orders/${orderId}/pay`);
      setPaySuccess(true);
      setOrderStep(3);
      setTimeout(() => {
        setPaySuccess(false);
        setShowModal(false);
        fetchServiceOrders();
      }, 2000);
    } catch (error) {
      console.error('支付失败:', error);
      alert(error.response?.data?.message || '支付失败，请稍后重试');
    } finally {
      setPaying(false);
    }
  };

  const handleComplete = async (orderId) => {
    setCompleting(orderId);
    try {
      await api.post(`/service-orders/${orderId}/complete`, {
        rating,
        review
      });
      setShowReviewModal(false);
      setRating(5);
      setReview('');
      setReviewOrderId(null);
      fetchServiceOrders();
      alert('服务评价提交成功！');
    } catch (error) {
      console.error('完成服务失败:', error);
      alert(error.response?.data?.message || '提交失败，请稍后重试');
    } finally {
      setCompleting(null);
    }
  };

  const openReviewModal = (orderId) => {
    setReviewOrderId(orderId);
    setRating(5);
    setReview('');
    setShowReviewModal(true);
  };

  const openEvidenceModal = (order) => {
    setSelectedOrder(order);
    setShowEvidenceModal(true);
  };

  const currentCategory = serviceCategories.find(c => c.key === activeCategory);

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-3">菜单式中介服务</h1>
        <p className="text-gray" style={{ maxWidth: '600px', margin: '0 auto' }}>
          去中介化不等于无服务，我们提供单项专业服务，按需选购，拒绝捆绑消费
        </p>
      </div>

      <div className="tabs mb-8">
        <div 
          className={`tab ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          🛒 服务商城
        </div>
        <div 
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📦 我的订单 ({serviceOrders.length})
        </div>
      </div>

      {activeTab === 'services' && (
        <>
          <div className="flex-center gap-4 mb-8">
            {serviceCategories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                style={{
                  padding: '0.75rem 2rem',
                  border: '2px solid',
                  borderColor: activeCategory === cat.key ? '#1890ff' : '#e8e8e8',
                  borderRadius: '24px',
                  background: activeCategory === cat.key ? '#e6f7ff' : 'white',
                  color: activeCategory === cat.key ? '#1890ff' : '#333',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: activeCategory === cat.key ? 'bold' : 'normal',
                  transition: 'all 0.3s'
                }}
              >
                <span style={{ marginRight: '0.5rem' }}>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>

          <div className="card mb-6" style={{ background: 'linear-gradient(135deg, #667eea10 0%, #764ba210 100%)' }}>
            <div className="card-body text-center">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{currentCategory?.icon}</div>
              <h3 className="font-bold text-xl mb-2">{currentCategory?.name}</h3>
              <p className="text-gray">{currentCategory?.description}</p>
            </div>
          </div>

          <div className="grid grid-3">
            {currentCategory?.services.map(service => (
              <div key={service.id} className="card" style={{ 
                display: 'flex', 
                flexDirection: 'column',
                border: '2px solid transparent',
                transition: 'all 0.3s'
              }}>
                <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 className="font-bold text-xl mb-2">{service.name}</h3>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff4d4f', marginBottom: '1rem' }}>
                    {typeof service.price === 'number' ? `¥${service.price}` : service.price}
                    <span style={{ fontSize: '14px', color: '#999', fontWeight: 'normal' }}>
                      {' '}/ {service.duration}
                    </span>
                  </div>
                  <div style={{ flex: 1, marginBottom: '1.5rem' }}>
                    {service.features.map((feature, i) => (
                      <div key={i} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        marginBottom: '0.5rem',
                        fontSize: '14px'
                      }}>
                        <span style={{ color: '#52c41a' }}>✓</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleOrder(service)}
                    style={{ width: '100%' }}
                  >
                    立即选购
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'orders' && (
        <div className="card">
          <div className="card-header flex-between">
            <h3 className="font-bold">我的服务订单</h3>
            <button className="btn btn-primary" onClick={() => setActiveTab('services')}>
              ➕ 选购新服务
            </button>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center" style={{ padding: '2rem' }}>
                <div className="spinner"></div>
              </div>
            ) : error ? (
              <div className="text-center" style={{ padding: '2rem' }}>
                <p className="text-danger">{error}</p>
                {error.includes('登录') && (
                  <button className="btn btn-primary mt-4" onClick={() => navigate('/login')}>
                    去登录
                  </button>
                )}
              </div>
            ) : !isAuthenticated ? (
              <div className="text-center text-gray" style={{ padding: '3rem' }}>
                请先登录后查看订单
                <div className="mt-2">
                  <button className="btn btn-primary" onClick={() => navigate('/login')}>
                    去登录
                  </button>
                </div>
              </div>
            ) : serviceOrders.length === 0 ? (
              <div className="text-center text-gray" style={{ padding: '3rem' }}>
                暂无服务订单
                <div className="mt-2">
                  <button className="btn btn-primary" onClick={() => setActiveTab('services')}>
                    立即选购
                  </button>
                </div>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>订单号</th>
                    <th>服务项目</th>
                    <th>关联房源</th>
                    <th>金额</th>
                    <th>状态</th>
                    <th>创建时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceOrders.map(order => {
                    const status = getStatusBadge(order.status);
                    return (
                      <tr key={order.id || order.order_no || order.no}>
                        <td className="font-bold">{order.order_no || order.no || order.id}</td>
                        <td>{order.service_name || order.name}</td>
                        <td className="text-sm text-gray">{order.property_title || order.property || '-'}</td>
                        <td style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                          {formatMoney(order.amount || order.price || 0)}
                        </td>
                        <td>
                          <span className={`badge ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="text-gray text-sm">
                          {formatDate(order.created_at)}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            {order.status === 'pending' && (
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }}
                                onClick={() => {
                                  setSelectedService({ 
                                    name: order.service_name || order.name, 
                                    price: order.amount || order.price 
                                  });
                                  setOrderSuccess(true);
                                  setShowModal(true);
                                  setOrderStep(2);
                                  setSelectedService(prev => ({ ...prev, currentOrderId: order.id || order.order_no || order.no }));
                                }}
                              >
                                立即支付
                              </button>
                            )}
                            {order.status === 'processing' && (
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }}
                                onClick={() => openReviewModal(order.id || order.order_no || order.no)}
                              >
                                服务评价
                              </button>
                            )}
                            {order.status === 'completed' && (
                              <button 
                                className="btn" 
                                style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }}
                                onClick={() => openEvidenceModal(order)}
                              >
                                查看存证
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {showModal && (
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
          zIndex: 10000
        }} onClick={() => !orderSuccess && !paySuccess && setShowModal(false)}>
          <div 
            className="card" 
            style={{ width: '480px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="card-body">
              {paySuccess ? (
                <div className="text-center" style={{ padding: '2rem' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                  <h3 className="font-bold text-xl mb-2">支付成功</h3>
                  <p className="text-gray mb-4">我们将尽快安排服务人员与您联系</p>
                  <div className="card" style={{ background: '#f6ffed', textAlign: 'left' }}>
                    <div className="card-body">
                      <p className="text-sm text-gray mb-2">📄 支付凭证已上链存证</p>
                      <p className="text-xs" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        存证哈希: 0x7f3a2c8e9b1d4f6a8c2e9b1d4f6a8c2e...
                      </p>
                    </div>
                  </div>
                </div>
              ) : orderSuccess ? (
                <div className="text-center" style={{ padding: '2rem' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                  <h3 className="font-bold text-xl mb-2">下单成功</h3>
                  <p className="text-gray mb-4">订单号已生成，请完成支付</p>
                  <div style={{ 
                    padding: '1rem', 
                    background: '#f5f5f5', 
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    textAlign: 'left'
                  }}>
                    <div className="flex-between mb-2">
                      <span className="text-gray">订单编号</span>
                      <span className="font-bold">{selectedService?.currentOrderId}</span>
                    </div>
                    <div className="flex-between mb-2">
                      <span className="text-gray">服务项目</span>
                      <span className="font-bold">{selectedService?.name}</span>
                    </div>
                    <div className="flex-between">
                      <span className="text-gray">应付金额</span>
                      <span className="font-bold" style={{ color: '#ff4d4f' }}>
                        {typeof selectedService?.price === 'number' ? formatMoney(selectedService?.price) : selectedService?.price}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%' }}
                    onClick={() => handlePay(selectedService?.currentOrderId)}
                    disabled={paying}
                  >
                    {paying ? '支付中...' : '💳 立即支付'}
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="font-bold text-xl mb-4">确认服务订单</h3>
                  
                  <div className="mb-4">
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '1rem'
                    }}>
                      {[1, 2, 3, 4].map(step => (
                        <div key={step} style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: orderStep >= step ? '#1890ff' : '#d9d9d9',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 0.5rem',
                            fontWeight: 'bold'
                          }}>
                            {orderStep > step ? '✓' : step}
                          </div>
                          <span style={{ 
                            fontSize: '12px', 
                            color: orderStep >= step ? '#1890ff' : '#999' 
                          }}>
                            {step === 1 ? '服务确认' : step === 2 ? '下单' : step === 3 ? '支付' : '完成'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">选择关联房源（可选）</label>
                    <select 
                      className="form-input"
                      value={selectedProperty}
                      onChange={e => setSelectedProperty(e.target.value)}
                    >
                      <option value="">请选择房源</option>
                      <option value="1">朝阳区国贸CBD精装一居室</option>
                      <option value="2">海淀区中关村两居室</option>
                      <option value="3">西城区金融街三居室</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">备注（可选）</label>
                    <textarea 
                      className="form-input"
                      rows="2"
                      value={orderRemark}
                      onChange={e => setOrderRemark(e.target.value)}
                      placeholder="请填写特殊需求..."
                    />
                  </div>

                  <div style={{ 
                    padding: '1rem', 
                    background: '#f5f5f5', 
                    borderRadius: '8px',
                    marginBottom: '1.5rem'
                  }}>
                    <div className="flex-between mb-2">
                      <span className="text-gray">服务项目</span>
                      <span className="font-bold">{selectedService?.name}</span>
                    </div>
                    <div className="flex-between">
                      <span className="text-gray">服务费用</span>
                      <span className="font-bold" style={{ color: '#ff4d4f' }}>
                        {typeof selectedService?.price === 'number' ? formatMoney(selectedService?.price) : selectedService?.price}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      className="btn" 
                      style={{ flex: 1 }}
                      onClick={() => setShowModal(false)}
                    >
                      取消
                    </button>
                    <button 
                      className="btn btn-primary" 
                      style={{ flex: 1 }}
                      onClick={confirmOrder}
                      disabled={submitting}
                    >
                      {submitting ? '提交中...' : '确认下单'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold">服务评价</h3>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">服务评分</label>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      onClick={() => setRating(star)}
                      style={{ 
                        cursor: 'pointer', 
                        color: star <= rating ? '#faad14' : '#d9d9d9',
                        marginRight: '0.5rem'
                      }}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">评价内容</label>
                <textarea
                  className="form-input"
                  rows="4"
                  value={review}
                  onChange={e => setReview(e.target.value)}
                  placeholder="请分享您的服务体验..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowReviewModal(false)}>
                取消
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => handleComplete(reviewOrderId)}
                disabled={completing === reviewOrderId}
              >
                {completing === reviewOrderId ? '提交中...' : '提交评价'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEvidenceModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowEvidenceModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header flex-between">
              <h3 className="font-bold">服务存证详情</h3>
              <button onClick={() => setShowEvidenceModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="card mb-4" style={{ background: '#f6ffed' }}>
                <div className="card-body">
                  <div className="text-center mb-4">
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔗</div>
                    <h4 className="font-bold">区块链存证凭证</h4>
                    <p className="text-gray text-sm">服务完成，数据已上链存证</p>
                  </div>
                  <table className="table" style={{ background: 'white' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '100px', fontWeight: 'bold' }}>存证编号</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                          CERT{selectedOrder.id || selectedOrder.order_no}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>区块高度</td>
                        <td>#2847563</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>存证时间</td>
                        <td>{formatDate(selectedOrder.completed_at || selectedOrder.updated_at)}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>交易哈希</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all' }}>
                          0x7f3a2c8e9b1d4f6a8c2e9b1d4f6a8c2e9b1d4f6a8c2e9b1d4f6a8c2e9b1d4f6a
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedOrder.rating && (
                <div className="card">
                  <div className="card-body">
                    <h5 className="font-bold mb-3">服务评价</h5>
                    <div className="mb-2">
                      {'⭐'.repeat(selectedOrder.rating)}
                      <span className="text-gray ml-2">{selectedOrder.rating}分</span>
                    </div>
                    {selectedOrder.review && (
                      <p className="text-gray">{selectedOrder.review}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowEvidenceModal(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
