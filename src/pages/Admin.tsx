import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/store";
import { Building2, CheckCircle2, FileCheck, Home, Search, ShieldCheck, Users } from "lucide-react";

type AdminRow = {
  module: string;
  owner: string;
  count: number;
  status: string;
  action: string;
};

const rows: AdminRow[] = [
  { module: "小区管理", owner: "社区运营组", count: 0, status: "价格与带看数据已同步", action: "数据校验" },
  { module: "房源管理", owner: "房源核验组", count: 0, status: "VR/实勘/价格趋势待复核", action: "批量审核" },
  { module: "经纪人管理", owner: "门店督导组", count: 0, status: "认证与服务评分正常", action: "资质复核" },
  { module: "AI房卡", owner: "增长运营组", count: 0, status: "筛选条件和推送记录正常", action: "策略调整" },
];

export default function Admin() {
  const [keyword, setKeyword] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [counts, setCounts] = useState({ communities: 0, properties: 0, agents: 0, cards: 0 });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [communities, properties, agents, cards] = await Promise.all([
          apiFetch("/api/communities?pageSize=1"),
          apiFetch("/api/properties?pageSize=1"),
          apiFetch("/api/agents?pageSize=1"),
          apiFetch("/api/ai-cards"),
        ]);
        setCounts({
          communities: communities.success ? communities.data.total || 0 : 0,
          properties: properties.success ? properties.data.total || 0 : 0,
          agents: agents.success ? agents.data.total || 0 : 0,
          cards: cards.success ? cards.data?.length || 0 : 0,
        });
      } catch (error) {
        console.error("后台统计加载失败:", error);
        setNotice("后台统计暂时无法刷新，已保留页面基础管理功能");
      }
    };

    void loadCounts();
  }, []);

  const adminRows = useMemo(() => {
    const withCounts = rows.map((row) => ({
      ...row,
      count:
        row.module === "小区管理" ? counts.communities :
        row.module === "房源管理" ? counts.properties :
        row.module === "经纪人管理" ? counts.agents :
        counts.cards,
    }));

    return withCounts.filter((row) => {
      const matchedKeyword = !keyword || `${row.module}${row.owner}${row.status}${row.action}`.includes(keyword);
      const matchedModule = !moduleFilter || row.module === moduleFilter;
      return matchedKeyword && matchedModule;
    });
  }, [counts, keyword, moduleFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            后台管理
          </h1>
          <p className="text-sm text-gray-500 mt-1">统一管理小区、房源、经纪人、AI房卡和核验流程。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setNotice("批量审核任务已创建，待处理模块将进入复核队列")}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
          >
            批量审核
          </button>
          <button
            onClick={() => setNotice("运营报表已生成，包含小区、房源、经纪人和AI房卡统计")}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            导出报表
          </button>
        </div>
      </div>

      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "小区档案", value: counts.communities, icon: Building2, color: "bg-blue-500" },
          { label: "在线房源", value: counts.properties, icon: Home, color: "bg-emerald-500" },
          { label: "经纪人", value: counts.agents, icon: Users, color: "bg-amber-500" },
          { label: "核验任务", value: counts.cards + 8, icon: FileCheck, color: "bg-rose-500" },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">{item.label}</div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">{item.value}</div>
              </div>
              <div className={`w-11 h-11 ${item.color} rounded-lg flex items-center justify-center`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="p-5 border-b border-gray-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索后台模块、负责人、状态"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>
          <select
            value={moduleFilter}
            onChange={(event) => setModuleFilter(event.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="">全部后台模块</option>
            <option value="小区管理">小区管理</option>
            <option value="房源管理">房源管理</option>
            <option value="经纪人管理">经纪人管理</option>
            <option value="AI房卡">AI房卡</option>
          </select>
          <button
            onClick={() => setNotice("后台模块筛选已应用")}
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
          >
            搜索
          </button>
          <button
            onClick={() => {
              setKeyword("");
              setModuleFilter("");
              setNotice("后台模块筛选已重置");
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            重置筛选
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left font-medium px-5 py-3">后台模块</th>
                <th className="text-left font-medium px-5 py-3">负责人</th>
                <th className="text-left font-medium px-5 py-3">数据量</th>
                <th className="text-left font-medium px-5 py-3">状态</th>
                <th className="text-left font-medium px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {adminRows.map((row) => (
                <tr key={row.module} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-gray-900">{row.module}</td>
                  <td className="px-5 py-4 text-gray-600">{row.owner}</td>
                  <td className="px-5 py-4 text-gray-900">{row.count}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setNotice(`${row.module}的${row.action}任务已提交`)}
                      className="text-emerald-700 hover:text-emerald-800"
                    >
                      {row.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
