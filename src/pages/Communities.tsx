import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/store";
import { Building2, Search, MapPin, TrendingUp, TrendingDown, Eye, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, BarChart3 } from "lucide-react";

interface Community {
  id: number;
  name: string;
  district: string;
  address: string;
  school_district: string;
  property_company: string;
  year_built: number;
  avg_price: number;
  avg_rent: number;
  total_buildings: number;
  total_units: number;
  green_rate: number;
  description: string;
  latest_viewings_30d: number;
  latest_rent_change_pct: number;
  latest_price_change_pct: number;
  latest_avg_cycle_days: number;
  propertyCount: { type: string; cnt: number }[];
}

export default function Communities() {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [schools, setSchools] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [prevTotal, setPrevTotal] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ district: "", school_district: "", keyword: "" });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    loadDistricts();
    loadSchools();
  }, []);

  useEffect(() => {
    loadData();
  }, [page, searchTrigger]);

  const loadDistricts = async () => {
    try {
      const res = await apiFetch("/api/communities/districts");
      if (res.success) setDistricts(res.data);
    } catch (e: any) {
      console.error("加载区域数据失败:", e);
    }
  };

  const loadSchools = async () => {
    try {
      const res = await apiFetch("/api/communities/schools");
      if (res.success) setSchools(res.data);
    } catch (e: any) {
      console.error("加载学区数据失败:", e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "10" });
      if (filters.district) params.set("district", filters.district);
      if (filters.school_district) params.set("school_district", filters.school_district);
      if (filters.keyword) params.set("keyword", filters.keyword);
      const res = await apiFetch(`/api/communities?${params.toString()}`);
      if (res.success) {
        setCommunities(res.data.list);
        setTotal(res.data.total);
        const currentStillVisible = res.data.list.some((item: Community) => item.id === selectedId);
        if ((!selectedId || !currentStillVisible) && res.data.list.length > 0) {
          loadDetail(res.data.list[0].id);
        } else if (res.data.list.length === 0) {
          setSelectedId(null);
          setDetail(null);
        }
      } else {
        setError(res.message || "加载失败");
      }
    } catch (e: any) {
      setError(e.message || "网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: number) => {
    setSelectedId(id);
    try {
      const res = await apiFetch(`/api/communities/${id}`);
      if (res.success) setDetail(res.data);
    } catch (e: any) {
      console.error("加载小区详情失败:", e);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 10));
  const hasActiveFilters = filters.district || filters.school_district || filters.keyword;
  const activeFilterText = [
    filters.district ? `${filters.district}` : "",
    filters.school_district ? `学区：${filters.school_district}` : "",
    filters.keyword ? `关键词：${filters.keyword}` : "",
  ].filter(Boolean).join(" · ");

  const handleSearch = () => {
    setPrevTotal(total);
    setPage(1);
    setNotice(hasActiveFilters ? `已按当前条件筛选：${activeFilterText}` : "已刷新小区列表");
    setTimeout(() => setSearchTrigger(prev => prev + 1), 0);
  };

  const resetFilters = () => {
    setPrevTotal(total);
    setPage(1);
    setFilters({ district: "", school_district: "", keyword: "" });
    setNotice("已恢复默认筛选");
    setTimeout(() => setSearchTrigger(prev => prev + 1), 0);
  };

  const goToDashboard = (community: Community) => {
    const traceId = Date.now();
    localStorage.setItem('selectedCommunityId', String(community.id));
    localStorage.setItem('dashboardTraceId', String(traceId));
    localStorage.setItem('dashboardSource', 'communities');
    localStorage.setItem('dashboardCommunityName', community.name);
    const event = new CustomEvent('navigateToDashboard', {
      detail: {
        communityId: community.id,
        communityName: community.name,
        traceId,
        source: 'communities',
      },
    });
    window.dispatchEvent(event);
    navigate('/dashboard', {
      state: {
        communityId: community.id,
        communityName: community.name,
        traceId,
        source: 'communities',
      },
    });
    setNotice(`已跳转到数据看板：${community.name}（追踪ID：${traceId}）`);
  };

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
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索小区、学区、地址..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
          </div>
          <select
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
            value={filters.district}
            onChange={(e) => setFilters({ ...filters, district: e.target.value })}
          >
            <option value="">全部区域</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
            value={filters.school_district}
            onChange={(e) => setFilters({ ...filters, school_district: e.target.value })}
          >
            <option value="">全部学区</option>
            {schools.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={handleSearch}
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

      {hasActiveFilters && (
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-100 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              {prevTotal !== null && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">筛选前</span>
                    <span className="text-lg font-bold text-gray-700">{prevTotal}</span>
                    <span className="text-sm text-gray-500">个</span>
                  </div>
                  <div className="text-gray-400">→</div>
                </>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">筛选后</span>
                <span className="text-lg font-bold text-emerald-600">{total}</span>
                <span className="text-sm text-gray-500">个</span>
              </div>
              {prevTotal !== null && (() => {
                const diff = total - prevTotal;
                if (diff === 0) return <span className="text-sm text-gray-500">筛选条件无变化</span>;
                return (
                  <span className={`text-sm font-medium px-2 py-0.5 rounded ${diff < 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {diff < 0 ? "↓" : "↑"} {Math.abs(diff)} 个
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
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">小区列表 · 共 {total} 个</h3>
            </div>
            {loading ? (
              <div className="text-center py-16 text-gray-400">加载中...</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {communities.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => loadDetail(c.id)}
                    className={`p-5 cursor-pointer transition-all hover:bg-emerald-50/30 ${selectedId === c.id ? "bg-emerald-50/50 border-l-4 border-emerald-500" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{c.name}</h4>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{c.district}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <MapPin className="w-3.5 h-3.5" /> {c.address}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {c.school_district && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">学区：{c.school_district}</span>}
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{c.year_built}年建成</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{c.property_company}</span>
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">绿化率 {c.green_rate}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-red-500">{c.avg_price.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">元/㎡</div>
                        <div className="text-xs text-gray-400 mt-2">租金 {c.avg_rent.toLocaleString()} 元/月</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-xs text-gray-500">近30天带看</div>
                        <div className="text-lg font-bold text-blue-600 mt-1">{c.latest_viewings_30d || 0}</div>
                      </div>
                      <div className="text-center border-x border-gray-200">
                        <div className="text-xs text-gray-500">成交周期</div>
                        <div className="text-lg font-bold text-amber-600 mt-1">{c.latest_avg_cycle_days?.toFixed(0) || 0}天</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">租金涨幅</div>
                        <div className={`text-lg font-bold mt-1 flex items-center justify-center gap-1 ${(c.latest_rent_change_pct || 0) >= 0 ? "text-red-500" : "text-emerald-500"}`}>
                          {(c.latest_rent_change_pct || 0) >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {(c.latest_rent_change_pct || 0).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          goToDashboard(c);
                        }}
                        className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        查看数据看板
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-5 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">共 {total} 条 · 第 {page}/{totalPages} 页</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-2 text-sm bg-emerald-500 text-white rounded-lg">{page}</span>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-6">
            {detail ? (
              <div className="space-y-5">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-500" />
                    {detail.name}
                  </h3>
                  <div className="text-sm text-gray-500 mt-1">{detail.district} · {detail.address}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-red-50 rounded-lg text-center">
                    <div className="text-xs text-gray-500">挂牌均价</div>
                    <div className="text-xl font-bold text-red-500 mt-1">{detail.avg_price.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">元/㎡</div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg text-center">
                    <div className="text-xs text-gray-500">租金均价</div>
                    <div className="text-xl font-bold text-emerald-500 mt-1">{detail.avg_rent.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">元/月</div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">建成年代</span><span>{detail.year_built}年</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">物业公司</span><span>{detail.property_company}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">学区</span><span>{detail.school_district || "-"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">楼栋/户数</span><span>{detail.total_buildings}栋 / {detail.total_units}户</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">绿化率</span><span>{detail.green_rate}%</span></div>
                  {detail.propertyCount && detail.propertyCount.map((pc: any) => (
                    <div key={pc.type} className="flex justify-between">
                      <span className="text-gray-500">{pc.type === "sale" ? "在二手房" : "在租房源"}</span>
                      <span>{pc.cnt} 套</span>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">小区介绍</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{detail.description || "暂无介绍"}</p>
                </div>

                {detail.stats?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">近30天带看趋势</h4>
                    <div className="h-28 flex items-end gap-1">
                      {detail.stats.slice().reverse().map((s: any, i: number) => (
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm"
                            style={{ height: `${(s.viewings_30d / Math.max(...detail.stats.map((x: any) => x.viewings_30d || 1))) * 100}%` }}
                            title={`${s.stat_date}: ${s.viewings_30d}次`}
                          />
                          <span className="text-[10px] text-gray-400 mt-1">{s.stat_date.slice(5)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <Building2 className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p>请选择一个小区查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
