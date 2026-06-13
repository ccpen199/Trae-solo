import { useState } from "react";
import {
  Upload,
  Camera,
  FileSpreadsheet,
  Download,
  Plus,
  CheckCircle2,
  AlertCircle,
  Trash2,
  User,
  Phone,
  MapPin,
  Package,
  Scale,
  Truck,
  Image as ImageIcon,
  Sparkles,
  Eye,
  ClipboardPaste,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import type { ExpressOrder, Address } from "@/types";

type TabKey = "manual" | "batch" | "ocr";

const expressCompanies = [
  { name: "顺丰速运", code: "SF", color: "bg-ink-800" },
  { name: "京东物流", code: "JD", color: "bg-ember-500" },
  { name: "中通快递", code: "ZTO", color: "bg-mint-500" },
  { name: "圆通速递", code: "YTO", color: "bg-alert-500" },
  { name: "申通快递", code: "STO", color: "bg-ink-500" },
  { name: "韵达速递", code: "YD", color: "bg-ink-600" },
  { name: "极兔速递", code: "JT", color: "bg-mint-600" },
  { name: "邮政EMS", code: "EMS", color: "bg-alert-600" },
];

function pad(n: number, w = 2) {
  return n.toString().padStart(w, "0");
}

function genOrderNo() {
  return `SY${Date.now().toString().slice(-6)}${pad(Math.floor(Math.random() * 900 + 100), 3)}`;
}

function genTrackingNo(code: string) {
  return `${code}${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 9000 + 1000)}`;
}

interface ManualForm {
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderProvince: string;
  senderCity: string;
  senderDistrict: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverProvince: string;
  receiverCity: string;
  receiverDistrict: string;
  items: string;
  weight: string;
  expressCompany: string;
  expressCompanyCode: string;
}

const emptyForm: ManualForm = {
  senderName: "",
  senderPhone: "",
  senderAddress: "",
  senderProvince: "",
  senderCity: "",
  senderDistrict: "",
  receiverName: "",
  receiverPhone: "",
  receiverAddress: "",
  receiverProvince: "",
  receiverCity: "",
  receiverDistrict: "",
  items: "",
  weight: "",
  expressCompany: "",
  expressCompanyCode: "",
};

interface BatchRow {
  id: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  items: string;
  weight: string;
  expressCompany: string;
  valid: boolean;
  errors?: string[];
}

interface OcrField {
  label: string;
  value: string;
  confidence: number;
}

export default function OrderEntry() {
  const [activeTab, setActiveTab] = useState<TabKey>("manual");
  const { addOrder } = useAppStore();

  const [form, setForm] = useState<ManualForm>(emptyForm);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [batchRows, setBatchRows] = useState<BatchRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrFields, setOcrFields] = useState<OcrField[]>([]);
  const [ocrRecognizing, setOcrRecognizing] = useState(false);

  const tabs = [
    { key: "manual" as const, label: "手动录单", icon: ClipboardPaste },
    { key: "batch" as const, label: "批量下单", icon: FileSpreadsheet },
    { key: "ocr" as const, label: "OCR识别录单", icon: Camera },
  ];

  const handleFormChange = (field: keyof ManualForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCompanySelect = (name: string, code: string) => {
    setForm((prev) => ({ ...prev, expressCompany: name, expressCompanyCode: code }));
  };

  const handleManualSubmit = () => {
    if (
      !form.senderName || !form.senderPhone || !form.senderAddress ||
      !form.receiverName || !form.receiverPhone || !form.receiverAddress ||
      !form.items || !form.weight || !form.expressCompany
    ) {
      return;
    }

    const sender: Address = {
      name: form.senderName,
      phone: form.senderPhone,
      address: form.senderAddress,
      province: form.senderProvince || "上海市",
      city: form.senderCity || "上海市",
      district: form.senderDistrict || "浦东新区",
    };
    const receiver: Address = {
      name: form.receiverName,
      phone: form.receiverPhone,
      address: form.receiverAddress,
      province: form.receiverProvince || "浙江省",
      city: form.receiverCity || "杭州市",
      district: form.receiverDistrict || "西湖区",
    };

    const orderNo = genOrderNo();
    const trackingNo = genTrackingNo(form.expressCompanyCode);
    const weight = parseFloat(form.weight) || 1;

    const newOrder: ExpressOrder = {
      id: `o-${Date.now()}`,
      orderNo,
      trackingNo,
      expressCompany: form.expressCompany,
      expressCompanyCode: form.expressCompanyCode,
      branchId: "b-001",
      courierId: "u-courier-001",
      courierName: "李大勇",
      sender,
      receiver,
      weight,
      items: form.items,
      price: +(weight * 5.8 + 8).toFixed(2),
      status: "pending_pickup",
      createdAt: new Date().toISOString(),
    };

    addOrder(newOrder);
    setSubmitSuccess(true);
    setForm(emptyForm);
    setTimeout(() => setSubmitSuccess(false), 3000);
  };

  const handleTemplateDownload = () => {
    const header = "发件人姓名,发件人电话,发件人地址,收件人姓名,收件人电话,收件人地址,物品名称,重量(kg),快递公司";
    const sample1 = "陈先生,13812345678,上海市浦东新区张江路88号,李女士,13987654321,杭州市西湖区文三路100号,数码配件,1.5,顺丰速运";
    const sample2 = "王总,13700001111,北京市朝阳区建国路88号,刘经理,13611112222,深圳市南山区科技园南区,文件资料,0.5,京东物流";
    const csv = "\uFEFF" + [header, sample1, sample2].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "批量下单导入模板.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const simulateBatchUpload = () => {
    const mockRows: BatchRow[] = [
      {
        id: "r-1",
        senderName: "陈先生",
        senderPhone: "13812345678",
        senderAddress: "上海市浦东新区张江路88号",
        receiverName: "李女士",
        receiverPhone: "13987654321",
        receiverAddress: "杭州市西湖区文三路100号",
        items: "数码配件",
        weight: "1.5",
        expressCompany: "顺丰速运",
        valid: true,
      },
      {
        id: "r-2",
        senderName: "王总",
        senderPhone: "13700001111",
        senderAddress: "北京市朝阳区建国路88号",
        receiverName: "刘经理",
        receiverPhone: "13611112222",
        receiverAddress: "深圳市南山区科技园南区",
        items: "文件资料",
        weight: "0.5",
        expressCompany: "京东物流",
        valid: true,
      },
      {
        id: "r-3",
        senderName: "赵师傅",
        senderPhone: "13555556666",
        senderAddress: "广州市天河区珠江新城",
        receiverName: "",
        receiverPhone: "123",
        receiverAddress: "成都市武侯区人民南路",
        items: "生鲜食品",
        weight: "8.0",
        expressCompany: "",
        valid: false,
        errors: ["收件人姓名不能为空", "收件人电话格式错误", "请选择快递公司"],
      },
      {
        id: "r-4",
        senderName: "孙小姐",
        senderPhone: "13899990000",
        senderAddress: "南京市玄武区中山路100号",
        receiverName: "周先生",
        receiverPhone: "13900001111",
        receiverAddress: "武汉市江汉区解放大道",
        items: "服装鞋帽",
        weight: "2.3",
        expressCompany: "中通快递",
        valid: true,
      },
      {
        id: "r-5",
        senderName: "吴女士",
        senderPhone: "13722223333",
        senderAddress: "成都市武侯区天府大道",
        receiverName: "郑先生",
        receiverPhone: "13833334444",
        receiverAddress: "西安市雁塔区高新路",
        items: "美妆护肤",
        weight: "0.8",
        expressCompany: "圆通速递",
        valid: true,
      },
    ];
    setBatchRows(mockRows);
    setUploadedFileName("批量订单_20260613.csv");
  };

  const handleBatchRemove = (id: string) => {
    setBatchRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleBatchImport = () => {
    const validRows = batchRows.filter((r) => r.valid);
    validRows.forEach((row) => {
      const company = expressCompanies.find((c) => c.name === row.expressCompany) || expressCompanies[0];
      const sender: Address = {
        name: row.senderName,
        phone: row.senderPhone,
        address: row.senderAddress,
        province: "上海市",
        city: "上海市",
        district: "浦东新区",
      };
      const receiver: Address = {
        name: row.receiverName,
        phone: row.receiverPhone,
        address: row.receiverAddress,
        province: "浙江省",
        city: "杭州市",
        district: "西湖区",
      };
      const weight = parseFloat(row.weight) || 1;
      const newOrder: ExpressOrder = {
        id: `o-${Date.now()}-${row.id}`,
        orderNo: genOrderNo(),
        trackingNo: genTrackingNo(company.code),
        expressCompany: company.name,
        expressCompanyCode: company.code,
        branchId: "b-001",
        courierId: "u-courier-001",
        courierName: "李大勇",
        sender,
        receiver,
        weight,
        items: row.items,
        price: +(weight * 5.8 + 8).toFixed(2),
        status: "pending_pickup",
        createdAt: new Date().toISOString(),
      };
      addOrder(newOrder);
    });
    setBatchRows([]);
    setUploadedFileName(null);
    alert(`成功导入 ${validRows.length} 条订单`);
  };

  const handleOcrImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setOcrImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOcrRecognize = () => {
    setOcrRecognizing(true);
    setTimeout(() => {
      setOcrFields([
        { label: "发件人姓名", value: "陈建国", confidence: 0.98 },
        { label: "发件人电话", value: "138-6821-5566", confidence: 0.95 },
        { label: "发件人地址", value: "上海市浦东新区张江高科技园区博云路2号", confidence: 0.89 },
        { label: "收件人姓名", value: "李明华", confidence: 0.97 },
        { label: "收件人电话", value: "139-1102-8899", confidence: 0.92 },
        { label: "收件人地址", value: "浙江省杭州市西湖区文三路478号华星时代广场", confidence: 0.76 },
        { label: "物品名称", value: "数码配件/电子产品", confidence: 0.84 },
        { label: "重量", value: "1.8 kg", confidence: 0.62 },
        { label: "快递公司", value: "顺丰速运", confidence: 0.96 },
      ]);
      setOcrRecognizing(false);
    }, 1500);
  };

  const getConfidenceColor = (c: number) => {
    if (c >= 0.9) return "bg-mint-50 text-mint-600 border-mint-200";
    if (c >= 0.8) return "bg-ember-50 text-ember-600 border-ember-200";
    return "bg-alert-50 text-alert-600 border-alert-200";
  };

  const getConfidenceBg = (c: number) => {
    if (c >= 0.9) return "bg-mint-500/10";
    if (c >= 0.8) return "bg-ember-500/10";
    return "bg-alert-500/10";
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-800 font-display">智能录单</h1>
        <p className="text-sm text-ink-400 mt-1">支持手动录入、批量导入、OCR智能识别多种录单方式</p>
      </div>

      <div className="app-card overflow-hidden">
        <div className="border-b border-ink-100 px-2 pt-2">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-t-lg transition-all",
                  activeTab === tab.key
                    ? "bg-white text-ember-600 border-b-2 border-ember-500 -mb-px"
                    : "text-ink-400 hover:text-ink-600 hover:bg-ink-50/50"
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === "manual" && (
            <div className="animate-slideUp">
              {submitSuccess && (
                <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-lg bg-mint-50 text-mint-700 border border-mint-200">
                  <CheckCircle2 size={18} />
                  <span className="text-sm font-medium">订单创建成功！已加入待揽收队列</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-ink-100">
                    <div className="w-8 h-8 rounded-lg bg-ink-800 text-white flex items-center justify-center">
                      <User size={16} />
                    </div>
                    <h3 className="font-semibold text-ink-800">发件人信息</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-600 mb-1.5">姓名</label>
                      <div className="relative">
                        <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                        <input
                          type="text"
                          className="input pl-9"
                          placeholder="请输入发件人姓名"
                          value={form.senderName}
                          onChange={(e) => handleFormChange("senderName", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-600 mb-1.5">手机号</label>
                      <div className="relative">
                        <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                        <input
                          type="tel"
                          className="input pl-9"
                          placeholder="请输入手机号"
                          value={form.senderPhone}
                          onChange={(e) => handleFormChange("senderPhone", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-600 mb-1.5">省份</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="省"
                        value={form.senderProvince}
                        onChange={(e) => handleFormChange("senderProvince", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-600 mb-1.5">城市</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="市"
                        value={form.senderCity}
                        onChange={(e) => handleFormChange("senderCity", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-600 mb-1.5">区县</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="区/县"
                        value={form.senderDistrict}
                        onChange={(e) => handleFormChange("senderDistrict", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-600 mb-1.5">详细地址</label>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3 top-3 text-ink-300" />
                      <textarea
                        className="input pl-9 min-h-[72px] resize-none"
                        placeholder="街道、门牌号等详细信息"
                        value={form.senderAddress}
                        onChange={(e) => handleFormChange("senderAddress", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-ink-100">
                    <div className="w-8 h-8 rounded-lg bg-ember-500 text-white flex items-center justify-center">
                      <MapPin size={16} />
                    </div>
                    <h3 className="font-semibold text-ink-800">收件人信息</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-600 mb-1.5">姓名</label>
                      <div className="relative">
                        <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                        <input
                          type="text"
                          className="input pl-9"
                          placeholder="请输入收件人姓名"
                          value={form.receiverName}
                          onChange={(e) => handleFormChange("receiverName", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-600 mb-1.5">手机号</label>
                      <div className="relative">
                        <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                        <input
                          type="tel"
                          className="input pl-9"
                          placeholder="请输入手机号"
                          value={form.receiverPhone}
                          onChange={(e) => handleFormChange("receiverPhone", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-600 mb-1.5">省份</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="省"
                        value={form.receiverProvince}
                        onChange={(e) => handleFormChange("receiverProvince", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-600 mb-1.5">城市</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="市"
                        value={form.receiverCity}
                        onChange={(e) => handleFormChange("receiverCity", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-600 mb-1.5">区县</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="区/县"
                        value={form.receiverDistrict}
                        onChange={(e) => handleFormChange("receiverDistrict", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-600 mb-1.5">详细地址</label>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3 top-3 text-ink-300" />
                      <textarea
                        className="input pl-9 min-h-[72px] resize-none"
                        placeholder="街道、门牌号等详细信息"
                        value={form.receiverAddress}
                        onChange={(e) => handleFormChange("receiverAddress", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-ink-100">
                <h3 className="font-semibold text-ink-800 mb-4 flex items-center gap-2">
                  <Package size={16} className="text-ink-500" />
                  包裹信息
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-600 mb-1.5">物品名称</label>
                    <div className="relative">
                      <Package size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                      <input
                        type="text"
                        className="input pl-9"
                        placeholder="如：数码配件、服装等"
                        value={form.items}
                        onChange={(e) => handleFormChange("items", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-600 mb-1.5">重量（kg）</label>
                    <div className="relative">
                      <Scale size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        className="input pl-9"
                        placeholder="请输入重量"
                        value={form.weight}
                        onChange={(e) => handleFormChange("weight", e.target.value)}
                      />
                    </div>
                  </div>
                  <div />
                </div>

                <div className="mt-5">
                  <label className="block text-sm font-medium text-ink-600 mb-3 flex items-center gap-2">
                    <Truck size={15} className="text-ink-500" />
                    选择快递公司
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {expressCompanies.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => handleCompanySelect(c.name, c.code)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                          form.expressCompanyCode === c.code
                            ? "border-ember-400 bg-ember-50 ring-2 ring-ember-500/15"
                            : "border-ink-200 hover:border-ink-300 bg-white"
                        )}
                      >
                        <div className={cn("w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0", c.color)}>
                          {c.code.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-ink-800 truncate">{c.name}</div>
                          <div className="text-[11px] text-ink-400">{c.code}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-ink-100 flex items-center justify-between">
                <div className="text-sm text-ink-400">
                  {form.weight && form.expressCompany ? (
                    <span>预估运费：<span className="text-ember-600 font-semibold">¥{(parseFloat(form.weight) * 5.8 + 8).toFixed(2)}</span></span>
                  ) : (
                    <span>填写重量和快递公司后自动计算运费</span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button className="btn-outline" onClick={() => setForm(emptyForm)}>
                    重置
                  </button>
                  <button className="btn-primary" onClick={handleManualSubmit}>
                    <Plus size={16} />
                    创建订单
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "batch" && (
            <div className="animate-slideUp space-y-6">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-3">
                  <button className="btn-outline" onClick={handleTemplateDownload}>
                    <Download size={16} />
                    下载导入模板
                  </button>
                  <button className="btn-outline" onClick={simulateBatchUpload}>
                    <Upload size={16} />
                    选择文件
                  </button>
                </div>
                {batchRows.length > 0 && (
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-ink-400">
                      共 <span className="font-semibold text-ink-700">{batchRows.length}</span> 条，
                      有效 <span className="font-semibold text-mint-600">{batchRows.filter(r => r.valid).length}</span> 条，
                      异常 <span className="font-semibold text-alert-600">{batchRows.filter(r => !r.valid).length}</span> 条
                    </span>
                    <button className="btn-primary" onClick={handleBatchImport}>
                      <CheckCircle2 size={16} />
                      模拟导入订单
                    </button>
                  </div>
                )}
              </div>

              {batchRows.length === 0 && (
                <div
                  className={cn(
                    "border-2 border-dashed rounded-xl p-16 text-center transition-all",
                    isDragging
                      ? "border-ember-400 bg-ember-50/50"
                      : "border-ink-200 hover:border-ink-300 bg-ink-50/30"
                  )}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    simulateBatchUpload();
                  }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-ember-50 text-ember-500 flex items-center justify-center mx-auto mb-4">
                    <Upload size={28} />
                  </div>
                  <p className="text-lg font-medium text-ink-700 mb-1">拖拽 Excel/CSV 文件到此处</p>
                  <p className="text-sm text-ink-400 mb-5">支持 .xlsx、.xls、.csv 格式，单次最多 500 条</p>
                  <button className="btn-primary" onClick={simulateBatchUpload}>
                    <FileSpreadsheet size={16} />
                    选择文件上传
                  </button>
                  {uploadedFileName && (
                    <p className="mt-4 text-sm text-mint-600">已解析：{uploadedFileName}</p>
                  )}
                </div>
              )}

              {batchRows.length > 0 && (
                <div className="border border-ink-100 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-ink-50 border-b border-ink-100">
                        <tr>
                          <th className="text-left px-4 py-3 font-medium text-ink-500 whitespace-nowrap">状态</th>
                          <th className="text-left px-4 py-3 font-medium text-ink-500 whitespace-nowrap">发件人</th>
                          <th className="text-left px-4 py-3 font-medium text-ink-500 whitespace-nowrap">发件电话</th>
                          <th className="text-left px-4 py-3 font-medium text-ink-500 whitespace-nowrap">发件地址</th>
                          <th className="text-left px-4 py-3 font-medium text-ink-500 whitespace-nowrap">收件人</th>
                          <th className="text-left px-4 py-3 font-medium text-ink-500 whitespace-nowrap">收件电话</th>
                          <th className="text-left px-4 py-3 font-medium text-ink-500 whitespace-nowrap">收件地址</th>
                          <th className="text-left px-4 py-3 font-medium text-ink-500 whitespace-nowrap">物品</th>
                          <th className="text-left px-4 py-3 font-medium text-ink-500 whitespace-nowrap">重量</th>
                          <th className="text-left px-4 py-3 font-medium text-ink-500 whitespace-nowrap">快递</th>
                          <th className="text-left px-4 py-3 font-medium text-ink-500 whitespace-nowrap">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchRows.map((row) => (
                          <tr key={row.id} className="border-b border-ink-50 hover:bg-ink-50/50">
                            <td className="px-4 py-3">
                              {row.valid ? (
                                <span className="chip bg-mint-50 text-mint-600">
                                  <CheckCircle2 size={12} /> 有效
                                </span>
                              ) : (
                                <span className="chip bg-alert-50 text-alert-600" title={row.errors?.join("\n")}>
                                  <AlertCircle size={12} /> 异常
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-ink-700">{row.senderName}</td>
                            <td className="px-4 py-3 text-ink-600 font-mono text-xs">{row.senderPhone}</td>
                            <td className="px-4 py-3 text-ink-500 max-w-[180px] truncate" title={row.senderAddress}>{row.senderAddress}</td>
                            <td className="px-4 py-3 text-ink-700">{row.receiverName || "-"}</td>
                            <td className="px-4 py-3 text-ink-600 font-mono text-xs">{row.receiverPhone || "-"}</td>
                            <td className="px-4 py-3 text-ink-500 max-w-[180px] truncate" title={row.receiverAddress}>{row.receiverAddress || "-"}</td>
                            <td className="px-4 py-3 text-ink-600">{row.items}</td>
                            <td className="px-4 py-3 text-ink-600">{row.weight}kg</td>
                            <td className="px-4 py-3 text-ink-600">{row.expressCompany || "-"}</td>
                            <td className="px-4 py-3">
                              <button
                                className="text-ink-400 hover:text-alert-500 transition-colors p-1"
                                onClick={() => handleBatchRemove(row.id)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "ocr" && (
            <div className="animate-slideUp">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-ink-800 flex items-center gap-2">
                      <Camera size={16} className="text-ink-500" />
                      上传运单图片
                    </h3>
                    <span className="text-xs text-ink-400">支持 JPG、PNG 格式，大小不超过 10MB</span>
                  </div>

                  {!ocrImage ? (
                    <label className="block">
                      <div
                        className="border-2 border-dashed border-ink-200 rounded-xl p-12 text-center cursor-pointer hover:border-ember-400 hover:bg-ember-50/30 transition-all"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-ink-50 text-ink-400 flex items-center justify-center mx-auto mb-4">
                          <ImageIcon size={32} />
                        </div>
                        <p className="text-base font-medium text-ink-600 mb-1">点击或拖拽图片到此处</p>
                        <p className="text-sm text-ink-400">拍照或上传运单面单，自动识别录入</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleOcrImageSelect}
                      />
                    </label>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-ink-100">
                      <img src={ocrImage} alt="运单" className="w-full h-64 object-cover" />
                      <div className="absolute top-3 right-3 flex gap-2">
                        <label className="btn-ghost bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 text-xs cursor-pointer shadow-sm">
                          <Camera size={13} />
                          重新上传
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleOcrImageSelect}
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  <button
                    className={cn(
                      "w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
                      !ocrImage || ocrRecognizing
                        ? "bg-ink-100 text-ink-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-ink-800 to-ink-700 text-white hover:from-ink-700 hover:to-ink-600"
                    )}
                    onClick={handleOcrRecognize}
                    disabled={!ocrImage || ocrRecognizing}
                  >
                    {ocrRecognizing ? (
                      <>
                        <Sparkles size={16} className="animate-pulse" />
                        AI 识别中...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        开始 AI 识别
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-ink-800 flex items-center gap-2">
                      <Eye size={16} className="text-ember-500" />
                      识别结果
                    </h3>
                    {ocrFields.length > 0 && (
                      <span className="text-xs text-ink-400">
                        共识别 {ocrFields.length} 个字段，请核对后确认
                      </span>
                    )}
                  </div>

                  {ocrFields.length === 0 ? (
                    <div className="border border-ink-100 rounded-xl p-12 text-center bg-ink-50/30">
                      <div className="w-12 h-12 rounded-xl bg-ink-100 text-ink-300 flex items-center justify-center mx-auto mb-3">
                        <ClipboardPaste size={22} />
                      </div>
                      <p className="text-sm text-ink-400">上传运单图片并点击识别后，结果将显示在这里</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {ocrFields.map((field, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-all",
                            getConfidenceColor(field.confidence),
                            getConfidenceBg(field.confidence)
                          )}
                        >
                          <div className="flex-shrink-0 w-24 text-sm font-medium">{field.label}</div>
                          <div className="flex-1 text-sm text-ink-800 font-medium">{field.value}</div>
                          <div className="flex-shrink-0">
                            <span className={cn(
                              "chip border",
                              getConfidenceColor(field.confidence)
                            )}>
                              {(field.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}

                      <div className="pt-4 mt-2 border-t border-ink-100 flex gap-3 justify-end">
                        <button className="btn-outline">人工修正</button>
                        <button className="btn-primary">
                          <CheckCircle2 size={16} />
                          确认并创建订单
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
