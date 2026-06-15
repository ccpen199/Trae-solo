import { useEffect, useState } from 'react';
import api from '../api';
import { useApp } from '../App';
import { Pagination, Modal } from './Products';

const STATUS_MAP: Record<string, { text: string; cls: string }> = {
  pending: { text: '待支付', cls: 'tag-orange' },
  paid: { text: '待充值', cls: 'tag-blue' },
  recharging: { text: '充值中', cls: 'tag-blue' },
  completed: { text: '已完成', cls: 'tag-green' },
  failed: { text: '已失败', cls: 'tag-red' },
  refunded: { text: '已退款', cls: 'tag-gray' }
};

export default function Orders() {
  const { showToast } = useApp();
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState({ keyword: '', status: 'all' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [page, filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: 20 };
      if (filter.status !== 'all') params.status = filter.status;
      if (filter.keyword) params.keyword = filter.keyword;
      const res: any = await api.get('/admin/orders', { params });
      if (res.success) { setOrders(res.data.list || []); setTotal(res.data.total || 0); }
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const showDetail = (order: any) => {
    setDetail(order);
  };

  const statsCards = [
    { label: '全部订单', value: total, icon: '📋', color: '#6366f1', status: 'all' },
    { label: '待支付', value: orders.filter(o => o.status === 'pending').length, icon: '⏳', color: '#f59e0b', status: 'pending' },
    { label: '充值中', value: orders.filter(o => o.status === 'recharging' || o.status === 'paid').length, icon: '⚡', color: '#3b82f6', status: 'recharging' },
    { label: '已完成', value: orders.filter(o => o.status === 'completed').length, icon: '✅', color: '#10b981', status: 'completed' },
    { label: '已失败', value: orders.filter(o => o.status === 'failed').length, icon: '❌', color: '#ef4444', status: 'failed' }
  ];

  return (
    <div>
      <div className="search-bar">
        <input className="form-input" placeholder="订单号/手机号/账号" value={filter.keyword}
          onChange={e => { setPage(1); setFilter({ ...filter, keyword: e.target.value }); }} style={{ maxWidth: 280 }} />
        <select className="form-select" value={filter.status}
          onChange={e => { setPage(1); setFilter({ ...filter, status: e.target.value }); }}>
          <option value="all">全部状态</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.text}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn btn-default" onClick={() => showToast('导出中...', 'info')}>📥 导出</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 20 }}>
        {statsCards.map((card, i) => (
          <div key={i} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => { setPage(1); setFilter({ ...filter, status: card.status }); }}>
            <div className="label">{card.label}</div>
            <div className="value">{card.value}</div>
            <div className="icon" style={{ color: card.color }}>{card.icon}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
          <thead>
            <tr>
              <th>订单号</th>
              <th>商品</th>
              <th>用户</th>
              <th>充值账号</th>
              <th>数量</th>
              <th>金额</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={9} className="empty"><div className="empty-icon">⏳</div>加载中...</td></tr> :
            orders.length === 0 ? <tr><td colSpan={9} className="empty"><div className="empty-icon">📋</div>暂无订单</td></tr> :
            orders.map(o => {
              const s = STATUS_MAP[o.status] || { text: o.status, cls: 'tag-gray' };
              return (
                <tr key={o.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{o.order_no}</td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.product_name}</td>
                  <td>
                    {o.user_phone ? o.user_phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '-'}
                    {o.user_name && <div style={{ fontSize: 11, color: '#94a3b8' }}>{o.user_name}</div>}
                  </td>
                  <td style={{ fontFamily: 'monospace' }}>{o.recharge_account}</td>
                  <td>×{o.quantity}</td>
                  <td style={{ fontWeight: 600, color: '#ef4444' }}>¥{o.final_amount}</td>
                  <td><span className={`tag ${s.cls}`}>{s.text}</span></td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>
                    {o.created_at ? new Date((o.created_at || 0) * 1000).toLocaleString('zh-CN') : '-'}
                  </td>
                  <td>
                    <button className="btn btn-default btn-sm" onClick={() => showDetail(o)}>详情</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={total} onChange={setPage} pageSize={20} />

      {detail && (
        <Modal title={`订单详情 · ${detail.order_no}`} width="640px" onClose={() => setDetail(null)} onOk={() => setDetail(null)} okText="关闭">
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, padding: 16, borderRadius: 12,
            background: detail.status === 'completed' ? '#f0fdf4' : detail.status === 'failed' ? '#fef2f2' : '#eff6ff' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>订单状态</div>
              <span className={`tag ${STATUS_MAP[detail.status]?.cls || 'tag-gray'}`} style={{ fontSize: 14, padding: '4px 12px' }}>
                {STATUS_MAP[detail.status]?.text || detail.status}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>实付金额</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444' }}>¥{detail.final_amount}</div>
            </div>
          </div>

          <div className="grid-2">
            <div>
              <div className="text-sm text-muted mb-8">商品信息</div>
              <div className="card" style={{ margin: 0, padding: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{detail.product_name}</div>
                <div className="flex-between text-sm mb-8">
                  <span className="text-muted">商品类型</span>
                  <span className="tag tag-cyan">{detail.sku_type === 'card' ? '卡密类' : '直充类'}</span>
                </div>
                <div className="flex-between text-sm mb-8"><span className="text-muted">单价</span>¥{Number(detail.final_amount || 0) / (detail.quantity || 1).toFixed(2)}</div>
                <div className="flex-between text-sm mb-8"><span className="text-muted">数量</span>×{detail.quantity}</div>
                <div className="flex-between text-sm"><span className="text-muted">供应商</span>{detail.supplier_name || '-'}</div>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted mb-8">订单信息</div>
              <div className="card" style={{ margin: 0, padding: 14 }}>
                <div className="flex-between text-sm mb-8"><span className="text-muted">订单号</span><span style={{ fontFamily: 'monospace' }}>{detail.order_no}</span></div>
                <div className="flex-between text-sm mb-8"><span className="text-muted">充值账号</span><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{detail.recharge_account}</span></div>
                <div className="flex-between text-sm mb-8"><span className="text-muted">用户手机号</span>{detail.user_phone || '-'}</div>
                <div className="flex-between text-sm mb-8"><span className="text-muted">创建时间</span>{detail.created_at ? new Date(detail.created_at * 1000).toLocaleString('zh-CN') : '-'}</div>
                <div className="flex-between text-sm"><span className="text-muted">完成时间</span>{detail.finish_time ? new Date(detail.finish_time * 1000).toLocaleString('zh-CN') : '-'}</div>
              </div>
            </div>
          </div>

          {detail.status === 'failed' && detail.fail_reason && (
            <div style={{ marginTop: 16 }}>
              <div className="text-sm text-muted mb-8">🔍 失败原因</div>
              <div style={{ padding: 14, background: '#fff7ed', borderRadius: 12, border: '1px solid #fed7aa' }}>
                <div style={{ color: '#92400e', fontWeight: 500 }}>{detail.fail_reason}</div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <div className="text-sm text-muted mb-8">💰 金额明细</div>
            <div className="card" style={{ margin: 0, padding: 14 }}>
              <div className="flex-between text-sm mb-8"><span className="text-muted">商品总价</span>¥{Number(detail.final_amount || 0).toFixed(2)}</div>
              <div style={{ height: 1, background: '#f1f5f9', margin: '8px 0' }}></div>
              <div className="flex-between"><span style={{ fontWeight: 600 }}>实付金额</span><span style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>¥{Number(detail.final_amount || 0).toFixed(2)}</span></div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
