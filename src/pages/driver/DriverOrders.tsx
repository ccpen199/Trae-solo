import { useState } from "react";
import {
  MapPin,
  Package,
  Scale,
  Clock,
  ChevronRight,
  Navigation,
  User,
  Star,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Phone,
  MessageCircle,
  ArrowLeft,
  Search,
  Filter,
  Calendar,
} from "lucide-react";
import { Tabs, Badge, Avatar, Toast } from "antd-mobile";
import { useNavigate } from "react-router-dom";

type OrderStatus = "all" | "pending" | "shipping" | "completed" | "abnormal";

interface Order {
  id: string;
  fromCity: string;
  fromAddress: string;
  toCity: string;
  toAddress: string;
  distance: number;
  cargo: string;
  weight: string;
  price: number;
  status: Exclude<OrderStatus, "all">;
  shipperName: string;
  shipperCredit: number;
  createTime: string;
  progressPercent?: number;
  currentLocation?: string;
  abnormalReason?: string;
  eta?: string;
}

const mockOrders: Order[] = [
  {
    id: "OD20240620001",
    fromCity: "上海",
    fromAddress: "上海市浦东新区张江高科技园区博云路2号",
    toCity: "杭州",
    toAddress: "杭州市余杭区未来科技城文一西路969号",
    distance: 186,
    cargo: "电子产品",
    weight: "12吨",
    price: 2800,
    status: "shipping",
    shipperName: "鑫达物流有限公司",
    shipperCredit: 96,
    createTime: "2024-06-20 08:30",
    progressPercent: 62,
    currentLocation: "嘉兴市桐乡市",
    eta: "预计14:20到达",
  },
  {
    id: "OD20240620002",
    fromCity: "苏州",
    fromAddress: "苏州市工业园区星湖街328号",
    toCity: "南京",
    toAddress: "南京市江宁区秣陵街道将军大道169号",
    distance: 215,
    cargo: "建材钢材",
    weight: "28吨",
    price: 3200,
    status: "pending",
    shipperName: "宏远建材贸易",
    shipperCredit: 88,
    createTime: "2024-06-20 09:15",
  },
  {
    id: "OD20240619015",
    fromCity: "无锡",
    fromAddress: "无锡市滨湖区高浪东路999号",
    toCity: "合肥",
    toAddress: "合肥市蜀山区井岗镇长江西路2221号",
    distance: 342,
    cargo: "食品饮料",
    weight: "8吨",
    price: 4500,
    status: "completed",
    shipperName: "旺旺食品集团",
    shipperCredit: 92,
    createTime: "2024-06-19 07:00",
  },
  {
    id: "OD20240619012",
    fromCity: "常州",
    fromAddress: "常州市新北区通江中路508号",
    toCity: "上海",
    toAddress: "上海市松江区九亭镇沪松公路1288号",
    distance: 178,
    cargo: "机械设备",
    weight: "15吨",
    price: 2600,
    status: "abnormal",
    shipperName: "盛源机械制造",
    shipperCredit: 85,
    createTime: "2024-06-19 10:30",
    abnormalReason: "收货方地址变更，等待确认",
  },
  {
    id: "OD20240619008",
    fromCity: "南京",
    fromAddress: "南京市江北新区浦珠中路208号",
    toCity: "徐州",
    toAddress: "徐州市云龙区和平大道118号",
    distance: 345,
    cargo: "纺织原料",
    weight: "20吨",
    price: 4800,
    status: "completed",
    shipperName: "华盛纺织集团",
    shipperCredit: 90,
    createTime: "2024-06-19 06:30",
  },
  {
    id: "OD20240620005",
    fromCity: "宁波",
    fromAddress: "宁波市北仑区新碶街道灵江路1号",
    toCity: "温州",
    toAddress: "温州市龙湾区永中街道机场大道555号",
    distance: 268,
    cargo: "化工原料",
    weight: "22吨",
    price: 3800,
    status: "pending",
    shipperName: "恒顺化工科技",
    shipperCredit: 87,
    createTime: "2024-06-20 10:00",
  },
];

