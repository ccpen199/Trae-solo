import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { 
  CATEGORY_OPTIONS, formatCurrency, formatWeight, formatDate, formatDateTime, daysBetween,
  VERIFICATION_STATUS, GRADE_COLORS
} from '../../lib/constants';

export default function OpportunityDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nego, setNego] = useState<{ price: number | ''; qty: number | ''; msg: string }>({ price: '', qty: '', msg: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/opportunities/${id}`).then(d => { setData(d); setLoading(false); }).catch(() => { setLoading(false); });
  }, [id]);

  const startNegotiation = async () => {
    if (!nego.price || !nego.qty) { alert('请输入报价和数量'); return; }
    setSubmitting(true);
    try {
      const r: any = await api.post('/negotiations', {
        opportunity_id: id,
        initial_price: Number(nego.price),
        initial_quantity: Number(nego.qty),
        message: nego.msg
      });
      nav(`/negotiations/${r.id}`);
    } catch (e: any) {
      alert(e.error || '发起议价失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) return <div className="card p-16 text-center text-slate-400">加载中...</div>;

  const cat = CATEGORY_OPTIONS.find(c => c.value === data.category);
  const isOwner = data.publisher_id === user?.id;
  const verif = VERIFICATION_STATUS[data.verification_status || 'approved'];
  const daysLeft = daysBetween(new Date().toISOString(), data.expiry_date);

  return (
    <div className="space-y-5">
      <Link to="/opportunities" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600">
        ← 返回商机列表
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`status-badge bg-${data.type === 'supply' ? 'blue' : 'amber'}-100 text-${data.type === 'supply' ? 'blue' : 'amber'}-700`}>
                    {data.type === 'supply' ? '🏭 供应' : '🛒 求购'}
                  </span>
                  <span className={`status-badge ${cat?.color}`}>{data.category}</span>
                  <span className="status-badge bg-slate-100 text-slate-700">{data.sub_category}</span>
                  {data.quality_grade && <span className="status-badge bg-purple-100 text-purple-700">等级: {data.quality_grade}</span>}
                </div>
                <h1 className="text-2xl font-bold text-slate-900 leading-snug">{data.title}</h1>
                <div className="mt-2 text-sm text-slate-500 flex items-center gap-4 flex-wrap">
                  <span>📌 发布于 {formatDateTime(data.created_at)}</span>
                  <span>👁️ 浏览 {data.views_count}</span>
                  <span>⏰ 有效期剩余 <span className={daysLeft < 7 ? 'text-red-600 font-semibold' : ''}>{daysLeft} 天</span></span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 py-6 border-y border-slate-100 bg-slate-50/50 -mx-6 px-6 my-4">
              <div>
                <div className="text-xs text-slate-400 mb-1">交易数量</div>
                <div className="text-3xl font-bold text-slate-900">{formatWeight(data.quantity)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">价格区间 ({data.price_unit})</div>
                <div className="text-3xl font-bold text-primary-700">
                  {data.min_price === data.max_price ? formatCurrency(data.min_price) : `${formatCurrency(data.min_price)} ~ ${formatCurrency(data.max_price)}`}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">预估总金额</div>
                <div className="text-3xl font-bold text-amber-600">
                  {formatCurrency(Math.round(data.quantity * (data.min_price + data.max_price) / 2))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">详细说明</h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{data.description}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100">
              <div>
                <div className="text-xs text-slate-400 mb-1">所在地区</div>
                <div className="font-medium text-slate-800">📍 {data.region}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">可提货日期</div>
                <div className="font-medium text-slate-800">{formatDate(data.available_date)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">报价截止</div>
                <div className="font-medium text-slate-800">{formatDate(data.expiry_date)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">计量方式</div>
                <div className="font-medium text-slate-800">过磅/件数确认</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xl">
                {data.publisher_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 truncate">{data.publisher_name}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span className={`px-1.5 py-0.5 rounded ${verif?.color}`}>{verif?.label}</span>
                  {data.credit_rating && <span className={`px-1.5 py-0.5 rounded border ${GRADE_COLORS[data.credit_rating]}`}>{data.credit_rating}</span>}
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">信用分</span><span className="font-semibold">{data.credit_score || '暂无'} 分</span></div>
              <div className="flex justify-between"><span className="text-slate-500">所在区域</span><span className="text-slate-800">{data.company_region || data.region}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">账户角色</span><span className="text-slate-800">{data.role === 'recycler' ? '回收商' : data.role === 'producer' ? '产废单位' : data.role}</span></div>
            </div>
          </div>

          {!isOwner && data.status === 'active' && (
            <div className="card p-5">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">💬 发起议价邀请</h3>
              <div className="space-y-3">
                <div>
                  <label className="label">报价 ({data.price_unit})</label>
                  <input type="number" value={nego.price} onChange={e => setNego(s => ({ ...s, price: e.target.value as any }))}
                    placeholder={`建议 ${data.min_price}-${data.max_price}`} className="input-field" />
                </div>
                <div>
                  <label className="label">意向数量 ({data.unit})</label>
                  <input type="number" value={nego.qty} onChange={e => setNego(s => ({ ...s, qty: e.target.value as any }))}
                    placeholder={`最多 ${data.quantity}`} className="input-field" />
                </div>
                <div>
                  <label className="label">备注说明 <span className="text-slate-400 font-normal">(选填)</span></label>
                  <textarea rows={2} value={nego.msg} onChange={e => setNego(s => ({ ...s, msg: e.target.value }))}
                    placeholder="如交货方式、看货时间等" className="input-field resize-none" />
                </div>
                <button onClick={startNegotiation} disabled={submitting} className="btn-primary w-full py-2.5">
                  {submitting ? '提交中...' : '发起议价 →'}
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                💡 议价成功后将自动生成标准电子合同，定金通过平台监管账户冻结，CMA质检验收合格后释放
              </p>
            </div>
          )}

          {isOwner && (
            <div className="card p-5 bg-blue-50 border-blue-200">
              <div className="text-sm text-blue-800">
                <div className="font-semibold mb-1">📌 这是您发布的商机</div>
                <div className="text-blue-700 text-xs leading-relaxed">收到的议价邀请可前往 <Link to="/negotiations" className="underline font-medium">议价中心</Link> 查看处理</div>
              </div>
            </div>
          )}

          <div className="card p-5 text-xs text-slate-500 space-y-2">
            <div className="font-semibold text-slate-700 mb-2">🛡️ 平台交易保障</div>
            <div>✅ <span className="text-slate-700">企业实名认证</span> - 资质审核后才可交易</div>
            <div>✅ <span className="text-slate-700">资金监管</span> - 定金平台托管，验收后放款</div>
            <div>✅ <span className="text-slate-700">CMA质检</span> - 第三方权威机构出具报告</div>
            <div>✅ <span className="text-slate-700">溯源备案</span> - 对接生态环境部固废系统</div>
            <div>✅ <span className="text-slate-700">电子合同</span> - CA认证法律效力</div>
          </div>
        </div>
      </div>
    </div>
  );
}
