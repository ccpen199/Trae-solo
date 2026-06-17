import { motion as m } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Coins,
  Zap,
  Repeat,
  Target,
  ThumbsUp,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Activity,
} from "lucide-react";
import { useAppStore } from "@/stores";
import { Card, CardContent, CountUp } from "@/components/ui";
import { cn } from "@/utils";

const levelNames = ["", "铜牌会员", "银牌会员", "金牌会员", "钻石会员"];

export default function EconomyHome() {
  const navigate = useNavigate();
  const { creditScore, swapItems, crowdfundingProjects } = useAppStore();

  const moduleCards = [
    {
      title: "旧物置换",
      description: "邻里闲置物品互换，物尽其用减少浪费",
      icon: Repeat,
      gradient: "from-orange-400 to-amber-500",
      bgColor: "bg-orange-50",
      path: "/economy/swap",
      count: swapItems.filter((i) => i.status === "available").length,
      label: "件可兑换",
    },
    {
      title: "众筹预售",
      description: "邻里互助众筹，共建共享美好社区",
      icon: Target,
      gradient: "from-emerald-400 to-green-500",
      bgColor: "bg-emerald-50",
      path: "/economy/crowdfunding",
      count: crowdfundingProjects.filter((p) => p.status === "ongoing").length,
      label: "个进行中",
    },
    {
      title: "能量兑换",
      description: "用邻里能量兑换社区便民服务",
      icon: Zap,
      gradient: "from-trust-400 to-blue-500",
      bgColor: "bg-trust-50",
      path: "/economy/exchange",
      count: 6,
      label: "项服务可兑",
    },
  ];

  const recentActivities = [
    { title: "李阿姨用儿童自行车兑换了150积分", time: "2小时前", icon: RefreshCw, color: "text-orange-500", bg: "bg-orange-100" },
    { title: "小区有机蔬菜直供项目已完成77%", time: "3小时前", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-100" },
    { title: "张先生成功兑换电饭煲，节省300积分", time: "5小时前", icon: RefreshCw, color: "text-orange-500", bg: "bg-orange-100" },
    { title: "王阿姨参与社区义诊获得80能量", time: "昨天", icon: Activity, color: "text-trust-500", bg: "bg-trust-100" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800 mb-2">邻里经济</h1>
          <p className="text-slate-500">激活社区资源，共建邻里互助美好家园</p>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-6 h-6" />
                    <span className="text-amber-100 font-medium">信用积分</span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <CountUp
                      end={creditScore.points}
                      className="text-4xl font-bold text-white"
                    />
                    <span className="text-amber-100">分</span>
                  </div>
                  <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    {levelNames[creditScore.level]} · Lv.{creditScore.level}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold text-white/30 mb-1">
                    {creditScore.level}
                  </div>
                  <div className="text-amber-100 text-sm">当前等级</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-green-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-6 h-6" />
                    <span className="text-emerald-100 font-medium">邻里能量</span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <CountUp
                      end={creditScore.energy}
                      className="text-4xl font-bold text-white"
                    />
                    <span className="text-emerald-100">能量</span>
                  </div>
                  <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    可兑换服务
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold text-white/30 mb-1">
                    ⚡
                  </div>
                  <div className="text-emerald-100 text-sm">能量充足</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-100 flex items-center justify-center">
                <Repeat className="w-6 h-6 text-orange-500" />
              </div>
              <CountUp
                end={creditScore.totalSwaps}
                className="text-2xl font-bold text-slate-800"
              />
              <p className="text-sm text-slate-500 mt-1">累计置换次数</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-500" />
              </div>
              <CountUp
                end={creditScore.totalContributions}
                className="text-2xl font-bold text-slate-800"
              />
              <p className="text-sm text-slate-500 mt-1">参与众筹项目</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-trust-100 flex items-center justify-center">
                <ThumbsUp className="w-6 h-6 text-trust-500" />
              </div>
              <CountUp
                end={Math.floor((creditScore.points + creditScore.energy) / 50)}
                className="text-2xl font-bold text-slate-800"
              />
              <p className="text-sm text-slate-500 mt-1">获得好评数</p>
            </CardContent>
          </Card>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-slate-800 mb-4">功能模块</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {moduleCards.map((card, index) => (
              <m.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -4 }}
                onClick={() => navigate(card.path)}
                className={cn(
                  "rounded-2xl shadow-card hover:shadow-card-hover cursor-pointer overflow-hidden",
                  card.bgColor
                )}
              >
                <div className="p-6">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br",
                      card.gradient
                    )}
                  >
                    <card.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">{card.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      <span className="font-semibold text-slate-700">{card.count}</span>{" "}
                      {card.label}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-medium text-primary-600">
                      进入
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-slate-800 mb-4">最新动态</h2>
          <Card>
            <CardContent className="p-0">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-4 p-5",
                    index !== recentActivities.length - 1 && "border-b border-slate-100"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      activity.bg
                    )}
                  >
                    <activity.icon className={cn("w-5 h-5", activity.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700">{activity.title}</p>
                    <p className="text-sm text-slate-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </m.div>
      </div>
    </div>
  );
}
