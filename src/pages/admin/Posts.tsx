import { useState, useMemo } from "react";
import { Search, Eye, Edit2, Trash2, Filter, Briefcase, Home, UtensilsCrossed, Heart, MapPin, User, Eye as EyeIcon, Clock } from "lucide-react";
import { jobPosts, housingPosts, foodPosts, datingPosts } from "@/data/posts";
import type { InfoPost } from "@/types";

const allPosts: Array<InfoPost & { typeLabel: string }> = [
  ...jobPosts.map(p => ({ ...p, typeLabel: "招聘" })),
  ...housingPosts.map(p => ({ ...p, typeLabel: "房产" })),
  ...foodPosts.map(p => ({ ...p, typeLabel: "美食" })),
  ...datingPosts.map(p => ({ ...p, typeLabel: "交友" })),
];

const typeColors: Record<string, string> = {
  招聘: "bg-ember-50 text-ember-600",
  房产: "bg-blue-50 text-blue-600",
  美食: "bg-jade-50 text-jade-600",
  交友: "bg-pink-50 text-pink-600",
};

const typeIcons: Record<string, typeof Briefcase> = {
  招聘: Briefcase,
  房产: Home,
  美食: UtensilsCrossed,
  交友: Heart,
};

const statusColors: Record<string, string> = {
  approved: "bg-jade-50 text-jade-600",
  pending: "bg-amber-50 text-amber-600",
  rejected: "bg-ember-50 text-ember-600",
};

const statusLabels: Record<string, string> = {
  approved: "已发布",
  pending: "待审核",
  rejected: "已拒绝",
};

