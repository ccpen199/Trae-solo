import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { formatCurrency, formatDateTime } from '../../lib/constants';

export default function LogisticsQuotations() {
  const { orderId } = useParams();
  const nav = useNavigate();
  const { user, enterprise } = useAuthStore();
  const [data, setData] = useState<any[]>([]);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(user?.role === 'carrier');
  const [form, setForm] = useState({
    pickup_address: '', delivery_address: '', distance_km: 0, weight_ton: 0,
    vehicle_type: '自卸货车', quoted_price: 0, estimated_days: 2, insurance_fee: 0
  });

  useEffect(() => {
    Promise.all([
      api.get(`/orders/${orderId}`).then((d: any) => setOrder(d.order)),
      api.get(`/logistics/order/${orderId}/quotations`)
    ]).then(([o, q]) => {
      setData(q as any);
      const d = (order || (o as any));
      if (d) {
        setForm(f => ({ ...f, pickup_address: d.region || d.delivery_address, delivery_address: d.delivery_address, weight_ton: d.quantity }));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [orderId]);

  const submitQuote = async () => {
    if (!form.pickup_address || !form.delivery_address || !form.distance_km || !form.weight_ton || !form.quoted_price) {
      alert('请完整填写物流报价信息'); return;
    }
    await api.post(`/logistics/order/${orderId}/quotations`, form);
    alert('报价已提交'); setShowForm(false); location.reload();
  };

  const acceptQuote = async (qid: string) => {
    if (!confirm('确认选择此物流方案？')) return;
    const r: any = await api.post(`/logistics/quotations/${qid}/accept`);
    alert(`已选择，运单号 ${r.tracking_no}`);
    nav(`/orders/${orderId}`);
  };

  if (loading || !order) return <div className="card p-16 text-center text-slate-400">加载中...</div>;

  const isSeller = order.seller_id === user?.id;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <Link to={`/orders/${orderId}`} className="text-sm text-slate-500 hover:text-primary-600 inline-flex items-center gap-1">← 返回订单</Link>

      <div className="card p-5">
        <h2 className="font-bold text-xl text-slate-900 mb-1">🚚 物流承运商比价调度</h2>
        <p className="text-sm text-slate-500">对接中储运 / 德邦 / 自有车队，多方案比价择优</p>
        <div className="mt-4 grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl text-sm">
          <div><div className="text-xs text-slate-400 mb-1">订单</div><div className="font-medium">DD-{orderId?.substring(0, 8).toUpperCase()}</div></div>
          <div><div className="text-xs text-slate-400 mb-1">货物</div><div className="font-medium">{order.category}/{order.sub_category}</div></div>
          <div><div className="text-xs text-slate-400 mb-1">重量</div><div className="font-medium">{order.quantity} 吨</div></div>
          <div><div className="text-xs text-slate-400 mb-1">目的地</div><div className="font-medium truncate">{order.delivery_address}</div></div>
        </div>
      </div>

      {user?.role === 'carrier' && enterprise?.verification_status === 'approved' && (
        <div className="card p-5 border-amber-200 bg-amber-50/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">➕ 我是承运商，提交报价</h3>
            {!showForm && <button onClick={() => setShowForm(true)} className="btn-outline">展开报价表单</button>}
          </div>
          {showForm && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2 md:col-span-2"><label className="label">提货地址</label><input value={form.pickup_address} onChange={e => setForm({ ...form, pickup_address: e.target.value })} className="input-field" /></div>
              <div className="col-span-2 md:col-span-2"><label className="label">送达地址</label><input value={form.delivery_address} onChange={e => setForm({ ...form, delivery_address: e.target.value })} className="input-field" /></div>
              <div><label className="label">里程 (km)</label><input type="number" value={form.distance_km} onChange={e => setForm({ ...form, distance_km: Number(e.target.value) })} className="input-field" /></div>
              <div><label className="label">货物重量 (吨)</label><input type="number" value={form.weight_ton} onChange={e => setForm({ ...form, weight_ton: Number(e.target.value) })} className="input-field" /></div>
              <div><label className="label">车型</label>
                <select value={form.vehicle_type} onChange={e => setForm({ ...form, vehicle_type: e.target.value })} className="input-field">
                  <option>自卸货车</option><option>平板半挂</option><option>厢式货车</option><option>集装箱车</option><option>危化品专用</option>
                </select>
              </div>
              <div><label className="label">预计天数</label><input type="number" value={form.estimated_days} onChange={e => setForm({ ...form, estimated_days: Number(e.target.value) })} className="input-field" /></div>
              <div><label className="label">报价 (元)</label><input type="number" value={form.quoted_price} onChange={e => setForm({ ...form, quoted_price: Number(e.target.value) })} className="input-field" /></div>
              <div><label className="label">保险费 (元)</label><input type="number" value={form.insurance_fee} onChange={e => setForm({ ...form, insurance_fee: Number(e.target.value) })} className="input-field" /></div>
              <div className="col-span-2 md:col-span-4 flex gap-2 justify-end">
                <button onClick={() => setShowForm(false)} className="btn-secondary px-6">取消</button>
                <button onClick={submitQuote} className="btn-primary px-8">提交报价</button>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? <div className="card p-16 text-center text-slate-400">加载中...</div> : data.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-3">📭</div>
          <div className="text-slate-600 mb-2">暂无物流报价</div>
          <div className="text-sm text-slate-400">稍等片刻，系统正在通知平台合作承运商（中储运/德邦等）报价</div>
        </div>
      ) : (
        <div className="space-y-3">
          {data.sort((a, b) => a.quoted_price - b.quoted_price).map((q, idx) => {
            const cheapest = idx === 0;
            const selected = q.status === 'accepted';
            return (
              <div key={q.id} className={`card p-5 card-hover relative overflow-hidden ${selected ? 'border-primary-400 bg-primary-50/30' : ''} ${cheapest ? 'ring-2 ring-emerald-200' : ''}`}>
                {cheapest && <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-green-500 text-white text-xs px-3 py-1 rounded-bl-xl font-medium">💰 最低价</div>}
                {selected && <div className="absolute top-0 right-0 bg-gradient-to-l from-primary-500 to-blue-500 text-white text-xs px-3 py-1 rounded-bl-xl font-medium">✓ 已选择</div>}
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3">
                    <div className="font-bold text-slate-900">{q.carrier_name}</div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {q.credit_rating && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 font-semibold">{q.credit_rating}</span>}
                      <span className="text-[11px] text-slate-500">{q.vehicle_count}辆车 · {q.service_regions?.substring(0, 20)}...</span>
                    </div>
                  </div>
                  <div className="col-span-1 text-center"><div className="text-xs text-slate-400 mb-1">里程</div><div className="font-semibold">{q.distance_km} km</div></div>
                  <div className="col-span-1 text-center"><div className="text-xs text-slate-400 mb-1">车型</div><div className="text-sm">{q.vehicle_type}</div></div>
                  <div className="col-span-1 text-center"><div className="text-xs text-slate-400 mb-1">时效</div><div className="font-semibold">{q.estimated_days}天</div></div>
                  <div className="col-span-2 text-center"><div className="text-xs text-slate-400 mb-1">运费</div><div className={`text-xl font-bold ${cheapest ? 'text-emerald-600' : 'text-slate-800'}`}>{formatCurrency(q.quoted_price)}</div></div>
                  <div className="col-span-2 text-center"><div className="text-xs text-slate-400 mb-1">保险费</div><div className="font-semibold">{formatCurrency(q.insurance_fee || 0)}</div></div>
                  <div className="col-span-2 text-right">
                    <div className="text-xs text-slate-400 mb-2">发布于 {formatDateTime(q.created_at)}</div>
                    {isSeller && q.status === 'pending' && (
                      <button onClick={() => acceptQuote(q.id)} className={`${cheapest ? 'btn-primary' : 'btn-outline'} px-5 py-2`}>
                        {cheapest ? '✓ 选择此方案' : '选择方案'}
                      </button>
                    )}
                    {q.status === 'rejected' && <span className="text-xs text-slate-400">未选中</span>}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-4 flex-wrap">
                  <span>📍 提货: {q.pickup_address}</span>
                  <span>→</span>
                  <span>📍 送达: {q.delivery_address}</span>
                  <span className="ml-auto">报价有效期至 {formatDateTime(q.expired_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
