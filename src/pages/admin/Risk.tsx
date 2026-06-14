import { useState } from "react";
import { ShieldAlert, AlertTriangle, Fingerprint, Eye, Wifi } from "lucide-react";
import { withdrawalRules, riskAlerts } from "@/mock";
import type { RiskType } from "@/types";

const actionMap = {
  block: { label: "拦截", cls: "bg-coral/15 text-coral" },
  review: { label: "审核", cls: "bg-gold-400/15 text-gold-400" },
  limit: { label: "限制", cls: "bg-indigo-500/15 text-indigo-400" },
} as const;

const severityColors = { high: "bg-coral", medium: "bg-gold-400", low: "bg-blue-400" } as const;

const typeIcons: Record<RiskType, React.ElementType> = {
  device_fingerprint: Fingerprint,
  behavior_sequence: Eye,
  ip_frequency: Wifi,
  withdrawal_anomaly: AlertTriangle,
};

export default function Risk() {
  const [rules, setRules] = useState(withdrawalRules);
  const [alerts, setAlerts] = useState(riskAlerts);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const toggleResolved = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: !a.resolved } : a));
  };

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold gold-text font-display mb-6">风控中心</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="h-5 w-5 text-coral" />
            <h2 className="text-lg font-semibold text-white/90">提现拦截规则</h2>
          </div>
          <div className="space-y-3">
            {rules.map(r => (
              <div key={r.id} className="card p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white/90 font-medium text-sm">{r.name}</span>
                    <span className={`chip ${actionMap[r.action].cls}`}>{actionMap[r.action].label}</span>
                  </div>
                  <p className="text-xs text-white/40">{r.condition}</p>
                  <p className="text-xs text-white/30 mt-1">
                    命中 <span className="text-gold-400 font-display">{r.hitCount}</span> 次
                  </p>
                </div>
                <button onClick={() => toggleRule(r.id)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${r.enabled ? "bg-gold-400" : "bg-night-500"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${r.enabled ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-gold-400" />
            <h2 className="text-lg font-semibold text-white/90">异常告警</h2>
          </div>
          <div className="space-y-3">
            {alerts.map(a => {
              const Icon = typeIcons[a.type];
              return (
                <div key={a.id} className={`card p-4 ${a.resolved ? "opacity-50" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${severityColors[a.severity]}`} />
                      <Icon className="h-4 w-4 text-white/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80">{a.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-white/40">
                        <span>{a.nickname}</span>
                        <span>{a.timestamp.slice(0, 16).replace("T", " ")}</span>
                      </div>
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-white/40 cursor-pointer shrink-0">
                      <input type="checkbox" checked={a.resolved} onChange={() => toggleResolved(a.id)}
                        className="accent-gold-400 rounded" />
                      已处理
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
