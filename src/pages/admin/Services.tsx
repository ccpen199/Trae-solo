import { useState, useMemo } from "react";
import { Search, Plus, Edit2, Trash2, ToggleLeft, Building2, Users, TrendingUp, Clock, ExternalLink, Phone } from "lucide-react";

interface ServiceItem {
  id: string;
  name: string;
  category: "政务服务" | "生活服务" | "医疗服务" | "出行服务" | "就业服务" | "农技服务";
  provider: string;
  usage: number;
  status: boolean;
  description: string;
  township?: string;
  contactPhone?: string;
  monthlyGrowth?: number;
}

const servicesData: ServiceItem[] = [
  { id: "s001", name: "社保查询", category: "政务服务", provider: "镇雄县社保局", usage: 12453, status: true, description: "城乡居民养老保险、职工社保查询及缴费", contactPhone: "0870-3120001", monthlyGrowth: 8.5 },
  { id: "s002", name: "水电缴费", category: "生活服务", provider: "县供电/供水公司", usage: 28934, status: true, description: "居民用电、用水在线查询及缴费服务", contactPhone: "95598", monthlyGrowth: 12.3 },
  { id: "s003", name: "医疗挂号", category: "医疗服务", provider: "镇雄县人民医院", usage: 5621, status: true, description: "县人民医院、中医院等公立医院在线预约挂号", contactPhone: "0870-3125000", monthlyGrowth: 15.7 },
  { id: "s004", name: "交通出行查询", category: "出行服务", provider: "县交通局", usage: 8932, status: true, description: "长途客车班次、农村客运查询及购票", township: "全县覆盖", monthlyGrowth: 6.2 },
  { id: "s005", name: "证件办理预约", category: "政务服务", provider: "县政务服务中心", usage: 3421, status: false, description: "身份证、护照、营业执照等证件办理预约", contactPhone: "0870-3121000", monthlyGrowth: -2.1 },
  { id: "s006", name: "公积金查询", category: "政务服务", provider: "昭通市公积金中心", usage: 6789, status: true, description: "公积金账户余额查询、贷款计算", monthlyGrowth: 5.8 },
  { id: "s007", name: "就业招聘服务", category: "就业服务", provider: "县人社局", usage: 4521, status: true, description: "岗位推荐、招聘会信息、职业技能培训", township: "乌峰街道", contactPhone: "0870-3122000", monthlyGrowth: 22.4 },
  { id: "s008", name: "农技推广服务", category: "农技服务", provider: "县农业农村局", usage: 2134, status: true, description: "农作物病虫害防治、种植技术指导", township: "各乡镇农技站", monthlyGrowth: 18.9 },
  { id: "s009", name: "农村医保报销", category: "医疗服务", provider: "县医保局", usage: 9876, status: true, description: "城乡居民医疗保险报销查询及在线申报", contactPhone: "0870-3123000", monthlyGrowth: 9.4 },
  { id: "s010", name: "教育缴费服务", category: "生活服务", provider: "县教体局", usage: 7654, status: true, description: "中小学学费、教辅费在线缴纳", monthlyGrowth: 3.1 },
  { id: "s011", name: "低保五保申请", category: "政务服务", provider: "县民政局", usage: 1876, status: true, description: "低保、特困人员救助供养申请及进度查询", township: "覆盖所有乡镇", monthlyGrowth: 11.2 },
  { id: "s012", name: "法律咨询服务", category: "政务服务", provider: "县司法局", usage: 987, status: false, description: "免费法律咨询、法律援助申请", monthlyGrowth: -1.5 },
  { id: "s013", name: "燃气缴费", category: "生活服务", provider: "镇雄燃气公司", usage: 4321, status: true, description: "民用燃气在线缴费及报修服务", contactPhone: "0870-3127000", monthlyGrowth: 7.8 },
  { id: "s014", name: "乡村旅游导览", category: "出行服务", provider: "县文旅局", usage: 3210, status: true, description: "乡镇旅游景点、民宿、农家乐查询预订", township: "赤水源、芒部等", monthlyGrowth: 25.6 },
  { id: "s015", name: "非洲猪瘟防控", category: "农技服务", provider: "县畜牧局", usage: 654, status: true, description: "生猪疫情监测、防控知识、补贴申请", monthlyGrowth: 2.3 },
  { id: "s016", name: "智慧养老服务", category: "医疗服务", provider: "县卫健局", usage: 432, status: false, description: "居家养老、健康监测、上门服务预约", monthlyGrowth: 14.5 },
];

