import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { NEGOTIATION_STATUS, formatCurrency, formatWeight, formatDateTime } from '../../lib/constants';

export default function NegotiationDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ price: '', qty: '', msg: '' });
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    const d: any = await api.get(`/negotiations/${id}`);
    setData(d.negotiation);
    setMsgs(d.messages);
    setLoading(false);
    setTimeout(() => scrollRef.current?.scrollTo({ top: 9999999, behavior: 'smooth' }), 50);
  };

  useEffect(() => { fetchData(); }, [id]);

  const send = async () => {
    if (!form.msg && !form.price && !form.qty) return;
    setSubmitting(true);
    try {
      await api.post(`/negotiations/${id}/messages`, {
        price: form.price ? Number(form.price) : undefined,
        quantity: form.qty ? Number(form.qty) : undefined,
        message: form.msg || undefined
      });
      setForm({ price: '', qty: '', msg: '' });
      fetchData();
    } finally { setSubmitting(false); }
  };

  const accept = async () => {
    if (!confirm('确认接受当前议价条件？接受后将自动生成电子合同')) return;
    try {
      const r: any = await api.post(`/negotiations/${id}/accept`, {});
      nav(`/contracts/${r.contract_id}`);
    } catch (e: any) { alert(e.error || '操作失败'); }
  };

  const reject = async () => {
    const reason = prompt('请说明拒绝原因（选填）');
    try {
      await api.post(`/negotiations/${id}/reject`, { reason });
      fetchData();
    } catch (e: any) { alert(e.error); }
  };

  if (loading || !data) return <div className="card p-16 text-center text-slate-400">加载中...</div>;

  const st = NEGOTIATION_STATUS[data.status];
  const isResponder = data.responder_id === user?.id;
  const isActive = data.status === 'active';

  return (
    <div className="space-y-5">
      <Link to="/negotiations" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600">
        ← 返回议价列表
      </Link>

      <div className="card p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`status-badge ${st?.color}`}>{st?.label}</span>
              <span className="text-xs text-slate-400">议价编号: {data.id.substring(0, 8).toUpperCase()}</span>
            </div>
            <Link to={`/opportunities/${data.opportunity_id}`} className="text-xl font-bold text-slate-900 hover:text-primary-600">
              {data.opp_title}
            </Link>
            <div className="text-sm text-slate-500 mt-1">{data.category} · {data.sub_category} · 原始数量 {formatWeight(data.opp_quantity)}</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 py-4 border-y border-slate-100 bg-slate-50/50 -mx-5 px-5 my-3">
          <div>
            <div className="text-[11px] text-slate-400">发起方</div>
            <div className="font-semibold text-slate-800 mt-0.5">{data.initiator_name}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">被议价方</div>
            <div className="font-semibold text-slate-800 mt-0.5">{data.responder_name}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">当前报价</div>
            <div className="font-bold text-primary-700 text-lg mt-0.5">{formatCurrency(data.current_price)}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">意向数量</div>
            <div className="font-bold text-slate-800 text-lg mt-0.5">{formatWeight(data.current_quantity)}</div>
          </div>
        </div>

        {isResponder && isActive && (
          <div className="flex gap-3 mt-3">
            <button onClick={accept} className="btn-primary flex-1 py-2.5">✓ 接受当前条件并生成合同</button>
            <button onClick={reject} className="btn-secondary flex-1 py-2.5 text-red-600 hover:bg-red-50">✕ 拒绝议价</button>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-800">💬 议价记录</h3>
        </div>

        <div ref={scrollRef} className="h-[480px] overflow-y-auto scrollbar-thin p-5 space-y-4 bg-slate-50/30">
          {msgs.map(m => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${mine ? 'order-2' : ''}`}>
                  <div className={`text-xs text-slate-500 mb-1 ${mine ? 'text-right' : ''}`}>
                    {m.company_name} · {formatDateTime(m.created_at)}
                  </div>
                  {(m.price || m.quantity) && (
                    <div className={`mb-2 p-3 rounded-xl border-2 ${
                      mine ? 'bg-primary-50 border-primary-200' : 'bg-white border-slate-200'
                    } shadow-sm`}>
                      <div className="text-xs text-slate-500 mb-1 flex gap-4">
                        {m.price && <span>报价: <span className="font-bold text-primary-700">{formatCurrency(m.price)}/吨</span></span>}
                        {m.quantity && <span>数量: <span className="font-bold text-slate-800">{formatWeight(m.quantity)}</span></span>}
                      </div>
                      {(m.price && m.quantity) && (
                        <div className="text-sm font-semibold text-amber-600 border-t border-slate-200/60 pt-1.5 mt-1">
                          合计: {formatCurrency(Math.round(m.price * m.quantity))}
                        </div>
                      )}
                    </div>
                  )}
                  {m.message && (
                    <div className={`p-3 rounded-xl text-sm leading-relaxed ${
                      mine ? 'bg-primary-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                    }`}>
                      {m.message}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {isActive && (
          <div className="p-4 border-t border-slate-100 bg-white space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">修改报价</label>
                <input type="number" value={form.price} placeholder="元/吨" onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="label">修改数量</label>
                <input type="number" value={form.qty} placeholder="吨" onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} className="input-field" />
              </div>
              <div className="flex items-end">
                <div className="text-xs text-slate-500">
                  💡 可只填写报价/数量修改条件，或直接留言协商
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={form.msg}
                onChange={e => setForm(f => ({ ...f, msg: e.target.value }))}
                placeholder="输入消息内容...（Enter 发送）"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                className="input-field flex-1 resize-none"
              />
              <button onClick={send} disabled={submitting} className="btn-primary px-8 h-10 self-end">
                {submitting ? '发送中' : '发送 ↑'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
