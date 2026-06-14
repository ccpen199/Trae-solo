import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function ClientList() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ keyword: '', status: '' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', contact_person: '', phone: '', email: '', industry: '', address: '' });

  useEffect(() => { fetchClients(); }, [filters, pagination.page]);

  const fetchClients = async () => {
    const params = { ...filters, page: pagination.page, pageSize: pagination.pageSize };
    Object.keys(params).forEach(key => { if (!params[key]) delete params[key]; });
    api.get('/manager/clients', { params }).then(res => { setClients(res.data.data); setPagination(p => ({ ...p, ...res.data.pagination })); }).finally(() => setLoading(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) { alert('请填写客户名称'); return; }
    try {
      await api.post('/manager/clients', formData);
      alert('客户添加成功！'); setShowModal(false);
      setFormData({ name: '', contact_person: '', phone: '', email: '', industry: '', address: '' });
      fetchClients();
    } catch (err) { alert('添加失败'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>加载中...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>👥 客户管理</h2>
          <p style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>管理和绑定客户，提供管家式知识产权服务</p>
        </div>
        <button
          style={styles.primaryBtn}
          aria-label="添加客户"
          title="添加客户"
          onClick={() => setShowModal(true)}
        >
          添加客户
        </button>
      </div>

      <div style={styles.filterBar}>
        <input style={styles.searchInput} placeholder="搜索客户名称或联系人..." value={filters.keyword} onChange={e => setFilters(p => ({ ...p, keyword: e.target.value }))} />
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead><tr style={styles.headerRow}>
            <th>客户名称</th><th>联系人</th><th>联系方式</th><th>行业</th>
            <th>商标</th><th>专利</th><th>版权</th><th>案件</th><th>操作</th>
          </tr></thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} style={styles.row}>
                <td style={{ fontWeight: '500' }}>{c.name}</td>
                <td>{c.contact_person || '-'}</td>
                <td>
                  <div>{c.phone || '-'}</div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{c.email || '-'}</div>
                </td>
                <td>{c.industry || '-'}</td>
                <td style={{ textAlign: 'center' }}>{c.trademark_count || 0}</td>
                <td style={{ textAlign: 'center' }}>{c.patent_count || 0}</td>
                <td style={{ textAlign: 'center' }}>{c.copyright_count || 0}</td>
                <td style={{ textAlign: 'center' }}>{c.case_count || 0}</td>
                <td>
                  <Link to={`/manager/clients/${c.id}`} style={styles.viewBtn}>查看</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px 0' }}>添加客户</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>客户名称 *</label>
                <input style={styles.input} placeholder="请输入客户名称" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>联系人</label>
                  <input style={styles.input} placeholder="联系人姓名" value={formData.contact_person} onChange={e => setFormData(p => ({ ...p, contact_person: e.target.value }))} /></div>
                <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>联系电话</label>
                  <input style={styles.input} placeholder="联系电话" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} /></div>
              </div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>邮箱</label>
                <input style={styles.input} placeholder="电子邮箱" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>行业</label>
                  <select style={styles.input} value={formData.industry} onChange={e => setFormData(p => ({ ...p, industry: e.target.value }))}>
                    <option value="">请选择</option><option value="人工智能">人工智能</option><option value="互联网">互联网</option>
                    <option value="生物医药">生物医药</option><option value="新能源">新能源</option><option value="制造业">制造业</option>
                  </select></div>
                <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>地址</label>
                  <input style={styles.input} placeholder="客户地址" value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" style={styles.submitBtn}>添加</button>
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
  card: { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  headerRow: { background: '#fafafa', borderBottom: '1px solid #f0f0f0' },
  row: { borderBottom: '1px solid #f0f0f0' },
  viewBtn: { padding: '4px 12px', background: '#f0f0f0', borderRadius: '6px', fontSize: '12px', textDecoration: 'none', color: '#595959' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '550px' },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #d9d9d9', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  cancelBtn: { padding: '10px 24px', border: '1px solid #d9d9d9', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  submitBtn: { padding: '10px 24px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }
};
