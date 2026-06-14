import { useState } from "react";
import { Save } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { dashboardMetrics } from "@/mock";

const adSlots = [
  { id: "slot-1", name: "开屏广告-首页", position: "开屏", sdk: "穿山甲", active: true, ecpm: 42.5 },
  { id: "slot-2", name: "信息流-任务页", position: "信息流", sdk: "优量汇", active: true, ecpm: 28.3 },
  { id: "slot-3", name: "激励视频-金币翻倍", position: "激励视频", sdk: "穿山甲", active: true, ecpm: 86.1 },
  { id: "slot-4", name: "信息流-签到页", position: "信息流", sdk: "穿山甲", active: false, ecpm: 19.7 },
];

const positionBadge: Record<string, string> = {
  "开屏": "bg-indigo-500/15 text-indigo-400",
  "信息流": "bg-purple-500/15 text-purple-400",
  "激励视频": "bg-emerald/15 text-emerald",
};

const sdks = [
  { name: "穿山甲", appId: "csj_5078xxx", slotId: "slot_csj_001" },
  { name: "优量汇", appId: "ylh_1108xxx", slotId: "slot_ylh_002" },
];

export default function Ads() {
  const [sdkConfigs, setSdkConfigs] = useState(sdks);
  const [sdkStatus, setSdkStatus] = useState<Record<string, boolean>>({ "穿山甲": true, "优量汇": true });
  const revenueData = dashboardMetrics.adRevenue.slice(-7);

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold gold-text font-display mb-6">广告管理</h1>

      <h2 className="text-lg font-semibold text-white/90 mb-3">SDK配置</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {sdkConfigs.map(s => (
          <div key={s.name} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-white/90">{s.name}</span>
              <button onClick={() => setSdkStatus(prev => ({ ...prev, [s.name]: !prev[s.name] }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${sdkStatus[s.name] ? "bg-gold-400" : "bg-night-500"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${sdkStatus[s.name] ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/40 mb-1 block">App ID</label>
                <input className="input" value={s.appId}
                  onChange={e => setSdkConfigs(prev => prev.map(c => c.name === s.name ? { ...c, appId: e.target.value } : c))} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">广告位 ID</label>
                <input className="input" value={s.slotId}
                  onChange={e => setSdkConfigs(prev => prev.map(c => c.name === s.name ? { ...c, slotId: e.target.value } : c))} />
              </div>
              <button className="gold-btn !py-2 !px-4 !text-xs w-full mt-1">
                <Save className="h-3.5 w-3.5" /> 保存配置
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-white/90 mb-3">广告位管理</h2>
      <div className="card overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-left text-white/40">
              <th className="p-4">广告位名称</th>
              <th className="p-4">位置</th>
              <th className="p-4">SDK来源</th>
              <th className="p-4">状态</th>
              <th className="p-4">eCPM</th>
            </tr>
          </thead>
          <tbody>
            {adSlots.map(s => (
              <tr key={s.id} className="border-b border-white/5 hover:bg-night-700/40 transition-colors">
                <td className="p-4 text-white/90 font-medium">{s.name}</td>
                <td className="p-4"><span className={`chip ${positionBadge[s.position]}`}>{s.position}</span></td>
                <td className="p-4 text-white/60">{s.sdk}</td>
                <td className="p-4">
                  <span className="flex items-center gap-2 text-white/60">
                    <span className={`h-2 w-2 rounded-full ${s.active ? "bg-emerald" : "bg-white/20"}`} />
                    {s.active ? "运行中" : "已暂停"}
                  </span>
                </td>
                <td className="p-4 gold-text font-display font-bold">¥{s.ecpm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold text-white/90 mb-3">收益统计</h2>
      <div className="card p-5">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "#1A1A2E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#FCD34D" }} />
            <Bar dataKey="revenue" fill="#FBBF24" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
