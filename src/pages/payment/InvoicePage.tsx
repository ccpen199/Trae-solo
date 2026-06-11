import { useState } from "react";
import {
  FileText,
  Download,
  Mail,
  Search,
  Filter,
  Calendar,
  Eye,
  FileCheck,
  X,
  Printer,
} from "lucide-react";
import { useApi } from "@/utils/api";
import { formatMoney, formatDate } from "@/utils/format";

interface Invoice {
  id: string;
  paymentId: string;
  amount: number;
  category: string;
  invoiceNo: string;
  createdDate: string;
  type: "electronic" | "vat";
  buyer: string;
  status: "issued" | "sending" | "sent";
}

export default function InvoicePage() {
  const { data: invoices } = useApi<Invoice[]>("/api/payment/invoice/list");
  const [preview, setPreview] = useState<Invoice | null>(null);
  const [filter, setFilter] = useState("all");
  const [keyword, setKeyword] = useState("");

  const filtered = (invoices || []).filter((i) => {
    if (filter !== "all" && i.type !== filter) return false;
    if (keyword && !i.invoiceNo.includes(keyword) && !i.category.includes(keyword)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2 items-center">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="flex gap-1">
              {[
                { k: "all", l: "全部" },
                { k: "electronic", l: "电子普票" },
                { k: "vat", l: "增值税专票" },
              ].map((f) => (
                <button
                  key={f.k}
                  onClick={() => setFilter(f.k)}
                  className={`px-3 py-1.5 text-sm rounded-md transition ${
                    filter === f.k
                      ? "bg-brand-500 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {f.l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索发票号 / 项目"
                className="input pl-9 w-64"
              />
            </div>
            <button className="btn-secondary">
              <Download className="w-4 h-4" /> 批量下载
            </button>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left py-3 px-5 font-medium">发票号</th>
              <th className="text-left py-3 px-5 font-medium">缴费项目</th>
              <th className="text-left py-3 px-5 font-medium">类型</th>
              <th className="text-left py-3 px-5 font-medium">购买方</th>
              <th className="text-left py-3 px-5 font-medium">金额</th>
              <th className="text-left py-3 px-5 font-medium">开票日期</th>
              <th className="text-left py-3 px-5 font-medium">状态</th>
              <th className="text-left py-3 px-5 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="py-3 px-5 font-mono text-xs text-slate-600">{i.invoiceNo}</td>
                <td className="py-3 px-5 font-medium text-brand-700">{i.category}</td>
                <td className="py-3 px-5">
                  <span className={i.type === "vat" ? "tag-info" : "tag-gold"}>
                    <FileText className="w-3 h-3" />
                    {i.type === "vat" ? "增值税专票" : "电子普票"}
                  </span>
                </td>
                <td className="py-3 px-5 text-slate-600">{i.buyer}</td>
                <td className="py-3 px-5 font-semibold text-brand-800">{formatMoney(i.amount)}</td>
                <td className="py-3 px-5 text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {formatDate(i.createdDate, "YYYY-MM-DD")}
                </td>
                <td className="py-3 px-5">
                  {i.status === "issued" && <span className="tag-info">已开票</span>}
                  {i.status === "sending" && <span className="tag-warning">推送中</span>}
                  {i.status === "sent" && <span className="tag-success">已推送</span>}
                </td>
                <td className="py-3 px-5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreview(i)}
                      className="btn-ghost text-xs px-2 py-1 text-brand-500"
                    >
                      <Eye className="w-3.5 h-3.5" /> 预览
                    </button>
                    <button className="btn-ghost text-xs px-2 py-1 text-emerald-600">
                      <Download className="w-3.5 h-3.5" /> 下载
                    </button>
                    <button className="btn-ghost text-xs px-2 py-1 text-slate-500">
                      <Mail className="w-3.5 h-3.5" /> 推送
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {preview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPreview(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-brand-700 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-brand-500" /> 电子发票预览
              </h3>
              <button onClick={() => setPreview(null)} className="p-1.5 rounded-md hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-md mx-auto">
                <div className="text-center mb-6">
                  <div className="text-xs text-slate-400">全国统一发票监制章</div>
                  <h2 className="text-xl font-bold text-slate-800 mt-2">
                    {preview.type === "vat" ? "增值税专用发票" : "电子普通发票"}
                  </h2>
                  <div className="text-xs text-slate-500 mt-1">发票代码：011002300111</div>
                </div>
                <div className="space-y-2 text-sm border-t border-b border-slate-200 py-4">
                  <div className="flex">
                    <span className="w-20 text-slate-500">发票号码：</span>
                    <span className="font-mono">{preview.invoiceNo}</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 text-slate-500">开票日期：</span>
                    <span>{formatDate(preview.createdDate, "YYYY-MM-DD")}</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 text-slate-500">购买方：</span>
                    <span>{preview.buyer}</span>
                  </div>
                  <div className="flex">
                    <span className="w-20 text-slate-500">项目：</span>
                    <span>{preview.category} * 生活服务</span>
                  </div>
                  <div className="flex items-end justify-end pt-4">
                    <span className="text-slate-500 mr-2">价税合计（大写）：</span>
                    <span className="text-lg font-bold text-rose-600">{formatMoney(preview.amount)}</span>
                  </div>
                </div>
                <div className="mt-6 flex justify-between text-xs text-slate-500">
                  <div>
                    <div>销售方：全域缴费服务平台</div>
                    <div>开票人：系统自动</div>
                  </div>
                  <div className="w-20 h-20 border border-dashed border-slate-300 flex items-center justify-center text-center rounded">
                    <span className="text-[10px] text-slate-400">电子签章</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button className="btn-secondary"><Printer className="w-4 h-4" /> 打印</button>
              <button className="btn-primary"><Download className="w-4 h-4" /> 下载PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
