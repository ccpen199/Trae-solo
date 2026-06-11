import { useState } from "react";
import {
  Building2,
  Plus,
  Search,
  Download,
  DollarSign,
  RefreshCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Settings,
  TrendingUp,
  FileText,
  ArrowRight,
} from "lucide-react";
import { useApi } from "@/utils/api";
import { formatMoney, formatDate } from "@/utils/format";

interface ProfitRule {
  id: string;
  merchantName: string;
  category: string;
  ratio: number;
  settlementCycle: "daily" | "weekly" | "monthly";
  totalAmount: number;
}

interface Settlement {
  id: string;
  merchantName: string;
  period: string;
  amount: number;
  profitAmount: number;
  status: "pending" | "processing" | "settled" | "failed";
  bank: string;
  createDate: string;
  settledDate?: string;
}

const CYCLE_LABEL: Record<string, string> = {
  daily: "日结",
  weekly: "周结",
  monthly: "月结",
};

const STATUS_LABEL: Record<string, { l: string; c: string; i: typeof Clock }> = {
  pending: { l: "待清算", c: "tag-warning", i: Clock },
  processing: { l: "清算中", c: "tag-info", i: RefreshCcw },
  settled: { l: "已到账", c: "tag-success", i: CheckCircle2 },
  failed: { l: "清算失败", c: "tag-danger", i: AlertTriangle },
};

