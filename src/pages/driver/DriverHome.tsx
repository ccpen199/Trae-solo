import { useState } from "react";
import {
  Wallet as WalletIcon,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Zap,
  Fuel,
  MapPin,
  ChevronRight,
  Truck,
  Package,
  Clock,
  Star,
  BadgeCheck,
  Navigation,
  RefreshCw,
  QrCode,
  CreditCard,
  Banknote,
  Search,
  Bell,
} from "lucide-react";
import { Badge, Toast } from "antd-mobile";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/appStore";

interface RecommendedOrder {
  id: string;
  fromCity: string;
  fromAddress: string;
  toCity: string;
  toAddress: string;
  distance: number;
  cargo: string;
  weight: string;
  price: number;
  pricePerKm: number;
  shipperName: string;
  shipperCredit: number;
  matchScore: number;
  tags: string[];
  isHot?: boolean;
  isReturn?: boolean;
  eta: string;
}

const recommendedOrders: RecommendedOrder[] = [
  {
    id: "OD20240621008",
    fromCity: "上海",
    fromAddress: "浦东新区临港保税区",
    toCity: "苏州",
    toAddress: "工业园区金鸡湖大道",
    distance: 128,
    cargo: "电子产品",
    weight: "8吨",
    price: 1680,
    pricePerKm: 13.1,
    shipperName: "顺通物流",
    shipperCredit: 920,
    matchScore: 96,
    tags: ["返程货源", "信用AAA", "T+0结算"],
    isReturn: true,
    isHot: true,
    eta: "今日 18:00",
  },
  {
    id: "OD20240621012",
    fromCity: "苏州",
    fromAddress: "昆山花桥经济开发区",
    toCity: "上海",
    toAddress: "闵行区虹桥货运中心",
    distance: 65,
    cargo: "快消品(饮料)",
    weight: "12吨",
    price: 980,
    pricePerKm: 15.1,
    shipperName: "华润万家配送",
    shipperCredit: 890,
    matchScore: 91,
    tags: ["整车", "日结", "装卸简单"],
    eta: "今日 20:30",
  },
  {
    id: "OD20240621015",
    fromCity: "上海",
    fromAddress: "嘉定区安亭汽车城",
    toCity: "杭州",
    toAddress: "余杭区未来科技城",
    distance: 195,
    cargo: "汽车零配件",
    weight: "15吨",
    price: 2850,
    pricePerKm: 14.6,
    shipperName: "上汽安吉物流",
    shipperCredit: 950,
    matchScore: 94,
    tags: ["长期合作", "50%预支", "全程保险"],
    isHot: true,
    eta: "明日 08:00",
  },
  {
    id: "OD20240621019",
    fromCity: "杭州",
    fromAddress: "萧山区萧山经济开发区",
    toCity: "宁波",
    toAddress: "北仑区宁波港三期码头",
    distance: 158,
    cargo: "外贸集装箱",
    weight: "28吨",
    price: 2480,
    pricePerKm: 15.7,
    shipperName: "中远海运集运",
    shipperCredit: 940,
    matchScore: 89,
    tags: ["返程货源", "港口优先", "双驾"],
    isReturn: true,
    eta: "明日 10:00",
  },
];

const nearbyStations = [
  {
    id: "S001",
    name: "中石化(真北路站)",
    distance: "1.2km",
    price: "7.45",
    save: "0.45",
    brand: "中国石化",
    brandColor: "text-red-500",
  },
  {
    id: "S002",
    name: "中石油(金沙江站)",
    distance: "2.8km",
    price: "7.39",
    save: "0.51",
    brand: "中国石油",
    brandColor: "text-yellow-600",
  },
];

