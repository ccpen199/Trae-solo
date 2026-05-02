import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarketStore, usePortfolioStore } from '../store';
import { marketApi, fundsApi, positionApi } from '../api';
import { wsService } from '../websocket';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const InvestorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [funds, setFunds] = useState(null);
  const [positions, setPositions] = useState([]);
  const { securities, setSecurities, selectedSecurity, setSelectedSecurity, marketData, setMarketData } = useMarketStore();

  useEffect(() => {
    loadData();
    return () => {};
  }, []);

  useEffect(() => {
    if (securities.length > 0 && !selectedSecurity) {
      handleSelectSecurity(securities[0]);
    }
  }, [securities]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [securitiesRes, fundsRes, positionsRes] = await Promise.all([
        marketApi.getSecurities(),
        fundsApi.getFunds(),
        positionApi.getPositions()
      ]);

      setSecurities(securitiesRes.data);
      setFunds(fundsRes.data);
      setPositions(positionsRes.data);

    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSecurity = async (security) => {
    setSelectedSecurity(security);
    
    try {
      const [securityRes, orderBookRes] = await Promise.all([
        marketApi.getSecurity(security.code),
        marketApi.getOrderBook(security.code)
      ]);

      setMarketData(securityRes.data);
      
      wsService.subscribe('market_data', security.code);
      
    } catch (err) {
      console.error('获取证券详情失败:', err);
    }
  };

  const formatPrice = (price) => (price ? price.toFixed(2) : '--');
  const formatChange = (change, changePercent) => {
    const sign = change >= 0 ? '+' : '';
    return (
      <span style={{ color: change >= 0 ? '#e74c3c' : '#27ae60' }}>
        {sign}{formatPrice(change)} ({sign}{changePercent?.toFixed(2)}%)
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div style={{ fontSize: '18px', color: '#666' }}>加载中...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>总资产</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            ¥{formatPrice((funds?.total_balance || 0) + (funds?.total_market_value || 0))}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>可用资金</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            ¥{formatPrice(funds?.available_balance)}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>持仓市值</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            ¥{formatPrice(funds?.total_market_value || 0)}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>持仓盈亏</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {formatChange(funds?.total_profit_loss || 0, (funds?.total_profit_loss || 0) / ((funds?.total_balance || 1000000)) * 100)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>行情列表</h3>
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>代码</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>名称</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>现价</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>涨跌</th>
                </tr>
              </thead>
              <tbody>
                {securities.map((sec) => (
                  <tr 
                    key={sec.code}
                    onClick={() => handleSelectSecurity(sec)}
                    style={{ 
                      cursor: 'pointer',
                      background: selectedSecurity?.code === sec.code ? '#eff6ff' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '12px 8px', fontSize: '14px', fontWeight: '500' }}>{sec.code}</td>
                    <td style={{ padding: '12px 8px', fontSize: '14px' }}>{sec.name}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px', fontWeight: '500' }}>
                      {formatPrice(sec.currentPrice)}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px' }}>
                      {formatChange(sec.change || 0, sec.changePercent || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
            {selectedSecurity?.name || '请选择证券'}
            <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: 'normal' }}>
              {selectedSecurity?.code}
            </span>
          </h3>
          
          {marketData && (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '20px' }}>
                <span style={{ fontSize: '32px', fontWeight: 'bold' }}>
                  {formatPrice(marketData.currentPrice)}
                </span>
                {formatChange(marketData.change || 0, marketData.changePercent || 0)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>今开</div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{formatPrice(marketData.open)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>最高</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#e74c3c' }}>{formatPrice(marketData.high)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>最低</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#27ae60' }}>{formatPrice(marketData.low)}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#27ae60' }}>买盘</h4>
                  {marketData.bidLevels?.map((level, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
                      <span style={{ color: '#27ae60', fontWeight: '500' }}>{formatPrice(level?.price)}</span>
                      <span style={{ color: '#6b7280' }}>{level?.volume?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#e74c3c' }}>卖盘</h4>
                  {marketData.askLevels?.map((level, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
                      <span style={{ color: '#e74c3c', fontWeight: '500' }}>{formatPrice(level?.price)}</span>
                      <span style={{ color: '#6b7280' }}>{level?.volume?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => navigate('/trade', { state: { security: selectedSecurity } })}
                  style={{
                    padding: '10px 24px',
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  立即下单
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {positions.length > 0 && (
        <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>我的持仓</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>证券代码</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>证券名称</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>持仓数量</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>可用数量</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>成本价</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>现价</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>市值</th>
                <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>盈亏</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => (
                <tr key={pos.id}>
                  <td style={{ padding: '12px 8px', fontSize: '14px', fontWeight: '500' }}>{pos.security_code}</td>
                  <td style={{ padding: '12px 8px', fontSize: '14px' }}>{pos.security_name || pos.security_code}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px' }}>{pos.total_quantity.toLocaleString()}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px' }}>{pos.available_quantity.toLocaleString()}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px' }}>{formatPrice(pos.avg_cost_price)}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px' }}>{formatPrice(pos.current_price)}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px' }}>¥{formatPrice(pos.market_value)}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px' }}>
                    {formatChange(pos.profit_loss || 0, pos.profit_loss_ratio || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const statCardStyle = {
  background: 'white',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

export default InvestorDashboard;
