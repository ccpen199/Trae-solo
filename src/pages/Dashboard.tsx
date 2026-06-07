import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { apiFetch } from "@/store";
import { TrendingUp, TrendingDown, Eye, Clock, Building2, Home, AlertCircle } from "lucide-react";

interface Community {
  id: number;
  name: string;
  district: string;
  avg_price: number;
  avg_rent: number;
  year_built: number;
  latest_viewings_30d: number;
  latest_rent_change_pct: number;
  latest_price_change_pct: number;
  latest_avg_cycle_days: number;
}

export default function Dashboard() {
  const location = useLocation();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [stats, setStats] = useState({
    totalViewings: 0,
    avgCycleDays: 0,
    avgRentChange: 0,
    totalProperties: 0,
  });
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [communityStats, setCommunityStats] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [traceInfo, setTraceInfo] = useState<{ traceId: string; source: string; communityName: string } | null>(null);

  useEffect(() => {
    const source = localStorage.getItem('dashboardSource');
    const traceId = localStorage.getItem('dashboardTraceId');
    const communityName = localStorage.getItem('dashboardCommunityName');
    if (source && traceId && communityName) {
      setTraceInfo({ traceId, source, communityName });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleNavigate = (e: any) => {
      const { communityId, traceId, source, communityName } = e.detail;
      if (traceId && source && communityName) {
        setTraceInfo({ traceId: String(traceId), source, communityName });
      }
      if (communityId && communities.length > 0) {
        const target = communities.find((c: Community) => c.id === communityId);
        if (target) {
          loadCommunityStats(target);
        }
      }
    };
    window.addEventListener('navigateToDashboard', handleNavigate);
    return () => window.removeEventListener('navigateToDashboard', handleNavigate);
  }, [communities]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/communities?pageSize=100");
      if (res.success) {
        const list = res.data.list as Community[];
        const state = location.state as any;
        const requestedCommunityId = Number(state?.communityId || localStorage.getItem('selectedCommunityId') || 0);
        if (state?.traceId) {
          setTraceInfo({
            traceId: String(state.traceId),
            source: state.source || 'communities',
            communityName: state.communityName,
          });
        }
        setCommunities(list);
        setStats({
          totalViewings: list.reduce((s, c) => s + (c.latest_viewings_30d || 0), 0),
          avgCycleDays: list.length > 0 ? Math.round(list.reduce((s, c) => s + (c.latest_avg_cycle_days || 0), 0) / list.length) : 0,
          avgRentChange: list.length > 0 ? Math.round(list.reduce((s, c) => s + (c.latest_rent_change_pct || 0), 0) / list.length * 100) / 100 : 0,
          totalProperties: 128,
        });
        if (list.length > 0) {
          const target = list.find((c) => c.id === requestedCommunityId) || list[0];
          await loadCommunityStats(target);
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

  const loadCommunityStats = async (c: Community) => {
    setSelectedCommunity(c);
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await apiFetch(`/api/communities/${c.id}/stats`);
      if (res.success) {
        setCommunityStats(res.data);
      } else {
        setStatsError(res.message || "加载小区数据失败");
      }
    } catch (e: any) {
      console.error("加载小区数据失败:", e);
      setStatsError(e.message || "网络错误，请稍后重试");
    } finally {
      setStatsLoading(false);
    }
  };

  const StatCard = ({ title, value, unit, trend, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value.toLocaleString()}
            <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
          </p>
          {trend !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${trend >= 0 ? "text-red-500" : "text-emerald-500"}`}>
              {trend >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              <span>{trend >= 0 ? "+" : ""}{trend}%</span>
              <span className="text-gray-400 ml-1">较上月</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const chartRows = communityStats.slice().reverse();
  const maxViewings = Math.max(1, ...communityStats.map((x) => Number(x.viewings_30d) || 0));
  const maxCycleDays = Math.max(1, ...communityStats.map((x) => Number(x.avg_transaction_cycle_days) || 0));
  const maxRentAbs = Math.max(1, ...communityStats.map((x) => Math.abs(Number(x.rent_change_pct) || 0)));

  if (loading) return <div className="text-center py-20 text-gray-500">加载中...</div>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>数据加载失败：{error}</span>
        </div>
      )}
      {traceInfo && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
              <div>
                <div className="text-sm font-medium text-blue-800">联动追踪已激活</div>
                <div className="text-xs text-blue-600">
                  来源：{traceInfo.source === 'communities' ? '小区管理' : traceInfo.source} → 目标：{traceInfo.communityName}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-500">追踪ID</div>
              <div className="text-sm font-mono font-bold text-blue-700">{traceInfo.traceId}</div>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="近30天带看总量" value={stats.totalViewings} unit="次" icon={Eye} color="bg-gradient-to-br from-blue-500 to-blue-600" />
        <StatCard title="平均成交周期" value={stats.avgCycleDays} unit="天" icon={Clock} color="bg-gradient-to-br from-amber-500 to-orange-500" />
        <StatCard title="租金平均涨幅" value={stats.avgRentChange} unit="%" trend={stats.avgRentChange} icon={TrendingUp} color="bg-gradient-to-br from-rose-500 to-pink-500" />
        <StatCard title="活跃房源" value={stats.totalProperties} unit="套" icon={Home} color="bg-gradient-to-br from-emerald-500 to-teal-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-500" />
            小区列表
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {communities.map((c) => (
              <div
                key={c.id}
                onClick={() => loadCommunityStats(c)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${selectedCommunity?.id === c.id ? "bg-emerald-50 border-2 border-emerald-500" : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{c.district} · {c.year_built}年建成</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">{c.avg_price.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">元/㎡</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs">
                  <span className="text-gray-600">带看 <b className="text-blue-600">{c.latest_viewings_30d || 0}</b> 次</span>
                  <span className={`${(c.latest_rent_change_pct || 0) >= 0 ? "text-red-500" : "text-emerald-500"}`}>
                    租金 {(c.latest_rent_change_pct || 0) >= 0 ? "+" : ""}{(c.latest_rent_change_pct || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          {selectedCommunity ? (
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{selectedCommunity.name} - 数据看板</h3>
                  {traceInfo && traceInfo.communityName === selectedCommunity.name && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                        ✓ 联动校验通过
                      </span>
                      <span className="text-xs text-gray-400">
                        目标小区与追踪信息一致
                      </span>
                    </div>
                  )}
                  {traceInfo && traceInfo.communityName !== selectedCommunity.name && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium">
                        ⚠ 联动追踪：{traceInfo.communityName}
                      </span>
                      <span className="text-xs text-gray-400">
                        当前显示：{selectedCommunity.name}
                      </span>
                    </div>
                  )}
                </div>
                {traceInfo && (
                  <button
                    onClick={() => {
                      localStorage.removeItem('dashboardTraceId');
                      localStorage.removeItem('dashboardSource');
                      localStorage.removeItem('dashboardCommunityName');
                      setTraceInfo(null);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                  >
                    清除追踪
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-500">近30天带看量</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">{selectedCommunity.latest_viewings_30d || 0}</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-500">平均成交周期</div>
                  <div className="text-2xl font-bold text-amber-600 mt-1">{selectedCommunity.latest_avg_cycle_days?.toFixed(0) || 0} 天</div>
                </div>
                <div className="bg-rose-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-500">租金涨幅</div>
                  <div className={`text-2xl font-bold mt-1 ${(selectedCommunity.latest_rent_change_pct || 0) >= 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {(selectedCommunity.latest_rent_change_pct || 0) >= 0 ? "+" : ""}{(selectedCommunity.latest_rent_change_pct || 0).toFixed(1)}%
                  </div>
                </div>
              </div>

              {statsError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  数据加载失败：{statsError}
                </div>
              )}

              <h4 className="text-sm font-medium text-gray-700 mb-3">近30天趋势图</h4>
              {statsLoading ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="animate-pulse">加载趋势数据中...</div>
                </div>
              ) : communityStats.length > 0 ? (
                <div className="space-y-4">
                  <div className="h-40">
                    <div className="text-xs text-gray-500 mb-2">带看量趋势</div>
                    <div className="flex items-end h-28 gap-1">
                      {chartRows.map((s, i) => {
                        const height = Math.max(10, ((Number(s.viewings_30d) || 0) / maxViewings) * 100);
                        return (
                        <div key={i} className="flex-1 h-full flex flex-col items-center justify-end min-w-0">
                          <div
                            className="w-full max-w-8 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm shadow-sm"
                            style={{ height: `${height}%` }}
                            title={`${s.stat_date}: ${s.viewings_30d}次`}
                          />
                          <span className="text-[10px] text-gray-400 mt-1">{s.stat_date.slice(5)}</span>
                        </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="h-40">
                    <div className="text-xs text-gray-500 mb-2">成交周期趋势</div>
                    <div className="flex items-end h-28 gap-1">
                      {chartRows.map((s, i) => {
                        const height = Math.max(10, ((Number(s.avg_transaction_cycle_days) || 0) / maxCycleDays) * 100);
                        return (
                        <div key={i} className="flex-1 h-full flex flex-col items-center justify-end min-w-0">
                          <div
                            className="w-full max-w-8 bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-sm shadow-sm"
                            style={{ height: `${height}%` }}
                            title={`${s.stat_date}: ${s.avg_transaction_cycle_days?.toFixed(0)}天`}
                          />
                          <span className="text-[10px] text-gray-400 mt-1">{s.stat_date.slice(5)}</span>
                        </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="h-40">
                    <div className="text-xs text-gray-500 mb-2">租金涨幅趋势</div>
                    <div className="flex items-end h-28 gap-1">
                      {chartRows.map((s, i) => {
                        const rent = Number(s.rent_change_pct) || 0;
                        const height = Math.max(10, (Math.abs(rent) / maxRentAbs) * 100);
                        return (
                          <div key={i} className="flex-1 h-full flex flex-col items-center justify-end min-w-0">
                            <div
                              className={`w-full max-w-8 rounded-t-sm shadow-sm ${rent >= 0 ? "bg-gradient-to-t from-rose-500 to-rose-400" : "bg-gradient-to-t from-emerald-500 to-emerald-400"}`}
                              style={{ height: `${height}%` }}
                              title={`${s.stat_date}: ${rent.toFixed(1)}%`}
                            />
                            <span className="text-[10px] text-gray-400 mt-1">{s.stat_date.slice(5)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                !statsLoading && (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    暂无趋势数据
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <Building2 className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p>请从左侧选择一个小区查看详细数据看板</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
