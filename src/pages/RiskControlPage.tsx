import { useState, useCallback } from "react";
import { MainLayout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { useAppStore } from "@/store/useAppStore";
import { mockDeviceClusters } from "@/data/mockData";
import {
  ShieldCheck,
  Bot,
  UserCheck,
  Gavel,
  AlertTriangle,
  Monitor,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  Ban,
  Users,
  MapPin,
  Activity,
  ScanEye,
  FileWarning,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Bell,
  User,
  HardDrive,
  FileText,
  CheckCircle,
  XOctagon,
  Flag,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubmissionStatus, RiskSeverity, RiskAlertType, ReviewFlowRecord, TaskSubmission } from "@/types";

const severityConfig: Record<RiskSeverity, { label: string; color: string; bgClass: string; dotClass: string }> = {
  low: { label: "低危", color: "text-gray-400", bgClass: "bg-gray-500/10", dotClass: "bg-gray-500" },
  medium: { label: "中危", color: "text-warning-500", bgClass: "bg-warning-500/10", dotClass: "bg-warning-500" },
  high: { label: "高危", color: "text-amber-gold-400", bgClass: "bg-amber-gold-500/10", dotClass: "bg-amber-gold-500" },
  critical: { label: "严重", color: "text-danger-500", bgClass: "bg-danger-500/10", dotClass: "bg-danger-500" },
};

const alertTypeLabels: Record<RiskAlertType, string> = {
  device_cluster: "设备集群",
  abnormal_rate: "异常率波动",
  duplicate_submission: "重复提交",
  suspicious_behavior: "可疑行为",
  ip_violation: "IP异常",
};

const getRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "刚刚";
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return new Date(dateString).toLocaleDateString("zh-CN");
};

const getProcessingStatusLabel = (status?: string): { label: string; class: string } => {
  switch (status) {
    case "unprocessed":
      return { label: "未处理", class: "tag tag-gray" };
    case "processing":
      return { label: "处理中", class: "tag tag-orange" };
    case "processed":
      return { label: "已处理", class: "tag tag-green" };
    default:
      return { label: "未处理", class: "tag tag-gray" };
  }
};

const getStageConfig = (stage: ReviewFlowRecord["stage"]) => {
  switch (stage) {
    case "ai_review":
      return { label: "AI初筛", color: "text-cyber-cyan-400", bgColor: "bg-cyber-cyan-500/10", borderColor: "border-cyber-cyan-500/30", dotColor: "bg-cyber-cyan-400" };
    case "manual_review":
      return { label: "人工抽检", color: "text-amber-gold-400", bgColor: "bg-amber-gold-500/10", borderColor: "border-amber-gold-500/30", dotColor: "bg-amber-gold-400" };
    case "dispute_arbitration":
      return { label: "争议仲裁", color: "text-pink-400", bgColor: "bg-pink-500/10", borderColor: "border-pink-500/30", dotColor: "bg-pink-400" };
    default:
      return { label: "未知", color: "text-gray-400", bgColor: "bg-gray-500/10", borderColor: "border-gray-500/30", dotColor: "bg-gray-400" };
  }
};

const getActionLabel = (action: ReviewFlowRecord["action"]) => {
  switch (action) {
    case "pass":
      return { label: "通过", icon: CheckCircle, color: "text-success-500" };
    case "reject":
      return { label: "驳回", icon: XOctagon, color: "text-danger-500" };
    case "flag":
      return { label: "标记", icon: Flag, color: "text-warning-500" };
    case "escalate":
      return { label: "申诉", icon: ArrowRight, color: "text-purple-400" };
    default:
      return { label: "操作", icon: FileText, color: "text-gray-400" };
  }
};

interface ReviewTimelineProps {
  reviewFlow: ReviewFlowRecord[];
  showFullFlow?: boolean;
}

