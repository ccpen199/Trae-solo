import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Check, Phone, Star, Bike, QrCode, ChevronLeft, Clock, MapPin, Navigation,
  Package, ShieldCheck, Timer, MessageSquare
} from "lucide-react";

const STEPS = [
  { label: "已下单", time: "12:01" },
  { label: "备餐中", time: "12:03" },
  { label: "骑手取餐", time: "12:15" },
  { label: "配送中", time: "12:18" },
  { label: "到寝交付", time: "" },
];

const WAYPOINTS = [
  { name: "川味小厨", tag: "档口", dist: "", icon: "🍜" },
  { name: "校园东门", tag: "校门", dist: "200m", icon: "🏫" },
  { name: "教学楼区域", tag: "途径", dist: "350m", icon: "📚" },
  { name: "宿舍区域", tag: "途径", dist: "280m", icon: "🏡" },
  { name: "桃李苑3号楼", tag: "目的地", dist: "170m", icon: "🏠" },
];

const ORDER_ITEMS = [
  { name: "宫保鸡丁", price: 18, qty: 1 },
  { name: "米饭", price: 2, qty: 2 },
  { name: "酸梅汤", price: 6, qty: 1 },
];

export default function DiningOrder() {
  const { id } = useParams();
  const [step, setStep] = useState(0);
  const [countdown, setCountdown] = useState(17 * 60 + 30);
  const [confirmed, setConfirmed] = useState(false);
  const [riderDist, setRiderDist] = useState("800m");

  useEffect(() => {
    if (step < 4 && countdown > 0) {
      const t = setInterval(() => setCountdown((c) => c - 1), 1000);
      return () => clearInterval(t);
    }
  }, [step, countdown]);

  useEffect(() => {
    if (step >= 2 && step < 4) {
      const t = setInterval(() => {
        const vals = ["800m", "650m", "500m", "350m", "200m", "50m"];
        setRiderDist(vals[Math.floor(Math.random() * vals.length)]);
      }, 3000);
      return () => clearInterval(t);
    }
  }, [step]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const subtotal = ORDER_ITEMS.reduce((s, i) => s + i.price * i.qty, 0);

  const riderProgress = step >= 2 ? Math.min(((step - 1) * 2 + 1) / 4 * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="sticky top-0 z-10 bg-[#1B3A5C] text-white px-4 py-3 flex items-center gap-3">
        <ChevronLeft className="w-5 h-5" />
        <h1 className="text-base font-semibold">订单追踪</h1>
        <span className="ml-auto text-xs opacity-70">#{id}</span>
      </div>

      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">ORD20260609001</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              step === 4 ? "bg-[#2EC4B6]/10 text-[#2EC4B6]" : "bg-[#FF6B35]/10 text-[#FF6B35]"
            }`}>
              {STEPS[step].label}
            </span>
          </div>
          <div className="flex items-start">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex flex-col items-center flex-1 relative">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step ? "bg-[#2EC4B6] text-white" :
                  i === step ? "bg-[#FF6B35] text-white ring-4 ring-[#FF6B35]/20 animate-pulse" :
                  "bg-gray-200 text-gray-400"
                }`}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={`text-[10px] mt-1 text-center leading-tight ${
                  i <= step ? "text-[#1B3A5C] font-medium" : "text-gray-400"
                }`}>{s.label}</span>
                {(s.time || (i <= step && i > 0)) && (
                  <span className="text-[9px] text-gray-400 mt-0.5">{s.time || "刚刚"}</span>
                )}
                {i < STEPS.length - 1 && (
                  <div className={`absolute top-3.5 left-1/2 w-full h-0.5 ${
                    i < step ? "bg-[#2EC4B6]" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {step >= 2 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h2 className="text-sm font-semibold text-[#1B3A5C] mb-3">配送路径规划</h2>
            <div className="space-y-0">
              {WAYPOINTS.map((wp, i) => {
                const active = i <= Math.floor(riderProgress / 25);
                const isRider = i === Math.min(Math.floor(riderProgress / 25), WAYPOINTS.length - 1) && step < 4;
                return (
                  <div key={wp.name} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                        isRider ? "bg-[#FF6B35] shadow-lg shadow-[#FF6B35]/40 animate-bounce" :
                        active ? "bg-[#2EC4B6]" : "bg-gray-200"
                      }`}>
                        {isRider ? <Bike className="w-4 h-4 text-white" /> : <span className={active ? "" : "opacity-50"}>{wp.icon}</span>}
                      </div>
                      {i < WAYPOINTS.length - 1 && (
                        <div className={`w-0.5 h-6 ${active ? "bg-[#2EC4B6]" : "bg-gray-200"}`} />
                      )}
                    </div>
                    <div className="flex-1 pb-2 flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${active ? "text-[#1B3A5C] font-medium" : "text-gray-400"}`}>{wp.name}</p>
                        <p className="text-[10px] text-gray-400">{wp.tag}</p>
                      </div>
                      {wp.dist && <span className={`text-[10px] ${active ? "text-[#FF6B35]" : "text-gray-300"}`}>{wp.dist}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between bg-[#1B3A5C]/5 rounded-xl px-3 py-2">
              <span className="text-xs text-gray-500 flex items-center gap-1"><Timer className="w-3 h-3" />预计送达</span>
              <span className="text-sm font-bold text-[#FF6B35]">{step < 4 ? fmt(countdown) : "已送达"}</span>
            </div>
          </div>
        )}

        {step >= 2 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h2 className="text-sm font-semibold text-[#1B3A5C] mb-3">西游侠骑手调度</h2>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B35] to-[#FFC857] rounded-full flex items-center justify-center text-white text-lg font-bold">悟</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[#1B3A5C]">孙悟空</p>
                  <span className="text-[10px] bg-[#FFC857]/20 text-[#FFC857] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-[#FFC857]" />4.9
                  </span>
                </div>
                <p className="text-xs text-gray-500">西游侠 · 金牌骑手 · 已完成326单</p>
                <div className="flex gap-3 mt-1.5 text-[10px] text-gray-400">
                  <span>接单 {STEPS[2].time}</span>
                  <span>取餐 {STEPS[3].time}</span>
                </div>
              </div>
              <button className="w-10 h-10 bg-[#2EC4B6]/10 rounded-full flex items-center justify-center hover:bg-[#2EC4B6]/20 transition">
                <Phone className="w-5 h-5 text-[#2EC4B6]" />
              </button>
            </div>
            {step < 4 && (
              <div className="mt-3 flex items-center justify-between bg-[#FF6B35]/5 rounded-xl px-3 py-2">
                <span className="text-xs text-gray-500 flex items-center gap-1"><Navigation className="w-3 h-3" />距您</span>
                <span className="text-sm font-bold text-[#FF6B35]">{riderDist}</span>
              </div>
            )}
          </div>
        )}

        {step === 3 && !confirmed && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h2 className="text-sm font-semibold text-[#1B3A5C] mb-3">到寝扫码交付</h2>
            <div className="flex flex-col items-center">
              <div className="w-36 h-36 bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-[#2EC4B6]/30 relative">
                <QrCode className="w-20 h-20 text-[#1B3A5C]/30" />
                <span className="absolute bottom-1 text-[9px] text-gray-400">扫码确认送达</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2EC4B6]" />
                <span className="text-sm tracking-[0.3em] font-mono font-bold text-[#1B3A5C]">8 3 7 2 9 4</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">交付码 · 向骑手出示</p>
              <button
                onClick={() => setConfirmed(true)}
                className="mt-4 w-full py-3 bg-[#2EC4B6] text-white rounded-xl font-semibold text-sm shadow-lg shadow-[#2EC4B6]/30 hover:bg-[#28b0a3] transition flex items-center justify-center gap-2"
              >
                <Package className="w-4 h-4" />确认送达
              </button>
            </div>
          </div>
        )}

        {confirmed && step === 3 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-4 text-center">
            <div className="w-16 h-16 bg-[#2EC4B6]/10 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
              <Check className="w-8 h-8 text-[#2EC4B6]" />
            </div>
            <p className="text-lg font-bold text-[#2EC4B6]">交付成功！</p>
            <p className="text-xs text-gray-400 mt-1">餐品已送达桃李苑3号楼302室</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <h2 className="text-sm font-semibold text-[#1B3A5C] mb-3">订单明细</h2>
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-50">
            <span className="text-lg">🍜</span>
            <div>
              <p className="text-sm font-medium text-[#1B3A5C]">川味小厨</p>
              <p className="text-[10px] text-gray-400">第一食堂</p>
            </div>
          </div>
          {ORDER_ITEMS.map((item) => (
            <div key={item.name} className="flex justify-between py-1.5">
              <span className="text-sm text-gray-700">{item.name} ×{item.qty}</span>
              <span className="text-sm font-medium text-[#1B3A5C]">¥{item.price * item.qty}</span>
            </div>
          ))}
          <div className="flex justify-between py-1.5 border-t border-gray-50 mt-1">
            <span className="text-sm text-gray-500">配送费</span>
            <span className="text-sm text-[#1B3A5C]">¥3</span>
          </div>
          <div className="flex justify-between pt-2 mt-1 border-t border-gray-100">
            <span className="text-sm font-semibold text-[#1B3A5C]">合计</span>
            <span className="text-lg font-bold text-[#FF6B35]">¥{subtotal + 3}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MapPin className="w-3 h-3 text-[#FF6B35]" />桃李苑3号楼302室
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3 text-[#2EC4B6]" />配送时段 12:00-12:30
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MessageSquare className="w-3 h-3 text-gray-400" />备注：少辣，多加葱
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (step < 4) {
              setStep(step + 1);
              setConfirmed(false);
            }
          }}
          disabled={step >= 4}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 ${
            step >= 4
              ? "bg-gray-200 text-gray-400"
              : "bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/30 hover:bg-[#e55e2e]"
          }`}
        >
          {step >= 4 ? <Check className="w-4 h-4" /> : <Navigation className="w-4 h-4" />}
          {step >= 4 ? "订单已完成" : "模拟下一步"}
        </button>
      </div>
    </div>
  );
}
