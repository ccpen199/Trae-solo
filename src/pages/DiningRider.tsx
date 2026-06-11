import { useState } from "react";
import {
  Package, DollarSign, Star, MapPin, Clock, ScanLine, CheckCircle,
  Power, Bike, PenLine,
} from "lucide-react";

const pendingOrders = [
  { id: "D1001", stall: "川味小厨", stallFull: "第一食堂-川味小厨", dorm: "桃李苑3号楼201", fee: 5, distance: "800m", time: "2分钟前" },
  { id: "D1002", stall: "茶百道", stallFull: "第二食堂-茶百道", dorm: "银杏苑1号楼508", fee: 4, distance: "500m", time: "3分钟前" },
  { id: "D1003", stall: "粤式烧腊", stallFull: "第一食堂-粤式烧腊", dorm: "梅园2号楼116", fee: 6, distance: "1.2km", time: "5分钟前" },
  { id: "D1004", stall: "黄焖鸡", stallFull: "第三食堂-黄焖鸡", dorm: "兰亭苑4号楼310", fee: 5, distance: "900m", time: "6分钟前" },
  { id: "D1005", stall: "麻辣香锅", stallFull: "第二食堂-麻辣香锅", dorm: "竹园3号楼612", fee: 7, distance: "1.1km", time: "8分钟前" },
];

const waypoints = [
  { label: "起点", detail: "第一食堂-鸡排大叔", icon: "🍳" },
  { label: "途经", detail: "校园东门", icon: "🚪" },
  { label: "途经", detail: "图书馆", icon: "📚" },
  { label: "途经", detail: "教学区", icon: "🏫" },
  { label: "终点", detail: "竹园7号楼302", icon: "🏠" },
];

