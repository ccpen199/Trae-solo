import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  X,
  Plus,
  Settings,
  Bell,
  BellOff,
  Clock,
  Target,
  User,
  Calendar,
  Stethoscope,
  FileText,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock3,
  AlertOctagon,
  Users,
} from "lucide-react";
import Card from "../components/ui/Card";
import Timeline from "../components/ui/Timeline";
import { useHealthStore } from "../store/useHealthStore";
import { api } from "../utils/api";
import type { Alert, AlertRule, AlertSeverity, ConditionOperator, AlertStatus, DispositionStatus } from "../../shared/types";
import type { AlertLevel } from "../components/ui/Timeline";

const severityConfig: Record<AlertSeverity, { bg: string; border: string; icon: JSX.Element; badge: string; label: string; dot: string }> = {
  critical: { bg: "bg-alert-red-500/10", border: "border-alert-red-500/30", icon: <AlertTriangle className="w-5 h-5 text-alert-red-500" />, badge: "bg-alert-red-500", label: "紧急", dot: "bg-alert-red-500" },
  warning: { bg: "bg-warning-amber-500/10", border: "border-warning-amber-500/30", icon: <AlertCircle className="w-5 h-5 text-warning-amber-500" />, badge: "bg-warning-amber-500", label: "警告", dot: "bg-warning-amber-500" },
  info: { bg: "bg-vital-green-500/10", border: "border-vital-green-500/30", icon: <Info className="w-5 h-5 text-vital-green-500" />, badge: "bg-vital-green-500", label: "提示", dot: "bg-vital-green-500" },
};

