import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { ORDER_STATUS, PAYMENT_STATUS, LOGISTICS_STATUS, TRACE_STATUS, formatCurrency, formatWeight, formatDate, formatDateTime, CATEGORY_OPTIONS } from '../../lib/constants';

function buildTimeline(o: any, payments: any[], logistics: any[], inspection: any) {
  const tl: any[] = [];
  tl.push({ title: '合同签署完成', done: true, icon: '📄', time: formatDateTime(o.created_at), desc: '买卖双方已完成电子合同签署，交易开始' });

  const deposit = payments.find(p => p.type === 'deposit');
  const depositPaid = deposit && ['deposit_frozen', 'deposit_released'].includes(deposit.status);
  tl.push({
    title: `定金支付 ${depositPaid ? '' : '(等待买方支付)'}`,
    done: !!depositPaid,
    active: !depositPaid && o.status === 'deposit_paid',
    icon: '💰',
    time: deposit?.frozen_at ? formatDateTime(deposit.frozen_at) : undefined,
    desc: depositPaid ? `定金 ${formatCurrency(o.deposit_amount)} 已冻结至平台监管账户` : `待支付定金 ${formatCurrency(o.deposit_amount)}（合同金额20%）`
  });

  const hasLogistics = logistics?.length > 0;
  tl.push({
    title: '物流运输调度',
    done: hasLogistics && ['delivered'].includes(logistics[0].status),
    active: hasLogistics && ['pending_pickup', 'picked_up', 'in_transit'].includes(logistics[0].status),
    icon: '🚚',
    time: hasLogistics ? formatDateTime(logistics[0].created_at) : undefined,
    desc: hasLogistics
      ? `承运商：${logistics[0].carrier_name} · ${LOGISTICS_STATUS[logistics[0].status]?.label}`
      : '等待卖方安排物流承运方案'
  });

  tl.push({
    title: 'CMA质量检验',
    done: !!inspection,
    active: !inspection && o.status === 'inspecting',
    icon: '🔬',
    time: inspection?.inspection_date ? formatDate(inspection.inspection_date) : undefined,
    desc: inspection
      ? `${inspection.inspector_name}出具报告 · ${inspection.is_passed ? '合格' : '不合格'} · 等级 ${inspection.quality_grade}`
      : '货物送达后由CMA认证机构质检'
  });

  const completed = o.status === 'completed';
  const fullPaid = payments.find(p => p.type === 'full_payment');
  tl.push({
    title: '资金释放 · 交易完成',
    done: completed,
    active: inspection?.is_passed && !completed,
    icon: '✅',
    time: fullPaid?.released_at ? formatDateTime(fullPaid.released_at) : undefined,
    desc: completed
      ? `定金+尾款共 ${formatCurrency(o.total_amount)} 已结算完成`
      : inspection?.is_passed ? '质检验收合格，买方确认后放款' : '质检验收合格后释放定金并支付尾款'
  });

  if (o.status === 'disputed') {
    tl.push({ title: '争议处理中', done: false, active: true, icon: '⚠️', desc: '平台客服介入处理争议，请耐心等待' });
  }

  return tl;
}

function getHeaderStyle(status: string) {
  const map: Record<string, string> = {
    completed: 'bg-gradient-to-r from-emerald-100 to-green-100',
    disputed: 'bg-gradient-to-r from-red-100 to-rose-100',
    shipping: 'bg-gradient-to-r from-cyan-100 to-blue-100',
    inspecting: 'bg-gradient-to-r from-purple-100 to-violet-100',
    contracted: 'bg-gradient-to-r from-indigo-100 to-blue-100',
    deposit_paid: 'bg-gradient-to-r from-amber-100 to-yellow-100',
  };
  return map[status] || 'bg-gradient-to-r from-slate-100 to-gray-100';
}

