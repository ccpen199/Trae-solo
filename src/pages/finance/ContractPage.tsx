import { useState } from "react";
import {
  FileCheck,
  Clock,
  CheckCircle2,
  Signature,
  Eye,
  Download,
  FileText,
  ChevronRight,
  X,
  AlertTriangle,
} from "lucide-react";
import { useApi } from "@/utils/api";
import { formatMoney, formatDate } from "@/utils/format";

interface Contract {
  id: string;
  name: string;
  productName: string;
  type: string;
  amount: number;
  status: "pending" | "signed" | "expired";
  createDate: string;
  expireDate: string;
  partyA: string;
  partyB: string;
}

export default function ContractPage() {
  const [tab, setTab] = useState<"pending" | "signed" | "all">("pending");
  const { data: contracts } = useApi<Contract[]>("/api/finance/contracts");
  const [preview, setPreview] = useState<Contract | null>(null);
  const [signing, setSigning] = useState<Contract | null>(null);
  const [signed, setSigned] = useState(false);

  const list = (contracts || []).filter((c) => tab === "all" || c.status === tab);
  const pendingCount = (contracts || []).filter((c) => c.status === "pending").length;

  const statusTag = (s: Contract["status"]) => {
    if (s === "pending")
      return <span className="tag-warning"><Clock className="w-3 h-3" />待签署</span>;
    if (s === "signed")
      return <span className="tag-success"><CheckCircle2 className="w-3 h-3" />已签署</span>;
    return <span className="tag-danger"><AlertTriangle className="w-3 h-3" />已过期</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 border-b border-slate-200">
          {[
            { k: "pending", l: "待签署", count: pendingCount },
            { k: "signed", l: "已签署" },
            { k: "all", l: "全部" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as typeof tab)}
              className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition ${
                tab === t.k
                  ? "border-brand-500 text-brand-600"
                  : "border-transparent text-slate-500 hover:text-brand-500"
              }`}
            >
              {t.l}
              {t.count !== undefined && t.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((c) => (
          <div key={c.id} className="card card-hover flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <div className="font-semibold text-brand-700 text-sm">{c.name}</div>
                  <div className="text-xs text-slate-500">合同号：{c.id}</div>
                </div>
              </div>
              {statusTag(c.status)}
            </div>

            <div className="space-y-1.5 py-3 border-y border-slate-100 my-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">产品</span>
                <span className="text-slate-800">{c.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">金额</span>
                <span className="font-semibold text-rose-600">{formatMoney(c.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">类型</span>
                <span className="text-slate-800">{c.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">签署期限</span>
                <span className="text-slate-800 text-xs">{formatDate(c.expireDate, "YYYY-MM-DD")}</span>
              </div>
            </div>

            <div className="mt-auto flex gap-2">
              <button onClick={() => setPreview(c)} className="flex-1 btn-secondary text-sm py-1.5">
                <Eye className="w-3.5 h-3.5" /> 预览
              </button>
              {c.status === "pending" && (
                <button onClick={() => { setSigning(c); setSigned(false); }} className="flex-1 btn-primary text-sm py-1.5">
                  <Signature className="w-3.5 h-3.5" /> 签署
                </button>
              )}
              {c.status === "signed" && (
                <button className="flex-1 btn-secondary text-sm py-1.5">
                  <Download className="w-3.5 h-3.5" /> 下载
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-brand-700 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-brand-500" /> 合同预览
              </h3>
              <button onClick={() => setPreview(null)} className="p-1.5 rounded-md hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] text-sm text-slate-700 leading-relaxed space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-brand-800">{preview.name}</h2>
                <p className="text-xs text-slate-400 mt-1">合同编号：{preview.id}</p>
              </div>
              <div>
                <p className="mb-2"><span className="font-semibold">甲方（出借方/平台方）：</span>{preview.partyA}</p>
                <p><span className="font-semibold">乙方（客户）：</span>{preview.partyB}</p>
              </div>
              <div>
                <h4 className="font-semibold text-brand-700 mb-1">第一条 产品与金额</h4>
                <p>乙方自愿购买甲方提供的「{preview.productName}」产品，金额为人民币 {formatMoney(preview.amount)} 元。</p>
              </div>
              <div>
                <h4 className="font-semibold text-brand-700 mb-1">第二条 权利与义务</h4>
                <p>1. 甲方应按合同约定兑付本金及收益；</p>
                <p>2. 乙方应保证资金来源合法，并已完成风险测评；</p>
                <p>3. 双方均对合同内容负有保密义务。</p>
              </div>
              <div>
                <h4 className="font-semibold text-brand-700 mb-1">第三条 违约责任</h4>
                <p>任何一方违约，应承担由此给对方造成的全部损失，包括但不限于本金损失、利息损失及维权费用。</p>
              </div>
              <div>
                <h4 className="font-semibold text-brand-700 mb-1">第四条 争议解决</h4>
                <p>本合同履行过程中发生争议，双方应友好协商；协商不成的，提交甲方所在地有管辖权的人民法院诉讼解决。</p>
              </div>
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div>
                  <div className="text-xs text-slate-500 mb-1">甲方签署</div>
                  <div className="h-14 border border-dashed border-slate-300 rounded flex items-center justify-center">
                    <span className="text-xs text-slate-400">电子签章</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">签署日期：{formatDate(preview.createDate, "YYYY-MM-DD")}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">乙方签署</div>
                  <div className={`h-14 border border-dashed rounded flex items-center justify-center ${
                    preview.status === "signed" ? "border-emerald-400 bg-emerald-50" : "border-slate-300"
                  }`}>
                    {preview.status === "signed" ? (
                      <span className="text-sm text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> 已签署
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">待签署</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">签署日期：{preview.status === "signed" ? formatDate(preview.createDate, "YYYY-MM-DD") : "--"}</div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setPreview(null)}>关闭</button>
              {preview.status === "pending" && (
                <button className="btn-primary" onClick={() => { setPreview(null); setSigning(preview); setSigned(false); }}>
                  <Signature className="w-4 h-4" /> 立即签署
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {signing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSigning(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-brand-700 flex items-center gap-2">
                <Signature className="w-5 h-5 text-brand-500" /> 在线签署合同
              </h3>
              <button onClick={() => setSigning(null)} className="p-1.5 rounded-md hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            {!signed ? (
              <div className="p-6">
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-800 mb-4 flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>请确认合同内容无误，电子签名与手写签名具有同等法律效力。</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="input-label">合同名称</label>
                    <div className="input bg-slate-50 text-slate-600">{signing.name}</div>
                  </div>
                  <div>
                    <label className="input-label">签署人姓名</label>
                    <input className="input" placeholder="请输入真实姓名" />
                  </div>
                  <div>
                    <label className="input-label">身份证号</label>
                    <input className="input" placeholder="请输入18位身份证号" />
                  </div>
                  <div>
                    <label className="input-label">短信验证码</label>
                    <div className="flex gap-2">
                      <input className="input flex-1" placeholder="请输入验证码" />
                      <button className="btn-secondary whitespace-nowrap">获取验证码</button>
                    </div>
                  </div>
                  <div>
                    <label className="input-label">手写签名</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg h-32 flex items-center justify-center bg-slate-50 cursor-pointer hover:border-brand-300 transition">
                      <span className="text-slate-400 text-sm">点击此处进行手写签名</span>
                    </div>
                  </div>
                  <label className="flex items-start gap-2 cursor-pointer text-sm text-slate-600">
                    <input type="checkbox" className="mt-1 accent-brand-500" />
                    <span>我已仔细阅读并同意本合同全部条款，确认签署人身份真实有效。</span>
                  </label>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button className="btn-secondary" onClick={() => setSigning(null)}>取消</button>
                  <button className="btn-primary px-6" onClick={() => setSigned(true)}>
                    <Signature className="w-4 h-4" /> 确认签署
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-brand-800 mb-1">签署成功！</h3>
                <p className="text-sm text-slate-500 mb-5">合同已完成电子签署，具有法律效力</p>
                <div className="flex justify-center gap-2">
                  <button className="btn-secondary"><Download className="w-4 h-4" /> 下载合同</button>
                  <button className="btn-primary" onClick={() => setSigning(null)}>
                    完成 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
