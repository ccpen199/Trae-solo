import React, { useState, useEffect } from 'react';
import { pipelineAPI } from '../services/api';
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
  actionButton: {
    padding: '6px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    marginRight: '8px',
  },
  actionButtonPrimary: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#007bff',
    color: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    marginRight: '8px',
  },
  actionButtonDanger: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#dc3545',
    color: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    marginRight: '8px',
  },
  actionButtonSuccess: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#28a745',
    color: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    marginRight: '8px',
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
    maxWidth: '450px',
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
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'white',
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
};

const getStatusColor = (status) => {
  const colors = {
    pending: { bg: '#fff3cd', text: '#856404' },
    running: { bg: '#cce5ff', text: '#004085' },
    success: { bg: '#d4edda', text: '#155724' },
    failed: { bg: '#f8d7da', text: '#721c24' },
    rolled_back: { bg: '#e2e3e5', text: '#383d41' },
  };
  return colors[status] || { bg: '#e2e3e5', text: '#383d41' };
};

const getStatusLabel = (status) => {
  const labels = {
    pending: '待执行',
    running: '执行中',
    success: '成功',
    failed: '失败',
    rolled_back: '已回滚',
  };
  return labels[status] || status;
};

const Pipelines = () => {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [deployForm, setDeployForm] = useState({
    environment: 'production',
    version: '',
  });
  const [rollbackForm, setRollbackForm] = useState({
    previous_version: '',
  });
  const { hasPermission } = useAuth();

  const fetchPipelines = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filterStatus) {
        params.status = filterStatus;
      }
      const response = await pipelineAPI.getAll(params);
      setPipelines(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch pipelines:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelines();
  }, [filterStatus, page]);

  const handleAction = async (pipeline, action) => {
    try {
      switch (action) {
        case 'start':
          await pipelineAPI.executeAction(pipeline.id, 'start');
          break;
        case 'retry':
          await pipelineAPI.executeAction(pipeline.id, 'retry');
          break;
        case 'approve_continue':
          await pipelineAPI.executeAction(pipeline.id, 'approve_continue');
          break;
        case 'deploy':
          setSelectedPipeline(pipeline);
          setDeployForm({
            environment: 'production',
            version: `v${Date.now()}`,
          });
          setShowDeployModal(true);
          return;
        case 'rollback':
          setSelectedPipeline(pipeline);
          setShowRollbackModal(true);
          return;
        default:
          break;
      }
      fetchPipelines();
    } catch (error) {
      alert(error.response?.data?.error || '操作失败');
    }
  };

  const handleDeploy = async (e) => {
    e.preventDefault();
    if (!selectedPipeline) return;
    try {
      await pipelineAPI.executeAction(
        selectedPipeline.id,
        'deploy',
        deployForm.environment,
        deployForm.version
      );
      setShowDeployModal(false);
      setSelectedPipeline(null);
      fetchPipelines();
      alert('部署成功');
    } catch (error) {
      alert(error.response?.data?.error || '部署失败');
    }
  };

  const handleRollback = async (e) => {
    e.preventDefault();
    if (!selectedPipeline || !rollbackForm.previous_version) return;
    try {
      await pipelineAPI.executeAction(
        selectedPipeline.id,
        'rollback',
        undefined,
        undefined,
        rollbackForm.previous_version
      );
      setShowRollbackModal(false);
      setSelectedPipeline(null);
      setRollbackForm({ previous_version: '' });
      fetchPipelines();
      alert('回滚成功');
    } catch (error) {
      alert(error.response?.data?.error || '回滚失败');
    }
  };

  if (loading && pipelines.length === 0) {
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
          <option value="pending">待执行</option>
          <option value="running">执行中</option>
          <option value="success">成功</option>
          <option value="failed">失败</option>
        </select>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>仓库</th>
            <th style={styles.th}>MR单号</th>
            <th style={styles.th}>阶段</th>
            <th style={styles.th}>状态</th>
            <th style={styles.th}>重试次数</th>
            <th style={styles.th}>操作</th>
          </tr>
        </thead>
        <tbody>
          {pipelines.map((pipeline) => (
            <tr key={pipeline.id}>
              <td style={styles.td}>
                <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                  {pipeline.id.substring(0, 8)}
                </span>
              </td>
              <td style={styles.td}>{pipeline.repository_name}</td>
              <td style={styles.td}>{pipeline.mr_order_no || '-'}</td>
              <td style={styles.td}>{pipeline.stage}</td>
              <td style={styles.td}>
                <span style={styles.statusBadge(pipeline.status)}>
                  {getStatusLabel(pipeline.status)}
                </span>
              </td>
              <td style={styles.td}>{pipeline.retry_count || 0}</td>
              <td style={styles.td}>
                {hasPermission(['admin', 'devops']) && (
                  <>
                    {pipeline.status === 'pending' && (
                      <button
                        style={styles.actionButtonPrimary}
                        onClick={() => handleAction(pipeline, 'start')}
                      >
                        开始
                      </button>
                    )}
                    {pipeline.status === 'failed' && (
                      <>
                        {pipeline.retry_count < 3 && (
                          <button
                            style={styles.actionButtonPrimary}
                            onClick={() => handleAction(pipeline, 'retry')}
                          >
                            重试
                          </button>
                        )}
                        <button
                          style={styles.actionButtonSuccess}
                          onClick={() => handleAction(pipeline, 'approve_continue')}
                        >
                          人工审批
                        </button>
                        <button
                          style={{ ...styles.actionButton, borderColor: '#ffc107', color: '#856404' }}
                          onClick={() => handleAction(pipeline, 'rollback')}
                        >
                          回滚
                        </button>
                      </>
                    )}
                    {pipeline.status === 'success' && (
                      <button
                        style={styles.actionButtonPrimary}
                        onClick={() => handleAction(pipeline, 'deploy')}
                      >
                        部署
                      </button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pipelines.length === 0 && (
        <div style={styles.empty}>
          暂无流水线记录
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

      {showDeployModal && selectedPipeline && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>部署到环境</h2>
            <form onSubmit={handleDeploy}>
              <div style={styles.formGroup}>
                <label style={styles.label}>目标环境</label>
                <select
                  style={styles.select}
                  value={deployForm.environment}
                  onChange={(e) => setDeployForm({ ...deployForm, environment: e.target.value })}
                >
                  <option value="development">开发环境</option>
                  <option value="staging">预发布环境</option>
                  <option value="production">生产环境</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>版本号</label>
                <input
                  style={styles.input}
                  type="text"
                  value={deployForm.version}
                  onChange={(e) => setDeployForm({ ...deployForm, version: e.target.value })}
                  placeholder="例如: v1.0.0"
                  required
                />
              </div>
              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => {
                    setShowDeployModal(false);
                    setSelectedPipeline(null);
                  }}
                >
                  取消
                </button>
                <button type="submit" style={styles.submitButton}>
                  确认部署
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRollbackModal && selectedPipeline && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>一键回滚</h2>
            <form onSubmit={handleRollback}>
              <div style={styles.formGroup}>
                <label style={styles.label}>回滚到版本</label>
                <input
                  style={styles.input}
                  type="text"
                  value={rollbackForm.previous_version}
                  onChange={(e) => setRollbackForm({ previous_version: e.target.value })}
                  placeholder="请输入要回滚到的版本号"
                  required
                />
              </div>
              <div style={{ padding: '12px', backgroundColor: '#fff3cd', borderRadius: '6px', fontSize: '13px', color: '#856404' }}>
                ⚠️ 回滚操作将恢复到指定版本，请确认后执行
              </div>
              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => {
                    setShowRollbackModal(false);
                    setSelectedPipeline(null);
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={{ ...styles.submitButton, backgroundColor: '#dc3545' }}
                >
                  确认回滚
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipelines;
