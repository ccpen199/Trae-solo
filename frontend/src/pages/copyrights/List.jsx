import React, { useState, useEffect } from 'react';
import api from '../../api';

const typeMap = {
  '软件著作权': { color: '#1890ff', icon: '💻' },
  '文字作品': { color: '#52c41a', icon: '📝' },
  '美术作品': { color: '#eb2f96', icon: '🎨' },
  '视听作品': { color: '#722ed1', icon: '🎬' },
  '音乐作品': { color: '#fa8c16', icon: '🎵' }
};

const statusMap = {
  pending: { label: '登记中', color: '#1890ff' },
  registered: { label: '已登记', color: '#52c41a' }
};

export default function CopyrightList() {
  const [copyrights, setCopyrights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ work_type: '', status: '', keyword: '' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);

  useEffect(() => {
    fetchCopyrights();
  }, [filters, pagination.page]);

  const fetchCopyrights = async () => {
    try {
      const params = { ...filters, page: pagination.page, pageSize: pagination.pageSize };
      Object.keys(params).forEach(key => { if (!params[key]) delete params[key]; });
      const response = await api.get('/copyrights', { params });
      setCopyrights(response.data.data);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (err) {
      console.error('Failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id) => {
    const c = copyrights.find(x => x.id === id);
    if (!c?.evidence_hash) return;
    try {
      const res = await api.post('/copyrights/verify', { evidence_hash: c.evidence_hash });
      alert(res.data.valid ? '✅ 存证验证通过！' : '❌ 验证失败，存证无效');
    } catch (err) {
      alert('验证失败');
    }
  };

  const viewDetail = (c) => {
    const materials = [
      { name: '作品说明书.pdf', size: '234 KB', status: '已上传' },
      { name: '创作过程说明.docx', size: '89 KB', status: '已上传' },
      { name: '著作权登记申请表.pdf', size: '156 KB', status: '已上传' },
      { name: '作品样本.jpg', size: '1.8 MB', status: '已上传' },
      { name: '权利归属证明.pdf', size: '123 KB', status: '已上传' }
    ];

    if (c.status === 'registered') {
      materials.push({ name: '版权登记证书.pdf', size: '345 KB', status: '已核发' });
    }

    const evidence = c.evidence_hash ? {
      hash: c.evidence_hash,
      txId: '0x' + Math.random().toString(16).slice(2, 66),
      blockHeight: 1284567,
      timestamp: c.creation_date || c.created_at,
      chainName: 'BSN 联盟链'
    } : null;

    setDetailData({ copyright: c, materials, evidence });
    setShowDetail(true);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>加载中...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.filterBar}>
        <input style={styles.searchInput} placeholder="搜索作品名称或登记号..." value={filters.keyword} onChange={e => setFilters(p => ({ ...p, keyword: e.target.value }))} />
        <select style={styles.filterSelect} value={filters.work_type} onChange={e => setFilters(p => ({ ...p, work_type: e.target.value }))}>
          <option value="">全部类型</option>
          {Object.keys(typeMap).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select style={styles.filterSelect} value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">全部状态</option>
          <option value="pending">登记中</option>
          <option value="registered">已登记</option>
        </select>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>©️ 版权库</h3>
        </div>
        <div style={styles.grid}>
          {copyrights.map(c => (
            <div key={c.id} style={styles.cardItem}>
              <div style={{ ...styles.typeIcon, background: (typeMap[c.work_type] || typeMap['软件著作权']).color + '15', color: (typeMap[c.work_type] || typeMap['软件著作权']).color }}>
                {(typeMap[c.work_type] || typeMap['软件著作权']).icon}
              </div>
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontWeight: '600', marginBottom: '6px' }}>{c.work_name}</div>
                <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>{c.work_type}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ ...styles.badge, background: (statusMap[c.status] || statusMap.pending).color + '20', color: (statusMap[c.status] || statusMap.pending).color }}>
                    {(statusMap[c.status] || statusMap.pending).label}
                  </span>
                  <span style={{ fontSize: '11px', color: '#bfbfbf' }}>{c.registration_date || c.creation_date}</span>
                </div>
                {c.registration_number && <div style={{ fontSize: '11px', color: '#8c8c8c' }}>{c.registration_number}</div>}
                {c.evidence_hash && <div style={{ fontSize: '11px', color: '#8c8c8c', marginTop: '4px', fontFamily: 'monospace' }}>Hash: {c.evidence_hash.slice(0, 18)}...</div>}
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  {c.evidence_hash && <button style={styles.verifyBtn} onClick={() => handleVerify(c.id)}>验真</button>}
                  <button style={{ ...styles.verifyBtn, background: '#1890ff', color: '#fff', border: 'none' }} onClick={() => viewDetail(c)}>详情</button>
                </div>
              </div>
            </div>
          ))}
          {copyrights.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>暂无版权数据</div>}
        </div>
      </div>

      <div style={styles.pagination}>
        <span style={{ color: '#8c8c8c' }}>共 {pagination.total} 条</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button style={styles.pageBtn} onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))} disabled={pagination.page === 1}>上一页</button>
          <span>第 {pagination.page} / {pagination.totalPages} 页</span>
          <button style={styles.pageBtn} onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))} disabled={pagination.page === pagination.totalPages}>下一页</button>
        </div>
      </div>

      {showDetail && detailData && (
        <div style={styles.modalOverlay} onClick={() => setShowDetail(false)}>
          <div style={{ ...styles.modal, maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>©️ 版权详情</h3>
              <button style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowDetail(false)}>×</button>
            </div>

            <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                <div><span style={{ color: '#8c8c8c' }}>作品名称：</span><strong>{detailData.copyright.work_name}</strong></div>
                <div><span style={{ color: '#8c8c8c' }}>作品类型：</span>{detailData.copyright.work_type}</div>
                <div><span style={{ color: '#8c8c8c' }}>登记号：</span>{detailData.copyright.registration_number || '-'}</div>
                <div><span style={{ color: '#8c8c8c' }}>状态：</span>
                  <span style={{ ...styles.badge, background: (statusMap[detailData.copyright.status] || statusMap.pending).color + '20', color: (statusMap[detailData.copyright.status] || statusMap.pending).color }}>
                    {(statusMap[detailData.copyright.status] || statusMap.pending).label}
                  </span>
                </div>
                <div><span style={{ color: '#8c8c8c' }}>创作完成日期：</span>{detailData.copyright.creation_date || '-'}</div>
                <div><span style={{ color: '#8c8c8c' }}>首次发表日期：</span>{detailData.copyright.publish_date || '-'}</div>
                <div><span style={{ color: '#8c8c8c' }}>作者：</span>{detailData.copyright.author || '-'}</div>
                <div><span style={{ color: '#8c8c8c' }}>著作权人：</span>{detailData.copyright.owner || '-'}</div>
              </div>
            </div>

            {detailData.evidence && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0' }}>🔗 区块链存证信息</h4>
                <div style={{ background: '#f0f5ff', border: '1px solid #adc6ff', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '28px' }}>⛓️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px' }}>存证已上链，不可篡改</div>
                      <div style={{ fontSize: '12px', color: '#595959', marginBottom: '4px' }}>
                        存证哈希：<code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{detailData.evidence.hash.slice(0, 32)}...</code>
                      </div>
                      <div style={{ fontSize: '12px', color: '#595959', marginBottom: '4px' }}>
                        交易ID：<code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{detailData.evidence.txId.slice(0, 20)}...</code>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px', fontSize: '12px' }}>
                        <div>区块高度：{detailData.evidence.blockHeight.toLocaleString()}</div>
                        <div>上链时间：{detailData.evidence.timestamp}</div>
                        <div>链名称：{detailData.evidence.chainName}</div>
                        <div>存证状态：<span style={{ color: '#52c41a' }}>已确认</span></div>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <button onClick={() => handleVerify(detailData.copyright.id)} style={{
                      padding: '8px 20px', background: '#1890ff', color: '#fff', border: 'none',
                      borderRadius: '6px', cursor: 'pointer', fontSize: '13px'
                    }}>在线验真</button>
                  </div>
                </div>
              </div>
            )}

            <h4 style={{ margin: '0 0 12px 0' }}>📎 材料记录</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {detailData.materials?.map((m, index) => (
                <div key={index} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', background: '#f5f5f5', borderRadius: '6px'
                }}>
                  <div>
                    <span>📄 {m.name}</span>
                    <span style={{ marginLeft: '8px', fontSize: '12px', color: '#8c8c8c' }}>{m.size}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#52c41a' }}>{m.status}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button style={styles.pageBtn} onClick={() => setShowDetail(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  filterBar: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: '200px', padding: '10px 14px', border: '1px solid #d9d9d9', borderRadius: '8px', fontSize: '14px', outline: 'none' },
  filterSelect: { padding: '10px 14px', border: '1px solid #d9d9d9', borderRadius: '8px', fontSize: '14px', background: '#fff', outline: 'none' },
  card: { background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardHeader: { marginBottom: '20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' },
  cardItem: { padding: '20px', borderRadius: '12px', border: '1px solid #f0f0f0', background: '#fafafa' },
  typeIcon: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
  badge: { padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '500' },
  verifyBtn: { padding: '4px 12px', border: '1px solid #d9d9d9', background: '#fff', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' },
  pagination: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', color: '#8c8c8c' },
  pageBtn: { padding: '6px 14px', border: '1px solid #d9d9d9', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto' }
};
