import { useState } from "react";
import { Search, ShoppingCart, MapPin, Clock, Plus, Minus, ChevronDown, ChevronUp, X, Truck, Info, Tag, Bike } from "lucide-react";

type DS = "可配送" | "筋斗云配送中" | "已送达";
type PS = "充足" | "拣货中" | "补货中" | "售罄";

const zones = [{ key: "A", label: "A零食" }, { key: "B", label: "B饮料" }, { key: "C", label: "C区日用" }, { key: "D", label: "D区文具" }];

const deliveryColor: Record<DS, string> = { "可配送": "bg-green-50 text-green-600 border-green-200", "筋斗云配送中": "bg-orange-50 text-orange-600 border-orange-200", "已送达": "bg-teal-50 text-teal-600 border-teal-200" };
const deliveryTextColor: Record<DS, string> = { "可配送": "text-green-600", "筋斗云配送中": "text-orange-600", "已送达": "text-teal-600" };

const pickStatusColor: Record<PS, string> = { "充足": "text-green-600", "拣货中": "text-orange-600", "补货中": "text-yellow-600", "售罄": "text-[#E63946]" };
const pickStatusBg: Record<PS, string> = { "充足": "bg-green-50", "拣货中": "bg-orange-50", "补货中": "bg-yellow-50", "售罄": "bg-[#E63946]/5" };

interface Product {
  id: number; name: string; price: number; zone: string; shelf: string; sku: string; desc: string; image: string;
  expiryRemaining?: string; discountPrice?: number; discountLabel?: string; deliveryStatus: DS;
  stock: number; pickStatus: PS;
}

