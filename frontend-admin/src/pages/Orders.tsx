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
  retrying: { text: '重试中', cls: 'tag-orange' },
  channel_switch: { text: '切换通道', cls: 'tag-purple' }
};

export default function Orders() {
  const { showToast } = useApp();
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState({ keyword: '', status: 'all', startDate: '', endDate: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [page, filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: 15, ...filter };
      if (filter.status === 'all') delete params.status;
      if (!filter.keyword) delete params.keyword;
      if (!filter.startDate) delete params.startDate;
      if (!filter.endDate) delete params.endDate;
      const res: any = await api.get('/orders/admin/list', { params });
      if (res.success) { setOrders(res.data.list || []); setTotal(res.data.total || 0); }
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const showDetail = async (id: string) => {
    try {
      const res: any = await api.get(`/orders/${id}`);
      if (res.success) setDetail(res.data);
    } catch (e: any) { showToast(e.message, 'error'); }
  };

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
        <input type="date" className="form-input" value={filter.startDate}
          onChange={e => setFilter({ ...filter, startDate: e.target.value })} />
        <span className="text-muted" style={{ alignSelf: 'center' }}>至</span>
        <input type="date" className="form-input" value={filter.endDate}
          onChange={e => setFilter({ ...filter, endDate: e.target.value })} />
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
              <th>佣金</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={10} className="empty"><div className="empty-icon">⏳</div>加载中...</td></tr> :
            orders.length === 0 ? <tr><td colSpan={10} className="empty"><div className="empty-icon">📋</div>暂无订单</td></tr> :
            orders.map(o => {
              const s = STATUS_MAP[o.status] || { text: o.status, cls: 'tag-gray' };
              return (
                <tr key={o.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{o.order_no}</td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.product_name}</td>
                  <td>{o.user_phone ? o.user_phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '-'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{o.recharge_account}</td>
                  <td>×{o.quantity}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#ef4444' }}>¥{o.final_amount}</div>
                    {o.discount_amount > 0 && <div style={{ fontSize: 11, color: '#94a3b8' }}>优惠¥{o.discount_amount}</div>}
                  </td>
                  <td style={{ color: '#10b981', fontWeight: 500 }}>+¥{o.commission_amount}</td>
                  <td><span className={`tag ${s.cls}`}>{s.text}</span></td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>{new Date((o.created_at || 0) * 1000).toLocaleString('zh-CN')}</td>
                  <td>
                    <button className="btn btn-default btn-sm" onClick={() => showDetail(o.id)}>详情</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} total={total} onChange={setPage} />

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
                <div className="flex-between text-sm mb-8"><span className="text-muted">单价</span>¥{detail.unit_price}</div>
                <div className="flex-between text-sm mb-8"><span className="text-muted">数量</span>×{detail.quantity}</div>
                <div className="flex-between text-sm"><span className="text-muted">供应商</span>{detail.supplier_name || '-'}</div>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted mb-8">订单信息</div>
              <div className="card" style={{ margin: 0, padding: 14 }}>
                <div className="flex-between text-sm mb-8"><span className="text-muted">订单号</span><span style={{ fontFamily: 'monospace' }}>{detail.order_no}</span></div>
                <div className="flex-between text-sm mb-8"><span className="text-muted">充值账号</span><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{detail.recharge_account}</span></div>
                <div className="flex-between text-sm mb-8"><span className="text-muted">供应商单号</span><span style={{ fontFamily: 'monospace' }}>{detail.supplier_order_id || '-'}</span></div>
                <div className="flex-between text-sm"><span className="text-muted">重试次数</span>{detail.retry_count || 0}</div>
              </div>
            </div>
          </div>

          {detail.status === 'failed' && (
            <div style={{ marginTop: 16 }}>
              <div className="text-sm text-muted mb-8">🔍 智能诊断</div>
              <div style={{ padding: 14, background: '#fff7ed', borderRadius: 12, border: '1px solid #fed7aa' }}>
                {detail.diagnostic_result ? (
                  <div>
                    <div style={{ fontWeight: 600, color: '#c2410c', marginBottom: 6 }}>
                      {detail.diagnostic_result.userMessage || detail.fail_reason}
                    </div>
                    {detail.diagnostic_result.suggestions?.length > 0 && (
                      <div className="text-sm" style={{ marginTop: 8, color: '#92400e' }}>
                        <div style={{ marginBottom: 4, fontWeight: 500 }}>建议方案：</div>
                        {detail.diagnostic_result.suggestions.map((s: string, i: number) => <div key={i}>• {s}</div>)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm" style={{ color: '#92400e' }}>
                    失败原因：{detail.fail_reason || '未知'}
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <div className="text-sm text-muted mb-8">💰 金额明细</div>
            <div className="card" style={{ margin: 0, padding: 14 }}>
              <div className="flex-between text-sm mb-8"><span className="text-muted">商品总价</span>¥{detail.original_amount}</div>
              {detail.discount_amount > 0 && <div className="flex-between text-sm mb-8"><span className="text-muted">优惠金额</span><span className="text-success">-¥{detail.discount_amount}</span></div>}
              <div className="flex-between text-sm mb-8"><span className="text-muted">佣金</span><span className="text-success">¥{detail.commission_amount}</span></div>
              <div style={{ height: 1, background: '#f1f5f9', margin: '8px 0' }}></div>
              <div className="flex-between"><span style={{ fontWeight: 600 }}>实付金额</span><span style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>¥{detail.final_amount}</span></div>
            </div>
          </div>

          {detail.sku_type === 'card' && detail.status === 'completed' && detail.cards?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div className="text-sm text-muted mb-8">🎫 卡密信息</div>
              {detail.cards.map((c: any, i: number) => (
                <div key={i} style={{ padding: 12, background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f', marginBottom: 8, fontFamily: 'monospace' }}>
                  卡号：<b>{c.cardNumber}</b> &nbsp; 密码：<b>{c.cardPassword}</b>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
