import { useState } from "react";
import { Upload, CheckCircle, XCircle, Clock, FileSpreadsheet, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

const STATUS_FILTERS = ["全部", "已通过", "待核验", "未通过"];

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
  "已通过": { icon: CheckCircle, color: "text-[#2EC4B6]", bg: "bg-[#2EC4B6]/10" },
  "待核验": { icon: Clock, color: "text-[#FFC857]", bg: "bg-[#FFC857]/10" },
  "未通过": { icon: XCircle, color: "text-[#E63946]", bg: "bg-[#E63946]/10" },
};

const REVIEW_ENTRIES: Record<number, { submitTime: string; verifyTime: string; result: string; source: string; note: string }[]> = {
  1: [
    { submitTime: "2025-06-01 09:20", verifyTime: "2025-06-01 09:30", result: "通过", source: "学信网API", note: "学籍信息匹配" },
  ],
  2: [
    { submitTime: "2025-06-01 09:30", verifyTime: "2025-06-01 09:35", result: "通过", source: "学信网API", note: "学籍信息匹配" },
    { submitTime: "2025-05-20 14:00", verifyTime: "2025-05-20 14:15", result: "未通过", source: "人工审核", note: "照片模糊，重新提交后通过" },
  ],
  4: [
    { submitTime: "2025-06-01 09:50", verifyTime: "2025-06-01 10:00", result: "未通过", source: "学信网API", note: "学号与姓名不匹配" },
    { submitTime: "2025-05-28 10:30", verifyTime: "2025-05-28 10:45", result: "未通过", source: "人工审核", note: "证件照过期" },
    { submitTime: "2025-05-15 16:00", verifyTime: "2025-05-15 16:20", result: "未通过", source: "学信网API", note: "学籍状态异常" },
  ],
  9: [
    { submitTime: "2025-06-03 08:00", verifyTime: "2025-06-03 08:10", result: "未通过", source: "人工审核", note: "入学年份与系统记录不符" },
  ],
};

const RECORDS = [
  { id: 1, studentId: "20210101001", name: "林小溪", status: "已通过", time: "2025-06-01 09:30", source: "学信网API" },
  { id: 2, studentId: "20210101002", name: "张明远", status: "已通过", time: "2025-06-01 09:35", source: "学信网API" },
  { id: 3, studentId: "20210202003", name: "王思琪", status: "待核验", time: "", source: "" },
  { id: 4, studentId: "20210202004", name: "陈雨涵", status: "未通过", time: "2025-06-01 10:00", source: "学信网API" },
  { id: 5, studentId: "20210303005", name: "赵天宇", status: "已通过", time: "2025-06-02 14:20", source: "人工审核" },
  { id: 6, studentId: "20210303006", name: "刘芳芳", status: "待核验", time: "", source: "" },
  { id: 7, studentId: "20210404007", name: "孙浩然", status: "已通过", time: "2025-06-02 16:45", source: "学信网API" },
  { id: 8, studentId: "20210404008", name: "周小倩", status: "待核验", time: "", source: "" },
  { id: 9, studentId: "20210505009", name: "吴晓峰", status: "未通过", time: "2025-06-03 08:10", source: "人工审核" },
  { id: 10, studentId: "20210505010", name: "郑雅文", status: "已通过", time: "2025-06-03 11:30", source: "人工审核" },
];

const STATS = [
  { label: "总提交", value: 256, color: "#1B3A5C" },
  { label: "已通过", value: 198, color: "#2EC4B6" },
  { label: "待核验", value: 38, color: "#FFC857" },
  { label: "未通过", value: 20, color: "#E63946" },
];

