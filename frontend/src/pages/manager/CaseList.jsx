import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

const statusMap = { active: { label: '进行中', color: '#1890ff' }, closed: { label: '已结案', color: '#52c41a' } };
const typeMap = {
  trademark_infringement: '商标侵权', patent_invalidation: '专利无效',
  copyright_infringement: '版权侵权', trade_secret: '商业秘密', contract_dispute: '合同纠纷'
};
const priorityMap = { high: { label: '高', color: '#f5222d' }, medium: { label: '中', color: '#faad14' }, low: { label: '低', color: '#52c41a' } };

export default function CaseList() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', case_type: '', priority: '', keyword: '' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

  useEffect(() => { fetchCases(); }, [filters, pagination.page]);

  const fetchCases = async () => {
    const params = { ...filters, page: pagination.page, pageSize: pagination.pageSize };
    Object.keys(params).forEach(key => { if (!params[key]) delete params[key]; });
    api.get('/manager/cases', { params }).then(res => { setCases(res.data.data); setPagination(p => ({ ...p, ...res.data.pagination })); }).finally(() => setLoading(false));
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>加载中...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.statsRow}>
        <div style={styles.statCard}><div style={styles.statValue}>{cases.filter(c => c.status === 'active').length}</div><div style={styles.statLabel}>进行中案件</div></div>
        <div style={styles.statCard}><div style={styles.statValue}>{cases.filter(c => c.priority === 'high').length}</div><div style={styles.statLabel}>高优先级</div></div>
        <div style={styles.statCard}><div style={styles.statValue}>¥{cases.reduce((s, c) => s + (c.case_value || 0), 0).toLocaleString()}</div><div style={styles.statLabel}>涉案总金额</div></div>
      </div>

      <div style={styles.filterBar}>
        <input style={styles.searchInput} placeholder="搜索案号或案件名称..." value={filters.keyword} onChange={e => setFilters(p => ({ ...p, keyword: e.target.value }))} />
        <select style={styles.filterSelect} value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">全部状态</option><option value="active">进行中</option><option value="closed">已结案</option>
        </select>
        <select style={styles.filterSelect} value={filters.priority} onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}>
          <option value="">全部优先级</option><option value="high">高</option><option value="medium">中</option><option value="low">低</option>
        </select>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead><tr style={styles.headerRow}>
            <th>案号</th><th>案件名称</th><th>类型</th><th>客户</th><th>优先级</th><th>状态</th><th>涉案金额</th><th>操作</th>
          </tr></thead>
          <tbody>
            {cases.map(c => (
              <tr key={c.id} style={styles.row}>
                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{c.case_number}</td>
                <td style={{ fontWeight: '500' }}>{c.case_name}</td>
                <td>{typeMap[c.case_type] || c.case_type}</td>
                <td>{c.client_name || '-'}</td>
                <td><span style={{ ...styles.badge, background: (priorityMap[c.priority] || priorityMap.medium).color + '20', color: (priorityMap[c.priority] || priorityMap.medium).color }}>
                  {(priorityMap[c.priority] || priorityMap.medium).label}</span></td>
                <td><span style={{ ...styles.badge, background: (statusMap[c.status] || statusMap.active).color + '20', color: (statusMap[c.status] || statusMap.active).color }}>
                  {(statusMap[c.status] || statusMap.active).label}</span></td>
                <td style={{ color: '#fa8c16', fontWeight: '500' }}>¥{c.case_value?.toLocaleString() || '-'}</td>
                <td><Link to={`/manager/cases/${c.id}`} style={styles.viewBtn}>时间轴</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  statValue: { fontSize: '24px', fontWeight: '700', color: '#1890ff' },
  statLabel: { fontSize: '13px', color: '#8c8c8c', marginTop: '4px' },
  filterBar: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: '200px', padding: '10px 14px', border: '1px solid #d9d9d9', borderRadius: '8px', fontSize: '14px', outline: 'none' },
  filterSelect: { padding: '10px 14px', border: '1px solid #d9d9d9', borderRadius: '8px', fontSize: '14px', background: '#fff', outline: 'none' },
  card: { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  headerRow: { background: '#fafafa', borderBottom: '1px solid #f0f0f0' },
  row: { borderBottom: '1px solid #f0f0f0' },
  badge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  viewBtn: { padding: '4px 12px', background: '#1890ff', color: '#fff', borderRadius: '6px', fontSize: '12px', textDecoration: 'none' }
};