export default function AdminServices() {
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("全部");
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  const categoryColors: Record<string, string> = {
    政务服务: "bg-blue-50 text-blue-600",
    生活服务: "bg-jade-50 text-jade-600",
    医疗服务: "bg-pink-50 text-pink-600",
    出行服务: "bg-purple-50 text-purple-600",
    就业服务: "bg-ember-50 text-ember-600",
    农技服务: "bg-emerald-50 text-emerald-600",
  };

  const allCategories = Array.from(new Set(servicesData.map((s) => s.category)));

  const filteredServices = useMemo(() => {
    return servicesData.filter((s) => {
      const matchSearch = !searchText ||
        s.name.includes(searchText) ||
        s.provider.includes(searchText) ||
        (s.township && s.township.includes(searchText));
      const matchCategory = categoryFilter === "全部" || s.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [searchText, categoryFilter]);

  const resetFilters = () => {
    setSearchText("");
    setCategoryFilter("全部");
  };

  const enabledCount = servicesData.filter((s) => s.status).length;
  const totalUsage = servicesData.reduce((sum, s) => sum + s.usage, 0);
  const providerCount = new Set(servicesData.map((s) => s.provider)).size;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-rock-900">民生服务</h1>
          <p className="text-sm text-rock-500 mt-1">共接入 {servicesData.length} 项服务，{providerCount} 家服务提供方</p>
        </div>
        <button className="flex items-center gap-2 bg-jade-500 hover:bg-jade-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> 新增服务
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "已接入服务", value: enabledCount, suffix: `/${servicesData.length}`, icon: Building2, color: "text-jade-500", bg: "bg-jade-50" },
          { label: "累计使用量", value: totalUsage.toLocaleString(), icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "服务提供方", value: providerCount, icon: Building2, color: "text-purple-500", bg: "bg-purple-50" },
          { label: "待接入服务", value: servicesData.length - enabledCount, icon: Clock, color: "text-ember-500", bg: "bg-ember-50" },
        ].map(({ label, value, suffix, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4 border border-rock-100`}>
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
              placeholder="搜索服务名称、提供方、覆盖乡镇..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-rock-200 text-sm focus:outline-none focus:border-jade-400 focus:ring-1 focus:ring-jade-400"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 focus:outline-none focus:border-jade-400"
          >
            <option value="全部">全部分类</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
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
                <th className="text-left px-4 py-3 font-medium">服务名称</th>
                <th className="text-left px-4 py-3 font-medium">分类</th>
                <th className="text-left px-4 py-3 font-medium">提供方</th>
                <th className="text-left px-4 py-3 font-medium">覆盖范围</th>
                <th className="text-left px-4 py-3 font-medium">累计使用</th>
                <th className="text-left px-4 py-3 font-medium">月增长</th>
                <th className="text-left px-4 py-3 font-medium">状态</th>
                <th className="text-right px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Search size={40} className="mx-auto text-rock-300 mb-3" />
                    <p className="text-rock-400">暂无符合条件的民生服务</p>
                  </td>
                </tr>
              ) : (
                filteredServices.map((s) => (
                  <tr key={s.id} className="border-t border-rock-50 hover:bg-rock-50/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-rock-900">{s.name}</p>
                        <p className="text-xs text-rock-400 truncate max-w-xs">{s.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${categoryColors[s.category] || "bg-rock-100 text-rock-600"}`}>
                        {s.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-rock-700">{s.provider}</td>
                    <td className="px-4 py-3 text-rock-600 text-xs">
                      {s.township || "全县覆盖"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-rock-700">
                        <Users size={12} className="text-rock-400" />
                        {s.usage.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                        (s.monthlyGrowth || 0) >= 0 ? "text-jade-600" : "text-ember-600"
                      }`}>
                        <TrendingUp size={10} className={(s.monthlyGrowth || 0) < 0 ? "rotate-180" : ""} />
                        {(s.monthlyGrowth || 0) >= 0 ? "+" : ""}{s.monthlyGrowth?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${s.status ? "bg-jade-500" : "bg-rock-200"}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${s.status ? "translate-x-6" : "translate-x-1"}`} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedService(s)}
                          className="p-1.5 rounded hover:bg-rock-100 text-rock-500 hover:text-rock-700"
                          title="查看详情"
                        >
                          <ExternalLink size={16} />
                        </button>
                        <button className="p-1.5 rounded hover:bg-rock-100 text-rock-500 hover:text-rock-700" title="编辑">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-1.5 rounded hover:bg-rock-100 text-rock-500 hover:text-rock-700" title="启用/停用">
                          <ToggleLeft size={16} />
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
          <span>共 {filteredServices.length} 条记录</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 rounded border border-rock-200 hover:bg-rock-50">上一页</button>
            <button className="px-3 py-1 rounded bg-jade-500 text-white">1</button>
            <button className="px-3 py-1 rounded border border-rock-200 hover:bg-rock-50">下一页</button>
          </div>
        </div>
      </div>

      {selectedService && (
        <div className="fixed inset-0 bg-rock-900/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedService(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-rock-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-rock-900">服务详情</h3>
                <span className={`px-2 py-0.5 rounded text-xs ${categoryColors[selectedService.category]}`}>
                  {selectedService.category}
                </span>
              </div>
              <button onClick={() => setSelectedService(null)} className="text-rock-400 hover:text-rock-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h4 className="font-bold text-rock-900 text-lg">{selectedService.name}</h4>
                <p className="text-sm text-rock-500 mt-1">服务ID：{selectedService.id}</p>
              </div>
              <div className="bg-rock-50 rounded-xl p-4">
                <p className="text-sm text-rock-700 leading-relaxed">{selectedService.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-rock-50 rounded-lg p-3">
                  <p className="text-rock-500 text-xs mb-1">提供方</p>
                  <p className="font-medium text-rock-900">{selectedService.provider}</p>
                </div>
                <div className="bg-rock-50 rounded-lg p-3">
                  <p className="text-rock-500 text-xs mb-1">服务状态</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${selectedService.status ? "bg-jade-50 text-jade-600" : "bg-rock-100 text-rock-500"}`}>
                    {selectedService.status ? "已上线" : "未上线"}
                  </span>
                </div>
                <div className="bg-jade-50 rounded-lg p-3">
                  <p className="text-jade-600 text-xs mb-1">累计使用</p>
                  <p className="font-bold text-jade-700 text-lg">{selectedService.usage.toLocaleString()} 次</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-blue-600 text-xs mb-1">月增长率</p>
                  <p className={`font-bold text-lg ${(selectedService.monthlyGrowth || 0) >= 0 ? "text-jade-600" : "text-ember-600"}`}>
                    {(selectedService.monthlyGrowth || 0) >= 0 ? "+" : ""}{selectedService.monthlyGrowth?.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Building2 size={14} className="text-rock-400 mt-0.5 flex-shrink-0" />
                  <span className="text-rock-700">覆盖范围：{selectedService.township || "全县覆盖"}</span>
                </div>
                {selectedService.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-rock-400 flex-shrink-0" />
                    <a href={`tel:${selectedService.contactPhone}`} className="text-jade-600 hover:underline">
                      服务热线：{selectedService.contactPhone}
                    </a>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <button className="flex-1 py-2 rounded-lg bg-jade-500 hover:bg-jade-600 text-white text-sm font-medium">编辑服务</button>
                <button className="flex-1 py-2 rounded-lg border border-rock-200 text-rock-600 hover:bg-rock-50 text-sm font-medium">
                  {selectedService.status ? "下线服务" : "上线服务"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

