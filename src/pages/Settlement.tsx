import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Plus, ArrowUpRight, ArrowDownRight, FileText, Settings } from 'lucide-react';

const API = '/api';

interface FundPool {
  id: number;
  org_id: number;
  org_name: string;
  balance: number;
  frozen: number;
  pending: number;
}

interface SettlementDetail {
  studentName?: string;
  name?: string;
  amount?: number;
}

interface SettlementBill {
  id: number;
  org_id: number;
  org_name: string;
  amount: number;
  fee: number;
  cycle: string;
  status: string;
  details: SettlementDetail[];
  created_at: string;
}

interface SettlementConfig {
  fee_rate: number;
  min_settle_amount: number;
  auto_settle: boolean;
  settle_day: number;
  overtime_rate: number;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, options);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || '请求失败');
  return json.data;
}

export default function Settlement() {
  const navigate = useNavigate();
  const [pool, setPool] = useState<FundPool | null>(null);
  const [bills, setBills] = useState<SettlementBill[]>([]);
  const [config, setConfig] = useState<SettlementConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [recharging, setRecharging] = useState(false);
  const [showSettle, setShowSettle] = useState(false);
  const [settleForm, setSettleForm] = useState({ org_id: '1', amount: '', cycle: 'monthly', details: '' });
  const [settling, setSettling] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [poolData, billsData, configData] = await Promise.all([
        apiFetch<FundPool>('/settlement/pool?org_id=1'),
        apiFetch<{ items: SettlementBill[]; total: number }>('/settlement/bills?org_id=1&pageSize=10'),
        apiFetch<SettlementConfig>('/settlement/config'),
      ]);
      setPool(poolData);
      setBills(billsData.items || []);
      setConfig(configData);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecharge = async () => {
    const amount = Number(rechargeAmount);
    if (!amount || amount <= 0) return;
    setRecharging(true);
    try {
      await apiFetch('/settlement/pool/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: 1, amount }),
      });
      setShowRecharge(false);
      setRechargeAmount('');
      fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRecharging(false);
    }
  };

  const settleAmount = Number(settleForm.amount) || 0;
  const feeRate = config?.fee_rate || 0.05;
  const calculatedFee = Math.round(settleAmount * feeRate * 100) / 100;
  const balanceInsufficient = pool !== null && settleAmount > pool.balance;

  const handleSettle = async () => {
    if (!settleForm.amount || !settleForm.org_id) return;
    if (balanceInsufficient) return;
    setSettling(true);
    try {
      const details = settleForm.details
        ? settleForm.details.split('\n').map(line => {
            const [name, amount] = line.split(':');
            return { studentName: name?.trim(), amount: Number(amount) || 0 };
          }).filter(d => d.studentName)
        : [];
      await apiFetch('/settlement/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: Number(settleForm.org_id),
          amount: Number(settleForm.amount),
          cycle: settleForm.cycle,
          details,
        }),
      });
      setShowSettle(false);
      setSettleForm({ org_id: '1', amount: '', cycle: 'monthly', details: '' });
      fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSettling(false);
    }
  };

  const total = pool ? pool.balance + pool.frozen + pool.pending : 0;
  const ringData = pool ? [
    { label: '可用余额', value: pool.balance, color: '#0F4C75', percent: total > 0 ? (pool.balance / total) * 100 : 0 },
    { label: '冻结金额', value: pool.frozen, color: '#FF6B35', percent: total > 0 ? (pool.frozen / total) * 100 : 0 },
    { label: '待结算', value: pool.pending, color: '#F59E0B', percent: total > 0 ? (pool.pending / total) * 100 : 0 },
  ] : [];

  const cycleLabel: Record<string, string> = { daily: '日结', weekly: '周结', monthly: '月结' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold text-gray-800">结算中心</h2>
        <button onClick={() => navigate('/settlement/bills')} className="btn-outline flex items-center gap-2">
          <FileText size={16} />账单明细
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card-base p-6 animate-fade-in stagger-1">
              <p className="text-sm text-gray-500 mb-1">资金池总余额</p>
              <p className="text-4xl font-bold font-heading">
                <span className="text-lg">¥</span>
                <span className="font-mono">{total.toLocaleString()}</span>
              </p>
              <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="text-emerald-600">可用 <span className="font-mono font-bold">¥{pool?.balance.toLocaleString()}</span></span>
                <span className="text-accent">冻结 <span className="font-mono font-bold">¥{pool?.frozen.toLocaleString()}</span></span>
                <span className="text-amber-600">待结 <span className="font-mono font-bold">¥{pool?.pending.toLocaleString()}</span></span>
              </div>
              <button onClick={() => setShowRecharge(true)} className="mt-4 btn-accent w-full flex items-center justify-center gap-2">
                <Plus size={16} />充值
              </button>
            </div>

            <div className="card-base p-6 animate-fade-in stagger-2">
              <h3 className="font-heading font-semibold text-gray-800 mb-4">资金分布</h3>
              <div className="relative w-40 h-40 mx-auto mb-4">
                <svg className="w-40 h-40 -rotate-90" viewBox="0 0 160 160">
                  {ringData.reduce<{ offset: number; elements: JSX.Element[] }>((acc, d) => {
                    const circumference = 2 * Math.PI * 60;
                    const strokeDash = (d.percent / 100) * circumference;
                    acc.elements.push(
                      <circle key={d.label} cx="80" cy="80" r="60" fill="none" stroke={d.color} strokeWidth="20"
                        strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                        strokeDashoffset={-acc.offset} strokeLinecap="round" className="transition-all duration-700" />
                    );
                    acc.offset += strokeDash;
                    return acc;
                  }, { offset: 0, elements: [] }).elements}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="font-mono text-lg font-bold">¥{total.toLocaleString()}</span>
                  <span className="text-xs text-gray-400">总计</span>
                </div>
              </div>
              <div className="space-y-2">
                {ringData.map((d) => (
                  <div key={d.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-600">{d.label}</span>
                    </div>
                    <span className="font-mono text-gray-800">¥{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-base p-6 animate-fade-in stagger-3">
              <h3 className="font-heading font-semibold text-gray-800 mb-4">快捷操作</h3>
              <div className="space-y-3">
                <button onClick={() => setShowSettle(true)} className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary"><DollarSign size={18} /></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">发起结算</p>
                    <p className="text-xs text-gray-500">按岗位批量结算</p>
                  </div>
                </button>
                <button onClick={() => navigate('/settlement/bills')} className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left">
                  <div className="p-2 rounded-lg bg-accent/10 text-accent"><FileText size={18} /></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">查看账单</p>
                    <p className="text-xs text-gray-500">历史结算明细</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="card-base p-5">
            <h3 className="font-heading font-semibold text-gray-800 mb-4">交易记录</h3>
            {bills.length === 0 ? (
              <p className="text-center text-gray-400 py-8">暂无交易记录</p>
            ) : (
              <div className="space-y-2">
                {bills.map((bill) => (
                  <div key={bill.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                    <div className={`p-2 rounded-lg ${bill.status === 'completed' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                      {bill.status === 'completed' ? <ArrowUpRight size={16} className="text-emerald-500" /> : <ArrowDownRight size={16} className="text-amber-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{bill.org_name} · {cycleLabel[bill.cycle] || bill.cycle}</p>
                      <p className="text-xs text-gray-400">{bill.created_at}</p>
                    </div>
                    <span className={`font-mono font-bold ${bill.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      -¥{bill.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {config && (
            <div className="card-base p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings size={16} className="text-gray-500" />
                <h3 className="font-heading font-semibold text-gray-800">结算配置</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">手续费率</p>
                  <p className="font-mono font-bold text-accent">{(config.fee_rate * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">最低结算金额</p>
                  <p className="font-mono font-bold">¥{config.min_settle_amount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">自动结算</p>
                  <p className="font-bold">{config.auto_settle ? '已开启' : '未开启'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">结算日</p>
                  <p className="font-mono font-bold">每月{config.settle_day}日</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {showRecharge && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowRecharge(false)}>
          <div className="bg-white rounded-2xl p-6 w-96 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading font-bold text-gray-800 text-lg mb-4">充值</h3>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">充值金额</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
                <input type="number" value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value)} placeholder="请输入金额" className="input-base pl-8 font-mono" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {[5000, 10000, 20000, 50000].map((v) => (
                <button key={v} onClick={() => setRechargeAmount(String(v))} className="flex-1 bg-gray-100 py-2 rounded-lg text-sm font-mono text-gray-600 hover:bg-gray-200 transition-colors">
                  {v.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowRecharge(false)} className="btn-outline flex-1">取消</button>
              <button onClick={handleRecharge} disabled={recharging || !rechargeAmount} className="btn-accent flex-1 disabled:opacity-50">
                {recharging ? '充值中...' : '确认充值'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowSettle(false)}>
          <div className="bg-white rounded-2xl p-6 w-[480px] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading font-bold text-gray-800 text-lg mb-4">发起结算</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">机构ID</label>
                <input type="number" value={settleForm.org_id} onChange={(e) => setSettleForm({ ...settleForm, org_id: e.target.value })} className="input-base font-mono" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">结算周期</label>
                <select value={settleForm.cycle} onChange={(e) => setSettleForm({ ...settleForm, cycle: e.target.value })} className="input-base">
                  <option value="daily">日结</option>
                  <option value="weekly">周结</option>
                  <option value="monthly">月结</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">结算金额</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
                  <input type="number" value={settleForm.amount} onChange={(e) => setSettleForm({ ...settleForm, amount: e.target.value })} placeholder="请输入金额" className="input-base pl-8 font-mono" />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">手续费率</span>
                  <span className="font-mono">{(feeRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">手续费</span>
                  <span className="font-mono text-accent font-bold">¥{calculatedFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">实际到账</span>
                  <span className="font-mono">¥{(settleAmount - calculatedFee).toLocaleString()}</span>
                </div>
              </div>
              {balanceInsufficient && (
                <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm">余额不足，当前可用余额 ¥{pool?.balance.toLocaleString()}</div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">明细（每行一条：姓名:金额）</label>
                <textarea
                  value={settleForm.details}
                  onChange={(e) => setSettleForm({ ...settleForm, details: e.target.value })}
                  className="input-base min-h-[80px] resize-none"
                  placeholder="张三:5000&#10;李四:3000"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowSettle(false)} className="btn-outline flex-1">取消</button>
              <button onClick={handleSettle} disabled={settling || !settleForm.amount || balanceInsufficient} className="btn-primary flex-1 disabled:opacity-50">
                {settling ? '结算中...' : '确认结算'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
