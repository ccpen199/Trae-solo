import { useState } from "react";
import {
  Plus,
  Pause,
  XCircle,
  Banknote,
  Calendar,
  CheckCircle2,
  Building2,
  CreditCard,
} from "lucide-react";
import { apiFetch, useApi } from "@/utils/api";
import { formatMoney, formatDate } from "@/utils/format";

interface AutoSign {
  id: string;
  bankName: string;
  accountNo: string;
  category: string;
  status: "active" | "paused" | "cancelled";
  signDate: string;
  nextDeductDate: string;
  nextAmount: number;
}

interface DeductRecord {
  id: string;
  category: string;
  amount: number;
  status: "success" | "failed";
  date: string;
  bank: string;
}

const BANKS = [
  { name: "中国工商银行", code: "ICBC" },
  { name: "中国建设银行", code: "CCB" },
  { name: "中国农业银行", code: "ABC" },
  { name: "中国银行", code: "BOC" },
  { name: "光大银行", code: "CEB" },
  { name: "招商银行", code: "CMB" },
  { name: "交通银行", code: "BCM" },
  { name: "中信银行", code: "CITIC" },
];

export default function AutoDeduct() {
  const [tab, setTab] = useState<"signs" | "records" | "add">("signs");
  const { data: signs } = useApi<AutoSign[]>("/api/payment/auto-deduct/list");
  const { data: records } = useApi<DeductRecord[]>("/api/payment/auto-deduct/records");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const submitSign = async () => {
    setSubmitting(true);
    setSubmitMessage("");
    try {
      const result = await apiFetch<{ success: boolean; signId: string }>("/api/payment/auto-deduct/sign", {
        method: "POST",
        body: JSON.stringify({ bank: "ICBC", accountNo: "622200******8888", categories: ["水费", "电费"] }),
      });
      setSubmitMessage(`签约提交成功，协议号 ${result.signId}`);
      setTab("signs");
    } catch {
      setSubmitMessage("签约提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (s: AutoSign["status"]) => {
    if (s === "active") return <span className="tag-success"><CheckCircle2 className="w-3 h-3" />生效中</span>;
    if (s === "paused") return <span className="tag-warning"><Pause className="w-3 h-3" />已暂停</span>;
    return <span className="tag-danger"><XCircle className="w-3 h-3" />已解约</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 border-b border-slate-200 flex-1">
          {[
            { k: "signs", l: "签约管理" },
            { k: "records", l: "代扣记录" },
            { k: "add", l: "新增签约" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as typeof tab)}
              className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition ${
                tab === t.k
                  ? "border-brand-500 text-brand-600"
                  : "border-transparent text-slate-500 hover:text-brand-500"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
        <button onClick={() => setTab("add")} className="btn-primary shrink-0">
          <Plus className="w-4 h-4" /> 新增签约
        </button>
      </div>

      {tab === "signs" && (
        <div className="space-y-4">
          {submitMessage && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {submitMessage}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(signs || []).map((s) => (
              <div key={s.id} className="card card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-brand-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-brand-700">{s.category}</div>
                    <div className="text-xs text-slate-500">{s.bankName}</div>
                  </div>
                </div>
                {statusBadge(s.status)}
              </div>
              <div className="text-sm text-slate-600 mb-1">
                <span className="text-slate-400">Ⅱ类户：</span>
                <span className="font-mono">{s.accountNo}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mt-3 py-3 border-t border-slate-100">
                <div>
                  <Calendar className="w-3 h-3 inline mr-1" />
                  签约：{formatDate(s.signDate, "YYYY-MM-DD")}
                </div>
                <div>
                  <Banknote className="w-3 h-3 inline mr-1" />
                  下次：{formatDate(s.nextDeductDate, "YYYY-MM-DD")}
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xs text-slate-500">预扣金额</div>
                  <div className="text-xl font-bold text-rose-600">{formatMoney(s.nextAmount)}</div>
                </div>
                <div className="flex gap-2">
                  {s.status === "active" && (
                    <button className="btn-secondary text-xs px-3 py-1.5">
                      <Pause className="w-3 h-3" /> 暂停
                    </button>
                  )}
                  {s.status === "paused" && (
                    <button className="btn-primary text-xs px-3 py-1.5">
                      <CheckCircle2 className="w-3 h-3" /> 恢复
                    </button>
                  )}
                  {s.status !== "cancelled" && (
                    <button className="btn-ghost text-rose-500 text-xs px-3 py-1.5 hover:bg-rose-50">
                      <XCircle className="w-3 h-3" /> 解约
                    </button>
                  )}
                </div>
              </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "records" && (
        <div className="card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium">扣款时间</th>
                <th className="text-left py-3 px-4 font-medium">缴费项目</th>
                <th className="text-left py-3 px-4 font-medium">扣款银行</th>
                <th className="text-left py-3 px-4 font-medium">金额</th>
                <th className="text-left py-3 px-4 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {(records || []).map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-500">{formatDate(r.date)}</td>
                  <td className="py-3 px-4 font-medium text-brand-700">{r.category}</td>
                  <td className="py-3 px-4 text-slate-600">{r.bank}</td>
                  <td className="py-3 px-4 font-semibold">{formatMoney(r.amount)}</td>
                  <td className="py-3 px-4">
                    {r.status === "success" ? (
                      <span className="tag-success"><CheckCircle2 className="w-3 h-3" />成功</span>
                    ) : (
                      <span className="tag-danger"><XCircle className="w-3 h-3" />失败</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "add" && (
        <div className="card max-w-2xl">
          <h3 className="section-title">
            <CreditCard className="w-5 h-5" /> 银行Ⅱ类户签约
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="input-label">选择银行</label>
              <select className="input">
                <option value="">请选择开户银行</option>
                {BANKS.map((b) => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">银行卡号（Ⅱ类户）</label>
              <input className="input" placeholder="请输入银行Ⅱ类户卡号" />
            </div>
            <div>
              <label className="input-label">持卡人姓名</label>
              <input className="input" placeholder="请输入真实姓名" />
            </div>
            <div>
              <label className="input-label">身份证号</label>
              <input className="input" placeholder="请输入18位身份证号" />
            </div>
            <div>
              <label className="input-label">银行预留手机号</label>
              <input className="input" placeholder="请输入预留手机号" />
            </div>
            <div>
              <label className="input-label">验证码</label>
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="短信验证码" />
                <button className="btn-secondary whitespace-nowrap">获取验证码</button>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="input-label">签约缴费项目</label>
              <div className="grid grid-cols-3 gap-2">
                {["水费", "电费", "燃气费", "暖气费", "通讯费", "社保"].map((c) => (
                  <label key={c} className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg cursor-pointer hover:border-brand-300">
                    <input type="checkbox" className="accent-brand-500" />
                    <span className="text-sm">{c}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-brand-50 rounded-lg text-sm text-slate-600">
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" className="mt-1 accent-brand-500" />
              <span>
                我已阅读并同意《银行代扣服务协议》《个人信息授权书》，同意授权平台从绑定的银行Ⅱ类户中自动扣缴指定费用。
              </span>
            </label>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              className="btn-primary px-8"
              onClick={submitSign}
              disabled={submitting}
            >
              {submitting ? "提交中..." : "提交签约"}
            </button>
            <button className="btn-secondary" onClick={() => setTab("signs")}>取消</button>
          </div>
          {submitMessage && (
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {submitMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
