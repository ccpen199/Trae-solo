import { useState, useEffect } from "react";
import { Plus, X, Tag } from "lucide-react";
import { useStore } from "@/store";

export default function RecommendConfig() {
  const { recommendations, fetchRecommendations, toggleRecommendation } = useStore();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    name: "",
    tags: [] as string[],
    tagInput: "",
    ageMin: "",
    ageMax: "",
    jobTitle: "",
    benefitIds: "",
    benefitInput: "",
    priority: 5,
  });

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const addTag = () => {
    const tag = form.tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag], tagInput: "" }));
    }
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleSubmit = () => {
    setShowDialog(false);
    setForm({
      name: "",
      tags: [],
      tagInput: "",
      ageMin: "",
      ageMax: "",
      jobTitle: "",
      benefitIds: "",
      benefitInput: "",
      priority: 5,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif">推荐配置</h1>
          <p className="text-gray-500 mt-1">福利推荐规则与个性化配置</p>
        </div>
        <button onClick={() => setShowDialog(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          新建规则
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">规则名称</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">条件标签</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">关联福利</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">优先级</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">启用</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map((rule) => (
              <tr key={rule.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{rule.name}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {rule.conditions.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-union-red/10 text-union-red text-xs rounded-full"
                      >
                        <Tag size={10} />
                        {tag}
                      </span>
                    ))}
                    {rule.conditions.ageRange && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                        {rule.conditions.ageRange[0]}-{rule.conditions.ageRange[1]}岁
                      </span>
                    )}
                    {rule.conditions.jobTitle && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-union-gold/10 text-union-gold text-xs rounded-full">
                        {rule.conditions.jobTitle}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{rule.benefitIds.length} 项福利</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-bold ${
                        rule.priority >= 8
                          ? "bg-union-red/10 text-union-red"
                          : rule.priority >= 5
                          ? "bg-union-gold/10 text-union-gold"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {rule.priority}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleRecommendation(rule.id, !rule.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      rule.enabled ? "bg-union-red" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
                        rule.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </td>
              </tr>
            ))}
            {recommendations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  暂无推荐规则
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowDialog(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">新建推荐规则</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">规则名称</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="请输入规则名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">条件标签</label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={form.tagInput}
                    onChange={(e) => setForm((prev) => ({ ...prev, tagInput: e.target.value }))}
                    className="input-field flex-1"
                    placeholder="输入标签后按回车添加"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <button onClick={addTag} className="btn-outline px-3">
                    添加
                  </button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {form.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-union-red/10 text-union-red text-xs rounded-full"
                      >
                        {tag}
                        <button onClick={() => removeTag(tag)}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最小年龄</label>
                  <input
                    type="number"
                    value={form.ageMin}
                    onChange={(e) => setForm((prev) => ({ ...prev, ageMin: e.target.value }))}
                    className="input-field"
                    placeholder="如：18"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最大年龄</label>
                  <input
                    type="number"
                    value={form.ageMax}
                    onChange={(e) => setForm((prev) => ({ ...prev, ageMax: e.target.value }))}
                    className="input-field"
                    placeholder="如：60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">职务</label>
                <input
                  value={form.jobTitle}
                  onChange={(e) => setForm((prev) => ({ ...prev, jobTitle: e.target.value }))}
                  className="input-field"
                  placeholder="如：部门经理"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">福利ID</label>
                <input
                  value={form.benefitInput}
                  onChange={(e) => setForm((prev) => ({ ...prev, benefitInput: e.target.value }))}
                  className="input-field"
                  placeholder="输入福利ID，用逗号分隔"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = form.benefitInput.trim();
                      if (val) {
                        setForm((prev) => ({
                          ...prev,
                          benefitIds: prev.benefitIds ? `${prev.benefitIds},${val}` : val,
                          benefitInput: "",
                        }));
                      }
                    }
                  }}
                />
                {form.benefitIds && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {form.benefitIds.split(",").map((id) => (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full"
                      >
                        {id}
                        <button
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              benefitIds: prev.benefitIds
                                .split(",")
                                .filter((b) => b !== id)
                                .join(","),
                            }))
                          }
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">优先级（1-10）</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.priority}
                  onChange={(e) => setForm((prev) => ({ ...prev, priority: Number(e.target.value) }))}
                  className="input-field w-24"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setShowDialog(false)} className="btn-outline">取消</button>
                <button onClick={handleSubmit} className="btn-primary">确认创建</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
