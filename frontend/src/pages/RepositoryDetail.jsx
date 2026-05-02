import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { repositoryAPI, branchAPI, mergeRequestAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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
  backButton: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  repoHeader: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  repoName: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  repoMeta: {
    display: 'flex',
    gap: '24px',
    marginTop: '12px',
    fontSize: '14px',
    color: '#666',
  },
  statusBadge: (status) => ({
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: getStatusColor(status).bg,
    color: getStatusColor(status).text,
  }),
  section: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e5e5e5',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #e5e5e5',
    marginBottom: '20px',
  },
  tab: (active) => ({
    padding: '12px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: active ? '600' : '400',
    color: active ? '#007bff' : '#666',
    borderBottom: active ? '2px solid #007bff' : '2px solid transparent',
  }),
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    fontWeight: '600',
    fontSize: '13px',
    color: '#666',
    borderBottom: '1px solid #e5e5e5',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #e5e5e5',
    fontSize: '14px',
    color: '#333',
  },
  trHover: {
    cursor: 'pointer',
  },
  actionButton: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    marginRight: '8px',
  },
  actionButtonPrimary: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#007bff',
    color: 'white',
    cursor: 'pointer',
    fontSize: '13px',
  },
  historyItem: {
    display: 'flex',
    gap: '16px',
    padding: '16px 0',
    borderBottom: '1px solid #e5e5e5',
  },
  historyIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e7f3ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
  },
  historyContent: {
    flex: 1,
  },
  historyAction: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  historyActor: {
    fontSize: '14px',
    color: '#007bff',
  },
  historyTime: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px',
  },
  historyComment: {
    fontSize: '13px',
    color: '#666',
    marginTop: '8px',
    padding: '8px 12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  statCard: {
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#333',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
  },
};

const getStatusColor = (status) => {
  const colors = {
    pending_create: { bg: '#fff3cd', text: '#856404' },
    active: { bg: '#d4edda', text: '#155724' },
    archived: { bg: '#e2e3e5', text: '#383d41' },
    rejected: { bg: '#f8d7da', text: '#721c24' },
    pending_review: { bg: '#fff3cd', text: '#856404' },
    in_review: { bg: '#cce5ff', text: '#004085' },
    approved: { bg: '#d4edda', text: '#155724' },
    merged: { bg: '#d4edda', text: '#155724' },
    closed: { bg: '#e2e3e5', text: '#383d41' },
  };
  return colors[status] || { bg: '#e2e3e5', text: '#383d41' };
};

const getStatusLabel = (status) => {
  const labels = {
    pending_create: '待创建',
    active: '活跃',
    archived: '已归档',
    rejected: '已拒绝',
    pending_review: '待审查',
    in_review: '审查中',
    approved: '已批准',
    merged: '已合并',
    closed: '已关闭',
  };
  return labels[status] || status;
};

const RepositoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [repository, setRepository] = useState(null);
  const [branches, setBranches] = useState([]);
  const [activeTab, setActiveTab] = useState('branches');
  const [showCreateBranchModal, setShowCreateBranchModal] = useState(false);
  const [showCreateMRModal, setShowCreateMRModal] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [formData, setFormData] = useState({
    branchName: '',
    fromBranch: '',
    mrTitle: '',
    mrDescription: '',
    sourceBranch: '',
    targetBranch: '',
    commitMessage: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const repoResponse = await repositoryAPI.getById(id);
        setRepository(repoResponse.data);
        setBranches(repoResponse.data.branches || []);
      } catch (error) {
        console.error('Failed to fetch repository:', error);
      }
    };
    fetchData();
  }, [id]);

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      await branchAPI.create({
        repository_id: id,
        name: formData.branchName,
        from_branch_id: formData.fromBranch || undefined,
      });
      setShowCreateBranchModal(false);
      setFormData({ ...formData, branchName: '', fromBranch: '' });
      const repoResponse = await repositoryAPI.getById(id);
      setBranches(repoResponse.data.branches || []);
    } catch (error) {
      alert(error.response?.data?.error || '创建失败');
    }
  };

  const handleCreateMR = async (e) => {
    e.preventDefault();
    try {
      await mergeRequestAPI.create({
        repository_id: id,
        source_branch_id: formData.sourceBranch,
        target_branch_id: formData.targetBranch,
        title: formData.mrTitle,
        description: formData.mrDescription,
      });
      setShowCreateMRModal(false);
      setFormData({ ...formData, mrTitle: '', mrDescription: '', sourceBranch: '', targetBranch: '' });
      alert('合并请求已创建');
    } catch (error) {
      alert(error.response?.data?.error || '创建失败');
    }
  };

  const handleCommit = async (e) => {
    e.preventDefault();
    if (!selectedBranch) return;
    try {
      await branchAPI.createCommit(selectedBranch.id, {
        message: formData.commitMessage,
      });
      setShowCommitModal(false);
      setFormData({ ...formData, commitMessage: '' });
      alert('代码提交成功');
    } catch (error) {
      alert(error.response?.data?.error || '提交失败');
    }
  };

  if (!repository) {
    return <div>加载中...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button
          style={styles.backButton}
          onClick={() => navigate('/repositories')}
        >
          ← 返回列表
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          {hasPermission(['developer', 'admin']) && (
            <>
              <button
                style={styles.actionButton}
                onClick={() => setShowCreateBranchModal(true)}
              >
                + 创建分支
              </button>
              <button
                style={styles.actionButton}
                onClick={() => setShowCreateMRModal(true)}
              >
                🔀 发起合并
              </button>
            </>
          )}
        </div>
      </div>

      <div style={styles.repoHeader}>
        <div style={styles.repoName}>
          <span>{repository.is_public ? '🌐' : '🔒'}</span>
          {repository.name}
          <span style={styles.statusBadge(repository.status)}>
            {getStatusLabel(repository.status)}
          </span>
        </div>
        <div style={styles.repoMeta}>
          <span>主单号: {repository.main_order_no}</span>
          <span>所有者: {repository.owner_name}</span>
          <span>责任人: {repository.responsible_name}</span>
        </div>
        {repository.description && (
          <div style={{ marginTop: '12px', color: '#666', fontSize: '14px' }}>
            {repository.description}
          </div>
        )}
      </div>

      <div style={styles.tabs}>
        <div
          style={styles.tab(activeTab === 'branches')}
          onClick={() => setActiveTab('branches')}
        >
          🌿 分支 ({branches.length})
        </div>
        <div
          style={styles.tab(activeTab === 'stats')}
          onClick={() => setActiveTab('stats')}
        >
          📊 统计
        </div>
        <div
          style={styles.tab(activeTab === 'history')}
          onClick={() => setActiveTab('history')}
        >
          📜 历史记录
        </div>
      </div>

      {activeTab === 'branches' && (
        <div style={styles.section}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>分支名称</th>
                <th style={styles.th}>保护状态</th>
                <th style={styles.th}>最新提交</th>
                <th style={styles.th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={branch.id}>
                  <td style={styles.td}>
                    <span style={{ fontWeight: '500' }}>
                      {branch.is_protected ? '🛡️' : '🌿'} {branch.name}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge(branch.is_protected ? 'active' : 'archived'),
                    }}>
                      {branch.is_protected ? '已保护' : '未保护'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {branch.latest_commit 
                      ? branch.latest_commit.substring(0, 8)
                      : '-'}
                  </td>
                  <td style={styles.td}>
                    {hasPermission(['developer', 'admin']) && !branch.is_protected && (
                      <button
                        style={styles.actionButtonPrimary}
                        onClick={() => {
                          setSelectedBranch(branch);
                          setShowCommitModal(true);
                        }}
                      >
                        提交代码
                      </button>
                    )}
                    {hasPermission(['admin', 'devops']) && (
                      <button
                        style={styles.actionButton}
                        onClick={async () => {
                          const action = branch.is_protected ? 'unprotect' : 'protect';
                          await branchAPI.executeAction(branch.id, action);
                          const repoResponse = await repositoryAPI.getById(id);
                          setBranches(repoResponse.data.branches || []);
                        }}
                      >
                        {branch.is_protected ? '取消保护' : '保护'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {branches.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              暂无分支数据
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div style={styles.section}>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{branches.length}</div>
              <div style={styles.statLabel}>分支数</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{repository.pending_mr_count || 0}</div>
              <div style={styles.statLabel}>待审MR</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={styles.section}>
          {repository.history?.map((item, index) => (
            <div key={index} style={styles.historyItem}>
              <div style={styles.historyIcon}>
                {item.action === 'CREATE' ? '➕' :
                 item.action === 'APPROVE' ? '✅' :
                 item.action === 'REJECT' ? '❌' :
                 item.action === 'COMMENT' ? '💬' : '📝'}
              </div>
              <div style={styles.historyContent}>
                <div style={styles.historyAction}>
                  <span style={styles.historyActor}>{item.actor_name}</span>
                  {' '}{item.action}
                </div>
                <div style={styles.historyTime}>
                  {new Date(item.created_at * 1000).toLocaleString()}
                </div>
                {item.comment && (
                  <div style={styles.historyComment}>{item.comment}</div>
                )}
              </div>
            </div>
          ))}
          {(!repository.history || repository.history.length === 0) && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              暂无历史记录
            </div>
          )}
        </div>
      )}

      {showCreateBranchModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>创建分支</h2>
            <form onSubmit={handleCreateBranch}>
              <div style={styles.formGroup}>
                <label style={styles.label}>分支名称 *</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.branchName}
                  onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                  placeholder="例如: feature/new-feature"
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>从哪个分支创建 (可选)</label>
                <select
                  style={styles.select}
                  value={formData.fromBranch}
                  onChange={(e) => setFormData({ ...formData, fromBranch: e.target.value })}
                >
                  <option value="">新建空分支</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowCreateBranchModal(false)}
                >
                  取消
                </button>
                <button type="submit" style={styles.submitButton}>
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateMRModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>发起合并请求</h2>
            <form onSubmit={handleCreateMR}>
              <div style={styles.formGroup}>
                <label style={styles.label}>源分支 *</label>
                <select
                  style={styles.select}
                  value={formData.sourceBranch}
                  onChange={(e) => setFormData({ ...formData, sourceBranch: e.target.value })}
                  required
                >
                  <option value="">请选择源分支</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>目标分支 *</label>
                <select
                  style={styles.select}
                  value={formData.targetBranch}
                  onChange={(e) => setFormData({ ...formData, targetBranch: e.target.value })}
                  required
                >
                  <option value="">请选择目标分支</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>标题 *</label>
                <input
                  style={styles.input}
                  type="text"
                  value={formData.mrTitle}
                  onChange={(e) => setFormData({ ...formData, mrTitle: e.target.value })}
                  placeholder="请输入合并请求标题"
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>描述</label>
                <textarea
                  style={styles.textarea}
                  value={formData.mrDescription}
                  onChange={(e) => setFormData({ ...formData, mrDescription: e.target.value })}
                  placeholder="请输入合并请求描述"
                />
              </div>
              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowCreateMRModal(false)}
                >
                  取消
                </button>
                <button type="submit" style={styles.submitButton}>
                  发起合并
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCommitModal && selectedBranch && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>提交代码到 {selectedBranch.name}</h2>
            <form onSubmit={handleCommit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>提交信息 *</label>
                <textarea
                  style={styles.textarea}
                  value={formData.commitMessage}
                  onChange={(e) => setFormData({ ...formData, commitMessage: e.target.value })}
                  placeholder="请输入提交信息描述此次变更"
                  required
                />
              </div>
              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowCommitModal(false)}
                >
                  取消
                </button>
                <button type="submit" style={styles.submitButton}>
                  提交
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepositoryDetail;
