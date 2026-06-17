import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import AnimatedNumber from "@/components/AnimatedNumber";
import { HeartPulse, HandCoins, Baby, ShieldCheck, CheckCircle2, Clock, ArrowRight, QrCode, Loader2, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";

type Tab = "medical" | "elderly" | "newborn";

export default function Livelihood() {
  const [tab, setTab] = useState<Tab>("medical");
  const [subsidies, setSubsidies] = useState<any[]>([]);
  const [insurance, setInsurance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([
      api.livelihood.subsidies(),
      api.livelihood.insurance(),
    ]).then(([s, ins]) => {
      if (!alive) return;
      setSubsidies(s);
      setInsurance(ins);
      setLoading(false);
    }).catch((e) => { setError(e.message || "加载失败"); setLoading(false); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const cleanup = loadData();
    return cleanup;
  }, [loadData]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold text-gray-900 mb-1">智惠民生</h2>
        <p className="text-sm text-gray-500">高龄补贴自动申领 · 新生儿出生免证办 · 医保社保查询</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
          <button onClick={loadData} className="text-xs text-red-600 hover:text-red-800 font-medium underline">重试</button>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {[
          { key: "medical" as Tab, label: "医保社保查询", icon: HeartPulse },
          { key: "elderly" as Tab, label: "高龄补贴申领", icon: HandCoins },
          { key: "newborn" as Tab, label: "新生儿免证办", icon: Baby },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
              tab === item.key ? "bg-emerald-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      {tab === "medical" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-white border border-gray-100 p-5">
                <p className="text-xs text-gray-500 mb-1">医保余额</p>
                {insurance ? (
                  <AnimatedNumber value={insurance.balance} prefix="¥" decimals={2} className="text-2xl font-bold text-emerald-700" />
                ) : <div className="h-7 bg-gray-200 rounded animate-pulse w-24" />}
                {insurance && <p className="text-[10px] text-gray-400 mt-1">月缴存 ¥{insurance.monthlyDeposit}</p>}
              </div>
              <div className="rounded-xl bg-white border border-gray-100 p-5">
                <p className="text-xs text-gray-500 mb-1">异地就医备案</p>
                {insurance ? <div className="flex items-center gap-2 mt-1"><StatusBadge status={insurance.crossRegionStatus} size="md" /></div> : <div className="h-5 bg-gray-200 rounded animate-pulse w-16" />}
                <p className="text-[10px] text-gray-400 mt-2">自动同步全国医保平台</p>
              </div>
              <div className="rounded-xl bg-white border border-gray-100 p-5">
                <p className="text-xs text-gray-500 mb-1">最近缴费</p>
                {insurance ? <p className="text-lg font-bold text-gray-900">{insurance.lastPayment}</p> : <div className="h-6 bg-gray-200 rounded animate-pulse w-20" />}
                <p className="text-[10px] text-gray-400 mt-1">缴费状态：正常</p>
              </div>
            </div>
            <div className="rounded-xl bg-white border border-gray-100 p-5">
              <h4 className="font-semibold text-sm text-gray-900 mb-4">异地就医记录</h4>
              <div className="space-y-3">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                    </div>
                  ))
                ) : insurance ? (
                  insurance.crossRegionRecords.map((record: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <HeartPulse className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-900">{record.hospital}</p>
                          <p className="text-xs text-gray-400">{record.date}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">-¥{record.amount.toLocaleString()}</span>
                    </div>
                  ))
                ) : null}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl gradient-primary p-6 text-white text-center">
              <QrCode className="w-16 h-16 mx-auto mb-3 opacity-90" />
              <h4 className="font-bold text-lg mb-1">医保电子凭证</h4>
              <p className="text-xs text-primary-200">全国通用 · 扫码支付</p>
              <button className="mt-4 px-6 py-2 rounded-lg bg-white/20 text-white text-sm font-medium hover:bg-white/30 transition-colors">
                出示凭证
              </button>
            </div>
            <div className="rounded-xl bg-white border border-gray-100 p-5">
              <h4 className="font-semibold text-sm text-gray-900 mb-3">快捷服务</h4>
              <div className="space-y-2">
                {["缴费记录查询", "门诊报销计算", "慢病资格认定"].map((item) => (
                  <button key={item} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <span className="text-sm text-gray-700">{item}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "elderly" && (
        <div className="space-y-6">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
                <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
                <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
              </div>
            ))
          ) : (
            subsidies.filter((s) => s.type === "elderly").map((subsidy) => (
              <div key={subsidy.id} className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl gradient-emerald flex items-center justify-center text-white">
                      <HandCoins className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">高龄补贴 · {subsidy.applicant}</h4>
                      <StatusBadge status={subsidy.status} size="md" />
                    </div>
                  </div>
                  {subsidy.amount && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">补贴金额</p>
                      <AnimatedNumber value={subsidy.amount} prefix="¥" className="text-2xl font-bold text-emerald-700" />
                    </div>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gray-100" />
                  <div className="space-y-4">
                    {subsidy.timeline.map((step: any, i: number) => (
                      <div key={i} className="flex items-start gap-4 relative">
                        <div className={clsx(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10",
                          step.status === "completed" ? "bg-emerald-100 text-emerald-600" : step.status === "current" ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"
                        )}>
                          {step.status === "completed" ? <CheckCircle2 className="w-4 h-4" /> : step.status === "current" ? <Clock className="w-4 h-4" /> : <span className="w-2 h-2 rounded-full bg-gray-300" />}
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center justify-between">
                            <p className={clsx("text-sm font-medium", step.status === "current" ? "text-emerald-700" : "text-gray-700")}>{step.step}</p>
                            {step.date && <span className="text-xs text-gray-400">{step.date}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {subsidy.status === "eligible" && (
                  <button className="mt-4 w-full py-3 rounded-lg gradient-emerald text-white font-medium text-sm hover-lift">
                    一键申领高龄补贴
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "newborn" && (
        <div className="space-y-6">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
                <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
              </div>
            ))
          ) : (
            subsidies.filter((s) => s.type === "newborn").map((subsidy) => (
              <div key={subsidy.id} className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                      <Baby className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">新生儿免证办 · {subsidy.applicant}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">出生即入户，免提交纸质材料</p>
                    </div>
                    <StatusBadge status={subsidy.status} size="md" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
                  {subsidy.timeline.slice(0, 4).map((step: any, i: number) => (
                    <div key={i} className={clsx(
                      "rounded-lg border p-4 text-center",
                      step.status === "completed" ? "border-emerald-200 bg-emerald-50/30" : step.status === "current" ? "border-emerald-400 bg-emerald-50" : "border-gray-100 bg-gray-50/50"
                    )}>
                      <div className={clsx(
                        "w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center",
                        step.status === "completed" ? "bg-emerald-100 text-emerald-600" : step.status === "current" ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"
                      )}>
                        {step.status === "completed" ? <CheckCircle2 className="w-4 h-4" /> : step.status === "current" ? <Clock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </div>
                      <p className="text-xs font-medium text-gray-700">{step.step}</p>
                      {step.date && <p className="text-[10px] text-gray-400 mt-1">{step.date}</p>}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-emerald-700">免证办理：出生登记、户口办理、医保参保、社保开户一次办结，无需提交任何纸质材料</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
