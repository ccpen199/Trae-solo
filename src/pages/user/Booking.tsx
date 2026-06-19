import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  MapPin,
  Plus,
  ChevronRight,
  User,
  Phone,
  Calendar,
  Clock,
  Check,
  Package,
  Shirt,
  BookOpen,
  Smartphone,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const categoryIconMap: Record<string, typeof Package> = {
  clothes: Shirt,
  books: BookOpen,
  phones: Smartphone,
};

const categoryLabelMap: Record<string, string> = {
  clothes: "衣服",
  books: "图书",
  phones: "手机",
};

const timeSlots = [
  { time: "09:00-11:00", available: true },
  { time: "11:00-13:00", available: false },
  { time: "14:00-16:00", available: true },
  { time: "16:00-18:00", available: true },
  { time: "18:00-20:00", available: false },
];

const savedAddresses = [
  {
    id: "1",
    name: "张三",
    phone: "138****8888",
    detail: "浙江省杭州市西湖区文三路 478 号华星时代广场 A 座 1201",
    isDefault: true,
  },
  {
    id: "2",
    name: "张三",
    phone: "138****8888",
    detail: "浙江省杭州市余杭区未来科技城梦想小镇 12 号楼 302",
    isDefault: false,
  },
];

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as {
    category?: string;
    brand?: string;
    model?: string;
    condition?: number;
    quantity?: number;
    estimatedPrice?: number;
  }) || {};

  const { category = "clothes", brand, model, condition = 7, quantity = 1, estimatedPrice = 50 } = state;

  const [selectedDate, setSelectedDate] = useState(dayjs().add(1, "day"));
  const [selectedSlot, setSelectedSlot] = useState("14:00-16:00");
  const [selectedAddressId, setSelectedAddressId] = useState("1");
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ name: "", phone: "", detail: "" });

  const days = Array.from({ length: 7 }, (_, i) => dayjs().add(i, "day"));
  const categoryIcon = categoryIconMap[category] || Package;
  const CategoryIcon = categoryIcon;

  const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId) || savedAddresses[0];

  const handleConfirm = () => {
    navigate("/user/orders");
  };

  return (
    <div className="pb-28 animate-fade-in">
      <div className="px-4 pt-4">
        <div className="card p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-eco-400 to-eco-600 flex items-center justify-center flex-shrink-0">
              <CategoryIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-neutral-800">{categoryLabelMap[category]}回收</h3>
                <span className="badge bg-eco-100 text-eco-700">成色 {condition}/10</span>
              </div>
              <p className="mt-1 text-sm text-neutral-500 truncate">
                {[brand, model].filter(Boolean).join(" · ") || "未选择品牌型号"}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                数量：{quantity}
                {category === "clothes" ? "kg" : category === "books" ? "本" : "件"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-400">预估</p>
              <p className="text-eco-600 text-xl font-bold">¥{Number(estimatedPrice).toFixed(category === "phones" ? 0 : 2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-eco-100 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-eco-600" />
            </div>
            <h3 className="font-bold text-neutral-800">选择上门日期</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1 -mx-1 px-1">
            {days.map((d) => {
              const isSelected = d.isSame(selectedDate, "day");
              const isToday = d.isSame(dayjs(), "day");
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelectedDate(d)}
                  className={cn(
                    "flex-shrink-0 w-14 py-3 rounded-xl flex flex-col items-center transition-all duration-200",
                    isSelected
                      ? "bg-gradient-to-br from-eco-500 to-eco-600 text-white shadow-lg"
                      : "bg-neutral-50 text-neutral-600 hover:bg-eco-50"
                  )}
                >
                  <span className="text-xs">
                    {isToday ? "今天" : d.format("ddd").replace("周", "周")}
                  </span>
                  <span className={cn("text-lg font-bold mt-0.5", isSelected ? "text-white" : "text-neutral-800")}>
                    {d.format("D")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-eco-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-eco-600" />
            </div>
            <h3 className="font-bold text-neutral-800">选择时间段</h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {timeSlots.map((slot) => {
              const isSelected = selectedSlot === slot.time;
              return (
                <button
                  key={slot.time}
                  onClick={() => slot.available && setSelectedSlot(slot.time)}
                  disabled={!slot.available}
                  className={cn(
                    "relative py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5",
                    !slot.available && "bg-neutral-50 text-neutral-300 cursor-not-allowed",
                    slot.available && !isSelected && "bg-neutral-50 text-neutral-700 hover:bg-eco-50 hover:text-eco-700 border border-neutral-100",
                    isSelected && "bg-gradient-to-br from-eco-500 to-eco-600 text-white shadow-md"
                  )}
                >
                  {slot.available ? (
                    isSelected ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-eco-500" />
                    )
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {slot.time}
                  {!slot.available && <span className="text-xs">已满</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-eco-100 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-eco-600" />
              </div>
              <h3 className="font-bold text-neutral-800">取件地址</h3>
            </div>
          </div>

          {!showAddAddress ? (
            <>
              {savedAddresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={cn(
                    "w-full text-left p-4 border-b border-neutral-50 transition-colors hover:bg-eco-50/50",
                    addr.id === selectedAddressId && "bg-eco-50/70"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 transition-all",
                        addr.id === selectedAddressId
                          ? "border-eco-500 bg-eco-500"
                          : "border-neutral-300"
                      )}
                    >
                      {addr.id === selectedAddressId && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-neutral-800">{addr.name}</span>
                        <span className="text-neutral-500 text-sm">{addr.phone}</span>
                        {addr.isDefault && (
                          <span className="badge bg-eco-100 text-eco-700 !text-[10px] !px-2 !py-0">默认</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-neutral-500 leading-relaxed">{addr.detail}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0 mt-1" />
                  </div>
                </button>
              ))}
              <button
                onClick={() => setShowAddAddress(true)}
                className="w-full p-4 flex items-center justify-center gap-1.5 text-eco-600 font-medium hover:bg-eco-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                新增地址
              </button>
            </>
          ) : (
            <div className="p-4 space-y-4">
              <div>
                <label className="label-base flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> 收货人
                </label>
                <input
                  type="text"
                  value={newAddress.name}
                  onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                  className="input-base"
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <label className="label-base flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> 手机号
                </label>
                <input
                  type="tel"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  className="input-base"
                  placeholder="请输入手机号"
                />
              </div>
              <div>
                <label className="label-base flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> 详细地址
                </label>
                <textarea
                  value={newAddress.detail}
                  onChange={(e) => setNewAddress({ ...newAddress, detail: e.target.value })}
                  className="input-base min-h-[80px] resize-none"
                  placeholder="请输入详细地址"
                />
              </div>
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => setShowAddAddress(false)}
                  className="btn-secondary flex-1 !py-2.5"
                >
                  取消
                </button>
                <button
                  onClick={() => setShowAddAddress(false)}
                  className="btn-primary flex-1 !py-2.5"
                >
                  保存地址
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 px-4 max-w-2xl mx-auto w-full">
        <div className="card p-3 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs text-neutral-400">预估回收价</p>
            <p className="text-eco-600 text-2xl font-bold">¥{Number(estimatedPrice).toFixed(category === "phones" ? 0 : 2)}</p>
          </div>
          <button
            onClick={handleConfirm}
            className="btn-primary !px-8 !py-3 text-base"
          >
            确认预约
          </button>
        </div>
      </div>

      {selectedAddress && (
        <div className="fixed bottom-[8.5rem] left-0 right-0 px-4 max-w-2xl mx-auto w-full pointer-events-none">
          <div className="flex justify-center">
            <div className="bg-neutral-800/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {selectedAddress.detail.slice(0, 20)}...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
