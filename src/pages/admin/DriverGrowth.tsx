import { useEffect, useState } from "react";
import {
  Trophy,
  Star,
  TrendingUp,
  Truck,
  Award,
  Gift,
  Search,
  Filter,
  ChevronDown,
  Crown,
  Medal,
  Gem,
  Shield,
  Zap,
  Wallet,
  Calendar,
  Users,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  BarChart3,
} from "lucide-react";
import { apiClient } from "@/api/client";

export default function DriverGrowth() {
  const [growthConfig, setGrowthConfig] = useState<any>(null);
  const [topDrivers, setTopDrivers] = useState<any[]>([]);
  const [exchangeRecords, setExchangeRecords] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get<any>("/driver/growth-config").then(setGrowthConfig);
    setTopDrivers([
      { id: "1", name: "张师傅", plate: "沪A·88888", level: 5, points: 5680, orders: 428, score: 99.2 },
      { id: "2", name: "李师傅", plate: "沪B·66666", level: 5, points: 5120, orders: 395, score: 98.8 },
      { id: "3", name: "王师傅", plate: "沪C·99999", level: 4, points: 4580, orders: 362, score: 98.5 },
      { id: "4", name: "赵师傅", plate: "沪D·33333", level: 4, points: 3890, orders: 318, score: 97.8 },
      { id: "5", name: "钱师傅", plate: "沪E·55555", level: 4, points: 3450, orders: 286, score: 97.2 },
    ]);
    setExchangeRecords([
      { id: "1", driver: "张师傅", item: "ETC充值 ¥200", points: 2000, time: "2024-01-15 14:30", status: "success" },
      { id: "2", driver: "李师傅", item: "中石化加油卡 ¥500", points: 4500, time: "2024-01-15 11:20", status: "success" },
      { id: "3", driver: "王师傅", item: "车辆保养套餐", points: 3000, time: "2024-01-14 16:45", status: "processing" },
      { id: "4", driver: "赵师傅", item: "ETC充值 ¥100", points: 1000, time: "2024-01-14 09:15", status: "success" },
    ]);
  }, []);

  const levelIcons: Record<number, any> = {
    1: Star,
    2: Shield,
    3: Award,
    4: Medal,
    5: Crown,
  };

  const levelColors: Record<number, string> = {
    1: "from-slate-400 to-slate-500",
    2: "from-green-400 to-emerald-500",
    3: "from-blue-400 to-indigo-500",
    4: "from-purple-400 to-violet-500",
    5: "from-yellow-400 to-amber-500",
  };

  const levelNames: Record<number, string> = {
    1: "普通司机",
    2: "铜牌司机",
    3: "银牌司机",
    4: "金牌司机",
    5: "钻石司机",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">司机成长体系</h1>
          <p className="text-slate-500 text-sm mt-1">管理司机等级、安全积分与权益兑换</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">
            <Gift className="w-4 h-4" />
            兑换商品管理
          </button>
          <button className="btn-primary">
            <Trophy className="w-4 h-4" />
            等级规则配置
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "认证司机数", value: "2,856", icon: Users, gradient: "from-primary-500 to-orange-600", trend: "+86" },
          { label: "本月新增积分", value: "186,520", icon: Star, gradient: "from-blue-500 to-indigo-600", trend: "+12.5%" },
          { label: "本月兑换数", value: "328笔", icon: Gift, gradient: "from-purple-500 to-violet-600", trend: "+24" },
          { label: "钻石司机", value: "42人", icon: Crown, gradient: "from-amber-500 to-yellow-600", trend: "+5" },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`stat-card bg-gradient-to-br ${stat.gradient}`} style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{stat.trend}</span>
                </div>
                <p className="text-3xl font-bold font-display">{stat.value}</p>
                <p className="text-white/70 text-sm mt-1">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">司机等级体系</h3>
          <BarChart3 className="w-5 h-5 text-primary-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {growthConfig?.levels?.map((level: any, idx: number) => {
            const LevelIcon = levelIcons[idx + 1] || Star;
            return (
              <div
                key={idx}
                className={`relative p-5 rounded-2xl bg-gradient-to-br ${levelColors[idx + 1]} text-white overflow-hidden`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full" />
                <div className="absolute -right-10 bottom-0 w-32 h-16 bg-white/5 rounded-full" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                    <LevelIcon className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-white/70">Lv.{level.level}</p>
                  <p className="text-xl font-bold font-display mt-0.5">{levelNames[idx + 1]}</p>
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <p className="text-xs text-white/70">最低积分</p>
                    <p className="text-lg font-bold">{level.minPoints.toLocaleString()}</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-white/70">平台占比</p>
                    <p className="text-lg font-bold">{level.percentage || "8.5%"}</p>
                  </div>
                </div>
              </div>
            );
          }) || [1, 2, 3, 4, 5].map((lv) => {
            const LevelIcon = levelIcons[lv];
            const minPoints = [0, 1000, 2000, 3000, 5000][lv - 1];
            return (
              <div key={lv} className={`relative p-5 rounded-2xl bg-gradient-to-br ${levelColors[lv]} text-white overflow-hidden`}>
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                    <LevelIcon className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-white/70">Lv.{lv}</p>
                  <p className="text-xl font-bold mt-0.5">{levelNames[lv]}</p>
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <p className="text-xs text-white/70">最低积分</p>
                    <p className="text-lg font-bold">{minPoints.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-slate-800">司机积分排行榜</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="搜索司机..." className="input-field pl-9 py-2 text-sm w-44" />
              </div>
              <button className="btn-secondary py-2 text-sm">
                <Filter className="w-4 h-4" />
                筛选
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-3 text-sm font-semibold text-slate-700">排名</th>
                  <th className="text-left py-3 px-3 text-sm font-semibold text-slate-700">司机</th>
                  <th className="text-left py-3 px-3 text-sm font-semibold text-slate-700">等级</th>
                  <th className="text-left py-3 px-3 text-sm font-semibold text-slate-700">安全积分</th>
                  <th className="text-left py-3 px-3 text-sm font-semibold text-slate-700">完成订单</th>
                  <th className="text-left py-3 px-3 text-sm font-semibold text-slate-700">履约分</th>
                  <th className="text-left py-3 px-3 text-sm font-semibold text-slate-700">操作</th>
                </tr>
              </thead>
              <tbody>
                {topDrivers.map((driver, idx) => {
                  const LevelIcon = levelIcons[driver.level];
                  return (
                    <tr key={driver.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                          idx === 0 ? "bg-amber-100 text-amber-600" :
                          idx === 1 ? "bg-slate-200 text-slate-600" :
                          idx === 2 ? "bg-orange-100 text-orange-600" :
                          "bg-slate-100 text-slate-500"
                        }`}>
                          {idx + 1}
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${levelColors[driver.level]} flex items-center justify-center text-white font-semibold`}>
                            {driver.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{driver.name}</p>
                            <p className="text-xs text-slate-500">{driver.plate}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r ${levelColors[driver.level]} text-white text-xs font-medium`}>
                          <LevelIcon className="w-3 h-3" />
                          {levelNames[driver.level]}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                          {driver.points.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <span className="text-slate-700 flex items-center gap-1">
                          <Truck className="w-4 h-4 text-slate-400" />
                          {driver.orders}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <span className="font-medium text-green-600">{driver.score}</span>
                      </td>
                      <td className="py-4 px-3">
                        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-0.5">
                          详情 <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">积分兑换商品</h3>
            <Gift className="w-5 h-5 text-primary-500" />
          </div>
          <div className="space-y-3">
            {[
              { name: "ETC充值 ¥100", points: 1000, icon: Wallet, color: "bg-blue-50 text-blue-600" },
              { name: "ETC充值 ¥200", points: 2000, icon: Wallet, color: "bg-indigo-50 text-indigo-600" },
              { name: "加油卡 ¥500", points: 4500, icon: Zap, color: "bg-amber-50 text-amber-600" },
              { name: "车辆保养套餐", points: 3000, icon: Shield, color: "bg-green-50 text-green-600" },
              { name: "货物保险 ¥100万", points: 1500, icon: Shield, color: "bg-purple-50 text-purple-600" },
              { name: "司机体检套餐", points: 2500, icon: Calendar, color: "bg-rose-50 text-rose-600" },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500" />
                      {item.points.toLocaleString()} 积分
                    </p>
                  </div>
                  <button className="text-xs px-2.5 py-1.5 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors">
                    配置
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">最近兑换记录</h3>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">查看全部</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">司机</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">兑换商品</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">消耗积分</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">兑换时间</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">状态</th>
              </tr>
            </thead>
            <tbody>
              {exchangeRecords.map((record) => (
                <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                        {record.driver.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-800">{record.driver}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{record.item}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-800">{record.points.toLocaleString()}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{record.time}</td>
                  <td className="py-3.5 px-4">
                    <span className={`badge ${record.status === "success" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"} flex items-center gap-1 w-fit`}>
                      {record.status === "success" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {record.status === "success" ? "已完成" : "处理中"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
