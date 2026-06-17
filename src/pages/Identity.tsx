import { useAppStore, roleLabels, type UserRole } from "@/store/useAppStore";
import { mockIdentityProviders } from "@/data/mock";
import StatusBadge from "@/components/StatusBadge";
import { Shield, Cloud, CreditCard, Smartphone, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { clsx } from "clsx";

const providerIcons: Record<string, React.ReactNode> = {
  govcloud: <Cloud className="w-5 h-5" />,
  unionpay: <CreditCard className="w-5 h-5" />,
  wechat: <Smartphone className="w-5 h-5" />,
  alipay: <Smartphone className="w-5 h-5" />,
};

const roles: { key: UserRole; label: string; desc: string; permissions: string[] }[] = [
  { key: "official", label: "公职人员", desc: "政务云统一认证", permissions: ["政务OA", "公文交换", "会议纪要", "任务督办"] },
  { key: "enterprise", label: "企业法人", desc: "电子营业执照+法人实名", permissions: ["营业执照调用", "政策精准推送", "补贴申领", "企业信用查询"] },
  { key: "citizen", label: "市民", desc: "实名认证+人脸核身", permissions: ["医保电子凭证", "社保查询", "高龄补贴", "新生儿免证办"] },
  { key: "tourist", label: "游客", desc: "手机号+第三方登录", permissions: ["多语种导览", "景区预约", "跨境支付", "投诉直连"] },
];

const roleColors: Record<UserRole, string> = {
  official: "border-primary-500 bg-primary-50",
  enterprise: "border-gold-500 bg-gold-50",
  citizen: "border-emerald-500 bg-emerald-50",
  tourist: "border-blue-500 bg-blue-50",
};

const roleIconColors: Record<UserRole, string> = {
  official: "bg-primary-900 text-white",
  enterprise: "bg-gold-600 text-white",
  citizen: "bg-emerald-600 text-white",
  tourist: "bg-blue-600 text-white",
};

export default function Identity() {
  const { currentRole, setCurrentRole } = useAppStore();

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold text-gray-900 mb-1">统一身份中枢</h2>
        <p className="text-sm text-gray-500">对接广西政务云、银联、微信、支付宝，实现一证通全城</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl bg-white border border-gray-100 p-6">
            <h3 className="font-display font-bold text-base text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600" />
              身份认证通道
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {mockIdentityProviders.map((provider) => (
                <div key={provider.provider} className="rounded-xl border border-gray-100 p-4 text-center hover-lift cursor-pointer">
                  <div className={clsx(
                    "w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center",
                    provider.status === "connected" ? "bg-emerald-50 text-emerald-600" : provider.status === "expired" ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-400"
                  )}>
                    {providerIcons[provider.provider]}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">{provider.label}</p>
                  <StatusBadge status={provider.status} />
                  <p className="text-[10px] text-gray-400 mt-2">最近认证：{provider.lastAuth}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl bg-white border border-gray-100 p-6">
            <h3 className="font-display font-bold text-base text-gray-900 mb-4">角色切换</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {roles.map((role) => (
                <button
                  key={role.key}
                  onClick={() => setCurrentRole(role.key)}
                  className={clsx(
                    "rounded-xl border-2 p-5 text-left transition-all duration-200 hover-lift",
                    currentRole === role.key ? roleColors[role.key] : "border-gray-100 bg-white"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold", roleIconColors[role.key])}>
                      {role.label[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{role.label}</h4>
                      <p className="text-xs text-gray-500">{role.desc}</p>
                    </div>
                    {currentRole === role.key && (
                      <CheckCircle2 className="w-5 h-5 ml-auto text-emerald-500" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.map((perm) => (
                      <span key={perm} className="text-[10px] px-2 py-0.5 rounded-full bg-white/60 text-gray-600 border border-gray-200/60">
                        {perm}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl gradient-primary p-6 text-white">
            <h3 className="font-display font-bold text-base mb-4">当前身份</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className={clsx("w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold", roleIconColors[currentRole])}>
                {roles.find((r) => r.key === currentRole)?.label[0]}
              </div>
              <div>
                <p className="font-bold text-lg">{roleLabels[currentRole]}</p>
                <p className="text-primary-200 text-xs">{roles.find((r) => r.key === currentRole)?.desc}</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {roles.find((r) => r.key === currentRole)?.permissions.map((p) => (
                <div key={p} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span className="text-primary-100">{p}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-primary-200">
              <AlertCircle className="w-3.5 h-3.5" />
              已连接 {mockIdentityProviders.filter((p) => p.status === "connected").length}/{mockIdentityProviders.length} 个认证源
            </div>
          </section>

          <section className="rounded-xl bg-white border border-gray-100 p-6">
            <h3 className="font-display font-bold text-base text-gray-900 mb-4">最近使用</h3>
            <div className="space-y-3">
              {["医保电子凭证", "景区预约", "社保查询"].map((item, i) => (
                <div key={item} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  <span className="text-sm text-gray-700 flex-1">{item}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
