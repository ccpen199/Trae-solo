import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import dayjs from 'dayjs';

export default function ActionItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchAction, setBatchAction] = useState('');
  const [batchData, setBatchData] = useState({});
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignee_id: '',
    search: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    loadUsers();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const res = await api.get('/action-items', { params });
      setItems(res.data);
    } catch (error) {
      console.error('加载行动项失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (error) {
      console.error('加载用户失败:', error);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(i => i.id));
    }
  };

  const handleBatchAction = async () => {
    try {
      await api.post('/action-items/batch', {
        ids: selectedIds,
        action: batchAction,
        data: batchData
      });
      setShowBatchModal(false);
      setSelectedIds([]);
      setBatchAction('');
      setBatchData({});
      loadData();
    } catch (error) {
      console.error('批量操作失败:', error);
    }
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>行动项列表</h1>
        {selectedIds.length > 0 && (
          <button onClick={() => setShowBatchModal(true)} style={styles.batchBtn}>
            批量处理 ({selectedIds.length})
          </button>
        )}
      </div>

      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="搜索行动项..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
          style={styles.searchInput}
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          style={styles.filterSelect}
        >
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已完成</option>
          <option value="overdue">已过期</option>
          <option value="cancelled">已取消</option>
        </select>
        <select
          value={filters.priority}
          onChange={(e) => setFilters({...filters, priority: e.target.value})}
          style={styles.filterSelect}
        >
          <option value="">全部优先级</option>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
        <select
          value={filters.assignee_id}
          onChange={(e) => setFilters({...filters, assignee_id: e.target.value})}
          style={styles.filterSelect}
        >
          <option value="">全部负责人</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={styles.loading}>加载中...</div>
      ) : items.length === 0 ? (
        <div style={styles.empty}>暂无行动项</div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === items.length && items.length > 0}
                    onChange={selectAll}
                  />
                </th>
                <th>行动项</th>
                <th>负责人</th>
                <th>优先级</th>
                <th>截止日期</th>
                <th>关联会议</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr
                  key={item.id}
                  onClick={() => navigate(`/action-items/${item.id}`)}
                  style={styles.row}
                >
                  <td style={styles.checkbox} onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                  </td>
                  <td style={styles.titleCell}>{item.title}</td>
                  <td>{item.assignee_name || '未分配'}</td>
                  <td>
                    <span style={{
                      ...styles.priorityTag,
                      ...getPriorityStyle(item.priority)
                    }}>
                      {item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}
                    </span>
                  </td>
                  <td>
                    {item.due_date ? dayjs(item.due_date).format('YYYY-MM-DD') : '未设置'}
                  </td>
                  <td>{item.meeting_title || '-'}</td>
                  <td>
                    <span style={{
                      ...styles.statusTag,
                      ...getStatusStyle(item.display_status || item.status)
                    }}>
                      {getStatusText(item.display_status || item.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showBatchModal && (
        <div style={styles.modalOverlay} onClick={() => setShowBatchModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>批量处理</h2>
              <button onClick={() => setShowBatchModal(false)} style={styles.closeBtn}>×</button>
            </div>
            <div style={styles.modalBody}>
              <p>已选择 {selectedIds.length} 个行动项</p>
              <div style={styles.formGroup}>
                <label style={styles.label}>选择操作</label>
                <select
                  value={batchAction}
                  onChange={(e) => setBatchAction(e.target.value)}
                  style={styles.input}
                >
                  <option value="">请选择操作</option>
                  <option value="complete">标记完成</option>
                  <option value="cancel">取消任务</option>
                  <option value="reassign">重新分配负责人</option>
                  <option value="update_due">更新截止日期</option>
                </select>
              </div>
              {batchAction === 'reassign' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>新负责人</label>
                  <select
                    value={batchData.assignee_id || ''}
                    onChange={(e) => setBatchData({...batchData, assignee_id: e.target.value})}
                    style={styles.input}
                  >
                    <option value="">请选择</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {batchAction === 'update_due' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>新截止日期</label>
                  <input
                    type="date"
                    value={batchData.due_date || ''}
                    onChange={(e) => setBatchData({...batchData, due_date: e.target.value})}
                    style={styles.input}
                  />
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowBatchModal(false)} style={styles.cancelBtn}>
                取消
              </button>
              <button
                onClick={handleBatchAction}
                style={styles.primaryBtn}
                disabled={!batchAction}
              >
                确认执行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusStyle(status) {
  switch (status) {
    case 'completed': return { backgroundColor: '#f6ffed', color: '#52c41a' };
    case 'overdue': return { backgroundColor: '#fff1f0', color: '#f5222d' };
    case 'in_progress': return { backgroundColor: '#e6f7ff', color: '#1890ff' };
    case 'cancelled': return { backgroundColor: '#f5f5f5', color: '#8c8c8c' };
    default: return { backgroundColor: '#fff7e6', color: '#fa8c16' };
  }
}

function getStatusText(status) {
  switch (status) {
    case 'completed': return '已完成';
    case 'overdue': return '已过期';
    case 'in_progress': return '进行中';
    case 'cancelled': return '已取消';
    default: return '待处理';
  }
}

function getPriorityStyle(priority) {
  switch (priority) {
    case 'high': return { backgroundColor: '#fff1f0', color: '#f5222d' };
    case 'medium': return { backgroundColor: '#fff7e6', color: '#fa8c16' };
    default: return { backgroundColor: '#f6ffed', color: '#52c41a' };
  }
}

const styles = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle: { fontSize: 24, margin: 0, color: '#262626' },
  batchBtn: { padding: '10px 20px', backgroundColor: '#fa8c16', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 },
  filterBar: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: 200, padding: '10px 16px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14 },
  filterSelect: { padding: '10px 16px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, minWidth: 120 },
  loading: { textAlign: 'center', padding: 40, color: '#999' },
  empty: { textAlign: 'center', padding: 60, backgroundColor: '#fff', borderRadius: 8, color: '#999' },
  tableContainer: { backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  checkbox: { width: 50, textAlign: 'center' },
  row: { cursor: 'pointer', borderBottom: '1px solid #f0f0f0' },
  titleCell: { maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  statusTag: { padding: '2px 8px', borderRadius: 4, fontSize: 12 },
  priorityTag: { padding: '2px 8px', borderRadius: 4, fontSize: 12 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#fff', borderRadius: 8, width: '100%', maxWidth: 450 },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottom: '1px solid #f0f0f0' },
  modalTitle: { margin: 0, fontSize: 18 },
  closeBtn: { border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#999' },
  modalBody: { padding: 20 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 },
  label: { fontSize: 14, fontWeight: 500, color: '#333' },
  input: { padding: '10px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: 20, borderTop: '1px solid #f0f0f0' },
  cancelBtn: { padding: '10px 20px', border: '1px solid #d9d9d9', borderRadius: 6, backgroundColor: '#fff', cursor: 'pointer', fontSize: 14 },
  primaryBtn: { padding: '10px 20px', backgroundColor: '#1890ff', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }
};
