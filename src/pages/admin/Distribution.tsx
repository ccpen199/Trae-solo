import { useState, useMemo } from "react";
import { Search, MapPin, Users, TrendingUp, AlertCircle, Send, CheckCircle, Clock, XCircle, Loader2, Eye } from "lucide-react";
import { townshipDistributions } from "@/data/admin";
import type { TownshipDistribution } from "@/types";

export default function AdminDistribution() {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [selectedDist, setSelectedDist] = useState<TownshipDistribution | null>(null);

  const statusColors: Record<string, string> = {
    待分发: "bg-amber-50 text-amber-600",
    分发中: "bg-blue-50 text-blue-600",
    已完成: "bg-jade-50 text-jade-600",
    已撤回: "bg-rock-100 text-rock-500",
  };

  const statusIcons: Record<string, typeof CheckCircle> = {
    待分发: Clock,
    分发中: Loader2,
    已完成: CheckCircle,
    已撤回: XCircle,
  };

  const contentTypeColors: Record<string, string> = {
    资讯投稿: "bg-blue-50 text-blue-600",
    招聘信息: "bg-ember-50 text-ember-600",
    招聘: "bg-ember-50 text-ember-600",
    美食推荐: "bg-jade-50 text-jade-600",
    售房: "bg-purple-50 text-purple-600",
    租房: "bg-purple-50 text-purple-600",
    UGC图文: "bg-pink-50 text-pink-600",
    交友信息: "bg-pink-50 text-pink-600",
  };

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString("zh-CN") : "-";

  const filteredDists = useMemo(() => {
    return townshipDistributions.filter((d) => {
      const matchSearch = !searchText ||
        d.title.includes(searchText) ||
        d.publisher.includes(searchText) ||
        d.sourceTownship.includes(searchText);
      const matchStatus = statusFilter === "全部" || d.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [searchText, statusFilter]);

  const resetFilters = () => {
    setSearchText("");
    setStatusFilter("全部");
  };

  const totalReach = townshipDistributions.reduce((s, d) => s + d.reachCount, 0);
  const coveredTownships = new Set(townshipDistributions.flatMap((d) => d.targetTownships)).size;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-rock-900">乡镇分发</h1>
          <p className="text-sm text-rock-500 mt-1">共 {townshipDistributions.length} 条分发任务，触达 {totalReach.toLocaleString()} 人次，覆盖 {coveredTownships} 个乡镇</p>
        </div>
        <button className="flex items-center gap-2 bg-jade-500 hover:bg-jade-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Send size={16} /> 新建分发
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "覆盖乡镇数", value: coveredTownships, icon: MapPin, color: "text-jade-500", suffix: "/30" },
          { label: "分发任务数", value: townshipDistributions.length, icon: TrendingUp, color: "text-blue-500" },
          { label: "分发中", value: townshipDistributions.filter(d => d.status === "分发中").length, icon: Loader2, color: "text-amber-500" },
          { label: "累计触达", value: totalReach.toLocaleString(), icon: Users, color: "text-purple-500" },
        ].map(({ label, value, icon: Icon, color, suffix }) => (
          <div key={label} className="bg-white rounded-xl p-5 border border-rock-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-rock-500">{label}</p>
                <p className="flex items-baseline gap-1 mt-1">
                  <span className={`text-2xl font-bold ${color}`}>{value}</span>
                  {suffix && <span className="text-xs text-rock-400">{suffix}</span>}
                </p>
              </div>
              <Icon size={24} className={color} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-rock-100">
        <div className="p-4 border-b border-rock-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-rock-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索内容标题、发布者、来源乡镇..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-rock-200 text-sm focus:outline-none focus:border-jade-400 focus:ring-1 focus:ring-jade-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 focus:outline-none focus:border-jade-400"
          >
            <option value="全部">全部状态</option>
            <option value="待分发">待分发</option>
            <option value="分发中">分发中</option>
            <option value="已完成">已完成</option>
            <option value="已撤回">已撤回</option>
          </select>
          <button
            onClick={resetFilters}
            className="px-3 py-2 rounded-lg border border-rock-200 text-sm text-rock-500 hover:bg-rock-50"
          >
            重置
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-rock-50 text-rock-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium">内容标题</th>
                <th className="text-left px-4 py-3 font-medium">类型</th>
                <th className="text-left px-4 py-3 font-medium">来源乡镇</th>
                <th className="text-left px-4 py-3 font-medium">目标乡镇</th>
                <th className="text-left px-4 py-3 font-medium">发布者</th>
                <th className="text-left px-4 py-3 font-medium">触达量</th>
                <th className="text-left px-4 py-3 font-medium">分发时间</th>
                <th className="text-left px-4 py-3 font-medium">状态</th>
                <th className="text-right px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredDists.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <AlertCircle size={40} className="mx-auto text-rock-300 mb-3" />
                    <p className="text-rock-400">暂无符合条件的分发任务</p>
                  </td>
                </tr>
              ) : (
                filteredDists.map((d) => {
                  const StatusIcon = statusIcons[d.status];
                  return (
                    <tr key={d.id} className="border-t border-rock-50 hover:bg-rock-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-rock-900 max-w-xs truncate">{d.title}</p>
                        <p className="text-xs text-rock-400">ID: {d.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${contentTypeColors[d.contentType] || "bg-rock-100 text-rock-600"}`}>
                          {d.contentType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-rock-700">
                          <MapPin size={12} className="text-jade-500" />
                          {d.sourceTownship}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {d.targetTownships.slice(0, 3).map((t) => (
                            <span key={t} className="px-1.5 py-0.5 rounded bg-rock-100 text-rock-500 text-xs">
                              {t}
                            </span>
                          ))}
                          {d.targetTownships.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded bg-rock-100 text-rock-400 text-xs">
                              +{d.targetTownships.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-rock-700">{d.publisher}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-rock-900">{d.reachCount.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-rock-600">
                        {formatDate(d.distributedAt || d.publishedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusColors[d.status]}`}>
                          <StatusIcon size={10} className={d.status === "分发中" ? "animate-spin" : ""} />
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedDist(d)}
                            className="p-1.5 rounded hover:bg-rock-100 text-rock-500 hover:text-rock-700"
                            title="查看详情"
                          >
                            <Eye size={16} />
                          </button>
                          {d.status === "待分发" && (
                            <button
                              className="p-1.5 rounded hover:bg-rock-100 text-jade-500 hover:text-jade-700"
                              title="立即分发"
                            >
                              <Send size={16} />
                            </button>
                          )}
                          {d.status === "分发中" && (
                            <button
                              className="p-1.5 rounded hover:bg-rock-100 text-ember-500 hover:text-ember-700"
                              title="撤回"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-rock-100 flex items-center justify-between text-sm text-rock-500">
          <span>共 {filteredDists.length} 条记录</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 rounded border border-rock-200 hover:bg-rock-50">上一页</button>
            <button className="px-3 py-1 rounded bg-jade-500 text-white">1</button>
            <button className="px-3 py-1 rounded border border-rock-200 hover:bg-rock-50">下一页</button>
          </div>
        </div>
      </div>

      {selectedDist && (
        <div className="fixed inset-0 bg-rock-900/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDist(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-rock-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-rock-900">分发详情</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusColors[selectedDist.status]}`}>
                  {selectedDist.status}
                </span>
              </div>
              <button onClick={() => setSelectedDist(null)} className="text-rock-400 hover:text-rock-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <span className={`px-2 py-0.5 rounded text-xs ${contentTypeColors[selectedDist.contentType] || "bg-rock-100 text-rock-600"}`}>
                  {selectedDist.contentType}
                </span>
                <h4 className="font-bold text-rock-900 mt-2">{selectedDist.title}</h4>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-rock-50 rounded-lg p-3">
                  <p className="text-rock-500 text-xs mb-1">来源乡镇</p>
                  <div className="flex items-center gap-1 text-rock-900 font-medium">
                    <MapPin size={12} className="text-jade-500" />
                    {selectedDist.sourceTownship}
                  </div>
                </div>
                <div className="bg-rock-50 rounded-lg p-3">
                  <p className="text-rock-500 text-xs mb-1">发布者</p>
                  <p className="font-medium text-rock-900">{selectedDist.publisher}</p>
                </div>
                <div className="bg-rock-50 rounded-lg p-3">
                  <p className="text-rock-500 text-xs mb-1">发布时间</p>
                  <p className="font-medium text-rock-900">{formatDate(selectedDist.publishedAt)}</p>
                </div>
                <div className="bg-rock-50 rounded-lg p-3">
                  <p className="text-rock-500 text-xs mb-1">分发时间</p>
                  <p className="font-medium text-rock-900">{formatDate(selectedDist.distributedAt)}</p>
                </div>
                <div className="bg-jade-50 rounded-lg p-3 col-span-2">
                  <p className="text-jade-600 text-xs mb-1">累计触达用户</p>
                  <p className="text-xl font-bold text-jade-700">{selectedDist.reachCount.toLocaleString()} 人次</p>
                </div>
              </div>
              <div>
                <p className="text-rock-500 text-xs mb-2">目标分发乡镇（{selectedDist.targetTownships.length} 个）</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDist.targetTownships.map((t) => (
                    <span key={t} className="px-2 py-1 rounded bg-jade-50 text-jade-600 text-xs flex items-center gap-1">
                      <MapPin size={10} />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button className="flex-1 py-2 rounded-lg bg-jade-500 hover:bg-jade-600 text-white text-sm font-medium">再次分发</button>
                <button className="flex-1 py-2 rounded-lg border border-rock-200 text-rock-600 hover:bg-rock-50 text-sm font-medium">查看原文</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
