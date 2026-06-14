import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

function AdminStats({ showToast }) {
  const [activeTab, setActiveTab] = useState('heatmap');
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState([]);
  const [regionDemand, setRegionDemand] = useState([]);
  const [dailyData, setDailyData] = useState([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      let response;
      if (activeTab === 'heatmap') {
        response = await api.get('/admin/stats/heatmap');
        setHeatmapData(response.data.data || []);
      } else if (activeTab === 'demand') {
        response = await api.get('/admin/stats/region-demand');
        setRegionDemand(response.data.data || []);
      } else if (activeTab === 'daily') {
        response = await api.get('/admin/stats/daily');
        setDailyData(response.data.data || []);
      }
    } catch (error) {
      showToast('加载数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getHeatColor = (count, max) => {
    if (!max) return '#f1f5f9';
    const ratio = count / max;
    if (ratio > 0.8) return '#7c3aed';
    if (ratio > 0.6) return '#8b5cf6';
    if (ratio > 0.4) return '#a78bfa';
    if (ratio > 0.2) return '#c4b5fd';
    return '#ede9fe';
  };

  const maxHeatmapValue = Math.max(...heatmapData.map(d => d.count || 0), 1);
  const maxDemandValue = Math.max(...regionDemand.map(d => d.demand || 0, d.supply || 0), 1);

  if (loading) {
    return <div className="empty-state">加载中...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px' }}>统计分析</h1>
      
      <div className="tabs" style={{ marginBottom: '24px' }}>
        <div 
          className={`tab ${activeTab === 'heatmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('heatmap')}
        >
          履约热力图
        </div>
        <div 
          className={`tab ${activeTab === 'demand' ? 'active' : ''}`}
          onClick={() => setActiveTab('demand')}
        >
          区域供需分析
        </div>
        <div 
          className={`tab ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          每日趋势
        </div>
      </div>
      
      {activeTab === 'heatmap' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>用户履约热力图（按城市）</h3>
          
          {heatmapData.length > 0 ? (
            <div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
              }}>
                {heatmapData.map((item, index) => (
                  <div 
                    key={index}
                    style={{ 
                      padding: '16px',
                      borderRadius: '8px',
                      background: getHeatColor(item.count, maxHeatmapValue),
                      color: item.count / maxHeatmapValue > 0.5 ? 'white' : '#1e293b',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                      {item.region}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>
                      {item.count}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>
                      完成订单
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'flex-end', 
                gap: '8px',
                fontSize: '12px',
                color: '#64748b'
              }}>
                <span>低</span>
                <div style={{ 
                  width: '200px', 
                  height: '8px', 
                  borderRadius: '4px',
                  background: 'linear-gradient(to right, #ede9fe, #c4b5fd, #a78bfa, #8b5cf6, #7c3aed)'
                }}></div>
                <span>高</span>
              </div>
            </div>
          ) : (
            <div className="empty-state">暂无数据</div>
          )}
        </div>
      )}
      
      {activeTab === 'demand' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>区域兼职供需分析</h3>
          
          {regionDemand.length > 0 ? (
            <div>
              <table className="table">
                <thead>
                  <tr>
                    <th>区域</th>
                    <th>需求量（任务数）</th>
                    <th>供给量（活跃用户）</th>
                    <th>供需比</th>
                    <th>缺口</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {regionDemand.map((item, index) => {
                    const ratio = item.supply > 0 ? ((item.demand / item.supply) * 100).toFixed(1) : '∞';
                    const gap = item.demand - item.supply;
                    const status = gap > 10 ? '供不应求' : gap < -10 ? '供过于求' : '供需平衡';
                    const statusClass = gap > 10 ? 'badge-warning' : gap < -10 ? 'badge-info' : 'badge-success';
                    
                    return (
                      <tr key={index}>
                        <td style={{ fontWeight: 500 }}>{item.region}</td>
                        <td style={{ color: '#f59e0b', fontWeight: 600 }}>{item.demand}</td>
                        <td style={{ color: '#3b82f6', fontWeight: 600 }}>{item.supply}</td>
                        <td>{ratio}%</td>
                        <td style={{ 
                          color: gap > 0 ? '#dc2626' : gap < 0 ? '#16a34a' : '#64748b',
                          fontWeight: 600
                        }}>
                          {gap > 0 ? '+' : ''}{gap}
                        </td>
                        <td>
                          <span className={`badge ${statusClass}`}>{status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              <div style={{ 
                marginTop: '24px',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>
                  供需对比图
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {regionDemand.slice(0, 8).map((item, index) => (
                    <div key={index}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontSize: '13px', 
                        marginBottom: '4px' 
                      }}>
                        <span>{item.region}</span>
                        <span style={{ color: '#64748b' }}>
                          需求 {item.demand} / 供给 {item.supply}
                        </span>
                      </div>
                      <div style={{ display: 'flex', height: '16px', borderRadius: '8px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${(item.demand / maxDemandValue) * 100}%`,
                            background: '#fbbf24'
                          }}
                        />
                        <div 
                          style={{ 
                            width: `${(item.supply / maxDemandValue) * 100}%`,
                            background: '#60a5fa'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ 
                  display: 'flex', 
                  gap: '24px', 
                  marginTop: '12px', 
                  fontSize: '12px',
                  color: '#64748b'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '12px', height: '12px', background: '#fbbf24', borderRadius: '2px' }}></span>
                    需求量
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '12px', height: '12px', background: '#60a5fa', borderRadius: '2px' }}></span>
                    供给量
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">暂无数据</div>
          )}
        </div>
      )}
      
      {activeTab === 'daily' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>平台每日数据趋势（近14天）</h3>
          
          {dailyData.length > 0 ? (
            <div>
              <table className="table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>新增用户</th>
                    <th>新增任务</th>
                    <th>完成订单</th>
                    <th>交易金额</th>
                    <th>平台收入</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData.map((item, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: 500 }}>{item.date}</td>
                      <td>{item.new_users}</td>
                      <td>{item.new_tasks}</td>
                      <td>{item.completed_orders}</td>
                      <td style={{ color: '#10b981', fontWeight: 600 }}>¥{item.total_amount?.toFixed(2)}</td>
                      <td style={{ color: '#667eea', fontWeight: 600 }}>¥{item.platform_fee?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div style={{ 
                marginTop: '24px',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                  交易趋势图
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-end', 
                  gap: '4px',
                  height: '200px',
                  padding: '0 8px'
                }}>
                  {dailyData.map((item, index) => {
                    const maxVal = Math.max(...dailyData.map(d => d.total_amount || 0), 1);
                    const height = maxVal > 0 ? ((item.total_amount || 0) / maxVal) * 160 : 0;
                    return (
                      <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div 
                          style={{ 
                            width: '100%',
                            background: 'linear-gradient(to top, #667eea, #764ba2)',
                            height: `${height}px`,
                            borderRadius: '4px 4px 0 0',
                            minHeight: '4px'
                          }}
                        />
                        <div style={{ 
                          fontSize: '10px', 
                          color: '#94a3b8', 
                          marginTop: '4px',
                          transform: 'rotate(-45deg)',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.date?.substring(5)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">暂无数据</div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminStats;
