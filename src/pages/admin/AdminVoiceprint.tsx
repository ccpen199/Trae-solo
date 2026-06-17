import { useState } from "react";
import {
  Cpu,
  Search,
  Filter,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Tag,
  Zap,
  ChevronRight,
  MoreVertical,
  Volume2,
  Database,
  TrendingUp,
  Loader2,
  Wand2,
} from "lucide-react";

type SampleStatus = "pending" | "auto-annotated" | "reviewed" | "rejected";
type ModelStatus = "training" | "completed" | "deployed";

interface VoiceprintSample {
  id: string;
  userName: string;
  audioUrl: string;
  petType: "dog" | "cat";
  status: SampleStatus;
  autoAnnotation: string | null;
  finalAnnotation: string | null;
  submittedAt: string;
}

interface ModelVersion {
  id: string;
  version: string;
  accuracy: number;
  trainingSamples: number;
  status: ModelStatus;
  createdAt: string;
}

const statusConfig: Record<
  SampleStatus,
  { label: string; bg: string; text: string; icon: typeof Clock }
> = {
  pending: {
    label: "待审",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    icon: Clock,
  },
  "auto-annotated": {
    label: "已标",
    bg: "bg-sky-500/15",
    text: "text-sky-400",
    icon: Tag,
  },
  reviewed: {
    label: "已审",
    bg: "bg-brand-mint/15",
    text: "text-brand-mint",
    icon: CheckCircle,
  },
  rejected: {
    label: "已拒绝",
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    icon: XCircle,
  },
};

const modelStatusConfig: Record<
  ModelStatus,
  { label: string; bg: string; text: string; icon: typeof Database }
> = {
  training: {
    label: "训练中",
    bg: "bg-sky-500/15",
    text: "text-sky-400",
    icon: Loader2,
  },
  completed: {
    label: "已完成",
    bg: "bg-brand-mint/15",
    text: "text-brand-mint",
    icon: CheckCircle,
  },
  deployed: {
    label: "已部署",
    bg: "bg-violet-500/15",
    text: "text-violet-400",
    icon: Zap,
  },
};

const mockSamples: VoiceprintSample[] = [
  {
    id: "s1",
    userName: "小白主人",
    audioUrl: "/audio/s1.wav",
    petType: "dog",
    status: "pending",
    autoAnnotation: null,
    finalAnnotation: null,
    submittedAt: "2026-06-15 14:30",
  },
  {
    id: "s2",
    userName: "咪咪主人",
    audioUrl: "/audio/s2.wav",
    petType: "cat",
    status: "auto-annotated",
    autoAnnotation: "喵喵叫 - 饥饿",
    finalAnnotation: null,
    submittedAt: "2026-06-15 12:15",
  },
  {
    id: "s3",
    userName: "豆豆主人",
    audioUrl: "/audio/s3.wav",
    petType: "dog",
    status: "reviewed",
    autoAnnotation: "汪汪叫 - 警戒",
    finalAnnotation: "汪汪叫 - 警戒/欢迎混合",
    submittedAt: "2026-06-14 18:00",
  },
  {
    id: "s4",
    userName: "橘子主人",
    audioUrl: "/audio/s4.wav",
    petType: "cat",
    status: "rejected",
    autoAnnotation: "呼噜声 - 满足",
    finalAnnotation: "噪音过大，无法识别",
    submittedAt: "2026-06-14 10:45",
  },
  {
    id: "s5",
    userName: "柴犬妈妈",
    audioUrl: "/audio/s5.wav",
    petType: "dog",
    status: "pending",
    autoAnnotation: null,
    finalAnnotation: null,
    submittedAt: "2026-06-14 09:20",
  },
  {
    id: "s6",
    userName: "英短家长",
    audioUrl: "/audio/s6.wav",
    petType: "cat",
    status: "auto-annotated",
    autoAnnotation: "哈气 - 愤怒",
    finalAnnotation: null,
    submittedAt: "2026-06-13 22:10",
  },
  {
    id: "s7",
    userName: "柯基爸爸",
    audioUrl: "/audio/s7.wav",
    petType: "dog",
    status: "reviewed",
    autoAnnotation: "呜呜叫 - 悲伤",
    finalAnnotation: "呜呜叫 - 乞求/撒娇",
    submittedAt: "2026-06-13 16:30",
  },
];

