import { useEffect, useState, useRef } from "react";
import { apiFetch } from "@/store";
import { Building2, Plus, Search, Trash2, Play, Eye, Home, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface Card {
  id: number;
  name: string;
  filters_json: string;
  active: number;
  push_count: number;
  last_pushed_at: string;
  total_matching: number;
}

export default function AiCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [matchedProperties, setMatchedProperties] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<"list" | "match" | "form">("list");
  const [matching, setMatching] = useState(false);
  const [filters, setFilters] = useState<any>({
    type: "sale",
    min_price: "",
    max_price: "",
    rooms: "",
    district: "",
    min_area: "",
  });
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const matchResultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    loadDistricts();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/ai-cards?user_id=5");
      if (res.success) {
        setCards(res.data);
      } else {
        setError(res.message || "加载失败");
      }
    } catch (e: any) {
      setError(e.message || "网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const loadDistricts = async () => {
    try {
      const res = await apiFetch("/api/communities/districts");
      if (res.success) setDistricts(res.data);
    } catch (e: any) {
      console.error("加载区域数据失败:", e);
    }
  };

  const createCard = async () => {
    if (!filters.type) return;
    try {
      const res = await apiFetch("/api/ai-cards", {
        method: "POST",
        body: JSON.stringify({
          user_id: 5,
          name: `${filters.type === "sale" ? "购房" : "租房"}需求`,
          filters_json: filters,
        }),
      });
      if (res.success) {
        setShowForm(false);
        setView("list");
        setFilters({ type: "sale", min_price: "", max_price: "", rooms: "", district: "", min_area: "" });
        await loadData();
        setSuccess("房卡创建成功！");
      } else {
        setError(res.message || "创建失败");
      }
    } catch (e: any) {
      setError(e.message || "网络错误，请稍后重试");
    }
  };

  const deleteCard = async (id: number) => {
    if (!confirm("确定删除该房卡吗？")) return;
    try {
      const res = await apiFetch(`/api/ai-cards/${id}`, { method: "DELETE" });
      if (res.success) {
        await loadData();
        if (selectedCard?.id === id) {
          setSelectedCard(null);
          setMatchedProperties([]);
          setView("list");
        }
        setSuccess("房卡删除成功！");
      }
    } catch (e: any) {
      console.error("删除房卡失败:", e);
    }
  };

  const runMatch = async (card: Card) => {
    setSelectedCard(card);
    setMatching(true);
    setView("match");
    try {
      const res = await apiFetch(`/api/ai-cards/${card.id}/match`, { method: "POST" });
      if (res.success) {
        setMatchedProperties(res.data);
        setView("match");
        await loadData();
        setSuccess(`匹配成功！共找到 ${res.data.length} 套房源，推送次数已更新`);
        setTimeout(() => {
          matchResultRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        setError(res.message || "匹配失败");
      }
    } catch (e: any) {
      console.error("匹配失败:", e);
      setError(e.message || "匹配失败，请重试");
    } finally {
      setMatching(false);
    }
  };

  const getFiltersSummary = (json: string) => {
    try {
      const f = JSON.parse(json);
      const parts = [];
      parts.push(f.type === "sale" ? "二手房" : "租房");
      if (f.rooms) parts.push(`${f.rooms}室`);
      if (f.min_price || f.max_price) parts.push(`${f.min_price || 0}-${f.max_price || "不限"}万`);
      if (f.district) parts.push(f.district);
      return parts.join(" · ");
    } catch { return "筛选条件"; }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>数据加载失败：{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">AI 房卡 · 智能房源推送</h2>
          <p className="text-sm text-gray-500 mt-1">设置多套筛选条件，系统自动为您推送匹配房源</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setView("form"); setSelectedCard(null); }}
          className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          创建新房卡
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-500" />
              我的房卡 · {cards.length} 套
            </h3>
            {loading ? (
              <div className="text-center py-10 text-gray-400">加载中...</div>
            ) : cards.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无房卡，点击上方创建</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => {
                      setSelectedCard(card);
                      setMatchedProperties([]);
                      setView("match");
                      setShowForm(false);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${selectedCard?.id === card.id ? "border-emerald-500 bg-emerald-50" : "border-gray-100 hover:border-emerald-200"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900">{card.name}</div>
                      <button onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{getFiltersSummary(card.filters_json)}</div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-xs text-gray-500">已推送 <b className="text-emerald-600">{card.push_count}</b> 次</div>
                      <button
                        onClick={(e) => { e.stopPropagation(); runMatch(card); }}
                        className="text-xs bg-emerald-500 text-white px-3 py-1 rounded-full hover:bg-emerald-600 transition-colors flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" /> 立即匹配
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2" ref={matchResultRef}>
          {view === "form" && showForm && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">设置筛选条件</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">房源类型</label>
                  <select className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                    <option value="sale">二手房</option>
                    <option value="rent">租房</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">最低总价(万)</label>
                  <input type="number" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30" value={filters.min_price} onChange={(e) => setFilters({ ...filters, min_price: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">最高总价(万)</label>
                  <input type="number" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30" value={filters.max_price} onChange={(e) => setFilters({ ...filters, max_price: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">户型</label>
                  <select className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30" value={filters.rooms} onChange={(e) => setFilters({ ...filters, rooms: e.target.value })}>
                    <option value="">不限</option>
                    <option value="1">一室</option>
                    <option value="2">两室</option>
                    <option value="3">三室</option>
                    <option value="4">四室及以上</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">区域</label>
                  <select className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30" value={filters.district} onChange={(e) => setFilters({ ...filters, district: e.target.value })}>
                    <option value="">不限</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1.5">最小面积(㎡)</label>
                  <input type="number" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30" value={filters.min_area} onChange={(e) => setFilters({ ...filters, min_area: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <button onClick={() => { setShowForm(false); setView("list"); }} className="px-5 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">取消</button>
                <button onClick={createCard} className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">保存房卡</button>
              </div>
            </div>
          )}

          {view === "match" && selectedCard && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 className="font-semibold text-gray-900">
                  {selectedCard.name} · 匹配房源
                </h3>
                <button
                  onClick={() => runMatch(selectedCard)}
                  disabled={matching}
                  className="px-4 py-2 text-sm bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {matching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  再次匹配
                </button>
              </div>

              {matching && (
                <div className="text-center py-10 text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-500" />
                  <p>正在为您智能匹配房源...</p>
                </div>
              )}

              {!matching && matchedProperties.length > 0 ? (
                <>
                  <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-100 p-4 mb-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm text-gray-700">
                          本次匹配到 <b className="text-emerald-600 text-lg">{matchedProperties.length}</b> 套房源，已更新推送记录
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        房卡已推送 <b className="text-emerald-600">{selectedCard.push_count}</b> 次
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {matchedProperties.map((p: any) => (
                      <div key={p.id} className="p-4 bg-gray-50 rounded-lg flex items-center gap-4">
                        <div className="w-24 h-20 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                          <Home className="w-8 h-8 text-white/50" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{p.title}</div>
                          <div className="text-sm text-gray-500 mt-1">{p.community_name} · {p.district}</div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>{p.rooms}室{p.halls}厅 · {p.area}㎡</span>
                            <span>{p.floor}/{p.total_floors}层</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xl font-bold text-red-500">
                            {p.price.toLocaleString()}
                            <span className="text-xs font-normal text-gray-500 ml-1">{p.type === "sale" ? "万" : "元/月"}</span>
                          </div>
                          <button className="mt-2 text-xs text-emerald-600 flex items-center gap-1 ml-auto">
                            <Eye className="w-3 h-3" /> 查看详情
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                !matching && (
                  <div className="text-center py-20 text-gray-400">
                    <Search className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p>点击「立即匹配」按钮开始匹配房源</p>
                  </div>
                )
              )}
            </div>
          )}

          {view === "list" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="text-center py-20 text-gray-400">
                <Search className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p>选择房卡后点击「立即匹配」查看推送结果</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
