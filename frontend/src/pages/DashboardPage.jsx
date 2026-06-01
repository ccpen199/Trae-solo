import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import api from '../api/client.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [trendData, setTrendData] = useState({ list: [] });
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [searchUserId, setSearchUserId] = useState('');
  const [userTrail, setUserTrail] = useState(null);
  const [showTrail, setShowTrail] = useState(false);

  useEffect(() => {
    loadData();
  }, [days]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, trendRes] = await Promise.all([
        api.get(`/stats/overview?days=${days}`),
        api.get(`/stats/trend?days=${days}`)
      ]);
      setOverview(overviewRes.data);
      setTrendData(trendRes.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    }
    setLoading(false);
  };

  const loadUserTrail = async () => {
    if (!searchUserId) return;
    try {
      const res = await api.get(`/stats/user-trail/${searchUserId}?pageSize=20`);
      setUserTrail(res.data);
      setShowTrail(true);
    } catch (err) {
      alert('查询失败，请检查用户ID');
    }
  };

  const getActionLabel = (action) => {
    const map = {
      follow: '关注',
      unfollow: '取关',
      friend_request: '发送好友申请',
      friend_accept: '接受好友申请',
      friend_reject: '拒绝好友申请',
      block: '拉黑',
      unblock: '解除拉黑',
      report: '举报'
    };
    return map[action] || action;
  };

  const trendChartData = {
    labels: trendData.list?.map(d => d.date).reverse() || [],
    datasets: [
      {
        label: '新增关注',
        data: trendData.list?.map(d => d.follows).reverse() || [],
        borderColor: '#1890ff',
        backgroundColor: 'rgba(24, 144, 255, 0.1)',
        tension: 0.3,
      },
      {
        label: '取关',
        data: trendData.list?.map(d => d.unfollows).reverse() || [],
        borderColor: '#ff4d4f',
        backgroundColor: 'rgba(255, 77, 79, 0.1)',
        tension: 0.3,
      },
      {
        label: '好友申请',
        data: trendData.list?.map(d => d.friend_requests).reverse() || [],
        borderColor: '#52c41a',
        backgroundColor: 'rgba(82, 196, 26, 0.1)',
        tension: 0.3,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <div>
      <div className="card">
        <div className="filter-bar">
          <span>统计周期：</span>
          <select value={days} onChange={(e) => setDays(parseInt(e.target.value))}>
            <option value={7}>近7天</option>
            <option value={14}>近14天</option>
            <option value={30}>近30天</option>
          </select>
          <span style={{ marginLeft: 20 }}>用户轨迹查询：</span>
          <input
            type="text"
            placeholder="输入用户ID"
            value={searchUserId}
            onChange={(e) => setSearchUserId(e.target.value)}
            style={{ width: 150 }}
          />
          <button className="btn primary" onClick={loadUserTrail}>查询</button>
        </div>
      </div>

      {loading ? (
        <div className="empty">加载中...</div>
      ) : overview && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="value">{overview.total_users}</div>
              <div className="label">总用户数</div>
            </div>
            <div className="stat-card">
              <div className="value">{overview.total_follows}</div>
              <div className="label">总关注关系</div>
            </div>
            <div className="stat-card">
              <div className="value">{overview.mutual_follows}</div>
              <div className="label">互相关注</div>
            </div>
            <div className="stat-card">
              <div className="value">{overview.total_friendships}</div>
              <div className="label">好友关系</div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="value">{overview.new_relations}</div>
              <div className="label">新增关注（{days}天）</div>
            </div>
            <div className="stat-card">
              <div className="value">{overview.unfollows}</div>
              <div className="label">取关数（{days}天）</div>
            </div>
            <div className="stat-card">
              <div className="value">{overview.new_friendships}</div>
              <div className="label">新增好友（{days}天）</div>
            </div>
            <div className="stat-card">
              <div className="value">{overview.reports}</div>
              <div className="label">举报数（{days}天）</div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="value">{overview.mutual_rate}%</div>
              <div className="label">互关率</div>
            </div>
            <div className="stat-card">
              <div className="value">{overview.unfollow_rate}%</div>
              <div className="label">取关率</div>
            </div>
            <div className="stat-card">
              <div className="value">{overview.follow_conversion_rate}%</div>
              <div className="label">推荐转化率</div>
            </div>
            <div className="stat-card">
              <div className="value">{overview.report_rate}%</div>
              <div className="label">举报率</div>
            </div>
          </div>

          <div className="card">
            <h3>趋势图</h3>
            <div className="chart-container">
              <Line data={trendChartData} options={chartOptions} />
            </div>
          </div>
        </>
      )}

      {showTrail && userTrail && (
        <div className="modal-overlay" onClick={() => setShowTrail(false)}>
          <div className="modal" style={{ width: 800, maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3>用户关系轨迹 - ID: {searchUserId}</h3>
            
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              <div className="stat-card" style={{ padding: '12px 8px' }}>
                <div className="value" style={{ fontSize: 20 }}>{userTrail.stats?.following_count || 0}</div>
                <div className="label">关注</div>
              </div>
              <div className="stat-card" style={{ padding: '12px 8px' }}>
                <div className="value" style={{ fontSize: 20 }}>{userTrail.stats?.follower_count || 0}</div>
                <div className="label">粉丝</div>
              </div>
              <div className="stat-card" style={{ padding: '12px 8px' }}>
                <div className="value" style={{ fontSize: 20 }}>{userTrail.stats?.friend_count || 0}</div>
                <div className="label">好友</div>
              </div>
              <div className="stat-card" style={{ padding: '12px 8px' }}>
                <div className="value" style={{ fontSize: 20 }}>{userTrail.stats?.blacklist_count || 0}</div>
                <div className="label">黑名单</div>
              </div>
              <div className="stat-card" style={{ padding: '12px 8px' }}>
                <div className="value" style={{ fontSize: 20 }}>{userTrail.stats?.report_count || 0}</div>
                <div className="label">被举报</div>
              </div>
            </div>

            <h4 style={{ margin: '16px 0 12px' }}>操作记录</h4>
            {userTrail.logs?.list?.length === 0 ? (
              <div className="empty">暂无操作记录</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>操作</th>
                    <th>目标用户</th>
                    <th>时间</th>
                  </tr>
                </thead>
                <tbody>
                  {userTrail.logs?.list?.map(log => (
                    <tr key={log.id}>
                      <td>{getActionLabel(log.action)}</td>
                      <td>{log.target_nickname || log.target_id || '-'}</td>
                      <td>{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="btn" onClick={() => setShowTrail(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
