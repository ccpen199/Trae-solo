import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { NEGOTIATION_STATUS, formatCurrency, formatWeight, formatDate } from '../../lib/constants';

export default function NegotiationList() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any[]>([]);
  const [f, setF] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const d: any = await api.get('/negotiations/my');
    setData(d);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = data.filter(n => {
    if (f === 'all') return true;
    if (f === 'initiated') return n.initiator_id === user?.id;
    if (f === 'received') return n.responder_id === user?.id;
    return n.status === f;
  });

  return (
    <div className="space-y-5">
      <div className="card p-4">
        <div className="flex gap-2 flex-wrap">
          {[
            { v: 'all', l: `全部 (${data.length})` },
            { v: 'initiated', l: `我发起 (${data.filter(n => n.initiator_id === user?.id).length})` },
            { v: 'received', l: `收到的 (${data.filter(n => n.responder_id === user?.id).length})` },
            { v: 'active', l: `进行中 (${data.filter(n => n.status === 'active').length})` },
            { v: 'accepted', l: `已接受 (${data.filter(n => n.status === 'accepted').length})` },
            { v: 'rejected', l: `已拒绝 (${data.filter(n => n.status === 'rejected').length})` },
          ].map(t => (
            <button key={t.v} onClick={() => setF(t.v)}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition ${
                f === t.v ? 'bg-primary-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>{t.l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card p-16 text-center text-slate-400">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-3">💬</div>
          <div className="text-slate-600 mb-2">暂无议价记录</div>
          <div className="text-sm text-slate-400">前往<Link to="/opportunities" className="text-primary-600 hover:underline mx-1">商机市场</Link>发现商机并发起议价</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(n => {
            const st = NEGOTIATION_STATUS[n.status];
            const meInitiated = n.initiator_id === user?.id;
            const other = meInitiated ? n.responder_name : n.initiator_name;
            return (
              <Link key={n.id} to={`/negotiations/${n.id}`} className="card card-hover p-5 block">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`status-badge ${st?.color}`}>{st?.label}</span>
                      <span className="text-xs text-slate-400">{meInitiated ? '向对方发起' : '来自对方'}</span>
                      {n.opp_type === 'supply'
                        ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">供应</span>
                        : <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">求购</span>
                      }
                    </div>
                    <h3 className="font-semibold text-slate-900 truncate">{n.opp_title}</h3>
                    <div className="mt-1 text-xs text-slate-500 flex items-center gap-3">
                      <span>{n.category} / {n.sub_category}</span>
                      <span>对方: <span className="text-slate-700 font-medium">{other}</span></span>
                      <span>{formatDate(n.updated_at)}</span>
                    </div>
                  </div>
                  <span className="text-slate-400 text-lg">→</span>
                </div>

                <div className="grid grid-cols-3 gap-4 py-3 bg-slate-50 rounded-lg px-4">
                  <div>
                    <div className="text-[11px] text-slate-400 mb-1">当前报价</div>
                    <div className="text-xl font-bold text-primary-700">{formatCurrency(n.current_price)}<span className="text-sm font-normal text-slate-400">/吨</span></div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 mb-1">意向数量</div>
                    <div className="text-xl font-bold text-slate-800">{formatWeight(n.current_quantity)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 mb-1">议价金额</div>
                    <div className="text-xl font-bold text-amber-600">{formatCurrency(Math.round(n.current_price * n.current_quantity))}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
