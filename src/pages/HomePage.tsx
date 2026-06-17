import { useState, useEffect } from "react";
import { MainLayout } from "@/components/Layout";
import { TaskCard, taskTypeConfig } from "@/components/TaskCard";
import { StatCard } from "@/components/StatCard";
import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from "react-router-dom";
import {
  Video,
  FileText,
  Package,
  Users,
  Wallet,
  Target,
  Sparkles,
  Search,
  SlidersHorizontal,
  ArrowRight,
  ChevronRight,
  Zap,
  Filter,
} from "lucide-react";
import type { TaskType } from "@/types";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const navigate = useNavigate();
  const { platformStats, tasks, taskFilter, setTaskFilter, getFilteredTasks } =
    useAppStore();
  const [selectedType, setSelectedType] = useState<TaskType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [earningsTicker, setEarningsTicker] = useState<
    { id: string; user: string; amount: number; task: string }[]
  >([]);

  const typeLabelMap: Record<TaskType | "all", string> = {
    all: "全部任务",
    media: "媒体类任务",
    survey: "调研类任务",
    experience: "体验类任务",
  };

  useEffect(() => {
    setTaskFilter({ search: searchQuery, sortBy: sortBy as typeof taskFilter.sortBy });
  }, [searchQuery, sortBy, setTaskFilter]);

  useEffect(() => {
    if (selectedType !== "all") {
      setTaskFilter({ type: selectedType });
    } else {
      setTaskFilter({ type: undefined });
    }
  }, [selectedType, setTaskFilter]);

  useEffect(() => {
    const tickerItems = tasks
      .slice(0, 5)
      .map((t, i) => ({
        id: `ticker-${i}`,
        user: ["陈晓峰", "李梦雨", "王浩然", "张嘉怡", "刘子轩"][i],
        amount: t.reward,
        task: t.title,
      }));
    setEarningsTicker([...tickerItems, ...tickerItems]);
  }, [tasks]);

  const filteredTasks = getFilteredTasks();

  const categories = [
    { type: "media" as TaskType, count: 156, label: "媒体类任务" },
    { type: "survey" as TaskType, count: 89, label: "调研类任务" },
    { type: "experience" as TaskType, count: 42, label: "体验类任务" },
  ];

  return (
    <MainLayout title="任务大厅" subtitle="发现优质任务，随时随地赚取收益">
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-cyber-cyan-500/10 via-transparent to-amber-gold-500/10 border border-cyber-cyan-500/20 rounded-xl overflow-hidden">
          <div className="flex items-center gap-4 px-6 py-2.5">
            <span className="tag tag-green flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              实时收益
            </span>
            <div className="overflow-hidden flex-1">
              <div
                className="flex gap-12 whitespace-nowrap animate-marquee"
                style={{ animationDuration: "25s" }}
              >
                {earningsTicker.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400">{item.user}</span>
                    <span className="text-success-400 font-medium">
                      +¥{item.amount.toFixed(2)}
                    </span>
                    <span className="text-gray-600">|</span>
                    <span className="text-gray-500 truncate max-w-xs">
                      完成任务：{item.task}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <StatCard
            title="累计发放赏金"
            value={`¥${(platformStats.totalRewardsDistributed / 10000).toFixed(1)}万`}
            icon={<Wallet className="w-6 h-6" />}
            trend={12.5}
            trendLabel="较上周"
            accentColor="#FFB800"
          />
          <StatCard
            title="在线任务数"
            value={platformStats.totalTasks}
            icon={<Target className="w-6 h-6" />}
            trend={8.3}
            trendLabel="较昨日"
            accentColor="#00F0FF"
          />
          <StatCard
            title="注册用户数"
            value={`${(platformStats.totalUsers / 10000).toFixed(1)}万`}
            icon={<Users className="w-6 h-6" />}
            trend={5.7}
            trendLabel="本月新增"
            accentColor="#00E676"
          />
          <StatCard
            title="平均完成率"
            value={`${(platformStats.avgCompletionRate * 100).toFixed(1)}%`}
            icon={<Zap className="w-6 h-6" />}
            trend={-2.1}
            trendLabel="近7日"
            accentColor="#FF9100"
          />
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-deep-space-800 via-deep-space-900 to-deep-space-950 border border-white/10 p-10">
          <div className="absolute inset-0 grid-pattern opacity-50" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyber-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-gold-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyber-cyan-500/10 border border-cyber-cyan-500/20 text-cyber-cyan-400 text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              AI 驱动的智能众包平台
            </div>

            <h1 className="text-4xl font-display font-bold text-white mb-4 leading-tight">
              连接企业与人才的
              <span className="bg-gradient-to-r from-cyber-cyan-400 to-cyber-cyan-600 bg-clip-text text-transparent">
                轻量级众包
              </span>
              平台
            </h1>

            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
              媒体推广、市场调研、产品体验，三大任务类型一站式解决。
              AI智能风控确保任务质量，动态定价让每一分预算都物超所值。
            </p>

            <div className="flex items-center gap-4">
              <button className="btn-primary px-8 py-3 text-base flex items-center gap-2">
                立即开始接单
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate("/enterprise?tab=templates&prefill=survey")}
                className="btn-secondary px-8 py-3 text-base"
              >
                企业发布任务
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-semibold text-white">
              任务分类
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {categories.map((cat) => {
              const config = taskTypeConfig[cat.type];
              const Icon = config.icon;
              const isSelected = selectedType === cat.type;
              return (
                <div
                  key={cat.type}
                  onClick={() => setSelectedType(isSelected ? "all" : cat.type)}
                  className={cn(
                    "glass-card-hover p-6 cursor-pointer relative overflow-hidden",
                    isSelected && "border-cyber-cyan-500/50 shadow-glow-cyan"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20",
                      cat.type === "media" && "bg-cyber-cyan-500",
                      cat.type === "survey" && "bg-purple-500",
                      cat.type === "experience" && "bg-amber-gold-500"
                    )}
                  />
                  <div className="relative">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center mb-4",
                        config.bgClass
                      )}
                    >
                      <Icon className={cn("w-7 h-7", config.color)} />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-1">
                      {config.label}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">{cat.label}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-display font-bold text-white">
                        {cat.count}
                        <span className="text-sm font-normal text-gray-500 ml-1">
                          个进行中
                        </span>
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-display font-semibold text-white flex items-center gap-3">
                {selectedType !== "all" && <Filter className="w-5 h-5 text-cyber-cyan-400" />}
                {typeLabelMap[selectedType]}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  共 {filteredTasks.length} 个可接任务
                </span>
              </h2>
              {selectedType === "survey" && (
                <p className="text-sm text-gray-500 mt-1">
                  问卷逻辑校验、IP去重、设备指纹检测已启用，确保任务质量
                </p>
              )}
              {selectedType === "media" && (
                <p className="text-sm text-gray-500 mt-1">
                  视频时长验证、跳转检测、防作弊已启用
                </p>
              )}
              {selectedType === "experience" && (
                <p className="text-sm text-gray-500 mt-1">
                  OCR识别、图文上传、防刷题机制已启用
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="搜索任务..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-9 w-64 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-field w-32 text-sm cursor-pointer"
                >
                  <option value="newest">最新发布</option>
                  <option value="reward">赏金最高</option>
                  <option value="difficulty">简单优先</option>
                  <option value="completion">完成率高</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            {[
              { key: "all", label: "全部" },
              { key: "media", label: "媒体类", icon: Video },
              { key: "survey", label: "调研类", icon: FileText },
              { key: "experience", label: "体验类", icon: Package },
            ].map((item) => {
              const isActive = selectedType === item.key;
              const Icon = item.icon;
              const count = item.key === "all" 
                ? tasks.length 
                : tasks.filter((t) => t.type === item.key).length;
              return (
                <button
                  key={item.key}
                  onClick={() => setSelectedType(item.key as TaskType | "all")}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                    isActive
                      ? "bg-cyber-cyan-500/20 text-cyber-cyan-400 border border-cyber-cyan-500/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  )}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {item.label}
                  <span className="text-xs opacity-60">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-5">
            {filteredTasks.slice(0, 6).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>

          {filteredTasks.length === 0 && (
            <div className="glass-card p-12 text-center">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">没有找到符合条件的任务</p>
              <button
                onClick={() => setSelectedType("all")}
                className="btn-secondary mt-4 text-sm"
              >
                查看全部任务
              </button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
