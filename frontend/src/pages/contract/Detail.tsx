import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { CONTRACT_STATUS, PAYMENT_STATUS, formatCurrency, formatWeight, formatDate, formatDateTime } from '../../lib/constants';

export default function ContractDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    api.get(`/contracts/${id}`).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading || !data) return <div className="card p-16 text-center text-slate-400">加载中...</div>;

  const { contract, order, payments } = data;
  const st = CONTRACT_STATUS[contract.status];
  const isBuyer = contract.buyer_id === user?.id;
  const isSeller = contract.seller_id === user?.id;
  const mySigned = isBuyer ? contract.buyer_signed_at : contract.seller_signed_at;
  const otherSigned = isBuyer ? contract.seller_signed_at : contract.buyer_signed_at;
  const role = isBuyer ? '买方' : '卖方';

  const sign = async () => {
    if (!confirm(`作为${role}签署此电子合同？签署后不可撤销`)) return;
    setSigning(true);
    try {
      await api.post(`/contracts/${id}/sign`, { signature_url: `https://sig.example.com/${Date.now()}.png` });
      location.reload();
    } catch (e: any) { alert(e.error); }
    finally { setSigning(false); }
  };

  const terminate = async () => {
    const r = prompt('请输入终止原因');
    if (r === null) return;
    await api.post(`/contracts/${id}/terminate`, { reason: r });
    location.reload();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/contracts" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600">← 返回合同列表</Link>
        <div className="flex gap-2">
          {!mySigned && ['draft', 'signed_buyer', 'signed_seller'].includes(contract.status) && (
            <button onClick={sign} disabled={signing} className="btn-primary">{signing ? '签署中...' : `✍️ 作为${role}签署`}</button>
          )}
          {contract.status !== 'fully_signed' && contract.status !== 'terminated' && (
            <button onClick={terminate} className="btn-secondary text-red-600 hover:bg-red-50">终止合同</button>
          )}
          {contract.status === 'fully_signed' && (
            <Link to={`/orders/${order?.id}`} className="btn-outline">查看关联订单 →</Link>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-8 border-b border-slate-100">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className={`status-badge text-sm px-3 py-1 ${st?.color}`}>{st?.label}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">再生资源购销合同</h1>
            <div className="text-sm text-slate-500">合同编号：HT-{contract.id.substring(0, 12).toUpperCase()}</div>
            <div className="text-sm text-slate-500">签订地点：{contract.delivery_address}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 p-8 border-b border-slate-100">
          <div className="p-5 rounded-xl bg-blue-50/50 border border-blue-100">
            <div className="text-xs text-blue-600 font-semibold mb-3 uppercase tracking-wider">甲方（买方）</div>
            <div className="font-bold text-lg text-slate-900 mb-1">{contract.buyer_name}</div>
            <div className="text-sm text-slate-600 space-y-0.5">
              <div>统一信用代码：<span className="font-mono">{contract.buyer_uscc}</span></div>
              <div>法定代表人：{contract.buyer_legal}</div>
              <div>注册地址：{contract.buyer_address}</div>
              {contract.buyer_signed_at && (
                <div className="mt-2 pt-2 border-t border-blue-200 text-blue-700 flex items-center gap-1.5">
                  ✓ 已签署 · {formatDateTime(contract.buyer_signed_at)}
                </div>
              )}
            </div>
          </div>
          <div className="p-5 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <div className="text-xs text-emerald-600 font-semibold mb-3 uppercase tracking-wider">乙方（卖方）</div>
            <div className="font-bold text-lg text-slate-900 mb-1">{contract.seller_name}</div>
            <div className="text-sm text-slate-600 space-y-0.5">
              <div>统一信用代码：<span className="font-mono">{contract.seller_uscc}</span></div>
              <div>法定代表人：{contract.seller_legal}</div>
              <div>注册地址：{contract.seller_address}</div>
              {contract.seller_signed_at && (
                <div className="mt-2 pt-2 border-t border-emerald-200 text-emerald-700 flex items-center gap-1.5">
                  ✓ 已签署 · {formatDateTime(contract.seller_signed_at)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">第一条 标的物</h2>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="bg-slate-50">
                    <td className="px-4 py-3 text-slate-500 w-1/4 border-b border-slate-200">品类名称</td>
                    <td className="px-4 py-3 font-medium border-b border-slate-200">{contract.category} - {contract.sub_category}</td>
                    <td className="px-4 py-3 text-slate-500 w-1/4 border-b border-slate-200">质量等级</td>
                    <td className="px-4 py-3 font-medium border-b border-slate-200">{opp_quality_grade(contract)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-500 border-b border-slate-200">合同数量</td>
                    <td className="px-4 py-3 font-medium text-lg text-slate-900 border-b border-slate-200">{formatWeight(contract.quantity, contract.unit)}</td>
                    <td className="px-4 py-3 text-slate-500 border-b border-slate-200">单价</td>
                    <td className="px-4 py-3 font-medium text-lg text-slate-900 border-b border-slate-200">{formatCurrency(contract.unit_price)} / {contract.unit}</td>
                  </tr>
                  <tr className="bg-amber-50/50">
                    <td className="px-4 py-3 text-slate-600 font-semibold">合同总金额</td>
                    <td colSpan={3} className="px-4 py-3 font-bold text-2xl text-amber-600">
                      {formatCurrency(contract.total_amount)}
                      <span className="text-sm text-slate-500 ml-2 font-normal">（人民币大写：{numToChinese(contract.total_amount)}）</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid grid-cols-3 gap-4">
            <InfoBox title="第二条 质量标准" content={contract.quality_standard} icon="✅" />
            <InfoBox title="第三条 交货方式" content={contract.delivery_method} icon="🚚" />
            <InfoBox title="第四条 交货日期" content={`${formatDate(contract.delivery_date)} 前`} icon="📅" />
            <InfoBox title="第五条 交货地点" content={contract.delivery_address} icon="📍" />
            <InfoBox title="第六条 验收方式" content={contract.inspection_method} icon="🔬" />
            <InfoBox title="第七条 结算方式" content={contract.payment_terms} icon="💰" />
          </div>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">第八条 定金条款（资金监管）</h2>
            <div className="p-5 rounded-xl bg-amber-50/50 border border-amber-200">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-xs text-slate-500 mb-1">定金比例</div>
                  <div className="text-xl font-bold text-amber-700">{(contract.deposit_ratio * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">定金金额（平台监管冻结）</div>
                  <div className="text-xl font-bold text-amber-700">{formatCurrency(contract.deposit_amount)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">尾款金额</div>
                  <div className="text-xl font-bold text-amber-700">{formatCurrency(contract.total_amount - contract.deposit_amount)}</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-amber-800/80 leading-relaxed">
                💡 定金由平台监管账户冻结，CMA质检验收合格后释放给卖方；如质检不合格，定金原路返还买方。
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">第九条 违约责任</h2>
            <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700 leading-relaxed whitespace-pre-line">{contract.breach_clause}</div>
          </section>

          {payments?.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3 pb-2 border-b border-slate-200">资金流水记录</h2>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-500">
                      <th className="px-4 py-3 text-left">类型</th>
                      <th className="px-4 py-3 text-left">金额</th>
                      <th className="px-4 py-3 text-left">状态</th>
                      <th className="px-4 py-3 text-left">流水号</th>
                      <th className="px-4 py-3 text-left">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => {
                      const ps = PAYMENT_STATUS[p.status];
                      return (
                        <tr key={p.id} className="border-t border-slate-100">
                          <td className="px-4 py-3">{p.type === 'deposit' ? '定金' : p.type === 'full_payment' ? '尾款' : p.type}</td>
                          <td className="px-4 py-3 font-semibold">{formatCurrency(p.amount)}</td>
                          <td className="px-4 py-3"><span className={`status-badge ${ps?.color}`}>{ps?.label}</span></td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.transaction_no || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(p.frozen_at || p.released_at || p.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
            本合同由「绿循环」CA电子认证服务中心签发，采用可靠电子签名技术，与纸质合同具有同等法律效力。<br />
            合同生成时间：{formatDateTime(contract.created_at)} · 适用法规：《民法典》《固体废物污染环境防治法》《电子签名法》
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ title, content, icon }: { title: string; content: string; icon: string }) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 hover:border-primary-200 transition">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="font-semibold text-sm text-slate-800">{title}</span>
      </div>
      <div className="text-sm text-slate-600 leading-relaxed">{content}</div>
    </div>
  );
}

function opp_quality_grade(c: any) { return c.opp_quality_grade || '按国标 GB/T 相关标准执行'; }

function numToChinese(num: number) {
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿'];
  const str = Math.floor(num).toString();
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const d = parseInt(str[i]);
    const u = units[str.length - 1 - i];
    if (d === 0) {
      if (result.charAt(result.length - 1) !== '零') result += '零';
    } else {
      result += digits[d] + u;
    }
  }
  return result.replace(/零+$/, '') + '元整';
}
