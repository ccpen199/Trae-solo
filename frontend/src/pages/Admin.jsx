import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import useUserStore from '../store/userStore';
import { moderatorAPI } from '../utils/api';

const styles = {
  container: {
    display: 'grid',
    gridTemplateColumns: '220px 1fr',
    gap: '20px',
    minHeight: '600px'
  },
  sidebar: {
    background: 'white',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    height: 'fit-content'
  },
  main: {
    background: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  sidebarTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#666',
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f0f0f0'
  },
  menuItem: {
    padding: '10px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '4px',
    fontSize: '14px',
    color: '#666',
    transition: 'all 0.2s'
  },
  menuItemActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  },
  menuLink: {
    textDecoration: 'none',
    display: 'block'
  },
  pageTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '24px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f0f0f0'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '32px'
  },
  statCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '8px',
    padding: '20px',
    color: 'white'
  },
  statCardAlt1: {
    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
  },
  statCardAlt2: {
    background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)'
  },
  statCardAlt3: {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  statLabel: {
    fontSize: '14px',
    opacity: 0.9
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    background: '#fafafa',
    fontWeight: '600'
  },
  tableCell: {
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
    textAlign: 'left',
    fontSize: '14px',
    color: '#333'
  },
  btn: {
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    fontSize: '13px',
    cursor: 'pointer',
    marginRight: '8px'
  },
  btnPrimary: {
    background: '#e6f7ff',
    color: '#1890ff'
  },
  btnDanger: {
    background: '#fff0f0',
    color: '#ff4d4f'
  },
  btnSuccess: {
    background: '#f6ffed',
    color: '#52c41a'
  },
  btnWarning: {
    background: '#fffbe6',
    color: '#faad14'
  },
  statusTag: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  statusActive: {
    background: '#f6ffed',
    color: '#52c41a'
  },
  statusBanned: {
    background: '#fff0f0',
    color: '#ff4d4f'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    padding: '20px 0'
  },
  pageBtn: {
    padding: '8px 14px',
    background: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#666',
    cursor: 'pointer'
  },
  pageBtnActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderColor: 'transparent'
  },
  pageBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  searchBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    alignItems: 'center'
  },
  searchInput: {
    padding: '10px 16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    width: '200px'
  },
  select: {
    padding: '10px 16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    background: 'white'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999',
    fontSize: '14px'
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  roleTag: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    marginLeft: '8px'
  },
  roleAdmin: {
    background: '#fff0f0',
    color: '#ff4d4f'
  },
  roleModerator: {
    background: '#e6f7ff',
    color: '#1890ff'
  },
  roleUser: {
    background: '#f5f5f5',
    color: '#666'
  },
  logDetail: {
    fontSize: '13px',
    color: '#666',
    wordBreak: 'break-all'
  },
  logType: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    background: '#f0f0f0',
    color: '#666'
  }
};