export default function OrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading || !data) return <div className="card p-16 text-center text-slate-400">加载中...</div>;

  const { order, payments, logistics, inspection, trace_codes } = data;
  const o = order;
  const isBuyer = o.buyer_id === user?.id;
  const isSeller = o.seller_id === user?.id;
  const isInspector = user?.role === 'inspector';
  const st = ORDER_STATUS[o.status];
  const cat = CATEGORY_OPTIONS.find(c => c.value === o.category);
  const deposit = payments?.find((p: any) => p.type === 'deposit');
  const timeline = buildTimeline(o, payments, logistics, inspection);

  const payDeposit = async () => {
    if (!confirm(`确认支付定金 ${formatCurrency(o.deposit_amount)} 元？将冻结至平台监管账户`)) return;
    await api.post(`/orders/${id}/pay-deposit`);
    alert('定金已支付并冻结至监管账户');
    location.reload();
  };

  const confirmReceipt = async () => {
    if (!confirm('确认货物验收合格？确认后平台将释放定金并结算尾款')) return;
    await api.post(`/orders/${id}/confirm-receipt`);
    alert('收货确认成功，资金已释放');
    location.reload();
  };

  const fileDispute = async () => {
    const r = prompt('请说明争议原因');
    if (r === null) return;
    await api.post(`/orders/${id}/dispute`, { reason: r });
    location.reload();
  };

  const doInspect = async () => {
    const weight = prompt('抽样重量(kg):', '500') || '500';
    const grade = prompt('质量等级:', 'H1') || 'H1';
    const imp = prompt('杂质率(%):', '0.8') || '0.8';
    const moi = prompt('含水率(%):', '0.3') || '0.3';
    try {
      await api.post(`/orders/${id}/inspect`, {
        sample_weight: Number(weight), quality_grade: grade, impurity_rate: Number(imp),
        moisture_rate: Number(moi), composition: { Fe: 98, C: 0.5 },
        is_passed: Number(imp) < 3 && Number(moi) < 5,
        conclusion: `经CMA认证检测，该批次${o.category}/${o.sub_category}符合GB标准，评定为${grade}级`
      });
      alert('质检报告已出具并同步CMA系统'); location.reload();
    } catch (e: any) { alert(e.error || '操作失败'); }
  };

  return (
    <div className="space-y-5">
      <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600">← 返回订单列表</Link>

      <div className="card overflow-hidden">
        <div className={`p-6 ${getHeaderStyle(o.status)}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="status-badge bg-white/95 text-slate-700 shadow-sm">{st?.label}</span>
                <span className="status-badge bg-white/80 text-slate-600 font-mono text-xs">DD-{o.id.substring(0, 10).toUpperCase()}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">{o.category} · {o.sub_category}</h1>
              <div className="text-sm text-slate-600 truncate max-w-2xl">{o.opp_title}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-1">订单总额</div>
              <div className="text-3xl font-bold text-slate-900">{formatCurrency(o.total_amount)}</div>
              <div className="text-xs text-slate-500 mt-1">创建于 {formatDateTime(o.created_at)}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-px bg-slate-200">
          {[
            { k: '品类', v: <><span className={`inline-block mr-1.5 px-1.5 py-0.5 rounded text-[10px] ${cat?.color}`}>{o.category}</span>{o.sub_category}</> },
            { k: '数量', v: <span className="font-bold">{formatWeight(o.quantity, o.unit)}</span> },
            { k: '单价', v: <span className="font-bold">{formatCurrency(o.unit_price)}/{o.unit}</span> },
            { k: '定金(20%)', v: <span className="font-bold text-amber-600">{formatCurrency(o.deposit_amount)}</span> },
          ].map((s, i) => (
            <div key={i} className="bg-white p-4">
              <div className="text-xs text-slate-400 mb-1">{s.k}</div>
              <div className="text-slate-800">{s.v}</div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">🔄 交易全流程进度</h3>
          <div className="relative pl-2">
            <div className="absolute left-7 top-3 bottom-3 w-0.5 bg-slate-200"></div>
            <div className="space-y-6">
              {timeline.map((t, i) => (
                <div key={i} className="relative flex gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 shadow-sm border-2 border-white ${
                    t.done ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white' :
                    t.active ? 'bg-amber-400 text-white ring-4 ring-amber-100' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {t.done ? '✓' : t.icon}
                  </div>
                  <div className="flex-1 pt-0.5 pb-1">
                    <div className={`font-semibold text-sm ${t.done ? 'text-slate-900' : t.active ? 'text-amber-700' : 'text-slate-400'}`}>
                      {t.title}
                      {t.active && <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">当前步骤</span>}
                    </div>
                    {t.time && <div className="text-xs text-slate-400 mt-0.5">{t.time}</div>}
                    {t.desc && <div className="text-sm text-slate-600 mt-1.5 leading-relaxed">{t.desc}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5">
            <h3 className="font-bold text-slate-800 mb-4">💼 交易双方信息</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { tag: '🛒 买方', name: o.buyer_name, uscc: o.buyer_uscc, lp: o.buyer_legal_person, phone: o.buyer_phone, color: 'blue' },
                { tag: '🏭 卖方', name: o.seller_name, uscc: o.seller_uscc, lp: o.seller_legal_person, phone: o.seller_phone, color: 'emerald' }
              ].map((p, i) => (
                <div key={i} className={`p-4 rounded-xl bg-${p.color}-50/50 border border-${p.color}-100`}>
                  <div className={`text-xs text-${p.color}-600 font-semibold mb-1.5`}>{p.tag}</div>
                  <div className="font-semibold text-slate-900 mb-1">{p.name}</div>
                  <div className="text-xs text-slate-500 space-y-0.5">
                    <div>USCC: <span className="font-mono">{p.uscc?.substring(0, 14)}...</span></div>
                    <div>法人：{p.lp} · 电话：{p.phone}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {logistics?.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">🚛 物流信息</h3>
                <span className="font-mono text-xs text-slate-500">运单：{logistics[0].tracking_no}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                <div><div className="text-xs text-slate-400 mb-1">承运商</div><div className="font-medium">{logistics[0].carrier_name}</div></div>
                <div><div className="text-xs text-slate-400 mb-1">状态</div><div><span className={`status-badge ${LOGISTICS_STATUS[logistics[0].status]?.color}`}>{LOGISTICS_STATUS[logistics[0].status]?.label}</span></div></div>
                <div><div className="text-xs text-slate-400 mb-1">车辆/司机</div><div className="font-medium text-xs">{logistics[0].vehicle_no || '-'} · {logistics[0].driver_name || '-'}</div></div>
              </div>
              <div className="flex gap-2">
                <Link to={`/logistics/quotations/${o.id}`} className="btn-outline flex-1 text-center text-sm py-2">📋 查看报价单</Link>
                <Link to={`/tracking/${logistics[0].tracking_no || 'null'}`} className="btn-secondary flex-1 text-center text-sm py-2">📍 实时轨迹</Link>
              </div>
            </div>
          )}

          {!logistics?.length && isSeller && ['shipping', 'deposit_paid', 'contracted'].includes(o.status) && (
            <div className="card p-5 border-amber-200 bg-amber-50/30">
              <h3 className="font-bold text-amber-800 mb-2">🚛 待安排物流</h3>
              <p className="text-sm text-amber-700 mb-3">已收到/待收到定金，请选择承运商物流方案</p>
              <Link to={`/logistics/quotations/${o.id}`} className="btn-primary w-full text-center py-2.5 block">查看物流承运商报价 →</Link>
            </div>
          )}

          {inspection && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">🔬 CMA质检报告</h3>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-500">报告编号 {inspection.report_no}</span>
                  {inspection.is_passed
                    ? <span className="status-badge bg-green-100 text-green-700">✓ 检验合格</span>
                    : <span className="status-badge bg-red-100 text-red-700">✗ 检验不合格</span>
                  }
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div><div className="text-xs text-slate-500 mb-1">检测机构</div><div className="font-medium">{inspection.inspector_name}</div></div>
                  <div><div className="text-xs text-slate-500 mb-1">CMA编号</div><div className="font-mono text-xs">{inspection.cma_report_no}</div></div>
                  <div><div className="text-xs text-slate-500 mb-1">检测日期</div><div className="font-medium">{formatDate(inspection.inspection_date)}</div></div>
                  <div><div className="text-xs text-slate-500 mb-1">质量等级</div><div className="font-bold text-lg text-purple-700">{inspection.quality_grade}</div></div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <Stat k="抽样重量" v={formatWeight(inspection.sample_weight, 'kg')} />
                  <Stat k="杂质率" v={<span className={Number(inspection.impurity_rate) > 2 ? 'font-semibold text-red-600' : ''}>{inspection.impurity_rate}%</span>} highlight />
                  <Stat k="含水率" v={<span className={Number(inspection.moisture_rate) > 5 ? 'font-semibold text-red-600' : ''}>{inspection.moisture_rate}%</span>} highlight />
                </div>
                <div className="p-3 bg-white rounded-lg border border-purple-200 text-sm text-slate-700">
                  <div className="text-xs text-purple-600 mb-1">📝 检验结论</div>
                  {inspection.conclusion}
                </div>
              </div>
            </div>
          )}

          {isInspector && ['shipping', 'inspecting'].includes(o.status) && !inspection && (
            <div className="card p-5 border-purple-200 bg-purple-50/30">
              <h3 className="font-bold text-purple-800 mb-3">🔬 CMA质检机构操作</h3>
              <button onClick={doInspect} className="btn-primary w-full py-2.5">出具CMA权威质检报告</button>
            </div>
          )}

          {trace_codes?.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">🏷️ 废料溯源码</h3>
                <div className="flex items-center gap-2">
                  <span className="status-badge bg-green-100 text-green-700 text-xs">✓ 对接生态环境部固废系统</span>
                </div>
              </div>
              <div className="space-y-2.5">
                {trace_codes.map((t: any) => {
                  const ts = TRACE_STATUS[t.status];
                  return (
                    <div key={t.id} className="p-4 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50/30 transition-all">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-emerald-100 rounded-xl flex items-center justify-center text-xl border border-primary-200">🏷️</div>
                          <div>
                            <div className="font-mono font-bold text-slate-800 tracking-wide">{t.code}</div>
                            <div className="text-[11px] text-slate-500">固废备案号：<span className="text-slate-700 font-medium">{t.min_env_tracking_no || '同步中...'}</span></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {t.min_env_sync_status === 'synced' && <span className="status-badge bg-green-50 text-green-700 text-[10px]">固废系统已同步</span>}
                          <span className={`status-badge ${ts?.color}`}>{ts?.label}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs pt-2.5 border-t border-slate-100">
                        <div><div className="text-slate-400 mb-0.5">起始地</div><div className="text-slate-700">{t.origin_address}</div></div>
                        <div><div className="text-slate-400 mb-0.5">目的地</div><div className="text-slate-700">{t.destination_address}</div></div>
                        <div><div className="text-slate-400 mb-0.5">链路节点</div><div className="text-slate-700 font-medium">{t.event_count || 0} 个</div></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card p-5 sticky top-20">
            <h3 className="font-bold text-slate-800 mb-4">🛠️ 操作中心</h3>
            <div className="space-y-2.5">
              {isBuyer && ['contracted', 'deposit_paid'].includes(o.status) && !deposit?.frozen_at && (
                <button onClick={payDeposit} className="btn-primary w-full py-3 font-medium">💰 支付定金 {formatCurrency(o.deposit_amount)}</button>
              )}
              {isBuyer && inspection?.is_passed && o.status !== 'completed' && (
                <button onClick={confirmReceipt} className="btn-primary w-full py-3 font-medium">✅ 确认收货 · 释放尾款</button>
              )}
              {deposit?.frozen_at && !deposit?.released_at && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <span className="text-lg">🔒</span>
                  <span>定金 {formatCurrency(o.deposit_amount)} 元已冻结于平台监管账户，质检验收合格后释放</span>
                </div>
              )}
              <Link to={`/contracts/${o.contract_id}`} className="btn-outline w-full text-center py-2.5 text-sm">📄 查看电子合同</Link>
              {logistics?.[0]?.tracking_no && (
                <Link to={`/tracking/${logistics[0].tracking_no}`} className="btn-secondary w-full text-center py-2.5 text-sm">📍 实时物流轨迹</Link>
              )}
              {(isBuyer || isSeller) && !['cancelled', 'completed'].includes(o.status) && (
                <button onClick={fileDispute} className="btn-secondary w-full py-2.5 text-sm text-red-600 hover:bg-red-50">⚠️ 提交争议处理</button>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <h4 className="font-semibold text-sm text-slate-700 mb-3">💰 资金监管账户</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div><div className="font-bold text-slate-800">托管总额</div></div>
                  <div className="text-2xl font-bold text-slate-900">{formatCurrency(o.total_amount)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div><div className="text-sm text-slate-600">定金</div>
                    <div className="text-[10px] text-slate-400">{deposit ? PAYMENT_STATUS[deposit.status]?.label : '待支付'}</div>
                  </div>
                  <div className={`font-bold ${deposit?.frozen_at ? 'text-amber-600' : deposit?.released_at ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {formatCurrency(o.deposit_amount)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div><div className="text-sm text-slate-600">尾款</div>
                    <div className="text-[10px] text-slate-400">{o.status === 'completed' ? '已支付' : '质检验收后支付'}</div>
                  </div>
                  <div className="font-bold text-slate-600">{formatCurrency(o.total_amount - o.deposit_amount)}</div>
                </div>
              </div>
            </div>

            <div className="mt-5 p-4 bg-slate-50 rounded-xl text-xs text-slate-500 space-y-1.5 leading-relaxed">
              <div className="font-semibold text-slate-600 mb-1">🛡️ 平台交易保障</div>
              <div>✓ 资金托管监管，确保交易安全</div>
              <div>✓ CMA权威机构第三方质检</div>
              <div>✓ 溯源码对接生态环境部固废系统</div>
              <div>✓ CA认证电子合同法律效力</div>
              <div>✓ 7×24小时客服争议调解</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ k, v, highlight }: { k: string; v: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-lg ${highlight ? 'bg-white border border-purple-200' : ''}`}>
      <div className="text-[11px] text-slate-400 mb-1">{k}</div>
      <div className="font-semibold text-slate-800">{v}</div>
    </div>
  );
}
