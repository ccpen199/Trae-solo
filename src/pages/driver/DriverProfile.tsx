import {
  User,
  ArrowLeft,
  Settings,
  ChevronRight,
  Wallet,
  BadgeCheck,
  FileCheck2,
  ShieldCheck,
  Truck,
  CreditCard,
  Heart,
  HelpCircle,
  Phone,
  Bell,
  Globe,
  Moon,
  LogOut,
  Star,
  Award,
  Calendar,
  Crown,
  CheckCircle2,
  Clock,
  AlertCircle,
  Camera,
  Edit3,
  MessageSquare,
  Share2,
  Car,
  Navigation,
} from "lucide-react";
import { Avatar, Switch, Toast } from "antd-mobile";
import { useNavigate } from "react-router-dom";

const certItems = [
  {
    id: "idcard",
    name: "身份证",
    status: "approved" as const,
    icon: FileCheck2,
    progress: 100,
    tip: "已认证",
    expireDate: "2035-06-15",
  },
  {
    id: "license",
    name: "驾驶证",
    status: "approved" as const,
    icon: BadgeCheck,
    progress: 100,
    tip: "A2证 · 已认证",
    expireDate: "2028-03-20",
  },
  {
    id: "qualification",
    name: "从业资格证",
    status: "reviewing" as const,
    icon: ShieldCheck,
    progress: 60,
    tip: "审核中，预计24小时内完成",
  },
  {
    id: "vehicle",
    name: "车辆营运证",
    status: "approved" as const,
    icon: FileCheck2,
    progress: 100,
    tip: "已认证",
    expireDate: "2026-12-01",
  },
];

const menuGroups = [
  {
    title: "订单服务",
    items: [
      { icon: CreditCard, label: "我的订单", badge: 3, onClick: "/driver/orders" },
      { icon: Car, label: "我的行程", onClick: "/driver/track" },
      { icon: Wallet, label: "我的钱包", onClick: "/driver/wallet" },
      { icon: Heart, label: "我的收藏", onClick: null },
    ],
  },
  {
    title: "工具服务",
    items: [
      { icon: Navigation, label: "附近油站", onClick: "/driver/stations" },
      { icon: BadgeCheck, label: "积分商城", badge: 1280, onClick: null },
      { icon: Award, label: "新手任务", badge: 5, onClick: null },
      { icon: Crown, label: "会员中心", onClick: null },
    ],
  },
  {
    title: "系统设置",
    items: [
      { icon: Bell, label: "消息通知", switchable: true, defaultChecked: true, onClick: null },
      { icon: Moon, label: "深色模式", switchable: true, defaultChecked: false, onClick: null },
      { icon: Globe, label: "语言设置", value: "简体中文", onClick: null },
      { icon: Phone, label: "联系客服", onClick: null },
      { icon: HelpCircle, label: "帮助中心", onClick: null },
    ],
  },
];

const stats = [
  { label: "完成订单", value: 268 },
  { label: "总里程(万km)", value: "12.6" },
  { label: "好评率", value: "98.6%" },
  { label: "信用分", value: 96 },
];

