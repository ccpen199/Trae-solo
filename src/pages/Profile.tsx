import {
  User,
  Shield,
  CreditCard,
  ClipboardList,
  Settings,
  Bell,
  ChevronRight,
  Phone,
  IdCard,
  Star,
  LogOut,
  FileCheck,
  Clock,
  Award,
  HeartHandshake,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";
import { mockUser, mockCases, mockCertificates } from "@/data/mockData";

export default function Profile() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user) || mockUser;
  const clearUser = useAppStore((s) => s.clearUser);

  const authLevelConfig = {
    L1: { text: "L1 基础认证", color: "bg-gray-100 text-gray-600", description: "手机号验证" },
    L2: { text: "L2 实名认证", color: "bg-warning-100 text-warning-700", description: "身份证核验" },
    L3: { text: "L3 实人认证", color: "bg-success-100 text-success-700", description: "人脸+公安库核验" },
  };

  const menuGroups = [
    {
      title: "我的服务",
      items: [
        { icon: ClipboardList, label: "我的办件", value: `${mockCases.length}件`, path: "/cases" },
        { icon: CreditCard, label: "电子证照", value: `${mockCertificates.length}张`, path: "/certificates" },
        { icon: Star, label: "我的收藏", value: "12项", path: "#" },
        { icon: FileCheck, label: "我的预约", value: "3个待办", path: "#" },
      ],
    },
    {
      title: "账户安全",
      items: [
        { icon: Shield, label: "认证等级", value: authLevelConfig[user.authLevel].text, path: "#" },
        { icon: Phone, label: "绑定手机", value: user.phoneMasked, path: "#" },
        { icon: IdCard, label: "实名认证", value: "已认证", path: "#" },
        { icon: Bell, label: "消息通知", value: "5条未读", path: "#" },
      ],
    },
    {
      title: "系统设置",
      items: [
        { icon: Settings, label: "账户设置", path: "#" },
        { icon: HeartHandshake, label: "意见反馈", path: "#" },
        { icon: Award, label: "关于我们", path: "#" },
      ],
    },
  ];

  const handleLogout = () => {
    clearUser();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-gov-600 to-gov-800 rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-20 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center ring-4 ring-white/20">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{user.realName}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${authLevelConfig[user.authLevel].color}`}
                >
                  {authLevelConfig[user.authLevel].text}
                </span>
              </div>
              <div className="text-white/70 text-sm space-y-1">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <IdCard className="w-3.5 h-3.5" />
                    {user.idCardMasked}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {user.phoneMasked}
                  </span>
                </div>
                <div className="text-xs text-white/50">{authLevelConfig[user.authLevel].description}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 backdrop-blur px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "办件总数", value: mockCases.length, icon: ClipboardList, color: "from-gov-500 to-gov-700" },
            {
              label: "已完成",
              value: mockCases.filter((c) => c.status === "completed" || c.status === "approved").length,
              icon: FileCheck,
              color: "from-success-500 to-emerald-600",
            },
            {
              label: "办理中",
              value: mockCases.filter((c) => c.status === "processing" || c.status === "submitted").length,
              icon: Clock,
              color: "from-warning-500 to-amber-600",
            },
            { label: "电子证照", value: mockCertificates.length, icon: CreditCard, color: "from-violet-500 to-purple-600" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="card p-4 flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          {menuGroups.map((group) => (
            <div key={group.title} className="card overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">{group.title}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => item.path !== "#" && navigate(item.path)}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gov-50 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-gov-600" />
                      </div>
                      <span className="flex-1 font-medium text-gray-900">{item.label}</span>
                      {"value" in item && (
                        <span className="text-sm text-gray-500">{item.value}</span>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
