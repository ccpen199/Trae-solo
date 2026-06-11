import {
  CheckCircle2,
  FileText,
  LogIn,
  Shield,
  Smartphone,
  User,
  UserPlus,
} from "lucide-react";
import Card from "../components/ui/Card";

const accountItems = [
  { label: "登录状态", value: "已登录", icon: LogIn },
  { label: "注册来源", value: "健康中台演示账号", icon: UserPlus },
  { label: "绑定设备", value: "3 台", icon: Smartphone },
  { label: "数据授权", value: "2 项有效", icon: Shield },
];

const records = [
  "近 30 天健康档案已生成",
  "HIS 预约信息已同步",
  "隐私脱敏与本地加密已启用",
];

export function Profile() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-deep-sea-50 glow-text">个人中心</h1>
        <p className="text-deep-sea-200/60 mt-1">管理登录注册信息、个人健康档案与数据授权。</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-vital-green-500/10 border border-vital-green-500/30 flex items-center justify-center">
            <User className="w-10 h-10 text-vital-green-400" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-deep-sea-50">张三</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-vital-green-500/15 px-3 py-1 text-xs text-vital-green-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                实名认证用户
              </span>
            </div>
            <p className="text-sm text-deep-sea-200/60 mt-2">手机号 138****8001 · 普通用户 · 账号安全正常</p>
          </div>
          <button className="px-5 py-2.5 rounded-lg bg-vital-green-500/20 text-vital-green-400 border border-vital-green-500/40 hover:bg-vital-green-500/30 transition-colors">
            编辑资料
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {accountItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="p-5">
              <Icon className="w-6 h-6 text-vital-green-400 mb-4" />
              <p className="text-sm text-deep-sea-200/60">{item.label}</p>
              <p className="text-xl font-semibold text-deep-sea-50 mt-1">{item.value}</p>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-vital-green-400" />
          <h2 className="text-lg font-semibold text-deep-sea-100">我的健康资料</h2>
        </div>
        <div className="space-y-3">
          {records.map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl bg-deep-sea-600/30 border border-vital-green-500/10 px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-vital-green-400" />
              <span className="text-sm text-deep-sea-100">{item}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