export default function MerchantSettlement() {
  const [tab, setTab] = useState<"settlement" | "rules" | "create">("settlement");
  const { data: rules } = useApi<ProfitRule[]>("/api/merchant/profit-rules");
  const { data: settlements } = useApi<Settlement[]>("/api/merchant/settlements");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { l: "本月交易额", v: 12856800, d: "+22.5%", icon: DollarSign, c: "text-brand-600 bg-brand-50" },
          { l: "本月分润", v: 385704, d: "+18.2%", icon: TrendingUp, c: "text-emerald-600 bg-emerald-50" },
          { l: "在途清算", v: 96420, d: "3笔", icon: RefreshCcw, c: "text-amber-600 bg-amber-50" },
          { l: "合作商户", v: 1286, d: "+15家", icon: Building2, c: "text-gold-600 bg-gold-50" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.l} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-slate-500">{s.l}</div>
                  <div className="text-2xl font-bold text-brand-800 mt-1">{formatMoney(s.v)}</div>
                  <div className="text-xs text-emerald-600 mt-1">{s.d}</div>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.c}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 rounded-xl2 p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-lg font-bold">光大银行清算系统已对接</div>
            <div className="text-sm text-white/80">T+1自动清算 · 实时对账 · 资金安全有保障</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="bg-white/15 hover:bg-white/20 btn text-white">
            <FileText className="w-4 h-4" /> 查看银行流水
          </button>
          <button className="bg-white text-brand-600 hover:bg-white/90 btn">
            <RefreshCcw className="w-4 h-4" /> 发起批量清算
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {[
          { k: "settlement", l: "结算管理", icon: DollarSign },
          { k: "rules", l: "分润规则", icon: Settings },
          { k: "create", l: "新建规则", icon: Plus },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k as typeof tab)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition ${
                tab === t.k ? "border-brand-500 text-brand-600" : "border-transparent text-slate-500 hover:text-brand-500"
              }`}
            >
              <Icon className="w-4 h-4" /> {t.l}
            </button>
          );
        })}
      </div>

      {tab === "settlement" && (
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex gap-1">
              {["全部", "待清算", "清算中", "已到账", "失败"].map((f) => (
                <button key={f} className="px-3 py-1.5 text-sm rounded-md hover:bg-slate-100 text-slate-600 transition">
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-9 w-56" placeholder="搜索商户/结算单号" />
              </div>
              <button className="btn-secondary text-sm"><Download className="w-4 h-4" /> 导出对账单</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">结算单号</th>
                  <th className="text-left py-3 px-4 font-medium">商户名称</th>
                  <th className="text-left py-3 px-4 font-medium">账期</th>
                  <th className="text-right py-3 px-4 font-medium">交易金额</th>
                  <th className="text-right py-3 px-4 font-medium">分润金额</th>
                  <th className="text-left py-3 px-4 font-medium">收款银行</th>
                  <th className="text-left py-3 px-4 font-medium">发起时间</th>
                  <th className="text-left py-3 px-4 font-medium">状态</th>
                  <th className="text-left py-3 px-4 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {(settlements || []).map((s) => {
                  const st = STATUS_LABEL[s.status];
                  const Icon = st.i;
                  return (
                    <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">{s.id}</td>
                      <td className="py-3 px-4 font-medium text-brand-700">{s.merchantName}</td>
                      <td className="py-3 px-4 text-slate-600">{s.period}</td>
                      <td className="py-3 px-4 text-right">{formatMoney(s.amount)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600">{formatMoney(s.profitAmount)}</td>
                      <td className="py-3 px-4 text-slate-600">{s.bank}</td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(s.createDate, "YYYY-MM-DD")}</td>
                      <td className="py-3 px-4">
                        <span className={st.c}><Icon className="w-3 h-3" /> {st.l}</span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="btn-ghost text-xs px-2 py-1 text-brand-500">
                          <Eye className="w-3.5 h-3.5" /> 详情
                        </button>
                        {s.status === "failed" && (
                          <button className="btn-ghost text-xs px-2 py-1 text-rose-500">重试</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "rules" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(rules || []).map((r) => (
            <div key={r.id} className="card card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-brand-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-brand-700">{r.merchantName}</div>
                    <div className="text-xs text-slate-500">{r.category}</div>
                  </div>
                </div>
                <span className="tag-info">{CYCLE_LABEL[r.settlementCycle]}</span>
              </div>
              <div className="py-3 border-y border-slate-100 my-2 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-500">分润比例</div>
                  <div className="text-2xl font-bold text-rose-600">{(r.ratio * 100).toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">累计分润</div>
                  <div className="text-xl font-semibold text-emerald-600">{formatMoney(r.totalAmount)}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 btn-secondary text-sm py-1.5">
                  <Settings className="w-3.5 h-3.5" /> 编辑规则
                </button>
                <button className="flex-1 btn-ghost text-sm py-1.5 text-brand-500">
                  查看明细 <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "create" && (
        <div className="card max-w-2xl">
          <h3 className="section-title">
            <Plus className="w-5 h-5" /> 新建分润规则
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="input-label">选择商户</label>
              <select className="input">
                <option value="">请选择商户</option>
                <option>国家电网有限公司</option>
                <option>中国电信集团</option>
                <option>北京市自来水集团</option>
                <option>华润燃气</option>
              </select>
            </div>
            <div>
              <label className="input-label">缴费品类</label>
              <select className="input">
                <option value="">全部品类</option>
                <option>水费</option>
                <option>电费</option>
                <option>燃气费</option>
                <option>通讯费</option>
              </select>
            </div>
            <div>
              <label className="input-label">分润比例 (%)</label>
              <input type="number" step="0.01" className="input" placeholder="例如 0.30" />
            </div>
            <div>
              <label className="input-label">结算周期</label>
              <select className="input">
                <option value="daily">日结（T+1到账）</option>
                <option value="weekly">周结（每周一）</option>
                <option value="monthly">月结（每月1日）</option>
              </select>
            </div>
            <div>
              <label className="input-label">生效日期</label>
              <input type="date" className="input" />
            </div>
            <div>
              <label className="input-label">失效日期（可选）</label>
              <input type="date" className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="input-label">备注</label>
              <textarea rows={3} className="input resize-none" placeholder="补充说明信息" />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button className="btn-primary px-8">保存规则</button>
            <button className="btn-secondary">取消</button>
          </div>
        </div>
      )}
    </div>
  );
}
