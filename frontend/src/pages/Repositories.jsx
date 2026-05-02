import React, { useState, useEffect } from 'react';
import { repositoryAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
  },
  createButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterInput: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'white',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    fontWeight: '600',
    fontSize: '13px',
    color: '#666',
    borderBottom: '1px solid #e5e5e5',
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid #e5e5e5',
    fontSize: '14px',
    color: '#333',
  },
  trHover: {
    cursor: 'pointer',
  },
  statusBadge: (status) => ({
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: getStatusColor(status).bg,
    color: getStatusColor(status).text,
  }),
  actionButton: {
    padding: '6px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    marginRight: '8px',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#333',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#555',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    minHeight: '80px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  },
  cancelButton: {
    padding: '10px 20px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    marginTop: '20px',
  },
  pageButton: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  pageInfo: {
    fontSize: '14px',
    color: '#666',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
};

const getStatusColor = (status) => {
  const colors = {
    pending_create: { bg: '#fff3cd', text: '#856404' },
    active: { bg: '#d4edda', text: '#155724' },
    archived: { bg: '#e2e3e5', text: '#383d41' },
    rejected: { bg: '#f8d7da', text: '#721c24' },
  };
  return colors[status] || { bg: '#e2e3e5', text: '#383d41' };
};

const getStatusLabel = (status) => {
  const labels = {
    pending_create: '待创建',
    active: '活跃',
    archived: '已归档',
    rejected: '已拒绝',
  };
  return labels[status] || status;
};

const Repositories = () => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    expected_finish_time: '',
    is_public: false,
  });
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const fetchRepositories = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filterStatus) {
        params.status = filterStatus;
      }
      const response = await repositoryAPI.getAll(params);
      setRepositories(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, [filterStatus, page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await repositoryAPI.create(formData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        expected_finish_time: '',
        is_public: false,
      });
      fetchRepositories();
    } catch (error) {
      alert(error.response?.data?.error || '创建失败');
    }
  };

  const handleRowClick = (id) => {
    navigate(`/repositories/${id}`);
  };

  const handleAction = async (e, id, action, comment) => {
    e.stopPropagation();
    try {
      await repositoryAPI.executeAction(id, action, comment);
      fetchRepositories();
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
    }
  };

  if (loading && repositories.length === 0) {
    return <div>加载中...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.filters}>
          <select
            style={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">全部状态</option>
            <option value="pending_create">待创建</option>
            <option value="active">活跃</option>
            <option value="archived">已归档</option>
            <option value="rejected">已拒绝</option>
          </select>
        </div>
        {hasPermission(['developer', 'admin']) && (
          <button
            style={styles.createButton}
            onClick={() => setShowCreateModal(true)}
          >
            + 创建仓库
          </button>
        )}
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>仓库名称</th>
            <th style={styles.th}>主单号</th>
            <th style={styles.th}>所有者</th>
            <th style={styles.th}>状态</th>
            <th style={styles.th}>分支数</th>
            <th style={styles.th}>待审MR</th>
            <th style={styles.th}>操作</th>
          </tr>
        </thead>
        <tbody>
          {repositories.map((repo) => (
            <tr
              key={repo.id}
              style={styles.trHover}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
              onClick={() => handleRowClick(repo.id)}
            >
              <td style={styles.td}>
                <div style={{ fontWeight: '500' }}>
                  {repo.is_public ? '🌐' : '🔒'} {repo.name}
                </div>
                {repo.description && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {repo.description}
                  </div>
                )}
              </td>
              <td style={styles.td}>{repo.main_order_no}</td>
              <td style={styles.td}>{repo.owner_name}</td>
              <td style={styles.td}>
                <span style={styles.statusBadge(repo.status)}>
                  {getStatusLabel(repo.status)}
                </span>
              </td>
              <td style={styles.td}>{repo.branch_count || 0}</td>
              <td style={styles.td}>{repo.pending_mr_count || 0}</td>
              <td style={styles.td}>
                {repo.status === 'pending_create' && hasPermission(['admin', 'devops']) && (
                  <>
                    <button
                      style={{ ...styles.actionButton, borderColor: '#28a745', color: '#28a745' }}
                      onClick={(e) => handleAction(e, repo.id, 'approve')}
                    >
                      审批
                    </button>
                    <button
                      style={{ ...styles.actionButton, borderColor: '#dc3545', color: '#dc3545' }}
                      onClick={(e) => handleAction(e, repo.id, 'reject')}
                    >
                      驳回
                    </button>
                  </>
                )}
                {repo.status === 'active' && (
                  <button style={styles.actionButton}>查看详情</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {repositories.length === 0 && (
        <div style={styles.empty}>
          暂无仓库数据
          {hasPermission(['developer', 'admin']) && (
            <div style={{ marginTop: '12px' }}>
              <button
                style={styles.createButton}
                onClick={() => setShowCreateModal(true)}
              >
                创建第一个仓库
              </button>
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={styles.pageButton}
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </button>
          <span style={styles.pageInfo}>
            第 {page} 页 / 共 {totalPages} 页
          </span>
          <button
            style={styles.pageButton}
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </button>
        </div>
      )}

      {showCreateModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>创建仓库</h2>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>仓库名称 *</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入仓库名称"
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>描述</label>
                <textarea
                  style={styles.textarea}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入仓库描述"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>期望完成时间</label>
                <input
                  style={styles.input}
                  type="date"
                  value={formData.expected_finish_time}
                  onChange={(e) => setFormData({ ...formData, expected_finish_time: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  />
                  {' '}公开仓库
                </label>
              </div>
              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowCreateModal(false)}
                >
                  取消
                </button>
                <button type="submit" style={styles.submitButton}>
                  提交申请
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Repositories;
