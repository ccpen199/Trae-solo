import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { adminAPI, newsAPI } from '../api/client';
import useAuthStore from '../store/authStore';

function Admin() {
  const navigate = useNavigate();
  const admin = useAuthStore((state) => state.admin);
  const logout = useAuthStore((state) => state.logout);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (!admin) {
    navigate('/admin/login');
    return null;
  }

  const menuItems = [
    { key: 'dashboard', label: '📊 仪表盘', roles: ['super', 'district', 'reviewer'] },
    { key: 'sensitive', label: '🔒 敏感词库', roles: ['super', 'district'] },
    { key: 'validation', label: '✅ 交叉验证记录', roles: ['super', 'district'] },
    { key: 'review', label: '📝 内容审核', roles: ['super', 'district', 'reviewer'] },
    { key: 'heatmap', label: '🗺️ 供需热力图', roles: ['super', 'district'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(admin.admin_level));

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <h2>管理后台</h2>
          <p className="admin-role">
            {admin.admin_level === 'super' ? '超级管理员' : admin.admin_level === 'district' ? '区县管理员' : '社区审核员'}
          </p>
        </div>
        <nav className="admin-menu">
          {filteredMenu.map((item) => (
            <button
              key={item.key}
              className={`admin-menu-item ${activeMenu === item.key ? 'active' : ''}`}
              onClick={() => setActiveMenu(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="admin-footer">
          <p>当前管理员：{admin.username}</p>
          <button className="btn btn-secondary btn-block" onClick={handleLogout}>退出登录</button>
        </div>
      </aside>

      <main className="admin-main">
        {activeMenu === 'dashboard' && <AdminDashboard />}
        {activeMenu === 'sensitive' && <AdminSensitiveWords />}
        {activeMenu === 'validation' && <AdminValidationRecords />}
        {activeMenu === 'review' && <AdminContentReview />}
        {activeMenu === 'heatmap' && <AdminHeatmap />}
      </main>
    </div>
  );
}

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await adminAPI.getDashboard();
      setData(res.data.data);
    } catch (err) {
      console.error('加载失败', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div className="admin-page">
      <h1 className="page-title">运营仪表盘</h1>
      
      <div className="stats-grid">
        <div className="stat-card card">
          <h3>总用户数</h3>
          <p className="stat-number">{data?.total_users?.toLocaleString() || 0}</p>
          <p className="stat-label">较昨日 +{data?.new_users_today || 0}</p>
        </div>
        <div className="stat-card card">
          <h3>招聘信息</h3>
          <p className="stat-number">{data?.total_jobs?.toLocaleString() || 0}</p>
          <p className="stat-label">待审核 {data?.pending_jobs || 0}</p>
        </div>
        <div className="stat-card card">
          <h3>房产信息</h3>
          <p className="stat-number">{data?.total_properties?.toLocaleString() || 0}</p>
          <p className="stat-label">待核验 {data?.pending_properties || 0}</p>
        </div>
        <div className="stat-card card">
          <h3>二手车信息</h3>
          <p className="stat-number">{data?.total_cars?.toLocaleString() || 0}</p>
          <p className="stat-label">待审核 {data?.pending_cars || 0}</p>
        </div>
        <div className="stat-card card">
          <h3>资讯数量</h3>
          <p className="stat-number">{data?.total_news?.toLocaleString() || 0}</p>
          <p className="stat-label">待审核 {data?.pending_news || 0}</p>
        </div>
        <div className="stat-card card">
          <h3>今日访问量</h3>
          <p className="stat-number">{data?.today_visits?.toLocaleString() || 0}</p>
          <p className="stat-label">PV/UV</p>
        </div>
      </div>

      <div className="admin-section">
        <h2>最近发布内容</h2>
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>类型</th>
                <th>标题</th>
                <th>发布者</th>
                <th>发布时间</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {data?.recent_content?.length > 0 ? data.recent_content.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <span className={`badge badge-${item.type === 'job' ? 'info' : item.type === 'property' ? 'success' : item.type === 'car' ? 'warning' : 'primary'}`}>
                      {item.type === 'job' ? '招聘' : item.type === 'property' ? '房产' : item.type === 'car' ? '二手车' : '资讯'}
                    </span>
                  </td>
                  <td>{item.title}</td>
                  <td>{item.publisher || '匿名'}</td>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${item.status === 'verified' ? 'badge-success' : item.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                      {item.status === 'verified' ? '已通过' : item.status === 'pending' ? '待审核' : '已拒绝'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="text-center">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-section">
        <h2>各区域数据统计</h2>
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>区域</th>
                <th>用户数</th>
                <th>招聘数</th>
                <th>房产数</th>
                <th>二手车数</th>
                <th>资讯数</th>
              </tr>
            </thead>
            <tbody>
              {data?.region_stats?.length > 0 ? data.region_stats.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.region_name}</td>
                  <td>{item.user_count || 0}</td>
                  <td>{item.job_count || 0}</td>
                  <td>{item.property_count || 0}</td>
                  <td>{item.car_count || 0}</td>
                  <td>{item.news_count || 0}</td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="text-center">暂无数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminSensitiveWords() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState({ word: '', category: 'general', replacement: '***' });
  const [checkText, setCheckText] = useState('');
  const [checkResult, setCheckResult] = useState(null);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getSensitiveWords({ pageSize: 100 });
      setWords(res.data.data.list || []);
    } catch (err) {
      console.error('加载失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.addSensitiveWord(newWord);
      alert('添加成功');
      setNewWord({ word: '', category: 'general', replacement: '***' });
      loadWords();
    } catch (err) {
      alert(err.response?.data?.message || '添加失败');
    }
  };

  const handleDeleteWord = async (id) => {
    if (!confirm('确定要删除该敏感词吗？')) return;
    try {
      await adminAPI.deleteSensitiveWord(id);
      alert('删除成功');
      loadWords();
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleCheckText = async () => {
    if (!checkText) {
      alert('请输入要检测的文本');
      return;
    }
    try {
      const res = await adminAPI.checkSensitive({ text: checkText });
      setCheckResult(res.data.data);
    } catch (err) {
      alert('检测失败');
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div className="admin-page">
      <h1 className="page-title">地域敏感词库管理</h1>
      
      <div className="admin-section">
        <h2>添加敏感词</h2>
        <div className="card">
          <form onSubmit={handleAddWord} className="form-inline">
            <div className="form-group">
              <label>敏感词 *</label>
              <input
                type="text"
                value={newWord.word}
                onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                placeholder="请输入敏感词"
                required
              />
            </div>
            <div className="form-group">
              <label>分类</label>
              <select value={newWord.category} onChange={(e) => setNewWord({ ...newWord, category: e.target.value })}>
                <option value="general">通用</option>
                <option value="political">政治敏感</option>
                <option value="pornographic">色情低俗</option>
                <option value="violent">暴力</option>
                <option value="fraud">诈骗</option>
                <option value="regional">地域</option>
              </select>
            </div>
            <div className="form-group">
              <label>替换为</label>
              <input
                type="text"
                value={newWord.replacement}
                onChange={(e) => setNewWord({ ...newWord, replacement: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary">添加</button>
          </form>
        </div>
      </div>

      <div className="admin-section">
        <h2>敏感词检测</h2>
        <div className="card">
          <div className="form-group">
            <textarea
              value={checkText}
              onChange={(e) => setCheckText(e.target.value)}
              placeholder="输入要检测的文本..."
              rows="4"
            />
          </div>
          <button className="btn btn-primary" onClick={handleCheckText}>检测敏感词</button>
          {checkResult && (
            <div className={`verify-result ${checkResult.contains_sensitive ? 'error' : 'success'}`}>
              {checkResult.contains_sensitive
                ? `❌ 检测到敏感词：${checkResult.matched_words.join(', ')}，已自动替换为：${checkResult.filtered_text}`
                : '✅ 未检测到敏感词'}
            </div>
          )}
        </div>
      </div>

      <div className="admin-section">
        <h2>敏感词列表（共 {words.length} 个）</h2>
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>敏感词</th>
                <th>分类</th>
                <th>替换为</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {words.map((word) => (
                <tr key={word.id}>
                  <td>{word.id}</td>
                  <td>{word.word}</td>
                  <td>
                    <span className={`badge badge-${word.category === 'political' ? 'danger' : word.category === 'pornographic' ? 'warning' : 'info'}`}>
                      {word.category === 'general' ? '通用' : word.category === 'political' ? '政治' : word.category === 'pornographic' ? '色情' : word.category === 'violent' ? '暴力' : word.category === 'fraud' ? '诈骗' : '地域'}
                    </span>
                  </td>
                  <td>{word.replacement}</td>
                  <td>{new Date(word.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteWord(word.id)}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminValidationRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    content_type: '',
    validation_result: '',
    page: 1,
    pageSize: 20,
  });

  useEffect(() => {
    loadRecords();
  }, [filters]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getValidationRecords(filters);
      setRecords(res.data.data.list || []);
    } catch (err) {
      console.error('加载失败', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div className="admin-page">
      <h1 className="page-title">多源信息交叉验证记录</h1>
      
      <div className="card filter-card">
        <div className="form-inline">
          <div className="form-group">
            <label>内容类型</label>
            <select value={filters.content_type} onChange={(e) => setFilters({ ...filters, content_type: e.target.value, page: 1 })}>
              <option value="">全部</option>
              <option value="job">招聘</option>
              <option value="property">房产</option>
              <option value="car">二手车</option>
              <option value="news">资讯</option>
            </select>
          </div>
          <div className="form-group">
            <label>验证结果</label>
            <select value={filters.validation_result} onChange={(e) => setFilters({ ...filters, validation_result: e.target.value, page: 1 })}>
              <option value="">全部</option>
              <option value="passed">通过</option>
              <option value="warning">警告</option>
              <option value="failed">失败</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={loadRecords}>查询</button>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>内容类型</th>
              <th>内容ID</th>
              <th>验证项</th>
              <th>结果</th>
              <th>置信度</th>
              <th>验证时间</th>
              <th>验证说明</th>
            </tr>
          </thead>
          <tbody>
            {records.length > 0 ? records.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>
                  <span className={`badge badge-${record.content_type === 'job' ? 'info' : record.content_type === 'property' ? 'success' : record.content_type === 'car' ? 'warning' : 'primary'}`}>
                    {record.content_type === 'job' ? '招聘' : record.content_type === 'property' ? '房产' : record.content_type === 'car' ? '二手车' : '资讯'}
                  </span>
                </td>
                <td>{record.content_id}</td>
                <td>{record.validation_type}</td>
                <td>
                  <span className={`badge ${record.validation_result === 'passed' ? 'badge-success' : record.validation_result === 'warning' ? 'badge-warning' : 'badge-danger'}`}>
                    {record.validation_result === 'passed' ? '通过' : record.validation_result === 'warning' ? '警告' : '失败'}
                  </span>
                </td>
                <td>{record.confidence_score}%</td>
                <td>{new Date(record.created_at).toLocaleString()}</td>
                <td>{record.validation_message || '-'}</td>
              </tr>
            )) : (
              <tr><td colSpan="8" className="text-center">暂无验证记录</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminContentReview() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadPendingNews();
  }, []);

  const loadPendingNews = async () => {
    try {
      setLoading(true);
      const res = await newsAPI.getPendingNews();
      setNewsList(res.data.data || []);
    } catch (err) {
      console.error('加载失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status, comment = '') => {
    try {
      await newsAPI.reviewNews(id, { status, comment });
      alert('审核完成');
      loadPendingNews();
    } catch (err) {
      alert(err.response?.data?.message || '审核失败');
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div className="admin-page">
      <h1 className="page-title">内容审核</h1>
      
      <div className="tabs">
        <button className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>待审核爆料 ({newsList.length})</button>
      </div>

      <div className="card">
        {newsList.length > 0 ? (
          <div className="review-list">
            {newsList.map((news) => (
              <div key={news.id} className="review-item card-inner">
                <div className="review-header">
                  <h3>{news.title}</h3>
                  <span className="badge badge-warning">待审核</span>
                </div>
                <div className="review-meta">
                  <span>爆料人：{news.publisher_name || '匿名'}</span>
                  <span>联系方式：{news.contact_phone || '未留'}</span>
                  <span>爆料时间：{new Date(news.created_at).toLocaleString()}</span>
                </div>
                <p className="review-content">{news.content}</p>
                {news.location && <p className="review-location">📍 {news.location}</p>}
                <div className="review-actions">
                  <button className="btn btn-success" onClick={() => handleReview(news.id, 'approved')}>通过</button>
                  <button className="btn btn-danger" onClick={() => {
                    const reason = prompt('请输入拒绝原因：');
                    if (reason !== null) handleReview(news.id, 'rejected', reason);
                  }}>拒绝</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">暂无待审核内容</div>
        )}
      </div>
    </div>
  );
}

function AdminHeatmap() {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataType, setDataType] = useState('job');
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadHeatmap();
  }, [dataType, timeRange]);

  const loadHeatmap = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getHeatmap({ data_type: dataType, time_range: timeRange });
      setHeatmapData(res.data.data || []);
    } catch (err) {
      console.error('加载失败', err);
    } finally {
      setLoading(false);
    }
  };

  const getHeatColor = (value, max) => {
    const ratio = value / max;
    if (ratio > 0.8) return '#dc2626';
    if (ratio > 0.6) return '#ea580c';
    if (ratio > 0.4) return '#ca8a04';
    if (ratio > 0.2) return '#65a30d';
    return '#16a34a';
  };

  const maxSupply = Math.max(...heatmapData.map(d => d.supply_count || 0), 1);
  const maxDemand = Math.max(...heatmapData.map(d => d.demand_count || 0), 1);

  const typeLabels = {
    job: '招聘供需',
    property: '房产供需',
    car: '二手车供需',
    service: '便民服务',
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div className="admin-page">
      <h1 className="page-title">服务供需匹配度热力图</h1>
      
      <div className="card filter-card">
        <div className="form-inline">
          <div className="form-group">
            <label>数据类型</label>
            <select value={dataType} onChange={(e) => setDataType(e.target.value)}>
              <option value="job">招聘</option>
              <option value="property">房产</option>
              <option value="car">二手车</option>
              <option value="service">便民服务</option>
            </select>
          </div>
          <div className="form-group">
            <label>时间范围</label>
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="1d">今天</option>
              <option value="7d">近7天</option>
              <option value="30d">近30天</option>
              <option value="90d">近90天</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={loadHeatmap}>刷新</button>
        </div>
      </div>

      <h2>{typeLabels[dataType]}热力图</h2>
      <div className="card">
        <div className="heatmap-legend">
          <div className="legend-item"><span style={{background: '#16a34a'}}></span>低</div>
          <div className="legend-item"><span style={{background: '#65a30d'}}></span>较低</div>
          <div className="legend-item"><span style={{background: '#ca8a04'}}></span>中等</div>
          <div className="legend-item"><span style={{background: '#ea580c'}}></span>较高</div>
          <div className="legend-item"><span style={{background: '#dc2626'}}></span>高</div>
        </div>
        
        <div className="heatmap-grid">
          <div className="heatmap-header">
            <div className="heatmap-cell header-cell">区域</div>
            <div className="heatmap-cell header-cell">供应量</div>
            <div className="heatmap-cell header-cell">需求量</div>
            <div className="heatmap-cell header-cell">匹配度</div>
            <div className="heatmap-cell header-cell">供应热力</div>
            <div className="heatmap-cell header-cell">需求热力</div>
          </div>
          {heatmapData.length > 0 ? heatmapData.map((item, idx) => (
            <div key={idx} className="heatmap-row">
              <div className="heatmap-cell">{item.region_name}</div>
              <div className="heatmap-cell">{item.supply_count || 0}</div>
              <div className="heatmap-cell">{item.demand_count || 0}</div>
              <div className="heatmap-cell">
                <span className={`badge ${(item.match_score || 0) >= 80 ? 'badge-success' : (item.match_score || 0) >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                  {item.match_score || 0}%
                </span>
              </div>
              <div className="heatmap-cell">
                <div
                  className="heatmap-bar"
                  style={{
                    width: `${((item.supply_count || 0) / maxSupply) * 100}%`,
                    background: getHeatColor(item.supply_count || 0, maxSupply),
                  }}
                >
                  {item.supply_count || 0}
                </div>
              </div>
              <div className="heatmap-cell">
                <div
                  className="heatmap-bar"
                  style={{
                    width: `${((item.demand_count || 0) / maxDemand) * 100}%`,
                    background: getHeatColor(item.demand_count || 0, maxDemand),
                  }}
                >
                  {item.demand_count || 0}
                </div>
              </div>
            </div>
          )) : (
            <div className="empty">暂无数据</div>
          )}
        </div>
      </div>

      <div className="admin-section">
        <h2>供需匹配分析</h2>
        <div className="card">
          <div className="analysis-grid">
            <div className="analysis-card">
              <h4>总体匹配度</h4>
              <p className="stat-number">
                {heatmapData.length > 0
                  ? (heatmapData.reduce((sum, item) => sum + (item.match_score || 0), 0) / heatmapData.length).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className="analysis-card">
              <h4>总供应量</h4>
              <p className="stat-number">{heatmapData.reduce((sum, item) => sum + (item.supply_count || 0), 0)}</p>
            </div>
            <div className="analysis-card">
              <h4>总需求量</h4>
              <p className="stat-number">{heatmapData.reduce((sum, item) => sum + (item.demand_count || 0), 0)}</p>
            </div>
            <div className="analysis-card">
              <h4>覆盖区域</h4>
              <p className="stat-number">{heatmapData.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;
