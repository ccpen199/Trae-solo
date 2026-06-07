import { useEffect, useState } from "react";
import { apiFetch } from "@/store";
import { Search, Filter, MapPin, Home, Eye, Star, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

interface PriceTrend {
  price: number;
  trend_date: string;
}

interface Property {
  id: number;
  title: string;
  type: string;
  price: number;
  area: number;
  rooms: number;
  halls: number;
  floor: number;
  total_floors: number;
  orientation: string;
  decoration: string;
  community_name: string;
  district: string;
  agent_name: string;
  agent_certified: number;
  has_vr: number;
  has_inspection: number;
  is_featured: number;
  priceTrends?: PriceTrend[];
}

const isEnabled = (value: number | boolean | null | undefined) => value === true || value === 1;

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [prevTotal, setPrevTotal] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState("latest");
  const [filters, setFilters] = useState({
    type: "",
    keyword: "",
    min_price: "",
    max_price: "",
    rooms: "",
  });
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);

  useEffect(() => {
    loadProperties();
  }, [page, sortBy, searchTrigger]);

  const loadProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort_by: sortBy });
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
      const url = `/api/properties?${params.toString()}`;
      console.log(`[Properties] 发起API请求: ${url}`);
      console.log(`[Properties] 当前filters:`, JSON.stringify(filters));
      const res = await apiFetch(url);
      console.log(`[Properties] API响应:`, res);
      if (res.success) {
        let list = res.data.list;
        if (sortBy === "price_asc") {
          list = [...list].sort((a: any, b: any) => a.price - b.price);
        } else if (sortBy === "price_desc") {
          list = [...list].sort((a: any, b: any) => b.price - a.price);
        } else if (sortBy === "area_desc") {
          list = [...list].sort((a: any, b: any) => b.area - a.area);
        }
        setProperties(list);
        setTotal(res.data.total);
        console.log(`[Properties] 结果总数: ${res.data.total}, 首条: ${list[0]?.title}`);
        if (list.length === 0) {
          setSelectedProperty(null);
        } else if (!selectedProperty || !list.some((item: Property) => item.id === selectedProperty.id)) {
          await loadDetail(list[0]);
        }
      } else {
        setError(res.message || "加载失败");
        console.error(`[Properties] API错误:`, res.message);
      }
    } catch (e: any) {
      setError(e.message || "网络错误，请稍后重试");
      console.error(`[Properties] 异常:`, e);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setPrevTotal(total);
    setPage(1);
    setSortBy("latest");
    setFilters({
      type: "",
      keyword: "",
      min_price: "",
      max_price: "",
      rooms: "",
    });
    setNotice("已恢复默认筛选");
    setTimeout(() => setSearchTrigger(prev => prev + 1), 0);
  };

  const getPriceTrend = (p: any) => {
    if (!p.priceTrends || p.priceTrends.length < 2) return null;
    const latest = p.priceTrends[0].price;
    const prev = p.priceTrends[Math.min(1, p.priceTrends.length - 1)].price;
    const diff = latest - prev;
    const pct = prev > 0 ? ((diff / prev) * 100).toFixed(1) : "0";
    return { diff, pct, isUp: diff > 0 };
  };

  const hasActiveFilters = filters.keyword || filters.type || filters.rooms || filters.min_price || filters.max_price;

  const loadDetail = async (p: Property) => {
    try {
      const res = await apiFetch(`/api/properties/${p.id}`);
      if (res.success) {
        setSelectedProperty(res.data);
      }
    } catch (e: any) {
      console.error("加载房源详情失败:", e);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const activeFilterText = [
    filters.keyword ? `关键词“${filters.keyword}”` : "",
    filters.type ? (filters.type === "sale" ? "二手房" : "租房") : "",
    filters.rooms ? `${filters.rooms}室` : "",
    filters.min_price ? `最低${filters.min_price}万` : "",
    filters.max_price ? `最高${filters.max_price}万` : "",
  ].filter(Boolean).join(" · ");

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>数据加载失败：{error}</span>
        </div>
      )}
      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              name="search"
              aria-label="搜索框"
              placeholder="搜索小区、房源标题..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
          </div>
          <select
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
            value={filters.type}
            onChange={(e) => {
              setFilters({ ...filters, type: e.target.value });
            }}
          >
            <option value="">全部类型</option>
            <option value="sale">二手房</option>
            <option value="rent">租房</option>
          </select>
          <select
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
            value={filters.rooms}
            onChange={(e) => setFilters({ ...filters, rooms: e.target.value })}
          >
            <option value="">户型</option>
            <option value="1">一室</option>
            <option value="2">两室</option>
            <option value="3">三室</option>
            <option value="4">四室及以上</option>
          </select>
          <input
            type="number"
            placeholder="最低总价(万)"
            className="w-36 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            value={filters.min_price}
            onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
          />
          <input
            type="number"
            placeholder="最高总价(万)"
            className="w-36 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            value={filters.max_price}
            onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
          />
          <button
            onClick={() => {
              if (!hasActiveFilters) {
                setFilters({ ...filters, keyword: "西溪" });
                setPrevTotal(total);
                setPage(1);
                setNotice("已使用推荐关键词“西溪”完成筛选，结果列表和价格趋势已刷新");
                setTimeout(() => setSearchTrigger(prev => prev + 1), 0);
                return;
              }
              setPrevTotal(total);
              setPage(1);
              setNotice(`已按当前条件完成筛选：${activeFilterText}`);
              setTimeout(() => setSearchTrigger(prev => prev + 1), 0);
            }}
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
          >
            搜索
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            重置筛选
          </button>
        </div>
      </div>

      {prevTotal !== null && hasActiveFilters && (
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-100 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">筛选前</span>
                <span className="text-lg font-bold text-gray-700">{prevTotal}</span>
                <span className="text-sm text-gray-500">套</span>
              </div>
              <div className="text-gray-400">→</div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">筛选后</span>
                <span className="text-lg font-bold text-emerald-600">{total}</span>
                <span className="text-sm text-gray-500">套</span>
              </div>
              {(() => {
                const diff = total - prevTotal;
                if (diff === 0) return <span className="text-sm text-gray-500">筛选条件无变化</span>;
                return (
                  <span className={`text-sm font-medium px-2 py-0.5 rounded ${diff < 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {diff < 0 ? "↓" : "↑"} {Math.abs(diff)} 套
                  </span>
                );
              })()}
            </div>
            {activeFilterText && (
              <div className="text-sm text-gray-600">
                <span className="text-gray-500">筛选条件：</span>{activeFilterText}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-semibold text-gray-900">房源搜索结果 · 共 {total} 套</h3>
                <p className="text-xs text-gray-500 mt-1">
                  查询结果支持按小区、区域、经纪人、房源标题、户型和价格条件筛选
                </p>
                {activeFilterText && (
                  <p className="text-xs text-emerald-700 mt-1">当前筛选：{activeFilterText}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white"
                >
                  <option value="latest">最新发布</option>
                  <option value="price_asc">价格从低到高</option>
                  <option value="price_desc">价格从高到低</option>
                  <option value="area_desc">面积从大到小</option>
                </select>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Filter className="w-4 h-4" /> 智能筛选
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-400">加载中...</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {properties.length === 0 && (
                  <div className="text-center py-16 text-gray-400">
                    暂无匹配房源，请调整关键词或筛选条件
                  </div>
                )}
                {properties.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => loadDetail(p)}
                    className={`p-5 cursor-pointer transition-all hover:bg-emerald-50/30 ${selectedProperty?.id === p.id ? "bg-emerald-50/50 border-l-4 border-emerald-500" : ""}`}
                  >
                    <div className="flex gap-4">
                      <div className="w-48 h-32 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                        <Home className="w-12 h-12 text-white/50" />
                        {isEnabled(p.has_vr) && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded font-medium">VR</span>
                        )}
                        {isEnabled(p.is_featured) && (
                          <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded font-medium">精选</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900 hover:text-emerald-600">{p.title}</h4>
                            {isEnabled(p.has_inspection) && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">实勘</span>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="flex items-center justify-end gap-2">
                              <div className="text-xl font-bold text-red-500">
                                {p.price.toLocaleString()}
                                <span className="text-sm font-normal text-gray-500 ml-1">{p.type === "sale" ? "万" : "元/月"}</span>
                              </div>
                              {(() => {
                                const trend = getPriceTrend(p);
                                if (!trend) return null;
                                return (
                                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${trend.isUp ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"}`} title="近30天价格变化">
                                    {trend.isUp ? "↑" : "↓"} {Math.abs(Number(trend.pct))}%
                                  </span>
                                );
                              })()}
                            </div>
                            <div className="text-xs text-gray-400">{p.type === "sale" ? `${Math.round(p.price * 10000 / p.area)}元/㎡` : `${Math.round(p.price / p.area)}元/㎡`}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                          <span>{p.rooms}室{p.halls}厅 · {p.area}㎡</span>
                          <span>·</span>
                          <span>{p.floor}/{p.total_floors}层</span>
                          <span>·</span>
                          <span>{p.orientation}向</span>
                          <span>·</span>
                          <span>{p.decoration}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{p.district} · {p.community_name}</span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">经纪人：{p.agent_name}</span>
                            {isEnabled(p.agent_certified) && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">我爱我家认证</span>}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> 查看详情</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-5 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">共 {total} 条 · 第 {page}/{totalPages} 页</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-2 text-sm bg-emerald-500 text-white rounded-lg">{page}</span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-6">
            {selectedProperty ? (
              <div className="space-y-5">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{selectedProperty.title}</h3>
                  <div className="text-2xl font-bold text-red-500 mt-2">
                    {selectedProperty.price.toLocaleString()}
                    <span className="text-sm font-normal text-gray-500 ml-1">{selectedProperty.type === "sale" ? "万" : "元/月"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{selectedProperty.rooms}室{selectedProperty.halls}厅</div>
                    <div className="text-xs text-gray-500 mt-1">户型</div>
                  </div>
                  <div className="text-center border-x border-gray-200">
                    <div className="font-bold text-gray-900">{selectedProperty.area}㎡</div>
                    <div className="text-xs text-gray-500 mt-1">建筑面积</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{selectedProperty.orientation}</div>
                    <div className="text-xs text-gray-500 mt-1">朝向</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">楼层</span><span>{selectedProperty.floor}/{selectedProperty.total_floors}层</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">装修</span><span>{selectedProperty.decoration}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">小区</span><span>{selectedProperty.community_name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">区域</span><span>{selectedProperty.district}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">建成年代</span><span>{selectedProperty.year_built}年</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">学区</span><span>{selectedProperty.school_district || "-"}</span></div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">专属经纪人</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                      {selectedProperty.agent_name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {selectedProperty.agent_name}
                        {isEnabled(selectedProperty.agent_certified) && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                      </div>
                      <div className="text-xs text-gray-500">{selectedProperty.store_name}</div>
                    </div>
                    <button
                      onClick={() => setNotice(`${selectedProperty.agent_name} 已收到联系请求，将通过门店电话回访`)}
                      className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      联系TA
                    </button>
                  </div>
                </div>

                {selectedProperty.priceTrends?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">价格趋势 (近12个月)</h4>
                    <div className="h-28 flex items-end gap-1">
                      {selectedProperty.priceTrends.map((t: any, i: number) => (
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-sm"
                            style={{
                              height: `${((t.price - Math.min(...selectedProperty.priceTrends.map((x: any) => x.price))) /
                                (Math.max(...selectedProperty.priceTrends.map((x: any) => x.price)) -
                                  Math.min(...selectedProperty.priceTrends.map((x: any) => x.price)) || 1)) * 80 + 20}%`,
                            }}
                            title={`${t.trend_date}: ${t.price}万`}
                          />
                          <span className="text-[10px] text-gray-400 mt-1">{t.trend_date.slice(5, 7)}月</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isEnabled(selectedProperty.has_vr) && (
                  <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2">
                    <Eye className="w-5 h-5" />
                    VR 线上带看
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <Home className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p>请选择一套房源查看详情</p>
                <p className="text-xs mt-2">含 VR 带看、实勘信息、价格趋势、经纪人信息</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
