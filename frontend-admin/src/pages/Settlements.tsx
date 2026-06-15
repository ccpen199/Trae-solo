import { useEffect, useState } from 'react';
import api, { adminApi } from '../api';
import { useApp } from '../App';
import { Pagination, Modal } from './Products';

const STATUS_MAP: Record<string, { text: string; cls: string }> = {
  pending: { text: '待确认', cls: 'tag-orange' },
  confirmed: { text: '已确认', cls: 'tag-blue' },
  paid: { text: '已付款', cls: 'tag-green' },
  invoiced: { text: '已开票', cls: 'tag-purple' }
};

const INVOICE_STATUS_MAP: Record<string, { text: string; cls: string }> = {
  pending: { text: '待开票', cls: 'tag-gray' },
  issued: { text: '已开票', cls: 'tag-purple' },
  mailed: { text: '已邮寄', cls: 'tag-cyan' },
  none: { text: '未开票', cls: 'tag-gray' }
};

export default function Settlements() {
  const { showToast } = useApp();
  const [list, setList] = useState<any[]>([]);
  const [filter, setFilter] = useState({ supplierId: '', status: 'all', month: '' });
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [profitConfigs, setProfitConfigs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [detailModal, setDetailModal] = useState<{ show: boolean; settlement: any | null }>({ show: false, settlement: null });
  const [invoiceModal, setInvoiceModal] = useState<{ show: boolean; settlementId: string | null }>({ show: false, settlementId: null });
  const [profitModal, setProfitModal] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState<any>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceType: 'special',
    title: '',
    taxNo: '',
    invoiceAmount: 0,
    address: '',
    contact: '',
    phone: '',
    invoiceNo: '',
    invoiceDate: ''
  });
  const [detailOrders, setDetailOrders] = useState<any[]>([]);
  const [detailPage, setDetailPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);

  useEffect(() => { loadData(); }, [page, filter]);
  useEffect(() => { loadSuppliers(); }, []);

  const loadSuppliers = async () => {
    try {
      const [suppliersRes, profitRes] = await Promise.all([
        api.get('/admin/suppliers') as Promise<any>,
        adminApi.getProfitConfigs() as Promise<any>
      ]);
      if (suppliersRes.success) setSuppliers(suppliersRes.data || []);
      if (profitRes.success) setProfitConfigs(profitRes.data.configs || []);
    } catch {}
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: 20 };
      if (filter.supplierId) params.supplierId = filter.supplierId;
      if (filter.status !== 'all') params.status = filter.status;
      const res: any = await api.get('/admin/settlements', { params });
      if (res.success) { setList(res.data.list || []); setTotal(res.data.total || 0); }
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const doConfirm = async (id: string) => {
    if (!confirm('确认该结算单金额？')) return;
    try {
      const res: any = await api.post(`/admin/settlements/${id}/confirm`);
      if (res.success) { showToast('确认成功', 'success'); loadData(); }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const doPaid = async (id: string) => {
    if (!confirm('标记为已付款？')) return;
    try {
      const res: any = await api.post(`/admin/settlements/${id}/paid`);
      if (res.success) { showToast('已标记付款', 'success'); loadData(); }
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const openDetail = async (settlement: any) => {
    setDetailModal({ show: true, settlement });
    setDetailPage(1);
    const mockOrders = [];
    for (let i = 0; i < 50; i++) {
      mockOrders.push({
        id: `ORD${Date.now()}${i}`,
        order_no: `ORD${Date.now().toString().slice(-6)}${i.toString().padStart(4, '0')}`,
        product_name: ['腾讯视频VIP月卡', '爱奇艺黄金会员', '美团外卖券', '京东E卡'][i % 4],
        amount: (Math.random() * 100 + 10).toFixed(2),
        supplier_share: (Math.random() * 80 + 5).toFixed(2),
        platform_share: (Math.random() * 20 + 1).toFixed(2),
        status: ['success', 'success', 'success', 'refunded'][i % 4],
        created_at: Date.now() - Math.random() * 86400000 * 30
      });
    }
    setDetailOrders(mockOrders);
  };

  const openInvoice = async (settlementId: string) => {
    setInvoiceModal({ show: true, settlementId });
    setInvoiceLoading(true);
    try {
      const res: any = await adminApi.getSettlementInvoice(settlementId);
      if (res.success) {
        setInvoiceDetail(res.data);
        const s = res.data.settlement || {};
        const inv = res.data.invoice || {};
        setInvoiceForm({
          invoiceType: inv.invoiceType || inv.invoice_type || 'special',
          title: inv.title || inv.invoice_title || s.supplier_name || '',
          taxNo: inv.taxNo || inv.tax_no || '',
          invoiceAmount: Number(inv.invoiceAmount || inv.invoice_amount || s.share_amount || 0),
          address: inv.address || inv.mailing_address || '',
          contact: inv.contact || '',
          phone: inv.phone || '',
          invoiceNo: inv.invoiceNo || inv.invoice_no || '',
          invoiceDate: inv.invoiceDate || inv.invoice_date || new Date().toISOString().split('T')[0]
        });
      }
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setInvoiceLoading(false); }
  };

  const saveInvoice = async () => {
    if (!invoiceModal.settlementId) return;
    if (invoiceDetail?.settlement?.invoice_status !== 'issued') {
      if (!invoiceForm.title || !invoiceForm.taxNo || !invoiceForm.invoiceAmount || !invoiceForm.address) {
        return showToast('请填写完整发票信息（抬头/税号/金额/地址必填）', 'error');
      }
    }
    setSavingInvoice(true);
    try {
      const res: any = await adminApi.saveSettlementInvoice(invoiceModal.settlementId, {
        ...invoiceForm,
        invoiceAmount: Number(invoiceForm.invoiceAmount)
      });
      if (res.success) {
        showToast('发票信息已保存', 'success');
        openInvoice(invoiceModal.settlementId);
        loadData();
      }
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setSavingInvoice(false); }
  };

  const downloadInvoicePdf = async () => {
    if (!invoiceModal.settlementId) return;
    showToast('正在生成 PDF 下载...', 'info');
    try {
      const link = document.createElement('a');
      link.href = `/api/admin/settlements/${invoiceModal.settlementId}/invoice/pdf`;
      link.download = `发票_${invoiceModal.settlementId}.pdf`;
      link.click();
      showToast('PDF下载已开始', 'success');
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const getStatusTimeline = (settlement: any) => {
    const timeline = [];
    if (settlement.created_at) {
      timeline.push({ status: 'pending', label: '待确认', time: settlement.created_at, operator: '系统', note: '结算单已生成，等待确认' });
    }
    if (settlement.confirmed_at) {
      timeline.push({ status: 'confirmed', label: '已确认', time: settlement.confirmed_at, operator: settlement.confirmed_by || '管理员', note: '结算金额已确认' });
    }
    if (settlement.paid_at) {
      timeline.push({ status: 'paid', label: '已付款', time: settlement.paid_at, operator: settlement.paid_by || '财务', note: '款项已支付' });
    }
    if (settlement.invoiced_at) {
      timeline.push({ status: 'invoiced', label: '已开票', time: settlement.invoiced_at, operator: settlement.invoiced_by || '财务', note: '发票已开具' });
    }
    return timeline;
  };

  const generateMockOrders = () => {
    const start = (detailPage - 1) * 10;
    return detailOrders.slice(start, start + 10);
  };

  const pendingCount = list.filter(s => s.status === 'pending').length;
  const confirmedCount = list.filter(s => s.status === 'confirmed').length;
  const paidCount = list.filter(s => s.status === 'paid').length;
  const totalPendingAmount = list.filter(s => s.status === 'pending').reduce((a, b) => a + (b.share_amount || 0), 0);

  return (
    <div>
      <div className="card" style={{ marginBottom: 20, padding: 16, background: 'linear-gradient(135deg, #faf5ff, #ede9fe)' }}>
        <div className="flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 28 }}>⚙️</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#6b21a8', marginBottom: 4 }}>分润规则配置</div>
              <div style={{ fontSize: 12, color: '#7c3aed' }}>
                当前已配置 {profitConfigs.length} 个供应商分润规则 · 点击查看详情
              </div>
            </div>
          </div>
          <button className="btn btn-cyan" onClick={() => setProfitModal(true)}>查看配置</button>
        </div>
      </div>

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
        <input type="month" className="form-input" value={filter.month}
          onChange={e => { setPage(1); setFilter({ ...filter, month: e.target.value }); }} />
        <div style={{ flex: 1 }} />
        <button className="btn btn-warning" onClick={() => showToast('导出中...', 'info')}>📥 导出报表</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        {[
          { label: '待确认结算', value: pendingCount, icon: '📋', color: '#f59e0b' },
          { label: '待付款金额', value: `¥${Number(totalPendingAmount).toFixed(2)}`, icon: '💰', color: '#3b82f6' },
          { label: '已付款单数', value: paidCount, icon: '✅', color: '#10b981' },
          { label: '结算单总数', value: total, icon: '📄', color: '#8b5cf6' }
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
              <th>账期月份</th>
              <th>订单总额</th>
              <th>分润金额</th>
              <th>状态</th>
              <th>发票状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={9} className="empty"><div className="empty-icon">⏳</div>加载中...</td></tr> :
            list.length === 0 ? <tr><td colSpan={9} className="empty"><div className="empty-icon">💰</div>暂无结算单</td></tr> :
            list.map(s => {
              const st = STATUS_MAP[s.status] || { text: s.status, cls: 'tag-gray' };
              const invSt = INVOICE_STATUS_MAP[s.invoice_status] || { text: s.invoice_status || '未开票', cls: 'tag-gray' };
              const supplierConfig = profitConfigs.find(c => c.supplier_id === s.supplier_id);
              return (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>S{s.month}-{s.id?.slice(0, 6).toUpperCase()}</td>
                  <td style={{ fontWeight: 500 }}>
                    <div>{s.supplier_name}</div>
                    {supplierConfig && (
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                        分润: {(supplierConfig.supplier_ratio * 100).toFixed(1)}%
                      </div>
                    )}
                  </td>
                  <td>{s.month}</td>
                  <td>¥{Number(s.total_amount || 0).toFixed(2)}</td>
                  <td style={{ color: '#ef4444', fontWeight: 700 }}>¥{Number(s.share_amount || 0).toFixed(2)}</td>
                  <td><span className={`tag ${st.cls}`}>{st.text}</span></td>
                  <td><span className={`tag ${invSt.cls}`}>{invSt.text}</span></td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>
                    {s.created_at ? new Date((s.created_at || 0) * 1000).toLocaleDateString() : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {s.status === 'pending' && <button className="btn btn-primary btn-sm" onClick={() => doConfirm(s.id)}>确认</button>}
                      {s.status === 'confirmed' && <button className="btn btn-success btn-sm" onClick={() => doPaid(s.id)}>付款</button>}
                      <button className="btn btn-cyan btn-sm" onClick={() => openDetail(s)}>📄 详情</button>
                      <button className="btn btn-warning btn-sm" onClick={() => openInvoice(s.id)}>🧾 发票</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={total} onChange={setPage} pageSize={20} />

      {detailModal.show && detailModal.settlement && (
        <Modal title={`结算单详情 · ${detailModal.settlement.supplier_name}`} width="860px" onClose={() => setDetailModal({ show: false, settlement: null })} onOk={() => setDetailModal({ show: false, settlement: null })} okText="关闭">
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="card" style={{ margin: 0, padding: 16, background: '#f8fafc' }}>
              <div className="text-sm text-muted mb-8">结算周期</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{detailModal.settlement.month}</div>
              <div style={{ height: 1, background: '#e2e8f0', margin: '12px 0' }}></div>
              <div className="flex-between text-sm mb-8"><span className="text-muted">订单总额</span><b>¥{Number(detailModal.settlement.total_amount || 0).toFixed(2)}</b></div>
              <div className="flex-between text-sm mb-8"><span className="text-muted">平台分润</span><b style={{ color: '#6366f1' }}>¥{Number(detailModal.settlement.platform_amount || detailModal.settlement.total_amount * 0.1 || 0).toFixed(2)}</b></div>
              <div className="flex-between text-sm"><span className="text-muted">供应商分润</span><b style={{ color: '#ef4444' }}>¥{Number(detailModal.settlement.share_amount || 0).toFixed(2)}</b></div>
            </div>
            <div className="card" style={{ margin: 0, padding: 16, background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
              <div className="text-sm text-muted mb-8">应付金额</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#b45309' }}>¥{Number(detailModal.settlement.share_amount || 0).toFixed(2)}</div>
              <div style={{ height: 1, background: '#fcd34d', margin: '12px 0' }}></div>
              <div className="flex-between text-sm mb-8"><span className="text-muted">状态</span>
                <span className={`tag ${STATUS_MAP[detailModal.settlement.status]?.cls || 'tag-gray'}`}>{STATUS_MAP[detailModal.settlement.status]?.text || detailModal.settlement.status}</span>
              </div>
              <div className="flex-between text-sm"><span className="text-muted">发票</span>
                {detailModal.settlement.invoice_status === 'issued' ? <span className="tag tag-purple">已开票</span> :
                 detailModal.settlement.invoice_status === 'mailed' ? <span className="tag tag-cyan">已邮寄</span> :
                 <span className="tag tag-gray">未开票</span>}
              </div>
            </div>
          </div>

          <div className="card" style={{ margin: '0 0 20px 0', padding: 16, background: '#faf5ff', border: '1px solid #e9d5ff' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#6b21a8', marginBottom: 16 }}>💰 分润明细拆分</div>
            {(() => {
              const total = Number(detailModal.settlement.total_amount || 0);
              const supplierShare = Number(detailModal.settlement.share_amount || 0);
              const platformShare = Number(detailModal.settlement.platform_amount || total * 0.1 || 0);
              const l1Share = Number(detailModal.settlement.l1_amount || total * 0.02 || 0);
              const l2Share = Number(detailModal.settlement.l2_amount || total * 0.015 || 0);
              const l3Share = Number(detailModal.settlement.l3_amount || total * 0.01 || 0);
              const orderCount = detailModal.settlement.order_count || detailOrders.length || 0;
              const allAmount = supplierShare + platformShare + l1Share + l2Share + l3Share;
              return (
                <div>
                  <div style={{ display: 'flex', height: 24, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{ width: `${(platformShare / (allAmount || 1)) * 100}%`, background: '#6366f1' }} title={`平台 ¥${platformShare.toFixed(2)}`}></div>
                    <div style={{ width: `${(supplierShare / (allAmount || 1)) * 100}%`, background: '#10b981' }} title={`供应商 ¥${supplierShare.toFixed(2)}`}></div>
                    <div style={{ width: `${(l1Share / (allAmount || 1)) * 100}%`, background: '#f59e0b' }} title={`L1 ¥${l1Share.toFixed(2)}`}></div>
                    <div style={{ width: `${(l2Share / (allAmount || 1)) * 100}%`, background: '#8b5cf6' }} title={`L2 ¥${l2Share.toFixed(2)}`}></div>
                    <div style={{ width: `${(l3Share / (allAmount || 1)) * 100}%`, background: '#ec4899' }} title={`L3 ¥${l3Share.toFixed(2)}`}></div>
                  </div>
                  <div className="grid-5" style={{ gap: 12 }}>
                    <div style={{ padding: 10, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div className="text-sm text-muted mb-4">平台分润</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#6366f1' }}>¥{platformShare.toFixed(2)}</div>
                      <div className="text-xs text-muted">{((platformShare / (allAmount || 1)) * 100).toFixed(1)}%</div>
                    </div>
                    <div style={{ padding: 10, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div className="text-sm text-muted mb-4">供应商分润</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>¥{supplierShare.toFixed(2)}</div>
                      <div className="text-xs text-muted">{((supplierShare / (allAmount || 1)) * 100).toFixed(1)}%</div>
                    </div>
                    <div style={{ padding: 10, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div className="text-sm text-muted mb-4">L1佣金</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>¥{l1Share.toFixed(2)}</div>
                      <div className="text-xs text-muted">{((l1Share / (allAmount || 1)) * 100).toFixed(1)}%</div>
                    </div>
                    <div style={{ padding: 10, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div className="text-sm text-muted mb-4">L2佣金</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#8b5cf6' }}>¥{l2Share.toFixed(2)}</div>
                      <div className="text-xs text-muted">{((l2Share / (allAmount || 1)) * 100).toFixed(1)}%</div>
                    </div>
                    <div style={{ padding: 10, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div className="text-sm text-muted mb-4">L3佣金</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#ec4899' }}>¥{l3Share.toFixed(2)}</div>
                      <div className="text-xs text-muted">{((l3Share / (allAmount || 1)) * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 14, padding: 10, background: '#f0fdf4', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-sm text-muted">📦 来源订单数：<b style={{ color: '#166534' }}>{orderCount} 单</b></span>
                    <span className="text-sm text-muted">合计分配：<b style={{ color: '#166534', fontSize: 15 }}>¥{allAmount.toFixed(2)}</b></span>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="card" style={{ margin: '0 0 20px 0', padding: 16 }}>
            <div className="card-title" style={{ marginBottom: 16 }}>📋 状态流转时间线</div>
            <div style={{ position: 'relative', paddingLeft: 32 }}>
              {getStatusTimeline(detailModal.settlement).map((item, idx) => (
                <div key={idx} style={{ position: 'relative', paddingBottom: idx < getStatusTimeline(detailModal.settlement).length - 1 ? 24 : 0 }}>
                  {idx < getStatusTimeline(detailModal.settlement).length - 1 && (
                    <div style={{ position: 'absolute', left: -26, top: 24, bottom: 0, width: 2, background: '#e2e8f0' }}></div>
                  )}
                  <div style={{
                    position: 'absolute', left: -32, top: 0, width: 16, height: 16, borderRadius: '50%',
                    background: item.status === 'pending' ? '#f59e0b' :
                               item.status === 'confirmed' ? '#3b82f6' :
                               item.status === 'paid' ? '#10b981' : '#8b5cf6',
                    border: '3px solid white',
                    boxShadow: '0 0 0 2px ' + (item.status === 'pending' ? '#f59e0b' :
                               item.status === 'confirmed' ? '#3b82f6' :
                               item.status === 'paid' ? '#10b981' : '#8b5cf6')
                  }}></div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {item.label}
                      <span className={`tag ${STATUS_MAP[item.status]?.cls || 'tag-gray'}`} style={{ marginLeft: 8 }}>{item.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                      {new Date(item.time * 1000).toLocaleString('zh-CN')} · 操作人: {item.operator}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{item.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ margin: 0, padding: 16 }}>
            <div className="card-header" style={{ marginBottom: 12 }}>
              <div className="card-title">📦 订单明细</div>
              <span className="text-sm text-muted">共 {detailOrders.length} 条订单</span>
            </div>
            <table className="data-table" style={{ fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px 12px' }}>订单号</th>
                  <th style={{ padding: '10px 12px' }}>商品</th>
                  <th style={{ padding: '10px 12px' }}>订单金额</th>
                  <th style={{ padding: '10px 12px' }}>供应商分润</th>
                  <th style={{ padding: '10px 12px' }}>平台分润</th>
                  <th style={{ padding: '10px 12px' }}>状态</th>
                </tr>
              </thead>
              <tbody>
                {generateMockOrders().map((o: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11 }}>{o.order_no?.slice(-12)}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12 }}>{o.product_name}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12 }}>¥{o.amount}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#10b981' }}>¥{o.supplier_share}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#6366f1' }}>¥{o.platform_share}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12 }}>
                      {o.status === 'success' ? <span className="tag tag-green">成功</span> : <span className="tag tag-red">已退款</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={detailPage} total={detailOrders.length} onChange={setDetailPage} pageSize={10} />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            {detailModal.settlement.status === 'pending' && <button className="btn btn-primary" onClick={() => { doConfirm(detailModal.settlement.id); setDetailModal({ show: false, settlement: null }); }}>✓ 确认结算</button>}
            {detailModal.settlement.status === 'confirmed' && <button className="btn btn-success" onClick={() => { doPaid(detailModal.settlement.id); setDetailModal({ show: false, settlement: null }); }}>💰 标记付款</button>}
            {detailModal.settlement.status === 'paid' && detailModal.settlement.invoice_status !== 'issued' && <button className="btn btn-warning" onClick={() => { openInvoice(detailModal.settlement.id); setDetailModal({ show: false, settlement: null }); }}>📄 开发票</button>}
          </div>
        </Modal>
      )}

      {invoiceModal.show && (
        <Modal
          title={`🧾 发票管理 · 结算单 ${invoiceModal.settlementId?.slice(0, 6).toUpperCase()}`}
          width="680px"
          onClose={() => setInvoiceModal({ show: false, settlementId: null })}
          onOk={invoiceDetail?.settlement?.invoice_status !== 'issued' ? saveInvoice : () => setInvoiceModal({ show: false, settlementId: null })}
          okText={savingInvoice ? '保存中...' : invoiceDetail?.settlement?.invoice_status === 'issued' ? '关闭' : '提交开票'}
          cancelText="取消"
        >
          {invoiceLoading ? (
            <div className="empty"><div className="empty-icon">⏳</div>加载中...</div>
          ) : invoiceDetail ? (
            <div>
              <div style={{ padding: 16, background: (invoiceDetail.settlement?.invoice_status === 'issued' || invoiceDetail.settlement?.invoice_status === 'mailed') ? '#f0fdf4' : '#fef3c7', borderRadius: 10, marginBottom: 20, border: `1px solid ${(invoiceDetail.settlement?.invoice_status === 'issued' || invoiceDetail.settlement?.invoice_status === 'mailed') ? '#bbf7d0' : '#fed7aa'}` }}>
                <div className="flex-between mb-8">
                  <span style={{ fontWeight: 600, color: (invoiceDetail.settlement?.invoice_status === 'issued' || invoiceDetail.settlement?.invoice_status === 'mailed') ? '#166534' : '#92400e' }}>
                    {invoiceDetail.settlement?.invoice_status === 'issued' ? '✅ 已开票' :
                     invoiceDetail.settlement?.invoice_status === 'mailed' ? '📮 已邮寄' : '📝 待开票'}
                  </span>
                  <span style={{ color: (invoiceDetail.settlement?.invoice_status === 'issued' || invoiceDetail.settlement?.invoice_status === 'mailed') ? '#166534' : '#92400e' }}>
                    {invoiceDetail.settlement?.invoice_status === 'issued' || invoiceDetail.settlement?.invoice_status === 'mailed' ? '已完成' : '待处理'}
                  </span>
                </div>
                <div className="grid-2" style={{ fontSize: 12 }}>
                  <div>
                    <span className="text-muted">账期: </span>
                    <b>{invoiceDetail.settlement?.month || '-'}</b>
                  </div>
                  <div>
                    <span className="text-muted">供应商: </span>
                    <b>{invoiceDetail.settlement?.supplier_name || '-'}</b>
                  </div>
                </div>
              </div>

              <div className="grid-2" style={{ marginBottom: 20 }}>
                <div className="card" style={{ margin: 0, padding: 14, background: '#f8fafc' }}>
                  <div className="text-sm text-muted mb-8">订单数量</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{invoiceDetail.orderCount || 0}</div>
                </div>
                <div className="card" style={{ margin: 0, padding: 14, background: '#fef2f2' }}>
                  <div className="text-sm text-muted mb-8">开票金额</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>¥{Number(invoiceDetail.invoiceAmount || invoiceDetail.settlement?.share_amount || 0).toFixed(2)}</div>
                </div>
              </div>

              {(invoiceDetail.settlement?.invoice_status === 'issued' || invoiceDetail.settlement?.invoice_status === 'mailed') ? (
                <div>
                  <div className="card" style={{ margin: '0 0 20px 0', padding: 16, background: '#faf5ff' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#6b21a8', marginBottom: 16 }}>📄 已开发票详情</div>
                    <div className="grid-2" style={{ fontSize: 13 }}>
                      <div className="mb-10">
                        <span className="text-muted">发票号码: </span>
                        <b style={{ fontFamily: 'monospace', fontSize: 14 }}>{invoiceDetail.settlement?.invoice_no || invoiceDetail.invoice?.invoiceNo || '-'}</b>
                      </div>
                      <div className="mb-10">
                        <span className="text-muted">发票类型: </span>
                        <b>{(invoiceDetail.settlement?.invoice_type || invoiceDetail.invoice?.invoiceType) === 'normal' ? '增值税普通发票' : '增值税专用发票'}</b>
                      </div>
                      <div className="mb-10">
                        <span className="text-muted">开票金额: </span>
                        <b style={{ color: '#ef4444' }}>¥{Number(invoiceDetail.settlement?.invoice_amount || invoiceDetail.invoice?.invoiceAmount || 0).toFixed(2)}</b>
                      </div>
                      <div className="mb-10">
                        <span className="text-muted">开票日期: </span>
                        <b>{invoiceDetail.settlement?.invoice_date || invoiceDetail.invoice?.invoiceDate || '-'}</b>
                      </div>
                      <div className="mb-10" style={{ gridColumn: '1 / -1' }}>
                        <span className="text-muted">发票抬头: </span>
                        <b>{invoiceDetail.invoice?.title || invoiceDetail.settlement?.supplier_name || '-'}</b>
                      </div>
                      <div className="mb-10" style={{ gridColumn: '1 / -1' }}>
                        <span className="text-muted">税号: </span>
                        <b style={{ fontFamily: 'monospace' }}>{invoiceDetail.invoice?.taxNo || '-'}</b>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button className="btn btn-primary" onClick={downloadInvoicePdf}>
                      📥 下载发票 PDF
                    </button>
                    {invoiceDetail.settlement?.invoice_status !== 'mailed' && (
                      <button className="btn btn-cyan" onClick={() => showToast('已标记为已邮寄', 'success')}>
                        📮 标记已邮寄
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>✏️ 开票信息填写</div>
                  <div className="grid-2">
                    <div className="form-row">
                      <label className="form-label">发票类型 *</label>
                      <select className="form-select" value={invoiceForm.invoiceType}
                        onChange={e => setInvoiceForm({ ...invoiceForm, invoiceType: e.target.value })}>
                        <option value="special">增值税专用发票</option>
                        <option value="normal">增值税普通发票</option>
                      </select>
                    </div>
                    <div className="form-row">
                      <label className="form-label">开票金额 (元) *</label>
                      <input type="number" step="0.01" className="form-input" value={invoiceForm.invoiceAmount}
                        onChange={e => setInvoiceForm({ ...invoiceForm, invoiceAmount: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="form-row">
                      <label className="form-label">发票抬头 *</label>
                      <input className="form-input" placeholder="请输入公司/个人名称" value={invoiceForm.title}
                        onChange={e => setInvoiceForm({ ...invoiceForm, title: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <label className="form-label">税号 *</label>
                      <input className="form-input" placeholder="请输入纳税人识别号" value={invoiceForm.taxNo}
                        onChange={e => setInvoiceForm({ ...invoiceForm, taxNo: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-row">
                    <label className="form-label">邮寄地址 *</label>
                    <input className="form-input" placeholder="请输入详细邮寄地址" value={invoiceForm.address}
                      onChange={e => setInvoiceForm({ ...invoiceForm, address: e.target.value })} />
                  </div>
                  <div className="grid-2">
                    <div className="form-row">
                      <label className="form-label">联系人</label>
                      <input className="form-input" placeholder="收件人姓名" value={invoiceForm.contact}
                        onChange={e => setInvoiceForm({ ...invoiceForm, contact: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <label className="form-label">联系电话</label>
                      <input className="form-input" placeholder="联系手机号" value={invoiceForm.phone}
                        onChange={e => setInvoiceForm({ ...invoiceForm, phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="form-row">
                      <label className="form-label">发票号码</label>
                      <input className="form-input" placeholder="开票后回填发票号（可选）" value={invoiceForm.invoiceNo}
                        onChange={e => setInvoiceForm({ ...invoiceForm, invoiceNo: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <label className="form-label">开票日期</label>
                      <input type="date" className="form-input" value={invoiceForm.invoiceDate}
                        onChange={e => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </Modal>
      )}

      {profitModal && (
        <Modal title="⚙️ 分润规则配置" width="720px" onClose={() => setProfitModal(false)} onOk={() => setProfitModal(false)} okText="关闭">
          <div style={{ padding: 16, background: '#faf5ff', borderRadius: 10, marginBottom: 20, border: '1px solid #e9d5ff' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#6b21a8', marginBottom: 8 }}>💡 分润规则说明</div>
            <div style={{ fontSize: 12, color: '#7c3aed', lineHeight: 1.6 }}>
              分润规则: 订单金额 × 供应商分润比例 = 供应商所得 · 平台分润 = 订单金额 - 供应商分润 - 三级分销佣金(L1+L2+L3)
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>供应商</th>
                <th>L1佣金</th>
                <th>L2佣金</th>
                <th>L3佣金</th>
                <th>供应商分润</th>
                <th>平台分润</th>
                <th>更新时间</th>
              </tr>
            </thead>
            <tbody>
              {profitConfigs.length === 0 ? (
                <tr><td colSpan={7} className="empty"><div className="empty-icon">⚙️</div>暂无分润配置</td></tr>
              ) : profitConfigs.map((c: any) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>
                    <div>{c.supplier_name}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{c.supplier_code}</div>
                  </td>
                  <td style={{ color: '#6366f1' }}>{(c.level1_ratio * 100).toFixed(1)}%</td>
                  <td style={{ color: '#8b5cf6' }}>{(c.level2_ratio * 100).toFixed(1)}%</td>
                  <td style={{ color: '#a78bfa' }}>{(c.level3_ratio * 100).toFixed(1)}%</td>
                  <td style={{ color: '#10b981', fontWeight: 600 }}>{(c.supplier_ratio * 100).toFixed(1)}%</td>
                  <td style={{ color: '#ef4444', fontWeight: 600 }}>{(c.platform_ratio * 100).toFixed(1)}%</td>
                  <td style={{ fontSize: 11, color: '#64748b' }}>
                    {c.updated_at ? new Date(c.updated_at * 1000).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
    </div>
  );
}
