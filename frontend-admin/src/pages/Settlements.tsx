import { useEffect, useState } from 'react';
import api from '../api';
import { useApp } from '../App';
import { Pagination, Modal } from './Products';

const STATUS_MAP: Record<string, { text: string; cls: string }> = {
  pending: { text: '待确认', cls: 'tag-orange' },
  confirmed: { text: '已确认', cls: 'tag-blue' },
  paid: { text: '已付款', cls: 'tag-green' },
  invoiced: { text: '已开票', cls: 'tag-purple' }
};

export default function Settlements() {
  const { showToast } = useApp();
  const [list, setList] = useState<any[]>([]);
  const [filter, setFilter] = useState({ supplierId: '', status: 'all' });
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [page, filter]);
  useEffect(() => { api.get('/admin/suppliers').then((r: any) => { if (r.success) setSuppliers(r.data || []); }); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: 15 };
      if (filter.supplierId) params.supplierId = filter.supplierId;
      if (filter.status !== 'all') params.status = filter.status;
      const res: any = await api.get('/admin/settlements', { params });
      if (res.success) { setList(res.data.list || []); setTotal(res.data.total || 0); }
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const generate = async () => {
    if (!confirm('确定生成本月结算单？')) return;
    try {
      const res: any = await api.post('/admin/settlements/generate');
      if (res.success) {
        showToast(`成功生成 ${res.data.length} 份结算单`, 'success');
        loadData();
      }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const doConfirm = async (id: string) => {
    if (!confirm('确认该结算单金额？')) return;
    try {
      const res: any = await api.post(`/admin/settlements/${id}/confirm`);
      if (res.success) { showToast('确认成功', 'success'); loadData(); if (detail?.id === id) showDetail(id); }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const doPaid = async (id: string) => {
    if (!confirm('标记为已付款？')) return;
    try {
      const res: any = await api.post(`/admin/settlements/${id}/paid`);
      if (res.success) { showToast('已标记付款', 'success'); loadData(); if (detail?.id === id) showDetail(id); }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const doInvoice = async (id: string) => {
    const info = prompt('请输入发票信息（JSON格式）', JSON.stringify({ type: '增值税专用发票', title: 'XX有限公司', taxNo: '', amount: detail?.settlement_amount, content: '服务费' }, null, 2));
    if (!info) return;
    try {
      let data;
      try { data = JSON.parse(info); } catch { return showToast('JSON格式错误', 'error'); }
      const res: any = await api.post(`/admin/settlements/${id}/invoice`, data);
      if (res.success) { showToast('已创建发票', 'success'); loadData(); }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const showDetail = async (id: string) => {
    try {
      const res: any = await api.get(`/admin/settlements/${id}`);
      if (res.success) setDetail(res.data);
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  return (
    <div>
      <div className="search-bar">
        <select className="form-select" value={filter.supplierId}
          onChange={e => { setPage(1); setFilter({ ...filter, supplierId: e.target.value }); }}>
          <option value="">全部供应商</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="form-select" value={filter.status}
          onChange={e => { setPage(1); setFilter({ ...filter, status: e.target.value }); }}>
          <option value="all">全部状态</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.text}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn btn-success" onClick={generate}>📊 生成本月结算</button>
        <button className="btn btn-warning" onClick={() => showToast('导出中...', 'info')}>📥 导出报表</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: '待确认结算', value: list.filter(s => s.status === 'pending').length, icon: '📋', color: '#f59e0b' },
          { label: '待付款金额', value: `¥${list.filter(s => s.status === 'confirmed').reduce((a, b) => a + (b.settlement_amount || 0), 0).toFixed(0)}`, icon: '💰', color: '#3b82f6' },
          { label: '本月已付款', value: `¥${list.filter(s => s.status === 'paid').reduce((a, b) => a + (b.settlement_amount || 0), 0).toFixed(0)}`, icon: '✅', color: '#10b981' },
          { label: '结算单数', value: list.length, icon: '📄', color: '#8b5cf6' }
        ].map((c, i) => (
          <div key={i} className="stat-card">
            <div className="label">{c.label}</div>
            <div className="value">{c.value}</div>
            <div className="icon" style={{ color: c.color }}>{c.icon}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
          <thead>
            <tr>
              <th>结算单号</th>
              <th>供应商</th>
              <th>账期</th>
              <th>订单数</th>
              <th>订单总额</th>
              <th>结算金额</th>
              <th>状态</th>
              <th>发票</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={10} className="empty"><div className="empty-icon">⏳</div>加载中...</td></tr> :
            list.length === 0 ? <tr><td colSpan={10} className="empty"><div className="empty-icon">💰</div>暂无结算单</td></tr> :
            list.map(s => {
              const st = STATUS_MAP[s.status] || { text: s.status, cls: 'tag-gray' };
              return (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>S{s.period}-{s.id?.slice(0, 6).toUpperCase()}</td>
                  <td>{s.supplier_name}</td>
                  <td style={{ fontWeight: 500 }}>{s.period?.slice(0, 4)}年{s.period?.slice(4)}月</td>
                  <td style={{ textAlign: 'center' }}>{s.total_orders}</td>
                  <td>¥{Number(s.total_amount).toFixed(2)}</td>
                  <td style={{ color: '#ef4444', fontWeight: 700 }}>¥{Number(s.settlement_amount).toFixed(2)}</td>
                  <td><span className={`tag ${st.cls}`}>{st.text}</span></td>
                  <td>
                    {s.invoice_no ? <span className="tag tag-purple">已开票</span> : <span className="tag tag-gray">未开</span>}
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{new Date((s.created_at || 0) * 1000).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-default btn-sm" onClick={() => showDetail(s.id)}>详情</button>
                      {s.status === 'pending' && <button className="btn btn-primary btn-sm" onClick={() => doConfirm(s.id)}>确认</button>}
                      {s.status === 'confirmed' && <button className="btn btn-success btn-sm" onClick={() => doPaid(s.id)}>付款</button>}
                      {!s.invoice_no && ['confirmed', 'paid'].includes(s.status) &&
                        <button className="btn btn-warning btn-sm" onClick={() => { showDetail(s.id); setTimeout(() => doInvoice(s.id), 200); }}>开票</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={total} onChange={setPage} />

      {detail && (
        <Modal title={`结算单详情 · ${detail.supplier_name}`} width="720px" onClose={() => setDetail(null)} onOk={() => setDetail(null)} okText="关闭">
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="card" style={{ margin: 0, padding: 16, background: '#f8fafc' }}>
              <div className="text-sm text-muted mb-8">结算周期</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{detail.period?.slice(0, 4)}年{detail.period?.slice(4)}月</div>
              <div className="divider" style={{ margin: '12px 0' }}></div>
              <div className="flex-between text-sm mb-8"><span className="text-muted">订单总数</span><b>{detail.total_orders}</b></div>
              <div className="flex-between text-sm"><span className="text-muted">订单总额</span><b>¥{Number(detail.total_amount).toFixed(2)}</b></div>
            </div>
            <div className="card" style={{ margin: 0, padding: 16, background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
              <div className="text-sm text-muted mb-8">结算金额（应付）</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#b45309' }}>¥{Number(detail.settlement_amount).toFixed(2)}</div>
              <div className="divider" style={{ margin: '12px 0', borderColor: '#fcd34d' }}></div>
              <div className="flex-between text-sm mb-8"><span className="text-muted">状态</span>
                <span className={`tag ${STATUS_MAP[detail.status]?.cls || 'tag-gray'}`}>{STATUS_MAP[detail.status]?.text || detail.status}</span>
              </div>
              <div className="flex-between text-sm"><span className="text-muted">发票状态</span>
                {detail.invoice_no ? <span className="tag tag-purple">{detail.invoice_no}</span> : <span className="tag tag-gray">未开票</span>}
              </div>
            </div>
          </div>

          <div className="card-header" style={{ padding: 0 }}>
            <div className="card-title">📋 结算明细（共{detail.items?.length || 0}笔订单）</div>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto', borderRadius: 12, border: '1px solid #f1f5f9' }}>
            <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
              <thead>
                <tr style={{ position: 'sticky', top: 0 }}>
                  <th>订单号</th>
                  <th>商品</th>
                  <th>订单金额</th>
                  <th>成本金额</th>
                </tr>
              </thead>
              <tbody>
                {detail.items?.map((it: any) => (
                  <tr key={it.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{it.order_no}</td>
                    <td>{it.product_name}</td>
                    <td>¥{Number(it.amount).toFixed(2)}</td>
                    <td>¥{Number(it.cost_amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            {detail.status === 'pending' && <button className="btn btn-primary" onClick={() => doConfirm(detail.id)}>✓ 确认结算</button>}
            {detail.status === 'confirmed' && <button className="btn btn-success" onClick={() => doPaid(detail.id)}>💰 标记付款</button>}
            {['confirmed', 'paid'].includes(detail.status) && <button className="btn btn-warning" onClick={() => doInvoice(detail.id)}>📄 开发票</button>}
          </div>
        </Modal>
      )}
    </div>
  );
}
