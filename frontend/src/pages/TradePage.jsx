import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useMarketStore, usePortfolioStore, useAuthStore } from '../store';
import { marketApi, orderApi, fundsApi, positionApi } from '../api';
import { wsService } from '../websocket';

const TradePage = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { securities, setSecurities, marketData, setMarketData, selectedSecurity, setSelectedSecurity, addSubscription, removeSubscription } = useMarketStore();
  const { funds, setFunds, positions, setPositions } = usePortfolioStore();
  
  const [direction, setDirection] = useState('buy');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (location.state?.security) {
      handleSelectSecurity(location.state.security);
    }
  }, [location.state]);

  useEffect(() => {
    if (marketData && selectedSecurity) {
      if (marketData.currentPrice && !price) {
        setPrice(marketData.currentPrice.toFixed(2));
      }
    }
  }, [marketData, selectedSecurity]);

  const loadInitialData = async () => {
    try {
      const [securitiesRes, fundsRes, positionsRes] = await Promise.all([
        marketApi.getSecurities(),
        fundsApi.getFunds(),
        positionApi.getPositions()
      ]);
      setSecurities(securitiesRes.data);
      setFunds(fundsRes.data);
      setPositions(positionsRes.data);

      if (securitiesRes.data.length > 0 && !selectedSecurity) {
        handleSelectSecurity(securitiesRes.data[0]);
      }
    } catch (err) {
      console.error('加载初始数据失败:', err);
    }
  };

  const handleSelectSecurity = async (security) => {
    if (selectedSecurity) {
      wsService.unsubscribe('market_data', selectedSecurity.code);
      removeSubscription(selectedSecurity.code);
    }

    setSelectedSecurity(security);
    setMessage({ type: '', text: '' });

    try {
      const res = await marketApi.getSecurity(security.code);
      setMarketData(res.data);
      
      if (res.data.currentPrice) {
        setPrice(res.data.currentPrice.toFixed(2));
      }

      wsService.subscribe('market_data', security.code);
      addSubscription(security.code);
      setIsSubscribed(true);

    } catch (err) {
      console.error('获取证券详情失败:', err);
    }
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPrice(value);
    }
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setQuantity(value);
    }
  };

  const getMaxBuyQuantity = () => {
    if (!funds || !price) return 0;
    const available = funds.available_balance || 0;
    const priceVal = parseFloat(price) || 0;
    if (priceVal <= 0) return 0;
    const maxShares = Math.floor(available / priceVal);
    return Math.floor(maxShares / 100) * 100;
  };

  const getMaxSellQuantity = () => {
    if (!positions || !selectedSecurity) return 0;
    const pos = positions.find(p => p.security_code === selectedSecurity.code);
    return pos ? Math.floor(pos.available_quantity / 100) * 100 : 0;
  };

  const handleQuickQuantity = (ratio) => {
    let maxQty;
    if (direction === 'buy') {
      maxQty = getMaxBuyQuantity();
    } else {
      maxQty = getMaxSellQuantity();
    }

    if (ratio === 'all') {
      setQuantity(maxQty.toString());
    } else if (ratio === 1/4) {
      setQuantity(Math.floor(maxQty / 4 / 100) * 100 + '');
    } else if (ratio === 1/3) {
      setQuantity(Math.floor(maxQty / 3 / 100) * 100 + '');
    } else if (ratio === 1/2) {
      setQuantity(Math.floor(maxQty / 2 / 100) * 100 + '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    if (!selectedSecurity) {
      setMessage({ type: 'error', text: '请选择证券' });
      return;
    }
    
    const priceVal = parseFloat(price);
    if (!price || isNaN(priceVal) || priceVal <= 0) {
      setMessage({ type: 'error', text: '请输入有效价格' });
      return;
    }
    
    const qtyVal = parseInt(quantity);
    if (!quantity || isNaN(qtyVal) || qtyVal < 100) {
      setMessage({ type: 'error', text: '委托数量必须大于等于100股' });
      return;
    }
    
    if (qtyVal % 100 !== 0) {
      setMessage({ type: 'error', text: '委托数量必须为100的整数倍' });
      return;
    }

    if (direction === 'buy' && qtyVal > getMaxBuyQuantity()) {
      setMessage({ type: 'error', text: '可用资金不足，最大可买 ' + getMaxBuyQuantity() + ' 股' });
      return;
    }

    if (direction === 'sell' && qtyVal > getMaxSellQuantity()) {
      setMessage({ type: 'error', text: '可用持仓不足，最大可卖 ' + getMaxSellQuantity() + ' 股' });
      return;
    }

    if (marketData && marketData.prevClose) {
      const upperLimit = marketData.prevClose * 1.1;
      const lowerLimit = marketData.prevClose * 0.9;
      if (priceVal > upperLimit || priceVal < lowerLimit) {
        setMessage({ type: 'error', text: `价格超出涨跌幅限制，范围 ${lowerLimit.toFixed(2)} - ${upperLimit.toFixed(2)}` });
        return;
      }
    }

    try {
      setLoading(true);

      const res = await orderApi.createOrder(
        selectedSecurity.code,
        direction,
        priceVal,
        qtyVal,
        'limit'
      );

      setMessage({ type: 'success', text: `委托成功！订单号: ${res.data.order.order_no}` });
      setQuantity('');

      const [fundsRes, positionsRes] = await Promise.all([
        fundsApi.getFunds(),
        positionApi.getPositions()
      ]);
      setFunds(fundsRes.data);
      setPositions(positionsRes.data);

    } catch (err) {
      console.error('下单失败:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || '下单失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  const estimatedAmount = selectedSecurity && price && quantity 
    ? (parseFloat(price || 0) * parseInt(quantity || 0)).toFixed(2)
    : '0.00';

  const maxBuyQty = getMaxBuyQuantity();
  const maxSellQty = getMaxSellQuantity();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', color: '#1f2937' }}>委托下单</h3>
        
        {message.text && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '14px',
            background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: message.type === 'success' ? '#065f46' : '#991b1b'
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
              选择证券
              {isSubscribed && selectedSecurity && (
                <span style={{ marginLeft: '8px', fontSize: '12px', color: '#10b981' }}>
                  🔴 实时订阅中
                </span>
              )}
            </label>
            <select
              value={selectedSecurity?.code || ''}
              onChange={(e) => {
                const sec = securities.find(s => s.code === e.target.value);
                if (sec) handleSelectSecurity(sec);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">请选择证券</option>
              {securities.map(sec => (
                <option key={sec.code} value={sec.code}>
                  {sec.code} - {sec.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setDirection('buy')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                border: 'none',
                background: direction === 'buy' ? '#ef4444' : '#e5e7eb',
                color: direction === 'buy' ? 'white' : '#374151'
              }}
            >
              买入
            </button>
            <button
              type="button"
              onClick={() => setDirection('sell')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                border: 'none',
                background: direction === 'sell' ? '#10b981' : '#e5e7eb',
                color: direction === 'sell' ? 'white' : '#374151'
              }}
            >
              卖出
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontWeight: '500', color: '#374151' }}>
                委托价格
              </label>
              {marketData && (
                <button
                  type="button"
                  onClick={() => {
                    if (marketData.currentPrice) {
                      setPrice(marketData.currentPrice.toFixed(2));
                    }
                  }}
                  style={{
                    padding: '2px 8px',
                    fontSize: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  市价
                </button>
              )}
            </div>
            <input
              type="text"
              value={price}
              onChange={handlePriceChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                outline: 'none'
              }}
              placeholder="请输入价格"
            />
            {marketData && marketData.prevClose && (
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280', display: 'flex', gap: '16px' }}>
                <span>昨收: <strong>{marketData.prevClose.toFixed(2)}</strong></span>
                <span style={{ color: '#ef4444' }}>涨停: {(marketData.prevClose * 1.1).toFixed(2)}</span>
                <span style={{ color: '#10b981' }}>跌停: {(marketData.prevClose * 0.9).toFixed(2)}</span>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontWeight: '500', color: '#374151' }}>
                委托数量（股）
              </label>
              {direction === 'buy' ? (
                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                  最大可买: <strong style={{ color: '#ef4444' }}>{maxBuyQty.toLocaleString()}</strong> 股
                </span>
              ) : (
                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                  可用持仓: <strong style={{ color: '#10b981' }}>{maxSellQty.toLocaleString()}</strong> 股
                </span>
              )}
            </div>
            <input
              type="text"
              value={quantity}
              onChange={handleQuantityChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                outline: 'none'
              }}
              placeholder="请输入数量（100的整数倍）"
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {[
              { label: '1/4', value: 0.25 },
              { label: '1/3', value: 1/3 },
              { label: '1/2', value: 0.5 },
              { label: '全部', value: 'all' }
            ].map(item => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleQuickQuantity(item.value)}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  fontSize: '13px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div style={{
            background: '#f9fafb',
            padding: '16px',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <span style={{ color: '#6b7280' }}>预计金额</span>
              <span style={{ fontWeight: '600', color: '#1f2937' }}>¥{estimatedAmount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#6b7280' }}>手续费（约）</span>
              <span style={{ color: '#6b7280' }}>¥{(parseFloat(estimatedAmount) * 0.0003).toFixed(2)}</span>
            </div>
            {direction === 'sell' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '4px' }}>
                <span style={{ color: '#6b7280' }}>印花税（约）</span>
                <span style={{ color: '#6b7280' }}>¥{(parseFloat(estimatedAmount) * 0.001).toFixed(2)}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: direction === 'buy' ? '#ef4444' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '提交中...' : (direction === 'buy' ? '确认买入' : '确认卖出')}
          </button>
        </form>

        {funds && (
          <div style={{ marginTop: '20px', padding: '16px', background: '#f9fafb', borderRadius: '6px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
              账户资金
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div>
                <div style={{ color: '#6b7280' }}>可用资金</div>
                <div style={{ fontWeight: '600', color: '#1f2937' }}>¥{funds.available_balance?.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280' }}>冻结资金</div>
                <div style={{ fontWeight: '600', color: '#f59e0b' }}>¥{funds.frozen_balance?.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280' }}>累计盈亏</div>
                <div style={{ 
                  fontWeight: '600',
                  color: (funds.total_profit_loss || 0) >= 0 ? '#ef4444' : '#10b981'
                }}>
                  {(funds.total_profit_loss || 0) >= 0 ? '+' : ''}¥{funds.total_profit_loss?.toLocaleString() || '0'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#1f2937' }}>
          证券详情
        </h3>
        
        {selectedSecurity ? (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
                  {marketData?.currentPrice?.toFixed(2) || selectedSecurity.currentPrice?.toFixed(2) || '--'}
                </span>
                {marketData && (
                  <span style={{ 
                    color: (marketData.change || 0) >= 0 ? '#ef4444' : '#10b981',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}>
                    {(marketData.change || 0) >= 0 ? '+' : ''}{marketData.change?.toFixed(2) || '0.00'}
                    <span style={{ marginLeft: '4px', fontSize: '14px' }}>
                      ({(marketData.change || 0) >= 0 ? '+' : ''}{marketData.changePercent?.toFixed(2) || '0.00'}%)
                    </span>
                  </span>
                )}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                {selectedSecurity.code} {selectedSecurity.name}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: '今开', value: marketData?.open },
                { label: '最高', value: marketData?.high, color: '#ef4444' },
                { label: '最低', value: marketData?.low, color: '#10b981' },
                { label: '昨收', value: marketData?.prevClose },
                { label: '成交量', value: marketData?.volume ? `${(marketData.volume / 10000).toFixed(2)}万` : undefined },
                { label: '成交额', value: marketData?.amount ? `¥${(marketData.amount / 10000).toFixed(2)}万` : undefined }
              ].map(item => (
                <div key={item.label} style={{
                  padding: '14px',
                  background: '#f9fafb',
                  borderRadius: '6px'
                }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>{item.label}</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: item.color || '#1f2937' }}>
                    {item.value !== undefined ? item.value : '--'}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#10b981' }}>买盘</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {marketData?.bidLevels?.length > 0 ? 
                    marketData.bidLevels.map((level, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#ecfdf5', borderRadius: '4px' }}>
                        <span style={{ color: '#059669', fontWeight: '600', fontSize: '14px' }}>
                          {level?.price?.toFixed(2) || '--'}
                        </span>
                        <span style={{ color: '#6b7280', fontSize: '13px' }}>
                          {level?.volume?.toLocaleString() || '--'}
                        </span>
                      </div>
                    )) : 
                    [1,2,3,4,5].map(idx => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#ecfdf5', borderRadius: '4px' }}>
                        <span style={{ color: '#9ca3af', fontSize: '14px' }}>--</span>
                        <span style={{ color: '#9ca3af', fontSize: '13px' }}>--</span>
                      </div>
                    ))
                  }
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#ef4444' }}>卖盘</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {marketData?.askLevels?.length > 0 ? 
                    marketData.askLevels.map((level, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#fef2f2', borderRadius: '4px' }}>
                        <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '14px' }}>
                          {level?.price?.toFixed(2) || '--'}
                        </span>
                        <span style={{ color: '#6b7280', fontSize: '13px' }}>
                          {level?.volume?.toLocaleString() || '--'}
                        </span>
                      </div>
                    )) : 
                    [1,2,3,4,5].map(idx => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#fef2f2', borderRadius: '4px' }}>
                        <span style={{ color: '#9ca3af', fontSize: '14px' }}>--</span>
                        <span style={{ color: '#9ca3af', fontSize: '13px' }}>--</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>

            {positions && positions.length > 0 && selectedSecurity && (
              <div style={{ marginTop: '24px', padding: '16px', background: '#f9fafb', borderRadius: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                  我的持仓
                </div>
                {(() => {
                  const pos = positions.find(p => p.security_code === selectedSecurity.code);
                  if (pos) {
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '13px' }}>
                        <div>
                          <div style={{ color: '#6b7280' }}>总持仓</div>
                          <div style={{ fontWeight: '600' }}>{pos.total_quantity.toLocaleString()} 股</div>
                        </div>
                        <div>
                          <div style={{ color: '#6b7280' }}>可用</div>
                          <div style={{ fontWeight: '600', color: '#10b981' }}>{pos.available_quantity.toLocaleString()} 股</div>
                        </div>
                        <div>
                          <div style={{ color: '#6b7280' }}>成本价</div>
                          <div style={{ fontWeight: '600' }}>¥{pos.avg_cost_price?.toFixed(2)}</div>
                        </div>
                        <div>
                          <div style={{ color: '#6b7280' }}>市值</div>
                          <div style={{ fontWeight: '600' }}>¥{pos.market_value?.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ color: '#6b7280' }}>盈亏</div>
                          <div style={{ 
                            fontWeight: '600',
                            color: (pos.profit_loss || 0) >= 0 ? '#ef4444' : '#10b981'
                          }}>
                            {(pos.profit_loss || 0) >= 0 ? '+' : ''}¥{pos.profit_loss?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#6b7280' }}>盈亏比例</div>
                          <div style={{ 
                            fontWeight: '600',
                            color: (pos.profit_loss_ratio || 0) >= 0 ? '#ef4444' : '#10b981'
                          }}>
                            {(pos.profit_loss_ratio || 0) >= 0 ? '+' : ''}{pos.profit_loss_ratio?.toFixed(2) || '0.00'}%
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div style={{ color: '#9ca3af', fontSize: '13px' }}>暂无该证券持仓</div>
                    );
                  }
                })()}
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <div>请选择证券查看详情</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradePage;
