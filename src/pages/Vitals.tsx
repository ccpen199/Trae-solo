import { Heart, Activity, Wind, Droplets, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import Card from "../components/ui/Card";
import WaveformDisplay from "../components/ui/WaveformDisplay";
import GaugeChart from "../components/ui/GaugeChart";
import ProgressRing from "../components/ui/ProgressRing";
import { useHealthStore } from "../store/useHealthStore";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from "recharts";

export function Vitals() {
  const {
    currentVitals, hrvTrend, stressTrend, bloodOxygenTrend,
    baselineHeartRate, heartRateChangePercent, connected,
  } = useHealthStore();

  const highHrChange = heartRateChangePercent > 20;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-deep-sea-50 glow-text">生理监测</h1>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-vital-green-500 status-connected" : "bg-alert-red-500 status-disconnected"}`} />
          {connected ? <Wifi className="w-4 h-4 text-vital-green-400" /> : <WifiOff className="w-4 h-4 text-alert-red-400" />}
          <span className={`text-sm ${connected ? "text-vital-green-400" : "text-alert-red-400"}`}>
            {connected ? "实时连接" : "连接断开"}
          </span>
        </div>
      </div>

      {highHrChange && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-alert-red-500/15 border border-alert-red-500/40">
          <Heart className="w-5 h-5 text-alert-red-400 animate-pulse" />
          <div className="flex-1">
            <span className="text-alert-red-300 font-semibold text-sm">静息心率异常升高</span>
            <span className="text-alert-red-400/80 text-xs ml-3">升高 {heartRateChangePercent.toFixed(1)}%</span>
            <span className="text-alert-red-400/60 text-xs ml-3">基准 {baselineHeartRate} BPM</span>
          </div>
          <AlertTriangle className="w-4 h-4 text-alert-red-400" />
        </div>
      )}

      <Card className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Heart className={`w-5 h-5 ${highHrChange ? "text-alert-red-400 animate-pulse" : "text-vital-green-400"}`} />
          <span className="text-deep-sea-200/70 text-sm">实时心率</span>
        </div>
        <div className="flex items-center gap-6">
          <span
            className={`text-6xl font-din font-bold ${highHrChange ? "text-alert-red-400" : "text-vital-green-400"}`}
            style={{ textShadow: highHrChange ? "0 0 30px rgba(255,71,87,0.5)" : "0 0 30px rgba(0,229,160,0.5)" }}
          >
            {currentVitals?.heartRate ?? "--"}
          </span>
          <span className="text-deep-sea-200/50 text-lg">BPM</span>
        </div>
        <WaveformDisplay
          className="mt-4"
          color={highHrChange ? "#FF4757" : "#00E5A0"}
          height={60}
        />
        <div className="flex items-center gap-6 mt-4 text-sm text-deep-sea-200/60">
          <span>静息心率 <b className="text-deep-sea-100 font-din">{currentVitals?.restingHeartRate ?? baselineHeartRate}</b> BPM</span>
          <span>变化 <b className={`font-din ${highHrChange ? "text-alert-red-400" : "text-vital-green-400"}`}>{heartRateChangePercent > 0 ? "+" : ""}{heartRateChangePercent.toFixed(1)}%</b></span>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-vital-green-400" />
            <h3 className="text-lg font-semibold text-deep-sea-100">HRV 心率变异性趋势</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hrvTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,160,0.08)" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: "rgba(148,163,184,0.5)" }} tickFormatter={(v: string) => v.slice(11, 16)} />
                <YAxis tick={{ fontSize: 10, fill: "rgba(148,163,184,0.5)" }} />
                <Tooltip
                  contentStyle={{ background: "#0A1628", border: "1px solid rgba(0,229,160,0.2)", borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(v: string) => v.slice(11, 16)}
                />
                <ReferenceLine y={50} stroke="rgba(0,229,160,0.4)" strokeDasharray="4 4" label={{ value: "基准", fill: "rgba(0,229,160,0.5)", fontSize: 10 }} />
                <Area type="monotone" dataKey="hrv" stroke="#00E5A0" fill="rgba(0,229,160,0.12)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Wind className="w-5 h-5 text-warning-amber-400" />
            <h3 className="text-lg font-semibold text-deep-sea-100">压力指数追踪</h3>
          </div>
          <div className="flex justify-center mb-2">
            <GaugeChart value={currentVitals?.stressIndex ?? 0} max={100} label="当前压力" size={180} thickness={14} />
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stressTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,160,0.08)" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: "rgba(148,163,184,0.5)" }} tickFormatter={(v: string) => v.slice(11, 16)} />
                <YAxis tick={{ fontSize: 10, fill: "rgba(148,163,184,0.5)" }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: "#0A1628", border: "1px solid rgba(0,229,160,0.2)", borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(v: string) => v.slice(11, 16)}
                />
                <ReferenceLine y={70} stroke="rgba(255,71,87,0.5)" strokeDasharray="4 4" />
                <Area
                  type="monotone"
                  dataKey="stressIndex"
                  stroke="#FFBE0B"
                  fill="rgba(255,190,11,0.1)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-deep-sea-100">血氧监测</h3>
        </div>
        <div className="flex items-center gap-8">
          <ProgressRing
            value={currentVitals?.bloodOxygen ?? 0}
            max={100}
            size={100}
            thickness={8}
            color={currentVitals?.bloodOxygen && currentVitals.bloodOxygen < 95 ? "#FF4757" : "#00E5A0"}
            label="SpO₂"
          />
          <div className="flex-1 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bloodOxygenTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,160,0.08)" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: "rgba(148,163,184,0.5)" }} tickFormatter={(v: string) => v.slice(11, 16)} />
                <YAxis tick={{ fontSize: 10, fill: "rgba(148,163,184,0.5)" }} domain={[90, 100]} />
                <Tooltip
                  contentStyle={{ background: "#0A1628", border: "1px solid rgba(0,229,160,0.2)", borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(v: string) => v.slice(11, 16)}
                />
                <ReferenceLine y={95} stroke="rgba(255,71,87,0.5)" strokeDasharray="4 4" label={{ value: "95%", fill: "rgba(255,71,87,0.6)", fontSize: 10 }} />
                <Area
                  type="monotone"
                  dataKey="bloodOxygen"
                  stroke="#3B82F6"
                  fill="rgba(59,130,246,0.1)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </div>
  );
}