const img = (label: string, color = "#FF6B35") => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="18" fill="#fff7ed"/><rect x="28" y="24" width="104" height="112" rx="14" fill="${color}" opacity=".16"/><rect x="42" y="38" width="76" height="84" rx="10" fill="#fff"/><text x="80" y="78" text-anchor="middle" font-size="18" font-weight="700" fill="#1B3A5C">${label}</text><text x="80" y="104" text-anchor="middle" font-size="12" fill="#64748b">Campus Store</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const products: Product[] = [
  { id: 1, name: "乐事薯片原味", price: 6.5, zone: "A", shelf: "A-03-2", sku: "SNK-001", desc: "经典原味，香脆可口，70g袋装", image: img("薯片"), deliveryStatus: "可配送", stock: 48, pickStatus: "充足" },
  { id: 2, name: "卫龙辣条大面筋", price: 5, zone: "A", shelf: "A-05-1", sku: "SNK-002", desc: "网红辣条，甜辣风味，108g", image: img("辣条", "#E63946"), deliveryStatus: "可配送", stock: 36, pickStatus: "充足" },
  { id: 3, name: "奥利奥饼干", price: 9.9, zone: "A", shelf: "A-07-3", sku: "SNK-003", desc: "夹心饼干，经典可可味，97g", image: img("饼干", "#1B3A5C"), deliveryStatus: "已送达", stock: 22, pickStatus: "拣货中" },
  { id: 13, name: "良品铺子坚果混合", price: 29.9, zone: "A", shelf: "A-09-1", sku: "SNK-004", desc: "每日坚果混合装，750g大礼包", image: img("坚果", "#FFC857"), expiryRemaining: "1天", discountPrice: 14.9, discountLabel: "5折", deliveryStatus: "可配送", stock: 12, pickStatus: "补货中" },
  { id: 14, name: "百草味芒果干", price: 12.8, zone: "A", shelf: "A-11-2", sku: "SNK-005", desc: "海南芒果干，酸甜可口，120g", image: img("果干", "#2EC4B6"), deliveryStatus: "可配送", stock: 29, pickStatus: "充足" },
  { id: 4, name: "农夫山泉550ml", price: 2, zone: "B", shelf: "B-01-1", sku: "DRK-001", desc: "天然矿泉水，550ml便携装", image: img("矿泉水", "#2EC4B6"), deliveryStatus: "可配送", stock: 120, pickStatus: "充足" },
  { id: 5, name: "元气森林白桃味", price: 5.5, zone: "B", shelf: "B-02-2", sku: "DRK-002", desc: "0糖0脂0卡，白桃风味气泡水480ml", image: img("气泡水", "#FFC857"), expiryRemaining: "3天", discountPrice: 4.4, discountLabel: "8折", deliveryStatus: "筋斗云配送中", stock: 18, pickStatus: "拣货中" },
  { id: 6, name: "维他柠檬茶", price: 4.5, zone: "B", shelf: "B-04-1", sku: "DRK-003", desc: "港式柠檬茶，250ml纸盒装", image: img("柠檬茶"), deliveryStatus: "可配送", stock: 54, pickStatus: "充足" },
  { id: 7, name: "清风抽纸3连包", price: 12, zone: "C", shelf: "C-01-3", sku: "DLY-001", desc: "柔软亲肤，3连包抽纸", image: img("抽纸", "#1B3A5C"), deliveryStatus: "已送达", stock: 33, pickStatus: "充足" },
  { id: 8, name: "蓝月亮洗衣液1kg", price: 22, zone: "C", shelf: "C-03-1", sku: "DLY-002", desc: "深层洁净，薰衣草香型1kg装", image: img("洗衣液", "#2EC4B6"), deliveryStatus: "可配送", stock: 16, pickStatus: "补货中" },
  { id: 9, name: "云南白药牙膏", price: 15.8, zone: "C", shelf: "C-05-2", sku: "DLY-003", desc: "云南白药活性成分，护龈健齿120g", image: img("牙膏", "#E63946"), expiryRemaining: "5小时", discountPrice: 4.7, discountLabel: "3折", deliveryStatus: "可配送", stock: 5, pickStatus: "拣货中" },
  { id: 10, name: "晨光中性笔0.5mm", price: 3, zone: "D", shelf: "D-01-2", sku: "STN-001", desc: "晨光经典中性笔，0.5mm黑色", image: img("中性笔"), deliveryStatus: "可配送", stock: 80, pickStatus: "充足" },
  { id: 11, name: "得力A4笔记本", price: 8, zone: "D", shelf: "D-03-1", sku: "STN-002", desc: "A4硬壳笔记本，80页米黄色", image: img("笔记本", "#1B3A5C"), deliveryStatus: "可配送", stock: 41, pickStatus: "充足" },
  { id: 12, name: "百乐果汁笔套装", price: 18, zone: "D", shelf: "D-06-3", sku: "STN-003", desc: "6色果汁笔套装，0.5mm彩色中性笔", image: img("文具", "#FFC857"), deliveryStatus: "筋斗云配送中", stock: 10, pickStatus: "拣货中" },
];

const dormitories = ["梅苑1栋", "梅苑2栋", "兰苑1栋", "兰苑2栋", "竹苑1栋", "菊苑1栋"];
const deliveryTimes = ["立即配送", "30分钟后", "1小时后", "2小时后"];

const deliveryTasks = [
  { id: "JY2001", items: "元气森林×4, 薯片×1", address: "梅苑1栋302", deliverer: "张同学", status: "拣货中" as const },
  { id: "JY2002", items: "洗衣液×1, 抽纸×2", address: "兰苑2栋518", deliverer: "李同学", status: "配送中" as const },
  { id: "JY2003", items: "中性笔×5, 笔记本×2", address: "竹苑1栋106", deliverer: "王同学", status: "已送达" as const },
];
const taskStatusColor: Record<string, string> = { "拣货中": "text-orange-600 bg-orange-50", "配送中": "text-[#2EC4B6] bg-[#2EC4B6]/10", "已送达": "text-green-600 bg-green-50" };

