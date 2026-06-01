const {
  useState,
  useEffect,
  useCallback
} = React;
const API_BASE_URL = 'http://127.0.0.1:53408/api';
const api = {
  get: async url => {
    const userId = localStorage.getItem('userId') || '2';
    const response = await fetch(API_BASE_URL + url, {
      headers: {
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '请求失败');
    return {
      data
    };
  },
  post: async (url, body) => {
    const userId = localStorage.getItem('userId') || '2';
    const response = await fetch(API_BASE_URL + url, {
      method: 'POST',
      headers: {
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '请求失败');
    return {
      data
    };
  },
  put: async (url, body) => {
    const userId = localStorage.getItem('userId') || '2';
    const response = await fetch(API_BASE_URL + url, {
      method: 'PUT',
      headers: {
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '请求失败');
    return {
      data
    };
  },
  delete: async url => {
    const userId = localStorage.getItem('userId') || '2';
    const response = await fetch(API_BASE_URL + url, {
      method: 'DELETE',
      headers: {
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '请求失败');
    return {
      data
    };
  }
};
function RelationsPage({
  currentUser,
  onRefresh
}) {
  const [activeTab, setActiveTab] = useState('following');
  const [data, setData] = useState({
    list: [],
    total: 0
  });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('updated_at');
  const [showFriendRequestModal, setShowFriendRequestModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [friendMessage, setFriendMessage] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const tabs = [{
    key: 'following',
    label: '关注'
  }, {
    key: 'followers',
    label: '粉丝'
  }, {
    key: 'friends',
    label: '好友'
  }, {
    key: 'requests',
    label: '好友申请'
  }, {
    key: 'blacklist',
    label: '黑名单'
  }];
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint;
      switch (activeTab) {
        case 'following':
          endpoint = `/relations/following?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}`;
          break;
        case 'followers':
          endpoint = `/relations/followers?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}`;
          break;
        case 'friends':
          endpoint = `/relations/friends?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}`;
          break;
        case 'blacklist':
          endpoint = `/relations/blacklist?page=${page}&pageSize=${pageSize}`;
          break;
        case 'requests':
          endpoint = `/relations/friend-requests?page=${page}&pageSize=${pageSize}`;
          break;
        default:
          endpoint = `/relations/following?page=${page}&pageSize=${pageSize}`;
      }
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    }
    setLoading(false);
  }, [activeTab, page, pageSize, sortBy]);
  useEffect(() => {
    loadData();
  }, [loadData]);
  const handleFollow = async userId => {
    try {
      await api.post(`/relations/follow/${userId}`);
      alert('关注成功');
      loadData();
      onRefresh && onRefresh();
    } catch (err) {
      alert(err.message || '操作失败');
    }
  };
  const handleUnfollow = async userId => {
    if (!confirm('确定要取消关注吗？')) return;
    try {
      await api.delete(`/relations/unfollow/${userId}`);
      alert('已取消关注');
      loadData();
      onRefresh && onRefresh();
    } catch (err) {
      alert(err.message || '操作失败');
    }
  };
  const handleBlock = async (userId, reason) => {
    try {
      await api.post('/relations/block', {
        blocked_user_id: userId,
        reason
      });
      alert('已拉黑');
      loadData();
      onRefresh && onRefresh();
    } catch (err) {
      alert(err.message || '操作失败');
    }
  };
  const handleUnblock = async userId => {
    try {
      await api.delete(`/relations/unblock/${userId}`);
      alert('已解除拉黑');
      loadData();
      onRefresh && onRefresh();
    } catch (err) {
      alert(err.message || '操作失败');
    }
  };
  const handleSendFriendRequest = async (userId, message) => {
    try {
      await api.post('/relations/friend-request', {
        receiver_id: userId,
        message
      });
      alert('好友申请已发送');
      loadData();
    } catch (err) {
      alert(err.message || '操作失败');
    }
  };
  const handleAcceptFriend = async requestId => {
    try {
      await api.post(`/relations/friend-request/${requestId}/accept`);
      alert('已通过好友申请');
      loadData();
      onRefresh && onRefresh();
    } catch (err) {
      alert(err.message || '操作失败');
    }
  };
  const handleRejectFriend = async requestId => {
    try {
      await api.post(`/relations/friend-request/${requestId}/reject`);
      alert('已拒绝好友申请');
      loadData();
    } catch (err) {
      alert(err.message || '操作失败');
    }
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "\u6211\u7684\u5173\u7CFB\u6982\u89C8"), /*#__PURE__*/React.createElement("div", {
    className: "stats-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "value"
  }, currentUser?.following_count || 0), /*#__PURE__*/React.createElement("div", {
    className: "label"
  }, "\u5173\u6CE8")), /*#__PURE__*/React.createElement("div", {
    className: "stat-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "value"
  }, currentUser?.follower_count || 0), /*#__PURE__*/React.createElement("div", {
    className: "label"
  }, "\u7C89\u4E1D")), /*#__PURE__*/React.createElement("div", {
    className: "stat-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "value"
  }, currentUser?.friend_count || 0), /*#__PURE__*/React.createElement("div", {
    className: "label"
  }, "\u597D\u53CB")), /*#__PURE__*/React.createElement("div", {
    className: "stat-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "value"
  }, currentUser?.blacklist_count || 0), /*#__PURE__*/React.createElement("div", {
    className: "label"
  }, "\u9ED1\u540D\u5355")))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tabs"
  }, tabs.map(tab => /*#__PURE__*/React.createElement("button", {
    key: tab.key,
    className: `tab ${activeTab === tab.key ? 'active' : ''}`,
    onClick: () => {
      setActiveTab(tab.key);
      setPage(1);
    }
  }, tab.label))), activeTab !== 'blacklist' && activeTab !== 'requests' && /*#__PURE__*/React.createElement("div", {
    className: "filter-bar"
  }, /*#__PURE__*/React.createElement("span", null, "\u6392\u5E8F\uFF1A"), /*#__PURE__*/React.createElement("select", {
    value: sortBy,
    onChange: e => setSortBy(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "updated_at"
  }, "\u6309\u66F4\u65B0\u65F6\u95F4"), /*#__PURE__*/React.createElement("option", {
    value: "intimacy_score"
  }, "\u6309\u4EB2\u5BC6\u5EA6"))), loading ? /*#__PURE__*/React.createElement("div", {
    className: "loading"
  }, "\u52A0\u8F7D\u4E2D...") : data.list.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, "\u6682\u65E0\u6570\u636E") : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "user-list"
  }, data.list.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    className: "user-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "user-info"
  }, /*#__PURE__*/React.createElement("div", {
    className: "avatar"
  }, item.nickname?.[0] || '?'), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "user-name"
  }, item.nickname, item.is_mutual && /*#__PURE__*/React.createElement("span", {
    className: "mutual"
  }, " \u4E92\u76F8\u5173\u6CE8")), /*#__PURE__*/React.createElement("div", {
    className: "user-username"
  }, "@", item.username))), item.bio && /*#__PURE__*/React.createElement("div", {
    className: "user-bio"
  }, item.bio), activeTab !== 'requests' && /*#__PURE__*/React.createElement("div", {
    className: "user-stats"
  }, item.intimacy_score !== undefined && /*#__PURE__*/React.createElement("span", null, "\u4EB2\u5BC6\u5EA6: ", item.intimacy_score), item.common_following_count !== undefined && /*#__PURE__*/React.createElement("span", null, "\u5171\u540C\u5173\u6CE8: ", item.common_following_count), item.updated_at && /*#__PURE__*/React.createElement("span", null, "\u66F4\u65B0: ", new Date(item.updated_at).toLocaleDateString())), activeTab === 'requests' ? /*#__PURE__*/React.createElement("div", null, item.message && /*#__PURE__*/React.createElement("p", {
    style: {
      marginBottom: '12px',
      color: '#666'
    }
  }, "\u7533\u8BF7\u7559\u8A00: ", item.message), /*#__PURE__*/React.createElement("div", {
    className: "user-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => handleAcceptFriend(item.id)
  }, "\u901A\u8FC7"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: () => handleRejectFriend(item.id)
  }, "\u62D2\u7EDD"))) : activeTab === 'blacklist' ? /*#__PURE__*/React.createElement("div", {
    className: "user-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: () => handleUnblock(item.id)
  }, "\u89E3\u9664\u62C9\u9ED1")) : /*#__PURE__*/React.createElement("div", {
    className: "user-actions"
  }, activeTab === 'following' ? /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: () => handleUnfollow(item.id)
  }, "\u53D6\u6D88\u5173\u6CE8") : activeTab === 'followers' && !item.is_following ? /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => handleFollow(item.id)
  }, "\u56DE\u5173") : activeTab === 'friends' ? /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: () => handleUnfollow(item.id)
  }, "\u89E3\u9664\u597D\u53CB") : null, activeTab !== 'friends' && /*#__PURE__*/React.createElement("button", {
    className: "btn btn-danger",
    onClick: () => {
      setSelectedUserId(item.id);
      setShowBlockModal(true);
    }
  }, "\u62C9\u9ED1"), activeTab !== 'friends' && /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: () => {
      setSelectedUserId(item.id);
      setShowFriendRequestModal(true);
    }
  }, "\u7533\u8BF7\u597D\u53CB"))))), /*#__PURE__*/React.createElement("div", {
    className: "pagination"
  }, /*#__PURE__*/React.createElement("button", {
    disabled: page <= 1,
    onClick: () => setPage(page - 1)
  }, "\u4E0A\u4E00\u9875"), /*#__PURE__*/React.createElement("span", null, "\u7B2C ", page, " \u9875 / \u5171 ", Math.ceil(data.total / pageSize) || 1, " \u9875"), /*#__PURE__*/React.createElement("button", {
    disabled: page >= Math.ceil(data.total / pageSize),
    onClick: () => setPage(page + 1)
  }, "\u4E0B\u4E00\u9875")))), showFriendRequestModal && /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: () => setShowFriendRequestModal(false)
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("h3", null, "\u53D1\u9001\u597D\u53CB\u7533\u8BF7"), /*#__PURE__*/React.createElement("textarea", {
    placeholder: "\u8BF7\u8F93\u5165\u7559\u8A00\uFF08\u53EF\u9009\uFF09",
    value: friendMessage,
    onChange: e => setFriendMessage(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    className: "modal-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: () => setShowFriendRequestModal(false)
  }, "\u53D6\u6D88"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => {
      handleSendFriendRequest(selectedUserId, friendMessage);
      setShowFriendRequestModal(false);
      setFriendMessage('');
    }
  }, "\u53D1\u9001")))), showBlockModal && /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: () => setShowBlockModal(false)
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("h3", null, "\u62C9\u9ED1\u7528\u6237"), /*#__PURE__*/React.createElement("textarea", {
    placeholder: "\u8BF7\u8F93\u5165\u62C9\u9ED1\u539F\u56E0\uFF08\u53EF\u9009\uFF09",
    value: blockReason,
    onChange: e => setBlockReason(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    className: "modal-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: () => setShowBlockModal(false)
  }, "\u53D6\u6D88"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-danger",
    onClick: () => {
      handleBlock(selectedUserId, blockReason);
      setShowBlockModal(false);
      setBlockReason('');
    }
  }, "\u786E\u8BA4\u62C9\u9ED1")))));
}
function RecommendationsPage() {
  const [data, setData] = useState({
    list: [],
    total: 0
  });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/recommendations?page=${page}&pageSize=${pageSize}`);
      setData(res.data);
    } catch (err) {
      console.error('加载推荐失败:', err);
    }
    setLoading(false);
  }, [page, pageSize]);
  useEffect(() => {
    loadData();
  }, [loadData]);
  const handleFollow = async userId => {
    try {
      await api.post(`/relations/follow/${userId}`);
      alert('关注成功');
      loadData();
    } catch (err) {
      alert(err.message || '操作失败');
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "\u63A8\u8350\u5173\u6CE8"), loading ? /*#__PURE__*/React.createElement("div", {
    className: "loading"
  }, "\u52A0\u8F7D\u4E2D...") : data.list.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, "\u6682\u65E0\u63A8\u8350") : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "user-list"
  }, data.list.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    className: "user-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "user-info"
  }, /*#__PURE__*/React.createElement("div", {
    className: "avatar"
  }, item.nickname?.[0] || '?'), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "user-name"
  }, item.nickname), /*#__PURE__*/React.createElement("div", {
    className: "user-username"
  }, "@", item.username))), item.bio && /*#__PURE__*/React.createElement("div", {
    className: "user-bio"
  }, item.bio), item.reason && /*#__PURE__*/React.createElement("div", {
    className: "recommend-reason"
  }, "\u63A8\u8350\u539F\u56E0: ", item.reason), /*#__PURE__*/React.createElement("div", {
    className: "user-stats"
  }, item.score !== undefined && /*#__PURE__*/React.createElement("span", null, "\u63A8\u8350\u5206\u6570: ", item.score), item.location && /*#__PURE__*/React.createElement("span", null, "\u5730\u533A: ", item.location), item.mutual_interests && /*#__PURE__*/React.createElement("span", null, "\u5171\u540C\u5174\u8DA3: ", item.mutual_interests)), /*#__PURE__*/React.createElement("div", {
    className: "user-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => handleFollow(item.id)
  }, "\u5173\u6CE8"))))), /*#__PURE__*/React.createElement("div", {
    className: "pagination"
  }, /*#__PURE__*/React.createElement("button", {
    disabled: page <= 1,
    onClick: () => setPage(page - 1)
  }, "\u4E0A\u4E00\u9875"), /*#__PURE__*/React.createElement("span", null, "\u7B2C ", page, " \u9875 / \u5171 ", Math.ceil(data.total / pageSize) || 1, " \u9875"), /*#__PURE__*/React.createElement("button", {
    disabled: page >= Math.ceil(data.total / pageSize),
    onClick: () => setPage(page + 1)
  }, "\u4E0B\u4E00\u9875"))));
}
function ReportsPage() {
  const [activeTab, setActiveTab] = useState('queue');
  const [data, setData] = useState({
    list: [],
    total: 0
  });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const tabs = [{
    key: 'queue',
    label: '举报队列'
  }, {
    key: 'my',
    label: '我的举报'
  }];
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'queue' ? `/reports/queue?page=${page}&pageSize=${pageSize}` : `/reports/my?page=${page}&pageSize=${pageSize}`;
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err) {
      console.error('加载举报失败:', err);
      setData({
        list: [],
        total: 0
      });
    }
    setLoading(false);
  }, [activeTab, page, pageSize]);
  useEffect(() => {
    loadData();
  }, [loadData]);
  const handleProcess = async (reportId, action, note) => {
    try {
      await api.post(`/reports/${reportId}/process`, {
        action,
        note
      });
      alert('处理成功');
      loadData();
    } catch (err) {
      alert(err.message || '操作失败');
    }
  };
  const getStatusClass = status => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'processing':
        return 'status-processing';
      case 'resolved':
        return 'status-resolved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };
  const getStatusText = status => {
    switch (status) {
      case 'pending':
        return '待处理';
      case 'processing':
        return '处理中';
      case 'resolved':
        return '已解决';
      case 'rejected':
        return '已驳回';
      default:
        return '未知';
    }
  };
  const getTypeText = type => {
    const types = {
      spam: '垃圾广告',
      harassment: '骚扰',
      fake: '虚假账号',
      inappropriate: '不当内容',
      other: '其他'
    };
    return types[type] || type;
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "\u4E3E\u62A5\u7BA1\u7406"), /*#__PURE__*/React.createElement("div", {
    className: "tabs"
  }, tabs.map(tab => /*#__PURE__*/React.createElement("button", {
    key: tab.key,
    className: `tab ${activeTab === tab.key ? 'active' : ''}`,
    onClick: () => {
      setActiveTab(tab.key);
      setPage(1);
    }
  }, tab.label))), loading ? /*#__PURE__*/React.createElement("div", {
    className: "loading"
  }, "\u52A0\u8F7D\u4E2D...") : data.list.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, activeTab === 'queue' ? '暂无待处理举报' : '暂无举报记录') : /*#__PURE__*/React.createElement("div", null, data.list.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    className: "report-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "report-header"
  }, /*#__PURE__*/React.createElement("span", {
    className: "report-type"
  }, getTypeText(item.type)), /*#__PURE__*/React.createElement("span", {
    className: `report-status ${getStatusClass(item.status)}`
  }, getStatusText(item.status))), /*#__PURE__*/React.createElement("div", {
    className: "report-content"
  }, "\u4E3E\u62A5\u7528\u6237: @", item.reporter_username, " \u2192 \u88AB\u4E3E\u62A5\u7528\u6237: @", item.reported_username), item.description && /*#__PURE__*/React.createElement("div", {
    className: "report-content"
  }, "\u63CF\u8FF0: ", item.description), item.process_note && /*#__PURE__*/React.createElement("div", {
    className: "report-content",
    style: {
      color: '#1890ff'
    }
  }, "\u5904\u7406\u7ED3\u679C: ", item.process_note), /*#__PURE__*/React.createElement("div", {
    className: "report-meta"
  }, "\u4E3E\u62A5\u65F6\u95F4: ", new Date(item.created_at).toLocaleString(), item.updated_at && ` | 处理时间: ${new Date(item.updated_at).toLocaleString()}`), activeTab === 'queue' && item.status === 'pending' && /*#__PURE__*/React.createElement("div", {
    className: "user-actions",
    style: {
      marginTop: '12px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: () => handleProcess(item.id, 'resolve', '已处理')
  }, "\u901A\u8FC7"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: () => handleProcess(item.id, 'reject', '举报不成立')
  }, "\u9A73\u56DE")))), /*#__PURE__*/React.createElement("div", {
    className: "pagination"
  }, /*#__PURE__*/React.createElement("button", {
    disabled: page <= 1,
    onClick: () => setPage(page - 1)
  }, "\u4E0A\u4E00\u9875"), /*#__PURE__*/React.createElement("span", null, "\u7B2C ", page, " \u9875 / \u5171 ", Math.ceil(data.total / pageSize) || 1, " \u9875"), /*#__PURE__*/React.createElement("button", {
    disabled: page >= Math.ceil(data.total / pageSize),
    onClick: () => setPage(page + 1)
  }, "\u4E0B\u4E00\u9875"))));
}
function RiskPage() {
  const [activeTab, setActiveTab] = useState('records');
  const [data, setData] = useState({
    list: [],
    total: 0
  });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const tabs = [{
    key: 'records',
    label: '风控记录'
  }, {
    key: 'detection',
    label: '异常增长检测'
  }];
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'records' ? `/risk/records?page=${page}&pageSize=${pageSize}` : `/risk/anomaly-detection?page=${page}&pageSize=${pageSize}`;
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err) {
      console.error('加载风控数据失败:', err);
      setData({
        list: [],
        total: 0
      });
    }
    setLoading(false);
  }, [activeTab, page, pageSize]);
  useEffect(() => {
    loadData();
  }, [loadData]);
  const handleProcess = async (recordId, action, note) => {
    try {
      await api.post(`/risk/${recordId}/process`, {
        action,
        note
      });
      alert('处理成功');
      loadData();
    } catch (err) {
      alert(err.message || '操作失败');
    }
  };
  const getLevelClass = level => {
    switch (level) {
      case 'high':
        return 'risk-level-high';
      case 'medium':
        return 'risk-level-medium';
      case 'low':
        return 'risk-level-low';
      default:
        return '';
    }
  };
  const getLevelText = level => {
    switch (level) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '未知';
    }
  };
  const getTypeText = type => {
    const types = {
      mass_follow: '批量关注',
      multiple_reports: '多次被举报',
      abnormal_growth: '异常增长',
      suspicious_activity: '可疑行为',
      admin_warn: '管理员警告',
      admin_ban: '管理员封禁'
    };
    return types[type] || type;
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "\u98CE\u63A7\u4E2D\u5FC3"), /*#__PURE__*/React.createElement("div", {
    className: "tabs"
  }, tabs.map(tab => /*#__PURE__*/React.createElement("button", {
    key: tab.key,
    className: `tab ${activeTab === tab.key ? 'active' : ''}`,
    onClick: () => {
      setActiveTab(tab.key);
      setPage(1);
    }
  }, tab.label))), loading ? /*#__PURE__*/React.createElement("div", {
    className: "loading"
  }, "\u52A0\u8F7D\u4E2D...") : data.list.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, "\u6682\u65E0\u6570\u636E") : /*#__PURE__*/React.createElement("div", null, data.list.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    className: "risk-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "risk-header"
  }, /*#__PURE__*/React.createElement("span", {
    className: "risk-type"
  }, getTypeText(item.type)), /*#__PURE__*/React.createElement("span", {
    className: getLevelClass(item.risk_level || (item.severity === 3 ? 'high' : item.severity === 2 ? 'medium' : 'low'))
  }, "\u98CE\u9669\u7B49\u7EA7: ", getLevelText(item.risk_level || (item.severity === 3 ? 'high' : item.severity === 2 ? 'medium' : 'low')))), /*#__PURE__*/React.createElement("div", {
    className: "risk-content"
  }, "\u7528\u6237: @", item.username, " (", item.nickname, ")"), item.description && /*#__PURE__*/React.createElement("div", {
    className: "risk-content"
  }, "\u63CF\u8FF0: ", item.description), item.process_note && /*#__PURE__*/React.createElement("div", {
    className: "risk-content",
    style: {
      color: '#1890ff'
    }
  }, "\u5904\u7406\u7ED3\u679C: ", item.process_note), /*#__PURE__*/React.createElement("div", {
    className: "risk-meta"
  }, "\u521B\u5EFA\u65F6\u95F4: ", new Date(item.created_at).toLocaleString(), item.processed_at && ` | 处理时间: ${new Date(item.processed_at).toLocaleString()}`), item.status === 'pending' && /*#__PURE__*/React.createElement("div", {
    className: "user-actions",
    style: {
      marginTop: '12px'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-danger",
    onClick: () => handleProcess(item.id, 'ban', '封禁账号')
  }, "\u5C01\u7981"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: () => handleProcess(item.id, 'limit', '限制操作')
  }, "\u9650\u6D41"), /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: () => handleProcess(item.id, 'ignore', '忽略')
  }, "\u5FFD\u7565")))), /*#__PURE__*/React.createElement("div", {
    className: "pagination"
  }, /*#__PURE__*/React.createElement("button", {
    disabled: page <= 1,
    onClick: () => setPage(page - 1)
  }, "\u4E0A\u4E00\u9875"), /*#__PURE__*/React.createElement("span", null, "\u7B2C ", page, " \u9875 / \u5171 ", Math.ceil(data.total / pageSize) || 1, " \u9875"), /*#__PURE__*/React.createElement("button", {
    disabled: page >= Math.ceil(data.total / pageSize),
    onClick: () => setPage(page + 1)
  }, "\u4E0B\u4E00\u9875"))));
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
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (params.length > 0) url += '?' + params.join('&');
      const res = await api.get(url);
      setStats(res.data);
    } catch (err) {
      console.error('加载统计数据失败:', err);
      setStats(null);
    }
    setLoading(false);
  }, [startDate, endDate]);
  useEffect(() => {
    loadStats();
  }, [loadStats]);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("h3", null, "\u8FD0\u8425\u770B\u677F"), /*#__PURE__*/React.createElement("div", {
    className: "filters"
  }, /*#__PURE__*/React.createElement("span", null, "\u5F00\u59CB\u65E5\u671F:"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: startDate,
    onChange: e => setStartDate(e.target.value)
  }), /*#__PURE__*/React.createElement("span", null, "\u7ED3\u675F\u65E5\u671F:"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: endDate,
    onChange: e => setEndDate(e.target.value)
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: loadStats
  }, "\u67E5\u8BE2"))), loading ? /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "loading"
  }, "\u52A0\u8F7D\u4E2D...")) : stats ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "dashboard-stats"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dashboard-stat-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "label"
  }, "\u65B0\u589E\u5173\u6CE8"), /*#__PURE__*/React.createElement("div", {
    className: "value"
  }, stats.new_follows || stats.new_relations || 0)), /*#__PURE__*/React.createElement("div", {
    className: "dashboard-stat-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "label"
  }, "\u65B0\u589E\u7C89\u4E1D"), /*#__PURE__*/React.createElement("div", {
    className: "value"
  }, stats.new_followers || 0)), /*#__PURE__*/React.createElement("div", {
    className: "dashboard-stat-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "label"
  }, "\u65B0\u589E\u597D\u53CB"), /*#__PURE__*/React.createElement("div", {
    className: "value"
  }, stats.new_friends || stats.new_friendships || 0)), /*#__PURE__*/React.createElement("div", {
    className: "dashboard-stat-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "label"
  }, "\u4E92\u5173\u7387"), /*#__PURE__*/React.createElement("div", {
    className: "value"
  }, stats.mutual_follow_rate || stats.mutual_rate || 0, "%")), /*#__PURE__*/React.createElement("div", {
    className: "dashboard-stat-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "label"
  }, "\u53D6\u5173\u7387"), /*#__PURE__*/React.createElement("div", {
    className: "value"
  }, stats.unfollow_rate || 0, "%")), /*#__PURE__*/React.createElement("div", {
    className: "dashboard-stat-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "label"
  }, "\u63A8\u8350\u8F6C\u5316\u7387"), /*#__PURE__*/React.createElement("div", {
    className: "value"
  }, stats.recommendation_conversion || stats.follow_conversion_rate || 0, "%")), /*#__PURE__*/React.createElement("div", {
    className: "dashboard-stat-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "label"
  }, "\u4E3E\u62A5\u7387"), /*#__PURE__*/React.createElement("div", {
    className: "value"
  }, stats.report_rate || 0, "%")), /*#__PURE__*/React.createElement("div", {
    className: "dashboard-stat-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "label"
  }, "\u4E3E\u62A5\u5904\u7406\u7387"), /*#__PURE__*/React.createElement("div", {
    className: "value"
  }, stats.report_resolution_rate || 0, "%"))), stats.trends && stats.trends.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "chart-container"
  }, /*#__PURE__*/React.createElement("h3", null, "\u8D8B\u52BF\u6570\u636E"), /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '8px',
      borderBottom: '1px solid #e8e8e8',
      textAlign: 'left'
    }
  }, "\u65E5\u671F"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '8px',
      borderBottom: '1px solid #e8e8e8',
      textAlign: 'left'
    }
  }, "\u65B0\u589E\u5173\u6CE8"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '8px',
      borderBottom: '1px solid #e8e8e8',
      textAlign: 'left'
    }
  }, "\u65B0\u589E\u7C89\u4E1D"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '8px',
      borderBottom: '1px solid #e8e8e8',
      textAlign: 'left'
    }
  }, "\u4E92\u5173\u7387"), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: '8px',
      borderBottom: '1px solid #e8e8e8',
      textAlign: 'left'
    }
  }, "\u53D6\u5173\u7387"))), /*#__PURE__*/React.createElement("tbody", null, stats.trends.map((item, idx) => /*#__PURE__*/React.createElement("tr", {
    key: idx
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '8px',
      borderBottom: '1px solid #e8e8e8'
    }
  }, item.date), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '8px',
      borderBottom: '1px solid #e8e8e8'
    }
  }, item.new_follows), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '8px',
      borderBottom: '1px solid #e8e8e8'
    }
  }, item.new_followers), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '8px',
      borderBottom: '1px solid #e8e8e8'
    }
  }, item.mutual_follow_rate, "%"), /*#__PURE__*/React.createElement("td", {
    style: {
      padding: '8px',
      borderBottom: '1px solid #e8e8e8'
    }
  }, item.unfollow_rate, "%"))))))), stats.top_users && stats.top_users.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "chart-container"
  }, /*#__PURE__*/React.createElement("h3", null, "\u70ED\u95E8\u7528\u6237"), /*#__PURE__*/React.createElement("div", {
    className: "user-list"
  }, stats.top_users.map((user, idx) => /*#__PURE__*/React.createElement("div", {
    key: user.id,
    className: "user-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "user-info"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      background: '#1890ff',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '8px',
      fontWeight: 'bold'
    }
  }, idx + 1), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "user-name"
  }, user.nickname), /*#__PURE__*/React.createElement("div", {
    className: "user-username"
  }, "@", user.username))), /*#__PURE__*/React.createElement("div", {
    className: "user-stats"
  }, /*#__PURE__*/React.createElement("span", null, "\u7C89\u4E1D: ", user.follower_count), /*#__PURE__*/React.createElement("span", null, "\u5173\u6CE8: ", user.following_count))))))) : /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, "\u6682\u65E0\u6570\u636E")));
}
function App() {
  const [currentPage, setCurrentPage] = useState('relations');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState('2');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navItems = [{
    key: 'relations',
    label: '关系管理'
  }, {
    key: 'recommendations',
    label: '推荐'
  }, {
    key: 'reports',
    label: '举报'
  }, {
    key: 'risk',
    label: '风控中心'
  }, {
    key: 'dashboard',
    label: '运营看板'
  }];
  useEffect(() => {
    const savedUserId = localStorage.getItem('userId') || '2';
    localStorage.setItem('userId', savedUserId);
    setCurrentUserId(savedUserId);
    loadUsers(savedUserId);
  }, []);
  const loadUsers = async selectedUserId => {
    setLoading(true);
    try {
      const res = await api.get('/users/list?pageSize=100');
      setUsers(res.data.list || []);
      const userRes = await api.get(`/users/${selectedUserId}`);
      setCurrentUser(userRes.data);
    } catch (err) {
      console.error('加载用户失败:', err);
    }
    setLoading(false);
  };
  const handleUserChange = async e => {
    const userId = e.target.value;
    localStorage.setItem('userId', userId);
    setCurrentUserId(userId);
    setLoading(true);
    try {
      const res = await api.get(`/users/${userId}`);
      setCurrentUser(res.data);
    } catch (err) {
      console.error('切换用户失败:', err);
    }
    setLoading(false);
  };
  const refreshCurrentUser = async () => {
    try {
      const res = await api.get(`/users/${currentUserId}`);
      setCurrentUser(res.data);
    } catch (err) {
      console.error('刷新用户数据失败:', err);
    }
  };
  const renderPage = () => {
    switch (currentPage) {
      case 'relations':
        return /*#__PURE__*/React.createElement(RelationsPage, {
          key: currentUserId,
          currentUser: currentUser,
          onRefresh: refreshCurrentUser
        });
      case 'recommendations':
        return /*#__PURE__*/React.createElement(RecommendationsPage, {
          key: currentUserId
        });
      case 'reports':
        return /*#__PURE__*/React.createElement(ReportsPage, {
          key: currentUserId
        });
      case 'risk':
        return /*#__PURE__*/React.createElement(RiskPage, {
          key: currentUserId
        });
      case 'dashboard':
        return /*#__PURE__*/React.createElement(DashboardPage, {
          key: currentUserId
        });
      default:
        return /*#__PURE__*/React.createElement(RelationsPage, {
          key: currentUserId,
          currentUser: currentUser,
          onRefresh: refreshCurrentUser
        });
    }
  };
  if (loading) {
    return /*#__PURE__*/React.createElement("div", {
      className: "app"
    }, /*#__PURE__*/React.createElement("main", {
      className: "main"
    }, /*#__PURE__*/React.createElement("div", {
      className: "card",
      style: {
        textAlign: 'center',
        padding: '40px'
      }
    }, "\u52A0\u8F7D\u4E2D...")));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, /*#__PURE__*/React.createElement("aside", {
    className: "sidebar"
  }, /*#__PURE__*/React.createElement("h2", null, "\u793E\u4EA4\u5173\u7CFB\u94FE"), /*#__PURE__*/React.createElement("nav", null, navItems.map(item => /*#__PURE__*/React.createElement("a", {
    key: item.key,
    className: currentPage === item.key ? 'active' : '',
    onClick: () => setCurrentPage(item.key)
  }, item.label)))), /*#__PURE__*/React.createElement("main", {
    className: "main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "header"
  }, /*#__PURE__*/React.createElement("h1", null, "\u793E\u4EA4\u5173\u7CFB\u94FE\u670D\u52A1"), /*#__PURE__*/React.createElement("div", {
    className: "user-select"
  }, /*#__PURE__*/React.createElement("span", null, "\u5F53\u524D\u7528\u6237\uFF1A"), /*#__PURE__*/React.createElement("select", {
    value: currentUser?.id || currentUserId,
    onChange: handleUserChange
  }, users.map(user => /*#__PURE__*/React.createElement("option", {
    key: user.id,
    value: user.id
  }, user.nickname, " (@", user.username, ")"))))), renderPage()));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));