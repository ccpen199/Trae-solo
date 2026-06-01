import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';

function Statistics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const response = await api.get('/statistics/sales');
      setStats(response.data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const getStatusText = (status) => {
    const map = {
      available: '可售',
      locked: '锁定',
      subscribed: '认购',
      contracted: '已签约',
      contracting: '签约中'
    };
    return map[status] || status;
  };

  const getStatCardClass = (status) => {
    const map = {
      available: 'available',
      locked: 'locked',
      subscribed: 'subscribed',
      contracted: 'contracted',
      contracting: 'subscribed'
    };
    return map[status] || '';
  };

  if (!stats) {
    return <div>加载中...</div>;
  }

  const totalUnits = stats.status_stats.reduce((sum, s) => sum + s.count, 0);
  const soldUnits = stats.status_stats
    .filter(s => s.status === 'subscribed' || s.status === 'contracted' || s.status === 'contracting')
    .reduce((sum, s) => sum + s.count, 0);
  const totalValue = stats.status_stats
    .filter(s => s.status === 'subscribed' || s.status === 'contracted')
    .reduce((sum, s) => sum + (s.total_value || 0), 0);

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>销售统计</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">总房源</div>
          <div className="value">{totalUnits} 套</div>
        </div>
        <div className="stat-card">
          <div className="label">已销售</div>
          <div className="value" style={{ color: '#1890ff' }}>{soldUnits} 套</div>
        </div>
        <div className="stat-card">
          <div className="label">销售率</div>
          <div className="value" style={{ color: '#52c41a' }}>{totalUnits > 0 ? ((soldUnits / totalUnits) * 100).toFixed(1) : 0}%</div>
        </div>
        <div className="stat-card">
          <div className="label">成交金额</div>
          <div className="value" style={{ color: '#faad14' }}>{totalValue.toFixed(0)} 万</div>
        </div>
      </div>

      <h3 style={{ margin: '24px 0 16px' }}>按状态统计</h3>
      <div className="stats-grid">
        {stats.status_stats.map((stat) => (
          <div key={stat.status} className={`stat-card ${getStatCardClass(stat.status)}`}>
            <div className="label">{getStatusText(stat.status)}</div>
            <div className="value">{stat.count} 套</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              约 {(stat.count / totalUnits * 100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ margin: '24px 0 16px' }}>按楼栋统计</h3>
      <table className="table">
        <thead>
          <tr>
            <th>楼栋</th>
            <th>总房源</th>
            <th>已售出</th>
            <th>销售率</th>
          </tr>
        </thead>
        <tbody>
          {stats.building_stats.map((building) => (
            <tr key={building.building_name}>
              <td>{building.building_name}</td>
              <td>{building.total} 套</td>
              <td>{building.sold} 套</td>
              <td>
                <span className={`tag ${building.sold / building.total > 0.5 ? 'tag-success' : 'tag-warning'}`}>
                  {building.total > 0 ? ((building.sold / building.total) * 100).toFixed(1) : 0}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ margin: '32px 0 16px' }}>系统说明</h3>
      <div className="property-detail">
        <div className="detail-grid">
          <div className="detail-item">
            <div className="label">测试账号</div>
            <div className="value">admin / admin123</div>
          </div>
          <div className="detail-item">
            <div className="label">案场经理</div>
            <div className="value">manager / manager123</div>
          </div>
          <div className="detail-item">
            <div className="label">置业顾问</div>
            <div className="value">consultant1 / 123456</div>
          </div>
          <div className="detail-item">
            <div className="label">财务</div>
            <div className="value">finance / finance123</div>
          </div>
        </div>

        <h4 style={{ marginTop: '20px', marginBottom: '12px' }}>业务流程说明</h4>
        <ol style={{ lineHeight: '2', paddingLeft: '20px' }}>
          <li><strong>锁房</strong>：置业顾问在销控表选择可售房源，锁定后有效期内其他顾问不能锁定</li>
          <li><strong>认购</strong>：选择锁定或可售房源创建认购单，低于底价或优惠超5万需经理审批</li>
          <li><strong>审批</strong>：案场经理审批低价/优惠申请，通过后方可进入下一流程</li>
          <li><strong>收款</strong>：财务收取定金/首付，满足30%首付款后可进行签约</li>
          <li><strong>签约</strong>：录入合同编号完成签约，房源状态变为已签约</li>
          <li><strong>退房</strong>：退款后房源状态回滚为可售，状态变更全程留痕</li>
        </ol>
      </div>
    </div>
  );
}

export default Statistics;
