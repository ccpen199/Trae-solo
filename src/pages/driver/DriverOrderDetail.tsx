import { useState } from "react";
import {
  MapPin,
  Package,
  Scale,
  Clock,
  ChevronRight,
  Navigation,
  User,
  Phone,
  MessageCircle,
  ArrowLeft,
  Truck,
  Camera,
  Upload,
  Image as ImageIcon,
  CreditCard,
  Percent,
  CheckCircle2,
  Info,
  SlidersHorizontal,
  Calendar,
  FileText,
  ShieldCheck,
  Banknote,
  Receipt,
} from "lucide-react";
import { Slider, Toast, Modal, ImageUploader } from "antd-mobile";
import { useNavigate, useParams } from "react-router-dom";

const mockOrderDetail = {
  id: "OD20240620001",
  orderNo: "FY202406200001",
  fromCity: "上海",
  fromAddress: "上海市浦东新区张江高科技园区博云路2号",
  fromContact: "李先生",
  fromPhone: "138****6688",
  toCity: "杭州",
  toAddress: "杭州市余杭区未来科技城文一西路969号",
  toContact: "王经理",
  toPhone: "139****9988",
  distance: 186,
  cargo: "电子产品(手机/平板)",
  cargoQuantity: "320件",
  weight: "12吨",
  volume: "28m³",
  price: 2800,
  prepaidApplied: 1000,
  serviceFee: 84,
  actualPayment: 1716,
  status: "shipping",
  statusText: "运输中",
  shipperName: "鑫达物流有限公司",
  shipperCredit: 96,
  createTime: "2024-06-20 08:30",
  acceptTime: "2024-06-20 08:45",
  loadTime: "2024-06-20 09:20",
  estimatedArrival: "2024-06-20 14:20",
  progressPercent: 62,
  currentLocation: "嘉兴市桐乡市G60沪昆高速",
  nextService: "距下一个服务区 38km",
  timeline: [
    { time: "08:30", title: "订单创建", desc: "货主发布运单", done: true },
    { time: "08:45", title: "司机接单", desc: "张师傅已接单", done: true },
    { time: "09:20", title: "货物装车", desc: "已完成装车，货物确认无误", done: true, hasImage: true },
    { time: "进行中", title: "运输中", desc: "当前位置: 嘉兴市桐乡市", done: false, active: true },
    { time: "14:20", title: "到达卸货", desc: "预计到达时间", done: false },
  ],
};

