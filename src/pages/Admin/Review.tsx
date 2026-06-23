import { useState, useEffect } from "react";
import {
  ArrowLeft,
  BookOpen,
  Dumbbell,
  FileText,
  Volume2,
  Check,
  X,
  Clock,
  User,
  Star,
  History,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDataStore } from "@/store/dataStore";
import { contentItems as initialContentItems } from "@/data/content";
import LargeButton from "@/components/LargeButton";
import type { ContentItem, ReviewRecord, ContentType } from "@/types";
import { cn } from "@/lib/utils";

type TabType = "pending" | "approved" | "rejected";

const contentTypeIcons: Record<ContentType, typeof BookOpen> = {
  recipe: BookOpen,
  exercise: Dumbbell,
  article: FileText,
  audio: Volume2,
};

const contentTypeLabels: Record<ContentType, string> = {
  recipe: "食谱",
  exercise: "运动",
  article: "文章",
  audio: "音频",
};

const tabLabels: Record<TabType, string> = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已驳回",
};

const mockReviewRecords: ReviewRecord[] = [
  {
    id: "r001",
    contentId: "c004",
    reviewerId: "admin001",
    reviewerName: "管理员老王",
    result: "approved",
    reviewedAt: "2026-06-18 10:00:00",
    comment: "内容质量优秀，音频清晰，适合老年用户收听。",
  },
  {
    id: "r002",
    contentId: "c005",
    reviewerId: "admin001",
    reviewerName: "管理员老王",
    result: "approved",
    reviewedAt: "2026-06-18 09:30:00",
  },
  {
    id: "r003",
    contentId: "c007",
    reviewerId: "admin002",
    reviewerName: "管理员小李",
    result: "rejected",
    reviewedAt: "2026-06-17 16:00:00",
    comment: "部分动作描述不够清晰，缺少安全注意事项，建议补充完善后重新提交。",
  },
];

