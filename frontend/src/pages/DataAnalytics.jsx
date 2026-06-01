import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { creatorAPI, workAPI, CREATOR_ID } from '../utils/api.js';

const DataAnalytics = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const urlWorkId = searchParams.get('workId');

  const [works, setWorks] = useState([]);
  const [selectedWork, setSelectedWork] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');
  const [compareMode, setCompareMode] = useState(false);
  const [compareWork, setCompareWork] = useState(null);
  const [compareDailyData, setCompareDailyData] = useState([]);

  useEffect(() => {
    loadWorks();
  }, []);

  useEffect(() => {
    if (works.length > 0) {
      if (urlWorkId) {
        const found = works.find(w => w.id === parseInt(urlWorkId));
        if (found) {
          setSelectedWork(found.id);
        } else if (works.length > 0) {
          setSelectedWork(works[0].id);
        }
      } else {
        setSelectedWork(works[0].id);
      }
    }
  }, [works]);

  useEffect(() => {
    if (selectedWork) {
      loadDailyData(selectedWork);
    }
  }, [selectedWork, dateRange]);

  useEffect(() => {
    if (compareWork) {
      loadCompareDailyData(compareWork);
    } else {
      setCompareDailyData([]);
    }
  }, [compareWork, dateRange]);

  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date();
    
    switch(dateRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        return null;
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    };
  };

  const loadWorks = async () => {
    try {
      const res = await creatorAPI.getWorks(CREATOR_ID, 'published');
      setWorks(res.data);
    } catch (error) {
      console.error('Failed to load works:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyData = async (workId) => {
    try {
      const range = dateRange === 'all' ? null : getDateRange();
      const res = await workAPI.getDailyData(workId, range?.start, range?.end);
      setDailyData(res.data);
    } catch (error) {
      console.error('Failed to load daily data:', error);
    }
  };

  const loadCompareDailyData = async (workId) => {
    try {
      const range = dateRange === 'all' ? null : getDateRange();
      const res = await workAPI.getDailyData(workId, range?.start, range?.end);
      setCompareDailyData(res.data);
    } catch (error) {
      console.error('Failed to load compare daily data:', error);
    }
  };

  const currentWork = works.find(w => w.id === selectedWork);
  const compareWorkData = works.find(w => w.id === compareWork);

  const getChartOption = (data, compareData, title, dataKey, color1, color2) => {
    const option = {
      tooltip: { trigger: 'axis' },
      legend: { data: compareData && compareData.length > 0 ? [currentWork?.title || '当前作品', compareWorkData?.title || '对比作品'] : [title] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map(d => d.date)
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: currentWork?.title || '当前作品',
          type: 'line',
          smooth: true,
          data: data.map(d => d[dataKey]),
          areaStyle: { opacity: 0.3 },
          itemStyle: { color: color1 }
        }
      ]
    };
    
    if (compareData && compareData.length > 0) {
      option.series.push({
        name: compareWorkData?.title || '对比作品',
        type: 'line',
        smooth: true,
        data: compareData.map(d => d[dataKey]),
        areaStyle: { opacity: 0.2 },
        itemStyle: { color: color2 }
      });
    }
    
    return option;
  };

  const totalStats = dailyData.reduce((acc, d) => ({
    views: acc.views + d.views,
    exposures: acc.exposures + d.exposures,
    plays: acc.plays + d.plays,
    likes: acc.likes + d.likes,
    comments: acc.comments + d.comments,
    favorites: acc.favorites + d.favorites,
    new_followers: acc.new_followers + d.new_followers,
    income: acc.income + d.income,
  }), { views: 0, exposures: 0, plays: 0, likes: 0, comments: 0, favorites: 0, new_followers: 0, income: 0 });

  const completionRate = totalStats.plays > 0 ? ((totalStats.views / totalStats.plays) * 100).toFixed(1) : 0;

  const getFormattedStats = (stats) => ({
    views: stats.views.toLocaleString(),
    exposures: stats.exposures.toLocaleString(),
    plays: stats.plays.toLocaleString(),
    likes: stats.likes.toLocaleString(),
    comments: stats.comments.toLocaleString(),
    favorites: stats.favorites.toLocaleString(),
    new_followers: stats.new_followers.toLocaleString(),
  });

  return (
    <div>
      <div className="page-header">
        <h2>数据中心</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="text-muted">时间：</span>
            <select
              className="form-input"
              style={{ width: '100px' }}
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="7d">近7天</option>
              <option value="30d">近30天</option>
              <option value="90d">近90天</option>
              <option value="all">全部</option>
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={compareMode}
              onChange={(e) => {
                setCompareMode(e.target.checked);
                if (!e.target.checked) setCompareWork(null);
              }}
            />
            作品对比
          </label>
          {compareMode && (
            <select
              className="form-input"
              style={{ width: '180px' }}
              value={compareWork || ''}
              onChange={(e) => setCompareWork(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">选择对比作品</option>
              {works.filter(w => w.id !== selectedWork).map(w => (
                <option key={w.id} value={w.id}>{w.title}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      <div className="page-content">
        {loading ? (
          <div className="flex-center" style={{ padding: '100px 0' }}>
            <span>加载中...</span>
          </div>
        ) : works.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📊</div>
            <div className="empty-text">暂无已发布作品</div>
          </div>
        ) : (
          <>
            <div className="card">
              <div style={{ display: 'flex', gap: '24px', marginBottom: '20px', alignItems: 'center' }}>
                <div style={{ width: '120px', height: '68px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px' }}>
                  视频封面
                </div>
                <div style={{ flex: 1 }}>
                  <select
                    className="form-input"
                    style={{ width: '300px' }}
                    value={selectedWork || ''}
                    onChange={(e) => setSelectedWork(parseInt(e.target.value))}
                  >
                    {works.map(w => (
                      <option key={w.id} value={w.id}>{w.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
                <div className="stat-card" style={{ padding: '16px' }}>
                  <div className="stat-value" style={{ fontSize: '20px' }}>{totalStats.exposures.toLocaleString()}</div>
                  <div className="stat-label">曝光量</div>
                </div>
                <div className="stat-card" style={{ padding: '16px' }}>
                  <div className="stat-value" style={{ fontSize: '20px' }}>{totalStats.plays.toLocaleString()}</div>
                  <div className="stat-label">播放量</div>
                </div>
                <div className="stat-card" style={{ padding: '16px' }}>
                  <div className="stat-value" style={{ fontSize: '20px' }}>{totalStats.views.toLocaleString()}</div>
                  <div className="stat-label">完播量</div>
                </div>
                <div className="stat-card" style={{ padding: '16px' }}>
                  <div className="stat-value" style={{ fontSize: '20px' }}>{completionRate}%</div>
                  <div className="stat-label">完播率</div>
                </div>
                <div className="stat-card" style={{ padding: '16px' }}>
                  <div className="stat-value" style={{ fontSize: '20px' }}>{totalStats.likes.toLocaleString()}</div>
                  <div className="stat-label">点赞</div>
                </div>
                <div className="stat-card" style={{ padding: '16px' }}>
                  <div className="stat-value text-success" style={{ fontSize: '20px' }}>+{totalStats.new_followers}</div>
                  <div className="stat-label">转粉</div>
                </div>
              </div>

              {currentWork && (
                <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', padding: '16px 0', borderTop: '1px solid #f0f0f0' }}>
                  <div>
                    <div className="text-muted" style={{ fontSize: '13px', marginBottom: '4px' }}>点击率</div>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>
                      {currentWork.exposures > 0 ? ((currentWork.views / currentWork.exposures) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted" style={{ fontSize: '13px', marginBottom: '4px' }}>点赞率</div>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>
                      {currentWork.views > 0 ? ((currentWork.likes / currentWork.views) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted" style={{ fontSize: '13px', marginBottom: '4px' }}>评论率</div>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>
                      {currentWork.views > 0 ? ((currentWork.comments / currentWork.views) * 100).toFixed(2) : 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted" style={{ fontSize: '13px', marginBottom: '4px' }}>收藏率</div>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>
                      {currentWork.views > 0 ? ((currentWork.favorites / currentWork.views) * 100).toFixed(2) : 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted" style={{ fontSize: '13px', marginBottom: '4px' }}>转粉率</div>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>
                      {currentWork.views > 0 ? ((currentWork.new_followers / currentWork.views) * 100).toFixed(2) : 0}%
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">曝光与播放趋势</h3>
              </div>
              <div className="chart-container">
                <ReactECharts 
                  option={getChartOption(
                    dailyData, compareMode ? compareDailyData : null,
                    '曝光/播放', 'exposures', '#722ed1', '#fa8c16'
                  )} 
                  style={{ height: '100%' }} 
                />
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">完播量趋势</h3>
              </div>
              <div className="chart-container">
                <ReactECharts 
                  option={getChartOption(
                    dailyData, compareMode ? compareDailyData : null,
                    '完播量', 'views', '#1890ff', '#13c2c2'
                  )} 
                  style={{ height: '100%' }} 
                />
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">互动趋势（点赞/评论/收藏/转粉）</h3>
              </div>
              <div className="chart-container">
                <ReactECharts 
                  option={{
                    tooltip: { trigger: 'axis' },
                    legend: { data: compareMode && compareDailyData.length > 0 ? 
                      [`${currentWork?.title} - 点赞`, `${compareWorkData?.title} - 点赞`] : 
                      ['点赞', '评论', '收藏', '转粉'] 
                    },
                    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                    xAxis: {
                      type: 'category',
                      boundaryGap: false,
                      data: dailyData.map(d => d.date)
                    },
                    yAxis: { type: 'value' },
                    series: [
                      { name: `${currentWork?.title} - 点赞`, type: 'line', smooth: true, data: dailyData.map(d => d.likes), itemStyle: { color: '#eb2f96' } },
                      { name: `${currentWork?.title} - 评论`, type: 'line', smooth: true, data: dailyData.map(d => d.comments), itemStyle: { color: '#fa8c16' } },
                      { name: `${currentWork?.title} - 收藏`, type: 'line', smooth: true, data: dailyData.map(d => d.favorites), itemStyle: { color: '#52c41a' } },
                      { name: `${currentWork?.title} - 转粉`, type: 'line', smooth: true, data: dailyData.map(d => d.new_followers), itemStyle: { color: '#13c2c2' } },
                      ...(compareMode && compareDailyData.length > 0 ? [
                        { name: `${compareWorkData?.title} - 点赞`, type: 'line', smooth: true, data: compareDailyData.map(d => d.likes), itemStyle: { color: '#eb2f96', opacity: 0.5 }, lineStyle: { type: 'dashed' } },
                        { name: `${compareWorkData?.title} - 评论`, type: 'line', smooth: true, data: compareDailyData.map(d => d.comments), itemStyle: { color: '#fa8c16', opacity: 0.5 }, lineStyle: { type: 'dashed' } },
                        { name: `${compareWorkData?.title} - 收藏`, type: 'line', smooth: true, data: compareDailyData.map(d => d.favorites), itemStyle: { color: '#52c41a', opacity: 0.5 }, lineStyle: { type: 'dashed' } },
                        { name: `${compareWorkData?.title} - 转粉`, type: 'line', smooth: true, data: compareDailyData.map(d => d.new_followers), itemStyle: { color: '#13c2c2', opacity: 0.5 }, lineStyle: { type: 'dashed' } },
                      ] : [])
                    ]
                  }} 
                  style={{ height: '100%' }} 
                />
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">每日明细</h3>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>曝光</th>
                    <th>播放</th>
                    <th>完播</th>
                    <th>完播率</th>
                    <th>点赞</th>
                    <th>评论</th>
                    <th>收藏</th>
                    <th>转粉</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData.map(d => (
                    <tr key={d.date}>
                      <td>{d.date}</td>
                      <td>{d.exposures.toLocaleString()}</td>
                      <td>{d.plays.toLocaleString()}</td>
                      <td>{d.views.toLocaleString()}</td>
                      <td>{d.plays > 0 ? ((d.views / d.plays) * 100).toFixed(1) : 0}%</td>
                      <td>{d.likes.toLocaleString()}</td>
                      <td>{d.comments.toLocaleString()}</td>
                      <td>{d.favorites.toLocaleString()}</td>
                      <td className="text-success">+{d.new_followers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DataAnalytics;
