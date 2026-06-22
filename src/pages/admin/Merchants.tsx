import { useState, useMemo } from "react";
import { Search, Plus, Eye, Edit2, Trash2, CheckCircle, Clock, XCircle, AlertTriangle, Store, MapPin, Phone } from "lucide-react";
import { adminMerchants } from "@/data/admin";
import type { AdminMerchant } from "@/types";

export default function AdminMerchants() {
  const [searchText, setSearchText] = useState("");
  const [qualificationFilter, setQualificationFilter] = useState("全部");
  const [businessFilter, setBusinessFilter] = useState("全部");
  const [selectedMerchant, setSelectedMerchant] = useState<AdminMerchant | null>(null);

  const qualificationColors: Record<string, string> = {
    未提交: "bg-rock-100 text-rock-500",
    待审核: "bg-amber-50 text-amber-600",
    已通过: "bg-jade-50 text-jade-600",
    已拒绝: "bg-ember-50 text-ember-600",
    已过期: "bg-purple-50 text-purple-600",
  };

  const businessColors: Record<string, string> = {
    营业中: "bg-jade-50 text-jade-600",
    休息中: "bg-amber-50 text-amber-600",
    已停业: "bg-rock-100 text-rock-500",
  };

  const qualificationIcons: Record<string, typeof CheckCircle> = {
    未提交: Clock,
    待审核: Clock,
    已通过: CheckCircle,
    已拒绝: XCircle,
    已过期: AlertTriangle,
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("zh-CN") : "-";

  const filteredMerchants = useMemo(() => {
    return adminMerchants.filter((m) => {
      const matchSearch = !searchText ||
        m.name.includes(searchText) ||
        m.contactName.includes(searchText) ||
        m.contactPhone.includes(searchText) ||
        m.township.includes(searchText);
      const matchQualification = qualificationFilter === "全部" || m.qualificationStatus === qualificationFilter;
      const matchBusiness = businessFilter === "全部" || m.businessStatus === businessFilter;
      return matchSearch && matchQualification && matchBusiness;
    });
  }, [searchText, qualificationFilter, businessFilter]);

  const resetFilters = () => {
    setSearchText("");
    setQualificationFilter("全部");
    setBusinessFilter("全部");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-rock-900">商户管理</h1>
          <p className="text-sm text-rock-500 mt-1">共 {adminMerchants.length} 家入驻商户，覆盖 {new Set(adminMerchants.map(m => m.township)).size} 个乡镇</p>
        </div>
        <button className="flex items-center gap-2 bg-jade-500 hover:bg-jade-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> 新增商户
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "已认证商户", value: adminMerchants.filter(m => m.qualificationStatus === "已通过").length, color: "text-jade-500", bg: "bg-jade-50" },
          { label: "待审核资质", value: adminMerchants.filter(m => m.qualificationStatus === "待审核").length, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "营业中", value: adminMerchants.filter(m => m.businessStatus === "营业中").length, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "资质已过期", value: adminMerchants.filter(m => m.qualificationStatus === "已过期").length, color: "text-purple-500", bg: "bg-purple-50" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-rock-100`}>
            <p className="text-sm text-rock-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
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
              placeholder="搜索商户名称、联系人、电话、乡镇..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-rock-200 text-sm focus:outline-none focus:border-jade-400 focus:ring-1 focus:ring-jade-400"
            />
          </div>
          <select
            value={qualificationFilter}
            onChange={(e) => setQualificationFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 focus:outline-none focus:border-jade-400"
          >
            <option>全部</option>
            <option>未提交</option>
            <option>待审核</option>
            <option>已通过</option>
            <option>已拒绝</option>
            <option>已过期</option>
          </select>
          <select
            value={businessFilter}
            onChange={(e) => setBusinessFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-rock-200 text-sm text-rock-600 focus:outline-none focus:border-jade-400"
          >
            <option>全部</option>
            <option>营业中</option>
            <option>休息中</option>
            <option>已停业</option>
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
                <th className="text-left px-4 py-3 font-medium">商户名称</th>
                <th className="text-left px-4 py-3 font-medium">经营分类</th>
                <th className="text-left px-4 py-3 font-medium">所在乡镇</th>
                <th className="text-left px-4 py-3 font-medium">联系人</th>
                <th className="text-left px-4 py-3 font-medium">发布量/浏览量</th>
                <th className="text-left px-4 py-3 font-medium">资质状态</th>
                <th className="text-left px-4 py-3 font-medium">营业状态</th>
                <th className="text-left px-4 py-3 font-medium">执照有效期</th>
                <th className="text-right px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredMerchants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <Search size={40} className="mx-auto text-rock-300 mb-3" />
                    <p className="text-rock-400">暂无符合条件的商户数据</p>
                  </td>
                </tr>
              ) : (
                filteredMerchants.map((m) => {
                  const QualIcon = qualificationIcons[m.qualificationStatus];
                  return (
                    <tr key={m.id} className="border-t border-rock-50 hover:bg-rock-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-jade-50 flex items-center justify-center">
                            <Store size={18} className="text-jade-500" />
                          </div>
                          <div>
                            <p className="font-medium text-rock-900">{m.name}</p>
                            <p className="text-xs text-rock-400">ID: {m.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {m.category.slice(0, 2).map((c) => (
                            <span key={c} className="px-1.5 py-0.5 rounded bg-rock-100 text-rock-500 text-xs">
                              {c}
                            </span>
                          ))}
                          {m.category.length > 2 && (
                            <span className="px-1.5 py-0.5 rounded bg-rock-100 text-rock-400 text-xs">+{m.category.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-rock-600">
                          <MapPin size={12} className="text-rock-400" />
                          {m.township}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-rock-700">{m.contactName}</p>
                        <p className="text-xs text-rock-400">{m.contactPhone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-rock-700">{m.postCount} 条</p>
                        <p className="text-xs text-rock-400">{m.viewCount.toLocaleString()} 浏览</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${qualificationColors[m.qualificationStatus]}`}>
                          <QualIcon size={10} />
                          {m.qualificationStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${businessColors[m.businessStatus]}`}>
                          {m.businessStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-rock-600">
                        {formatDate(m.licenseExpiry)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedMerchant(m)}
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
          <span>共 {filteredMerchants.length} 条记录</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 rounded border border-rock-200 hover:bg-rock-50">上一页</button>
            <button className="px-3 py-1 rounded bg-jade-500 text-white">1</button>
            <button className="px-3 py-1 rounded border border-rock-200 hover:bg-rock-50">下一页</button>
          </div>
        </div>
      </div>

      {selectedMerchant && (
        <div className="fixed inset-0 bg-rock-900/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMerchant(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-rock-100 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-rock-900">商户详情</h3>
              <button onClick={() => setSelectedMerchant(null)} className="text-rock-400 hover:text-rock-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-jade-50 flex items-center justify-center">
                  <Store size={28} className="text-jade-500" />
                </div>
                <div>
                  <h4 className="font-bold text-rock-900">{selectedMerchant.name}</h4>
                  <p className="text-sm text-rock-500">入驻时间：{formatDate(selectedMerchant.registerTime)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-rock-50 rounded-lg p-3">
                  <p className="text-rock-500 text-xs mb-1">资质状态</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${qualificationColors[selectedMerchant.qualificationStatus]}`}>
                    {selectedMerchant.qualificationStatus}
                  </span>
                </div>
                <div className="bg-rock-50 rounded-lg p-3">
                  <p className="text-rock-500 text-xs mb-1">营业状态</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${businessColors[selectedMerchant.businessStatus]}`}>
                    {selectedMerchant.businessStatus}
                  </span>
                </div>
                <div className="bg-rock-50 rounded-lg p-3">
                  <p className="text-rock-500 text-xs mb-1">信息发布量</p>
                  <p className="font-bold text-rock-900">{selectedMerchant.postCount} 条</p>
                </div>
                <div className="bg-rock-50 rounded-lg p-3">
                  <p className="text-rock-500 text-xs mb-1">累计浏览量</p>
                  <p className="font-bold text-rock-900">{selectedMerchant.viewCount.toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-rock-400 mt-0.5 flex-shrink-0" />
                  <span className="text-rock-700">{selectedMerchant.township} · {selectedMerchant.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-rock-400 flex-shrink-0" />
                  <span className="text-rock-700">{selectedMerchant.contactName} · {selectedMerchant.contactPhone}</span>
                </div>
              </div>
              <div>
                <p className="text-rock-500 text-xs mb-2">经营分类</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMerchant.category.map((c) => (
                    <span key={c} className="px-2 py-1 rounded bg-jade-50 text-jade-600 text-xs">{c}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button className="flex-1 py-2 rounded-lg bg-jade-500 hover:bg-jade-600 text-white text-sm font-medium">审核资质</button>
                <button className="flex-1 py-2 rounded-lg border border-rock-200 text-rock-600 hover:bg-rock-50 text-sm font-medium">编辑资料</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
