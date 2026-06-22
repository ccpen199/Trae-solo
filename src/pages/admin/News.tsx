import { useState, useMemo } from "react";
import { Search, Plus, Eye, Edit2, Trash2, Newspaper, MapPin, User, Calendar, Eye as EyeIcon } from "lucide-react";
import { newsArticles } from "@/data/news";
import type { NewsArticle } from "@/types";

export default function AdminNews() {
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("全部");
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);

  const categoryMap: Record<string, string> = {
    local: "本地新闻",
    policy: "政策公告",
    township: "乡镇动态",
    guide: "生活攻略",
  };

  const categoryColors: Record<string, string> = {
    local: "bg-jade-50 text-jade-600",
    policy: "bg-blue-50 text-blue-600",
    township: "bg-ember-50 text-ember-600",
    guide: "bg-purple-50 text-purple-600",
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("zh-CN") : "-";

  const filteredNews = useMemo(() => {
    return newsArticles.filter((n) => {
      const matchSearch = !searchText ||
        n.title.includes(searchText) ||
        n.author.includes(searchText) ||
        (n.township && n.township.includes(searchText));
      const matchCategory = categoryFilter === "全部" || n.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [searchText, categoryFilter]);

  const resetFilters = () => {
    setSearchText("");
    setCategoryFilter("全部");
  };

  const totalViews = newsArticles.reduce((sum, n) => sum + n.views, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-rock-900">资讯栏目</h1>
          <p className="text-sm text-rock-500 mt-1">共 {newsArticles.length} 篇资讯，累计浏览 {totalViews.toLocaleString()} 次</p>
        </div>
        <button className="flex items-center gap-2 bg-jade-500 hover:bg-jade-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> 发布资讯
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(categoryMap).map(([key, label]) => {
          const count = newsArticles.filter(n => n.category === key).length;
          const views = newsArticles.filter(n => n.category === key).reduce((s, n) => s + n.views, 0);
          return (
            <div key={key} className={`rounded-xl p-4 border border-rock-100 ${categoryColors[key].replace("text-", "bg-").replace("-600", "-50/50")}`}>
              <p className="text-sm text-rock-500">{label}</p>
              <div className="flex items-end justify-between mt-1">
                <p className={`text-2xl font-bold ${categoryColors[key].split(" ")[1]}`}>{count}</p>
                <p className="text-xs text-rock-400">{views.toLocaleString()} 浏览</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-rock-100">
        <div className="p-4 border-b border-rock-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-rock-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索资讯标题、作者、乡镇..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-rock-200 text-sm focus:outline-none focus:border-jade-400 focus:ring-1 focus:ring-jade-400"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 focus:outline-none focus:border-jade-400"
          >
            <option value="全部">全部分类</option>
            {Object.entries(categoryMap).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
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
                <th className="text-left px-4 py-3 font-medium">资讯标题</th>
                <th className="text-left px-4 py-3 font-medium">分类</th>
                <th className="text-left px-4 py-3 font-medium">作者</th>
                <th className="text-left px-4 py-3 font-medium">关联乡镇</th>
                <th className="text-left px-4 py-3 font-medium">浏览量</th>
                <th className="text-left px-4 py-3 font-medium">发布时间</th>
                <th className="text-right px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredNews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Search size={40} className="mx-auto text-rock-300 mb-3" />
                    <p className="text-rock-400">暂无符合条件的资讯</p>
                  </td>
                </tr>
              ) : (
                filteredNews.map((n) => (
                  <tr key={n.id} className="border-t border-rock-50 hover:bg-rock-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {n.coverImage ? (
                          <img src={n.coverImage} alt="" className="w-12 h-9 rounded-md object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-9 rounded-md bg-rock-100 flex items-center justify-center flex-shrink-0">
                            <Newspaper size={16} className="text-rock-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-rock-900 truncate max-w-md">{n.title}</p>
                          <p className="text-xs text-rock-400 truncate max-w-md">{n.summary}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${categoryColors[n.category] || "bg-rock-100 text-rock-600"}`}>
                        {categoryMap[n.category] || n.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-rock-700">
                        <User size={12} className="text-rock-400" />
                        {n.author}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {n.township ? (
                        <div className="flex items-center gap-1 text-rock-600">
                          <MapPin size={12} className="text-rock-400" />
                          {n.township}
                        </div>
                      ) : (
                        <span className="text-rock-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-rock-700">
                        <EyeIcon size={12} className="text-rock-400" />
                        {n.views.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-rock-600">
                        <Calendar size={12} className="text-rock-400" />
                        {formatDate(n.publishedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedNews(n)}
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
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-rock-100 flex items-center justify-between text-sm text-rock-500">
          <span>共 {filteredNews.length} 条记录</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 rounded border border-rock-200 hover:bg-rock-50">上一页</button>
            <button className="px-3 py-1 rounded bg-jade-500 text-white">1</button>
            <button className="px-3 py-1 rounded border border-rock-200 hover:bg-rock-50">下一页</button>
          </div>
        </div>
      </div>

      {selectedNews && (
        <div className="fixed inset-0 bg-rock-900/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedNews(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-rock-100 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-rock-900">资讯详情</h3>
              <button onClick={() => setSelectedNews(null)} className="text-rock-400 hover:text-rock-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {selectedNews.coverImage && (
                <img src={selectedNews.coverImage} alt="" className="w-full h-48 object-cover rounded-xl" />
              )}
              <div>
                <span className={`px-2 py-0.5 rounded text-xs ${categoryColors[selectedNews.category]}`}>
                  {categoryMap[selectedNews.category]}
                </span>
                <h4 className="font-serif text-xl font-bold text-rock-900 mt-2">{selectedNews.title}</h4>
                <div className="flex items-center gap-4 mt-2 text-sm text-rock-500">
                  <div className="flex items-center gap-1"><User size={12} /> {selectedNews.author}</div>
                  <div className="flex items-center gap-1"><Calendar size={12} /> {formatDate(selectedNews.publishedAt)}</div>
                  <div className="flex items-center gap-1"><EyeIcon size={12} /> {selectedNews.views.toLocaleString()} 浏览</div>
                  {selectedNews.township && (
                    <div className="flex items-center gap-1"><MapPin size={12} /> {selectedNews.township}</div>
                  )}
                </div>
              </div>
              <div className="bg-rock-50 rounded-xl p-4">
                <p className="text-sm text-rock-600 leading-relaxed">{selectedNews.summary}</p>
              </div>
              <div>
                <p className="text-rock-500 text-xs mb-2">正文内容</p>
                <p className="text-sm text-rock-700 leading-relaxed whitespace-pre-wrap">{selectedNews.content}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button className="flex-1 py-2 rounded-lg bg-jade-500 hover:bg-jade-600 text-white text-sm font-medium">编辑资讯</button>
                <button className="flex-1 py-2 rounded-lg border border-rock-200 text-rock-600 hover:bg-rock-50 text-sm font-medium">下线资讯</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