export default function DiningRider() {
  const [online, setOnline] = useState(true);
  const [acceptedOrders, setAcceptedOrders] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState(1);
  const [showScan, setShowScan] = useState(false);
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);
  const [earnings, setEarnings] = useState(58);

  const handleAccept = (id: string) => {
    if (!acceptedOrders.includes(id)) setAcceptedOrders([...acceptedOrders, id]);
  };

  const handleConfirmDelivery = () => {
    setDeliveryConfirmed(true);
    setEarnings((e) => e + 5);
  };

  const stepLabels = ["已到档口取餐", "开始配送", "到达宿舍楼"];

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="bg-gradient-to-r from-[#FF6B35] to-[#FFC857] px-4 pt-4 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-lg font-bold">西游侠骑手工作台</h1>
          <button
            onClick={() => setOnline(!online)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
              online ? "bg-[#2EC4B6] text-white" : "bg-white/30 text-white/70"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {online ? "在线" : "离线"}
          </button>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
            online ? "bg-[#2EC4B6]/20 text-white" : "bg-white/20 text-white/60"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-[#2EC4B6] animate-pulse" : "bg-white/40"}`} />
            {online ? "配送中" : "空闲"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <Package className="w-5 h-5 text-white mx-auto mb-1" />
            <p className="text-white text-xl font-bold">12</p>
            <p className="text-white/80 text-xs">今日单量</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <DollarSign className="w-5 h-5 text-white mx-auto mb-1" />
            <p className="text-white text-xl font-bold">¥{earnings}</p>
            <p className="text-white/80 text-xs">今日收入</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <Star className="w-5 h-5 text-[#FFC857] mx-auto mb-1 fill-[#FFC857]" />
            <p className="text-white text-xl font-bold">4.9</p>
            <p className="text-white/80 text-xs">骑手评分</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-md mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#1B3A5C] flex items-center gap-1.5">
              <Bike className="w-4 h-4 text-[#FF6B35]" /> 当前任务
            </h2>
            <span className="text-xs bg-[#2EC4B6]/10 text-[#2EC4B6] px-2 py-0.5 rounded-full font-medium">
              配送中
            </span>
          </div>

          <div className="mb-4">
            {waypoints.map((wp, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 transition-all ${
                    i <= activeStep
                      ? i === 0 ? "bg-[#FF6B35] text-white" : i === waypoints.length - 1 ? "bg-[#E63946] text-white" : "bg-[#2EC4B6] text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}>
                    {i <= activeStep ? "✓" : i + 1}
                  </div>
                  {i < waypoints.length - 1 && (
                    <div className={`w-0.5 h-6 transition-all ${
                      i < activeStep ? "bg-[#2EC4B6]" : "bg-gray-200"
                    }`} />
                  )}
                </div>
                <div className="pb-4">
                  <p className={`text-xs ${i <= activeStep ? "text-[#1B3A5C] font-medium" : "text-gray-400"}`}>
                    {wp.label}
                  </p>
                  <p className={`text-sm ${i <= activeStep ? "text-[#1B3A5C]" : "text-gray-300"}`}>
                    {wp.icon} {wp.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {stepLabels.map((label, i) => (
              <button
                key={i}
                onClick={() => i === activeStep - 1 && setActiveStep(i + 2)}
                disabled={i !== activeStep - 1}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                  i < activeStep - 1
                    ? "bg-[#2EC4B6]/10 text-[#2EC4B6]"
                    : i === activeStep - 1
                    ? "bg-[#FF6B35] text-white"
                    : "bg-gray-100 text-gray-300"
                }`}
              >
                {i < activeStep - 1 ? <CheckCircle className="w-3.5 h-3.5 mx-auto" /> : label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h2 className="text-sm font-semibold text-[#1B3A5C] mb-3">配送路线</h2>
          <svg viewBox="0 0 300 120" className="w-full h-32">
            <rect x="0" y="0" width="300" height="120" rx="12" fill="#f8fafc" />
            <path
              d="M 30 90 C 60 70, 80 80, 110 60 S 160 30, 200 50 S 240 70, 270 30"
              stroke="#e2e8f0" strokeWidth="4" fill="none" strokeLinecap="round"
            />
            <path
              d="M 30 90 C 60 70, 80 80, 110 60 S 160 30, 200 50 S 240 70, 270 30"
              stroke="#2EC4B6" strokeWidth="4" fill="none" strokeLinecap="round"
              strokeDasharray="300"
              strokeDashoffset={300 - (activeStep / (waypoints.length - 1)) * 300}
              className="transition-all duration-700"
            />
            <text x="30" y="108" fontSize="8" fill="#1B3A5C" textAnchor="middle">食堂</text>
            <text x="110" y="48" fontSize="8" fill="#1B3A5C" textAnchor="middle">东门</text>
            <text x="155" y="22" fontSize="8" fill="#1B3A5C" textAnchor="middle">图书馆</text>
            <text x="200" y="42" fontSize="8" fill="#1B3A5C" textAnchor="middle">教学区</text>
            <text x="270" y="22" fontSize="8" fill="#1B3A5C" textAnchor="middle">宿舍</text>
            {[
              [30, 90], [110, 60], [155, 30], [200, 50], [270, 30],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="4" fill={i <= activeStep ? "#2EC4B6" : "#cbd5e1"} />
            ))}
            <circle cx={[30, 110, 155, 200, 270][activeStep]} cy={[90, 60, 30, 50, 30][activeStep]} r="6" fill="#FF6B35">
              <animate attributeName="r" values="5;7;5" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx={[30, 110, 155, 200, 270][activeStep]} cy={[90, 60, 30, 50, 30][activeStep]} r="3" fill="white" />
          </svg>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h2 className="text-sm font-semibold text-[#1B3A5C] mb-3">待接单池</h2>
          {pendingOrders.map((order) => (
            <div
              key={order.id}
              className={`border rounded-xl p-3 mb-2 last:mb-0 transition-all ${
                acceptedOrders.includes(order.id)
                  ? "bg-[#2EC4B6]/5 border-[#2EC4B6]/30"
                  : "border-gray-100"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">{order.id}</span>
                <span className="text-sm font-bold text-[#FF6B35]">+¥{order.fee}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#1B3A5C]">
                <MapPin className="w-3.5 h-3.5 text-[#FF6B35] shrink-0" />
                <span className="truncate">{order.stall} → {order.dorm}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {order.distance} · {order.time}
                </span>
                {acceptedOrders.includes(order.id) ? (
                  <span className="text-xs text-[#2EC4B6] flex items-center gap-1 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" /> 已接单
                  </span>
                ) : (
                  <button
                    onClick={() => handleAccept(order.id)}
                    className="text-xs bg-[#FF6B35] text-white px-3 py-1 rounded-full hover:bg-[#e55e2e] transition"
                  >
                    接单
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {showScan ? (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h2 className="text-sm font-semibold text-[#1B3A5C] mb-3 flex items-center gap-1.5">
              <ScanLine className="w-4 h-4 text-[#FF6B35]" /> 扫码交付
            </h2>
            {deliveryConfirmed ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-[#2EC4B6]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-[#2EC4B6]" />
                </div>
                <p className="text-[#1B3A5C] font-semibold mb-1">交付完成!</p>
                <p className="text-[#FF6B35] font-bold text-lg mb-2">+¥5</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>交付时间: {new Date().toLocaleTimeString("zh-CN")}</p>
                  <p>交付地点: 竹园7号楼302</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-3">
                <div className="w-40 h-40 mx-auto border-2 border-dashed border-[#FF6B35]/40 rounded-2xl flex items-center justify-center mb-3 relative overflow-hidden">
                  <div className="absolute inset-x-0 h-0.5 bg-[#FF6B35]/60" style={{ top: "50%", animation: "scanLine 2s ease-in-out infinite" }} />
                  <ScanLine className="w-10 h-10 text-[#FF6B35]/40" />
                </div>
                <p className="text-xs text-gray-400 mb-3">将二维码对准扫描框</p>
                <button
                  onClick={handleConfirmDelivery}
                  className="bg-[#2EC4B6] text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-[#25a89d] transition"
                >
                  模拟扫码成功
                </button>
                <div className="mt-4 border-t pt-3">
                  <p className="text-xs text-gray-400 mb-2">学生签名确认</p>
                  <div className="h-12 border border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                    <PenLine className="w-5 h-5 text-gray-300" />
                  </div>
                  <button
                    onClick={handleConfirmDelivery}
                    className="mt-3 w-full py-2.5 bg-[#1B3A5C] text-white rounded-xl text-sm font-semibold hover:bg-[#142d48] transition"
                  >
                    确认交付完成
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowScan(true)}
            className="w-full py-3.5 bg-[#1B3A5C] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#1B3A5C]/30 hover:bg-[#142d48] transition mb-4"
          >
            <ScanLine className="w-5 h-5" />
            扫码送达
          </button>
        )}
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 20%; }
          50% { top: 80%; }
        }
      `}</style>
    </div>
  );
}