export default function Store() {
  const [activeZone, setActiveZone] = useState("A");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [dormitory, setDormitory] = useState(dormitories[0]);
  const [deliveryTime, setDeliveryTime] = useState(deliveryTimes[0]);
  const [showTip, setShowTip] = useState<number | null>(null);
  const [lastOrder, setLastOrder] = useState<{ id: string; total: number; dormitory: string; deliveryTime: string } | null>(null);

  const zoneProducts = products.filter((p) => p.zone === activeZone);
  const matchedProducts = zoneProducts.filter((p) => search === "" || p.name.includes(search));
  const filtered = matchedProducts.length > 0 || search === "" ? matchedProducts : zoneProducts;
  const addToCart = (id: number) => {
    setLastOrder(null);
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };
  const removeFromCart = (id: number) => setCart((prev) => { const n = { ...prev }; if (n[id] > 1) n[id]--; else delete n[id]; return n; });
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((s, [id, q]) => { const p = products.find((x) => x.id === Number(id))!; return s + (p.discountPrice ?? p.price) * q; }, 0);
  const submitOrder = () => {
    setLastOrder({
      id: `SO${Date.now().toString(36).toUpperCase()}`,
      total: cartTotal,
      dormitory,
      deliveryTime,
    });
    setShowCheckout(false);
    setCart({});
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-16 bg-white border-r border-gray-100 flex flex-col pt-3 shrink-0">
        {zones.map((z) => (
          <button key={z.key} onClick={() => { setActiveZone(z.key); setExpandedId(null); }}
            className={`py-3 px-1 text-xs font-medium transition-all relative ${activeZone === z.key ? "text-[#FF6B35]" : "text-gray-500 hover:text-[#1B3A5C]"}`}>
            {activeZone === z.key && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#FF6B35] rounded-r" />}
            <div className="flex flex-col items-center gap-0.5"><span className="text-lg font-bold">{z.key}</span><span>{z.label}</span></div>
          </button>
        ))}
      </div>

      <div className="flex-1 pb-20">
        <div className="sticky top-0 z-10 bg-white px-3 py-3 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索商品..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-[#FF6B35]/40 transition" />
          </div>
          {matchedProducts.length === 0 && search !== "" && (
            <div className="mt-2 text-xs text-[#FF6B35] bg-[#FF6B35]/10 rounded-lg px-3 py-2">
              未找到“{search}”，已展示{activeZone}区可购商品
            </div>
          )}
          {lastOrder && (
            <div role="status" className="mt-2 text-xs text-[#2EC4B6] bg-[#2EC4B6]/10 rounded-lg px-3 py-2">
              订单提交成功，订单号 {lastOrder.id}，配送至 {lastOrder.dormitory}，合计 ¥{lastOrder.total.toFixed(1)}
            </div>
          )}
        </div>

        <div className="px-3 py-3 space-y-2.5">
          {filtered.map((p) => {
            const exp = expandedId === p.id;
            const isE = !!p.discountPrice;
            return (
              <div key={p.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-3 p-3 cursor-pointer" onClick={() => setExpandedId(exp ? null : p.id)}>
                  <div className="relative shrink-0">
                    <img src={p.image} alt={p.name} className="w-20 h-20 rounded-lg object-cover" />
                    {isE && <span className="absolute -top-1 -left-1 bg-[#E63946] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{p.discountLabel}</span>}
                    {p.stock === 0 && <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#E63946]/90 text-white text-[10px] px-2 py-1 rounded-full font-bold">已售罄</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-[#1B3A5C] truncate">{p.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[10px] bg-[#1B3A5C]/10 text-[#1B3A5C] px-1.5 py-0.5 rounded flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {p.shelf}</span>
                      {p.expiryRemaining && <span className="text-[10px] bg-[#E63946]/10 text-[#E63946] px-1.5 py-0.5 rounded flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> 剩{p.expiryRemaining}</span>}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${deliveryColor[p.deliveryStatus]}`}><Truck className="w-2.5 h-2.5 inline mr-0.5" />{p.deliveryStatus}</span>
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <div className="flex items-baseline gap-1.5">
                        {isE ? (<><span className="text-[10px] text-gray-400 line-through">¥{p.price}</span><span className="text-base font-bold text-[#E63946]">¥{p.discountPrice}</span>
                          <button className="relative" onClick={(e) => { e.stopPropagation(); setShowTip(showTip === p.id ? null : p.id); }}><Info className="w-3 h-3 text-gray-400" /></button></>)
                          : <span className="text-base font-bold text-[#FF6B35]">¥{p.price}</span>}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); p.stock > 0 && addToCart(p.id); }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition shadow-sm ${p.stock === 0 ? "bg-gray-300 cursor-not-allowed shadow-none" : "bg-[#FF6B35] hover:bg-[#e55e2e] shadow-[#FF6B35]/30"}`}><Plus className={`w-4 h-4 ${p.stock === 0 ? "text-gray-100" : "text-white"}`} /></button>
                    </div>
                    {showTip === p.id && isE && (
                      <div className="mt-1 text-[10px] text-gray-500 bg-gray-50 rounded px-2 py-1 flex items-center gap-1"><Tag className="w-3 h-3 text-[#FF6B35] shrink-0" />距到期{p.expiryRemaining}→自动{p.discountLabel}</div>
                    )}
                  </div>
                  <div className="self-center shrink-0">{exp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}</div>
                </div>

                {exp && (
                  <div className="px-3 pb-3 border-t border-gray-50 pt-2">
                    <p className="text-xs text-gray-600 mb-2">{p.desc}</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-400">SKU</span><span className="ml-1.5 text-[#1B3A5C] font-mono font-medium">{p.sku}</span></div>
                      <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-400">货架号</span><span className="ml-1.5 text-[#1B3A5C] font-mono font-medium">{p.shelf}</span></div>
                      <div className={`${pickStatusBg[p.pickStatus]} rounded-lg p-2`}><span className="text-gray-400">库存</span><span className={`ml-1.5 font-medium ${p.stock === 0 ? "text-[#E63946]" : "text-[#1B3A5C]"}`}>{p.stock === 0 ? "已售罄" : `${p.stock}件`}</span></div>
                      <div className={`${pickStatusBg[p.pickStatus]} rounded-lg p-2`}><span className="text-gray-400">拣货状态</span><span className={`ml-1.5 font-medium ${pickStatusColor[p.pickStatus]}`}>{p.pickStatus}</span></div>
                      {p.expiryRemaining && <div className="bg-[#E63946]/5 rounded-lg p-2"><span className="text-gray-400">到期倒计时</span><span className="ml-1.5 text-[#E63946] font-medium">剩{p.expiryRemaining}</span></div>}
                      <div className="bg-gray-50 rounded-lg p-2"><span className="text-gray-400">配送状态</span><span className={`ml-1.5 font-medium ${deliveryTextColor[p.deliveryStatus]}`}>{p.deliveryStatus}</span></div>
                    </div>
                    {isE && (
                      <div className="mt-2 bg-[#FF6B35]/5 rounded-lg p-2 flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-[#FF6B35] shrink-0 mt-0.5" />
                        <div className="text-[11px]">
                          <p className="text-[#FF6B35] font-medium">自动折扣引擎</p>
                          <p className="text-gray-500 mt-0.5">距到期≤3天→8折 | ≤1天→5折 | ≤6小时→3折</p>
                          <p className="text-[#E63946] mt-0.5">当前：剩余{p.expiryRemaining} → 触发{p.discountLabel}规则</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        {cart[p.id] && <div className="flex items-center gap-2"><button onClick={() => removeFromCart(p.id)} className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center"><Minus className="w-3 h-3 text-gray-600" /></button><span className="text-sm font-medium text-[#1B3A5C] w-5 text-center">{cart[p.id]}</span></div>}
                        <button onClick={() => addToCart(p.id)} disabled={p.stock === 0} className={`px-3 py-1.5 text-white text-xs rounded-full transition font-medium ${p.stock === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-[#FF6B35] hover:bg-[#e55e2e]"}`}>{p.stock === 0 ? "已售罄" : "加入购物车"}</button>
                      </div>
                      <span className="text-sm font-bold text-[#E63946]">¥{p.discountPrice ?? p.price}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-3 mb-4">
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Bike className="w-4 h-4 text-[#FF6B35]" />
              <h3 className="text-sm font-semibold text-[#1B3A5C]">筋斗云配送</h3>
              <span className="text-[10px] text-gray-400 ml-auto">{deliveryTasks.filter(t => t.status !== "已送达").length}单进行中</span>
            </div>
            <div className="space-y-2">
              {deliveryTasks.map((t) => (
                <div key={t.id} className="border border-gray-100 rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-400 font-mono">{t.id}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${taskStatusColor[t.status]}`}>{t.status}</span>
                  </div>
                  <p className="text-xs text-[#1B3A5C] font-medium">{t.items}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{t.address}</span>
                    <span className="text-[10px] text-[#FF6B35]">{t.deliverer}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {cartCount > 0 && !showCheckout && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 bg-[#1B3A5C] text-white px-5 py-3 rounded-full flex items-center gap-3 shadow-lg shadow-[#1B3A5C]/40 cursor-pointer" onClick={() => setShowCheckout(true)}>
          <ShoppingCart className="w-5 h-5" /><span className="text-sm font-medium">{cartCount}件</span><div className="w-px h-4 bg-white/30" /><span className="text-sm font-bold">¥{cartTotal.toFixed(1)}</span><span className="bg-[#FF6B35] text-xs px-3 py-1 rounded-full font-bold">结算</span>
        </div>
      )}

      {showCheckout && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={() => setShowCheckout(false)}>
          <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1B3A5C]">确认订单</h2><button onClick={() => setShowCheckout(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="px-4 py-3 space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">配送宿舍</label>
                <div className="grid grid-cols-3 gap-2">{dormitories.map((d) => (
                  <button key={d} onClick={() => setDormitory(d)} className={`py-2 text-xs rounded-lg border transition font-medium ${dormitory === d ? "border-[#FF6B35] bg-[#FF6B35]/5 text-[#FF6B35]" : "border-gray-200 text-gray-600"}`}>{d}</button>
                ))}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">配送时间</label>
                <div className="grid grid-cols-2 gap-2">{deliveryTimes.map((t) => (
                  <button key={t} onClick={() => setDeliveryTime(t)} className={`py-2 text-xs rounded-lg border transition font-medium ${deliveryTime === t ? "border-[#FF6B35] bg-[#FF6B35]/5 text-[#FF6B35]" : "border-gray-200 text-gray-600"}`}>{t}</button>
                ))}</div>
              </div>
              <div>
                <h3 className="text-xs text-gray-500 mb-2">商品清单</h3>
                {Object.entries(cart).map(([id, qty]) => { const pr = products.find((x) => x.id === Number(id))!; return (
                  <div key={id} className="flex justify-between py-1.5"><span className="text-sm text-gray-700">{pr.name} × {qty}</span><span className="text-sm font-medium text-[#1B3A5C]">¥{((pr.discountPrice ?? pr.price) * qty).toFixed(1)}</span></div>
                ); })}
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-between">
              <div><span className="text-xs text-gray-500">合计</span><span className="text-xl font-bold text-[#FF6B35] ml-2">¥{cartTotal.toFixed(1)}</span></div>
              <button onClick={submitOrder} className="px-6 py-2.5 bg-[#FF6B35] text-white rounded-xl font-semibold text-sm shadow-lg shadow-[#FF6B35]/30 hover:bg-[#e55e2e] transition">提交订单</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
