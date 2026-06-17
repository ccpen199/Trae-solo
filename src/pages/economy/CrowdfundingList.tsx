import { useState, useEffect } from "react";
import { motion as m, AnimatePresence } from "framer-motion";
import {
  Users,
  Clock,
  Target,
  TrendingUp,
  Gift,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAppStore } from "@/stores";
import { Card, CardContent, Button, Badge, ProgressBar, Modal } from "@/components/ui";
import { cn, formatCurrency, getTimeRemaining, generateId } from "@/utils";
import type { CrowdfundingProject, ExchangeRecord } from "@/types";

const statusMap = {
  ongoing: { label: "进行中", color: "bg-emerald-100 text-emerald-700", icon: TrendingUp },
  success: { label: "已成功", color: "bg-primary-100 text-primary-700", icon: CheckCircle },
  failed: { label: "已失败", color: "bg-slate-100 text-slate-600", icon: XCircle },
};

export default function CrowdfundingList() {
  const { crowdfundingProjects, creditScore, currentUser, addExchangeRecord } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<CrowdfundingProject | null>(null);
  const [selectedReward, setSelectedReward] = useState<number>(0);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, { days: number; hours: number; minutes: number }>>({});

  useEffect(() => {
    const updateTimers = () => {
      const newTimeRemaining: Record<string, { days: number; hours: number; minutes: number }> = {};
      crowdfundingProjects.forEach((project) => {
        newTimeRemaining[project.id] = getTimeRemaining(project.endTime);
      });
      setTimeRemaining(newTimeRemaining);
    };
    updateTimers();
    const interval = setInterval(updateTimers, 60000);
    return () => clearInterval(interval);
  }, [crowdfundingProjects]);

  const handleSupport = () => {
    if (!selectedProject || creditScore.points < selectedProject.rewards[selectedReward].amount) return;
    const record: ExchangeRecord = {
      id: generateId(),
      serviceId: selectedProject.id,
      serviceName: selectedProject.title,
      energyCost: selectedProject.rewards[selectedReward].amount,
      quantity: 1,
      ownerId: currentUser.ownerId || "",
      exchangeTime: new Date().toISOString(),
      status: "confirmed",
    };
    addExchangeRecord(record);
    setShowSupportModal(false);
    setSelectedProject(null);
    setSelectedReward(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <m.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">众筹预售</h1>
          <p className="text-slate-500">邻里互助众筹，共建共享美好社区生活</p>
        </m.div>

        <div className="space-y-6">
          {crowdfundingProjects.map((project, index) => {
            const statusInfo = statusMap[project.status];
            const progress = (project.currentAmount / project.targetAmount) * 100;
            const isExpanded = expandedId === project.id;
            const timeLeft = timeRemaining[project.id] || { days: 0, hours: 0, minutes: 0 };
            const StatusIcon = statusInfo.icon;

            return (
              <m.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                layout
              >
                <Card hoverable onClick={() => setExpandedId(isExpanded ? null : project.id)} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-72 h-48 md:h-auto relative flex-shrink-0">
                      <img src={project.images[0]} alt={project.title} className="w-full h-full object-cover" />
                      <div className="absolute top-4 left-4">
                        <Badge className={cn(statusInfo.color, "flex items-center gap-1")}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800 mb-2">{project.title}</h3>
                          <p className="text-sm text-slate-500 line-clamp-2">{project.description}</p>
                        </div>
                        <m.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        </m.div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-slate-500">筹集进度</span>
                          <span className="font-semibold text-emerald-600">{progress.toFixed(1)}%</span>
                        </div>
                        <ProgressBar
                          value={project.currentAmount}
                          max={project.targetAmount}
                          variant="success"
                          size="lg"
                          animatedStripes
                          className="mb-4"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
                            <Target className="w-4 h-4" />
                            <span className="text-lg font-bold">{formatCurrency(project.currentAmount)}</span>
                          </div>
                          <p className="text-xs text-slate-400">已筹 / {formatCurrency(project.targetAmount)}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-primary-600 mb-1">
                            <Users className="w-4 h-4" />
                            <span className="text-lg font-bold">{project.supporterCount}</span>
                          </div>
                          <p className="text-xs text-slate-400">支持人数</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                            <Clock className="w-4 h-4" />
                            <span className="text-lg font-bold">
                              {timeLeft.days > 0 ? `${timeLeft.days}天` : `${timeLeft.hours}时${timeLeft.minutes}分`}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">剩余时间</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <m.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-0 border-t border-slate-100">
                          <h4 className="text-sm font-semibold text-slate-700 my-4 flex items-center gap-2">
                            <Gift className="w-4 h-4 text-emerald-500" />
                            回报档位
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {project.rewards.map((reward, rewardIndex) => (
                              <m.div
                                key={rewardIndex}
                                whileHover={{ y: -2 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProject(project);
                                  setSelectedReward(rewardIndex);
                                  setShowSupportModal(true);
                                }}
                                className={cn(
                                  "p-4 rounded-xl border-2 cursor-pointer transition-all",
                                  project.status === "ongoing"
                                    ? "border-emerald-200 bg-emerald-50/50 hover:border-emerald-400 hover:bg-emerald-50"
                                    : "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
                                )}
                              >
                                <div className="text-lg font-bold text-emerald-600 mb-2">{formatCurrency(reward.amount)}</div>
                                <p className="text-sm text-slate-600">{reward.description}</p>
                                {project.status === "ongoing" && (
                                  <div className="mt-3 text-sm font-medium text-emerald-600">点击支持 →</div>
                                )}
                              </m.div>
                            ))}
                          </div>
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                </Card>
              </m.div>
            );
          })}
        </div>

        <Modal
          isOpen={showSupportModal}
          onClose={() => setShowSupportModal(false)}
          title="支持项目"
          size="md"
          footer={
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowSupportModal(false)}>取消</Button>
              <Button
                onClick={handleSupport}
                disabled={creditScore.points < (selectedProject?.rewards[selectedReward].amount || 0)}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {creditScore.points >= (selectedProject?.rewards[selectedReward].amount || 0)
                  ? `确认支持 ${formatCurrency(selectedProject?.rewards[selectedReward].amount || 0)}`
                  : "积分不足"}
              </Button>
            </div>
          }
        >
          {selectedProject && (
            <div>
              <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
                <img src={selectedProject.images[0]} alt={selectedProject.title} className="w-20 h-20 rounded-lg object-cover" />
                <div>
                  <h3 className="font-semibold text-slate-800">{selectedProject.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">发起人：{selectedProject.organizer}</p>
                </div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">选择回报档位</span>
                  <span className="font-bold text-emerald-600">
                    {formatCurrency(selectedProject.rewards[selectedReward].amount)}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{selectedProject.rewards[selectedReward].description}</p>
              </div>
              <div className="text-sm text-slate-500">
                当前积分：<span className="font-semibold text-slate-700">{creditScore.points}</span> 分
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
