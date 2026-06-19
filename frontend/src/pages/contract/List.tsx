import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { CONTRACT_STATUS, formatCurrency, formatWeight, formatDate } from '../../lib/constants';

export default function ContractList() {
  const [data, setData] = useState<any[]>([]);
  const [f, setF] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/contracts/my').then(d => { setData(d as any); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = data.filter(c => f === 'all' ? true : c.status === f);

  const tabs = [
    { v: 'all', l: `全部 (${data.length})` },
    { v: 'draft', l: `待签署 (${data.filter(c => c.status === 'draft' || c.status === 'signed_buyer' || c.status === 'signed_seller').length})` },
    { v: 'fully_signed', l: `已生效 (${data.filter(c => c.status === 'fully_signed').length})` },
    { v: 'terminated', l: `已终止 (${data.filter(c => c.status === 'terminated').length})` },
  ];

  return (
    <div className="space-y-5">
      <div className="card p-4 flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.v} onClick={() => setF(t.v)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition ${
              f === t.v ? 'bg-primary-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>{t.l}</button>
        ))}
      </div>

      {loading ? <div className="card p-16 text-center text-slate-400">加载中...</div> : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-3">📄</div>
          <div className="text-slate-600 mb-2">暂无合同记录</div>
          <div className="text-sm text-slate-400">议价接受后将自动生成标准电子合同</div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const st = CONTRACT_STATUS[c.status];
            const pctSigned = c.status === 'fully_signed' ? 100 : (c.buyer_signed_at ? 50 : 0) + (c.seller_signed_at ? 50 : 0);
            return (
              <Link key={c.id} to={`/contracts/${c.id}`} className="card card-hover block">
                <div className="grid grid-cols-12 gap-4 items-center p-5">
                  <div className="col-span-4 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`status-badge ${st?.color}`}>{st?.label}</span>
                      <span className="text-xs text-slate-400 font-mono">HT-{c.id.substring(0, 8).toUpperCase()}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 truncate">{c.opp_title}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">{c.category} · {c.sub_category}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-slate-400 mb-0.5">数量</div>
                    <div className="font-semibold text-slate-800">{formatWeight(c.quantity, c.unit)}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-slate-400 mb-0.5">合同金额</div>
                    <div className="font-bold text-lg text-primary-700">{formatCurrency(c.total_amount)}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-slate-400 mb-0.5">定金 ({(c.deposit_ratio * 100).toFixed(0)}%)</div>
                    <div className="font-semibold text-amber-600">{formatCurrency(c.deposit_amount)}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-slate-400 mb-2">签署进度</div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all" style={{ width: `${pctSigned}%` }} />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{formatDate(c.created_at)}</div>
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
