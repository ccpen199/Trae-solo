import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mergeRequestAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
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
    pending_review: { bg: '#fff3cd', text: '#856404' },
    in_review: { bg: '#cce5ff', text: '#004085' },
    approved: { bg: '#d4edda', text: '#155724' },
    merged: { bg: '#d4edda', text: '#155724' },
    closed: { bg: '#e2e3e5', text: '#383d41' },
    changes_requested: { bg: '#f8d7da', text: '#721c24' },
  };
  return colors[status] || { bg: '#e2e3e5', text: '#383d41' };
};

const getStatusLabel = (status) => {
  const labels = {
    pending_review: '待审查',
    in_review: '审查中',
    approved: '已批准',
    merged: '已合并',
    closed: '已关闭',
    changes_requested: '请求修改',
  };
  return labels[status] || status;
};

const MergeRequests = () => {
  const [mergeRequests, setMergeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchMergeRequests = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filterStatus) {
        params.status = filterStatus;
      }
      const response = await mergeRequestAPI.getAll(params);
      setMergeRequests(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch merge requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMergeRequests();
  }, [filterStatus, page]);

  const handleRowClick = (id) => {
    navigate(`/merge-requests/${id}`);
  };

  if (loading && mergeRequests.length === 0) {
    return <div>加载中...</div>;
  }

  return (
    <div style={styles.container}>
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
          <option value="pending_review">待审查</option>
          <option value="in_review">审查中</option>
          <option value="changes_requested">请求修改</option>
          <option value="approved">已批准</option>
          <option value="merged">已合并</option>
          <option value="closed">已关闭</option>
        </select>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>标题</th>
            <th style={styles.th}>主单号</th>
            <th style={styles.th}>仓库</th>
            <th style={styles.th}>分支</th>
            <th style={styles.th}>作者</th>
            <th style={styles.th}>审查者</th>
            <th style={styles.th}>状态</th>
          </tr>
        </thead>
        <tbody>
          {mergeRequests.map((mr) => (
            <tr
              key={mr.id}
              style={styles.trHover}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
              onClick={() => handleRowClick(mr.id)}
            >
              <td style={styles.td}>
                <div style={{ fontWeight: '500' }}>{mr.title}</div>
                {mr.description && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {mr.description}
                  </div>
                )}
              </td>
              <td style={styles.td}>{mr.main_order_no}</td>
              <td style={styles.td}>{mr.repository_name}</td>
              <td style={styles.td}>
                <span style={{ color: '#666' }}>{mr.source_branch_name}</span>
                <span style={{ margin: '0 8px', color: '#999' }}>→</span>
                <span style={{ color: '#666' }}>{mr.target_branch_name}</span>
              </td>
              <td style={styles.td}>{mr.author_name}</td>
              <td style={styles.td}>{mr.reviewer_name || '-'}</td>
              <td style={styles.td}>
                <span style={styles.statusBadge(mr.status)}>
                  {getStatusLabel(mr.status)}
                </span>
                {mr.is_locked && (
                  <span style={{ marginLeft: '8px', fontSize: '12px' }}>🔒</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {mergeRequests.length === 0 && (
        <div style={styles.empty}>
          暂无合并请求
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
    </div>
  );
};

export default MergeRequests;
