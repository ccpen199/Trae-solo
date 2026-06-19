import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { GRADE_COLORS, formatCurrency, formatDate } from '../../lib/constants';

export default function CreditRating() {
  const { user, enterprise } = useAuthStore();
  const [data, setData] = useState<any[]>([]);
  const [f, setF] = useState({ region: '', min_grade: '' });
  const [myRating, setMyRating] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/trace/recyclers/ratings'),
      enterprise ? api.get(`/trace/credit-rating/${enterprise.id}`).catch(() => null) : Promise.resolve(null)
    ]).then(([r, m]) => {
      setData(r as any[] || []);
      setMyRating((m as any)?.rating || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [enterprise]);

  const filtered = data.filter(r => {
    if (f.region && !r.region?.includes(f.region)) return false;
    const grades = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC'];
    if (f.min_grade) {
      const idx = grades.indexOf(r.credit_rating);
      const minIdx = grades.indexOf(f.min_grade);
      if (idx === -1 || idx > minIdx) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {enterprise?.id && (
        <div className="card p-6 bg-gradient-to-br from-amber-50 via-white to-primary-50 border-amber-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg text-slate-900">⭐ 我的企业信用档案</h3>
                {user?.role === 'admin' && <span className="status-badge bg-slate-200 text-slate-600 text-[10px]">仅示例</span>}
              </div>
              <div className="text-sm text-slate-500">{enterprise.company_name} · {enterprise.region}</div>
            </div>
            {myRating && user?.role === 'admin' && (
              <button onClick={async () => {
                if (!confirm('重新计算信用评级？')) return;
                await api.post(`/trace/credit-rating/calculate/${enterprise.id}`);
                alert('信用评级已更新'); location.reload();
              }} className="btn-outline text-sm">🔄 重新计算评级</button>
            )}
          </div>
          {myRating ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className={`col-span-1 p-5 rounded-xl border-2 ${GRADE_COLORS[myRating.final_grade] || 'bg-slate-50'} flex flex-col items-center justify-center`}>
                <div className="text-xs text-slate-500">综合评级</div>
                <div className="text-4xl font-black mt-2 tracking-tighter">{myRating.final_grade}</div>
                <div className="text-2xl font-bold mt-1">{myRating.final_score}<span className="text-sm text-slate-400 font-normal">/100</span></div>
              </div>
              {[
                { k: '履约率', v: `${myRating.performance_rate}%`, w: '30%', score: myRating.performance_rate },
                { k: '质检异议率', v: `${myRating.quality_objection_rate}%`, w: '20%', score: (100 - myRating.quality_objection_rate) },
                { k: '税务合规分', v: `${myRating.tax_compliance_score}分`, w: '15%', score: myRating.tax_compliance_score },
                { k: '数据完整度', v: `${myRating.data_completeness_score}分`, w: '10%', score: myRating.data_completeness_score },
              ].map(m => (
                <div key={m.k} className="p-4 rounded-xl bg-white border border-slate-200">
                  <div className="text-xs text-slate-500 mb-1 flex justify-between">
                    <span>{m.k}</span><span className="text-primary-600 font-medium">权重 {m.w}</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-800 my-2">{m.v}</div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full" style={{ width: `${Math.min(100, Number(m.score) || 85)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500">暂无评级数据，完成首笔交易后自动计算</div>
          )}
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">📊 回收商信用评级排行榜</h2>
            <p className="text-sm text-slate-500">基于履约率 · 质检异议率 · 税务合规性 等多维度模型算法</p>
          </div>
          <div className="flex gap-2 items-end">
            <div><label className="label">地区筛选</label>
              <input placeholder="如江苏..." value={f.region} onChange={e => setF(x => ({ ...x, region: e.target.value }))} className="input-field w-36" />
            </div>
            <div><label className="label">最低等级</label>
              <select value={f.min_grade} onChange={e => setF(x => ({ ...x, min_grade: e.target.value }))} className="input-field w-28">
                <option value="">全部</option>
                {['AAA', 'AA', 'A', 'BBB', 'BB'].map(g => <option key={g} value={g}>{g}及以上</option>)}
              </select>
            </div>
          </div>
        </div>

        {loading ? <div className="p-10 text-center text-slate-400">加载中...</div> : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400">暂无符合条件的回收商</div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left w-12">排名</th>
                  <th className="px-4 py-3 text-left">回收商企业</th>
                  <th className="px-4 py-3 text-left">所在地区</th>
                  <th className="px-4 py-3 text-left">年处理能力</th>
                  <th className="px-4 py-3 text-left">主营品类</th>
                  <th className="px-4 py-3 text-center">信用分</th>
                  <th className="px-4 py-3 text-center">评级</th>
                  <th className="px-4 py-3 text-left">履约/异议/合规</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.enterprise_id} className="border-t border-slate-100 hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3">
                      <span className={`inline-flex w-8 h-8 rounded-full items-center justify-center font-bold text-sm ${
                        i === 0 ? 'bg-amber-400 text-amber-950' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-orange-300 text-orange-900' : 'bg-slate-100 text-slate-500'
                      }`}>{i + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 max-w-[240px] truncate">{r.company_name}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.region}</td>
                    <td className="px-4 py-3"><div className="font-semibold">{(r.annual_capacity / 10000).toFixed(1)}万吨/年</div></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap max-w-[200px]">
                        {Array.isArray(r.recycling_categories) ? r.recycling_categories.slice(0, 3).map((c: string) => (
                          <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-primary-50 text-primary-700">{c}</span>
                        )) : <span className="text-xs text-slate-400">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="font-bold text-xl text-slate-900">{r.credit_score}</div>
                      <div className="h-1.5 w-20 mx-auto bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary-400 to-emerald-500 rounded-full" style={{ width: `${r.credit_score}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.credit_rating && (
                        <span className={`inline-block px-3 py-1 rounded-lg border-2 font-black text-lg tracking-tighter ${GRADE_COLORS[r.credit_rating] || ''}`}>
                          {r.credit_rating}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs max-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-600 font-semibold">✓ {r.compliance_rate || 95}%</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-rose-600 font-semibold">{r.dispute_rate || 1.2}%</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-blue-600 font-semibold">{r.tax_compliance_score || 90}分</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card p-6 bg-gradient-to-br from-slate-50 to-indigo-50/30 border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4">📐 信用评级模型说明</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-sm">
          {[
            { k: '历史履约率', w: '30%', d: '按时完成订单比例', icon: '📋' },
            { k: '质检异议率', w: '20%', d: '质检不合格占比', icon: '🔬' },
            { k: '税务合规', w: '15%', d: '纳税申报信用', icon: '💰' },
            { k: '争议发生率', w: '15%', d: '订单纠纷比例', icon: '⚖️' },
            { k: '付款及时性', w: '10%', d: '资金结算时效', icon: '⏱️' },
            { k: '资质完整度', w: '10%', d: '认证/备案资料', icon: '📄' },
          ].map((m, i) => (
            <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 hover:shadow-md hover:border-primary-200 transition-all">
              <div className="text-3xl mb-2">{m.icon}</div>
              <div className="font-semibold text-slate-800 mb-0.5">{m.k}</div>
              <div className="text-xs text-primary-600 font-bold">权重 {m.w}</div>
              <div className="text-[11px] text-slate-500 mt-1 leading-relaxed">{m.d}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 leading-relaxed">
          <strong className="text-slate-700">等级划分：</strong>
          <span className="ml-2 space-x-3">
            {[
              ['AAA', '95+', '卓越'], ['AA', '90-94', '优秀'], ['A', '85-89', '良好'],
              ['BBB', '75-84', '较好'], ['BB', '65-74', '一般'], ['B', '55-64', '待改善'], ['CCC', '<55', '高风险']
            ].map(([g, s, d]) => (
              <span key={g} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${GRADE_COLORS[g]} border`}>
                <strong className="font-black">{g}</strong> {s}分 {d}
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