function ReviewTimeline({ reviewFlow, showFullFlow = false }: ReviewTimelineProps) {
  if (!reviewFlow || reviewFlow.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        暂无审核流转记录
      </div>
    );
  }

  const flowToShow = showFullFlow ? reviewFlow : reviewFlow;

  return (
    <div className="relative">
      {showFullFlow && (
        <div className="flex items-center justify-center gap-2 mb-4 text-xs">
          <span className="text-cyber-cyan-400">AI初筛</span>
          <ArrowRight className="w-3 h-3 text-gray-500" />
          <span className="text-amber-gold-400">人工抽检</span>
          <ArrowRight className="w-3 h-3 text-gray-500" />
          <span className="text-pink-400">争议仲裁</span>
        </div>
      )}
      <div className="space-y-0">
        {flowToShow.map((record, index) => {
          const stageConfig = getStageConfig(record.stage);
          const actionConfig = getActionLabel(record.action);
          const ActionIcon = actionConfig.icon;
          const isLast = index === flowToShow.length - 1;

          return (
            <div key={record.id} className="relative flex gap-4">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  stageConfig.bgColor,
                  stageConfig.borderColor,
                  "border"
                )}>
                  {record.stage === "ai_review" ? (
                    <Bot className="w-4 h-4" style={{ color: stageConfig.color.replace("text-", "") }} />
                  ) : record.stage === "dispute_arbitration" ? (
                    <Gavel className="w-4 h-4" style={{ color: stageConfig.color.replace("text-", "") }} />
                  ) : (
                    <User className="w-4 h-4" style={{ color: stageConfig.color.replace("text-", "") }} />
                  )}
                </div>
                {!isLast && (
                  <div className="w-0.5 flex-1 bg-gradient-to-b from-gray-600 to-gray-700 my-1" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-sm font-medium", stageConfig.color)}>
                    {stageConfig.label}
                  </span>
                  <span className={cn("text-xs flex items-center gap-1", actionConfig.color)}>
                    <ActionIcon className="w-3 h-3" />
                    {actionConfig.label}
                  </span>
                </div>
                <div className="text-sm text-gray-400 mb-1">
                  操作人：<span className="text-gray-300">{record.operator}</span>
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  {new Date(record.timestamp).toLocaleString("zh-CN", { hour12: false })}
                </div>
                {record.notes && (
                  <div className="text-xs text-gray-400 bg-white/5 rounded px-2 py-1">
                    {record.notes}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface RiskCheckBadgesProps {
  riskChecks: TaskSubmission["riskChecks"];
}

function RiskCheckBadges({ riskChecks }: RiskCheckBadgesProps) {
  const checks = [
    { key: "ipDuplicate", label: "IP重复", passed: !riskChecks.ipDuplicate },
    { key: "deviceFingerprintDuplicate", label: "设备重复", passed: !riskChecks.deviceFingerprintDuplicate },
    { key: "logicValidationPassed", label: "逻辑校验", passed: riskChecks.logicValidationPassed },
    { key: "antiCheatingPassed", label: "防作弊", passed: riskChecks.antiCheatingPassed },
  ];

  return (
    <div className="flex flex-wrap gap-1">
      {checks.map((check) => (
        <span
          key={check.key}
          className={cn(
            "text-xs px-1.5 py-0.5 rounded",
            check.passed
              ? "bg-success-500/10 text-success-400"
              : "bg-danger-500/10 text-danger-400"
          )}
        >
          {check.label}
        </span>
      ))}
    </div>
  );
}

interface DeviceInfoProps {
  deviceInfo: TaskSubmission["deviceInfo"];
}

function DeviceInfo({ deviceInfo }: DeviceInfoProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white/5 rounded-lg p-3">
        <div className="text-xs text-gray-500 mb-1">设备指纹</div>
        <div className="text-sm text-gray-300 font-mono">{deviceInfo.deviceFingerprint}</div>
      </div>
      <div className="bg-white/5 rounded-lg p-3">
        <div className="text-xs text-gray-500 mb-1">IP地址</div>
        <div className="text-sm text-gray-300 font-mono">{deviceInfo.ip}</div>
      </div>
      <div className="bg-white/5 rounded-lg p-3">
        <div className="text-xs text-gray-500 mb-1">浏览器</div>
        <div className="text-sm text-gray-300">{deviceInfo.browser}</div>
      </div>
      <div className="bg-white/5 rounded-lg p-3">
        <div className="text-xs text-gray-500 mb-1">操作系统</div>
        <div className="text-sm text-gray-300">{deviceInfo.os}</div>
      </div>
      <div className="bg-white/5 rounded-lg p-3 col-span-2">
        <div className="text-xs text-gray-500 mb-1">屏幕分辨率</div>
        <div className="text-sm text-gray-300">{deviceInfo.screenSize}</div>
      </div>
    </div>
  );
}

interface EvidenceSummaryProps {
  evidence: TaskSubmission["evidence"];
  taskType: TaskSubmission["taskType"];
}

function EvidenceSummary({ evidence, taskType }: EvidenceSummaryProps) {
  return (
    <div className="space-y-2">
      {taskType === "media" && evidence.media && (
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-sm font-medium text-white mb-2">媒体证据</div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-xs text-gray-500">观看时长</div>
              <div className="text-gray-300">{evidence.media.watchDuration}秒</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">跳转行为</div>
              <div className={evidence.media.hasRedirected ? "text-success-400" : "text-danger-400"}>
                {evidence.media.hasRedirected ? "已完成" : "未完成"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">完成时间戳</div>
              <div className="text-gray-300 font-mono text-xs">{evidence.media.completionTimestamp}</div>
            </div>
          </div>
        </div>
      )}
      {taskType === "survey" && evidence.survey && (
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-sm font-medium text-white mb-2">问卷证据</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-xs text-gray-500">答题时长</div>
              <div className="text-gray-300">{evidence.survey.duration}秒</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">一致性评分</div>
              <div className={evidence.survey.consistencyScore >= 0.7 ? "text-success-400" : evidence.survey.consistencyScore >= 0.4 ? "text-warning-400" : "text-danger-400"}>
                {(evidence.survey.consistencyScore * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      )}
      {taskType === "experience" && evidence.experience && (
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-sm font-medium text-white mb-2">体验证据</div>
          {evidence.experience.ocrResult && (
            <div className="mb-2">
              <div className="text-xs text-gray-500">OCR识别结果</div>
              <div className="text-sm text-gray-300 bg-white/5 rounded px-2 py-1">{evidence.experience.ocrResult}</div>
              <div className="text-xs text-gray-500 mt-1">置信度：{evidence.experience.ocrConfidence}%</div>
            </div>
          )}
          <div>
            <div className="text-xs text-gray-500">反馈内容</div>
            <div className="text-sm text-gray-300 line-clamp-2">{evidence.experience.feedbackText}</div>
          </div>
          <div className="text-xs text-gray-500 mt-1">照片数量：{evidence.experience.photos.length}张</div>
        </div>
      )}
    </div>
  );
}

export default function RiskControlPage() {
  const { submissions, riskAlerts, resolveRiskAlert, updateSubmissionStatus, refreshRiskAlerts } = useAppStore();
  const [activeTab, setActiveTab] = useState<"overview" | "ai-review" | "manual" | "dispute" | "monitoring">("overview");
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const pendingReview = submissions.filter((s) => s.status === "pending").length;
  const aiPassed = submissions.filter((s) => s.status === "ai_passed").length;
  const aiFlagged = submissions.filter((s) => s.status === "ai_flagged").length;
  const inDispute = submissions.filter((s) => s.status === "disputed").length;
  const unresolvedAlerts = riskAlerts.filter((a) => !a.resolved);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      refreshRiskAlerts();
      setToastMessage("刷新成功");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshRiskAlerts]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedSubmissions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const aiReviewList = submissions.filter(
    (s) => s.status === "pending" || s.status === "ai_flagged" || s.status === "ai_passed"
  );
  const manualList = submissions.filter((s) => s.status === "ai_flagged");
  const disputeList = submissions.filter((s) => s.status === "disputed");

  return (
    <MainLayout title="风控审核中心" subtitle={`${unresolvedAlerts.length} 条待处理告警`}>
      {showToast && (
        <div className="fixed top-20 right-6 z-50 bg-success-500/20 border border-success-500/30 text-success-400 px-4 py-2 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-right-5">
          <CheckCircle2 className="w-4 h-4" />
          {toastMessage}
        </div>
      )}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          {[
            { key: "overview", label: "风控总览", icon: ShieldCheck },
            { key: "ai-review", label: "AI初筛", icon: Bot },
            { key: "manual", label: "人工抽检", icon: UserCheck },
            { key: "dispute", label: "争议仲裁", icon: Gavel },
            { key: "monitoring", label: "异常监控", icon: Monitor },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const badge =
              tab.key === "ai-review" ? pendingReview : tab.key === "manual" ? aiFlagged : tab.key === "dispute" ? inDispute : 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  "px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  isActive
                    ? "bg-cyber-cyan-500/15 text-cyber-cyan-400 border border-cyber-cyan-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {badge > 0 && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-danger-500/20 text-danger-400 rounded-full">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-5 gap-4">
              <StatCard
                title="待审核"
                value={pendingReview}
                icon={<Clock className="w-6 h-6" />}
                accentColor="#FF9100"
              />
              <StatCard
                title="AI自动通过"
                value={aiPassed}
                icon={<Bot className="w-6 h-6" />}
                trend={12}
                trendLabel="较昨日"
                accentColor="#00E676"
              />
              <StatCard
                title="AI标记存疑"
                value={aiFlagged}
                icon={<AlertTriangle className="w-6 h-6" />}
                accentColor="#FFB800"
              />
              <StatCard
                title="争议仲裁中"
                value={inDispute}
                icon={<Gavel className="w-6 h-6" />}
                accentColor="#FF3D71"
              />
              <StatCard
                title="活跃风控告警"
                value={unresolvedAlerts.length}
                icon={<Bell className="w-6 h-6" />}
                accentColor="#00F0FF"
              />
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-white">实时风控告警</h3>
                    <p className="text-sm text-gray-500 mt-1">按严重程度排列</p>
                  </div>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="text-cyber-cyan-400 text-sm flex items-center gap-1 hover:text-cyber-cyan-300 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                    刷新
                  </button>
                </div>

                <div className="space-y-3">
                  {riskAlerts.map((alert) => {
                    const sevConfig = severityConfig[alert.severity];
                    const processingStatus = getProcessingStatusLabel(alert.processingStatus);
                    return (
                      <div
                        key={alert.id}
                        className={cn(
                          "p-4 rounded-xl border transition-all cursor-pointer",
                          alert.resolved
                            ? "bg-white/5 border-white/5 opacity-60"
                            : "bg-deep-space-800/50 border-white/10 hover:border-cyber-cyan-500/30"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className={cn("w-2.5 h-2.5 rounded-full", sevConfig.dotClass)} />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-white font-medium">{alert.title}</h4>
                                {alert.batchNumber && (
                                  <span className="text-xs text-gray-500 font-mono">
                                    {alert.batchNumber}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {alertTypeLabels[alert.type]} · 影响 {alert.affectedCount} 个实体
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={processingStatus.class}>
                              {processingStatus.label}
                            </span>
                            <span className={cn("tag", sevConfig.bgClass, sevConfig.color)}>
                              {sevConfig.label}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{alert.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              检测于 {getRelativeTime(alert.detectedAt)}
                            </span>
                          </div>
                          {!alert.resolved && (
                            <button
                              onClick={() => resolveRiskAlert(alert.id)}
                              className="text-xs text-cyber-cyan-400 hover:text-cyber-cyan-300 flex items-center gap-1"
                            >
                              处理
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-medium text-white mb-4">审核效率统计</h3>
                <div className="space-y-4">
                  {[
                    { label: "AI初筛通过率", value: 78, color: "#00E676" },
                    { label: "人工抽检率", value: 15, color: "#FFB800" },
                    { label: "争议解决率", value: 92, color: "#00F0FF" },
                    { label: "平均审核时长", value: 45, unit: "分钟", color: "#FF9100" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-gray-400">{item.label}</span>
                        <span className="text-sm font-medium text-white font-mono">
                          {item.value}
                          {item.unit || "%"}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(item.value, 100)}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-medium text-white mb-4">审核队列概览</h3>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "待AI审核", count: pendingReview, icon: Clock, color: "#FF9100" },
                  { label: "待人工抽检", count: aiFlagged, icon: UserCheck, color: "#FFB800" },
                  { label: "争议待仲裁", count: inDispute, icon: Gavel, color: "#FF3D71" },
                  { label: "今日已处理", count: 156, icon: CheckCircle2, color: "#00E676" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="p-5 rounded-xl bg-deep-space-800/50 border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                        style={{ backgroundColor: `${item.color}15`, color: item.color }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className="text-2xl font-display font-bold text-white">{item.count}</p>
                      <p className="text-sm text-gray-500 mt-1">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "ai-review" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" placeholder="搜索任务、用户..." className="input-field pl-9 w-64 text-sm" />
                </div>
                <select className="input-field w-40 text-sm">
                  <option>全部状态</option>
                  <option>待审核</option>
                  <option>已通过</option>
                  <option>已标记</option>
                </select>
                <button className="btn-secondary text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  筛选
                </button>
              </div>
              <button className="btn-primary text-sm">批量AI审核</button>
            </div>

            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="table-header w-8"></th>
                    <th className="table-header">任务 / 提交者</th>
                    <th className="table-header">类型</th>
                    <th className="table-header">AI评分</th>
                    <th className="table-header">风险预检</th>
                    <th className="table-header">风险标记</th>
                    <th className="table-header">提交时间</th>
                    <th className="table-header">状态</th>
                    <th className="table-header">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {aiReviewList.map((sub) => {
                    const isSelected = selectedSubmission === sub.id;
                    const isExpanded = expandedSubmissions.has(sub.id);
                    return (
                      <>
                        <tr
                          key={sub.id}
                          className={cn(
                            "hover:bg-white/5 transition-colors cursor-pointer",
                            isSelected && "bg-cyber-cyan-500/5"
                          )}
                          onClick={() => {
                            setSelectedSubmission(sub.id);
                            toggleExpanded(sub.id);
                          }}
                        >
                          <td className="table-cell w-8">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </td>
                          <td className="table-cell">
                            <div>
                              <p className="text-white font-medium">{sub.taskTitle}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{sub.executorName}</p>
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className="tag tag-cyan">
                              {sub.taskType === "media" && "媒体类"}
                              {sub.taskType === "survey" && "调研类"}
                              {sub.taskType === "experience" && "体验类"}
                            </span>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center gap-3">
                              <div className="w-20 progress-bar">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    sub.aiScore >= 80
                                      ? "bg-success-500"
                                      : sub.aiScore >= 60
                                      ? "bg-warning-500"
                                      : "bg-danger-500"
                                  )}
                                  style={{ width: `${sub.aiScore}%` }}
                                />
                              </div>
                              <span
                                className={cn(
                                  "text-sm font-mono font-medium",
                                  sub.aiScore >= 80
                                    ? "text-success-500"
                                    : sub.aiScore >= 60
                                    ? "text-warning-500"
                                    : "text-danger-500"
                                )}
                              >
                                {sub.aiScore}
                              </span>
                            </div>
                          </td>
                          <td className="table-cell">
                            <RiskCheckBadges riskChecks={sub.riskChecks} />
                          </td>
                          <td className="table-cell">
                            {sub.aiFlags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {sub.aiFlags.slice(0, 2).map((flag) => (
                                  <span key={flag} className="tag tag-red text-xs">
                                    {flag}
                                  </span>
                                ))}
                                {sub.aiFlags.length > 2 && (
                                  <span className="tag tag-gray text-xs">+{sub.aiFlags.length - 2}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">无</span>
                            )}
                          </td>
                          <td className="table-cell text-gray-400 text-sm">
                            {new Date(sub.submittedAt).toLocaleString("zh-CN", { hour12: false })}
                          </td>
                          <td className="table-cell">
                            <span
                              className={cn(
                                "tag",
                                sub.status === "pending" && "tag-orange",
                                sub.status === "ai_passed" && "tag-green",
                                sub.status === "ai_flagged" && "tag-red"
                              )}
                            >
                              {sub.status === "pending" && "待审核"}
                              {sub.status === "ai_passed" && "AI通过"}
                              {sub.status === "ai_flagged" && "AI存疑"}
                            </span>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpanded(sub.id);
                                }}
                                className="text-cyber-cyan-400 hover:text-cyber-cyan-300 text-sm flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                详情
                              </button>
                              {sub.status === "pending" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateSubmissionStatus(sub.id, "ai_passed");
                                  }}
                                  className="text-success-500 hover:text-success-400 text-sm"
                                >
                                  通过
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={9} className="bg-white/5 border-t border-white/10">
                              <div className="p-6">
                                <div className="grid grid-cols-3 gap-6">
                                  <div>
                                    <h5 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-cyber-cyan-400" />
                                      审核流转记录
                                    </h5>
                                    <ReviewTimeline reviewFlow={sub.reviewFlow} />
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                      <HardDrive className="w-4 h-4 text-amber-gold-400" />
                                      设备信息
                                    </h5>
                                    <DeviceInfo deviceInfo={sub.deviceInfo} />
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-purple-400" />
                                      提交证据摘要
                                    </h5>
                                    <EvidenceSummary evidence={sub.evidence} taskType={sub.taskType} />
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "manual" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-400">
                AI标记为存疑的任务需要人工审核，共 <span className="text-amber-gold-400 font-medium">{manualList.length}</span> 条待处理
              </p>
              <div className="flex items-center gap-2">
                <button className="btn-secondary text-sm">批量通过</button>
                <button className="btn-danger text-sm">批量驳回</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {manualList.map((sub) => {
                const isExpanded = expandedSubmissions.has(sub.id);
                const aiReviewRecord = sub.reviewFlow.find((r) => r.stage === "ai_review");
                return (
                  <div key={sub.id} className="glass-card p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white font-medium">{sub.taskTitle}</h4>
                          <span className="tag tag-amber">人工抽检中</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">提交者：{sub.executorName}</p>
                      </div>
                      <span className="tag tag-red">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                        {sub.aiFlags.length} 项标记
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                      {aiReviewRecord && (
                        <div className="bg-cyber-cyan-500/10 rounded-lg p-3 border border-cyber-cyan-500/20">
                          <div className="text-cyber-cyan-400 mb-1">AI初筛时间</div>
                          <div className="text-gray-300">
                            {new Date(aiReviewRecord.timestamp).toLocaleString("zh-CN", { hour12: false })}
                          </div>
                        </div>
                      )}
                      <div className="bg-danger-500/10 rounded-lg p-3 border border-danger-500/20">
                        <div className="text-danger-400 mb-1">AI标记原因</div>
                        <div className="text-gray-300 text-xs">
                          {sub.aiFlags.slice(0, 2).join("、")}
                          {sub.aiFlags.length > 2 && `等${sub.aiFlags.length}项`}
                        </div>
                      </div>
                    </div>

                    <div className="bg-deep-space-950/50 rounded-lg p-4 mb-4 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500">AI检测标记</p>
                        <button
                          onClick={() => toggleExpanded(sub.id)}
                          className="text-xs text-cyber-cyan-400 flex items-center gap-1"
                        >
                          {isExpanded ? "收起" : "展开详情"}
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {sub.aiFlags.map((flag) => (
                          <div key={flag} className="flex items-center gap-2 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-danger-500" />
                            <span className="text-gray-400">{flag}</span>
                          </div>
                        ))}
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <h5 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-gold-400" />
                            审核流转记录
                          </h5>
                          <ReviewTimeline reviewFlow={sub.reviewFlow} />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span>提交时间：{new Date(sub.submittedAt).toLocaleString("zh-CN")}</span>
                      <span>赏金：¥{sub.rewardAmount}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateSubmissionStatus(sub.id, "manual_passed")}
                        className="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-2"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        审核通过
                      </button>
                      <button
                        onClick={() => updateSubmissionStatus(sub.id, "manual_rejected")}
                        className="flex-1 btn-danger text-sm py-2 flex items-center justify-center gap-2"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        驳回
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "dispute" && (
          <div className="space-y-6">
            {disputeList.length === 0 ? (
              <div className="glass-card p-16 text-center">
                <Gavel className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">暂无争议中的任务</p>
                <p className="text-sm text-gray-600 mt-1">所有争议都已妥善处理</p>
              </div>
            ) : (
              disputeList.map((sub) => {
                const aiReviewRecord = sub.reviewFlow.find((r) => r.stage === "ai_review");
                const manualReviewRecord = sub.reviewFlow.find((r) => r.stage === "manual_review");
                const disputeRecord = sub.reviewFlow.find((r) => r.stage === "dispute_arbitration");

                return (
                  <div key={sub.id} className="glass-card p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-white">{sub.taskTitle}</h3>
                          <span className="tag tag-pink">争议仲裁中</span>
                        </div>
                        <p className="text-sm text-gray-500">
                          提交者：{sub.executorName} · 提交时间：{new Date(sub.submittedAt).toLocaleString("zh-CN")}
                        </p>
                      </div>
                      <p className="text-xl font-display font-bold text-amber-gold-400">
                        ¥{sub.rewardAmount}
                      </p>
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-6">
                      <div className="p-3 rounded-xl bg-cyber-cyan-500/10 border border-cyber-cyan-500/20">
                        <div className="text-xs text-cyber-cyan-400 mb-1">AI审核时间</div>
                        <div className="text-sm text-gray-300">
                          {aiReviewRecord
                            ? new Date(aiReviewRecord.timestamp).toLocaleString("zh-CN", {
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })
                            : "-"}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-gold-500/10 border border-amber-gold-500/20">
                        <div className="text-xs text-amber-gold-400 mb-1">人工审核时间</div>
                        <div className="text-sm text-gray-300">
                          {manualReviewRecord
                            ? new Date(manualReviewRecord.timestamp).toLocaleString("zh-CN", {
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })
                            : "-"}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20">
                        <div className="text-xs text-pink-400 mb-1">申诉时间</div>
                        <div className="text-sm text-gray-300">
                          {disputeRecord
                            ? new Date(disputeRecord.timestamp).toLocaleString("zh-CN", {
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })
                            : "-"}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-warning-500/10 border border-warning-500/20">
                        <div className="text-xs text-warning-400 mb-1">AI置信度</div>
                        <div className="text-sm text-gray-300 font-mono">{sub.aiScore}%</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mb-6">
                      <div className="p-4 rounded-xl bg-deep-space-800/30 border border-white/5">
                        <h5 className="text-sm font-medium text-white mb-3">执行者申诉理由</h5>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          我已完整观看视频并完成了所有要求的操作，视频播放时长已达到要求。
                          可能是网络延迟导致系统误判，请求重新审核。谢谢！
                        </p>
                        {disputeRecord && (
                          <p className="text-xs text-gray-600 mt-3">
                            申诉时间：{new Date(disputeRecord.timestamp).toLocaleString("zh-CN", { hour12: false })}
                          </p>
                        )}
                      </div>
                      <div className="p-4 rounded-xl bg-deep-space-800/30 border border-white/5">
                        <h5 className="text-sm font-medium text-white mb-3">AI审核依据</h5>
                        <div className="space-y-2">
                          {sub.aiFlags.map((flag) => (
                            <div key={flag} className="flex items-start gap-2">
                              <FileWarning className="w-4 h-4 text-danger-500 mt-0.5" />
                              <span className="text-sm text-gray-400">{flag}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <RiskCheckBadges riskChecks={sub.riskChecks} />
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-deep-space-800/30 border border-white/5">
                        <h5 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-pink-400" />
                          完整审核流转记录
                        </h5>
                        <ReviewTimeline reviewFlow={sub.reviewFlow} showFullFlow />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => updateSubmissionStatus(sub.id, "arbitrated", "争议仲裁：维持原驳回决定")}
                        className="btn-danger text-sm flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        维持驳回
                      </button>
                      <button
                        onClick={() => updateSubmissionStatus(sub.id, "arbitrated", "争议仲裁：改判通过")}
                        className="btn-primary text-sm flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        改判通过
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "monitoring" && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-5">
              <StatCard
                title="在线设备数"
                value="12,456"
                icon={<Monitor className="w-6 h-6" />}
                accentColor="#00F0FF"
              />
              <StatCard
                title="异常设备集群"
                value={mockDeviceClusters.filter((c) => c.riskLevel !== "low").length}
                icon={<MapPin className="w-6 h-6" />}
                accentColor="#FF3D71"
              />
              <StatCard
                title="今日封禁账号"
                value="23"
                icon={<Ban className="w-6 h-6" />}
                trend={-15}
                trendLabel="较昨日"
                accentColor="#FFB800"
              />
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-white">异常设备集群分布</h3>
                  <p className="text-sm text-gray-500 mt-1">基于设备指纹和IP地址聚类分析</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-danger-500" />
                    严重
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-gold-500" />
                    高危
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-warning-500" />
                    中危
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gray-500" />
                    低危
                  </span>
                </div>
              </div>

              <div className="h-80 relative bg-deep-space-950/50 rounded-xl border border-white/5 overflow-hidden">
                <div className="absolute inset-0 grid-pattern opacity-30" />
                {mockDeviceClusters.map((cluster) => {
                  const colorMap = {
                    critical: "#FF3D71",
                    high: "#FFB800",
                    medium: "#FF9100",
                    low: "#6B7280",
                  };
                  const color = colorMap[cluster.riskLevel];
                  return (
                    <div
                      key={cluster.clusterId}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                      style={{ left: `${cluster.x}%`, top: `${cluster.y}%` }}
                    >
                      <div
                        className="absolute inset-0 rounded-full animate-ping opacity-30"
                        style={{
                          width: `${cluster.count * 4}px`,
                          height: `${cluster.count * 4}px`,
                          backgroundColor: color,
                          left: "50%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                        }}
                      />
                      <div
                        className="rounded-full flex items-center justify-center relative"
                        style={{
                          width: `${cluster.count * 2 + 20}px`,
                          height: `${cluster.count * 2 + 20}px`,
                          backgroundColor: `${color}30`,
                          border: `2px solid ${color}`,
                          boxShadow: `0 0 20px ${color}40`,
                        }}
                      >
                        <span className="text-white text-xs font-bold">{cluster.count}</span>
                      </div>
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-gray-400">集群 {cluster.clusterId}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-medium text-white mb-4">可疑账号列表</h3>
              <div className="space-y-3">
                {[
                  { name: "用户_2k8f9a", reason: "异常答题速度", score: 95, devices: 8 },
                  { name: "用户_7m3n2p", reason: "设备指纹异常", score: 88, devices: 5 },
                  { name: "用户_9s5w1q", reason: "同一IP多账号", score: 82, devices: 12 },
                  { name: "用户_4d6h8j", reason: "答案模式高度相似", score: 76, devices: 3 },
                ].map((user, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-xl bg-deep-space-800/30 hover:bg-deep-space-800/50 border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-danger-500/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-danger-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{user.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">风险评分</p>
                        <p className="text-danger-400 font-mono font-medium">{user.score}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">关联设备</p>
                        <p className="text-warning-500 font-mono font-medium">{user.devices}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg text-danger-400 hover:text-danger-300 hover:bg-danger-500/10">
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