const mockModels: ModelVersion[] = [
  {
    id: "m1",
    version: "v2.3.1",
    accuracy: 0.924,
    trainingSamples: 15680,
    status: "deployed",
    createdAt: "2026-06-10 08:00",
  },
  {
    id: "m2",
    version: "v2.3.0",
    accuracy: 0.908,
    trainingSamples: 14200,
    status: "completed",
    createdAt: "2026-06-05 10:00",
  },
  {
    id: "m3",
    version: "v2.4.0-beta",
    accuracy: 0,
    trainingSamples: 18500,
    status: "training",
    createdAt: "2026-06-15 06:00",
  },
  {
    id: "m4",
    version: "v2.2.5",
    accuracy: 0.891,
    trainingSamples: 12800,
    status: "completed",
    createdAt: "2026-05-28 14:00",
  },
];

export default function AdminVoiceprint() {
  const [statusFilter, setStatusFilter] = useState<SampleStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSample, setSelectedSample] = useState<VoiceprintSample | null>(
    null,
  );
  const [fineTuneModalOpen, setFineTuneModalOpen] = useState(false);
  const [fineTuneDesc, setFineTuneDesc] = useState("");

  const filteredSamples = mockSamples.filter((s) => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (
      searchQuery &&
      !s.userName.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const stats = {
    pending: mockSamples.filter((s) => s.status === "pending").length,
    annotated: mockSamples.filter((s) => s.status === "auto-annotated").length,
    reviewed: mockSamples.filter((s) => s.status === "reviewed").length,
    rejected: mockSamples.filter((s) => s.status === "rejected").length,
  };

  return (
    <div className="min-h-screen text-gray-100">
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-mint/20 flex items-center justify-center">
            <Cpu className="w-6 h-6 text-brand-mint" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">声纹迭代中心</h1>
            <p className="text-sm text-gray-400">
              审核训练样本，管理模型版本，持续优化声纹识别精度
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8 animate-slide-up">
        {(
          [
            {
              key: "pending",
              label: "待审核",
              count: stats.pending,
              color: "amber",
            },
            {
              key: "annotated",
              label: "已自动标注",
              count: stats.annotated,
              color: "sky",
            },
            {
              key: "reviewed",
              label: "已通过审核",
              count: stats.reviewed,
              color: "mint",
            },
            {
              key: "rejected",
              label: "已拒绝",
              count: stats.rejected,
              color: "rose",
            },
          ] as const
        ).map((item) => (
          <div
            key={item.key}
            className="bg-gray-800/50 backdrop-blur rounded-2xl p-5 border border-gray-700/50 hover:border-gray-600 transition-all"
          >
            <p className="text-gray-400 text-sm mb-2">{item.label}</p>
            <div className="flex items-end justify-between">
              <span
                className={`text-3xl font-bold ${
                  item.color === "amber"
                    ? "text-amber-400"
                    : item.color === "sky"
                      ? "text-sky-400"
                      : item.color === "mint"
                        ? "text-brand-mint"
                        : "text-rose-400"
                }`}
              >
                {item.count}
              </span>
              <TrendingUp
                className={`w-4 h-4 ${
                  item.color === "mint" ? "text-brand-mint" : "text-gray-500"
                }`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 animate-slide-up stagger-1">
          <div className="p-5 border-b border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">样本审核列表</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFineTuneModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-mint to-brand-mint-light text-gray-900 font-medium hover:shadow-lg hover:shadow-brand-mint/20 transition-all"
                >
                  <Wand2 className="w-4 h-4" />
                  启动微调
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索提交者..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-brand-mint/50 transition-all"
                />
              </div>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-900/50 border border-gray-700">
                <FilterBtn
                  active={statusFilter === "all"}
                  onClick={() => setStatusFilter("all")}
                >
                  全部
                </FilterBtn>
                <FilterBtn
                  active={statusFilter === "pending"}
                  onClick={() => setStatusFilter("pending")}
                >
                  待审
                </FilterBtn>
                <FilterBtn
                  active={statusFilter === "auto-annotated"}
                  onClick={() => setStatusFilter("auto-annotated")}
                >
                  已标
                </FilterBtn>
                <FilterBtn
                  active={statusFilter === "reviewed"}
                  onClick={() => setStatusFilter("reviewed")}
                >
                  已审
                </FilterBtn>
                <FilterBtn
                  active={statusFilter === "rejected"}
                  onClick={() => setStatusFilter("rejected")}
                >
                  已拒
                </FilterBtn>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400 border-b border-gray-700/50">
                  <th className="px-5 py-3 font-medium">样本</th>
                  <th className="px-5 py-3 font-medium">宠物类型</th>
                  <th className="px-5 py-3 font-medium">自动标注</th>
                  <th className="px-5 py-3 font-medium">状态</th>
                  <th className="px-5 py-3 font-medium">提交时间</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filteredSamples.map((sample, idx) => {
                  const cfg = statusConfig[sample.status];
                  const Icon = cfg.icon;
                  return (
                    <tr
                      key={sample.id}
                      className={`border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors cursor-pointer animate-slide-up ${
                        selectedSample?.id === sample.id
                          ? "bg-brand-mint/5"
                          : ""
                      }`}
                      style={{ animationDelay: `${idx * 30}ms` }}
                      onClick={() => setSelectedSample(sample)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button className="w-9 h-9 rounded-xl bg-gray-700/50 flex items-center justify-center text-brand-mint hover:bg-brand-mint/20 transition-colors">
                            <Play className="w-4 h-4 fill-current" />
                          </button>
                          <div>
                            <p className="font-medium text-white">
                              {sample.userName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {sample.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                            sample.petType === "dog"
                              ? "bg-orange-500/15 text-orange-400"
                              : "bg-pink-500/15 text-pink-400"
                          }`}
                        >
                          {sample.petType === "dog" ? "🐕 犬类" : "🐱 猫类"}
                        </span>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        {sample.autoAnnotation ? (
                          <span className="text-sm text-gray-300 truncate block">
                            {sample.autoAnnotation}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
                        >
                          <Icon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">
                        {sample.submittedAt}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-gray-200 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6 animate-slide-up stagger-2">
          {selectedSample ? (
            <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-white">样本详情</h3>
                <button
                  onClick={() => setSelectedSample(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-gray-200"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-900/50 border border-gray-700/50">
                  <button className="w-12 h-12 rounded-xl bg-brand-mint/20 flex items-center justify-center text-brand-mint shrink-0 hover:bg-brand-mint/30 transition-colors">
                    <Volume2 className="w-5 h-5" />
                  </button>
                  <div className="flex-1">
                    <div className="h-1.5 rounded-full bg-gray-700 overflow-hidden mb-2">
                      <div className="h-full w-3/5 bg-gradient-to-r from-brand-mint to-brand-mint-light rounded-full" />
                    </div>
                    <p className="text-xs text-gray-400">
                      时长 3.2s · 点击播放
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoRow label="提交者" value={selectedSample.userName} />
                  <InfoRow
                    label="宠物类型"
                    value={selectedSample.petType === "dog" ? "犬类" : "猫类"}
                  />
                  <InfoRow label="提交时间" value={selectedSample.submittedAt} />
                  <InfoRow
                    label="状态"
                    value={statusConfig[selectedSample.status].label}
                  />
                </div>

                <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-700/50 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">自动标注结果</p>
                    <p className="text-sm text-gray-300">
                      {selectedSample.autoAnnotation || "暂无自动标注"}
                    </p>
                  </div>
                  {selectedSample.finalAnnotation && (
                    <div className="pt-3 border-t border-gray-700/50">
                      <p className="text-xs text-gray-500 mb-1">最终审核标注</p>
                      <p className="text-sm text-brand-mint">
                        {selectedSample.finalAnnotation}
                      </p>
                    </div>
                  )}
                </div>

                {(selectedSample.status === "pending" ||
                  selectedSample.status === "auto-annotated") && (
                  <div className="flex gap-2">
                    <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-mint/20 text-brand-mint font-medium hover:bg-brand-mint/30 transition-colors">
                      <CheckCircle className="w-4 h-4" />
                      通过
                    </button>
                    <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/15 text-rose-400 font-medium hover:bg-rose-500/25 transition-colors">
                      <XCircle className="w-4 h-4" />
                      拒绝
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-700/50 flex items-center justify-center">
                <Database className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-400 mb-1">选择左侧样本</p>
              <p className="text-sm text-gray-600">查看详细信息并审核</p>
            </div>
          )}

          <div className="bg-gray-800/50 backdrop-blur rounded-2xl border border-gray-700/50 p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">模型版本</h3>
              <span className="text-xs text-gray-500">
                共 {mockModels.length} 个版本
              </span>
            </div>
            <div className="space-y-3">
              {mockModels.map((model, idx) => {
                const cfg = modelStatusConfig[model.status];
                const Icon = cfg.icon;
                return (
                  <div
                    key={model.id}
                    className="p-4 rounded-xl bg-gray-900/50 border border-gray-700/50 hover:border-gray-600 transition-all animate-slide-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-mint/30 to-brand-orange/20 flex items-center justify-center">
                          <Cpu className="w-5 h-5 text-brand-mint" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {model.version}
                          </p>
                          <p className="text-xs text-gray-500">
                            {model.createdAt}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
                      >
                        {model.status === "training" && (
                          <Icon className="w-3 h-3 animate-spin" />
                        )}
                        {model.status !== "training" && (
                          <Icon className="w-3 h-3" />
                        )}
                        {cfg.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">准确率</p>
                        <p
                          className={`font-semibold ${
                            model.status === "training"
                              ? "text-gray-500"
                              : "text-brand-mint"
                          }`}
                        >
                          {model.status === "training"
                            ? "训练中..."
                            : `${(model.accuracy * 100).toFixed(1)}%`}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">训练样本</p>
                        <p className="font-semibold text-gray-200">
                          {model.trainingSamples.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {model.status !== "deployed" && model.status !== "training" && (
                      <button className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors">
                        部署此版本
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {fineTuneModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-brand-mint/20 flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-brand-mint" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">启动模型微调</h3>
                <p className="text-xs text-gray-400">
                  基于已审核样本训练新模型
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">基模型版本</span>
                  <span className="text-sm text-brand-mint font-medium">
                    v2.3.1
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">可用训练样本</span>
                  <span className="text-sm text-white font-medium">
                    {stats.reviewed} 条
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  微调说明（可选）
                </label>
                <textarea
                  value={fineTuneDesc}
                  onChange={(e) => setFineTuneDesc(e.target.value)}
                  rows={3}
                  placeholder="例如：加入新的猫类呼噜声样本..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-700 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-brand-mint/50 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setFineTuneModalOpen(false);
                  setFineTuneDesc("");
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-700 text-gray-200 font-medium hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setFineTuneModalOpen(false);
                  setFineTuneDesc("");
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-mint to-brand-mint-light text-gray-900 font-medium hover:shadow-lg hover:shadow-brand-mint/25 transition-all"
              >
                <Zap className="w-4 h-4" />
                确认启动
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        active
          ? "bg-brand-mint/20 text-brand-mint"
          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-gray-900/30">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-gray-200 font-medium truncate">{value}</p>
    </div>
  );
}
