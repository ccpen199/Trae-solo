import React, { useEffect, useState } from 'react';
import { positionApi } from '../api';

const PositionsPage = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      setLoading(true);
      const res = await positionApi.getPositions();
      setPositions(res.data);
    } catch (err) {
      console.error('加载持仓失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => (price ? price.toFixed(2) : '--');

  const totalMarketValue = positions.reduce((sum, p) => sum + (p.market_value || 0), 0);
  const totalProfitLoss = positions.reduce((sum, p) => sum + (p.profit_loss || 0), 0);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>持仓数量</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            {positions.length} 只
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>持仓市值</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            ¥{formatPrice(totalMarketValue)}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>持仓盈亏</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: totalProfitLoss >= 0 ? '#e74c3c' : '#27ae60' }}>
            {totalProfitLoss >= 0 ? '+' : ''}¥{formatPrice(totalProfitLoss)}
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#1f2937' }}>持仓明细</h3>
          <button
            onClick={loadPositions}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            刷新
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>加载中...</div>
        ) : positions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💼</div>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无持仓</div>
            <div style={{ fontSize: '13px' }}>您可以在行情中心选择证券进行交易</div>
          </div>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>证券代码</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>证券名称</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>持仓数量</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>可用数量</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>冻结数量</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>成本价</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>现价</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>市值</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>盈亏</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>盈亏比例</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => {
                  const profitLoss = pos.profit_loss || 0;
                  const profitLossRatio = pos.profit_loss_ratio || 0;
                  
                  return (
                    <tr key={pos.id}>
                      <td style={{ padding: '12px 8px', fontSize: '14px', fontWeight: '500' }}>{pos.security_code}</td>
                      <td style={{ padding: '12px 8px', fontSize: '14px' }}>{pos.security_name || pos.security_code}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px' }}>{pos.total_quantity.toLocaleString()}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px' }}>{pos.available_quantity.toLocaleString()}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px' }}>{pos.frozen_quantity.toLocaleString()}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px' }}>{formatPrice(pos.avg_cost_price)}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px' }}>{formatPrice(pos.current_price)}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '14px' }}>¥{formatPrice(pos.market_value)}</td>
                      <td style={{ 
                        padding: '12px 8px', 
                        textAlign: 'right', 
                        fontSize: '14px',
                        fontWeight: '500',
                        color: profitLoss >= 0 ? '#e74c3c' : '#27ae60'
                      }}>
                        {profitLoss >= 0 ? '+' : ''}¥{formatPrice(profitLoss)}
                      </td>
                      <td style={{ 
                        padding: '12px 8px', 
                        textAlign: 'right', 
                        fontSize: '14px',
                        color: profitLossRatio >= 0 ? '#e74c3c' : '#27ae60'
                      }}>
                        {profitLossRatio >= 0 ? '+' : ''}{profitLossRatio.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const statCardStyle = {
  background: 'white',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

export default PositionsPage;
