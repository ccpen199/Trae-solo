import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../api/modules';
import { useToast, useUser } from '../App';
import Header from '../components/Header';

const STATUS_TABS = [
  { v: 'all', label: '全部' },
  { v: 'pending', label: '待支付' },
  { v: 'paid', label: '待充值' },
  { v: 'recharging', label: '充值中' },
  { v: 'completed', label: '已完成' },
  { v: 'failed', label: '已失败' }
];

const STATUS_MAP: Record<string, { text: string; cls: string }> = {
  pending: { text: '待支付', cls: 'tag-orange' },
  paid: { text: '待充值', cls: 'tag-blue' },
  recharging: { text: '充值中', cls: 'tag-blue' },
  completed: { text: '已完成', cls: 'tag-green' },
  failed: { text: '已失败', cls: 'tag-red' },
  retrying: { text: '重试中', cls: 'tag-orange' },
  channel_switch: { text: '切换通道', cls: 'tag-blue' }
};

export default function Orders() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useUser();
  const [status, setStatus] = useState('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    setPage(1);
    setOrders([]);
    loadOrders(1, true);
  }, [status]);

  const loadOrders = async (p: number, reset = false) => {
    if (!user) return;
    setLoading(true);
    try {
      const res: any = await orderApi.list({ status, page: p, pageSize: 15 });
      if (res.success) {
        const list = reset ? res.data.list : [...orders, ...res.data.list];
        setOrders(list);
        setHasMore(res.data.hasMore);
      }
    } catch (e: any) {
      toast.show(e.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (t: number) => {
    if (!t) return '-';
    const d = new Date(t * 1000);
    return `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const doPay = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res: any = await orderApi.pay(id);
      if (res.success) {
        toast.show('支付成功', 'success');
        loadOrders(1, true);
      }
    } catch (e: any) {
      toast.show(e.message || '支付失败', 'error');
    }
  };

  const doRetry = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res: any = await orderApi.retry(id);
      if (res.success) {
        toast.show('已发起重试', 'success');
        setTimeout(() => loadOrders(1, true), 1000);
      }
    } catch (e: any) {
      toast.show(e.message || '重试失败', 'error');
    }
  };

  return (
    <div>
      <Header title="我的订单" showBack={false} />

      <div style={{ display: 'flex', overflowX: 'auto', padding: '8px 16px', gap: 8, background: 'white' }}>
        {STATUS_TABS.map(t => (
          <button key={t.v} onClick={() => setStatus(t.v)} style={{
            padding: '8px 14px', borderRadius: 18, fontSize: 13, flexShrink: 0,
            background: status === t.v ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f5f5f5',
            color: status === t.v ? 'white' : '#666', fontWeight: status === t.v ? 600 : 500
          }}>{t.label}</button>
        ))}
      </div>

      {orders.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <div>暂无订单</div>
          <button className="btn-primary mt-16" onClick={() => navigate('/')}>去逛逛</button>
        </div>
      ) : (
        <>
          {orders.map(o => {
            const s = STATUS_MAP[o.status] || { text: o.status, cls: 'tag-gray' };
            return (
              <div key={o.id} className="card" onClick={() => navigate(`/order/${o.id}`)}>
                <div className="flex-between mb-12">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 10,
                      background: 'linear-gradient(135deg, #667eea22, #764ba222)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#667eea'
                    }}>{o.product_name?.slice(0, 4)}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{o.product_name}</div>
                      <div className="text-sm text-gray mt-8">{formatTime(o.created_at)} · {o.order_no}</div>
                    </div>
                  </div>
                  <span className={`tag ${s.cls}`}>{s.text}</span>
                </div>

                <div className="divider" />

                <div className="flex-between text-sm">
                  <span className="text-gray">充值账号</span>
                  <span className="text-bold">{o.recharge_account}</span>
                </div>
                <div className="flex-between text-sm mt-8">
                  <span className="text-gray">数量</span>
                  <span>×{o.quantity}</span>
                </div>
                <div className="flex-between text-sm mt-8">
                  <span className="text-gray">订单金额</span>
                  <span>
                    {o.discount_amount > 0 && <span className="text-gray" style={{ textDecoration: 'line-through', marginRight: 8 }}>¥{o.original_amount}</span>}
                    <span className="text-red text-bold">¥{o.final_amount}</span>
                  </span>
                </div>

                {(o.status === 'pending' || o.status === 'failed' || o.status === 'retrying') && (
                  <>
                    <div className="divider" />
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      {o.status === 'pending' && (
                        <button className="btn-primary" onClick={(e) => doPay(e, o.id)}>立即支付</button>
                      )}
                      {o.status === 'failed' && (
                        <button className="btn-primary" onClick={(e) => doRetry(e, o.id)}>重新充值</button>
                      )}
                      <span className="tag tag-gray" style={{ padding: '8px 16px' }}>订单详情</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          <div style={{ padding: 20, textAlign: 'center' }}>
            {loading ? <span className="text-gray">加载中...</span> :
              hasMore ? <button onClick={() => { setPage(p => p + 1); loadOrders(page + 1); }} className="text-blue">加载更多</button> :
                <span className="text-gray">—— 到底了 ——</span>}
          </div>
        </>
      )}
    </div>
  );
}
