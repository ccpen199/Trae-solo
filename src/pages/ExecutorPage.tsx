import { useState } from "react";
import { MainLayout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { useAppStore } from "@/store/useAppStore";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Video,
  FileText,
  Package,
  ChevronRight,
  PlayCircle,
  ShieldCheck,
  Fingerprint,
  BadgeCheck,
  Camera,
  UploadCloud,
  Image,
  ScanLine,
  MessageSquare,
  ArrowRight,
  Zap,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { SubmissionStatus, TaskType } from "@/types";

const statusConfig: Record<
  SubmissionStatus,
  { label: string; color: string; bgClass: string }
> = {
  pending: { label: "待审核", color: "text-warning-500", bgClass: "bg-warning-500/10 border-warning-500/20" },
  ai_passed: { label: "AI通过", color: "text-success-500", bgClass: "bg-success-500/10 border-success-500/20" },
  ai_flagged: { label: "AI存疑", color: "text-danger-500", bgClass: "bg-danger-500/10 border-danger-500/20" },
  manual_passed: { label: "审核通过", color: "text-success-500", bgClass: "bg-success-500/10 border-success-500/20" },
  manual_rejected: { label: "审核驳回", color: "text-danger-500", bgClass: "bg-danger-500/10 border-danger-500/20" },
  disputed: { label: "争议仲裁中", color: "text-warning-500", bgClass: "bg-warning-500/10 border-warning-500/20" },
  arbitrated: { label: "仲裁完成", color: "text-cyber-cyan-400", bgClass: "bg-cyber-cyan-500/10 border-cyber-cyan-500/20" },
};

export default function ExecutorPage() {
  const navigate = useNavigate();
  const { currentExecutor, submissions, tasks } = useAppStore();
  const [activeTab, setActiveTab] = useState<"all" | "ongoing" | "completed" | "disputed">("all");

  const filteredSubmissions = submissions.filter((s) => {
    if (activeTab === "all") return true;
    if (activeTab === "ongoing") return ["pending", "ai_passed", "ai_flagged"].includes(s.status);
    if (activeTab === "completed") return ["manual_passed"].includes(s.status);
    if (activeTab === "disputed") return ["disputed", "arbitrated", "manual_rejected"].includes(s.status);
    return true;
  });

  const ongoingCount = submissions.filter((s) => ["pending", "ai_passed", "ai_flagged"].includes(s.status)).length;
  const completedCount = submissions.filter((s) => s.status === "manual_passed").length;
  const disputedCount = submissions.filter((s) => ["disputed", "manual_rejected"].includes(s.status)).length;

  return (
    <MainLayout title="执行工作台" subtitle={`${currentExecutor.name} · 信用分 ${currentExecutor.creditScore}`}>
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-5">
          <StatCard
            title="进行中任务"
            value={ongoingCount}
            icon={<Clock className="w-6 h-6" />}
            accentColor="#00F0FF"
          />
          <StatCard
            title="已完成任务"
            value={currentExecutor.completedTasks}
            icon={<CheckCircle2 className="w-6 h-6" />}
            trend={3}
            trendLabel="今日新增"
            accentColor="#00E676"
          />
          <StatCard
            title="待结算收益"
            value={`¥${currentExecutor.frozenBalance.toFixed(2)}`}
            icon={<Zap className="w-6 h-6" />}
            subtitle="审核中"
            accentColor="#FFB800"
          />
          <StatCard
            title="争议中"
            value={disputedCount}
            icon={<AlertTriangle className="w-6 h-6" />}
            accentColor="#FF3D71"
          />
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-white">我的任务</h3>
              <p className="text-sm text-gray-500 mt-1">查看和管理您接取的所有任务</p>
            </div>
            <button onClick={() => navigate("/")} className="btn-primary flex items-center gap-2">
              去任务大厅
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2 mb-6">
            {[
              { key: "all", label: "全部", icon: ClipboardList, count: submissions.length },
              { key: "ongoing", label: "进行中", icon: Clock, count: ongoingCount },
              { key: "completed", label: "已完成", icon: CheckCircle2, count: completedCount },
              { key: "disputed", label: "争议中", icon: AlertTriangle, count: disputedCount },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                    isActive
                      ? "bg-cyber-cyan-500/15 text-cyber-cyan-400 border border-cyber-cyan-500/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  <span className={cn("px-1.5 py-0.5 text-xs rounded-full", isActive ? "bg-cyber-cyan-500/20" : "bg-white/5")}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {filteredSubmissions.map((submission) => {
              const status = statusConfig[submission.status];
              const task = tasks.find((t) => t.id === submission.taskId);
              const TypeIcon = submission.taskType === "media" ? Video : submission.taskType === "survey" ? FileText : Package;

              return (
                <div
                  key={submission.id}
                  className="glass-card-hover p-4 cursor-pointer flex items-center gap-4"
                  onClick={() => navigate(`/executor/task/${submission.taskId}`)}
                >
                  <div className="w-12 h-12 rounded-xl bg-deep-space-700 flex items-center justify-center flex-shrink-0">
                    <TypeIcon className="w-6 h-6 text-cyber-cyan-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-medium text-white truncate">{submission.taskTitle}</h4>
                      <span className={cn("tag", status.bgClass, status.color)}>{status.label}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      提交时间：{new Date(submission.submittedAt).toLocaleString("zh-CN")}
                    </p>
                    {submission.aiScore > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">AI评分：</span>
                        <div className="w-24 h-1.5 bg-deep-space-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              submission.aiScore >= 80 ? "bg-success-500" : submission.aiScore >= 60 ? "bg-warning-500" : "bg-danger-500"
                            )}
                            style={{ width: `${submission.aiScore}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            "text-xs font-mono",
                            submission.aiScore >= 80 ? "text-success-500" : submission.aiScore >= 60 ? "text-warning-500" : "text-danger-500"
                          )}
                        >
                          {submission.aiScore}分
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-display font-bold text-amber-gold-400">
                      ¥{submission.rewardAmount.toFixed(1)}
                    </p>
                    <ChevronRight className="w-5 h-5 text-gray-600 ml-auto mt-2" />
                  </div>
                </div>
              );
            })}

            {filteredSubmissions.length === 0 && (
              <div className="glass-card p-12 text-center">
                <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">暂无相关任务</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-medium text-white mb-4">账户安全与资质</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-success-500/5 border border-success-500/20 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success-500/10 flex items-center justify-center">
                <BadgeCheck className="w-6 h-6 text-success-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">实名认证</p>
                <p className="text-xs text-success-500 mt-0.5">已认证</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-cyber-cyan-500/5 border border-cyber-cyan-500/20 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyber-cyan-500/10 flex items-center justify-center">
                <Fingerprint className="w-6 h-6 text-cyber-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">设备指纹</p>
                <p className="text-xs text-cyber-cyan-400 mt-0.5">已验证</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-gold-500/5 border border-amber-gold-500/20 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-gold-500/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-amber-gold-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">信用等级</p>
                <p className="text-xs text-amber-gold-400 mt-0.5">优秀 ({currentExecutor.creditScore}分)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTaskById, currentExecutor } = useAppStore();
  const task = getTaskById(id || "");
  const [taskStep, setTaskStep] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);

  if (!task) {
    return (
      <MainLayout title="任务详情" subtitle="">
        <div className="glass-card p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-warning-500 mx-auto mb-4" />
          <p className="text-gray-400">任务不存在或已下架</p>
        </div>
      </MainLayout>
    );
  }

  const TypeIcon = task.type === "media" ? Video : task.type === "survey" ? FileText : Package;
  const typeLabel = task.type === "media" ? "媒体类" : task.type === "survey" ? "调研类" : "体验类";

  const steps =
    task.type === "media"
      ? ["阅读任务说明", "观看视频", "验证跳转", "完成提交"]
      : task.type === "survey"
      ? ["阅读任务说明", "填写问卷", "提交审核", "等待结果"]
      : ["阅读任务说明", "签收凭证OCR", "图文反馈", "提交审核"];

  const startTask = () => {
    setIsExecuting(true);
    setTaskStep(1);
  };

  const nextStep = () => {
    if (taskStep < steps.length - 1) {
      setTaskStep(taskStep + 1);
    }
  };

  return (
    <MainLayout title="任务详情" subtitle={typeLabel}>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="tag tag-cyan mb-3 inline-flex">
                  <TypeIcon className="w-3.5 h-3.5 mr-1.5" />
                  {typeLabel}
                </span>
                <h1 className="text-2xl font-display font-bold text-white mb-2">{task.title}</h1>
                <p className="text-gray-500">发布方：{task.enterpriseName}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-display font-bold text-amber-gold-400">
                  ¥{task.reward.toFixed(2)}
                </p>
                {task.reward > task.originalReward && (
                  <p className="text-sm text-success-400 mt-1 flex items-center gap-1 justify-end">
                    <Zap className="w-4 h-4" />
                    限时加价中
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-400 pb-4 border-b border-white/5">
              <span>预计 {task.estimatedTime} 分钟</span>
              <span>难度 {"★".repeat(task.difficulty)}{"☆".repeat(5 - task.difficulty)}</span>
              <span>剩余 {task.quota - task.completed} 个名额</span>
              <span>完成率 {(task.completionRate * 100).toFixed(0)}%</span>
            </div>

            <div className="py-4">
              <h3 className="text-white font-medium mb-3">任务描述</h3>
              <p className="text-gray-400 leading-relaxed">{task.description}</p>
            </div>

            {!isExecuting && (
              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <button onClick={startTask} className="btn-primary px-8 py-3 text-base flex-1">
                  立即开始任务
                </button>
                <button className="btn-secondary px-8 py-3">收藏任务</button>
              </div>
            )}
          </div>

          {isExecuting && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-white">执行进度</h3>
                <span className="text-sm text-gray-400">
                  步骤 {taskStep + 1} / {steps.length}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-8">
                {steps.map((step, idx) => (
                  <div key={step} className="flex-1 flex items-center">
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0",
                          idx < taskStep
                            ? "bg-success-500 text-deep-space-900"
                            : idx === taskStep
                            ? "bg-cyber-cyan-500 text-deep-space-900 animate-pulse"
                            : "bg-deep-space-700 text-gray-500"
                        )}
                      >
                        {idx < taskStep ? "✓" : idx + 1}
                      </div>
                      <span
                        className={cn(
                          "text-sm",
                          idx <= taskStep ? "text-white" : "text-gray-500"
                        )}
                      >
                        {step}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={cn(
                          "flex-1 h-0.5 mx-2",
                          idx < taskStep ? "bg-success-500" : "bg-deep-space-700"
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>

              {task.type === "media" && taskStep === 1 && (
                <div className="space-y-4">
                  <div className="aspect-video bg-deep-space-950 rounded-xl overflow-hidden relative border border-white/10">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <PlayCircle className="w-16 h-16 text-cyber-cyan-400 mx-auto mb-3 animate-pulse" />
                        <p className="text-gray-400">视频播放区域</p>
                        <p className="text-xs text-gray-600 mt-1">需观看满 {task.mediaConfig?.requiredDuration || 60} 秒</p>
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: "45%" }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">已观看 27秒 / 60秒</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="tag tag-cyan">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      防跳转检测已启用
                    </div>
                    <p className="text-xs text-gray-500">离开页面将重置计时</p>
                  </div>
                </div>
              )}

              {task.type === "survey" && taskStep === 1 && (
                <div className="space-y-6">
                  <div className="p-6 bg-deep-space-800/50 rounded-xl border border-white/5">
                    <p className="text-white font-medium mb-4">1. 您是否使用过智能家居产品？</p>
                    <div className="space-y-2">
                      {["是", "否"].map((opt) => (
                        <label
                          key={opt}
                          className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors border border-transparent hover:border-cyber-cyan-500/20"
                        >
                          <input type="radio" name="q1" className="accent-cyber-cyan-500" />
                          <span className="text-gray-300">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 text-center">第 1 题 / 共 5 题</p>
                </div>
              )}

              {task.type === "experience" && taskStep === 1 && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-white/10 rounded-xl p-10 text-center hover:border-cyber-cyan-500/30 transition-colors cursor-pointer">
                    <ScanLine className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">上传签收凭证</p>
                    <p className="text-sm text-gray-500 mb-4">系统将自动进行OCR识别验证</p>
                    <button className="btn-secondary flex items-center gap-2 mx-auto">
                      <Camera className="w-4 h-4" />
                      拍照上传
                    </button>
                  </div>
                  <div className="flex gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex-1 aspect-square rounded-lg bg-deep-space-800/50 border border-white/5 flex items-center justify-center">
                        <Image className="w-8 h-8 text-gray-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {taskStep === steps.length - 1 && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-success-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10 text-success-500" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">任务已提交</h3>
                  <p className="text-gray-500">AI正在审核中，预计 2 小时内出结果</p>
                </div>
              )}

              {taskStep < steps.length - 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-6">
                  <button
                    onClick={() => setTaskStep(Math.max(0, taskStep - 1))}
                    className="btn-secondary"
                  >
                    上一步
                  </button>
                  <button onClick={nextStep} className="btn-primary">
                    {taskStep === steps.length - 2 ? "提交任务" : "下一步"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-5">
            <h4 className="text-white font-medium mb-4">温馨提示</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                任务需真实完成，系统将进行AI审核
              </li>
              <li className="flex items-start gap-2">
                <Fingerprint className="w-4 h-4 text-cyber-cyan-400 mt-0.5 flex-shrink-0" />
                设备指纹与IP将用于去重检测
              </li>
              <li className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-amber-gold-400 mt-0.5 flex-shrink-0" />
                如有疑问可发起申诉，平台将仲裁
              </li>
            </ul>
          </div>

          <div className="glass-card p-5">
            <h4 className="text-white font-medium mb-4">执行记录</h4>
            <div className="space-y-3">
              {[
                { time: "10:30", action: "进入任务" },
                { time: "10:32", action: "开始执行" },
              ].map((record, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-gray-500 font-mono text-xs w-12">{record.time}</span>
                  <span className="text-gray-400">{record.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
