import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { LOGISTICS_STATUS, formatDateTime } from '../../lib/constants';

export default function CarrierOrders() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/logistics/carrier/orders').then(d => { setData(d as any); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const update = async (id: string, status: string, location: string, desc: string) => {
    await api.post(`/logistics/logistics/${id}/update`, { status, location, description: desc });
    location.reload();
  };

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <h2 className="text-xl font-bold text-slate-900 mb-1">🚚 承运任务中心</h2>
        <p className="text-sm text-slate-500">管理您已中标的物流运输订单</p>
      </div>

      {loading ? <div className="card p-16 text-center text-slate-400">加载中...</div> : data.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-3">🚛</div>
          <div className="text-slate-600 mb-2">暂无承运任务</div>
          <div className="text-sm text-slate-400">前往订单报价页提交报价获取承运任务</div>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map(l => {
            const st = LOGISTICS_STATUS[l.status];
            return (
              <div key={l.id} className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`status-badge ${st?.color}`}>{st?.label}</span>
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{l.tracking_no}</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      {l.category} · {l.sub_category} · {l.quantity}吨
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 mb-1">运输报价</div>
                    <div className="text-xl font-bold text-amber-600">¥{l.quoted_price?.toLocaleString()}</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                  <div><div className="text-xs text-slate-400 mb-0.5">买方</div><div className="truncate" title={l.buyer_name}>{l.buyer_name}</div></div>
                  <div><div className="text-xs text-slate-400 mb-0.5">卖方</div><div className="truncate" title={l.seller_name}>{l.seller_name}</div></div>
                  <div><div className="text-xs text-slate-400 mb-0.5">司机/车牌</div><div>{l.driver_name || '-'} · {l.vehicle_no || '-'}</div></div>
                  <div><div className="text-xs text-slate-400 mb-0.5">当前位置</div><div className="truncate">{l.current_location || '---'}</div></div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 flex items-center gap-3 mb-4">
                  <span>📍</span><span>{l.pickup_address}</span>
                  <span className="text-slate-400">→</span>
                  <span>📍</span><span>{l.delivery_address}</span>
                  <span className="ml-auto text-slate-400">预计 {l.estimated_days} 天 · {l.distance_km}km</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {l.status === 'pending_pickup' && <button onClick={() => update(l.id, 'picked_up', l.pickup_address, '货物已成功揽收，正在装车分拣')} className="btn-primary px-4 py-2 text-sm">✓ 确认揽收</button>}
                  {l.status === 'picked_up' && <button onClick={() => update(l.id, 'in_transit', '高速途中', '货物正常运输中，预计按时到达')} className="btn-primary px-4 py-2 text-sm">🚛 更新为运输中</button>}
                  {l.status === 'in_transit' && <button onClick={() => {
                    const loc = prompt('当前所在位置/城市:', l.current_location || l.delivery_address);
                    if (loc) update(l.id, 'in_transit', loc, `途经 ${loc}，运输进度正常`);
                  }} className="btn-outline px-4 py-2 text-sm">📍 更新位置</button>}
                  {(l.status === 'picked_up' || l.status === 'in_transit') && <button onClick={() => update(l.id, 'delivered', l.delivery_address, '货物已送达目的地，等待签收')} className="btn-outline px-4 py-2 text-sm">✓ 确认送达</button>}
                  <Link to={`/tracking/${l.tracking_no}`} className="btn-secondary px-4 py-2 text-sm">📋 轨迹详情</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
