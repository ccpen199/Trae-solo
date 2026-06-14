import { useState } from "react";
import { Search } from "lucide-react";
import { mockUsersForAdmin } from "@/mock";

const riskMap = {
  normal: { label: "正常", cls: "bg-emerald/15 text-emerald" },
  suspected: { label: "嫌疑", cls: "bg-gold-400/15 text-gold-400" },
  blocked: { label: "封禁", cls: "bg-coral/15 text-coral" },
} as const;

function ltvColor(score: number) {
  if (score < 50) return "text-coral";
  if (score <= 200) return "text-gold-400";
  return "text-emerald";
}

export default function Users() {
  const [search, setSearch] = useState("");

  const filtered = mockUsersForAdmin.filter(u =>
    u.nickname.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold gold-text font-display">用户管理</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input !pl-9 !w-64"
            placeholder="搜索用户昵称"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-left text-white/40">
              <th className="p-4">用户</th>
              <th className="p-4">LTV评分</th>
              <th className="p-4">风险标签</th>
              <th className="p-4">金币余额</th>
              <th className="p-4">签到天数</th>
              <th className="p-4">注册时间</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-night-700/40 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar} alt="" className="h-8 w-8 rounded-full bg-night-600" />
                    <span className="text-white/90 font-medium">{u.nickname}</span>
                  </div>
                </td>
                <td className={`p-4 font-display font-bold ${ltvColor(u.ltvScore)}`}>{u.ltvScore}</td>
                <td className="p-4">
                  <span className={`chip ${riskMap[u.riskLabel].cls}`}>{riskMap[u.riskLabel].label}</span>
                </td>
                <td className="p-4 gold-text font-display">{u.coinBalance.toLocaleString()}</td>
                <td className="p-4 text-white/70">{u.checkinDays}天</td>
                <td className="p-4 text-white/50 text-xs">{u.createdAt.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
