import { useNavigate } from "react-router-dom";
import { Package, ClipboardCheck, BarChart3, Sliders, ArrowRight } from "lucide-react";
import { useStore } from "@/store";

const modules = [
  {
    icon: Package,
    title: "供应商管理",
    description: "管理供应商准入、考核与评估",
    path: "/admin/suppliers",
    statKey: "suppliers" as const,
    statLabel: "家供应商",
  },
  {
    icon: ClipboardCheck,
    title: "审批管理",
    description: "预算审批流程与进度跟踪",
    path: "/admin/approval",
    statKey: "budgets" as const,
    statLabel: "条审批",
  },
  {
    icon: BarChart3,
    title: "数据分析",
    description: "会员统计、漏斗分析与趋势报表",
    path: "/admin/analytics",
    statKey: "members" as const,
    statLabel: "名会员",
  },
  {
    icon: Sliders,
    title: "推荐配置",
    description: "福利推荐规则与个性化配置",
    path: "/admin/recommend",
    statKey: "recommendations" as const,
    statLabel: "条规则",
  },
];

export default function AdminOverview() {
  const navigate = useNavigate();
  const store = useStore();

  const getStatCount = (key: string) => {
    const data = store[key as keyof typeof store];
    if (Array.isArray(data)) return data.length;
    if (data && typeof data === "object") return 1;
    return 0;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 font-serif">后台运营</h1>
        <p className="text-gray-500 mt-1">管理供应商、审批流程、数据分析与推荐配置</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const count = getStatCount(mod.statKey);
          return (
            <div
              key={mod.path}
              onClick={() => navigate(mod.path)}
              className="card cursor-pointer group hover:border-union-red/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-union-red/10 text-union-red rounded-xl flex items-center justify-center shrink-0 group-hover:bg-union-red group-hover:text-white transition-colors duration-300">
                    <Icon size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 font-serif">
                      {mod.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{mod.description}</p>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-union-red font-serif">
                        {count}
                      </span>
                      <span className="text-sm text-gray-400">{mod.statLabel}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight
                  size={20}
                  className="text-gray-300 group-hover:text-union-red group-hover:translate-x-1 transition-all duration-300 mt-1 shrink-0"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
