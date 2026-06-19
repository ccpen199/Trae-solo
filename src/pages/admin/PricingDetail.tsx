import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { mockPricingRules } from "@/data/mockData";

export default function PricingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const rule = mockPricingRules.find((r) => r.id === id);

  if (!rule) {
    return (
      <div className="card p-8 text-center">
        <p className="text-neutral-500">定价规则不存在</p>
        <button onClick={() => navigate("/admin/pricing")} className="btn-primary mt-4">
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <button
        onClick={() => navigate("/admin/pricing")}
        className="flex items-center gap-1 text-neutral-600 hover:text-eco-600"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>返回规则列表</span>
      </button>

      <div className="card p-6 space-y-5">
        <h3 className="text-lg font-bold text-neutral-800">编辑定价规则</h3>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="label-base">规则名称</label>
            <input type="text" defaultValue={rule.name} className="input-base" />
          </div>
          <div>
            <label className="label-base">适用品类</label>
            <select defaultValue={rule.category} className="input-base">
              <option value="clothing">衣物</option>
              <option value="books">图书</option>
              <option value="phones">手机数码</option>
              <option value="all">全品类</option>
            </select>
          </div>
          <div>
            <label className="label-base">优先级（数字越小优先级越高）</label>
            <input type="number" defaultValue={rule.priority} className="input-base" />
          </div>
          <div>
            <label className="label-base">定价方式</label>
            <select defaultValue={rule.formula.type} className="input-base">
              <option value="per_kg">按重量（元/kg）</option>
              <option value="per_item">按件数（元/件）</option>
              <option value="fixed">固定价</option>
            </select>
          </div>
          <div>
            <label className="label-base">基础价格（元）</label>
            <input type="number" defaultValue={rule.formula.basePrice} className="input-base" step="0.01" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked={rule.enabled} className="w-5 h-5 accent-eco-500" />
              <span className="text-neutral-700">启用此规则</span>
            </label>
          </div>
        </div>

        <div>
          <label className="label-base">条件规则</label>
          <div className="space-y-2">
            {rule.conditions.map((cond, idx) => (
              <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                <select defaultValue={cond.field as string} className="input-base !py-2">
                  <option value="weight">重量</option>
                  <option value="condition">成色</option>
                  <option value="brand">品牌</option>
                </select>
                <select defaultValue={cond.operator} className="input-base !py-2">
                  <option value="gt">大于</option>
                  <option value="lt">小于</option>
                  <option value="gte">大于等于</option>
                  <option value="lte">小于等于</option>
                  <option value="eq">等于</option>
                  <option value="in">包含</option>
                </select>
                <input
                  type="text"
                  defaultValue={Array.isArray(cond.value) ? cond.value.join(", ") : String(cond.value)}
                  className="input-base !py-2 flex-1"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-neutral-100">
          <button onClick={() => navigate("/admin/pricing")} className="btn-secondary">
            取消
          </button>
          <button className="btn-primary">
            <Save className="w-4 h-4 mr-2" />
            保存修改
          </button>
        </div>
      </div>
    </div>
  );
}
