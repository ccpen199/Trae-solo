import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingCart, Star, Clock, MapPin, Plus, Minus, ChevronDown, X, Check, ChevronUp } from "lucide-react";

const stalls = [
  { id: "1", name: "川味小厨", canteen: "第一食堂", cuisine: "中餐", rating: 4.8, wait: 15, image: foodImage("川味", "#E63946"), menu: [
    { id: "1a", name: "麻婆豆腐", price: 14, desc: "鲜嫩豆腐配正宗花椒" }, { id: "1b", name: "宫保鸡丁", price: 18, desc: "花生鸡丁酸甜微辣" }, { id: "1c", name: "水煮鱼", price: 28, desc: "鲜鱼片麻辣入味" }, { id: "1d", name: "米饭", price: 2, desc: "东北大米" }, { id: "1e", name: "酸梅汤", price: 6, desc: "冰镇解辣" },
  ]},
  { id: "2", name: "意面工坊", canteen: "第二食堂", cuisine: "西餐", rating: 4.5, wait: 20, image: foodImage("意面", "#FFC857"), menu: [
    { id: "2a", name: "番茄肉酱意面", price: 22, desc: "经典肉酱浓郁番茄" }, { id: "2b", name: "奶油蘑菇意面", price: 25, desc: "白汁蘑菇鲜香" }, { id: "2c", name: "凯撒沙拉", price: 18, desc: "罗马生菜帕玛森" }, { id: "2d", name: "玉米浓汤", price: 8, desc: "奶香玉米暖胃" },
  ]},
  { id: "3", name: "鸡排大叔", canteen: "第一食堂", cuisine: "快餐", rating: 4.6, wait: 10, image: foodImage("鸡排", "#FF6B35"), menu: [
    { id: "3a", name: "香辣鸡排", price: 15, desc: "外酥里嫩辣味十足" }, { id: "3b", name: "蜜汁鸡排", price: 16, desc: "甜香蜜汁裹衣" }, { id: "3c", name: "薯条", price: 8, desc: "金黄酥脆" }, { id: "3d", name: "可乐", price: 4, desc: "冰爽畅饮" },
  ]},
  { id: "4", name: "茶百道", canteen: "美食广场", cuisine: "饮品", rating: 4.9, wait: 8, image: foodImage("饮品", "#2EC4B6"), menu: [
    { id: "4a", name: "杨枝甘露", price: 14, desc: "芒果西柚椰奶" }, { id: "4b", name: "豆乳玉麒麟", price: 16, desc: "豆乳奶盖醇香" }, { id: "4c", name: "桂花酒酿", price: 12, desc: "桂花清甜酒酿" }, { id: "4d", name: "茉莉奶绿", price: 10, desc: "茉莉清香奶绿" },
  ]},
  { id: "5", name: "煎饼果子", canteen: "第二食堂", cuisine: "小吃", rating: 4.7, wait: 5, image: foodImage("煎饼", "#1B3A5C"), menu: [
    { id: "5a", name: "经典煎饼", price: 8, desc: "薄脆酥香经典味" }, { id: "5b", name: "双蛋煎饼", price: 12, desc: "双蛋营养加倍" }, { id: "5c", name: "火腿煎饼", price: 10, desc: "火腿加持更满足" }, { id: "5d", name: "豆浆", price: 3, desc: "现磨热豆浆" },
  ]},
  { id: "6", name: "粤式烧腊", canteen: "美食广场", cuisine: "中餐", rating: 4.4, wait: 18, image: foodImage("烧腊", "#2D5A8E"), menu: [
    { id: "6a", name: "蜜汁叉烧饭", price: 22, desc: "蜜汁叉烧配米饭" }, { id: "6b", name: "白切鸡饭", price: 20, desc: "嫩滑白切鸡" }, { id: "6c", name: "烧鸭饭", price: 24, desc: "脆皮烧鸭饭" }, { id: "6d", name: "例汤", price: 3, desc: "老火靓汤" },
  ]},
];

