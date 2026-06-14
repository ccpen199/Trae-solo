import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

const RentIndex = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rentData, setRentData] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRentData();
  }, []);

  const fetchRentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/rent-index/details');
      const data = response.data.data || response.data;
      setRentData({
        overallIndex: data.overall_index || data.overallIndex || 0,
        momChange: data.mom_change || data.momChange || 0,
        yoyChange: data.yoy_change || data.yoyChange || 0,
        overview: data.overview || {
          total_properties: 0,
          verified_properties: 0,
          pending_properties: 0,
          active_contracts: 0,
          open_disputes: 0,
          pending_inspections: 0
        },
        districts: data.districts || [],
        recentTrend: data.trend || data.recentTrend || [],
        houseTypes: data.house_types || data.houseTypes || [],
        linkedRecords: data.linked_records || data.linkedRecords || []
      });
    } catch (error) {
      console.error('获取租金指数数据失败:', error);
      if (error.response?.status === 401) {
        setError('请先登录后查看租金指数');
      } else {
        setError(error.response?.data?.message || '获取租金指数数据失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const getBarColor = (change) => {
    if (change >= 5) return '#ef4444';
    if (change >= 3) return '#faad14';
    if (change >= 0) return '#52c41a';
    return '#1890ff';
  };

  const filteredDistricts = selectedDistrict === 'all' 
    ? rentData?.districts 
    : rentData?.districts?.filter(d => d.name === selectedDistrict);

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem 0' }}>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">居住成本指数</h1>
        <p className="text-gray">实时追踪城市租金变化，为您的租房决策提供参考</p>
      </div>

      {error ? (
        <div className="card text-center mb-6" style={{ padding: '3rem' }}>
          <p className="text-danger">{error}</p>
          {error.includes('登录') && (
            <button className="btn btn-primary mt-4" onClick={() => navigate('/login')}>
              去登录
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4">📊 总览统计</h3>
            <div className="grid grid-6" style={{ gap: '0.75rem' }}>
              <div className="card">
                <div className="card-body text-center">
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🏠</div>
                  <div className="text-xl font-bold" style={{ color: '#667eea' }}>
                    {rentData?.overview?.total_properties || 0}
                  </div>
                  <div className="text-gray text-xs">总房源数</div>
                </div>
              </div>
              <div className="card">
                <div className="card-body text-center">
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>✅</div>
                  <div className="text-xl font-bold" style={{ color: '#52c41a' }}>
                    {rentData?.overview?.verified_properties || 0}
                  </div>
                  <div className="text-gray text-xs">已验证房源</div>
                </div>
              </div>
              <div className="card">
                <div className="card-body text-center">
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>⏳</div>
                  <div className="text-xl font-bold" style={{ color: '#faad14' }}>
                    {rentData?.overview?.pending_properties || 0}
                  </div>
                  <div className="text-gray text-xs">待验证房源</div>
                </div>
              </div>
              <div className="card">
                <div className="card-body text-center">
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📝</div>
                  <div className="text-xl font-bold" style={{ color: '#1890ff' }}>
                    {rentData?.overview?.active_contracts || 0}
                  </div>
                  <div className="text-gray text-xs">在租合约</div>
                </div>
              </div>
              <div className="card">
                <div className="card-body text-center">
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>⚖️</div>
                  <div className="text-xl font-bold" style={{ color: '#ef4444' }}>
                    {rentData?.overview?.open_disputes || 0}
                  </div>
                  <div className="text-gray text-xs">待处理纠纷</div>
                </div>
              </div>
              <div className="card">
                <div className="card-body text-center">
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🔧</div>
                  <div className="text-xl font-bold" style={{ color: '#722ed1' }}>
                    {rentData?.overview?.pending_inspections || 0}
                  </div>
                  <div className="text-gray text-xs">待质检工单</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-4 mb-6">
            <div className="card">
              <div className="card-body text-center">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
                <div className="text-3xl font-bold" style={{ color: '#667eea' }}>
                  {rentData?.overallIndex}
                </div>
                <div className="text-gray text-sm">综合租金指数</div>
                <div className="text-sm mt-1" style={{ color: rentData?.momChange >= 0 ? '#52c41a' : '#ef4444' }}>
                  {rentData?.momChange >= 0 ? '↑' : '↓'} 环比 {Math.abs(rentData?.momChange)}%
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
                <div className="text-3xl font-bold" style={{ color: '#52c41a' }}>
                  ¥{Math.round(rentData?.districts?.reduce((sum, d) => sum + (d.price || 0), 0) / (rentData?.districts?.length || 1))?.toLocaleString()}
                </div>
                <div className="text-gray text-sm">全市平均租金</div>
                <div className="text-sm mt-1" style={{ color: rentData?.yoyChange >= 0 ? '#52c41a' : '#ef4444' }}>
                  {rentData?.yoyChange >= 0 ? '↑' : '↓'} 同比 {Math.abs(rentData?.yoyChange)}%
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏠</div>
                <div className="text-3xl font-bold" style={{ color: '#722ed1' }}>
                  {rentData?.districts?.reduce((sum, d) => sum + (d.volume || 0), 0)?.toLocaleString()}
                </div>
                <div className="text-gray text-sm">本月成交套数</div>
                <div className="text-sm mt-1" style={{ color: '#52c41a' }}>
                  ↑ 环比 5.2%
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏱️</div>
                <div className="text-3xl font-bold" style={{ color: '#faad14' }}>
                  {Math.round(rentData?.districts?.reduce((sum, d) => sum + (d.cycle || 0), 0) / (rentData?.districts?.length || 1))}
                </div>
                <div className="text-gray text-sm">平均成交周期(天)</div>
                <div className="text-sm mt-1" style={{ color: '#ef4444' }}>
                  ↑ 环比 8.3%
                </div>
              </div>
            </div>
          </div>

      <div className="card mb-6">
        <div className="card-header flex-between">
          <h3 className="font-bold">各区域租金指数</h3>
          <div>
            <select 
              className="form-input" 
              style={{ width: '150px', display: 'inline-block' }}
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
            >
              <option value="all">全部区域</option>
              {rentData?.districts?.map(d => (
                <option key={d.name || d.district} value={d.name || d.district}>{d.name || d.district}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="card-body">
          <table className="table">
            <thead>
              <tr>
                <th>区域</th>
                <th>租金价格</th>
                <th>环比波动</th>
                <th>成交周期</th>
                <th>已验证房源</th>
                <th>待验证房源</th>
                <th>在租合约</th>
                <th>待处理纠纷</th>
                <th>待质检工单</th>
              </tr>
            </thead>
            <tbody>
              {filteredDistricts?.map((district, i) => {
                const name = district.name || district.district;
                const price = district.price || district.avg_price || 0;
                const change = district.change || district.price_change || 0;
                const cycle = district.cycle || district.deal_cycle || 0;
                const verifiedCount = district.verified_count || 0;
                const pendingCount = district.pending_count || 0;
                const activeContracts = district.active_contracts || 0;
                const openDisputes = district.open_disputes || 0;
                const pendingInspections = district.pending_inspections || 0;
                return (
                  <tr key={name}>
                    <td className="font-bold">{name}</td>
                    <td style={{ color: '#667eea', fontWeight: 'bold' }}>
                      ¥{price.toLocaleString()}/月
                    </td>
                    <td>
                      <span style={{ color: change >= 0 ? '#52c41a' : '#ef4444' }}>
                        {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
                      </span>
                    </td>
                    <td>{cycle} 天</td>
                    <td>
                      <span className="badge badge-success">{verifiedCount}</span>
                    </td>
                    <td>
                      <span className="badge badge-warning">{pendingCount}</span>
                    </td>
                    <td>
                      <span className="badge badge-info">{activeContracts}</span>
                    </td>
                    <td>
                      <span className="badge badge-danger">{openDisputes}</span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#722ed1', color: 'white' }}>{pendingInspections}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-2 mb-6" style={{ gap: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="font-bold">租金走势（近5个月）</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', padding: '0 1rem' }}>
              {rentData?.recentTrend?.map((item, i) => {
                const month = item.month || item.date;
                const index = item.index || item.value || 0;
                const trendData = rentData?.recentTrend || [];
                const maxIndex = Math.max(...trendData.map(t => t.index || t.value || 0));
                const minIndex = Math.min(...trendData.map(t => t.index || t.value || 0));
                const barHeight = ((index - minIndex) / (maxIndex - minIndex + 0.1)) * 70 + 30;
                return (
                  <div key={month} style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#667eea', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      {index}
                    </div>
                    <div 
                      style={{
                        width: '40px',
                        height: `${barHeight}%`,
                        background: 'linear-gradient(180deg, #667eea, #764ba2)',
                        borderRadius: '4px 4px 0 0',
                        margin: '0 auto'
                      }}
                    />
                    <div className="text-gray text-xs mt-2">{(month || '').slice(5)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-bold">各户型平均租金</h3>
          </div>
          <div className="card-body">
            <table className="table">
              <thead>
                <tr>
                  <th>户型</th>
                  <th>平均租金</th>
                  <th>环比变化</th>
                </tr>
              </thead>
              <tbody>
                {rentData?.houseTypes?.map((type, i) => {
                  const typeName = type.type || type.house_type;
                  const avgPrice = type.avgPrice || type.avg_price || 0;
                  const change = type.change || type.price_change || 0;
                  return (
                    <tr key={i}>
                      <td>{typeName}</td>
                      <td style={{ color: '#667eea', fontWeight: 'bold' }}>
                        ¥{avgPrice.toLocaleString()}/月
                      </td>
                      <td>
                        <span style={{ color: change >= 0 ? '#52c41a' : '#ef4444' }}>
                          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <h3 className="font-bold">各区域成交周期统计</h3>
        </div>
        <div className="card-body">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-end',
            height: '180px',
            padding: '0 1rem'
          }}>
            {rentData?.districts?.map((district, i) => {
              const name = district.name || district.district;
              const cycle = district.cycle || district.deal_cycle || 0;
              const districtData = rentData?.districts || [];
              const maxCycle = Math.max(...districtData.map(d => d.cycle || d.deal_cycle || 0));
              const barHeight = (cycle / maxCycle) * 80;
              return (
                <div key={name} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#faad14', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    {cycle}天
                  </div>
                  <div 
                    style={{
                      width: '36px',
                      height: `${barHeight}%`,
                      background: 'linear-gradient(180deg, #faad14, #fa8c16)',
                      borderRadius: '4px 4px 0 0',
                      margin: '0 auto'
                    }}
                  />
                  <div className="text-gray text-xs mt-2" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '40px' }}>
                    {name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <h3 className="font-bold">区域数据关联汇总</h3>
        </div>
        <div className="card-body">
          <table className="table">
            <thead>
              <tr>
                <th>区域</th>
                <th>总房源数</th>
                <th>已验证房源</th>
                <th>待验证房源</th>
                <th>在租合约</th>
                <th>待处理纠纷</th>
                <th>待质检工单</th>
              </tr>
            </thead>
            <tbody>
              {rentData?.districts?.map((district, i) => {
                const name = district.name || district.district;
                const totalProperties = (district.verified_count || 0) + (district.pending_count || 0);
                return (
                  <tr key={name}>
                    <td className="font-bold">{name}</td>
                    <td>{totalProperties}</td>
                    <td>
                      <span className="badge badge-success">{district.verified_count || 0}</span>
                    </td>
                    <td>
                      <span className="badge badge-warning">{district.pending_count || 0}</span>
                    </td>
                    <td>
                      <span className="badge badge-info">{district.active_contracts || 0}</span>
                    </td>
                    <td>
                      <span className="badge badge-danger">{district.open_disputes || 0}</span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#722ed1', color: 'white' }}>{district.pending_inspections || 0}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <h3 className="font-bold">租金指数关联复查记录</h3>
        </div>
        <div className="card-body">
          <table className="table">
            <thead>
              <tr>
                <th>区域</th>
                <th>样本房源</th>
                <th>交易状态</th>
                <th>后台质检</th>
                <th>纠纷复查</th>
              </tr>
            </thead>
            <tbody>
              {rentData?.linkedRecords?.map((row, i) => (
                <tr key={i}>
                  <td>{row.district}</td>
                  <td>{row.property}</td>
                  <td>{row.trade}</td>
                  <td>{row.quality}</td>
                  <td>{row.dispute}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="font-bold">数据说明</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-2" style={{ gap: '1.5rem' }}>
            <div>
              <h4 className="font-bold mb-2">📊 数据来源</h4>
              <ul style={{ paddingLeft: '1.25rem' }}>
                <li className="text-sm text-gray mb-1">平台真实成交数据（占比70%）</li>
                <li className="text-sm text-gray mb-1">合作中介机构数据（占比20%）</li>
                <li className="text-sm text-gray mb-1">公开市场调研数据（占比10%）</li>
                <li className="text-sm text-gray">数据经过清洗和去重处理</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-2">📌 指数说明</h4>
              <ul style={{ paddingLeft: '1.25rem' }}>
                <li className="text-sm text-gray mb-1">基期：2025年1月（指数=100）</li>
                <li className="text-sm text-gray mb-1">更新频率：每月5日更新上月数据</li>
                <li className="text-sm text-gray mb-1">样本量：每月约5000+成交样本</li>
                <li className="text-sm text-gray">数据仅供参考，不作为交易依据</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default RentIndex;