export default function DriverProfile() {
  const navigate = useNavigate();

  const handleMenuClick = (onClick: string | null) => {
    if (onClick) navigate(onClick);
    else Toast.show({ content: "功能开发中" });
  };

  return (
    <div className="min-h-screen pb-6">
      <div className="gradient-primary pt-12 pb-28 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-28 left-8 w-4 h-4 rounded-full bg-white/10 animate-float" />
        <div className="absolute top-20 right-32 w-3 h-3 rounded-full bg-white/10 animate-float" style={{ animationDelay: "0.5s" }} />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"
            >
              <ArrowLeft size={22} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">个人中心</h1>
            <button
              onClick={() => Toast.show({ content: "设置页面开发中" })}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"
            >
              <Settings size={20} className="text-white" />
            </button>
          </div>

          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              <Avatar
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"
                style={{ "--size": "72px", border: "3px solid rgba(255,255,255,0.6)" }}
              />
              <button
                onClick={() => Toast.show({ content: "更换头像" })}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center"
              >
                <Camera size={14} className="text-primary-500" />
              </button>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white">张师傅</h2>
                <BadgeCheck size={18} className="text-yellow-300" />
                <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur text-[10px] text-white flex items-center gap-0.5">
                  <Crown size={12} />
                  金牌司机
                </span>
              </div>
              <div className="text-white/80 text-sm mb-2 flex items-center gap-2">
                <span>ID: DR888866</span>
                <span className="w-px h-3 bg-white/30" />
                <span className="flex items-center gap-0.5">
                  <Star size={12} className="text-yellow-300 fill-yellow-300" />
                  4.9
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => Toast.show({ content: "编辑资料" })}
                  className="px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white text-xs flex items-center gap-1"
                >
                  <Edit3 size={12} />
                  编辑
                </button>
                <button
                  onClick={() => Toast.show({ content: "分享个人主页" })}
                  className="px-3 py-1 rounded-full bg-white text-primary-500 text-xs font-medium flex items-center gap-1"
                >
                  <Share2 size={12} />
                  分享
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 grid grid-cols-4 gap-2">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-xl font-bold gradient-money">{stat.value}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-20 relative z-20 space-y-4">
        <div className="glass-card rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary-500" />
              三证认证
            </h3>
            <button className="text-xs text-primary-500 font-medium flex items-center gap-1">
              查看详情
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-4">
            {certItems.map((cert, idx) => {
              const CertIcon = cert.icon;
              const isApproved = cert.status === "approved";
              const isReviewing = cert.status === "reviewing";
              return (
                <div key={cert.id} className="animate-slide-up" style={{ animationDelay: `${idx * 80}ms` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isApproved
                          ? "bg-green-50 text-green-600"
                          : isReviewing
                          ? "bg-yellow-50 text-yellow-600"
                          : "bg-red-50 text-red-500"
                      }`}>
                        <CertIcon size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm text-gray-800">{cert.name}</span>
                          {isApproved ? (
                            <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600">
                              <CheckCircle2 size={10} />
                              已认证
                            </span>
                          ) : isReviewing ? (
                            <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-50 text-yellow-600">
                              <Clock size={10} />
                              审核中
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">
                              <AlertCircle size={10} />
                              待提交
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{cert.tip}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {isApproved && cert.expireDate && (
                        <div className="text-[10px] text-gray-400">
                          有效期至 <span className="text-gray-600">{cert.expireDate}</span>
                        </div>
                      )}
                      {isReviewing && (
                        <div className="text-[10px] text-yellow-600 font-medium">{cert.progress}%</div>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden ml-10">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isApproved
                          ? "bg-gradient-to-r from-green-400 to-emerald-500"
                          : isReviewing
                          ? "bg-gradient-to-r from-yellow-400 to-orange-400"
                          : "bg-gray-300"
                      }`}
                      style={{ width: `${cert.progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Truck size={18} className="text-primary-500" />
              车辆信息
            </h3>
            <button
              onClick={() => Toast.show({ content: "管理车辆" })}
              className="text-xs text-primary-500 font-medium flex items-center gap-1"
            >
              管理
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 p-5 relative">
            <div className="absolute top-2 right-4 text-[80px] font-black text-white/5 leading-none">T</div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] text-gray-400 mb-0.5">大型汽车号牌</div>
                  <div className="flex items-center gap-1">
                    <div className="px-2 py-1 rounded bg-blue-600 text-white text-[10px] font-bold">沪A</div>
                    <div className="px-3 py-1 bg-white rounded text-gray-800 text-lg font-black tracking-wider">
                      ·88888
                    </div>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center">
                  <Truck size={28} className="text-white/80" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                <div>
                  <div className="text-[10px] text-gray-400 mb-0.5">车辆类型</div>
                  <div className="text-sm text-white font-medium">重型厢式货车</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 mb-0.5">核载重量</div>
                  <div className="text-sm text-white font-medium">32吨</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 mb-0.5">车身长度</div>
                  <div className="text-sm text-white font-medium">13米</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 mb-0.5">年检有效期</div>
                  <div className="text-sm text-white font-medium">2025-06</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { icon: Car, label: "车辆信息" },
              { icon: FileCheck2, label: "证件管理" },
              { icon: ShieldCheck, label: "保险记录" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={i}
                  onClick={() => Toast.show({ content: `${item.label}功能开发中` })}
                  className="flex flex-col items-center py-3 rounded-xl active:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1.5">
                    <Icon size={18} className="text-gray-600" />
                  </div>
                  <span className="text-xs text-gray-700 font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {menuGroups.map((group, gIdx) => (
          <div key={gIdx} className="glass-card rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 pt-4 pb-2">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <span className="w-1 h-4 bg-primary-500 rounded-full" />
                {group.title}
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {group.items.map((item, iIdx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={iIdx}
                    onClick={() => !item.switchable && handleMenuClick(item.onClick)}
                    className="w-full flex items-center gap-3 px-5 py-4 active:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-50 to-orange-50 flex items-center justify-center">
                      <Icon size={18} className="text-primary-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-sm text-gray-800">{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-500 text-[10px] font-medium">
                        {item.badge}
                      </span>
                    )}
                    {item.value && (
                      <span className="text-xs text-gray-400">{item.value}</span>
                    )}
                    {item.switchable && (
                      <Switch
                        defaultChecked={item.defaultChecked}
                        onChange={(checked) => {
                          void Toast.show({ content: `${item.label}已${checked ? "开启" : "关闭"}` });
                        }}
                      />
                    )}
                    {!item.switchable && (
                      <ChevronRight size={18} className="text-gray-300" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="glass-card rounded-2xl shadow-card overflow-hidden">
          <button
            onClick={() =>
              Toast.show({
                icon: "fail",
                content: "确认退出登录吗？",
              })
            }
            className="w-full flex items-center justify-center gap-2 px-5 py-4 text-red-500 active:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium">退出登录</span>
          </button>
        </div>

        <div className="text-center py-4">
          <div className="text-[11px] text-gray-400 flex items-center justify-center gap-1">
            <Calendar size={11} />
            注册时间: 2023-01-15 · 版本 v2.5.1
          </div>
        </div>
      </div>
    </div>
  );
}
