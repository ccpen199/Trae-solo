import { useState } from "react";
import {
  RefreshCcw,
  AlertTriangle,
  Upload,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Gavel,
  Plus,
  Search,
  ArrowRight,
} from "lucide-react";
import { useApi } from "@/utils/api";
import { formatMoney, formatDate } from "@/utils/format";

interface CorrectionRequestItem {
  id: string;
  paymentId: string;
  category: string;
  reason: string;
  status: "pending" | "auto_approved" | "arbitrating" | "refunded" | "rejected";
  createDate: string;
  correctAccountNo: string;
  wrongAccountNo: string;
  amount: number;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "待审核", color: "tag-warning", icon: Clock },
  auto_approved: { label: "自动通过", color: "tag-info", icon: CheckCircle2 },
  arbitrating: { label: "仲裁中", color: "tag-gold", icon: Gavel },
  refunded: { label: "已退款", color: "tag-success", icon: CheckCircle2 },
  rejected: { label: "已驳回", color: "tag-danger", icon: XCircle },
};

const STEPS = [
  { key: "pending", label: "提交申请" },
  { key: "auto_approved", label: "系统审核" },
  { key: "arbitrating", label: "人工仲裁" },
  { key: "refunded", label: "退款完成" },
];

export default function CorrectionPage() {
  const [tab, setTab] = useState<"list" | "apply">("list");
  const { data: list } = useApi<CorrectionRequestItem[]>("/api/payment/correction/list");
  const [selected, setSelected] = useState<CorrectionRequestItem | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 border-b border-slate-200">
          {[
            { k: "list", l: "冲正记录", icon: FileText },
            { k: "apply", l: "申请冲正", icon: Plus },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.k}
                onClick={() => setTab(t.k as typeof tab)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition ${
                  tab === t.k
                    ? "border-brand-500 text-brand-600"
                    : "border-transparent text-slate-500 hover:text-brand-500"
                }`}
              >
                <Icon className="w-4 h-4" /> {t.l}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "list" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { l: "待审核", v: 2, c: "from-amber-400 to-amber-600" },
              { l: "仲裁中", v: 1, c: "from-gold-400 to-gold-600" },
              { l: "已退款", v: 15, c: "from-emerald-400 to-emerald-600" },
              { l: "累计退款", v: 3856.0, c: "from-brand-400 to-brand-600", isMoney: true },
            ].map((s) => (
              <div key={s.l} className={`bg-gradient-to-br ${s.c} text-white rounded-xl2 shadow-card p-5`}>
                <div className="text-sm/relaxed opacity-90">{s.l}</div>
                <div className="text-3xl font-bold mt-2">
                  {s.isMoney ? formatMoney(s.v as number) : s.v}
                </div>
              </div>
            ))}
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left py-3 px-5 font-medium">申请编号</th>
                  <th className="text-left py-3 px-5 font-medium">缴费项目</th>
                  <th className="text-left py-3 px-5 font-medium">金额</th>
                  <th className="text-left py-3 px-5 font-medium">原因</th>
                  <th className="text-left py-3 px-5 font-medium">提交时间</th>
                  <th className="text-left py-3 px-5 font-medium">状态</th>
                  <th className="text-left py-3 px-5 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {(list || []).map((r) => {
                  const st = STATUS_MAP[r.status];
                  const Icon = st.icon;
                  return (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="py-3 px-5 font-mono text-xs text-slate-600">{r.id}</td>
                      <td className="py-3 px-5 font-medium text-brand-700">{r.category}</td>
                      <td className="py-3 px-5 font-semibold">{formatMoney(r.amount)}</td>
                      <td className="py-3 px-5 text-slate-600 max-w-xs truncate">{r.reason}</td>
                      <td className="py-3 px-5 text-slate-500">{formatDate(r.createDate)}</td>
                      <td className="py-3 px-5">
                        <span className={st.color}>
                          <Icon className="w-3 h-3" /> {st.label}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <button
                          onClick={() => setSelected(r)}
                          className="btn-ghost text-xs px-2 py-1"
                        >
                          查看进度 <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "apply" && (
        <div className="card max-w-3xl">
          <h3 className="section-title">
            <RefreshCcw className="w-5 h-5" /> 错缴冲正申请
          </h3>
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-800 mb-5 flex gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">申请须知</div>
              <p className="mt-1 opacity-90">
                冲正申请仅限近90天内的错缴订单，每笔订单仅可申请一次。提交后系统将自动审核，简单场景24小时内完成退款，复杂场景进入人工仲裁（1-3个工作日）。
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="input-label">原缴费订单号</label>
              <div className="flex gap-2">
                <input className="input" placeholder="请输入16位订单号" />
                <button className="btn-secondary"><Search className="w-4 h-4" /> 查询</button>
              </div>
            </div>
            <div>
              <label className="input-label">错缴户号</label>
              <input className="input" placeholder="请输入错误的缴费户号" />
            </div>
            <div>
              <label className="input-label">正确户号</label>
              <input className="input" placeholder="请输入正确的缴费户号" />
            </div>
            <div>
              <label className="input-label">错缴金额</label>
              <input className="input" placeholder="自动回填" disabled />
            </div>
            <div>
              <label className="input-label">错缴时间</label>
              <input type="date" className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="input-label">错缴原因</label>
              <select className="input">
                <option value="">请选择错缴原因</option>
                <option>户号输入错误</option>
                <option>姓名/户名不匹配</option>
                <option>重复缴费</option>
                <option>金额填写错误</option>
                <option>其他</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="input-label">详细说明</label>
              <textarea
                rows={4}
                className="input resize-none"
                placeholder="请详细描述错缴情况，以便快速审核"
              />
            </div>
            <div className="md:col-span-2">
              <label className="input-label">证明材料（可选）</label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-brand-300 transition cursor-pointer">
                <Upload className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">点击或拖拽上传凭证</p>
                <p className="text-xs text-slate-400 mt-1">支持 JPG/PNG/PDF，单文件不超过10MB</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button className="btn-primary px-8">提交冲正申请</button>
            <button className="btn-secondary" onClick={() => setTab("list")}>取消</button>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-brand-gradient text-white px-6 py-5">
              <h3 className="font-bold text-lg">冲正进度追踪</h3>
              <p className="text-white/80 text-sm mt-1">申请编号：{selected.id}</p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                {STEPS.map((step, idx) => {
                  const curIdx = STEPS.findIndex((s) => s.key === selected.status);
                  const done =
                    idx < curIdx ||
                    (selected.status === "refunded" && idx === STEPS.length - 1) ||
                    (selected.status === "auto_approved" && idx <= 1);
                  const active = idx === curIdx;
                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center relative">
                      {idx < STEPS.length - 1 && (
                        <div
                          className={`absolute top-3 left-1/2 w-full h-0.5 ${
                            done ? "bg-emerald-400" : "bg-slate-200"
                          }`}
                        />
                      )}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center relative z-10 text-xs font-bold ${
                          done
                            ? "bg-emerald-500 text-white"
                            : active
                            ? "bg-brand-500 text-white ring-4 ring-brand-100"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div className={`mt-2 text-xs ${active ? "text-brand-600 font-semibold" : "text-slate-500"}`}>
                        {step.label}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="w-24 text-slate-500">缴费项目：</span>
                  <span className="font-medium">{selected.category}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-slate-500">错缴金额：</span>
                  <span className="font-semibold text-rose-600">{formatMoney(selected.amount)}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-slate-500">错缴户号：</span>
                  <span className="font-mono">{selected.wrongAccountNo}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-slate-500">正确户号：</span>
                  <span className="font-mono">{selected.correctAccountNo}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-slate-500">申请理由：</span>
                  <span className="text-slate-700">{selected.reason}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-slate-500">预计完成：</span>
                  <span className="text-emerald-600">
                    {selected.status === "arbitrating" ? "1-3个工作日内" : "24小时内"}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
              {selected.status === "arbitrating" && (
                <button className="btn-secondary">
                  <Upload className="w-4 h-4" /> 补充材料
                </button>
              )}
              <button className="btn-primary" onClick={() => setSelected(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