export default function AdminVerify() {
  const [filter, setFilter] = useState("全部");
  const [dragOver, setDragOver] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [showReviewForm, setShowReviewForm] = useState<number | null>(null);
  const [reviewReason, setReviewReason] = useState("");
  const [reviewMaterial, setReviewMaterial] = useState("");
  const [verifying, setVerifying] = useState<number | null>(null);
  const [records, setRecords] = useState(RECORDS);

  const filtered = filter === "全部" ? records : records.filter((r) => r.status === filter);

  const handleVerify = (id: number) => {
    setVerifying(id);
    setTimeout(() => {
      setRecords((prev) => prev.map((r) => r.id === id ? { ...r, status: "已通过", time: new Date().toLocaleString("zh-CN"), source: "学信网API" } : r));
      setVerifying(null);
    }, 1500);
  };

  const handleReviewSubmit = () => {
    if (!reviewReason.trim()) return;
    setShowReviewForm(null);
    setReviewReason("");
    setReviewMaterial("");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C] mb-6">学生身份核验</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
              <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-[#1B3A5C] mb-4">批量核验上传</h3>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${dragOver ? "border-[#FF6B35] bg-[#FF6B35]/5" : "border-gray-300 hover:border-[#FF6B35]/50"}`}
              >
                <Upload size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-500 mb-1">拖拽文件至此或点击上传</p>
                <p className="text-xs text-gray-400">支持 .xlsx, .csv 格式</p>
                <button className="mt-4 px-6 py-2 rounded-lg bg-[#FF6B35] text-white text-sm font-medium hover:bg-[#e55d2b] transition-colors">
                  选择文件
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                <FileSpreadsheet size={14} />
                上次导入: 验证名单_20250603.xlsx (48条记录)
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1B3A5C]">核验结果</h3>
                <div className="flex gap-2">
                  {STATUS_FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filter === f ? "bg-[#1B3A5C] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium w-6"></th>
                    <th className="text-left py-2 text-gray-500 font-medium">学号</th>
                    <th className="text-left py-2 text-gray-500 font-medium">姓名</th>
                    <th className="text-center py-2 text-gray-500 font-medium">状态</th>
                    <th className="text-center py-2 text-gray-500 font-medium">核验来源</th>
                    <th className="text-right py-2 text-gray-500 font-medium">核验时间</th>
                    <th className="text-right py-2 text-gray-500 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((record) => {
                    const cfg = STATUS_CONFIG[record.status];
                    const Icon = cfg.icon;
                    const isExpanded = expandedRow === record.id;
                    const reviews = REVIEW_ENTRIES[record.id] || [];
                    return (
                      <>
                        <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : record.id)}>
                          <td className="py-2.5 text-gray-400">
                            {reviews.length > 0 && (isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                          </td>
                          <td className="py-2.5 text-gray-600 font-mono text-xs">{record.studentId}</td>
                          <td className="py-2.5 text-[#1B3A5C]">{record.name}</td>
                          <td className="text-center py-2.5">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                              <Icon size={12} />
                              {record.status}
                            </span>
                          </td>
                          <td className="text-center py-2.5">
                            {record.source === "学信网API" && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[#2EC4B6]/10 text-[#2EC4B6] font-medium">学信网API</span>
                            )}
                            {record.source === "人工审核" && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1B3A5C]/10 text-[#1B3A5C] font-medium">人工审核</span>
                            )}
                            {!record.source && <span className="text-xs text-gray-300">-</span>}
                          </td>
                          <td className="text-right py-2.5 text-gray-400 text-xs">{record.time || "-"}</td>
                          <td className="text-right py-2.5" onClick={(e) => e.stopPropagation()}>
                            {record.status === "未通过" && (
                              <button onClick={() => setShowReviewForm(record.id)} className="text-xs px-2.5 py-1 rounded-lg border border-[#E63946] text-[#E63946] hover:bg-[#E63946]/5 transition-colors">申请复查</button>
                            )}
                            {record.status === "待核验" && (
                              <button onClick={() => handleVerify(record.id)} disabled={verifying === record.id} className="text-xs px-2.5 py-1 rounded-lg border border-[#FF6B35] text-[#FF6B35] hover:bg-[#FF6B35]/5 transition-colors disabled:opacity-50 flex items-center gap-1 ml-auto">
                                {verifying === record.id ? <><RefreshCw size={10} className="animate-spin" />核验中</> : "立即核验"}
                              </button>
                            )}
                          </td>
                        </tr>
                        {isExpanded && reviews.length > 0 && (
                          <tr key={`${record.id}-detail`} className="bg-gray-50/50">
                            <td colSpan={7} className="px-6 py-3">
                              <div className="text-xs text-gray-500 mb-2 font-medium">复查记录</div>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    <th className="text-left py-1.5 text-gray-400 font-medium">提交时间</th>
                                    <th className="text-left py-1.5 text-gray-400 font-medium">核验时间</th>
                                    <th className="text-left py-1.5 text-gray-400 font-medium">核验结果</th>
                                    <th className="text-left py-1.5 text-gray-400 font-medium">核验来源</th>
                                    <th className="text-left py-1.5 text-gray-400 font-medium">备注</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {reviews.map((rev, i) => (
                                    <tr key={i} className="border-b border-gray-100">
                                      <td className="py-1.5 text-gray-600">{rev.submitTime}</td>
                                      <td className="py-1.5 text-gray-600">{rev.verifyTime}</td>
                                      <td className="py-1.5">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${rev.result === "通过" ? "bg-[#2EC4B6]/10 text-[#2EC4B6]" : "bg-[#E63946]/10 text-[#E63946]"}`}>{rev.result}</span>
                                      </td>
                                      <td className="py-1.5">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${rev.source === "学信网API" ? "bg-[#2EC4B6]/10 text-[#2EC4B6]" : "bg-[#1B3A5C]/10 text-[#1B3A5C]"}`}>{rev.source}</span>
                                      </td>
                                      <td className="py-1.5 text-gray-500">{rev.note}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
              {showReviewForm !== null && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowReviewForm(null)}>
                  <div className="bg-white rounded-xl p-6 w-[400px] shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-[#1B3A5C]">申请复查</h3>
                      <button onClick={() => setShowReviewForm(null)}><XCircle size={18} className="text-gray-400" /></button>
                    </div>
                    <div className="space-y-3">
                      <textarea value={reviewReason} onChange={(e) => setReviewReason(e.target.value)} placeholder="复查原因" rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35] resize-none" />
                      <input value={reviewMaterial} onChange={(e) => setReviewMaterial(e.target.value)} placeholder="补充材料说明" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
                      <button onClick={handleReviewSubmit} className="w-full py-2.5 rounded-lg bg-[#FF6B35] text-white font-medium text-sm hover:bg-[#e55d2b] transition-colors">提交复查申请</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