const statusConfig: Record<AlertStatus | "all", { label: string; color: string; bg: string; border: string; dot: string; icon: JSX.Element }> = {
  all: { label: "全部", color: "text-deep-sea-100", bg: "bg-vital-green-500/20", border: "border-vital-green-500/40", dot: "bg-vital-green-500", icon: <Bell className="w-4 h-4" /> },
  active: { label: "活跃", color: "text-alert-red-400", bg: "bg-alert-red-500/10", border: "border-alert-red-500/30", dot: "bg-alert-red-500", icon: <AlertOctagon className="w-4 h-4" /> },
  pending_review: { label: "待复核", color: "text-warning-amber-400", bg: "bg-warning-amber-500/10", border: "border-warning-amber-500/30", dot: "bg-warning-amber-500", icon: <Clock3 className="w-4 h-4" /> },
  acknowledged: { label: "已确认", color: "text-vital-green-400", bg: "bg-vital-green-500/10", border: "border-vital-green-500/30", dot: "bg-vital-green-500", icon: <CheckCircle2 className="w-4 h-4" /> },
  dismissed: { label: "已忽略", color: "text-deep-sea-300", bg: "bg-deep-sea-400/10", border: "border-deep-sea-400/30", dot: "bg-deep-sea-400", icon: <XCircle className="w-4 h-4" /> },
  needs_referral: { label: "需转诊", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", dot: "bg-purple-500", icon: <Stethoscope className="w-4 h-4" /> },
};

const dispositionLabels: Record<DispositionStatus, string> = {
  observed: "观察随访",
  medication_adjusted: "药物调整",
  lifestyle_change: "生活方式改变",
  referral_suggested: "建议转诊",
  no_action: "无需处理",
};

const metricOptions = [
  { value: "heartRate", label: "心率" },
  { value: "bloodOxygen", label: "血氧" },
  { value: "stressIndex", label: "压力" },
  { value: "hrv", label: "HRV" },
];

const conditionOptions: { value: ConditionOperator; label: string }[] = [
  { value: "gt", label: ">" },
  { value: "lt", label: "<" },
  { value: "gte", label: ">=" },
  { value: "lte", label: "<=" },
  { value: "spike_percent", label: "突增%" },
];

const presetTemplates = [
  { name: "心率异常", metric: "heartRate", condition: "gt" as ConditionOperator, threshold: 100, duration: 5, severity: "warning" as AlertSeverity },
  { name: "血氧低", metric: "bloodOxygen", condition: "lt" as ConditionOperator, threshold: 95, duration: 3, severity: "critical" as AlertSeverity },
  { name: "压力高", metric: "stressIndex", condition: "gt" as ConditionOperator, threshold: 70, duration: 10, severity: "warning" as AlertSeverity },
  { name: "HRV低", metric: "hrv", condition: "lt" as ConditionOperator, threshold: 40, duration: 15, severity: "info" as AlertSeverity },
];

type TabKey = "all" | AlertStatus;

export function Alerts() {
  const navigate = useNavigate();
  const { alerts, alertRules, updateAlert, updateAlertRule, addAlertRule, removeAlertRule, setLoading } = useHealthStore();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [formData, setFormData] = useState({ metric: "heartRate", condition: "gt" as ConditionOperator, threshold: 0, durationMinutes: 5, severity: "warning" as AlertSeverity });
  const [showReviewModal, setShowReviewModal] = useState<string | null>(null);
  const [reviewTime, setReviewTime] = useState("");
  const [showCompleteModal, setShowCompleteModal] = useState<string | null>(null);
  const [dispositionStatus, setDispositionStatus] = useState<DispositionStatus>("observed");
  const [dispositionNote, setDispositionNote] = useState("");

  const today = new Date().toDateString();
  const todayAlerts = alerts.filter((a) => new Date(a.createdAt).toDateString() === today);

  const counts: Record<TabKey, number> = {
    all: alerts.length,
    active: alerts.filter((a) => a.status === "active").length,
    pending_review: alerts.filter((a) => a.status === "pending_review").length,
    acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
    dismissed: alerts.filter((a) => a.status === "dismissed").length,
    needs_referral: alerts.filter((a) => a.status === "needs_referral").length,
  };

  const displayAlerts = activeTab === "all" ? alerts : alerts.filter((a) => a.status === activeTab);

  const handleAlertAction = async (alertId: string, action: "acknowledge" | "dismiss") => {
    setLoading("alert", true);
    try {
      const updated = (action === "acknowledge" ? await api.alerts.acknowledge(alertId) : await api.alerts.dismiss(alertId)) as Alert;
      updateAlert(updated);
    } catch (error) {
      console.error(`Failed to ${action} alert:`, error);
    } finally {
      setLoading("alert", false);
    }
  };

  const handleScheduleReview = async (alertId: string) => {
    if (!reviewTime) return;
    setLoading("alert", true);
    try {
      const updated = (await api.alerts.scheduleReview(alertId, reviewTime)) as Alert;
      updateAlert(updated);
      setShowReviewModal(null);
      setReviewTime("");
    } catch (error) {
      console.error("Failed to schedule review:", error);
    } finally {
      setLoading("alert", false);
    }
  };

  const handleMarkReferral = async (alertId: string) => {
    setLoading("alert", true);
    try {
      const updated = (await api.alerts.markReferral(alertId)) as Alert;
      updateAlert(updated);
    } catch (error) {
      console.error("Failed to mark referral:", error);
    } finally {
      setLoading("alert", false);
    }
  };

  const handleCompleteReview = async (alertId: string) => {
    setLoading("alert", true);
    try {
      const updated = (await api.alerts.completeReview(alertId, dispositionStatus, dispositionNote)) as Alert;
      updateAlert(updated);
      setShowCompleteModal(null);
      setDispositionStatus("observed");
      setDispositionNote("");
    } catch (error) {
      console.error("Failed to complete review:", error);
    } finally {
      setLoading("alert", false);
    }
  };

  const handleToggleRule = async (rule: AlertRule) => {
    try {
      const updated = (await api.alerts.updateRule(rule.id, { ...rule, enabled: !rule.enabled })) as AlertRule;
      updateAlertRule(updated);
    } catch (error) {
      console.error("Failed to toggle rule:", error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await api.alerts.deleteRule(ruleId);
      removeAlertRule(ruleId);
    } catch (error) {
      console.error("Failed to delete rule:", error);
    }
  };

  const handleSaveRule = async () => {
    try {
      const metricName = metricOptions.find((m) => m.value === formData.metric)?.label || "";
      if (editingRule) {
        const updated = (await api.alerts.updateRule(editingRule.id, { ...formData, metricName, enabled: true })) as AlertRule;
        updateAlertRule(updated);
      } else {
        const newRule = (await api.alerts.createRule({ ...formData, metricName, enabled: true })) as AlertRule;
        addAlertRule(newRule);
      }
      setShowRuleForm(false);
      setEditingRule(null);
    } catch (error) {
      console.error("Failed to save rule:", error);
    }
  };

  const handleApplyTemplate = (template: typeof presetTemplates[0]) => {
    setFormData({ metric: template.metric, condition: template.condition, threshold: template.threshold, durationMinutes: template.duration, severity: template.severity });
    setShowRuleForm(true);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const timelineItems = alerts.slice(0, 10).map((alert) => ({
    id: alert.id,
    time: new Date(alert.createdAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
    title: alert.title,
    description: alert.description,
    level: (alert.severity === "critical" ? "critical" : alert.severity === "warning" ? "warning" : alert.status === "acknowledged" ? "success" : "info") as AlertLevel,
  }));

  const stats = [
    { label: "活跃预警", value: counts.active, icon: <Bell className="w-5 h-5" />, color: "text-alert-red-400", bg: "bg-alert-red-500/10" },
    { label: "今日预警", value: todayAlerts.length, icon: <Clock className="w-5 h-5" />, color: "text-warning-amber-400", bg: "bg-warning-amber-500/10" },
    { label: "已确认", value: counts.acknowledged, icon: <Check className="w-5 h-5" />, color: "text-vital-green-400", bg: "bg-vital-green-500/10" },
    { label: "需转诊", value: counts.needs_referral, icon: <Stethoscope className="w-5 h-5" />, color: "text-purple-400", bg: "bg-purple-500/10" },
  ];

  const tabs: TabKey[] = ["all", "active", "pending_review", "acknowledged", "dismissed", "needs_referral"];

  const renderActionButtons = (alert: Alert) => {
    const buttons: JSX.Element[] = [];

    switch (alert.status) {
      case "active":
        buttons.push(
          <button
            key="acknowledge"
            onClick={() => handleAlertAction(alert.id, "acknowledge")}
            className="px-3 py-1.5 text-xs rounded-full bg-vital-green-500/20 text-vital-green-400 hover:bg-vital-green-500/30 transition-colors font-medium"
          >
            确认
          </button>
        );
        buttons.push(
          <button
            key="dismiss"
            onClick={() => handleAlertAction(alert.id, "dismiss")}
            className="px-3 py-1.5 text-xs rounded-full bg-deep-sea-200/10 text-deep-sea-200/70 hover:bg-deep-sea-200/20 transition-colors"
          >
            忽略
          </button>
        );
        buttons.push(
          <button
            key="review"
            onClick={() => { setShowReviewModal(alert.id); setReviewTime(""); }}
            className="px-3 py-1.5 text-xs rounded-full bg-warning-amber-500/20 text-warning-amber-400 hover:bg-warning-amber-500/30 transition-colors"
          >
            安排复查
          </button>
        );
        break;

      case "pending_review":
        buttons.push(
          <button
            key="complete"
            onClick={() => { setShowCompleteModal(alert.id); setDispositionStatus("observed"); setDispositionNote(""); }}
            className="px-3 py-1.5 text-xs rounded-full bg-vital-green-500/20 text-vital-green-400 hover:bg-vital-green-500/30 transition-colors font-medium"
          >
            完成复查
          </button>
        );
        buttons.push(
          <button
            key="referral"
            onClick={() => handleMarkReferral(alert.id)}
            className="px-3 py-1.5 text-xs rounded-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
          >
            标记转诊
          </button>
        );
        break;

      case "needs_referral":
        buttons.push(
          <button
            key="archive"
            onClick={() => navigate("/records")}
            className="px-3 py-1.5 text-xs rounded-full bg-vital-green-500/20 text-vital-green-400 hover:bg-vital-green-500/30 transition-colors flex items-center gap-1"
          >
            <FileText className="w-3 h-3" />
            健康档案
            <ChevronRight className="w-3 h-3" />
          </button>
        );
        break;

      case "acknowledged":
        buttons.push(
          <button
            key="review"
            onClick={() => { setShowReviewModal(alert.id); setReviewTime(""); }}
            className="px-3 py-1.5 text-xs rounded-full bg-warning-amber-500/20 text-warning-amber-400 hover:bg-warning-amber-500/30 transition-colors"
          >
            安排复查
          </button>
        );
        buttons.push(
          <button
            key="referral"
            onClick={() => handleMarkReferral(alert.id)}
            className="px-3 py-1.5 text-xs rounded-full bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
          >
            标记转诊
          </button>
        );
        break;

      case "dismissed":
        buttons.push(
          <button
            key="reactivate"
            onClick={() => handleAlertAction(alert.id, "acknowledge")}
            className="px-3 py-1.5 text-xs rounded-full bg-deep-sea-200/10 text-deep-sea-200/70 hover:bg-deep-sea-200/20 transition-colors"
          >
            重新激活
          </button>
        );
        break;
    }

    return buttons;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-deep-sea-50 glow-text">预警中心</h1>
          <p className="text-deep-sea-200/60 mt-1">实时监控健康数据，及时发现异常</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4" hoverable={false}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-2xl font-din font-bold text-deep-sea-50">{stat.value}</p>
                <p className="text-xs text-deep-sea-200/60">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-2" hoverable={false}>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const config = statusConfig[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                  isActive
                    ? `${config.bg} ${config.color} ${config.border} border shadow-lg`
                    : "text-deep-sea-200/60 hover:text-deep-sea-100 hover:bg-deep-sea-600/50"
                }`}
              >
                <span className={isActive ? config.color : "text-deep-sea-300/50"}>{config.icon}</span>
                <span className="text-sm">{config.label}</span>
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs font-din font-bold ${
                    isActive ? `${config.bg} ${config.color}` : "bg-deep-sea-600/50 text-deep-sea-300"
                  }`}
                >
                  {counts[tab]}
                </span>
                {isActive && tab === "active" && counts.active > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-alert-red-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {displayAlerts.map((alert) => {
          const styles = severityConfig[alert.severity];
          const statusStyle = statusConfig[alert.status];
          return (
            <Card key={alert.id} className={`${styles.bg} ${styles.border} border relative overflow-hidden`}>
              <div className={`absolute top-0 left-0 w-1 h-full ${statusStyle.dot}`} />
              <div className="pl-3">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {styles.icon}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${styles.badge}`}>{styles.label}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.color} border ${statusStyle.border}`}>
                          {statusStyle.label}
                        </span>
                        {alert.referralNeeded && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            需转诊
                          </span>
                        )}
                      </div>
                      <h4 className="text-deep-sea-100 font-medium mb-1">{alert.title}</h4>
                      <p className="text-xs text-deep-sea-200/70 mb-2">{alert.description}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="flex items-center gap-2 text-deep-sea-200/60">
                    <User className="w-3.5 h-3.5" />
                    <span>确认人: <span className="text-deep-sea-100">{alert.acknowledgedBy || "-"}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-deep-sea-200/60">
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>处置: <span className="text-deep-sea-100">{alert.dispositionStatus ? dispositionLabels[alert.dispositionStatus] : "-"}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-deep-sea-200/60">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>复查: <span className="text-deep-sea-100">{formatDateTime(alert.reviewScheduledAt)}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-deep-sea-200/60">
                    <Clock className="w-3.5 h-3.5" />
                    <span>开始: <span className="text-deep-sea-100">{formatDateTime(alert.startedAt)}</span></span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-deep-sea-200/60 mb-3 pt-2 border-t border-vital-green-500/10">
                  <span>当前: <span className="text-deep-sea-100 font-din">{alert.value}</span></span>
                  <span>阈值: <span className="text-deep-sea-100 font-din">{alert.threshold}</span></span>
                  <span>持续: <span className="text-deep-sea-100">{formatDuration(alert.durationMinutes)}</span></span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {renderActionButtons(alert)}
                </div>
              </div>
            </Card>
          );
        })}
        {displayAlerts.length === 0 && (
          <div className="lg:col-span-2 text-center py-12 text-deep-sea-200/50">
            <BellOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无{statusConfig[activeTab].label}预警</p>
          </div>
        )}
      </div>

      {showReviewModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-deep-sea-600 to-deep-sea-700 border border-vital-green-500/30 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-deep-sea-50 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-vital-green-400" />
              安排复查
            </h3>
            <div className="mb-4">
              <label className="block text-sm text-deep-sea-200/70 mb-2">复查时间</label>
              <input
                type="datetime-local"
                value={reviewTime}
                onChange={(e) => setReviewTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-deep-sea-700 text-deep-sea-100 border border-vital-green-500/20 focus:border-vital-green-500/50 focus:outline-none transition-colors"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowReviewModal(null); setReviewTime(""); }}
                className="px-4 py-2 rounded-xl bg-deep-sea-600/50 text-deep-sea-200 hover:bg-deep-sea-600 transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={() => handleScheduleReview(showReviewModal)}
                disabled={!reviewTime}
                className="px-4 py-2 rounded-xl bg-vital-green-500 text-deep-sea-900 font-medium text-sm hover:bg-vital-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认安排
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-deep-sea-600 to-deep-sea-700 border border-vital-green-500/30 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-deep-sea-50 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-vital-green-400" />
              完成复查
            </h3>
            <div className="mb-4">
              <label className="block text-sm text-deep-sea-200/70 mb-2">处置状态</label>
              <select
                value={dispositionStatus}
                onChange={(e) => setDispositionStatus(e.target.value as DispositionStatus)}
                className="w-full px-4 py-2.5 rounded-xl bg-deep-sea-700 text-deep-sea-100 border border-vital-green-500/20 focus:border-vital-green-500/50 focus:outline-none transition-colors"
              >
                {Object.entries(dispositionLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-deep-sea-200/70 mb-2">处置备注</label>
              <textarea
                value={dispositionNote}
                onChange={(e) => setDispositionNote(e.target.value)}
                placeholder="请输入处置备注..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-deep-sea-700 text-deep-sea-100 border border-vital-green-500/20 focus:border-vital-green-500/50 focus:outline-none transition-colors resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowCompleteModal(null); setDispositionStatus("observed"); setDispositionNote(""); }}
                className="px-4 py-2 rounded-xl bg-deep-sea-600/50 text-deep-sea-200 hover:bg-deep-sea-600 transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={() => handleCompleteReview(showCompleteModal)}
                className="px-4 py-2 rounded-xl bg-vital-green-500 text-deep-sea-900 font-medium text-sm hover:bg-vital-green-400 transition-colors"
              >
                确认完成
              </button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-vital-green-400" />
            <h3 className="text-lg font-semibold text-deep-sea-100">预警规则配置</h3>
          </div>
          <button onClick={() => { setShowRuleForm(true); setEditingRule(null); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-vital-green-500/20 text-vital-green-400 hover:bg-vital-green-500/30 transition-colors text-sm">
            <Plus className="w-4 h-4" /> 添加规则
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {presetTemplates.map((t) => (
            <button key={t.name} onClick={() => handleApplyTemplate(t)} className="px-3 py-1.5 rounded-lg bg-deep-sea-600/50 text-deep-sea-200 hover:bg-deep-sea-600 text-xs transition-colors">
              <Target className="w-3 h-3 inline mr-1" />{t.name}
            </button>
          ))}
        </div>

        {showRuleForm && (
          <div className="p-4 rounded-xl bg-deep-sea-600/30 border border-vital-green-500/20 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <select value={formData.metric} onChange={(e) => setFormData({ ...formData, metric: e.target.value })} className="px-3 py-2 rounded-lg bg-deep-sea-700 text-deep-sea-100 border border-vital-green-500/20 text-sm">
                {metricOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value as ConditionOperator })} className="px-3 py-2 rounded-lg bg-deep-sea-700 text-deep-sea-100 border border-vital-green-500/20 text-sm">
                {conditionOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <input type="number" value={formData.threshold} onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })} placeholder="阈值" className="px-3 py-2 rounded-lg bg-deep-sea-700 text-deep-sea-100 border border-vital-green-500/20 text-sm" />
              <input type="number" value={formData.durationMinutes} onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })} placeholder="分钟" className="px-3 py-2 rounded-lg bg-deep-sea-700 text-deep-sea-100 border border-vital-green-500/20 text-sm" />
              <select value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value as AlertSeverity })} className="px-3 py-2 rounded-lg bg-deep-sea-700 text-deep-sea-100 border border-vital-green-500/20 text-sm">
                <option value="critical">紧急</option>
                <option value="warning">警告</option>
                <option value="info">提示</option>
              </select>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={handleSaveRule} className="px-4 py-2 rounded-lg bg-vital-green-500 text-deep-sea-900 font-medium text-sm hover:bg-vital-green-400 transition-colors">保存</button>
              <button onClick={() => { setShowRuleForm(false); setEditingRule(null); }} className="px-4 py-2 rounded-lg bg-deep-sea-600/50 text-deep-sea-200 text-sm hover:bg-deep-sea-600 transition-colors">取消</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {alertRules.map((rule) => {
            const styles = severityConfig[rule.severity];
            return (
              <div key={rule.id} className="flex items-center justify-between p-3 rounded-xl bg-deep-sea-600/30 border border-vital-green-500/10 hover:border-vital-green-500/30 transition-colors">
                <div className="flex items-center gap-3">
                  <button onClick={() => handleToggleRule(rule)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${rule.enabled ? styles.bg : "bg-deep-sea-600/50"}`}>
                    {rule.enabled ? styles.icon : <BellOff className="w-5 h-5 text-deep-sea-300/50" />}
                  </button>
                  <div>
                    <p className="text-deep-sea-100 font-medium text-sm">{rule.metricName} {conditionOptions.find((c) => c.value === rule.condition)?.label} {rule.threshold}</p>
                    <p className="text-xs text-deep-sea-200/60">持续 {rule.durationMinutes} 分钟 · <span className={`px-1.5 py-0.5 rounded text-white ${styles.badge}`}>{styles.label}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingRule(rule); setFormData({ metric: rule.metric, condition: rule.condition, threshold: rule.threshold, durationMinutes: rule.durationMinutes, severity: rule.severity }); setShowRuleForm(true); }} className="p-2 rounded-lg hover:bg-deep-sea-600/50 text-deep-sea-200/70 transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteRule(rule.id)} className="p-2 rounded-lg hover:bg-alert-red-500/20 text-deep-sea-200/70 hover:text-alert-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {alertRules.length === 0 && <p className="text-center py-6 text-deep-sea-200/50 text-sm">暂无预警规则，点击上方添加或使用预设模板</p>}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-vital-green-400" />
          <h3 className="text-lg font-semibold text-deep-sea-100">预警历史记录</h3>
        </div>
        {timelineItems.length > 0 ? <Timeline items={timelineItems} /> : <p className="text-center py-12 text-deep-sea-200/50">暂无历史预警记录</p>}
      </Card>
    </div>
  );
}