const statusConfig = {
  pending: { label: "待接单", color: "text-blue-600", bg: "bg-blue-50", icon: Clock },
  shipping: { label: "运输中", color: "text-primary-500", bg: "bg-primary-50", icon: Truck },
  completed: { label: "已完成", color: "text-green-600", bg: "bg-green-50", icon: CheckCircle2 },
  abnormal: { label: "异常", color: "text-red-600", bg: "bg-red-50", icon: AlertTriangle },
};

export default function DriverOrders() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<OrderStatus>("all");

  const filteredOrders = activeTab === "all" 
    ? mockOrders 
    : mockOrders.filter((o) => o.status === activeTab);

  const tabCounts = {
    all: mockOrders.length,
    pending: mockOrders.filter((o) => o.status === "pending").length,
    shipping: mockOrders.filter((o) => o.status === "shipping").length,
    completed: mockOrders.filter((o) => o.status === "completed").length,
    abnormal: mockOrders.filter((o) => o.status === "abnormal").length,
  };

  const renderProgressBar = (order: Order) => {
    if (order.status !== "shipping" || order.progressPercent === undefined) return null;
    return (
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-700">运输进度 {order.progressPercent}%</span>
          </div>
          <span className="text-xs text-primary-500 font-medium">{order.eta}</span>
        </div>
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm" />
              <span className="text-xs text-gray-600 font-medium">{order.fromCity}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-600 font-medium">{order.toCity}</span>
              <div className="w-3 h-3 rounded-full bg-primary-500 border-2 border-white shadow-sm" />
            </div>
          </div>
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full progress-bar rounded-full transition-all duration-1000 relative overflow-hidden"
              style={{ width: `${order.progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse" />
            </div>
            <div
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000"
              style={{ left: `calc(${order.progressPercent}% - 10px)` }}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-lg border-2 border-primary-500 flex items-center justify-center">
                <Truck size={12} className="text-primary-500 fill-primary-500" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <Navigation size={12} className="text-primary-500" />
              <span className="text-[11px] text-gray-500">当前: {order.currentLocation}</span>
            </div>
            <span className="text-[11px] text-gray-400">已行驶 {Math.round(order.distance * order.progressPercent / 100)}km</span>
          </div>
        </div>
      </div>
    );
  };

  const renderActionButtons = (order: Order) => {
    switch (order.status) {
      case "pending":
        return (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => Toast.show({ content: "已拒绝" })}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm active:bg-gray-50 transition-colors"
            >
              拒绝
            </button>
            <button
              onClick={() => {
                Toast.show({ icon: "success", content: "接单成功" });
              }}
              className="flex-1 py-2.5 rounded-xl gradient-primary text-white font-medium text-sm shadow-md active:scale-95 transition-all"
            >
              接受订单
            </button>
          </div>
        );
      case "shipping":
        return (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => Toast.show({ content: "正在拨打..." })}
              className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 active:bg-gray-50"
            >
              <Phone size={20} />
            </button>
            <button
              onClick={() => Toast.show({ content: "打开聊天" })}
              className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 active:bg-gray-50"
            >
              <MessageCircle size={20} />
            </button>
            <button
              onClick={() => navigate(`/driver/orders/${order.id}`)}
              className="flex-1 py-2.5 rounded-xl gradient-primary text-white font-medium text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              查看详情
              <ChevronRight size={16} />
            </button>
          </div>
        );
      case "completed":
        return (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => navigate(`/driver/orders/${order.id}`)}
              className="flex-1 py-2.5 rounded-xl border border-primary-200 text-primary-500 font-medium text-sm active:bg-primary-50 transition-colors"
            >
              查看详情
            </button>
            <button
              onClick={() => Toast.show({ content: "开发票申请已提交" })}
              className="flex-1 py-2.5 rounded-xl gradient-primary text-white font-medium text-sm shadow-md active:scale-95 transition-all"
            >
              开发票
            </button>
          </div>
        );
      case "abnormal":
        return (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="mb-3 p-3 bg-red-50 rounded-xl flex items-start gap-2">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-red-700 mb-0.5">异常提醒</div>
                <div className="text-xs text-red-600">{order.abnormalReason}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => Toast.show({ content: "联系客服处理" })}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm active:bg-gray-50 transition-colors"
              >
                联系客服
              </button>
              <button
                onClick={() => navigate(`/driver/orders/${order.id}`)}
                className="flex-1 py-2.5 rounded-xl gradient-primary text-white font-medium text-sm shadow-md active:scale-95 transition-all"
              >
                处理异常
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen pb-6">
      <div className="gradient-primary pt-12 pb-6 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"
            >
              <ArrowLeft size={22} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">我的运单</h1>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Search size={20} className="text-white" />
              </button>
              <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Filter size={20} className="text-white" />
              </button>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 flex items-center justify-around">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{mockOrders.length}</div>
              <div className="text-xs text-gray-500 mt-1">全部运单</div>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-500">{tabCounts.shipping}</div>
              <div className="text-xs text-gray-500 mt-1">运输中</div>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{tabCounts.completed}</div>
              <div className="text-xs text-gray-500 mt-1">已完成</div>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{tabCounts.abnormal}</div>
              <div className="text-xs text-gray-500 mt-1">异常</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as OrderStatus)}
          className="!px-0"
        >
          {([
            ["all", `全部${tabCounts.all}`],
            ["pending", `待接单${tabCounts.pending ? `(${tabCounts.pending})` : ""}`],
            ["shipping", `运输中${tabCounts.shipping ? `(${tabCounts.shipping})` : ""}`],
            ["completed", "已完成"],
            ["abnormal", `异常${tabCounts.abnormal ? `(${tabCounts.abnormal})` : ""}`],
          ] as [OrderStatus, string][]).map(([key, title]) => (
            <Tabs.Tab
              key={key}
              title={title}
              className="!text-gray-600 &[aria-selected='true']:!text-primary-500"
            />
          ))}
        </Tabs>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400">暂无运单数据</p>
          </div>
        ) : (
          filteredOrders.map((order, idx) => {
            const status = statusConfig[order.status];
            const StatusIcon = status.icon;
            return (
              <div
                key={order.id}
                className="glass-card rounded-2xl p-4 shadow-card animate-slide-up"
                style={{ animationDelay: `${idx * 80}ms` }}
                onClick={() => navigate(`/driver/orders/${order.id}`)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono">{order.id}</span>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: status.bg.replace("bg-", ""), color: status.color.replace("text-", "") }}>
                      <StatusIcon size={12} />
                      {status.label}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar size={12} />
                    {order.createTime}
                  </div>
                </div>

                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-800 text-sm">{order.fromCity} · {order.fromAddress.split("·")[0].slice(0, 15)}...</div>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-gray-200 ml-1 my-1" />
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-800 text-sm">{order.toCity} · {order.toAddress.split("·")[0].slice(0, 15)}...</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center px-3">
                    <Navigation size={18} className="text-primary-500 mb-1" />
                    <span className="text-xs text-gray-500">{order.distance}km</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg">
                    <Package size={13} className="text-gray-500" />
                    <span className="text-xs text-gray-600">{order.cargo}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg">
                    <Scale size={13} className="text-gray-500" />
                    <span className="text-xs text-gray-600">{order.weight}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg">
                    <User size={13} className="text-gray-500" />
                    <span className="text-xs text-gray-600 truncate max-w-[100px]">{order.shipperName}</span>
                  </div>
                  <div className="flex items-center gap-0.5 px-2.5 py-1 bg-yellow-50 rounded-lg">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-medium text-yellow-700">{order.shipperCredit}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400">运费</span>
                    <span className="text-2xl font-bold gradient-money ml-2">¥{order.price.toLocaleString()}</span>
                  </div>
                </div>

                {renderProgressBar(order)}
                {renderActionButtons(order)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
