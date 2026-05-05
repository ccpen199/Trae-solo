import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../App';
import { businessApi, userApi } from '../services/api';

function BusinessPurchase() {
  const { DEMO_USER_ID, showNotification, refreshUserInfo, userInfo } = useContext(AppContext);
  const [businessLines, setBusinessLines] = useState([]);
  const [selectedLine, setSelectedLine] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState(null);
  const [discountInfo, setDiscountInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await businessApi.getLines();
        if (response.data.success) {
          setBusinessLines(response.data.data);
          if (response.data.data.length > 0) {
            selectBusinessLine(response.data.data[0]);
          }
        }
      } catch (error) {
        console.error('获取业务线失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [DEMO_USER_ID]);

  const selectBusinessLine = async (line) => {
    setSelectedLine(line);
    setProducts([]);
    setDiscountInfo(null);
    
    try {
      const [productRes, discountRes] = await Promise.all([
        businessApi.getProducts(line.id),
        userApi.getDiscount(DEMO_USER_ID, line.id)
      ]);
      
      if (productRes.data.success) {
        setProducts(productRes.data.data.products);
      }
      if (discountRes.data.success) {
        setDiscountInfo(discountRes.data.data);
      }
    } catch (error) {
      console.error('获取产品/优惠失败:', error);
    }
  };

  const handlePurchase = (product) => {
    setSelectedProduct(product);
    setPurchaseResult(null);
    setShowModal(true);
  };

  const confirmPurchase = async () => {
    if (!selectedProduct) return;
    
    setPurchasing(true);
    try {
      const productCode = selectedProduct.product_code || selectedProduct.id;
      const response = await businessApi.purchase({
        userId: DEMO_USER_ID,
        businessLineId: selectedLine.id,
        productCode: productCode,
        originalAmount: selectedProduct.price
      });

      if (response.data.success) {
        setPurchaseResult(response.data.data);
        showNotification('success', '购买成功！积分和成长值已入账');
        await refreshUserInfo();
        
        if (selectedLine) {
          await selectBusinessLine(selectedLine);
        }
        
        const discountRes = await userApi.getDiscount(DEMO_USER_ID, selectedLine.id);
        if (discountRes.data.success) {
          setDiscountInfo(discountRes.data.data);
        }
      }
    } catch (error) {
      console.error('购买失败:', error);
      showNotification('error', '购买失败：' + (error.response?.data?.error || error.message));
    } finally {
      setPurchasing(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setPurchaseResult(null);
  };

  const calculateDiscountPrice = (price) => {
    if (!discountInfo || !discountInfo.hasDiscount) {
      return { discountAmount: 0, finalPrice: price, discountPercent: 0 };
    }
    
    const discountPercent = 1 - discountInfo.discountPercent;
    let discountAmount = Math.floor(price * discountPercent);
    
    if (discountInfo.max_discount_amount && discountAmount > discountInfo.max_discount_amount) {
      discountAmount = discountInfo.max_discount_amount;
    }
    
    return {
      discountAmount,
      finalPrice: price - discountAmount,
      discountPercent: discountPercent * 100
    };
  };

  const formatCurrency = (fen) => {
    return (fen / 100).toFixed(2);
  };

  const getBusinessIcon = (code) => {
    const icons = {
      'HOTEL': '🏨',
      'FLIGHT': '✈️',
      'TICKET': '🎫',
      'TRAIN': '🚄',
      'CAR': '🚗',
      'VACATION': '🌴',
      'GROUP_BUY': '🛍️',
      'INSURANCE': '🛡️'
    };
    return icons[code] || '📦';
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>加载业务线数据中...</p>
      </div>
    );
  }

  return (
    <div className="purchase-page">
      <div className="card">
        <div className="card-header">选择业务线</div>
        <div className="business-tabs">
          {businessLines.map(line => (
            <div
              key={line.id}
              className={`tab-item ${selectedLine?.id === line.id ? 'active' : ''}`}
              onClick={() => selectBusinessLine(line)}
            >
              <span style={{ marginRight: '6px' }}>{getBusinessIcon(line.code)}</span>
              {line.name}
            </div>
          ))}
        </div>
        
        {selectedLine && (
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            alignItems: 'center',
            padding: '16px',
            background: '#f9f9f9',
            borderRadius: '8px',
            marginTop: '16px'
          }}>
            <div style={{ fontSize: '48px' }}>{getBusinessIcon(selectedLine.code)}</div>
            <div>
              <h3 style={{ marginBottom: '8px' }}>{selectedLine.name}</h3>
              <p style={{ fontSize: '13px', color: '#666' }}>{selectedLine.description}</p>
              <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '13px' }}>
                <span>
                  <strong>成长值系数:</strong> x{selectedLine.growth_coefficient}
                </span>
                <span>
                  <strong>积分系数:</strong> x{selectedLine.point_coefficient}
                </span>
                {discountInfo?.hasDiscount && (
                  <span>
                    <strong>等级优惠:</strong> 
                    <span className="badge badge-success" style={{ marginLeft: '6px' }}>
                      {discountInfo.discount_percent * 100} 折
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedLine && (
        <div className="card">
          <div className="card-header">
            {selectedLine.name}产品
            {discountInfo?.hasDiscount && (
              <span className="badge badge-success" style={{ marginLeft: '12px' }}>
                您当前{userInfo?.userInfo?.user?.level_name}可享 {(1 - discountInfo.discountPercent) * 100}% 优惠
              </span>
            )}
          </div>
          
          {products.length > 0 ? (
            <div className="product-grid">
              {products.map(product => {
                const priceInfo = calculateDiscountPrice(product.price);
                const stock = product.stock !== undefined ? product.stock : (product.available !== false ? 999 : 0);
                const hasStock = stock > 0;
                const isLowStock = hasStock && stock <= 3;
                
                return (
                  <div 
                    key={product.id} 
                    className="product-card"
                    style={{ 
                      opacity: hasStock ? 1 : 0.6,
                      filter: hasStock ? 'none' : 'grayscale(50%)'
                    }}
                  >
                    <div className="product-header">
                      <div className="product-name">
                        {product.name}
                        {isLowStock && (
                          <span className="badge badge-warning" style={{ marginLeft: '8px' }}>
                            仅剩 {stock} 份
                          </span>
                        )}
                        {!hasStock && (
                          <span className="badge badge-danger" style={{ marginLeft: '8px' }}>
                            已售罄
                          </span>
                        )}
                      </div>
                      <div className="product-desc">{product.description}</div>
                      {stock !== undefined && stock < 999 && (
                        <div style={{ fontSize: '11px', color: isLowStock ? '#ef6c00' : '#666', marginTop: '4px' }}>
                          📦 库存: {stock} / {product.max_stock || stock}
                        </div>
                      )}
                    </div>
                    <div className="product-body">
                      <div className="price-section">
                        {priceInfo.discountAmount > 0 && (
                          <span className="original-price">¥{formatCurrency(product.price)}</span>
                        )}
                        <span className="discount-price">¥{formatCurrency(priceInfo.finalPrice)}</span>
                        {priceInfo.discountAmount > 0 && (
                          <span className="discount-tag">
                            省 ¥{formatCurrency(priceInfo.discountAmount)}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        消费 {formatCurrency(priceInfo.finalPrice)} 元
                        <br />
                        预计获得: 
                        <strong style={{ color: '#2e7d32', marginLeft: '4px' }}>
                          {Math.floor(priceInfo.finalPrice / 100 * selectedLine.growth_coefficient)} 成长值
                        </strong>
                        <strong style={{ color: '#ff6b00', marginLeft: '8px' }}>
                          {Math.floor(priceInfo.finalPrice / 100 * selectedLine.point_coefficient)} 积分
                        </strong>
                      </div>
                    </div>
                    <div className="product-action">
                      <button 
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        onClick={() => handlePurchase(product)}
                        disabled={!hasStock}
                      >
                        {hasStock ? '立即购买' : '已售罄'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
              暂无产品数据
            </p>
          )}
        </div>
      )}

      {showModal && selectedProduct && (
        <div className="purchase-modal" onClick={closeModal}>
          <div className="purchase-modal-content" onClick={e => e.stopPropagation()}>
            {!purchaseResult ? (
              <>
                <div className="modal-header">
                  <div className="modal-title">确认订单</div>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="modal-body">
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ marginBottom: '8px' }}>{selectedProduct.name}</h4>
                    <p style={{ fontSize: '13px', color: '#666' }}>{selectedProduct.description}</p>
                  </div>
                  
                  <div className="order-summary">
                    <div className="order-row">
                      <span>商品原价</span>
                      <span>¥{formatCurrency(selectedProduct.price)}</span>
                    </div>
                    {calculateDiscountPrice(selectedProduct.price).discountAmount > 0 && (
                      <div className="order-row discount-row">
                        <span>
                          等级优惠 ({userInfo?.userInfo?.user?.level_name})
                          {discountInfo?.max_discount_amount && (
                            <span style={{ fontSize: '11px', color: '#999', marginLeft: '8px' }}>
                              (最高优惠 ¥{formatCurrency(discountInfo.max_discount_amount)})
                            </span>
                          )}
                        </span>
                        <span>-¥{formatCurrency(calculateDiscountPrice(selectedProduct.price).discountAmount)}</span>
                      </div>
                    )}
                    <div className="order-row total">
                      <span>实付金额</span>
                      <span style={{ color: '#ff6b00' }}>
                        ¥{formatCurrency(calculateDiscountPrice(selectedProduct.price).finalPrice)}
                      </span>
                    </div>
                  </div>

                  <div style={{ 
                    padding: '16px', 
                    background: '#e8f5e9', 
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}>
                    <p style={{ marginBottom: '8px', fontWeight: 600 }}>📊 本次消费预计获得:</p>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <span>
                        ✨ 成长值: <strong>{Math.floor(calculateDiscountPrice(selectedProduct.price).finalPrice / 100 * selectedLine.growth_coefficient)}</strong>
                        <span style={{ color: '#666', fontSize: '12px' }}>
                          (系数 x{selectedLine.growth_coefficient})
                        </span>
                      </span>
                      <span>
                        💰 积分: <strong>{Math.floor(calculateDiscountPrice(selectedProduct.price).finalPrice / 100 * selectedLine.point_coefficient)}</strong>
                        <span style={{ color: '#666', fontSize: '12px' }}>
                          (系数 x{selectedLine.point_coefficient})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeModal}>
                    取消
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={confirmPurchase}
                    disabled={purchasing}
                  >
                    {purchasing ? '处理中...' : '确认支付'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-header">
                  <div className="modal-title">购买结果</div>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="modal-body">
                  <div className="success-detail">
                    <div className="success-icon">✅</div>
                    <div className="success-title">购买成功!</div>
                    <p style={{ color: '#666', marginBottom: '16px' }}>
                      订单号: {purchaseResult.orderDetail?.order?.order_no}
                    </p>
                    
                    <div className="result-stats">
                      <div className="result-stat">
                        <div className="result-stat-value">
                          +{purchaseResult.pointResult?.awardedPoints || 0}
                        </div>
                        <div className="result-stat-label">积分已入账</div>
                      </div>
                      <div className="result-stat">
                        <div className="result-stat-value">
                          +{purchaseResult.growthResult?.growthCalculation?.growthAmount || 0}
                        </div>
                        <div className="result-stat-label">成长值已累计</div>
                      </div>
                      <div className="result-stat">
                        <div className="result-stat-value">
                          {purchaseResult.userAfterPurchase?.level}
                        </div>
                        <div className="result-stat-label">当前等级</div>
                      </div>
                    </div>

                    {purchaseResult.userAfterPurchase?.levelUpgraded && (
                      <div className="level-up-alert">
                        🎉 恭喜升级！您已成为 {purchaseResult.userAfterPurchase?.level} 会员
                      </div>
                    )}

                    {purchaseResult.userAfterPurchase?.progressToNext && (
                      <div style={{ marginTop: '20px', textAlign: 'left' }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          marginBottom: '8px',
                          fontSize: '13px'
                        }}>
                          <span>距离 {purchaseResult.userAfterPurchase.progressToNext.nextLevelName}</span>
                          <span>还需 {purchaseResult.userAfterPurchase.progressToNext.neededForNext} 成长值</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-bar-fill" 
                            style={{ width: `${purchaseResult.userAfterPurchase.progressToNext.progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeModal}>
                    关闭
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      closeModal();
                      window.location.hash = '#/';
                    }}
                  >
                    查看用户中心
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BusinessPurchase;
