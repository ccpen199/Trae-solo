import { useState, useEffect } from "react";
import {
  revenues,
  contracts,
  assets,
  type Revenue,
  type Asset,
  type Contract,
  type RevenueSummary,
} from "@/lib/api";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  TrendingUp,
  AlertCircle,
  DollarSign,
  RefreshCw,
} from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  receivable: "应收",
  received: "实收",
  arrears: "欠缴",
  reduction: "减免",
  allocation: "分配",
};

const TYPE_COLORS: Record<string, string> = {
  receivable: "bg-blue-100 text-blue-700",
  received: "bg-green-100 text-green-700",
  arrears: "bg-red-100 text-red-700",
  reduction: "bg-yellow-100 text-yellow-700",
  allocation: "bg-purple-100 text-purple-700",
};

const TYPE_OPTIONS = [
  { value: "", label: "全部" },
  { value: "receivable", label: "应收" },
  { value: "received", label: "实收" },
  { value: "arrears", label: "欠缴" },
  { value: "reduction", label: "减免" },
  { value: "allocation", label: "分配" },
];

const YEAR_OPTIONS = [2022, 2023, 2024, 2025, 2026, 2027, 2028];

export default function Revenues() {
  const [list, setList] = useState<Revenue[]>([]);
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [assetList, setAssetList] = useState<Asset[]>([]);
  const [contractList, setContractList] = useState<Contract[]>([]);
  const [filterYear, setFilterYear] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterAsset, setFilterAsset] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [formAssetId, setFormAssetId] = useState("");
  const [formContractId, setFormContractId] = useState("");
  const [formType, setFormType] = useState("receivable");
  const [formAmount, setFormAmount] = useState("");
  const [formYear, setFormYear] = useState(String(new Date().getFullYear()));
  const [formPeriod, setFormPeriod] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const fetchList = async () => {
    setLoading(true);
    try {
      const data = await revenues.list({
        year: filterYear || undefined,
        type: filterType || undefined,
        asset_id: filterAsset || undefined,
      });
      setList(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await revenues.getSummary();
      setSummary(data);
    } catch {
      /* ignore */
    }
  };

  const fetchAssets = async () => {
    try {
      const data = await assets.list();
      setAssetList(data);
    } catch {
      /* ignore */
    }
  };

  const fetchContracts = async () => {
    try {
      const data = await contracts.list();
      setContractList(data);
    } catch {
      /* ignore */
    }
  };

  const refreshAll = async () => {
    await fetchList();
    await fetchSummary();
  };

  useEffect(() => {
    fetchSummary();
    fetchAssets();
    fetchContracts();
  }, []);

  useEffect(() => {
    fetchList();
  }, [filterYear, filterType, filterAsset]);

  const summaryTotals = summary
    ? {
        receivable: summary.byYear.reduce((s, y) => s + y.total_receivable, 0),
        received: summary.byYear.reduce((s, y) => s + y.total_received, 0),
        arrears: summary.byYear.reduce((s, y) => s + y.total_arrears, 0),
      }
    : { receivable: 0, received: 0, arrears: 0 };

  const filteredContracts = formAssetId
    ? contractList.filter((c) => c.asset_id === Number(formAssetId))
    : contractList;

  const openCreate = () => {
    setEditingId(null);
    setFormAssetId("");
    setFormContractId("");
    setFormType("receivable");
    setFormAmount("");
    setFormYear(String(new Date().getFullYear()));
    setFormPeriod("");
    setFormDescription("");
    setModalOpen(true);
  };

  const openEdit = (r: Revenue) => {
    setEditingId(r.id);
    setFormAssetId(String(r.asset_id));
    setFormContractId(String(r.contract_id));
    setFormType(r.type);
    setFormAmount(String(r.amount));
    setFormYear(String(r.year));
    setFormPeriod(r.period);
    setFormDescription(r.description);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formAssetId) {
      alert("请选择关联资产");
      return;
    }
    if (!formAmount) {
      alert("请填写金额");
      return;
    }
    const payload = {
      asset_id: Number(formAssetId),
      contract_id: formContractId ? Number(formContractId) : null,
      type: formType,
      amount: Number(formAmount),
      year: Number(formYear),
      period: formPeriod,
      description: formDescription,
    };
    try {
      if (editingId) {
        await revenues.update(editingId, payload);
      } else {
        await revenues.create(payload);
      }
      setModalOpen(false);
      setEditingId(null);
      await refreshAll();
    } catch (err: any) {
      console.error("Save failed:", err);
      alert("保存失败: " + (err.message || "未知错误"));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确认删除此收益记录？")) return;
    try {
      await revenues.delete(id);
      await refreshAll();
    } catch (err: any) {
      console.error("Delete failed:", err);
      alert("删除失败: " + (err.message || "未知错误"));
    }
  };

  const fmt = (n: number) => n.toLocaleString();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">收益流水</h1>
        <div className="flex gap-2">
          <button
            onClick={refreshAll}
            className="flex items-center gap-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw size={16} />
            刷新
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            新增
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-green-100">
            <TrendingUp className="text-green-600" size={24} />
          </div>
          <div>
            <div className="text-sm text-gray-500">应收总额</div>
            <div className="text-xl font-semibold text-green-600">
              ¥{fmt(summaryTotals.receivable)}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-100">
            <DollarSign className="text-blue-600" size={24} />
          </div>
          <div>
            <div className="text-sm text-gray-500">实收总额</div>
            <div className="text-xl font-semibold text-blue-600">
              ¥{fmt(summaryTotals.received)}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-red-100">
            <AlertCircle className="text-red-600" size={24} />
          </div>
          <div>
            <div className="text-sm text-gray-500">欠缴总额</div>
            <div className="text-xl font-semibold text-red-600">
              ¥{fmt(summaryTotals.arrears)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500">年度</label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">全部</option>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500">类型</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-500">关联资产</label>
          <select
            value={filterAsset}
            onChange={(e) => setFilterAsset(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">全部</option>
            {assetList.map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchList}
          className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Search size={16} />
          查询
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium">类型</th>
              <th className="px-4 py-3 text-left font-medium">关联资产</th>
              <th className="px-4 py-3 text-left font-medium">合同编号</th>
              <th className="px-4 py-3 text-right font-medium">金额(元)</th>
              <th className="px-4 py-3 text-center font-medium">年度</th>
              <th className="px-4 py-3 text-left font-medium">期间</th>
              <th className="px-4 py-3 text-left font-medium">说明</th>
              <th className="px-4 py-3 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  加载中...
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              list.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        TYPE_COLORS[r.type] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {TYPE_LABELS[r.type] ?? r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">{r.asset_name ?? "-"}</td>
                  <td className="px-4 py-3">{r.contract_no ?? "-"}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {fmt(r.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">{r.year}</td>
                  <td className="px-4 py-3">{r.period || "-"}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate">
                    {r.description || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(r)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId ? "编辑收益" : "新增收益"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">关联资产 *</label>
                <select
                  value={formAssetId}
                  onChange={(e) => {
                    setFormAssetId(e.target.value);
                    setFormContractId("");
                  }}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">请选择</option>
                  {assetList.map((a) => (
                    <option key={a.id} value={String(a.id)}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">合同编号</label>
                <select
                  value={formContractId}
                  onChange={(e) => setFormContractId(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">请选择</option>
                  {filteredContracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.contract_no}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">类型</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm"
                >
                  {TYPE_OPTIONS.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">金额(元) *</label>
                  <input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">年度</label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">期间</label>
                <input
                  type="text"
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value)}
                  placeholder="如: Q1, 1月-3月"
                  className="border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-600">说明</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="border rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
