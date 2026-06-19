import { useNavigate } from "react-router-dom";
import {
  User,
  Settings,
  MapPin,
  CreditCard,
  HeartHandshake,
  ChevronRight,
  Leaf,
  Package,
  Recycle,
  Trophy,
  Gift,
  CircleHelp,
  Bell,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Profile() {
  const navigate = useNavigate();

  const stats = [
    { label: "累计回收", value: "86.5kg", icon: Package, color: "from-eco-400 to-eco-600", bg: "bg-eco-100" },
    { label: "累计减碳", value: "128.6kg", icon: Leaf, color: "from-emerald-400 to-emerald-600", bg: "bg-emerald-100" },
    { label: "订单总数", value: "42", icon: Recycle, color: "from-teal-400 to-teal-600", bg: "bg-teal-100" },
    { label: "累计收益", value: "¥1,258", icon: CreditCard, color: "from-amber-400 to-amber-600", bg: "bg-amber-100" },
  ];

  const menuGroups = [
    {
      title: "我的服务",
      items: [
        { icon: MapPin, label: "地址管理", desc: "管理取件地址", badge: "3" },
        { icon: CreditCard, label: "收款账户", desc: "支付宝 / 微信 / 银行卡", badge: null },
        { icon: HeartHandshake, label: "公益捐赠", desc: "查看您的爱心流向", badge: "新", onClick: () => navigate("/user/donation") },
      ],
    },
    {
      title: "更多",
      items: [
        { icon: Bell, label: "消息通知", desc: "订单与活动提醒", badge: "2" },
        { icon: Trophy, label: "环保等级", desc: "环保达人 Lv.5", badge: null },
        { icon: Gift, label: "积分商城", desc: "1258 积分可兑换", badge: "热" },
        { icon: Shield, label: "隐私安全", desc: "数据加密保护", badge: null },
        { icon: CircleHelp, label: "帮助中心", desc: "常见问题解答", badge: null },
        { icon: Settings, label: "设置", desc: "账号与偏好设置", badge: null },
      ],
    },
  ];

  return (
    <div className="pb-8 animate-fade-in">
      <section className="relative px-4 pt-5 pb-16 bg-gradient-to-br from-eco-500 via-eco-600 to-emerald-700 overflow-hidden">
        <div className="absolute -top-12 -right-8 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute top-20 -left-10 w-36 h-36 bg-eco-300/20 rounded-full blur-2xl" />
        <div className="absolute bottom-0 right-16 w-24 h-24 bg-emerald-300/20 rounded-full blur-xl" />
        <div className="relative flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white to-eco-100 p-0.5 shadow-lg">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-eco-400 to-eco-600 flex items-center justify-center">
                <User className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow">
              5
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-white text-xl font-bold">低碳生活家</h2>
              <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-xs text-white font-medium flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-300" />
                环保达人
              </span>
            </div>
            <p className="text-eco-100 text-sm mt-1">已加入绿回收 238 天</p>
            <p className="text-white/70 text-xs mt-1.5">ID: 10086521</p>
          </div>
          <button className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/25 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </section>

      <div className="px-4 -mt-10 relative z-10">
        <div className="card p-4 grid grid-cols-4 gap-2">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="text-center">
              <div className={cn("w-10 h-10 mx-auto rounded-xl", bg, "flex items-center justify-center mb-2")}>
                <Icon className={cn("w-5 h-5 bg-gradient-to-br bg-clip-text", color)} style={{ color: "#059669" }} />
              </div>
              <p className="text-neutral-800 font-bold text-base">{value}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mt-5">
        <div className="card overflow-hidden p-0">
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-800 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  环保等级进度
                </p>
                <p className="text-xs text-amber-600/80 mt-0.5">距离 Lv.6 还需回收 21.4kg</p>
              </div>
              <span className="text-amber-600 font-bold">Lv.5</span>
            </div>
            <div className="mt-2.5 h-2 rounded-full bg-amber-200/60 overflow-hidden">
              <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-amber-600/70">
              <span>Lv.5</span>
              <span>72%</span>
              <span>Lv.6</span>
            </div>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <HeartHandshake className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <p className="font-semibold text-neutral-800 text-sm">我的公益捐赠</p>
                <p className="text-xs text-neutral-500 mt-0.5">累计捐赠 12 次，受益 3 所学校</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/user/donation")}
              className="text-eco-600 text-sm font-medium flex items-center gap-0.5"
            >
              查看 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {menuGroups.map((group) => (
        <div key={group.title} className="px-4 mt-5">
          <h3 className="text-xs font-semibold text-neutral-400 px-1 mb-2 tracking-wider">
            {group.title}
          </h3>
          <div className="card overflow-hidden p-0 divide-y divide-neutral-50">
            {group.items.map(({ icon: Icon, label, desc, badge, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 active:bg-neutral-100 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-eco-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-eco-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-neutral-800 text-sm">{label}</p>
                    {badge && (
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                          badge === "新" && "bg-rose-100 text-rose-600",
                          badge === "热" && "bg-orange-100 text-orange-600",
                          !isNaN(Number(badge)) && "bg-eco-100 text-eco-600"
                        )}
                      >
                        {badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5 truncate">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="px-4 mt-6">
        <button className="w-full btn-secondary text-sm text-neutral-500">
          退出登录
        </button>
        <p className="text-center text-xs text-neutral-300 mt-4">绿回收 v2.3.1</p>
      </div>
    </div>
  );
}
