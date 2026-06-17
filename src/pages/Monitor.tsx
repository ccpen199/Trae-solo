import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import AnimatedNumber from "@/components/AnimatedNumber";
import { Activity, TrendingUp, AlertTriangle, Clock, Building2, BarChart3, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from "recharts";
import { clsx } from "clsx";

export default function Monitor() {
  const [slaMetrics, setSlaMetrics] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [slaHistory, setSlaHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([
      api.monitor.sla(),
      api.monitor.policies(),
      api.monitor.slaHistory(),
    ]).then(([s, p, h]) => {
      if (!alive) return;
      setSlaMetrics(s);
      setPolicies(p);
      setSlaHistory(h);
      setLoading(false);
    }).catch((e) => { setError(e.message || "加载失败"); setLoading(false); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const cleanup = loadData();
    return cleanup;
  }, [loadData]);

  const healthyCount = slaMetrics.filter((m) => m.status === "healthy").length;
  const warningCount = slaMetrics.filter((m) => m.status === "warning").length;
  const criticalCount = slaMetrics.filter((m) => m.status === "critical").length;
  const avgCompliance = slaMetrics.length > 0
    ? (slaMetrics.reduce((s, m) => s + m.complianceRate, 0) / slaMetrics.length).toFixed(1)
    : "0.0";

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold text-gray-900 mb-1">运营监测中心</h2>
        <p className="text-sm text-gray-500">服务可用性监测 · 政策兑现追踪审计</p>
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-white border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-gray-500">正常服务</span>
          </div>
          <AnimatedNumber value={healthyCount} suffix="/8" className="text-2xl font-bold text-emerald-700" />
        </div>
        <div className="rounded-xl bg-white border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-gray-500">告警服务</span>
          </div>
          <AnimatedNumber value={warningCount} suffix="/8" className="text-2xl font-bold text-amber-600" />
        </div>
        <div className="rounded-xl bg-white border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500 alert-pulse" />
            <span className="text-xs text-gray-500">异常服务</span>
          </div>
          <AnimatedNumber value={criticalCount} suffix="/8" className="text-2xl font-bold text-red-600" />
        </div>
        <div className="rounded-xl bg-white border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            <span className="text-xs text-gray-500">SLA达标率</span>
          </div>
          <AnimatedNumber value={parseFloat(avgCompliance)} suffix="%" decimals={1} className="text-2xl font-bold text-primary-700" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 dark-glass-card rounded-xl p-5">
          <h3 className="font-display font-bold text-white text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            各厅局API响应时长趋势（今日）
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={slaHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} unit="ms" />
              <Tooltip contentStyle={{ backgroundColor: "#1a365d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#fff" }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#fff" }} />
              <Line type="monotone" dataKey="民政厅" stroke="#4db478" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="医保局" stroke="#60a5fa" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="交通厅" stroke="#a78bfa" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="文旅厅" stroke="#fbbf24" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="住建厅" stroke="#f87171" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-display font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-600" />
            服务状态总览
          </h3>
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50">
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-2 bg-gray-100 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))
            ) : (
              slaMetrics.map((metric) => (
                <div key={metric.api} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50">
                  <div className={clsx(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    metric.status === "healthy" ? "bg-emerald-500" : metric.status === "warning" ? "bg-amber-500 alert-pulse" : "bg-red-500 alert-pulse"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700 truncate">{metric.department}</span>
                      <StatusBadge status={metric.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-gray-400">均{metric.avgResponseTime}ms</span>
                      <span className="text-[10px] text-gray-400">P99 {metric.p99ResponseTime}ms</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-display font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gold-600" />
            政策兑现追踪
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 text-xs text-gray-500 font-medium">政策名称</th>
                  <th className="text-right py-3 px-2 text-xs text-gray-500 font-medium">覆盖企业</th>
                  <th className="text-right py-3 px-2 text-xs text-gray-500 font-medium">金额(万元)</th>
                  <th className="text-right py-3 px-2 text-xs text-gray-500 font-medium">到账时效</th>
                  <th className="text-right py-3 px-2 text-xs text-gray-500 font-medium">达标率</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="py-3 px-2">
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  policies.map((policy) => (
                    <tr key={policy.policyName} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-2 text-gray-900 font-medium">{policy.policyName}</td>
                      <td className="py-3 px-2 text-right text-gray-600">{policy.reachedEnterprises}/{policy.targetEnterprises}</td>
                      <td className="py-3 px-2 text-right font-semibold text-emerald-700">{policy.totalAmount.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right">
                        <span className={clsx(
                          "text-xs px-2 py-0.5 rounded-full",
                          policy.avgDisbursementDays <= 10 ? "bg-emerald-50 text-emerald-600" : policy.avgDisbursementDays <= 15 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                        )}>
                          {policy.avgDisbursementDays}天
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={clsx(
                                "h-full rounded-full",
                                policy.complianceRate >= 90 ? "bg-emerald-500" : policy.complianceRate >= 75 ? "bg-amber-500" : "bg-red-500"
                              )}
                              style={{ width: `${policy.complianceRate}%` }}
                            />
                          </div>
                          <span className={clsx(
                            "text-xs font-medium",
                            policy.complianceRate >= 90 ? "text-emerald-600" : policy.complianceRate >= 75 ? "text-amber-600" : "text-red-600"
                          )}>
                            {policy.complianceRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-display font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary-600" />
            政策覆盖率对比
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={policies} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
              <YAxis dataKey="policyName" type="category" width={100} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="complianceRate" radius={[0, 4, 4, 0]}>
                {policies.map((entry: any) => (
                  <Cell key={entry.policyName} fill={entry.complianceRate >= 90 ? "#2d8a56" : entry.complianceRate >= 75 ? "#d4a843" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
