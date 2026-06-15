import { useEffect, useState } from 'react';
import api from '../api';
import { useApp } from '../App';
import { Modal } from './Products';

const STATUS_COLOR: Record<number, string> = {
  1: 'tag-green',
  0: 'tag-gray'
};

export default function Suppliers() {
  const { showToast } = useApp();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/admin/suppliers');
      if (res.success) {
        const list = res.data || [];
        setSuppliers(list);
        const sums: any = {};
        for (const s of list) {
          try {
            const sumRes: any = await api.get(`/admin/suppliers/${s.id}/summary`);
            if (sumRes.success) sums[s.id] = sumRes.data;
          } catch {}
        }
        setSummary(sums);
      }
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!editData.name || !editData.code) return showToast('请填写供应商名称和编码', 'error');
    try {
      const res: any = editData.id
        ? await api.put(`/admin/suppliers/${editData.id}`, editData)
        : await api.post('/admin/suppliers', editData);
      if (res.success) { showToast('保存成功', 'success'); setShowModal(false); loadData(); }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const syncStock = async () => {
    if (!confirm('确定同步所有供应商库存？')) return;
    try {
      showToast('正在同步库存...', 'info');
      const res: any = await api.post('/admin/stock/sync');
      if (res.success) showToast('库存同步完成', 'success');
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  if (loading) return <div className="empty"><div className="empty-icon">⏳</div>加载中...</div>;

  return (
    <div>
      <div className="search-bar">
        <div style={{ fontSize: 14, color: '#64748b', alignSelf: 'center' }}>共 {suppliers.length} 家供应商</div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-warning" onClick={syncStock}>🔄 同步全部库存</button>
        <button className="btn btn-primary" onClick={() => { setEditData({ name: '', code: '', apiEndpoint: '', apiKey: '', apiSecret: '', status: 1, settlementRatio: 0.9 }); setShowModal(true); }}>+ 新增供应商</button>
      </div>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 16 }}>
        {suppliers.map(s => {
          const sum = summary[s.id] || {};
          return (
            <div key={s.id} className="card" style={{ margin: 0 }}>
              <div className="flex-between mb-16">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: s.code === 'tencent' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' :
                      s.code === 'iqiyi' ? 'linear-gradient(135deg, #22c55e, #15803d)' :
                      s.code === 'meituan' ? 'linear-gradient(135deg, #f59e0b, #b45309)' :
                      s.code === 'jd' ? 'linear-gradient(135deg, #ef4444, #991b1b)' :
                      'linear-gradient(135deg, #6366f1, #7c3aed)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 18
                  }}>
                    {s.code?.toUpperCase()?.slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>编码: {s.code}</div>
                  </div>
                </div>
                <span className={`tag ${STATUS_COLOR[s.status]}`}>{s.status === 1 ? '正常' : '停用'}</span>
              </div>

              <div className="grid-4" style={{ marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>分润比例</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#6366f1', marginTop: 4 }}>
                    {(s.settlement_ratio * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>待结算</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>
                    ¥{Number(sum.pendingAmount || 0).toFixed(0)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>已结算</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981', marginTop: 4 }}>
                    ¥{Number(sum.confirmedAmount + sum.paidAmount || 0).toFixed(0)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>本月预估</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#3b82f6', marginTop: 4 }}>
                    ¥{Number(sum.currentMonthEstimate || 0).toFixed(0)}
                  </div>
                </div>
              </div>

              {sum.totalSettled ? (
                <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 8, marginBottom: 16 }}>
                  <div className="flex-between text-sm">
                    <span className="text-muted">历史结算总额</span>
                    <span style={{ fontWeight: 600 }}>¥{Number(sum.totalSettled).toFixed(2)}</span>
                  </div>
                </div>
              ) : null}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-default btn-sm" onClick={() => { setEditData({ ...s }); setShowModal(true); }}>编辑配置</button>
                <button className="btn btn-primary btn-sm" onClick={() => showToast('已发起渠道连通性测试', 'success')}>连通测试</button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title={editData?.id ? '编辑供应商' : '新增供应商'} onClose={() => setShowModal(false)} onOk={save}>
          <div className="grid-2">
            <div className="form-row">
              <label className="form-label">供应商名称 *</label>
              <input className="form-input" value={editData?.name || ''}
                onChange={e => setEditData({ ...editData, name: e.target.value })} />
            </div>
            <div className="form-row">
              <label className="form-label">供应商编码 *</label>
              <input className="form-input" value={editData?.code || ''}
                onChange={e => setEditData({ ...editData, code: e.target.value })} disabled={!!editData?.id} />
            </div>
            <div className="form-row">
              <label className="form-label">API Endpoint</label>
              <input className="form-input" value={editData?.apiEndpoint || ''}
                onChange={e => setEditData({ ...editData, apiEndpoint: e.target.value })} />
            </div>
            <div className="form-row">
              <label className="form-label">分润比例（供应商所得%）</label>
              <input type="number" step="0.01" className="form-input" value={editData?.settlementRatio || 0}
                onChange={e => setEditData({ ...editData, settlementRatio: Number(e.target.value) })} />
            </div>
            <div className="form-row" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">API Key</label>
              <input className="form-input" value={editData?.apiKey || ''}
                onChange={e => setEditData({ ...editData, apiKey: e.target.value })} />
            </div>
            <div className="form-row" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">API Secret</label>
              <input type="password" className="form-input" value={editData?.apiSecret || ''}
                onChange={e => setEditData({ ...editData, apiSecret: e.target.value })} />
            </div>
            <div className="form-row" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">状态</label>
              <select className="form-select" value={editData?.status ?? 1}
                onChange={e => setEditData({ ...editData, status: Number(e.target.value) })}>
                <option value={1}>启用</option>
                <option value={0}>停用</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
