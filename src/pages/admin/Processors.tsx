import { useState } from "react";
import {
  Building2,
  User,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  FileText,
  Star,
  MapPin,
  Package,
  ChevronRight,
  AlertCircle,
  Check,
  X,
  Shield,
  Recycle,
  BarChart3,
  Edit,
  Trash2,
  ChevronDown,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import type { Processor, ProcessorStatus, ReviewStatus } from "../../../shared/types";

type TabKey = "review" | "partners" | "trace";

const tabs: { key: TabKey; label: string }[] = [
  { key: "review", label: "资质审核" },
  { key: "partners", label: "合作处理商" },
  { key: "trace", label: "物资追溯" },
];

const processorStatusBadge: Record<ProcessorStatus, string> = {
  pending: "bg-neutral-100 text-neutral-600",
  reviewing: "bg-amber-100 text-amber-700",
  approved: "bg-eco-100 text-eco-700",
  rejected: "bg-red-100 text-red-700",
};

const processorStatusLabel: Record<ProcessorStatus, string> = {
  pending: "待审核",
  reviewing: "审核中",
  approved: "已通过",
  rejected: "已拒绝",
};

const categoryLabel: Record<string, string> = {
  clothing: "衣物",
  books: "图书",
  phones: "手机数码",
};

const traceStatusOptions = [
  { value: "all", label: "全部状态" },
  { value: "已入库", label: "已入库" },
  { value: "分拣中", label: "分拣中" },
  { value: "处理中", label: "处理中" },
  { value: "处理完成", label: "处理完成" },
];

export default function Processors() {
  const [activeTab, setActiveTab] = useState<TabKey>("review");
  const { processors, materialTraces, orders, updateProcessor } = useStore();
  const [searchKey, setSearchKey] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentProcessor, setCurrentProcessor] = useState<Processor | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [traceStatus, setTraceStatus] = useState("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [traceSearch, setTraceSearch] = useState("");

  const pendingReviews = processors.filter((p) => p.status === "reviewing" || p.status === "pending");
  const approvedPartners = processors.filter((p) => p.status === "approved");

  const filteredTraces = materialTraces.filter((t) => {
    if (traceStatus !== "all" && t.status !== traceStatus) return false;
    if (traceSearch && !t.batchNo.includes(traceSearch) && !t.orderId.includes(traceSearch)) return false;
    return true;
  });

  const handleOpenReview = (processor: Processor) => {
    setCurrentProcessor(processor);
    setReviewComment("");
    setShowReviewModal(true);
  };

  const handleReviewAction = (action: "approve" | "reject") => {
    if (!currentProcessor) return;
    const newStatus: ReviewStatus = action === "approve" ? "approved" : "rejected";
    const newReview = {
      id: `review-${Date.now()}`,
      status: newStatus,
      reviewer: "运营管理员",
      comment: reviewComment || (action === "approve" ? "资质审核通过" : "资质审核未通过"),
      createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    };
    updateProcessor(currentProcessor.id, {
      status: newStatus,
      reviewHistory: [...currentProcessor.reviewHistory, newReview],
    });
    setShowReviewModal(false);
    setCurrentProcessor(null);
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">环保处理商管理</h1>
        <p className="text-sm text-neutral-500 mt-1">处理商资质审核、合作管理与物资追溯</p>
      </div>

      <div className="card p-1 inline-flex mb-6">
        {tabs.map(({ key, label }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-eco-500 to-eco-600 text-white shadow-md"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              {label}
              {key === "review" && pendingReviews.length > 0 && (
                <span
                  className={cn(
                    "ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold",
                    isActive ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
                  )}
                >
                  {pendingReviews.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === "review" && (
        <>
          <div className="card p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="搜索公司名/联系人"
                  value={searchKey}
                  onChange={(e) => setSearchKey(e.target.value)}
                  className="input-base pl-10"
                />
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">公司名称</th>
                    <th className="table-th">联系人</th>
                    <th className="table-th">联系电话</th>
                    <th className="table-th">处理品类</th>
                    <th className="table-th">申请时间</th>
                    <th className="table-th">状态</th>
                    <th className="table-th text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingReviews.map((processor, idx) => (
                    <tr
                      key={processor.id}
                      className="hover:bg-eco-50/30 transition-colors animate-slide-up"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-eco-100 to-eco-200 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-eco-600" />
                          </div>
                          <span className="font-medium">{processor.companyName}</span>
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-1.5">
                          <User className="w-4 h-4 text-neutral-400" />
                          <span>{processor.contactName}</span>
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-neutral-400" />
                          <span className="font-mono text-sm">{processor.contactPhone}</span>
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="flex flex-wrap gap-1">
                          {processor.categories.map((cat) => (
                            <span key={cat} className="badge badge-info text-xs">
                              {categoryLabel[cat] || cat}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                          <Clock className="w-4 h-4" />
                          {processor.reviewHistory[0]?.createdAt || processor.reviewHistory.at(-1)?.createdAt}
                        </div>
                      </td>
                      <td className="table-td">
                        <span className={cn("badge", processorStatusBadge[processor.status])}>
                          {processorStatusLabel[processor.status]}
                        </span>
                      </td>
                      <td className="table-td text-right">
                        <button
                          onClick={() => handleOpenReview(processor)}
                          className="text-eco-600 hover:text-eco-700 font-medium text-sm inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          审核
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pendingReviews.length === 0 && (
                    <tr>
                      <td colSpan={7} className="table-td text-center py-12 text-neutral-400">
                        <Shield className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                        <p>暂无待审核的申请</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "partners" && (
        <>
          <div className="card p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="搜索公司名称"
                  className="input-base pl-10"
                />
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">公司名称</th>
                    <th className="table-th">处理品类</th>
                    <th className="table-th">处理能力</th>
                    <th className="table-th">评级</th>
                    <th className="table-th">地址</th>
                    <th className="table-th">状态</th>
                    <th className="table-th text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedPartners.map((processor, idx) => (
                    <tr
                      key={processor.id}
                      className="hover:bg-eco-50/30 transition-colors animate-slide-up"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-eco-100 to-eco-200 flex items-center justify-center">
                            <Recycle className="w-4 h-4 text-eco-600" />
                          </div>
                          <div>
                            <span className="font-medium">{processor.companyName}</span>
                            <p className="text-xs text-neutral-400 mt-0.5 font-mono">
                              {processor.licenseNo}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="flex flex-wrap gap-1">
                          {processor.categories.map((cat) => (
                            <span key={cat} className="badge badge-info text-xs">
                              {categoryLabel[cat] || cat}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-1.5">
                          <BarChart3 className="w-4 h-4 text-eco-500" />
                          <span>{processor.capacity}</span>
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "w-4 h-4",
                                star <= Math.round(processor.rating)
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-neutral-200"
                              )}
                            />
                          ))}
                          <span className="ml-1 font-medium">{processor.rating}</span>
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="flex items-start gap-1.5 max-w-xs">
                          <MapPin className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-neutral-600 line-clamp-2">
                            {processor.address}
                          </span>
                        </div>
                      </td>
                      <td className="table-td">
                        <span className={cn("badge", processorStatusBadge[processor.status])}>
                          {processorStatusLabel[processor.status]}
                        </span>
                      </td>
                      <td className="table-td text-right">
                        <div className="inline-flex items-center gap-3">
                          <button className="text-neutral-600 hover:text-eco-600 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-neutral-600 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "trace" && (
        <>
          <div className="card p-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="搜索批次号/订单号"
                  value={traceSearch}
                  onChange={(e) => setTraceSearch(e.target.value)}
                  className="input-base pl-10"
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="btn-secondary py-2.5 px-4 flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  {traceStatusOptions.find((o) => o.value === traceStatus)?.label}
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showStatusDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl shadow-card border border-neutral-100 py-1 z-20">
                    {traceStatusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setTraceStatus(opt.value);
                          setShowStatusDropdown(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 text-sm hover:bg-eco-50",
                          traceStatus === opt.value ? "text-eco-600 font-medium" : "text-neutral-700"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th">批次号</th>
                    <th className="table-th">来源订单</th>
                    <th className="table-th">处理商</th>
                    <th className="table-th">物资类型</th>
                    <th className="table-th">重量</th>
                    <th className="table-th">状态</th>
                    <th className="table-th">当前位置</th>
                    <th className="table-th text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTraces.map((trace, idx) => {
                    const order = orders.find((o) => o.id === trace.orderId);
                    const processor = processors.find((p) => p.id === trace.processorId);
                    return (
                      <tr
                        key={trace.id}
                        className="hover:bg-eco-50/30 transition-colors animate-slide-up"
                        style={{ animationDelay: `${idx * 40}ms` }}
                      >
                        <td className="table-td">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                              <Package className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="font-mono text-xs font-medium">{trace.batchNo}</span>
                          </div>
                        </td>
                        <td className="table-td">
                          <span className="font-mono text-xs text-neutral-600">
                            {order?.orderNo || trace.orderId}
                          </span>
                        </td>
                        <td className="table-td">
                          <span className="text-sm">{processor?.companyName || "-"}</span>
                        </td>
                        <td className="table-td">
                          <span className="badge badge-info">
                            {order?.category === "clothing"
                              ? "衣物"
                              : order?.category === "books"
                              ? "图书"
                              : order?.category === "phones"
                              ? "手机数码"
                              : "-"}
                          </span>
                        </td>
                        <td className="table-td font-medium">{trace.weightKg} kg</td>
                        <td className="table-td">
                          <span
                            className={cn(
                              "badge",
                              trace.status === "处理完成"
                                ? "badge-success"
                                : trace.status === "分拣中"
                                ? "badge-warning"
                                : "badge-info"
                            )}
                          >
                            {trace.status}
                          </span>
                        </td>
                        <td className="table-td">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-eco-500" />
                            <span className="text-sm text-neutral-600">
                              {processor?.address?.split("区")[0]}区处理中心
                            </span>
                          </div>
                        </td>
                        <td className="table-td text-right">
                          <button className="text-eco-600 hover:text-eco-700 font-medium text-sm inline-flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            详情
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showReviewModal && currentProcessor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 animate-slide-up max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-800">资质审核</h3>
              <p className="text-sm text-neutral-500 mt-1">查看并审核处理商资质信息</p>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto scrollbar-thin flex-1">
              <div className="bg-eco-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-eco-400 to-eco-600 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-800">{currentProcessor.companyName}</h4>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      {currentProcessor.contactName} · {currentProcessor.contactPhone}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="label-base">经营许可证号</label>
                <div className="input-base bg-neutral-50 font-mono text-sm">
                  {currentProcessor.licenseNo}
                </div>
              </div>

              <div>
                <label className="label-base">处理品类</label>
                <div className="flex flex-wrap gap-2">
                  {currentProcessor.categories.map((cat) => (
                    <span key={cat} className="badge badge-info px-3 py-1">
                      {categoryLabel[cat] || cat}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-base">处理能力</label>
                <div className="input-base bg-neutral-50 text-sm">{currentProcessor.capacity}</div>
              </div>

              <div>
                <label className="label-base">公司地址</label>
                <div className="input-base bg-neutral-50 text-sm flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <span>{currentProcessor.address}</span>
                </div>
              </div>

              <div>
                <label className="label-base">资质证明文件</label>
                <div className="grid grid-cols-2 gap-3">
                  {currentProcessor.licenseImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-video rounded-xl bg-neutral-100 flex items-center justify-center overflow-hidden"
                    >
                      <img src={img} alt={`资质证明${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {currentProcessor.reviewHistory.length > 0 && (
                <div>
                  <label className="label-base">历史审核记录</label>
                  <div className="space-y-2">
                    {currentProcessor.reviewHistory.map((record) => (
                      <div
                        key={record.id}
                        className="bg-neutral-50 rounded-xl p-3 flex items-start gap-2"
                      >
                        {record.status === "approved" ? (
                          <CheckCircle className="w-4 h-4 text-eco-500 flex-shrink-0 mt-0.5" />
                        ) : record.status === "rejected" ? (
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{record.reviewer || "待审核"}</span>
                            <span className="text-neutral-400 text-xs">{record.createdAt}</span>
                          </div>
                          {record.comment && (
                            <p className="text-sm text-neutral-600 mt-1">{record.comment}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="label-base">审核意见</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="请输入审核意见（可选）"
                  className="input-base min-h-[90px] resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-neutral-100 flex gap-3">
              <button onClick={() => setShowReviewModal(false)} className="btn-secondary flex-1 py-2.5 gap-2">
                <X className="w-4 h-4" />
                取消
              </button>
              <button
                onClick={() => handleReviewAction("reject")}
                className="btn-danger flex-1 py-2.5 gap-2"
              >
                <XCircle className="w-4 h-4" />
                拒绝
              </button>
              <button
                onClick={() => handleReviewAction("approve")}
                className="btn-primary flex-1 py-2.5 gap-2"
              >
                <Check className="w-4 h-4" />
                通过
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
