import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  MapPin,
  Scale,
  Box,
  Warehouse,
  Shield,
  DollarSign,
  Truck,
  Info,
  Check,
  ChevronRight,
} from "lucide-react";
import { apiClient } from "@/api/client";
import type { LoadingMethod } from "@shared/types";

const steps = ["基本信息", "货物详情", "承运要求", "确认发布"];

const loadingMethods: Array<{ value: LoadingMethod; label: string; desc: string }> = [
  { value: "manual", label: "人工装卸", desc: "纯人力搬运" },
  { value: "forklift", label: "叉车装卸", desc: "叉车作业" },
  { value: "crane", label: "吊机装卸", desc: "起重设备" },
  { value: "conveyor", label: "传送带", desc: "流水线作业" },
];

const vehicleTypes = [
  "厢式货车",
  "高栏车",
  "平板车",
  "低平板车",
  "冷藏车",
  "自卸车",
];

const qualifications = [
  "冷链运输",
  "大件运输",
  "贵重物品",
  "危险品运输",
  "食品运输",
  "设备运输",
];

export default function CargoPublish() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    origin: "",
    destination: "",
    distance: 0,
    volume: 0,
    weight: 0,
    cargoType: "普通货物",
    loadingMethod: "" as LoadingMethod | "",
    insuranceRequired: false,
    insuranceAmount: 0,
    expectedPrice: 0,
    referencePrice: 0,
    requiredVehicleTypes: [] as string[],
    requiredQualifications: [] as string[],
  });

  const update = (k: string, v: any) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const toggleArray = (field: "requiredVehicleTypes" | "requiredQualifications", item: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }));
  };

  const canProceed = () => {
    if (step === 0) return form.title && form.origin && form.destination;
    if (step === 1) return form.volume > 0 && form.weight > 0 && form.loadingMethod && form.insuranceRequired !== undefined;
    if (step === 2) return form.expectedPrice > 0;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiClient.post("/cargo", {
        ...form,
        shipperId: "u_shipper_001",
      });
      navigate("/shipper/cargo/list");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">发布货源</h1>
        <p className="text-slate-500 text-sm mt-1">填写完整信息以获得更精准的司机匹配</p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                i <= step
                  ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={`text-sm font-medium ${
                i <= step ? "text-slate-800" : "text-slate-400"
              }`}
            >
              {s}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 rounded-full ${
                  i < step ? "bg-primary-500" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="card p-6">
        {step === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="label">
                <Package className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                货源标题
              </label>
              <input
                className="input-field"
                placeholder="如：上海→杭州 电子配件急运"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </div>
            <div>
              <label className="label">
                <MapPin className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                发货地
              </label>
              <input
                className="input-field"
                placeholder="请输入详细发货地址"
                value={form.origin}
                onChange={(e) => update("origin", e.target.value)}
              />
            </div>
            <div>
              <label className="label">
                <MapPin className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                收货地
              </label>
              <input
                className="input-field"
                placeholder="请输入详细收货地址"
                value={form.destination}
                onChange={(e) => update("destination", e.target.value)}
              />
            </div>
            <div>
              <label className="label">运输里程（公里）</label>
              <input
                type="number"
                className="input-field"
                placeholder="0"
                value={form.distance || ""}
                onChange={(e) => update("distance", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">货物类型</label>
              <select
                className="input-field"
                value={form.cargoType}
                onChange={(e) => update("cargoType", e.target.value)}
              >
                <option>普通货物</option>
                <option>电子产品</option>
                <option>建筑材料</option>
                <option>生鲜食品</option>
                <option>服装鞋帽</option>
                <option>机械设备</option>
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-primary-50 border border-primary-100 flex items-start gap-3">
              <Info className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-primary-700">
                <p className="font-medium mb-1">以下信息为必填项</p>
                <p className="text-primary-600">
                  准确的体积、重量和装卸方式信息可帮助系统更精准匹配适合的车辆和司机
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="label">
                  <Box className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  货物体积 <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="input-field pr-12"
                    placeholder="0"
                    value={form.volume || ""}
                    onChange={(e) => update("volume", Number(e.target.value))}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    m³
                  </span>
                </div>
              </div>
              <div>
                <label className="label">
                  <Scale className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                  货物重量 <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="input-field pr-12"
                    placeholder="0"
                    value={form.weight || ""}
                    onChange={(e) => update("weight", Number(e.target.value))}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    吨
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="label">
                <Warehouse className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                装卸方式 <span className="text-danger">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {loadingMethods.map((m) => {
                  const active = form.loadingMethod === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => update("loadingMethod", m.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        active
                          ? "border-primary-500 bg-primary-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <p
                        className={`font-medium ${
                          active ? "text-primary-700" : "text-slate-800"
                        }`}
                      >
                        {m.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="label">
                <Shield className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                保险要求 <span className="text-danger">*</span>
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.insuranceRequired === true}
                    onChange={() => update("insuranceRequired", true)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm">需要保险</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.insuranceRequired === false}
                    onChange={() => update("insuranceRequired", false)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm">无需保险</span>
                </label>
              </div>
              {form.insuranceRequired && (
                <div className="mt-3">
                  <label className="label">投保金额（元）</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="请输入货物价值"
                    value={form.insuranceAmount || ""}
                    onChange={(e) =>
                      update("insuranceAmount", Number(e.target.value))
                    }
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="label">
                <Truck className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                要求车型（可多选）
              </label>
              <div className="flex flex-wrap gap-2">
                {vehicleTypes.map((vt) => {
                  const active = form.requiredVehicleTypes.includes(vt);
                  return (
                    <button
                      key={vt}
                      type="button"
                      onClick={() => toggleArray("requiredVehicleTypes", vt)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        active
                          ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-primary-300"
                      }`}
                    >
                      {vt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="label">
                <Shield className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                承运资质要求（可多选）
              </label>
              <div className="flex flex-wrap gap-2">
                {qualifications.map((q) => {
                  const active = form.requiredQualifications.includes(q);
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => toggleArray("requiredQualifications", q)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        active
                          ? "bg-secondary-500 text-white border-secondary-500 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-secondary-300"
                      }`}
                    >
                      {q}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="label">
                <DollarSign className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                期望运费
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  ¥
                </span>
                <input
                  type="number"
                  className="input-field pl-10 text-lg font-semibold text-primary-600"
                  placeholder="请输入期望价格"
                  value={form.expectedPrice || ""}
                  onChange={(e) =>
                    update("expectedPrice", Number(e.target.value))
                  }
                />
              </div>
              {form.expectedPrice > 0 && form.distance > 0 && (
                <p className="mt-2 text-sm text-slate-500">
                  折合单价：
                  <span className="font-semibold text-primary-600 ml-1">
                    ¥{(form.expectedPrice / form.distance).toFixed(2)}
                  </span>
                  /公里
                </p>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">信息确认</h3>
                  <p className="text-sm text-green-600">请核对以下货源信息</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-600">货源标题</p>
                  <p className="font-medium text-green-900">
                    {form.title || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-green-600">运输路线</p>
                  <p className="font-medium text-green-900">
                    {form.origin} → {form.destination}
                  </p>
                </div>
                <div>
                  <p className="text-green-600">体积/重量</p>
                  <p className="font-medium text-green-900">
                    {form.volume}m³ / {form.weight}吨
                  </p>
                </div>
                <div>
                  <p className="text-green-600">装卸方式</p>
                  <p className="font-medium text-green-900">
                    {loadingMethods.find((m) => m.value === form.loadingMethod)
                      ?.label || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-green-600">保险要求</p>
                  <p className="font-medium text-green-900">
                    {form.insuranceRequired
                      ? `需要（${form.insuranceAmount}元）`
                      : "无需"}
                  </p>
                </div>
                <div>
                  <p className="text-green-600">期望运费</p>
                  <p className="font-medium text-green-900">
                    ¥{form.expectedPrice}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-slate-500">
              <p>
                <Check className="w-4 h-4 inline mr-1 text-green-500" />
                系统将根据您的需求，自动匹配车型符合、资质齐全、履约分＞95%的优质司机
              </p>
              <p className="mt-1">
                <Check className="w-4 h-4 inline mr-1 text-green-500" />
                达成交易后将自动生成电子运单并进行区块链存证
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn-secondary disabled:opacity-50"
          >
            上一步
          </button>
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="btn-primary disabled:opacity-50"
            >
              下一步
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "发布中..." : "确认发布"}
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