export default function DriverOrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [prepaidPercent, setPrepaidPercent] = useState(50);
  const [showPrepaidModal, setShowPrepaidModal] = useState(false);
  const [loadingImages, setLoadingImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200",
    "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=200",
  ]);
  const [unloadingImages, setUnloadingImages] = useState<string[]>([]);

  const order = mockOrderDetail;
  const maxPrepaid = Math.floor(order.price * 0.8);
  const prepaidAmount = Math.floor(order.price * (prepaidPercent / 100));
  const prepaidFee = Math.floor(prepaidAmount * 0.03);
  const actualPrepaid = prepaidAmount - prepaidFee;

  const handleApplyPrepaid = () => {
    Toast.show({ icon: "success", content: `预支申请已提交，预计10分钟内到账 ¥${actualPrepaid}` });
    setShowPrepaidModal(false);
  };

  return (
    <div className="min-h-screen pb-28">
      <div className="gradient-primary pt-12 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"
            >
              <ArrowLeft size={22} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">运单详情</h1>
            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <MessageCircle size={20} className="text-white" />
            </button>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-400">{order.orderNo}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-500 text-xs font-medium flex items-center gap-1">
                  <Truck size={12} className="fill-current" />
                  {order.statusText}
                </span>
              </div>
              <span className="text-xs text-gray-400">{order.createTime}</span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-xs text-gray-500">运费总额</span>
              <span className="text-3xl font-bold gradient-money">¥{order.price.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-gray-500">
                  <Navigation size={14} />
                  <span>{order.distance}km</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock size={14} />
                  <span>约{Math.ceil(order.distance / 60)}小时</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <User size={14} className="text-gray-500" />
                <span className="text-gray-600 text-xs">{order.shipperName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-14 relative z-20 space-y-4">
        <div className="glass-card rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <MapPin size={18} className="text-primary-500" />
              装卸货信息
            </h3>
            <button className="text-primary-500 text-xs font-medium flex items-center gap-1">
              查看地图
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="relative rounded-xl overflow-hidden mb-4 h-36 map-bg">
            <div className="absolute inset-0 chart-grid opacity-60" />
            <div className="absolute left-[15%] top-[55%]">
              <div className="relative">
                <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-lg" />
                <div className="absolute -inset-2 rounded-full bg-green-500/20 animate-ping" />
              </div>
              <div className="mt-2 px-2 py-1 bg-white rounded-lg shadow-md text-[10px] text-gray-700 whitespace-nowrap">
                {order.fromCity}装货
              </div>
            </div>
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
              <path
                d="M 15% 55% Q 40% 25% 85% 40%"
                stroke="#FF6B1A"
                strokeWidth="3"
                strokeDasharray="6 4"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute left-[52%] top-[35%]" style={{ zIndex: 2 }}>
              <div className="w-8 h-8 rounded-full gradient-card shadow-lg flex items-center justify-center animate-float">
                <Truck size={16} className="text-white fill-current" />
              </div>
            </div>
            <div className="absolute right-[15%] top-[38%]">
              <div className="relative">
                <div className="w-4 h-4 rounded-full bg-primary-500 border-2 border-white shadow-lg" />
              </div>
              <div className="mt-2 px-2 py-1 bg-white rounded-lg shadow-md text-[10px] text-gray-700 whitespace-nowrap">
                {order.toCity}卸货
              </div>
            </div>
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 backdrop-blur rounded text-[10px] text-white">
              {order.currentLocation}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex flex-col items-center pt-1">
                <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                <div className="w-px flex-1 bg-dashed border-l border-dashed border-gray-200 my-1" />
                <div className="w-3 h-3 rounded-full bg-primary-500 flex-shrink-0" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-green-600 font-medium">装货地</span>
                    <button className="flex items-center gap-1 text-xs text-primary-500">
                      <Phone size={12} />
                      {order.fromPhone}
                    </button>
                  </div>
                  <div className="text-sm font-medium text-gray-800 mb-0.5">{order.fromAddress}</div>
                  <div className="text-xs text-gray-500">联系人: {order.fromContact}</div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-primary-500 font-medium">卸货地</span>
                    <button className="flex items-center gap-1 text-xs text-primary-500">
                      <Phone size={12} />
                      {order.toPhone}
                    </button>
                  </div>
                  <div className="text-sm font-medium text-gray-800 mb-0.5">{order.toAddress}</div>
                  <div className="text-xs text-gray-500">联系人: {order.toContact}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 shadow-card">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Package size={18} className="text-primary-500" />
            货物信息
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="text-xs text-gray-500 mb-1">货物名称</div>
              <div className="text-sm font-medium text-gray-800">{order.cargo}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="text-xs text-gray-500 mb-1">货物数量</div>
              <div className="text-sm font-medium text-gray-800">{order.cargoQuantity}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Scale size={12} />
                货物重量
              </div>
              <div className="text-sm font-medium text-gray-800">{order.weight}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <div className="text-xs text-gray-500 mb-1">货物体积</div>
              <div className="text-sm font-medium text-gray-800">{order.volume}</div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Banknote size={18} className="text-primary-500" />
              运费明细
            </h3>
            <span className="text-xs text-gray-400">运单号 {order.id}</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <Receipt size={14} className="text-gray-400" />
                运输报价
              </span>
              <span className="text-sm font-medium text-gray-800">¥{order.price.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <CreditCard size={14} className="text-blue-400" />
                已预支金额
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">已到账</span>
              </span>
              <span className="text-sm font-medium text-blue-600">-¥{order.prepaidApplied.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <Percent size={14} className="text-gray-400" />
                平台服务费 (3%)
              </span>
              <span className="text-sm font-medium text-gray-800">-¥{order.serviceFee}</span>
            </div>
            <div className="flex items-center justify-between py-2 pt-3">
              <span className="text-base font-bold text-gray-800">实际待收</span>
              <span className="text-2xl font-bold gradient-money">¥{order.actualPayment.toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={() => setShowPrepaidModal(true)}
            className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-medium text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <CreditCard size={18} />
            申请运费预支 (最高80%)
          </button>
        </div>

        <div className="glass-card rounded-2xl p-5 shadow-card">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <SlidersHorizontal size={18} className="text-primary-500" />
            运输进度
          </h3>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">整体进度</span>
              <span className="text-sm font-bold text-primary-500">{order.progressPercent}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden relative">
              <div
                className="h-full progress-bar rounded-full transition-all duration-1000 relative"
                style={{ width: `${order.progressPercent}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
              <span>{order.estimatedArrival.split(" ")[0]} 09:20</span>
              <span className="text-primary-500">{order.nextService}</span>
              <span>{order.estimatedArrival}</span>
            </div>
          </div>

          <div className="relative pl-6">
            {order.timeline.map((item, idx) => (
              <div key={idx} className="relative pb-5 last:pb-0">
                {idx !== order.timeline.length - 1 && (
                  <div
                    className={`absolute left-[-22px] top-4 w-0.5 h-full ${item.done ? "bg-primary-500" : "bg-gray-200"}`}
                    style={{ left: "-17px" }}
                  />
                )}
                <div
                  className={`absolute w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                    item.active
                      ? "bg-primary-500 ring-4 ring-primary-100 animate-pulse"
                      : item.done
                      ? "bg-primary-500"
                      : "bg-gray-300"
                  }`}
                  style={{ left: "-22px", top: "2px" }}
                >
                  {item.done && !item.active && (
                    <CheckCircle2 size={12} className="text-white -mt-0.5 -ml-0.5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${item.active ? "text-primary-500" : item.done ? "text-gray-800" : "text-gray-400"}`}>
                      {item.title}
                    </span>
                    <span className={`text-xs ${item.active ? "text-primary-500" : "text-gray-400"}`}>{item.time}</span>
                  </div>
                  <div className={`text-xs mt-1 ${item.done || item.active ? "text-gray-500" : "text-gray-400"}`}>
                    {item.desc}
                  </div>
                  {item.hasImage && (
                    <div className="mt-2 flex gap-2">
                      {loadingImages.map((img, i) => (
                        <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-100">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 shadow-card">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <FileText size={18} className="text-primary-500" />
            凭证上传
          </h3>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  装车凭证
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">已上传</span>
                </span>
                <span className="text-xs text-gray-400">{order.timeline[2].time}</span>
              </div>
              <div className="flex gap-2">
                {loadingImages.map((img, i) => (
                  <div key={i} className="w-20 h-20 rounded-xl overflow-hidden relative">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 right-0 px-1.5 py-0.5 bg-green-500 text-white text-[10px] rounded-tl-lg">
                      已确认
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  卸货凭证
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">待上传</span>
                </span>
              </div>
              <div className="flex gap-2">
                {unloadingImages.length === 0 ? (
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-primary-300 hover:text-primary-400 transition-colors cursor-pointer">
                    <Camera size={24} />
                    <span className="text-[10px] mt-1">拍照上传</span>
                  </div>
                ) : (
                  unloadingImages.map((img, i) => (
                    <div key={i} className="w-20 h-20 rounded-xl overflow-hidden relative">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))
                )}
                <button className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-primary-300 hover:text-primary-400 transition-colors">
                  <Upload size={22} />
                  <span className="text-[10px] mt-1">上传图片</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 shadow-card">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-primary-500" />
            服务保障
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { title: "货物保险", desc: "最高50万", icon: ShieldCheck },
              { title: "时效保障", desc: "超时赔付", icon: Clock },
              { title: "先行赔付", desc: "平台兜底", icon: Banknote },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="text-center p-3 bg-gradient-to-b from-primary-50/50 to-white rounded-xl">
                  <div className="w-10 h-10 rounded-full gradient-primary/10 bg-primary-50 mx-auto mb-2 flex items-center justify-center">
                    <Icon size={20} className="text-primary-500" />
                  </div>
                  <div className="text-xs font-semibold text-gray-800 mb-0.5">{item.title}</div>
                  <div className="text-[10px] text-gray-500">{item.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 glass-card border-t border-gray-200/60 px-4 py-3 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => Toast.show({ content: "正在拨打货主电话..." })}
            className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 active:bg-gray-50 transition-colors"
          >
            <Phone size={22} />
          </button>
          <button
            onClick={() => Toast.show({ content: "打开导航..." })}
            className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 active:bg-blue-100 transition-colors"
          >
            <Navigation size={22} />
          </button>
          <button className="flex-1 py-3.5 rounded-xl gradient-primary text-white font-bold text-base shadow-float active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Camera size={20} />
            上传卸货凭证
          </button>
        </div>
      </div>

      <Modal
        visible={showPrepaidModal}
        onClose={() => setShowPrepaidModal(false)}
        content={
          <div className="pt-4 pb-2">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full gradient-primary flex items-center justify-center shadow-lg">
                <CreditCard size={32} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">运费预支申请</h3>
              <p className="text-xs text-gray-500">基于您的信用等级，最高可预支80%</p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">预支比例</span>
                <span className="text-sm font-bold text-primary-500">{prepaidPercent}%</span>
              </div>
              <Slider
                value={prepaidPercent as unknown as [number, number]}
                onChange={(v) => setPrepaidPercent(Array.isArray(v) ? v[0] ?? 50 : v)}
                min={20}
                max={80}
                step={5}
                style={{ "--fill-color": "#FF6B1A", "--track-size": "8px", "--thumb-size": "24px" } as React.CSSProperties}
              />
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>20%</span>
                <span className="text-primary-500 font-medium">推荐50%</span>
                <span>80%</span>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-primary-50 to-orange-50 rounded-xl space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">运单总额</span>
                <span className="text-sm font-medium text-gray-800">¥{order.price}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">预支金额</span>
                <span className="text-lg font-bold gradient-money">¥{prepaidAmount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  手续费 (3%)
                  <Info size={12} className="text-gray-400" />
                </span>
                <span className="text-sm text-gray-600">-¥{prepaidFee}</span>
              </div>
              <div className="h-px bg-orange-200/50" />
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-gray-800">实际到账</span>
                <span className="text-xl font-bold gradient-money">¥{actualPrepaid}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleApplyPrepaid}
                className="w-full py-3.5 rounded-xl gradient-primary text-white font-bold text-base shadow-float active:scale-[0.98] transition-all"
              >
                一键申请预支
              </button>
              <p className="text-center text-xs text-gray-400">
                预计10分钟内到账，还款日为运单完成日
              </p>
            </div>
          </div>
        }
      />
    </div>
  );
}
