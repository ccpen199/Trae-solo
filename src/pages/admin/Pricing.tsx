import { useNavigate } from "react-router-dom";
import { Plus, Search, ToggleLeft, ToggleRight, Edit2, Trash2 } from "lucide-react";
import { mockPricingRules } from "@/data/mockData";
import { cn } from "@/lib/utils";

const categoryMap: Record<string, string> = {
  clothing: "衣物",
  books: "图书",
  phones: "手机数码",
  all: "全品类",
};

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索规则名称..."
              className="input-base pl-10"
            />
          </div>
        </div>
        <button className="btn-primary !py-2.5">
          <Plus className="w-4 h-4 mr-2" />
          新建规则
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-th">规则名称</th>
              <th className="table-th">适用品类</th>
              <th className="table-th">优先级</th>
              <th className="table-th">定价方式</th>
              <th className="table-th">基础价格</th>
              <th className="table-th">状态</th>
              <th className="table-th">操作</th>
            </tr>
          </thead>
          <tbody>
            {mockPricingRules.map((rule) => (
              <tr key={rule.id} className="hover:bg-neutral-50">
                <td className="table-td font-medium">{rule.name}</td>
                <td className="table-td">
                  <span className="badge bg-neutral-100 text-neutral-700">
                    {categoryMap[rule.category]}
                  </span>
                </td>
                <td className="table-td">{rule.priority}</td>
                <td className="table-td">
                  {rule.formula.type === "per_kg" ? "按重量" : rule.formula.type === "per_item" ? "按件数" : "固定价"}
                </td>
                <td className="table-td font-semibold text-eco-600">¥{rule.formula.basePrice}</td>
                <td className="table-td">
                  {rule.enabled ? (
                    <ToggleRight className="w-8 h-8 text-eco-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-neutral-300" />
                  )}
                </td>
                <td className="table-td">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/admin/pricing/${rule.id}`)}
                      className="text-eco-600 hover:text-eco-700 p-1"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="text-rose-500 hover:text-rose-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
