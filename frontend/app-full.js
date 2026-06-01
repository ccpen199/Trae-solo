const { useState, useEffect, useCallback } = React;
const API_BASE_URL = 'http://127.0.0.1:53408/api';

const api = {
  get: async (url) => {
    const userId = localStorage.getItem('userId') || '2';
    const response = await fetch(API_BASE_URL + url, {
      headers: { 'X-User-Id': userId, 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '请求失败');
    return { data };
  },
  post: async (url, body) => {
    const userId = localStorage.getItem('userId') || '2';
    const response = await fetch(API_BASE_URL + url, {
      method: 'POST',
      headers: { 'X-User-Id': userId, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '请求失败');
    return { data };
  },
  put: async (url, body) => {
    const userId = localStorage.getItem('userId') || '2';
    const response = await fetch(API_BASE_URL + url, {
      method: 'PUT',
      headers: { 'X-User-Id': userId, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '请求失败');
    return { data };
  },
  delete: async (url) => {
    const userId = localStorage.getItem('userId') || '2';
    const response = await fetch(API_BASE_URL + url, {
      method: 'DELETE',
      headers: { 'X-User-Id': userId, 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '请求失败');
    return { data };
  }
};

function StatCard({ value, label }) {
  return React.createElement('div', { className: 'stat-card' },
    React.createElement('div', { className: 'value' }, value),
    React.createElement('div', { className: 'label' }, label)
  );
}

function UserCard({ item, actions, showStats, tab }) {
  return React.createElement('div', { className: 'user-card', key: item.id },
    React.createElement('div', { className: 'user-info' },
      React.createElement('div', { className: 'avatar' }, item.nickname?.[0] || '?'),
      React.createElement('div', null,
        React.createElement('div', { className: 'user-name' },
          item.nickname,
          item.is_mutual && React.createElement('span', { className: 'mutual' }, ' 互相关注')
        ),
        React.createElement('div', { className: 'user-username' }, '@' + item.username)
      )
    ),
    item.bio && React.createElement('div', { className: 'user-bio' }, item.bio),
    item.reason && React.createElement('div', { className: 'recommend-reason' }, '推荐原因: ' + item.reason),
    showStats && tab !== 'requests' && React.createElement('div', { className: 'user-stats' },
      item.intimacy_score !== undefined && React.createElement('span', null, '亲密度: ' + item.intimacy_score),
      item.common_following_count !== undefined && React.createElement('span', null, '共同关注: ' + item.common_following_count),
      item.updated_at && React.createElement('span', null, '更新: ' + new Date(item.updated_at).toLocaleDateString()),
      item.score !== undefined && React.createElement('span', null, '推荐分数: ' + item.score),
      item.location && React.createElement('span', null, '地区: ' + item.location)
    ),
    actions
  );
}

function Pagination({ page, total, pageSize, onPageChange }) {
  const totalPages = Math.ceil(total / pageSize) || 1;
  return React.createElement('div', { className: 'pagination' },
    React.createElement('button', { disabled: page <= 1, onClick: () => onPageChange(page - 1) }, '上一页'),
    React.createElement('span', null, '第 ' + page + ' 页 / 共 ' + totalPages + ' 页'),
    React.createElement('button', { disabled: page >= totalPages, onClick: () => onPageChange(page + 1) }, '下一页')
  );
}

function RelationsPage({ currentUser, onRefresh }) {
  const [activeTab, setActiveTab] = useState('following');
  const [data, setData] = useState({ list: [], total: 0 });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('updated_at');
  const [showFriendRequestModal, setShowFriendRequestModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [friendMessage, setFriendMessage] = useState('');
  const [blockReason, setBlockReason] = useState('');

  const tabs = [
    { key: 'following', label: '关注' },
    { key: 'followers', label: '粉丝' },
    { key: 'friends', label: '好友' },
    { key: 'requests', label: '好友申请' },
    { key: 'blacklist', label: '黑名单' }
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint;
      switch (activeTab) {
        case 'following': endpoint = `/relations/following?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}`; break;
        case 'followers': endpoint = `/relations/followers?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}`; break;
        case 'friends': endpoint = `/relations/friends?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}`; break;
        case 'blacklist': endpoint = `/relations/blacklist?page=${page}&pageSize=${pageSize}`; break;
        case 'requests': endpoint = `/relations/friend-requests?page=${page}&pageSize=${pageSize}`; break;
        default: endpoint = `/relations/following?page=${page}&pageSize=${pageSize}`;
      }
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    }
    setLoading(false);
  }, [activeTab, page, pageSize, sortBy]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFollow = async (userId) => {
    try { await api.post(`/relations/follow/${userId}`); alert('关注成功'); loadData(); onRefresh && onRefresh(); }
    catch (err) { alert(err.message || '操作失败'); }
  };

  const handleUnfollow = async (userId) => {
    if (!confirm('确定要取消关注吗？')) return;
    try { await api.delete(`/relations/unfollow/${userId}`); alert('已取消关注'); loadData(); onRefresh && onRefresh(); }
    catch (err) { alert(err.message || '操作失败'); }
  };

  const handleBlock = async (userId, reason) => {
    try { await api.post('/relations/block', { blocked_user_id: userId, reason }); alert('已拉黑'); loadData(); onRefresh && onRefresh(); }
    catch (err) { alert(err.message || '操作失败'); }
  };

  const handleUnblock = async (userId) => {
    try { await api.delete(`/relations/unblock/${userId}`); alert('已解除拉黑'); loadData(); onRefresh && onRefresh(); }
    catch (err) { alert(err.message || '操作失败'); }
  };

  const handleSendFriendRequest = async (userId, message) => {
    try { await api.post('/relations/friend-request', { receiver_id: userId, message }); alert('好友申请已发送'); loadData(); }
    catch (err) { alert(err.message || '操作失败'); }
  };

  const handleAcceptFriend = async (requestId) => {
    try { await api.post(`/relations/friend-request/${requestId}/accept`); alert('已通过好友申请'); loadData(); onRefresh && onRefresh(); }
    catch (err) { alert(err.message || '操作失败'); }
  };

  const handleRejectFriend = async (requestId) => {
    try { await api.post(`/relations/friend-request/${requestId}/reject`); alert('已拒绝好友申请'); loadData(); }
    catch (err) { alert(err.message || '操作失败'); }
  };

  const renderActions = (item) => {
    if (activeTab === 'requests') {
      return React.createElement('div', null,
        item.message && React.createElement('p', { style: { marginBottom: '12px', color: '#666' } }, '申请留言: ' + item.message),
        React.createElement('div', { className: 'user-actions' },
          React.createElement('button', { className: 'btn btn-primary', onClick: () => handleAcceptFriend(item.id) }, '通过'),
          React.createElement('button', { className: 'btn', onClick: () => handleRejectFriend(item.id) }, '拒绝')
        )
      );
    }
    if (activeTab === 'blacklist') {
      return React.createElement('div', { className: 'user-actions' },
        React.createElement('button', { className: 'btn', onClick: () => handleUnblock(item.id) }, '解除拉黑')
      );
    }
    return React.createElement('div', { className: 'user-actions' },
      activeTab === 'following' && React.createElement('button', { className: 'btn', onClick: () => handleUnfollow(item.id) }, '取消关注'),
      activeTab === 'followers' && !item.is_following && React.createElement('button', { className: 'btn btn-primary', onClick: () => handleFollow(item.id) }, '回关'),
      activeTab === 'friends' && React.createElement('button', { className: 'btn', onClick: () => handleUnfollow(item.id) }, '解除好友'),
      activeTab !== 'friends' && React.createElement('button', { className: 'btn btn-danger', onClick: () => { setSelectedUserId(item.id); setShowBlockModal(true); } }, '拉黑'),
      activeTab !== 'friends' && React.createElement('button', { className: 'btn', onClick: () => { setSelectedUserId(item.id); setShowFriendRequestModal(true); } }, '申请好友')
    );
  };

  const renderModal = (show, onClose, title, placeholder, value, onChange, onConfirm, confirmText, confirmClass) => {
    if (!show) return null;
    return React.createElement('div', { className: 'modal-overlay', onClick: onClose },
      React.createElement('div', { className: 'modal', onClick: (e) => e.stopPropagation() },
        React.createElement('h3', null, title),
        React.createElement('textarea', { placeholder, value, onChange: (e) => onChange(e.target.value) }),
        React.createElement('div', { className: 'modal-actions' },
          React.createElement('button', { className: 'btn', onClick: onClose }, '取消'),
          React.createElement('button', { className: 'btn ' + confirmClass, onClick: () => { onConfirm(); onClose(); onChange(''); } }, confirmText)
        )
      )
    );
  };

  return React.createElement('div', null,
    React.createElement('div', { className: 'card' },
      React.createElement('h3', null, '我的关系概览'),
      React.createElement('div', { className: 'stats-grid' },
        React.createElement(StatCard, { value: currentUser?.following_count || 0, label: '关注' }),
        React.createElement(StatCard, { value: currentUser?.follower_count || 0, label: '粉丝' }),
        React.createElement(StatCard, { value: currentUser?.friend_count || 0, label: '好友' }),
        React.createElement(StatCard, { value: currentUser?.blacklist_count || 0, label: '黑名单' })
      )
    ),
    React.createElement('div', { className: 'card' },
      React.createElement('div', { className: 'tabs' },
        tabs.map(tab => React.createElement('button', {
          key: tab.key,
          className: 'tab ' + (activeTab === tab.key ? 'active' : ''),
          onClick: () => { setActiveTab(tab.key); setPage(1); }
        }, tab.label))
      ),
      activeTab !== 'blacklist' && activeTab !== 'requests' && React.createElement('div', { className: 'filter-bar' },
        React.createElement('span', null, '排序：'),
        React.createElement('select', { value: sortBy, onChange: (e) => setSortBy(e.target.value) },
          React.createElement('option', { value: 'updated_at' }, '按更新时间'),
          React.createElement('option', { value: 'intimacy_score' }, '按亲密度')
        )
      ),
      loading ? React.createElement('div', { className: 'loading' }, '加载中...') :
      data.list.length === 0 ? React.createElement('div', { className: 'empty' }, '暂无数据') :
      React.createElement('div', null,
        React.createElement('div', { className: 'user-list' },
          data.list.map(item => React.createElement(UserCard, {
            key: item.id,
            item,
            tab: activeTab,
            showStats: true,
            actions: renderActions(item)
          }))
        ),
        React.createElement(Pagination, { page, total: data.total, pageSize, onPageChange: setPage })
      )
    ),
    renderModal(showFriendRequestModal, () => setShowFriendRequestModal(false),
      '发送好友申请', '请输入留言（可选）', friendMessage, setFriendMessage,
      () => handleSendFriendRequest(selectedUserId, friendMessage), '发送', 'btn-primary'),
    renderModal(showBlockModal, () => setShowBlockModal(false),
      '拉黑用户', '请输入拉黑原因（可选）', blockReason, setBlockReason,
      () => handleBlock(selectedUserId, blockReason), '确认拉黑', 'btn-danger')
  );
}

function RecommendationsPage() {
  const [data, setData] = useState({ list: [], total: 0 });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/recommendations?page=${page}&pageSize=${pageSize}`);
      setData(res.data);
    } catch (err) { console.error('加载推荐失败:', err); }
    setLoading(false);
  }, [page, pageSize]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFollow = async (userId) => {
    try { await api.post(`/relations/follow/${userId}`); alert('关注成功'); loadData(); }
    catch (err) { alert(err.message || '操作失败'); }
  };

  return React.createElement('div', { className: 'card' },
    React.createElement('h3', null, '推荐关注'),
    loading ? React.createElement('div', { className: 'loading' }, '加载中...') :
    data.list.length === 0 ? React.createElement('div', { className: 'empty' }, '暂无推荐') :
    React.createElement('div', null,
      React.createElement('div', { className: 'user-list' },
        data.list.map(item => React.createElement(UserCard, {
          key: item.id,
          item,
          showStats: true,
          actions: React.createElement('div', { className: 'user-actions' },
            React.createElement('button', { className: 'btn btn-primary', onClick: () => handleFollow(item.id) }, '关注')
          )
        }))
      ),
      React.createElement(Pagination, { page, total: data.total, pageSize, onPageChange: setPage })
    )
  );
}

function ReportsPage() {
  const [activeTab, setActiveTab] = useState('queue');
  const [data, setData] = useState({ list: [], total: 0 });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { key: 'queue', label: '举报队列' },
    { key: 'my', label: '我的举报' }
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'queue' 
        ? `/reports/queue?page=${page}&pageSize=${pageSize}`
        : `/reports/my?page=${page}&pageSize=${pageSize}`;
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err) { console.error('加载举报失败:', err); setData({ list: [], total: 0 }); }
    setLoading(false);
  }, [activeTab, page, pageSize]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleProcess = async (reportId, action, note) => {
    try { await api.post(`/reports/${reportId}/process`, { action, note }); alert('处理成功'); loadData(); }
    catch (err) { alert(err.message || '操作失败'); }
  };

  const getStatusClass = (status) => ({ pending: 'status-pending', processing: 'status-processing', resolved: 'status-resolved', rejected: 'status-rejected' }[status] || 'status-pending');
  const getStatusText = (status) => ({ pending: '待处理', processing: '处理中', resolved: '已解决', rejected: '已驳回' }[status] || '未知');
  const getTypeText = (type) => ({ spam: '垃圾广告', harassment: '骚扰', fake: '虚假账号', inappropriate: '不当内容', other: '其他' }[type] || type);

  return React.createElement('div', { className: 'card' },
    React.createElement('h3', null, '举报管理'),
    React.createElement('div', { className: 'tabs' },
      tabs.map(tab => React.createElement('button', {
        key: tab.key,
        className: 'tab ' + (activeTab === tab.key ? 'active' : ''),
        onClick: () => { setActiveTab(tab.key); setPage(1); }
      }, tab.label))
    ),
    loading ? React.createElement('div', { className: 'loading' }, '加载中...') :
    data.list.length === 0 ? React.createElement('div', { className: 'empty' }, activeTab === 'queue' ? '暂无待处理举报' : '暂无举报记录') :
    React.createElement('div', null,
      data.list.map(item => React.createElement('div', { key: item.id, className: 'report-item' },
        React.createElement('div', { className: 'report-header' },
          React.createElement('span', { className: 'report-type' }, getTypeText(item.type)),
          React.createElement('span', { className: 'report-status ' + getStatusClass(item.status) }, getStatusText(item.status))
        ),
        React.createElement('div', { className: 'report-content' }, '举报用户: @' + item.reporter_username + ' → 被举报用户: @' + item.reported_username),
        item.description && React.createElement('div', { className: 'report-content' }, '描述: ' + item.description),
        item.process_note && React.createElement('div', { className: 'report-content', style: { color: '#1890ff' } }, '处理结果: ' + item.process_note),
        React.createElement('div', { className: 'report-meta' },
          '举报时间: ' + new Date(item.created_at).toLocaleString(),
          item.updated_at && ' | 处理时间: ' + new Date(item.updated_at).toLocaleString()
        ),
        activeTab === 'queue' && item.status === 'pending' && React.createElement('div', { className: 'user-actions', style: { marginTop: '12px' } },
          React.createElement('button', { className: 'btn btn-primary', onClick: () => handleProcess(item.id, 'resolve', '已处理') }, '通过'),
          React.createElement('button', { className: 'btn', onClick: () => handleProcess(item.id, 'reject', '举报不成立') }, '驳回')
        )
      )),
      React.createElement(Pagination, { page, total: data.total, pageSize, onPageChange: setPage })
    )
  );
}

function RiskPage() {
  const [activeTab, setActiveTab] = useState('records');
  const [data, setData] = useState({ list: [], total: 0 });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { key: 'records', label: '风控记录' },
    { key: 'detection', label: '异常增长检测' }
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'records' 
        ? `/risk/records?page=${page}&pageSize=${pageSize}`
        : `/risk/anomaly-detection?page=${page}&pageSize=${pageSize}`;
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err) { console.error('加载风控数据失败:', err); setData({ list: [], total: 0 }); }
    setLoading(false);
  }, [activeTab, page, pageSize]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleProcess = async (recordId, action, note) => {
    try { await api.post(`/risk/${recordId}/process`, { action, note }); alert('处理成功'); loadData(); }
    catch (err) { alert(err.message || '操作失败'); }
  };

  const getLevelClass = (level) => ({ high: 'risk-level-high', medium: 'risk-level-medium', low: 'risk-level-low' }[level] || '');
  const getLevelText = (level) => ({ high: '高', medium: '中', low: '低' }[level] || '未知');
  const getTypeText = (type) => ({
    mass_follow: '批量关注', multiple_reports: '多次被举报', abnormal_growth: '异常增长',
    suspicious_activity: '可疑行为', admin_warn: '管理员警告', admin_ban: '管理员封禁'
  }[type] || type);

  return React.createElement('div', { className: 'card' },
    React.createElement('h3', null, '风控中心'),
    React.createElement('div', { className: 'tabs' },
      tabs.map(tab => React.createElement('button', {
        key: tab.key,
        className: 'tab ' + (activeTab === tab.key ? 'active' : ''),
        onClick: () => { setActiveTab(tab.key); setPage(1); }
      }, tab.label))
    ),
    loading ? React.createElement('div', { className: 'loading' }, '加载中...') :
    data.list.length === 0 ? React.createElement('div', { className: 'empty' }, '暂无数据') :
    React.createElement('div', null,
      data.list.map(item => {
        const severity = item.risk_level || (item.severity === 3 ? 'high' : item.severity === 2 ? 'medium' : 'low');
        return React.createElement('div', { key: item.id, className: 'risk-item' },
          React.createElement('div', { className: 'risk-header' },
            React.createElement('span', { className: 'risk-type' }, getTypeText(item.type)),
            React.createElement('span', { className: getLevelClass(severity) }, '风险等级: ' + getLevelText(severity))
          ),
          React.createElement('div', { className: 'risk-content' }, '用户: @' + item.username + ' (' + item.nickname + ')'),
          item.description && React.createElement('div', { className: 'risk-content' }, '描述: ' + item.description),
          item.process_note && React.createElement('div', { className: 'risk-content', style: { color: '#1890ff' } }, '处理结果: ' + item.process_note),
          React.createElement('div', { className: 'risk-meta' },
            '创建时间: ' + new Date(item.created_at).toLocaleString(),
            item.processed_at && ' | 处理时间: ' + new Date(item.processed_at).toLocaleString()
          ),
          item.status === 'pending' && React.createElement('div', { className: 'user-actions', style: { marginTop: '12px' } },
            React.createElement('button', { className: 'btn btn-danger', onClick: () => handleProcess(item.id, 'ban', '封禁账号') }, '封禁'),
            React.createElement('button', { className: 'btn', onClick: () => handleProcess(item.id, 'limit', '限制操作') }, '限流'),
            React.createElement('button', { className: 'btn', onClick: () => handleProcess(item.id, 'ignore', '忽略') }, '忽略')
          )
        );
      }),
      React.createElement(Pagination, { page, total: data.total, pageSize, onPageChange: setPage })
    )
  );
}

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/stats/overview';
      const params = [];
      if (startDate) params.push('start_date=' + startDate);
      if (endDate) params.push('end_date=' + endDate);
      if (params.length > 0) url += '?' + params.join('&');
      const res = await api.get(url);
      setStats(res.data);
    } catch (err) { console.error('加载统计数据失败:', err); setStats(null); }
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const StatCard2 = ({ label, value }) => React.createElement('div', { className: 'dashboard-stat-card' },
    React.createElement('div', { className: 'label' }, label),
    React.createElement('div', { className: 'value' }, value)
  );

  return React.createElement('div', null,
    React.createElement('div', { className: 'card' },
      React.createElement('h3', null, '运营看板'),
      React.createElement('div', { className: 'filters' },
        React.createElement('span', null, '开始日期:'),
        React.createElement('input', { type: 'date', value: startDate, onChange: (e) => setStartDate(e.target.value) }),
        React.createElement('span', null, '结束日期:'),
        React.createElement('input', { type: 'date', value: endDate, onChange: (e) => setEndDate(e.target.value) }),
        React.createElement('button', { className: 'btn btn-primary', onClick: loadStats }, '查询')
      )
    ),
    loading ? React.createElement('div', { className: 'card' }, React.createElement('div', { className: 'loading' }, '加载中...')) :
    stats ? React.createElement('div', null,
      React.createElement('div', { className: 'dashboard-stats' },
        React.createElement(StatCard2, { label: '新增关注', value: stats.new_follows || stats.new_relations || 0 }),
        React.createElement(StatCard2, { label: '新增粉丝', value: stats.new_followers || 0 }),
        React.createElement(StatCard2, { label: '新增好友', value: stats.new_friends || stats.new_friendships || 0 }),
        React.createElement(StatCard2, { label: '互关率', value: (stats.mutual_follow_rate || stats.mutual_rate || 0) + '%' }),
        React.createElement(StatCard2, { label: '取关率', value: (stats.unfollow_rate || 0) + '%' }),
        React.createElement(StatCard2, { label: '推荐转化率', value: (stats.recommendation_conversion || stats.follow_conversion_rate || 0) + '%' }),
        React.createElement(StatCard2, { label: '举报率', value: (stats.report_rate || 0) + '%' }),
        React.createElement(StatCard2, { label: '举报处理率', value: (stats.report_resolution_rate || 0) + '%' })
      ),
      stats.trends && stats.trends.length > 0 && React.createElement('div', { className: 'chart-container' },
        React.createElement('h3', null, '趋势数据'),
        React.createElement('div', { style: { overflowX: 'auto' } },
          React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse' } },
            React.createElement('thead', null,
              React.createElement('tr', null,
                React.createElement('th', { style: thStyle }, '日期'),
                React.createElement('th', { style: thStyle }, '新增关注'),
                React.createElement('th', { style: thStyle }, '新增粉丝'),
                React.createElement('th', { style: thStyle }, '互关率'),
                React.createElement('th', { style: thStyle }, '取关率')
              )
            ),
            React.createElement('tbody', null,
              stats.trends.map((item, idx) => React.createElement('tr', { key: idx },
                React.createElement('td', { style: tdStyle }, item.date),
                React.createElement('td', { style: tdStyle }, item.new_follows),
                React.createElement('td', { style: tdStyle }, item.new_followers),
                React.createElement('td', { style: tdStyle }, item.mutual_follow_rate + '%'),
                React.createElement('td', { style: tdStyle }, item.unfollow_rate + '%')
              ))
            )
          )
        )
      ),
      stats.top_users && stats.top_users.length > 0 && React.createElement('div', { className: 'chart-container' },
        React.createElement('h3', null, '热门用户'),
        React.createElement('div', { className: 'user-list' },
          stats.top_users.map((user, idx) => React.createElement('div', { key: user.id, className: 'user-card' },
            React.createElement('div', { className: 'user-info' },
              React.createElement('div', { style: rankStyle }, idx + 1),
              React.createElement('div', null,
                React.createElement('div', { className: 'user-name' }, user.nickname),
                React.createElement('div', { className: 'user-username' }, '@' + user.username)
              )
            ),
            React.createElement('div', { className: 'user-stats' },
              React.createElement('span', null, '粉丝: ' + user.follower_count),
              React.createElement('span', null, '关注: ' + user.following_count)
            )
          ))
        )
      )
    ) : React.createElement('div', { className: 'card' }, React.createElement('div', { className: 'empty' }, '暂无数据'))
  );
}

const thStyle = { padding: '8px', borderBottom: '1px solid #e8e8e8', textAlign: 'left' };
const tdStyle = { padding: '8px', borderBottom: '1px solid #e8e8e8' };
const rankStyle = { width: '24px', height: '24px', borderRadius: '50%', background: '#1890ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', fontWeight: 'bold' };

function App() {
  const [currentPage, setCurrentPage] = useState('relations');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState('2');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const navItems = [
    { key: 'relations', label: '关系管理' },
    { key: 'recommendations', label: '推荐' },
    { key: 'reports', label: '举报' },
    { key: 'risk', label: '风控中心' },
    { key: 'dashboard', label: '运营看板' }
  ];

  useEffect(() => {
    const savedUserId = localStorage.getItem('userId') || '2';
    localStorage.setItem('userId', savedUserId);
    setCurrentUserId(savedUserId);
    loadUsers(savedUserId);
  }, []);

  const loadUsers = async (selectedUserId) => {
    setLoading(true);
    try {
      const res = await api.get('/users/list?pageSize=100');
      setUsers(res.data.list || []);
      const userRes = await api.get('/users/' + selectedUserId);
      setCurrentUser(userRes.data);
    } catch (err) { console.error('加载用户失败:', err); }
    setLoading(false);
  };

  const handleUserChange = async (e) => {
    const userId = e.target.value;
    localStorage.setItem('userId', userId);
    setCurrentUserId(userId);
    setLoading(true);
    try {
      const res = await api.get('/users/' + userId);
      setCurrentUser(res.data);
    } catch (err) { console.error('切换用户失败:', err); }
    setLoading(false);
  };

  const refreshCurrentUser = async () => {
    try {
      const res = await api.get('/users/' + currentUserId);
      setCurrentUser(res.data);
    } catch (err) { console.error('刷新用户数据失败:', err); }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'relations': return React.createElement(RelationsPage, { key: currentUserId, currentUser, onRefresh: refreshCurrentUser });
      case 'recommendations': return React.createElement(RecommendationsPage, { key: currentUserId });
      case 'reports': return React.createElement(ReportsPage, { key: currentUserId });
      case 'risk': return React.createElement(RiskPage, { key: currentUserId });
      case 'dashboard': return React.createElement(DashboardPage, { key: currentUserId });
      default: return React.createElement(RelationsPage, { key: currentUserId, currentUser, onRefresh: refreshCurrentUser });
    }
  };

  if (loading) {
    return React.createElement('div', { className: 'app' },
      React.createElement('main', { className: 'main' },
        React.createElement('div', { className: 'card', style: { textAlign: 'center', padding: '40px' } }, '加载中...')
      )
    );
  }

  return React.createElement('div', { className: 'app' },
    React.createElement('aside', { className: 'sidebar' },
      React.createElement('h2', null, '社交关系链'),
      React.createElement('nav', null,
        navItems.map(item => React.createElement('a', {
          key: item.key,
          className: currentPage === item.key ? 'active' : '',
          onClick: () => setCurrentPage(item.key)
        }, item.label))
      )
    ),
    React.createElement('main', { className: 'main' },
      React.createElement('div', { className: 'header' },
        React.createElement('h1', null, '社交关系链服务'),
        React.createElement('div', { className: 'user-select' },
          React.createElement('span', null, '当前用户：'),
          React.createElement('select', { value: currentUser?.id || currentUserId, onChange: handleUserChange },
            users.map(user => React.createElement('option', { key: user.id, value: user.id },
              user.nickname + ' (@' + user.username + ')'
            ))
          )
        )
      ),
      renderPage()
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