function foodImage(label: string, color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="20" fill="#fff7ed"/><circle cx="80" cy="74" r="46" fill="${color}" opacity=".18"/><circle cx="80" cy="74" r="34" fill="#fff"/><text x="80" y="82" text-anchor="middle" font-size="20" font-weight="700" fill="#1B3A5C">${label}</text><text x="80" y="122" text-anchor="middle" font-size="12" fill="#64748b">Campus Dining</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const categories = ["全部", "中餐", "西餐", "快餐", "饮品", "小吃"];
const dorms = ["桃李苑1号楼", "桃李苑3号楼", "银杏苑1号楼", "竹园7号楼", "梅园宿舍"];
const timeslots = ["立即配送", "11:30", "12:00", "12:30", "17:30", "18:00", "18:30"];
const deliveryFees: Record<string, number> = { "桃李苑1号楼": 2, "桃李苑3号楼": 2, "银杏苑1号楼": 3, "竹园7号楼": 4, "梅园宿舍": 5 };

interface CartItem { id: string; name: string; price: number; qty: number; stallId: string; stallName: string }

export default function Dining() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [dorm, setDorm] = useState(dorms[0]);
  const [timeslot, setTimeslot] = useState(timeslots[0]);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [orderId] = useState(() => "ORD" + Date.now().toString(36).toUpperCase());
  const [deliveryMode, setDeliveryMode] = useState<"到店自取" | "配送到寝">("配送到寝");
  const [currentStep, setCurrentStep] = useState(0);
  const [deliveryCode] = useState(() => String(Math.floor(100000 + Math.random() * 900000)));
  const [received, setReceived] = useState(false);

  useEffect(() => {
    if (!submitted) return;
    const t1 = setTimeout(() => setCurrentStep(1), 2000);
    const t2 = setTimeout(() => setCurrentStep(2), 5000);
    const t3 = setTimeout(() => setCurrentStep(3), 8000);
    const t4 = setTimeout(() => setCurrentStep(4), 11000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [submitted]);

  const matched = stalls.filter((s) => {
    const matchSearch = s.name.includes(search) || s.canteen.includes(search);
    const matchCategory = activeCategory === "全部" || s.cuisine === activeCategory;
    return matchSearch && matchCategory;
  });
  const categoryFallback = stalls.filter((s) => activeCategory === "全部" || s.cuisine === activeCategory);
  const filtered = matched.length > 0 || search === "" ? matched : categoryFallback;

  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const fee = deliveryMode === "到店自取" ? 0 : (deliveryFees[dorm] ?? 3);
  const total = subtotal + fee;

  const addItem = (stallId: string, stallName: string, item: { id: string; name: string; price: number }) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.id === item.id);
      if (ex) return prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1, stallId, stallName }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((c) => c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter((c) => c.qty > 0));
  };

  const getItemQty = (id: string) => cart.find((c) => c.id === id)?.qty ?? 0;

  if (submitted) {
    const steps = ["已下单", "备餐中", "骑手取餐", "配送中", "到寝交付"];
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-10 bg-[#1B3A5C] text-white px-4 py-3 flex items-center">
          <h1 className="text-base font-semibold">订单确认</h1>
        </div>
        <div className="px-4 py-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 text-center">
            <div className="w-16 h-16 bg-[#2EC4B6]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8 text-[#2EC4B6]" />
            </div>
            <h2 className="text-lg font-bold text-[#1B3A5C]">下单成功！</h2>
            <p className="text-sm text-gray-500 mt-1">订单号：{orderId}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <div className="flex items-center justify-between">
              {steps.map((step, i) => (
                <div key={step} className="flex flex-col items-center flex-1 relative">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${i < currentStep ? "bg-[#2EC4B6] text-white" : i === currentStep ? "bg-[#FF6B35] text-white scale-110 shadow-md shadow-[#FF6B35]/30" : "bg-gray-200 text-gray-400"}`}>
                    {i < currentStep ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={`text-[10px] mt-1 transition-colors duration-300 ${i <= currentStep ? "text-[#1B3A5C] font-medium" : "text-gray-400"}`}>{step}</span>
                  {i < steps.length - 1 && <div className={`absolute top-3.5 left-1/2 w-full h-0.5 transition-colors duration-500 ${i < currentStep ? "bg-[#2EC4B6]" : "bg-gray-200"}`} />}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h3 className="text-sm font-semibold text-[#1B3A5C] mb-2">配送信息</h3>
            <p className="text-xs text-gray-600">方式：{deliveryMode}{deliveryMode === "到店自取" ? "（到店取餐）" : ""}</p>
            {deliveryMode === "配送到寝" && <p className="text-xs text-gray-600">宿舍：{dorm}</p>}
            <p className="text-xs text-gray-600">时段：{timeslot}</p>
            {note && <p className="text-xs text-gray-600">备注：{note}</p>}
          </div>
          {deliveryMode === "配送到寝" && currentStep >= 2 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <h3 className="text-sm font-semibold text-[#1B3A5C] mb-3">配送路径</h3>
              <div className="relative flex items-center justify-between px-2">
                <div className="absolute top-3 left-6 right-6 h-0.5 bg-gray-200" />
                <div className={`absolute top-3 left-6 h-0.5 bg-[#2EC4B6] transition-all duration-700`} style={{ width: `${Math.min((currentStep - 2) * 33.3, 100)}%` }} />
                {[
                  { label: "档口", pos: 0 },
                  { label: "校园东门", pos: 1 },
                  { label: "宿舍区", pos: 2 },
                  { label: dorm, pos: 3 },
                ].map((point, pi) => (
                  <div key={pi} className="relative flex flex-col items-center z-10">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all duration-300 ${
                      currentStep >= 2 && pi <= (currentStep - 2) ? "bg-[#2EC4B6] text-white" : "bg-gray-200 text-gray-400"
                    } ${currentStep >= 2 && pi === Math.min(currentStep - 2, 3) ? "ring-2 ring-[#FF6B35] ring-offset-1 scale-110" : ""}`}>
                      {currentStep >= 2 && pi === Math.min(currentStep - 2, 3) ? <div className="w-2.5 h-2.5 bg-[#FF6B35] rounded-full animate-pulse" /> : <div className="w-2 h-2 bg-current rounded-full" />}
                    </div>
                    <span className={`text-[9px] mt-1 text-center max-w-[48px] ${currentStep >= 2 && pi <= (currentStep - 2) ? "text-[#1B3A5C] font-medium" : "text-gray-400"}`}>{point.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {currentStep >= 3 && !received && (
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 text-center">
              <h3 className="text-sm font-semibold text-[#1B3A5C] mb-2">交付码</h3>
              <p className="text-xs text-gray-400 mb-3">请将此码出示给配送员</p>
              <div className="flex justify-center gap-1.5 mb-4">
                {deliveryCode.split("").map((ch, i) => (
                  <span key={i} className="w-9 h-11 bg-[#1B3A5C]/5 border border-[#1B3A5C]/20 rounded-lg flex items-center justify-center text-xl font-bold text-[#1B3A5C]">{ch}</span>
                ))}
              </div>
              <button onClick={() => setReceived(true)} className="w-full py-2.5 bg-[#2EC4B6] text-white rounded-xl font-semibold text-sm shadow-md shadow-[#2EC4B6]/30 hover:bg-[#28b0a3] transition">确认收货</button>
            </div>
          )}
          {received && (
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 text-center">
              <div className="w-12 h-12 bg-[#2EC4B6]/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Check className="w-6 h-6 text-[#2EC4B6]" />
              </div>
              <h3 className="text-sm font-bold text-[#1B3A5C]">已确认收货</h3>
              <p className="text-xs text-gray-400 mt-1">感谢使用校园餐饮配送</p>
            </div>
          )}
          <Link to={`/dining/order/${orderId}`} className="block w-full py-3 bg-[#FF6B35] text-white rounded-xl font-semibold text-sm text-center shadow-lg shadow-[#FF6B35]/30 hover:bg-[#e55e2e] transition">
            查看完整配送追踪 →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-20 bg-white shadow-sm px-4 pt-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索档口或食堂..." className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-[#FF6B35]/40 transition" />
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((c) => (
            <button key={c} onClick={() => setActiveCategory(c)} className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${activeCategory === c ? "bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/30" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{c}</button>
          ))}
        </div>
        {matched.length === 0 && search !== "" && (
          <div className="mt-2 text-xs text-[#FF6B35] bg-[#FF6B35]/10 rounded-lg px-3 py-2">
            未找到“{search}”，已展示当前分类可下单档口
          </div>
        )}
      </div>

      <div className="px-4 py-4 space-y-3">
        {filtered.map((stall) => {
          const isOpen = expanded === stall.id;
          return (
            <div key={stall.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <button onClick={() => setExpanded(isOpen ? null : stall.id)} className="w-full flex items-center gap-3 p-3 text-left">
                <img src={stall.image} alt={stall.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#1B3A5C] text-sm truncate">{stall.name}</h3>
                    <span className="shrink-0 bg-[#1B3A5C]/80 text-white text-[10px] px-1.5 py-0.5 rounded-full">{stall.cuisine}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-gray-500 text-xs">
                    <MapPin className="w-3 h-3" /><span>{stall.canteen}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-0.5"><Star className="w-3.5 h-3.5 text-[#FFC857] fill-[#FFC857]" /><span className="text-xs font-medium text-[#1B3A5C]">{stall.rating}</span></div>
                    <div className="flex items-center gap-1 text-[#2EC4B6]"><Clock className="w-3 h-3" /><span className="text-xs font-medium">~{stall.wait}分钟</span></div>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
              </button>
              {isOpen && (
                <div className="border-t border-gray-100 px-3 pb-3">
                  {stall.menu.map((item) => {
                    const q = getItemQty(item.id);
                    return (
                      <div key={item.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="text-sm font-medium text-[#1B3A5C]">{item.name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{item.desc}</p>
                          <p className="text-sm font-bold text-[#FF6B35] mt-0.5">¥{item.price}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {q > 0 && (
                            <>
                              <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                                <Minus className="w-3.5 h-3.5 text-gray-600" />
                              </button>
                              <span className="text-sm font-semibold text-[#1B3A5C] w-5 text-center">{q}</span>
                            </>
                          )}
                          <button onClick={() => addItem(stall.id, stall.name, item)} className="w-7 h-7 rounded-full bg-[#FF6B35] flex items-center justify-center hover:bg-[#e55e2e] transition shadow-sm shadow-[#FF6B35]/30">
                            <Plus className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <div className="text-center text-gray-400 mt-16 text-sm">没有找到匹配的档口</div>}
      </div>

      {totalQty > 0 && !checkoutOpen && (
        <button onClick={() => setCheckoutOpen(true)} className="fixed bottom-0 left-0 right-0 z-30 bg-[#1B3A5C] text-white px-4 py-3 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
          <div className="flex items-center gap-2">
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 bg-[#E63946] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{totalQty}</span>
            </div>
            <span className="text-sm">¥{subtotal.toFixed(0)}</span>
          </div>
          <span className="bg-[#FF6B35] px-5 py-2 rounded-lg text-sm font-semibold">去结算</span>
        </button>
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setCheckoutOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-[#1B3A5C]">确认订单</h2>
              <button onClick={() => setCheckoutOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="px-4 py-3 space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div><p className="text-sm text-[#1B3A5C]">{item.name}<span className="text-xs text-gray-400 ml-1">({item.stallName})</span></p><p className="text-xs text-gray-500">¥{item.price}</p></div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeQty(item.id, -1)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"><Minus className="w-3 h-3 text-gray-600" /></button>
                    <span className="text-sm font-semibold w-4 text-center">{item.qty}</span>
                    <button onClick={() => changeQty(item.id, 1)} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center"><Plus className="w-3 h-3 text-gray-600" /></button>
                  </div>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-3 space-y-2.5">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">配送方式</label>
                  <div className="flex gap-2">
                    <button onClick={() => setDeliveryMode("到店自取")} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition ${deliveryMode === "到店自取" ? "border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]" : "border-gray-200 bg-gray-50 text-gray-600"}`}>到店自取<div className="text-[10px] font-normal text-gray-400">免配送费</div></button>
                    <button onClick={() => setDeliveryMode("配送到寝")} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition ${deliveryMode === "配送到寝" ? "border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]" : "border-gray-200 bg-gray-50 text-gray-600"}`}>配送到寝<div className="text-[10px] font-normal text-gray-400">配送费¥{deliveryFees[dorm] ?? 3}</div></button>
                  </div>
                </div>
                {deliveryMode === "配送到寝" && (
                  <div><label className="text-xs text-gray-500 mb-1 block">宿舍楼</label>
                    <select value={dorm} onChange={(e) => setDorm(e.target.value)} className="w-full py-2 px-3 rounded-lg bg-gray-50 text-sm border border-gray-200 outline-none focus:border-[#FF6B35]">
                      {dorms.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
                <div><label className="text-xs text-gray-500 mb-1 block">配送时段</label>
                  <select value={timeslot} onChange={(e) => setTimeslot(e.target.value)} className="w-full py-2 px-3 rounded-lg bg-gray-50 text-sm border border-gray-200 outline-none focus:border-[#FF6B35]">
                    {timeslots.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-gray-500 mb-1 block">备注</label>
                  <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="如：少辣、多加饭..." className="w-full py-2 px-3 rounded-lg bg-gray-50 text-sm border border-gray-200 outline-none focus:border-[#FF6B35]" />
                </div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">配送费</span><span className="text-[#1B3A5C] font-medium">¥{fee}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">小计</span><span className="text-[#1B3A5C] font-medium">¥{subtotal.toFixed(0)}</span></div>
                <div className="flex justify-between pt-2 border-t border-gray-100"><span className="font-bold text-[#1B3A5C]">合计</span><span className="text-lg font-bold text-[#FF6B35]">¥{total.toFixed(0)}</span></div>
              </div>
              <button onClick={() => { setCheckoutOpen(false); setSubmitted(true); }} className="w-full py-3 bg-[#FF6B35] text-white rounded-xl font-semibold text-sm shadow-lg shadow-[#FF6B35]/30 hover:bg-[#e55e2e] transition mt-2">提交订单</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