export default function DriverHome() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [pulsing, setPulsing] = useState(false);

  const handleGrabOrder = (orderId: string) => {
    Toast.show({
      icon: "success",
      content: "抢单成功！请在运单中心查看详情",
    });
    navigate(`/driver/orders/${orderId}`);
  };

  const handleStartPulse = () => {
    setPulsing(true);
    Toast.show({
      icon: "loading",
      content: "正在为您智能匹配附近货源...",
    });
    setTimeout(() => {
      setPulsing(false);
      Toast.show({
        icon: "success",
        content: "已为您匹配到 12 条新货源",
      });
    }, 2000);
  };

  return (
    <div className="pb-4">
      <div className="relative px-4 pt-3 pb-24">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500 via-orange-400 to-orange-100" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 30% 10%, rgba(255,255,255,0.4) 0%, transparent 40%), radial-gradient(circle at 70% 0%, rgba(10,35,66,0.1) 0%, transparent 50%)`,
        }} />

        <div className="relative flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {user?.nickname?.charAt(0) || "张"}
            </div>
            <div className="text-white">
              <div className="text-sm font-semibold flex items-center gap-1">
                {user?.nickname || "张师傅"}
                <BadgeCheck size={14} className="text-amber-200" />
              </div>
              <div className="text-[11px] text-white/80 flex items-center gap-1">
                <Star size={10} className="text-amber-200 fill-amber-200" />
                信用 920 · 黄金司机 Lv.4
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center text-white">
              <Search size={18} />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center text-white relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-2xl bg-gradient-to-br from-deep-blue-900 via-deep-blue-800 to-blue-900 p-5 shadow-xl overflow-hidden relative">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 bg-primary-orange pointer-events-none" />
            <div className="absolute -left-5 -bottom-10 w-32 h-32 rounded-full blur-3xl opacity-20 bg-blue-400 pointer-events-none" />

            <div className="relative flex items-start justify-between mb-4">
              <div>
                <div className="text-[11px] text-white/60 mb-1 font-medium tracking-wider uppercase">
                  Driver Wallet · 资金账户
                </div>
                <div className="text-white/80 text-sm flex items-center gap-1">
                  <CreditCard size={12} />
                  账户可用余额(元)
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[10px] text-white/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                实时同步
              </div>
            </div>

            <div className="relative flex items-end gap-2 mb-5">
              <span className="text-4xl font-bold text-white tracking-tight">
                28,650
              </span>
              <span className="text-lg font-semibold text-white/80 mb-1">.42</span>
            </div>

            <div className="relative grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={() => navigate("/driver/wallet")}
                className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
              >
                <Banknote size={18} className="text-amber-300" />
                <span className="text-[11px] text-white font-medium">提现</span>
              </button>
              <button
                onClick={() => navigate("/driver/wallet")}
                className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
              >
                <TrendingUp size={18} className="text-emerald-300" />
                <span className="text-[11px] text-white font-medium">充值</span>
              </button>
              <button
                onClick={() => navigate("/driver/wallet")}
                className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
              >
                <QrCode size={18} className="text-blue-300" />
                <span className="text-[11px] text-white font-medium">收款码</span>
              </button>
            </div>

            <div className="relative flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/10 border border-orange-400/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md">
                  <Zap size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-[11px] text-amber-200 font-medium">
                    装车预支额度
                  </div>
                  <div className="text-sm font-bold text-white">
                    ¥35,000 <span className="text-xs font-medium text-white/60">/ 50,000</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate("/driver/wallet")}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-lg flex items-center gap-1"
              >
                申请预支
                <ArrowUpRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative px-4 -mt-16">
        <button
          onClick={handleStartPulse}
          className={`w-full relative rounded-2xl py-4 px-5 flex items-center justify-between bg-white shadow-xl border-2 transition-all duration-300 ${
            pulsing
              ? "border-primary-orange shadow-2xl"
              : "border-orange-100 hover:border-orange-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg ${pulsing ? "animate-pulse" : ""}`}>
              {pulsing && (
                <>
                  <span className="absolute inset-0 rounded-full bg-primary-orange/30 animate-ping" />
                  <span className="absolute -inset-2 rounded-full bg-primary-orange/15 animate-ping" style={{ animationDelay: "0.3s" }} />
                </>
              )}
              <Truck size={22} className="text-white relative z-10" />
            </div>
            <div className="text-left">
              <div className="font-bold text-deep-blue-900 text-base">
                {pulsing ? "正在智能匹配货源..." : "开启智能抢单"}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <RefreshCw size={10} className={pulsing ? "animate-spin" : ""} />
                {pulsing ? "基于线路、信用、资质双向匹配" : "系统将为您推荐返程高价值货源"}
              </div>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-sm ${
            pulsing
              ? "bg-orange-50 text-primary-orange"
              : "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
          }`}>
            <Zap size={16} />
            {pulsing ? "匹配中" : "立即抢单"}
          </div>
        </button>
      </div>

      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-deep-blue-900 text-base">智能推荐货源</h3>
            <span className="px-2 py-0.5 rounded-full bg-orange-50 text-primary-orange text-[10px] font-bold">
              为您匹配 12 条
            </span>
          </div>
          <button
            onClick={() => navigate("/driver/orders/list")}
            className="flex items-center gap-0.5 text-xs text-gray-500"
          >
            查看全部
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-3">
          {recommendedOrders.map((order, idx) => (
            <div
              key={order.id}
              className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {order.isReturn && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                      <ArrowDownLeft size={10} />
                      返程
                    </span>
                  )}
                  {order.isHot && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-red-50 text-red-500 text-[10px] font-bold">
                      <Zap size={10} />
                      热门
                    </span>
                  )}
                  {order.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-gray-50 text-gray-500 text-[10px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary-orange leading-none">
                    ¥{order.price.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    ¥{order.pricePerKm}/km · {order.distance}km
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Package size={9} className="text-emerald-600" />
                    </div>
                    <span className="text-sm font-semibold text-deep-blue-900 truncate">
                      {order.fromCity}
                    </span>
                    <span className="text-xs text-gray-400 truncate">{order.fromAddress}</span>
                  </div>
                  <div className="ml-2 w-px h-7 bg-gray-200" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-primary-orange/10 flex items-center justify-center shrink-0">
                      <MapPin size={9} className="text-primary-orange" />
                    </div>
                    <span className="text-sm font-semibold text-deep-blue-900 truncate">
                      {order.toCity}
                    </span>
                    <span className="text-xs text-gray-400 truncate">{order.toAddress}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-deep-blue-500 to-blue-600 flex items-center justify-center text-white text-[11px] font-bold">
                    {order.shipperName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-700 flex items-center gap-1">
                      {order.shipperName}
                      <Star size={10} className="text-amber-500 fill-amber-500" />
                      <span className="text-gray-500">{order.shipperCredit}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      装货 {order.eta} · {order.cargo} {order.weight}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400">匹配度</div>
                    <div className="text-sm font-bold text-deep-blue-700">{order.matchScore}%</div>
                  </div>
                  <button
                    onClick={() => handleGrabOrder(order.id)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-orange to-orange-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-shadow flex items-center gap-1"
                  >
                    <Navigation size={12} />
                    立即抢单
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mt-6 mb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-deep-blue-900 text-base">附近优惠油站</h3>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-deep-blue text-[10px] font-bold">
              3万+ 联盟站点
            </span>
          </div>
          <button
            onClick={() => navigate("/driver/stations")}
            className="flex items-center gap-0.5 text-xs text-gray-500"
          >
            查看地图
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {nearbyStations.map((s) => (
            <button
              key={s.id}
              onClick={() => navigate("/driver/stations")}
              className="rounded-2xl bg-white p-3.5 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`text-xs font-bold ${s.brandColor}`}>{s.brand}</div>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-red-50 text-red-500 text-[10px] font-bold">
                  省 ¥{s.save}
                </span>
              </div>
              <div className="text-sm font-semibold text-deep-blue-900 truncate mb-1">
                {s.name}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-gray-400 flex items-center gap-0.5">
                  <MapPin size={10} />
                  {s.distance}
                </div>
                <div className="text-base font-bold text-primary-orange">
                  ¥{s.price}
                  <span className="text-[10px] text-gray-400 font-normal">/L</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-5">
        <div className="rounded-2xl bg-gradient-to-r from-deep-blue-900 to-blue-800 p-4 text-white relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full blur-2xl opacity-30 bg-primary-orange pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white/70 mb-1">📊 本月业绩</div>
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-2xl font-bold">12</span>
                <span className="text-xs text-white/70">单运单</span>
                <span className="text-xl font-bold text-amber-300">¥38,560</span>
                <span className="text-xs text-white/70">收入</span>
              </div>
              <div className="text-[11px] text-white/60 flex items-center gap-1">
                <TrendingUp size={10} className="text-emerald-300" />
                较上月 +18.5% · 空驶率下降 6.2%
              </div>
            </div>
            <button
              onClick={() => navigate("/driver/orders/list")}
              className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur text-xs font-semibold flex items-center gap-1"
            >
              查看账单
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