export default function Review() {
  const navigate = useNavigate();
  const { contentItems, setContentItems, reviewContent } = useDataStore();

  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [reviewRecords, setReviewRecords] = useState<ReviewRecord[]>(mockReviewRecords);

  useEffect(() => {
    if (contentItems.length === 0) {
      setContentItems(initialContentItems);
    }
  }, [contentItems.length, setContentItems]);

  const filteredItems = contentItems.filter((item) => item.status === activeTab);

  const handleSelectContent = (item: ContentItem) => {
    setSelectedContent(item);
    setRejectReason("");
    setShowRejectModal(false);
  };

  const handleApprove = () => {
    if (!selectedContent) return;
    reviewContent(selectedContent.id, "approved");
    const newRecord: ReviewRecord = {
      id: `r${Date.now()}`,
      contentId: selectedContent.id,
      reviewerId: "admin001",
      reviewerName: "当前管理员",
      result: "approved",
      reviewedAt: new Date().toLocaleString("zh-CN", { hour12: false }).replace(/\//g, "-"),
    };
    setReviewRecords([newRecord, ...reviewRecords]);
    setSelectedContent(null);
  };

  const handleReject = () => {
    if (!selectedContent || !rejectReason.trim()) return;
    reviewContent(selectedContent.id, "rejected", rejectReason);
    const newRecord: ReviewRecord = {
      id: `r${Date.now()}`,
      contentId: selectedContent.id,
      reviewerId: "admin001",
      reviewerName: "当前管理员",
      result: "rejected",
      comment: rejectReason,
      reviewedAt: new Date().toLocaleString("zh-CN", { hour12: false }).replace(/\//g, "-"),
    };
    setReviewRecords([newRecord, ...reviewRecords]);
    setShowRejectModal(false);
    setRejectReason("");
    setSelectedContent(null);
  };

  const getContentRecords = (contentId: string) =>
    reviewRecords.filter((r) => r.contentId === contentId);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div
        className="sticky top-0 z-40 py-4 px-6 shadow-a11y"
        style={{
          backgroundColor: "var(--color-card-bg)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="a11y-btn a11y-btn-ghost"
            aria-label="返回上一页"
          >
            <ArrowLeft className="w-6 h-6" />
            <span>返回</span>
          </button>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            内容审核
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6">
          {(Object.keys(tabLabels) as TabType[]).map((tab) => {
            const count = contentItems.filter((i) => i.status === tab).length;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedContent(null);
                }}
                className={cn(
                  "a11y-btn",
                  isActive ? "a11y-btn-primary" : "a11y-btn-outline"
                )}
              >
                <span>{tabLabels[tab]}</span>
                <span
                  className={cn(
                    "ml-1 px-2 py-0.5 rounded-full text-sm",
                    isActive ? "bg-white/20" : "bg-gray-100"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
              {tabLabels[activeTab]}列表
            </h2>
            {filteredItems.length === 0 ? (
              <div className="a11y-card text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p style={{ color: "var(--color-text-secondary)" }}>
                  暂无{tabLabels[activeTab]}内容
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.map((item) => {
                  const Icon = contentTypeIcons[item.type];
                  const isSelected = selectedContent?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectContent(item)}
                      className={cn(
                        "a11y-card cursor-pointer transition-all",
                        isSelected && "ring-4 ring-orange-300"
                      )}
                      style={{
                        borderColor: isSelected ? "var(--color-primary)" : undefined,
                      }}
                    >
                      <div className="flex gap-4">
                        <div
                          className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: "var(--color-bg)" }}
                        >
                          <Icon
                            className="w-7 h-7"
                            style={{ color: "var(--color-primary)" }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3
                              className="font-bold text-lg truncate"
                              style={{ color: "var(--color-text)" }}
                            >
                              {item.title}
                            </h3>
                            <span
                              className="a11y-tag flex-shrink-0"
                              style={{
                                backgroundColor:
                                  item.type === "recipe"
                                    ? "#fef3c7"
                                    : item.type === "exercise"
                                    ? "#dbeafe"
                                    : item.type === "article"
                                    ? "#dcfce7"
                                    : "#fce7f3",
                                color:
                                  item.type === "recipe"
                                    ? "#92400e"
                                    : item.type === "exercise"
                                    ? "#1e40af"
                                    : item.type === "article"
                                    ? "#166534"
                                    : "#9d174d",
                              }}
                            >
                              {contentTypeLabels[item.type]}
                            </span>
                          </div>
                          <p
                            className="text-sm mb-3 line-clamp-2"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            {item.content}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div
                              className="flex items-center gap-1"
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              <Clock className="w-4 h-4" />
                              <span>{item.submittedAt}</span>
                            </div>
                            <div
                              className="flex items-center gap-1"
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              <User className="w-4 h-4" />
                              <span>{item.author}</span>
                            </div>
                            {item.accessibilityScore !== undefined && (
                              <div className="flex items-center gap-1">
                                <Star
                                  className="w-4 h-4"
                                  style={{ color: "#d69e2e" }}
                                />
                                <span
                                  className="font-medium"
                                  style={{ color: "#d69e2e" }}
                                >
                                  无障碍评分 {item.accessibilityScore}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronRight
                          className="flex-shrink-0 w-6 h-6 self-center"
                          style={{ color: "var(--color-text-secondary)" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {selectedContent ? (
              <>
                <div className="a11y-card">
                  <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text)" }}>
                    内容详情预览
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const Icon = contentTypeIcons[selectedContent.type];
                        return (
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: "var(--color-bg)" }}
                          >
                            <Icon
                              className="w-6 h-6"
                              style={{ color: "var(--color-primary)" }}
                            />
                          </div>
                        );
                      })()}
                      <div>
                        <h3
                          className="text-xl font-bold"
                          style={{ color: "var(--color-text)" }}
                        >
                          {selectedContent.title}
                        </h3>
                        <span
                          className="a11y-tag"
                          style={{
                            backgroundColor:
                              selectedContent.type === "recipe"
                                ? "#fef3c7"
                                : selectedContent.type === "exercise"
                                ? "#dbeafe"
                                : selectedContent.type === "article"
                                ? "#dcfce7"
                                : "#fce7f3",
                            color:
                              selectedContent.type === "recipe"
                                ? "#92400e"
                                : selectedContent.type === "exercise"
                                ? "#1e40af"
                                : selectedContent.type === "article"
                                ? "#166534"
                                : "#9d174d",
                          }}
                        >
                          {contentTypeLabels[selectedContent.type]}
                        </span>
                      </div>
                    </div>

                    <div
                      className="p-4 rounded-xl"
                      style={{ backgroundColor: "var(--color-bg)" }}
                    >
                      <p
                        className="whitespace-pre-wrap leading-relaxed"
                        style={{ color: "var(--color-text)" }}
                      >
                        {selectedContent.content}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-2">
                      <div
                        className="flex items-center gap-2"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        <Clock className="w-5 h-5" />
                        <span>提交时间：{selectedContent.submittedAt}</span>
                      </div>
                      <div
                        className="flex items-center gap-2"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        <User className="w-5 h-5" />
                        <span>作者：{selectedContent.author}</span>
                      </div>
                      {selectedContent.accessibilityScore !== undefined && (
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5" style={{ color: "#d69e2e" }} />
                          <span style={{ color: "#d69e2e" }}>
                            无障碍评分：{selectedContent.accessibilityScore}/100
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedContent.status === "pending" && (
                  <div className="a11y-card">
                    <h2
                      className="text-xl font-bold mb-4"
                      style={{ color: "var(--color-text)" }}
                    >
                      审核操作
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={handleApprove}
                        className="a11y-btn flex-col gap-2 py-6"
                        style={{
                          backgroundColor: "var(--color-success)",
                          color: "white",
                        }}
                      >
                        <Check className="w-10 h-10" />
                        <span className="text-xl font-bold">审核通过</span>
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        className="a11y-btn flex-col gap-2 py-6"
                        style={{
                          backgroundColor: "var(--color-danger)",
                          color: "white",
                        }}
                      >
                        <X className="w-10 h-10" />
                        <span className="text-xl font-bold">审核驳回</span>
                      </button>
                    </div>

                    {showRejectModal && (
                      <div className="mt-6 p-5 rounded-xl border-2" style={{ borderColor: "var(--color-danger)" }}>
                        <h3
                          className="font-bold text-lg mb-3"
                          style={{ color: "var(--color-danger)" }}
                        >
                          请输入驳回原因
                        </h3>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="请详细说明驳回原因，帮助作者改进内容..."
                          className="a11y-input w-full resize-none"
                          rows={4}
                        />
                        <div className="flex gap-4 mt-4">
                          <LargeButton
                            variant="secondary"
                            onClick={() => {
                              setShowRejectModal(false);
                              setRejectReason("");
                            }}
                            fullWidth
                          >
                            取消
                          </LargeButton>
                          <LargeButton
                            onClick={handleReject}
                            disabled={!rejectReason.trim()}
                            fullWidth
                            style={{ backgroundColor: "var(--color-danger)" }}
                          >
                            确认驳回
                          </LargeButton>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {getContentRecords(selectedContent.id).length > 0 && (
                  <div className="a11y-card">
                    <h2
                      className="text-xl font-bold mb-4 flex items-center gap-2"
                      style={{ color: "var(--color-text)" }}
                    >
                      <History className="w-6 h-6" />
                      审核历史记录
                    </h2>
                    <div className="space-y-4">
                      {getContentRecords(selectedContent.id).map((record) => (
                        <div
                          key={record.id}
                          className="p-4 rounded-xl"
                          style={{ backgroundColor: "var(--color-bg)" }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "a11y-tag",
                                  record.result === "approved"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                )}
                              >
                                {record.result === "approved" ? "已通过" : "已驳回"}
                              </span>
                              <span
                                className="font-medium"
                                style={{ color: "var(--color-text)" }}
                              >
                                {record.reviewerName}
                              </span>
                            </div>
                            <span
                              className="text-sm"
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              {record.reviewedAt}
                            </span>
                          </div>
                          {record.comment && (
                            <p
                              className="mt-2 pt-3 border-t"
                              style={{
                                borderColor: "var(--color-border)",
                                color: "var(--color-text-secondary)",
                              }}
                            >
                              {record.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="a11y-card text-center py-20">
                <BookOpen className="w-20 h-20 mx-auto mb-4 opacity-30" />
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: "var(--color-text)" }}
                >
                  请选择一条内容
                </h3>
                <p style={{ color: "var(--color-text-secondary)" }}>
                  点击左侧列表中的内容查看详情并进行审核
                </p>
              </div>
            )}

            <div className="a11y-card">
              <h2
                className="text-xl font-bold mb-4 flex items-center gap-2"
                style={{ color: "var(--color-text)" }}
              >
                <History className="w-6 h-6" />
                全部审核历史
              </h2>
              {reviewRecords.length === 0 ? (
                <p
                  className="text-center py-8"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  暂无审核记录
                </p>
              ) : (
                <div className="space-y-3">
                  {reviewRecords.slice(0, 10).map((record) => {
                    const content = contentItems.find((c) => c.id === record.contentId);
                    return (
                      <div
                        key={record.id}
                        className="p-3 rounded-xl"
                        style={{ backgroundColor: "var(--color-bg)" }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span
                            className="font-medium truncate"
                            style={{ color: "var(--color-text)" }}
                          >
                            {content?.title || "未知内容"}
                          </span>
                          <span
                            className={cn(
                              "a11y-tag flex-shrink-0 text-xs",
                              record.result === "approved"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            )}
                          >
                            {record.result === "approved" ? "通过" : "驳回"}
                          </span>
                        </div>
                        <div
                          className="text-xs flex items-center justify-between"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          <span>{record.reviewerName}</span>
                          <span>{record.reviewedAt}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
