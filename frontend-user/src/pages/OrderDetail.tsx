import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { orderApi } from '../api/modules';
import { useToast } from '../App';
import Header from '../components/Header';

const STATUS_MAP: Record<string, { text: string; cls: string; desc: string }> = {
  pending: { text: '待支付', cls: 'tag-orange', desc: '请完成支付后系统将自动充值' },
  paid: { text: '待充值', cls: 'tag-blue', desc: '支付成功，等待系统处理' },
  recharging: { text: '充值中', cls: 'tag-blue', desc: '正在为您充值，请耐心等待' },
  completed: { text: '已完成', cls: 'tag-green', desc: '充值成功，感谢您的使用' },
  failed: { text: '已失败', cls: 'tag-red', desc: '充值失败，建议重新充值或联系客服' },
  retrying: { text: '重试中', cls: 'tag-orange', desc: '检测到失败，正在自动重试' },
  channel_switch: { text: '切换通道', cls: 'tag-blue', desc: '正在切换备用通道' }
};

const FLOW_STEPS = [
  { key: 'pending', label: '提交订单' },
  { key: 'paid', label: '支付完成' },
  { key: 'recharging', label: '充值处理' },
  { key: 'completed', label: '充值成功' }
];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [order, setOrder] = useState<any>(null);
  const [cards, setCards] = useState<any>(null);
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [showCards, setShowCards] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      if (order && ['paid', 'recharging', 'retrying', 'channel_switch'].includes(order.status)) loadData();
    }, 5000);
    return () => clearInterval(timer);
  }, [id]);

  const loadData = async () => {
    try {
      const res: any = await orderApi.detail(id!);
      if (res.success) {
        setOrder(res.data);
        if (res.data.status === 'failed') {
          const diagRes: any = await orderApi.diagnostic(id!);
          if (diagRes.success) setDiagnostic(diagRes.data);
        }
      }
    } catch (e: any) {
      toast.show(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getCards = async () => {
    try {
      const res: any = await orderApi.getCards(id!);
      if (res.success) {
        setCards(res.data);
        setShowCards(true);
      }
    } catch (e: any) { toast.show(e.message, 'error'); }
  };

  const doPay = async () => {
    orderApi.pay(id!).then((res: any) => {
      if (res.success) { toast.show('支付成功', 'success'); loadData(); }
    }).catch((e: any) => toast.show(e.message, 'error'));
  };

  const doRetry = async () => {
    try {
      const res: any = await orderApi.retry(id!);
      if (res.success) { toast.show('已发起重试', 'success'); setTimeout(loadData, 1000); }
    } catch (e: any) { toast.show(e.message, 'error'); }
  };

  if (loading || !order) return <div><Header title="订单详情" /><div className="empty-state"><div className="icon">⏳</div>加载中...</div></div>;

  const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const activeStep = ['pending', 'paid', 'recharging', 'retrying', 'channel_switch', 'completed'].indexOf(order.status);

  return (
    <div style={{ paddingBottom: 100 }}>
      <Header title="订单详情" />

      <div style={{
        padding: '24px 20px',
        background: order.status === 'completed' ? 'linear-gradient(135deg, #52c41a, #73d13d)' :
          order.status === 'failed' ? 'linear-gradient(135deg, #ff4d4f, #ff7875)' :
            'linear-gradient(135deg, #1890ff, #40a9ff)',
        color: 'white'
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{order.status === 'failed' ? '❌ ' : order.status === 'completed' ? '✅ ' : '⏳ '}{status.text}</div>
        <div style={{ opacity: 0.9, fontSize: 13 }}>{status.desc}</div>
        {order.fail_reason && order.status === 'failed' && (
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85, background: 'rgba(0,0,0,0.1)', padding: '8px 12px', borderRadius: 8 }}>
            失败原因：{order.fail_reason}
          </div>
        )}
      </div>

      {order.status !== 'failed' && (
        <div className="card" style={{ marginTop: 0, borderRadius: 0 }}>
          <div className="order-status-flow">
            {FLOW_STEPS.map((step, idx) => {
              const stepIdx = idx;
              const done = order.status === 'completed' ? true : stepIdx <= (order.status === 'pending' ? 0 : order.status === 'paid' ? 1 : 2);
              const active = stepIdx === (order.status === 'pending' ? 0 : order.status === 'paid' ? 1 : order.status === 'completed' ? 3 : 2);
              return (
                <div key={step.key} className={`flow-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
                  <div className="flow-circle">{done ? '✓' : idx + 1}</div>
                  <div className="flow-label">{step.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {diagnostic && order.status === 'failed' && (
        <div className="card">
          <div className="text-bold mb-12">🔍 智能诊断结果</div>
          <div style={{
            background: '#fff1f0', padding: 14, borderRadius: 12, border: '1px solid #ffa39e'
          }}>
            <div style={{ fontWeight: 600, color: '#ff4d4f', marginBottom: 8 }}>
              {diagnostic.userMessage}
            </div>
            {diagnostic.suggestions?.length > 0 && (
              <div style={{ fontSize: 13, color: '#8c8c8c', marginTop: 8 }}>
                {diagnostic.suggestions.map((s: string, i: number) => <div key={i}>• {s}</div>)}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 0 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12,
            background: 'linear-gradient(135deg, #667eea22, #764ba222)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 600, color: '#667eea'
          }}>
            {order.product_name?.slice(0, 4)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{order.product_name}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              单价 ¥{order.unit_price} × {order.quantity}
            </div>
          </div>
          <span className={`tag ${status.cls}`}>{status.text}</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        <div className="text-bold mb-12">📋 订单信息</div>
        <div className="flex-between text-sm"><span className="text-gray">订单编号</span><span>{order.order_no}</span></div>
        <div className="flex-between text-sm mt-8"><span className="text-gray">充值账号</span><span className="text-bold">{order.recharge_account}</span></div>
        <div className="flex-between text-sm mt-8"><span className="text-gray">商品原价</span><span>¥{order.original_amount}</span></div>
        {order.discount_amount > 0 && <div className="flex-between text-sm mt-8"><span className="text-gray">优惠金额</span><span className="text-green">-¥{order.discount_amount}</span></div>}
        <div className="divider" />
        <div className="flex-between">
          <span className="text-bold">实付金额</span>
          <span style={{ color: '#ff4d4f', fontSize: 20, fontWeight: 800 }}>¥{order.final_amount}</span>
        </div>
      </div>

      {order.sku_type === 'card' && order.status === 'completed' && (
        <div className="card" style={{ marginTop: 0 }}>
          <div className="flex-between mb-12">
            <span className="text-bold">🎫 卡密信息</span>
            <button onClick={getCards} className="text-blue text-sm" style={{ fontWeight: 600 }}>
              {cards ? '重新查看' : '点击查看'}
            </button>
          </div>
          {showCards && cards && cards.length > 0 ? (
            cards.map((c: any, i: number) => (
              <div key={i} style={{
                background: '#fffbe6',
                padding: 14,
                borderRadius: 10,
                border: '1px solid #ffe58f',
                fontFamily: 'monospace',
                marginBottom: i < cards.length - 1 ? 10 : 0
              }}>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ color: '#8c8c8c' }}>卡号：</span>
                  <span style={{ fontWeight: 600, letterSpacing: 1 }}>{c.cardNumber}</span>
                </div>
                <div>
                  <span style={{ color: '#8c8c8c' }}>密码：</span>
                  <span style={{ fontWeight: 600, letterSpacing: 1 }}>{c.cardPassword}</span>
                </div>
              </div>
            ))
          ) : showCards ? (
            <div className="text-sm text-gray">暂无卡密信息，请稍后重试</div>
          ) : (
            <div className="text-sm text-gray" style={{ color: '#faad14' }}>
              ⚠️ 卡密信息敏感，请妥善保管，泄露自负
            </div>
          )}
        </div>
      )}

      {order.status === 'completed' && order.commission_amount > 0 && (
        <div className="card" style={{ marginTop: 0 }}>
          <div className="text-bold mb-12">💰 佣金收益</div>
          <div style={{
            background: '#f6ffed',
            padding: 14, borderRadius: 12,
            border: '1px solid #b7eb8f',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: 13, color: '#52c41a', fontWeight: 600 }}>本次佣金到账 ¥{order.commission_amount}</div>
              <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>佣金将在订单完成后自动结算至分享者账户</div>
            </div>
            <div style={{ fontSize: 24 }}>🎁</div>
          </div>
        </div>
      )}

      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'white', padding: '12px 16px 20px',
        borderTop: '1px solid #eee',
        display: 'flex', gap: 10,
        zIndex: 100
      }}>
        {order.status === 'pending' && (
          <button className="btn-primary btn-block" onClick={doPay}>立即支付 ¥{order.final_amount}
          </button>
        )}
        {order.status === 'failed' && (
          <>
            <button style={{
              flex: 1, padding: 14, borderRadius: 14, background: '#f5f5f5',
              color: '#666'
            }} onClick={() => navigate('/orders')}>我的订单
            </button>
            <button className="btn-primary btn-block" style={{ flex: 1 }} onClick={doRetry}>重新充值
            </button>
          </>
        )}
        {order.status === 'completed' && (
          <>
            <button style={{
            flex: 1, padding: 14, borderRadius: 14, background: '#f5f5f5',
            color: '#666'
          }} onClick={() => navigate('/')}>继续购物
          </button>
            <button className="btn-primary btn-block" style={{ flex: 1 }} onClick={() => navigate('/share')}>
          去分享赚钱
        </button>
          </>
        )}
        {['paid', 'recharging', 'retrying', 'channel_switch'].includes(order.status) && (
          <button className="btn-primary btn-block" onClick={loadData}>
            刷新状态
          </button>
        )}
      </div>
    </div>
  );
}