function Admin() {
  const { isAdmin } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname.replace('/admin', '') || '/';

  const menuItems = [
    { path: '/', label: '数据统计', icon: '📊' },
    { path: '/users', label: '用户管理', icon: '👥' },
    { path: '/logs', label: '操作日志', icon: '📝' }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarTitle}>管理后台</div>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={`/admin${item.path === '/' ? '' : item.path}`}
            style={styles.menuLink}
          >
            <div
              style={{
                ...styles.menuItem,
                ...(currentPath === item.path ? styles.menuItemActive : {})
              }}
            >
              {item.icon} {item.label}
            </div>
          </Link>
        ))}
      </div>

      <div style={styles.main}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/logs" element={<OperationLogs />} />
        </Routes>
      </div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await moderatorAPI.getStats();
      setStats(response.data.data);
    } catch (err) {
      console.error('加载统计数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>;
  }

  return (
    <div>
      <div style={styles.pageTitle}>📊 数据统计</div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats?.users?.totalUsers || 0}</div>
          <div style={styles.statLabel}>总用户数</div>
          <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
            活跃: {stats?.users?.activeUsers || 0} | 封禁: {stats?.users?.bannedUsers || 0}
          </div>
        </div>

        <div style={{ ...styles.statCard, ...styles.statCardAlt1 }}>
          <div style={styles.statNumber}>{stats?.topics?.totalTopics || 0}</div>
          <div style={styles.statLabel}>总主题数</div>
          <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
            置顶: {stats?.topics?.topTopics || 0} | 精华: {stats?.topics?.highlightTopics || 0}
          </div>
        </div>

        <div style={{ ...styles.statCard, ...styles.statCardAlt2 }}>
          <div style={styles.statNumber}>{stats?.replies?.totalReplies || 0}</div>
          <div style={styles.statLabel}>总回复数</div>
        </div>

        <div style={{ ...styles.statCard, ...styles.statCardAlt3 }}>
          <div style={styles.statNumber}>{stats?.boards?.totalBoards || 0}</div>
          <div style={styles.statLabel}>版块总数</div>
          <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
            版块主题数: {stats?.boards?.totalTopicCount || 0}
          </div>
        </div>
      </div>

      <div style={{ padding: '40px', background: '#fafafa', borderRadius: '8px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏛️</div>
        <div style={{ fontSize: '16px', color: '#333', fontWeight: 'bold', marginBottom: '8px' }}>
          论坛系统管理后台
        </div>
        <div style={{ fontSize: '13px', color: '#999' }}>
          项目端口: 后端 12175, 前端 22175
        </div>
      </div>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadUsers();
  }, [pagination.page, statusFilter]);

  const loadUsers = async () => {
    try {
      const response = await moderatorAPI.getUsers({
        page: pagination.page,
        pageSize: pagination.pageSize,
        keyword: searchKeyword || undefined,
        status: statusFilter || undefined
      });
      setUsers(response.data.data.users || []);
      setPagination(response.data.data.pagination);
    } catch (err) {
      console.error('加载用户列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(p => ({ ...p, page: 1 }));
    loadUsers();
  };

  const handleBan = async (user, reason = '违规操作') => {
    if (!confirm(`确定要封禁用户 "${user.username}" 吗？`)) return;
    try {
      await moderatorAPI.banUser(user.id, reason);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  const handleUnban = async (user) => {
    if (!confirm(`确定要解封用户 "${user.username}" 吗？`)) return;
    try {
      await moderatorAPI.unbanUser(user.id);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  const getRoleStyle = (roleName) => {
    switch (roleName) {
      case 'admin':
        return styles.roleAdmin;
      case 'moderator':
        return styles.roleModerator;
      default:
        return styles.roleUser;
    }
  };

  const getRoleDisplay = (roleName) => {
    const map = {
      admin: '管理员',
      moderator: '版主',
      user: '用户',
      guest: '游客'
    };
    return map[roleName] || roleName;
  };

  if (loading && users.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>;
  }

  return (
    <div>
      <div style={styles.pageTitle}>👥 用户管理</div>

      <div style={styles.searchBar}>
        <input
          type="text"
          style={styles.searchInput}
          placeholder="搜索用户名/昵称/邮箱"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <select
          style={styles.select}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="banned">已封禁</option>
        </select>
        <button
          style={{ ...styles.btn, ...styles.btnPrimary }}
          onClick={handleSearch}
        >
          搜索
        </button>
      </div>

      <table style={styles.table}>
        <thead style={styles.tableHeader}>
          <tr>
            <th style={styles.tableCell}>用户</th>
            <th style={styles.tableCell}>角色</th>
            <th style={styles.tableCell}>状态</th>
            <th style={styles.tableCell}>注册时间</th>
            <th style={styles.tableCell}>最后登录</th>
            <th style={styles.tableCell}>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={styles.tableCell}>
                <div style={styles.userCell}>
                  <div style={styles.avatar}>
                    {user.nickname?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '500' }}>
                      {user.nickname || user.username}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      @{user.username}
                    </div>
                  </div>
                </div>
              </td>
              <td style={styles.tableCell}>
                <span style={{ ...styles.roleTag, ...getRoleStyle(user.role?.name) }}>
                  {getRoleDisplay(user.role?.name)}
                </span>
              </td>
              <td style={styles.tableCell}>
                <span style={{
                  ...styles.statusTag,
                  ...(user.status === 'banned' ? styles.statusBanned : styles.statusActive)
                }}>
                  {user.status === 'banned' ? '已封禁' : '正常'}
                </span>
              </td>
              <td style={styles.tableCell}>
                {dayjs(user.createdAt).format('YYYY-MM-DD')}
              </td>
              <td style={styles.tableCell}>
                {user.lastLoginAt ? dayjs(user.lastLoginAt).format('YYYY-MM-DD HH:mm') : '-'}
              </td>
              <td style={styles.tableCell}>
                {user.status === 'banned' ? (
                  <button
                    style={{ ...styles.btn, ...styles.btnSuccess }}
                    onClick={() => handleUnban(user)}
                  >
                    解封
                  </button>
                ) : (
                  <button
                    style={{ ...styles.btn, ...styles.btnDanger }}
                    onClick={() => handleBan(user)}
                  >
                    封禁
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <div style={styles.emptyState}>暂无用户数据</div>
      )}

      {pagination.totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={{
              ...styles.pageBtn,
              ...(pagination.page <= 1 ? styles.pageBtnDisabled : {})
            }}
            onClick={() => pagination.page > 1 && setPagination(p => ({ ...p, page: p.page - 1 }))}
            disabled={pagination.page <= 1}
          >
            上一页
          </button>
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            let page = i + 1;
            if (pagination.totalPages > 5 && pagination.page > 3) {
              page = pagination.page - 2 + i;
              if (page > pagination.totalPages) page = pagination.totalPages - (4 - i);
            }
            return (
              <button
                key={page}
                style={{
                  ...styles.pageBtn,
                  ...(page === pagination.page ? styles.pageBtnActive : {})
                }}
                onClick={() => setPagination(p => ({ ...p, page }))}
              >
                {page}
              </button>
            );
          })}
          <button
            style={{
              ...styles.pageBtn,
              ...(pagination.page >= pagination.totalPages ? styles.pageBtnDisabled : {})
            }}
            onClick={() => pagination.page < pagination.totalPages && setPagination(p => ({ ...p, page: p.page + 1 }))}
            disabled={pagination.page >= pagination.totalPages}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}

function OperationLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [pagination.page]);

  const loadLogs = async () => {
    try {
      const response = await moderatorAPI.getLogs({
        page: pagination.page,
        pageSize: pagination.pageSize
      });
      setLogs(response.data.data.logs || []);
      setPagination(response.data.data.pagination);
    } catch (err) {
      console.error('加载操作日志失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const getOperationDisplay = (type) => {
    const map = {
      login: '用户登录',
      logout: '退出登录',
      register: '用户注册',
      create_topic: '发布主题',
      create_reply: '发表回复',
      lock_topic: '锁定主题',
      unlock_topic: '解锁主题',
      top_topic: '置顶主题',
      untop_topic: '取消置顶',
      highlight_topic: '加精主题',
      unhighlight_topic: '取消加精',
      ban_user: '封禁用户',
      unban_user: '解封用户',
      update_user_role: '更新角色'
    };
    return map[type] || type;
  };

  if (loading && logs.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>;
  }

  return (
    <div>
      <div style={styles.pageTitle}>📝 操作日志</div>

      <table style={styles.table}>
        <thead style={styles.tableHeader}>
          <tr>
            <th style={styles.tableCell}>操作类型</th>
            <th style={styles.tableCell}>操作者</th>
            <th style={styles.tableCell}>目标</th>
            <th style={styles.tableCell}>详情</th>
            <th style={styles.tableCell}>时间</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td style={styles.tableCell}>
                <span style={styles.logType}>
                  {getOperationDisplay(log.operationType)}
                </span>
              </td>
              <td style={styles.tableCell}>
                {log.user?.nickname || log.user?.username || '-'}
              </td>
              <td style={styles.tableCell}>
                {log.targetName || log.targetType || '-'}
              </td>
              <td style={styles.tableCell}>
                {log.detail ? (
                  <div style={styles.logDetail}>
                    {typeof log.detail === 'object' ? JSON.stringify(log.detail) : log.detail}
                  </div>
                ) : (
                  '-'
                )}
              </td>
              <td style={styles.tableCell}>
                {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {logs.length === 0 && (
        <div style={styles.emptyState}>暂无操作日志</div>
      )}

      {pagination.totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={{
              ...styles.pageBtn,
              ...(pagination.page <= 1 ? styles.pageBtnDisabled : {})
            }}
            onClick={() => pagination.page > 1 && setPagination(p => ({ ...p, page: p.page - 1 }))}
            disabled={pagination.page <= 1}
          >
            上一页
          </button>
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            let page = i + 1;
            if (pagination.totalPages > 5 && pagination.page > 3) {
              page = pagination.page - 2 + i;
              if (page > pagination.totalPages) page = pagination.totalPages - (4 - i);
            }
            return (
              <button
                key={page}
                style={{
                  ...styles.pageBtn,
                  ...(page === pagination.page ? styles.pageBtnActive : {})
                }}
                onClick={() => setPagination(p => ({ ...p, page }))}
              >
                {page}
              </button>
            );
          })}
          <button
            style={{
              ...styles.pageBtn,
              ...(pagination.page >= pagination.totalPages ? styles.pageBtnDisabled : {})
            }}
            onClick={() => pagination.page < pagination.totalPages && setPagination(p => ({ ...p, page: p.page + 1 }))}
            disabled={pagination.page >= pagination.totalPages}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}

export default Admin;
