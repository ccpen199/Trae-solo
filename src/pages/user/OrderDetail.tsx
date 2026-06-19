import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Phone,
  MessageCircle,
  MapPin,
  User,
  FileText,
  CreditCard,
  Recycle,
  Shirt,
  Sparkles,
  Clock,
  Truck,
  Microscope,
  CircleCheck,
  CircleDollarSign,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const timelineSteps = [
  { key: "booked", label: "预约成功", icon: Check, desc: "订单已提交，等待快递员接单" },
  { key: "accepted", label: "快递员已接单", icon: Truck, desc: "快递员张师傅（工号E2021）已接单" },
  { key: "picked", label: "已取件", icon: MapPin, desc: "快递员已完成取件，正在送往分拣中心" },
  { key: "inspecting", label: "质检中", icon: Microscope, desc: "分拣中心正在对物品进行质量检测" },
  { key: "priced", label: "已估价", icon: FileText, desc: "质检完成，已生成估价报告" },
  { key: "paid", label: "已打款", icon: CircleDollarSign, desc: "款项已打至您的收款账户" },
  { key: "done", label: "已完成", icon: Trophy, desc: "订单完成，感谢您为环保做出贡献" },
];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const currentStep = 3;

  const inspectionReport = {
    category: "衣服回收",
    quantity: "5.2kg",
    items: [
      { name: "T恤", count: 3, condition: "良好", price: 6.3 },
      { name: "牛仔裤", count: 2, condition: "较新", price: 14.0 },
      { name: "外套", count: 1, condition: "一般", price: 12.5 },
      { name: "卫衣", count: 2, condition: "良好", price: 12.2 },
    ],
    totalWeight: "5.2kg",
    totalPrice: 45.0,
    carbonSaved: 7.8,
  };

  const paymentInfo = {
    method: "支付宝",
    account: "138****8888",
    amount: 45.0,
    paidAt: "2026-06-18 14:32:18",
    orderNo: "RC20260618001",
    tradeNo: "2026061822001444830512345678",
  };

  const traceFlow = [
    { stage: "上门取件", location: "杭州市西湖区文三路 478 号", time: "06-18 10:30", done: true },
    { stage: "分拣中心", location: "杭州市余杭区绿回收分拣中心", time: "06-18 12:15", done: true },
    { stage: "质检分类", location: "杭州市余杭区绿回收质检车间", time: "06-18 14:00", done: true },
    { stage: "再生处理", location: "湖州市纺织再生工厂", time: "处理中", done: false },
    { stage: "公益捐赠/循环利用", location: "云南省红河州希望小学", time: "待分配", done: false },
  ];

  return (
    <div className="pb-8 animate-fade-in">
      <div className="sticky top-0 z-40 bg-gradient-to-r from-eco-500 to-eco-600 text-white">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 -ml-2 rounded-full hover:bg-white/15 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">订单详情</h1>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="card p-5 bg-gradient-to-br from-eco-500 to-eco-700 text-white relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-eco-300/20 rounded-full blur-xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <span className="font-bold">{timelineSteps[currentStep].label}</span>
            </div>
            <p className="mt-2 text-white/85 text-sm leading-relaxed">
              {timelineSteps[currentStep].desc}
            </p>
            <p className="mt-3 text-xs text-white/70">订单号：{id || "RC20260618001"}</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <div className="card p-5">
          <h3 className="font-bold text-neutral-800 mb-5 flex items-center gap-2">
            <CircleCheck className="w-5 h-5 text-eco-600" />
            订单进度
          </h3>
          <div className="relative">
            <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-neutral-200" />
            <div className="space-y-5">
              {timelineSteps.map((step, idx) => {
                const Icon = step.icon;
                const isDone = idx <= currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div key={step.key} className="relative flex gap-4 animate-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
                    <div
                      className={cn(
                        "relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                        isDone
                          ? "bg-gradient-to-br from-eco-400 to-eco-600 text-white shadow-md"
                          : "bg-white border-2 border-neutral-200 text-neutral-300"
                      )}
                    >
                      <Icon className="w-4 h-4" strokeWidth={2.5} />
                      {isCurrent && (
                        <span className="absolute inset-0 rounded-full bg-eco-400 animate-ping opacity-40" />
                      )}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className={cn("font-semibold text-sm", isDone ? "text-neutral-800" : "text-neutral-400")}>
                        {step.label}
                      </p>
                      <p className={cn("text-xs mt-0.5", isDone ? "text-neutral-500" : "text-neutral-300")}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <div className="card p-5">
          <h3 className="font-bold text-neutral-800 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-eco-600" />
            物流信息
          </h3>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-eco-50 to-emerald-50 border border-eco-100">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-eco-400 to-eco-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
              张
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-neutral-800">张师傅</p>
                <span className="badge bg-eco-100 text-eco-700">已接单</span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">工号 E2021 · 服务 3286 单</p>
              <p className="text-xs text-eco-600 mt-1.5 font-medium">预计 15 分钟后到达</p>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 hover:border-eco-400 hover:text-eco-600 transition-colors">
                <Phone className="w-4 h-4" />
              </button>
              <button className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-600 hover:border-eco-400 hover:text-eco-600 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="mt-4 h-36 rounded-xl bg-gradient-to-br from-eco-100 via-emerald-50 to-teal-100 flex items-center justify-center relative overflow-hidden">
            <MapPin className="w-8 h-8 text-eco-600 animate-bounce-slow absolute" />
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-4 left-8 w-24 h-0.5 bg-eco-300 rounded-full rotate-12" />
              <div className="absolute top-12 right-12 w-32 h-0.5 bg-eco-300 rounded-full -rotate-6" />
              <div className="absolute bottom-8 left-16 w-20 h-0.5 bg-eco-300 rounded-full rotate-3" />
            </div>
            <p className="text-eco-600 text-sm font-medium mt-12">地图加载中...</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <div className="card p-5">
          <h3 className="font-bold text-neutral-800 mb-4 flex items-center gap-2">
            <Microscope className="w-5 h-5 text-eco-600" />
            质检报告
          </h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-eco-100 to-emerald-100 flex items-center justify-center">
              <Shirt className="w-5.5 h-5.5 text-eco-600" />
            </div>
            <div>
              <p className="font-semibold text-neutral-800">{inspectionReport.category}</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                总重量 {inspectionReport.totalWeight} · {inspectionReport.items.length} 类物品
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-neutral-100 overflow-hidden">
            <div className="grid grid-cols-12 px-3 py-2.5 bg-neutral-50 text-xs font-semibold text-neutral-500">
              <div className="col-span-4">物品</div>
              <div className="col-span-2 text-center">数量</div>
              <div className="col-span-3 text-center">成色</div>
              <div className="col-span-3 text-right">金额</div>
            </div>
            {inspectionReport.items.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-12 px-3 py-2.5 text-sm border-t border-neutral-50 items-center"
              >
                <div className="col-span-4 text-neutral-700">{item.name}</div>
                <div className="col-span-2 text-center text-neutral-600">{item.count}</div>
                <div className="col-span-3 text-center">
                  <span className="badge bg-eco-100 text-eco-700 !text-[11px]">{item.condition}</span>
                </div>
                <div className="col-span-3 text-right font-medium text-neutral-800">¥{item.price.toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-dashed border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm text-neutral-600">
              <Sparkles className="w-4 h-4 text-eco-500" />
              减碳 {inspectionReport.carbonSaved} kg
            </div>
            <div className="text-right">
              <span className="text-sm text-neutral-500">质检估价 </span>
              <span className="text-eco-600 text-xl font-bold">¥{inspectionReport.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <div className="card p-5">
          <h3 className="font-bold text-neutral-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-eco-600" />
            打款信息
          </h3>
          <div className="space-y-3">
            {[
              { label: "收款方式", value: paymentInfo.method },
              { label: "收款账户", value: paymentInfo.account },
              { label: "打款金额", value: `¥${paymentInfo.amount.toFixed(2)}`, highlight: true },
              { label: "打款时间", value: paymentInfo.paidAt },
              { label: "交易流水号", value: paymentInfo.tradeNo, mono: true },
            ].map((f) => (
              <div key={f.label} className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">{f.label}</span>
                <span
                  className={cn(
                    f.mono && "font-mono text-xs",
                    f.highlight ? "text-eco-600 font-bold text-lg" : "text-neutral-800 font-medium"
                  )}
                >
                  {f.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <div className="card p-5">
          <h3 className="font-bold text-neutral-800 mb-4 flex items-center gap-2">
            <Recycle className="w-5 h-5 text-eco-600" />
            物资追溯流向
          </h3>
          <div className="relative">
            <div className="absolute left-[17px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-eco-300 to-neutral-200" />
            <div className="space-y-4">
              {traceFlow.map((t, idx) => (
                <div key={idx} className="relative flex gap-4 animate-slide-up" style={{ animationDelay: `${idx * 80}ms` }}>
                  <div
                    className={cn(
                      "relative z-10 w-4 h-4 rounded-full flex-shrink-0 mt-1.5",
                      t.done
                        ? "bg-gradient-to-br from-eco-400 to-eco-600 ring-4 ring-eco-100"
                        : "bg-white border-2 border-neutral-300"
                    )}
                  />
                  <div className="flex-1 pb-1">
                    <div className="flex items-center gap-2">
                      <p className={cn("font-semibold text-sm", t.done ? "text-neutral-800" : "text-neutral-400")}>
                        {t.stage}
                      </p>
                      {!t.done && (
                        <span className="badge bg-neutral-100 text-neutral-500 !text-[10px]">进行中</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-neutral-500">
                      <MapPin className="w-3 h-3" />
                      {t.location}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">{t.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5 mb-4">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
          <User className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700">
            <p className="font-semibold">如有疑问请联系客服</p>
            <p className="text-xs mt-1 text-amber-600/80">客服热线：400-888-0000（9:00-21:00）</p>
          </div>
        </div>
      </div>
    </div>
  );
}
