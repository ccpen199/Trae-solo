import React, { useState, useEffect } from 'react';
import api from '../../utils/api.js';

const sportNames = {
  badminton: '羽毛球',
  tennis: '网球',
  basketball: '篮球'
};

function Reports({ user }) {
  const [overview, setOverview] = useState(null);
  const [bySport, setBySport] = useState([]);
  const [venueUsage, setVenueUsage] = useState([]);
  const [daily, setDaily] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [creditRanking, setCreditRanking] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [ov, sport, venue, d, ua, cr] = await Promise.all([
        api.get('/reports/overview'),
        api.get('/reports/games-by-sport'),
        api.get('/reports/venue-usage'),
        api.get('/reports/games-daily'),
        api.get('/reports/user-activity'),
        api.get('/reports/credit-ranking')
      ]);
      setOverview(ov.data);
      setBySport(sport.data);
      setVenueUsage(venue.data);
      setDaily(d.data);
      setUserActivity(ua.data);
      setCreditRanking(cr.data);
    } catch (err) {
      console.error('加载报表数据失败', err);
    }
  };

  const tabs = [
    { key: 'overview', name: '总览' },
    { key: 'sport', name: '按运动类型' },
    { key: 'venue', name: '场馆使用' },
    { key: 'daily', name: '每日趋势' },
    { key: 'user', name: '用户活跃度' },
    { key: 'credit', name: '信用排行' }
  ];

  return (
    <div>
      <div className="card">
        <div className="tabs">
          {tabs.map(tab => (
            <div key={tab.key} className={`tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}>
              {tab.name}
            </div>
          ))}
        </div>

        {activeTab === 'overview' && overview && (
          <div>
            <div className="grid">
              <div className="stat-card">
                <div className="stat-value">{overview.total_users}</div>
                <div className="stat-label">用户总数</div>
              </div>
              <div className="stat-card blue">
                <div className="stat-value">{overview.total_games}</div>
                <div className="stat-label">球局总数</div>
              </div>
              <div className="stat-card green">
                <div className="stat-value">{overview.completed_games}</div>
                <div className="stat-label">已完成球局</div>
              </div>
              <div className="stat-card orange">
                <div className="stat-value">¥{overview.total_revenue.toFixed(2)}</div>
                <div className="stat-label">平台营收</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{overview.total_venues}</div>
                <div className="stat-label">活跃场馆</div>
              </div>
              <div className="stat-card blue">
                <div className="stat-value">{overview.total_courts}</div>
                <div className="stat-label">场地数量</div>
              </div>
              <div className="stat-card green">
                <div className="stat-value">{overview.pending_exceptions}</div>
                <div className="stat-label">待处理异常</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sport' && (
          <table>
            <thead>
              <tr>
                <th>运动类型</th>
                <th>球局数</th>
                <th>已完成</th>
                <th>营收</th>
              </tr>
            </thead>
            <tbody>
              {bySport.map(s => (
                <tr key={s.sport_type}>
                  <td>{sportNames[s.sport_type] || s.sport_type}</td>
                  <td>{s.game_count}</td>
                  <td>{s.completed_count}</td>
                  <td>¥{s.total_revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'venue' && (
          <table>
            <thead>
              <tr>
                <th>场馆</th>
                <th>球局数</th>
                <th>独立用户</th>
                <th>营收</th>
              </tr>
            </thead>
            <tbody>
              {venueUsage.map(v => (
                <tr key={v.id}>
                  <td>{v.venue_name}</td>
                  <td>{v.game_count}</td>
                  <td>{v.unique_users}</td>
                  <td>¥{v.total_revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'daily' && (
          <table>
            <thead>
              <tr>
                <th>日期</th>
                <th>新球局</th>
                <th>已完成</th>
                <th>营收</th>
              </tr>
            </thead>
            <tbody>
              {daily.map(d => (
                <tr key={d.date}>
                  <td>{d.date}</td>
                  <td>{d.new_games}</td>
                  <td>{d.completed_games}</td>
                  <td>¥{d.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'user' && (
          <table>
            <thead>
              <tr>
                <th>用户</th>
                <th>角色</th>
                <th>等级</th>
                <th>信用分</th>
                <th>发起球局</th>
                <th>参与球局</th>
                <th>总支付</th>
              </tr>
            </thead>
            <tbody>
              {userActivity.map(u => (
                <tr key={u.id}>
                  <td>{u.nickname}</td>
                  <td><span className="role-badge">{u.role}</span></td>
                  <td>Lv.{u.level}</td>
                  <td>{u.credit_score}</td>
                  <td>{u.organized_games}</td>
                  <td>{u.joined_games}</td>
                  <td>¥{u.total_paid.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'credit' && (
          <table>
            <thead>
              <tr>
                <th>排名</th>
                <th>用户</th>
                <th>等级</th>
                <th>信用分</th>
                <th>被评价次数</th>
              </tr>
            </thead>
            <tbody>
              {creditRanking.map((u, idx) => (
                <tr key={u.id}>
                  <td>#{idx + 1}</td>
                  <td>{u.nickname}</td>
                  <td>Lv.{u.level}</td>
                  <td><strong style={{ color: '#48bb78' }}>{u.credit_score}</strong></td>
                  <td>{u.review_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Reports;