export default function AdminPosts() {
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("全部");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [selectedPost, setSelectedPost] = useState<(InfoPost & { typeLabel: string }) | null>(null);
  const [activeTab, setActiveTab] = useState("全部");

  const tabs = [
    { label: "全部", count: allPosts.length, value: "全部" },
    { label: "招聘", count: jobPosts.length, value: "招聘" },
    { label: "房产", count: housingPosts.length, value: "房产" },
    { label: "美食", count: foodPosts.length, value: "美食" },
    { label: "交友", count: datingPosts.length, value: "交友" },
  ];

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("zh-CN") : "-";

  const filteredPosts = useMemo(() => {
    return allPosts.filter((p) => {
      const matchTab = activeTab === "全部" || p.typeLabel === activeTab;
      const matchSearch = !searchText ||
        p.title.includes(searchText) ||
        p.author.includes(searchText) ||
        (p.location.township && p.location.township.includes(searchText));
      const matchType = typeFilter === "全部" || p.typeLabel === typeFilter;
      const matchStatus = statusFilter === "全部" || p.status === statusFilter;
      return matchTab && matchSearch && matchType && matchStatus;
    });
  }, [searchText, typeFilter, statusFilter, activeTab]);

  const resetFilters = () => {
    setSearchText("");
    setTypeFilter("全部");
    setStatusFilter("全部");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-rock-900">分类信息</h1>
          <p className="text-sm text-rock-500 mt-1">共 {allPosts.length} 条分类信息，覆盖 {new Set(allPosts.map(p => p.location.township)).size} 个乡镇</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-rock-100 mb-6">
        <div className="flex items-center border-b border-rock-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab.value
                  ? "border-jade-500 text-jade-600"
                  : "border-transparent text-rock-500 hover:text-rock-700"
              }`}
            >
              {(() => {
                const Icon = typeIcons[tab.value] || Filter;
                return tab.value !== "全部" ? <Icon size={14} /> : null;
              })()}
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded text-xs ${
                activeTab === tab.value ? "bg-jade-100 text-jade-700" : "bg-rock-100 text-rock-500"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="p-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-rock-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索标题、发布人、乡镇..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-rock-200 text-sm focus:outline-none focus:border-jade-400 focus:ring-1 focus:ring-jade-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 focus:outline-none focus:border-jade-400"
          >
            <option value="全部">全部状态</option>
            <option value="approved">已发布</option>
            <option value="pending">待审核</option>
            <option value="rejected">已拒绝</option>
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
                <th className="text-left px-4 py-3 font-medium">信息标题</th>
                <th className="text-left px-4 py-3 font-medium">分类</th>
                <th className="text-left px-4 py-3 font-medium">发布人</th>
                <th className="text-left px-4 py-3 font-medium">所在地</th>
                <th className="text-left px-4 py-3 font-medium">浏览量</th>
                <th className="text-left px-4 py-3 font-medium">发布时间</th>
                <th className="text-left px-4 py-3 font-medium">状态</th>
                <th className="text-right px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Search size={40} className="mx-auto text-rock-300 mb-3" />
                    <p className="text-rock-400">暂无符合条件的分类信息</p>
                  </td>
                </tr>
              ) : (
                filteredPosts.map((p) => {
                  const TypeIcon = typeIcons[p.typeLabel];
                  return (
                    <tr key={p.id} className="border-t border-rock-50 hover:bg-rock-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.images && p.images.length > 0 ? (
                            <img src={p.images[0]} alt="" className="w-12 h-9 rounded-md object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-9 rounded-md bg-rock-100 flex items-center justify-center flex-shrink-0">
                              <TypeIcon size={16} className="text-rock-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-rock-900 truncate max-w-xs">{p.title}</p>
                            <p className="text-xs text-rock-400 truncate max-w-xs">{p.content.slice(0, 40)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${typeColors[p.typeLabel]}`}>
                          <TypeIcon size={10} />
                          {p.typeLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {p.authorAvatar ? (
                            <img src={p.authorAvatar} alt="" className="w-6 h-6 rounded-full" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-rock-100 flex items-center justify-center">
                              <User size={12} className="text-rock-400" />
                            </div>
                          )}
                          <span className="text-rock-700">{p.author}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-rock-600">
                          <MapPin size={12} className="text-rock-400" />
                          {p.location.township}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-rock-700">
                          <EyeIcon size={12} className="text-rock-400" />
                          {p.views.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-rock-600">
                          <Clock size={12} className="text-rock-400" />
                          {formatDate(p.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[p.status] || "bg-rock-100 text-rock-600"}`}>
                          {statusLabels[p.status] || p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedPost(p)}
                            className="p-1.5 rounded hover:bg-rock-100 text-rock-500 hover:text-rock-700"
                            title="查看详情"
                          >
                            <Eye size={16} />
                          </button>
                          <button className="p-1.5 rounded hover:bg-rock-100 text-rock-500 hover:text-rock-700" title="编辑">
                            <Edit2 size={16} />
                          </button>
                          <button className="p-1.5 rounded hover:bg-rock-100 text-rock-500 hover:text-ember-600" title="删除">
                            <Trash2 size={16} />
                          </button>
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
          <span>共 {filteredPosts.length} 条记录</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 rounded border border-rock-200 hover:bg-rock-50">上一页</button>
            <button className="px-3 py-1 rounded bg-jade-500 text-white">1</button>
            <button className="px-3 py-1 rounded border border-rock-200 hover:bg-rock-50">下一页</button>
          </div>
        </div>
      </div>

      {selectedPost && (
        <div className="fixed inset-0 bg-rock-900/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPost(null)}>
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-rock-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${typeColors[selectedPost.typeLabel]}`}>
                  {selectedPost.typeLabel}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[selectedPost.status]}`}>
                  {statusLabels[selectedPost.status]}
                </span>
              </div>
              <button onClick={() => setSelectedPost(null)} className="text-rock-400 hover:text-rock-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <h4 className="font-bold text-rock-900 text-lg">{selectedPost.title}</h4>
              <div className="flex items-center gap-4 text-sm text-rock-500">
                <div className="flex items-center gap-1">
                  <User size={12} />
                  {selectedPost.author}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={12} />
                  {selectedPost.location.township}
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatDate(selectedPost.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <EyeIcon size={12} />
                  {selectedPost.views}
                </div>
              </div>
              {selectedPost.images && selectedPost.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedPost.images.map((img, i) => (
                    <img key={i} src={img} alt="" className="w-full h-28 object-cover rounded-lg" />
                  ))}
                </div>
              )}
              <div className="bg-rock-50 rounded-xl p-4">
                <p className="text-sm text-rock-700 leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
              </div>
              {selectedPost.structuredData && Object.keys(selectedPost.structuredData).length > 0 && (
                <div>
                  <p className="text-rock-500 text-xs mb-2">结构化字段</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedPost.structuredData).map(([k, v]) => (
                      <div key={k} className="bg-jade-50 rounded-lg p-3">
                        <p className="text-xs text-rock-500 mb-0.5">
                          {k === "salary" ? "薪资待遇" : k === "company" ? "招聘单位" : k === "requirements" ? "任职要求" : k === "price" ? "价格" : k === "area" ? "面积" : k === "deposit" ? "押金/付款" : k === "furniture" ? "配套设施" : k}
                        </p>
                        <p className="text-sm font-medium text-rock-900">{String(v)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedPost.tags.map((t) => (
                    <span key={t} className="px-2 py-1 rounded bg-rock-100 text-rock-600 text-xs">#{t}</span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button className="flex-1 py-2 rounded-lg bg-jade-500 hover:bg-jade-600 text-white text-sm font-medium">编辑信息</button>
                <button className="flex-1 py-2 rounded-lg border border-rock-200 text-rock-600 hover:bg-rock-50 text-sm font-medium">下架信息</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
