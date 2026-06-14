import React, { useState, useEffect } from 'react';
import api from '../../api';

export default function ContractList() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', contract_type: '', keyword: '' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ client_id: '', contract_name: '', contract_type: 'service', package_type: '', start_date: '', end_date: '', total_amount: '', terms: '' });

  useEffect(() => { fetchContracts(); }, [filters, pagination.page]);

  const fetchContracts = async () => {
    const params = { ...filters, page: pagination.page, pageSize: pagination.pageSize };
    Object.keys(params).forEach(key => { if (!params[key]) delete params[key]; });
    api.get('/manager/contracts', { params }).then(res => { setContracts(res.data.data); setPagination(p => ({ ...p, ...res.data.pagination })); }).finally(() => setLoading(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.contract_name) { alert('请填写合同名称'); return; }
    try {
      await api.post('/manager/contracts', { ...formData, total_amount: parseFloat(formData.total_amount) || 0 });
      alert('合同添加成功！'); setShowModal(false); fetchContracts();
    } catch (err) { alert('添加失败'); }
  };

  const statusMap = { active: { label: '有效', color: '#52c41a' }, expired: { label: '已到期', color: '#faad14' }, completed: { label: '已完成', color: '#8c8c8c' } };
  const typeMap = { service: '服务合同', agency: '代理合同', legal: '法律顾问' };
  const packageMap = { enterprise_premium: '企业高级版', patent_full: '专利全包', trademark_intl: '商标国际', yearly_retainer: '年度顾问' };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>加载中...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div><h2 style={{ margin: 0 }}>📄 套餐合同</h2><p style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>管理知识产权服务套餐和法律顾问合同</p></div>
        <button
          style={styles.primaryBtn}
          aria-label="新建合同"
          title="新建合同"
          onClick={() => setShowModal(true)}
        >
          新建合同
        </button>
      </div>

      <div style={styles.filterBar}>
        <input style={styles.searchInput} placeholder="搜索合同名称或编号..." value={filters.keyword} onChange={e => setFilters(p => ({ ...p, keyword: e.target.value }))} />
        <select style={styles.filterSelect} value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">全部状态</option><option value="active">有效</option><option value="completed">已完成</option>
        </select>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead><tr style={styles.headerRow}>
            <th>合同编号</th><th>合同名称</th><th>客户</th><th>类型</th><th>套餐</th><th>金额</th><th>已收款</th><th>有效期</th><th>状态</th>
          </tr></thead>
          <tbody>
            {contracts.map(c => (
              <tr key={c.id} style={styles.row}>
                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{c.contract_number}</td>
                <td style={{ fontWeight: '500' }}>{c.contract_name}</td>
                <td>{c.client_name || '-'}</td>
                <td>{typeMap[c.contract_type] || c.contract_type}</td>
                <td>{packageMap[c.package_type] || c.package_type || '-'}</td>
                <td>¥{c.total_amount?.toLocaleString() || '-'}</td>
                <td>
                  <div style={{ color: '#52c41a' }}>¥{c.paid_amount?.toLocaleString() || 0}</div>
                  {c.total_amount > 0 && <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                    {Math.round(c.paid_amount / c.total_amount * 100)}% 已收款
                  </div>}
                </td>
                <td style={{ fontSize: '12px' }}>
                  <div>{c.start_date || '-'}</div><div>→ {c.end_date || '-'}</div>
                </td>
                <td><span style={{ ...styles.badge, background: (statusMap[c.status] || statusMap.active).color + '20', color: (statusMap[c.status] || statusMap.active).color }}>
                  {(statusMap[c.status] || statusMap.active).label}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px 0' }}>新建合同</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px' }}>合同名称 *</label>
                <input style={styles.input} placeholder="请输入合同名称" value={formData.contract_name} onChange={e => setFormData(p => ({ ...p, contract_name: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div><label style={{ display: 'block', marginBottom: '6px' }}>合同类型</label>
                  <select style={styles.input} value={formData.contract_type} onChange={e => setFormData(p => ({ ...p, contract_type: e.target.value }))}>
                    {Object.entries(typeMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select></div>
                <div><label style={{ display: 'block', marginBottom: '6px' }}>套餐类型</label>
                  <select style={styles.input} value={formData.package_type} onChange={e => setFormData(p => ({ ...p, package_type: e.target.value }))}>
                    <option value="">请选择</option>
                    {Object.entries(packageMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div><label style={{ display: 'block', marginBottom: '6px' }}>开始日期</label>
                  <input type="date" style={styles.input} value={formData.start_date} onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))} /></div>
                <div><label style={{ display: 'block', marginBottom: '6px' }}>结束日期</label>
                  <input type="date" style={styles.input} value={formData.end_date} onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))} /></div>
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px' }}>合同金额（元）</label>
                <input type="number" style={styles.input} placeholder="请输入合同总金额" value={formData.total_amount} onChange={e => setFormData(p => ({ ...p, total_amount: e.target.value }))} /></div>
              <div><label style={{ display: 'block', marginBottom: '6px' }}>合同条款</label>
                <textarea style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }} value={formData.terms} onChange={e => setFormData(p => ({ ...p, terms: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" style={styles.submitBtn}>创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  primaryBtn: { padding: '10px 24px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' },
  filterBar: { display: 'flex', gap: '12px' },
  searchInput: { flex: 1, padding: '10px 14px', border: '1px solid #d9d9d9', borderRadius: '8px', fontSize: '14px', outline: 'none' },
  filterSelect: { padding: '10px 14px', border: '1px solid #d9d9d9', borderRadius: '8px', fontSize: '14px', background: '#fff', outline: 'none' },
  card: { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  headerRow: { background: '#fafafa', borderBottom: '1px solid #f0f0f0' },
  row: { borderBottom: '1px solid #f0f0f0' },
  badge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto' },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #d9d9d9', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  cancelBtn: { padding: '10px 24px', border: '1px solid #d9d9d9', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  submitBtn: { padding: '10px 24px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }
};
