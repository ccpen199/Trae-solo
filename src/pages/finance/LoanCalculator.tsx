import { useState, useMemo } from "react";
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Calendar,
  Percent,
  BarChart3,
  Info,
  Download,
  FileText,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

export default function LoanCalculator() {
  const [amount, setAmount] = useState(200000);
  const [years, setYears] = useState(3);
  const [annualRate, setAnnualRate] = useState(4.35);
  const [method, setMethod] = useState<"equal_payment" | "equal_principal">("equal_payment");

  const months = years * 12;
  const monthlyRate = annualRate / 100 / 12;

  const schedule = useMemo(() => {
    const result: {
      month: number;
      payment: number;
      principal: number;
      interest: number;
      balance: number;
    }[] = [];
    let balance = amount;

    if (method === "equal_payment") {
      const payment =
        monthlyRate === 0
          ? amount / months
          : (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
            (Math.pow(1 + monthlyRate, months) - 1);
      for (let i = 1; i <= months; i++) {
        const interest = balance * monthlyRate;
        const principal = payment - interest;
        balance = Math.max(0, balance - principal);
        result.push({ month: i, payment, principal, interest, balance });
      }
    } else {
      const principalPart = amount / months;
      for (let i = 1; i <= months; i++) {
        const interest = balance * monthlyRate;
        const payment = principalPart + interest;
        balance = Math.max(0, balance - principalPart);
        result.push({ month: i, payment, principal: principalPart, interest, balance });
      }
    }
    return result;
  }, [amount, months, monthlyRate, method]);

  const totalPayment = schedule.reduce((s, r) => s + r.payment, 0);
  const totalInterest = totalPayment - amount;
  const firstPayment = schedule[0]?.payment || 0;
  const lastPayment = schedule[schedule.length - 1]?.payment || 0;

  const yearlyChart = useMemo(() => {
    const arr: { year: string; principal: number; interest: number }[] = [];
    for (let y = 1; y <= years; y++) {
      const slice = schedule.slice((y - 1) * 12, y * 12);
      arr.push({
        year: `第${y}年`,
        principal: Math.round(slice.reduce((s, r) => s + r.principal, 0)),
        interest: Math.round(slice.reduce((s, r) => s + r.interest, 0)),
      });
    }
    return arr;
  }, [schedule, years]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }).format(n);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="section-title">
            <Calculator className="w-5 h-5" /> 贷款额度试算
          </h3>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="input-label mb-0 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" /> 贷款金额
                </label>
                <span className="text-lg font-bold text-brand-600">{(amount / 10000).toFixed(1)}万元</span>
              </div>
              <input
                type="range"
                min={10000}
                max={1000000}
                step={10000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>1万</span>
                <span>100万</span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="input mt-2"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="input-label mb-0 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> 贷款期限
                </label>
                <span className="text-lg font-bold text-brand-600">{years}年（{months}期）</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                step={1}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
              <div className="flex gap-1 mt-2">
                {[1, 3, 5, 10, 20].map((y) => (
                  <button
                    key={y}
                    onClick={() => setYears(y)}
                    className={`flex-1 py-1.5 rounded text-sm transition ${
                      years === y ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {y}年
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="input-label mb-0 flex items-center gap-1">
                  <Percent className="w-4 h-4" /> 年化利率
                </label>
                <span className="text-lg font-bold text-rose-600">{annualRate.toFixed(2)}%</span>
              </div>
              <input
                type="range"
                min={3}
                max={18}
                step={0.05}
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
              <div className="flex gap-1 mt-2">
                {[
                  { l: "LPR-1年", v: 3.45 },
                  { l: "LPR-5年", v: 3.95 },
                  { l: "消费贷", v: 4.35 },
                  { l: "经营贷", v: 5.6 },
                ].map((r) => (
                  <button
                    key={r.l}
                    onClick={() => setAnnualRate(r.v)}
                    className={`flex-1 py-1.5 rounded text-xs transition ${
                      Math.abs(annualRate - r.v) < 0.01
                        ? "bg-rose-500 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {r.l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="input-label">还款方式</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { k: "equal_payment", l: "等额本息", d: "每月还款额相同" },
                  { k: "equal_principal", l: "等额本金", d: "每月本金相同" },
                ].map((m) => (
                  <div
                    key={m.k}
                    onClick={() => setMethod(m.k as typeof method)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                      method === m.k
                        ? "border-brand-500 bg-brand-50"
                        : "border-slate-200 hover:border-brand-200"
                    }`}
                  >
                    <div className={`text-sm font-semibold ${method === m.k ? "text-brand-600" : "text-slate-700"}`}>
                      {m.l}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{m.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: "月供（首月）", v: fmt(firstPayment), c: "text-brand-600", icon: DollarSign },
              { l: method === "equal_payment" ? "月供（末月）" : "月供（末月）", v: fmt(lastPayment), c: "text-brand-600", icon: DollarSign },
              { l: "还款总额", v: fmt(totalPayment), c: "text-rose-600", icon: TrendingUp },
              { l: "利息总额", v: fmt(totalInterest), c: "text-gold-600", icon: Percent },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.l} className="card">
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Icon className="w-3.5 h-3.5" /> {s.l}
                  </div>
                  <div className={`text-xl font-bold mt-2 ${s.c}`}>{s.v}</div>
                </div>
              );
            })}
          </div>

          <div className="card">
            <h3 className="section-title mb-1">
              <BarChart3 className="w-5 h-5" /> 年度还款构成
            </h3>
            <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> 单位：元，蓝色为本金，橙色为利息
            </p>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={yearlyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip
                    formatter={(v: number) => fmt(v)}
                    contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                  />
                  <Legend />
                  <Bar dataKey="principal" name="本金" stackId="a">
                    <Cell fill="#1B3A5C" />
                  </Bar>
                  <Bar dataKey="interest" name="利息" stackId="a">
                    <Cell fill="#D4A843" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title mb-0">
            <FileText className="w-5 h-5" /> 还款计划表（前12期）
          </h3>
          <button className="btn-secondary text-sm">
            <Download className="w-4 h-4" /> 导出完整表格
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left py-2.5 px-4 font-medium">期数</th>
                <th className="text-right py-2.5 px-4 font-medium">月供</th>
                <th className="text-right py-2.5 px-4 font-medium">本金</th>
                <th className="text-right py-2.5 px-4 font-medium">利息</th>
                <th className="text-right py-2.5 px-4 font-medium">剩余本金</th>
              </tr>
            </thead>
            <tbody>
              {schedule.slice(0, 12).map((r) => (
                <tr key={r.month} className="border-t border-slate-100">
                  <td className="py-2.5 px-4 text-slate-600">第{r.month}期</td>
                  <td className="py-2.5 px-4 text-right font-semibold">{fmt(r.payment)}</td>
                  <td className="py-2.5 px-4 text-right text-brand-600">{fmt(r.principal)}</td>
                  <td className="py-2.5 px-4 text-right text-gold-600">{fmt(r.interest)}</td>
                  <td className="py-2.5 px-4 text-right text-slate-600">{fmt(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
