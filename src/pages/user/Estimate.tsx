import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Shirt,
  BookOpen,
  Smartphone,
  ChevronDown,
  Info,
  ArrowRight,
  Sparkles,
  Scale,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CategoryKey = "clothes" | "books" | "phones";

const categories: { key: CategoryKey; label: string; icon: typeof Shirt }[] = [
  { key: "clothes", label: "衣服", icon: Shirt },
  { key: "books", label: "图书", icon: BookOpen },
  { key: "phones", label: "手机", icon: Smartphone },
];

const brands: Record<CategoryKey, string[]> = {
  clothes: ["优衣库", "Nike", "Adidas", "ZARA", "H&M", "无印良品", "其他"],
  books: ["人民文学", "商务印书馆", "中信出版社", "机械工业", "其他"],
  phones: ["Apple", "华为", "小米", "OPPO", "vivo", "三星", "其他"],
};

const models: Record<CategoryKey, Record<string, string[]>> = {
  clothes: {
    优衣库: ["T恤", "卫衣", "羽绒服", "牛仔裤", "外套"],
    Nike: ["运动鞋", "T恤", "卫衣", "外套"],
    Adidas: ["运动鞋", "T恤", "卫衣", "外套"],
    ZARA: ["连衣裙", "外套", "衬衫", "裤子"],
    "H&M": ["T恤", "连衣裙", "外套"],
    无印良品: ["衬衫", "外套", "裤子"],
    其他: ["上衣", "下装", "外套", "鞋靴"],
  },
  books: {
    人民文学: ["小说", "散文", "诗歌", "经典名著"],
    商务印书馆: ["工具书", "学术著作", "译著"],
    中信出版社: ["商业", "经济", "科普", "传记"],
    机械工业: ["计算机", "工程", "技术"],
    其他: ["文学", "教育", "科技", "艺术"],
  },
  phones: {
    Apple: ["iPhone 15", "iPhone 14", "iPhone 13", "iPhone 12", "iPhone 11"],
    华为: ["Mate 60", "Mate 50", "P60", "P50", "Nova系列"],
    小米: ["小米14", "小米13", "Redmi K70", "Redmi K60"],
    OPPO: ["Find X7", "Find X6", "Reno 11", "Reno 10"],
    vivo: ["X100", "X90", "S18", "S17"],
    三星: ["Galaxy S24", "Galaxy S23", "Galaxy A54"],
    其他: ["旗舰机型", "中端机型", "入门机型"],
  },
};

const conditionLabels: Record<number, string> = {
  1: "严重损坏",
  3: "较旧磨损",
  5: "一般成色",
  7: "较新良好",
  9: "几乎全新",
  10: "全新未使用",
};

function getConditionLabel(v: number) {
  const keys = Object.keys(conditionLabels)
    .map(Number)
    .sort((a, b) => a - b);
  let label = conditionLabels[keys[0]];
  for (const k of keys) {
    if (v >= k) label = conditionLabels[k];
  }
  return label;
}

export default function Estimate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [category, setCategory] = useState<CategoryKey>(
    (params.get("category") as CategoryKey) || "clothes"
  );
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [condition, setCondition] = useState(7);
  const [quantity, setQuantity] = useState(1);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  useEffect(() => {
    setBrand("");
    setModel("");
  }, [category]);

  useEffect(() => {
    setModel("");
  }, [brand]);

  const basePrice: Record<CategoryKey, number> = {
    clothes: 3.5,
    books: 2.0,
    phones: 600,
  };

  const brandFactor = brand ? 1.1 : 1.0;
  const modelFactor = model ? 1.15 : 1.0;
  const conditionFactor = condition / 7;

  const unitPrice = basePrice[category] * brandFactor * modelFactor * conditionFactor;
  const minPrice = unitPrice * 0.85 * quantity;
  const maxPrice = unitPrice * 1.1 * quantity;

  const priceDetails = [
    {
      label: category === "phones" ? "基础估价" : "品类单价",
      value: `¥${(basePrice[category] * (category === "phones" ? 1 : quantity)).toFixed(category === "phones" ? 0 : 2)}`,
    },
    { label: "品牌加成", value: brand ? `+¥${(basePrice[category] * 0.1 * quantity).toFixed(category === "phones" ? 0 : 2)}` : "¥0.00" },
    { label: "成色系数", value: `×${(condition / 7).toFixed(2)}` },
    { label: "数量/重量", value: category === "phones" ? "1件" : `${quantity}${category === "clothes" ? "kg" : "本"}` },
  ];

  return (
    <div className="pb-8 animate-fade-in">
      <div className="px-4 pt-4">
        <div className="card overflow-hidden">
          <div className="flex border-b border-neutral-100">
            {categories.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  setCategory(key);
                }}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-4 transition-all duration-300 relative",
                  category === key
                    ? "text-eco-600"
                    : "text-neutral-400 hover:text-neutral-600"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-300",
                    category === key && "scale-110"
                  )}
                />
                <span className="text-sm font-medium">{label}</span>
                {category === key && (
                  <span className="absolute bottom-0 w-10 h-0.5 bg-gradient-to-r from-eco-400 to-eco-600 rounded-full animate-fade-in" />
                )}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-5 animate-slide-up">
            <div>
              <label className="label-base">
                {category === "books" ? "出版社" : "品牌"}
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                  className={cn(
                    "input-base text-left flex items-center justify-between",
                    !brand && "text-neutral-400"
                  )}
                >
                  <span>{brand || `请选择${category === "books" ? "出版社" : "品牌"}`}</span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      showBrandDropdown && "rotate-180"
                    )}
                  />
                </button>
                {showBrandDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-neutral-200 shadow-lg z-20 max-h-48 overflow-y-auto animate-fade-in">
                    {brands[category].map((b) => (
                      <button
                        key={b}
                        onClick={() => {
                          setBrand(b);
                          setShowBrandDropdown(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-sm hover:bg-eco-50 transition-colors",
                          brand === b && "text-eco-600 font-medium bg-eco-50"
                        )}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {brand && category !== "clothes" && (
              <div className="animate-slide-up">
                <label className="label-base">
                  {category === "phones" ? "型号" : "图书分类"}
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className={cn(
                      "input-base text-left flex items-center justify-between",
                      !model && "text-neutral-400"
                    )}
                  >
                    <span>{model || `请选择${category === "phones" ? "型号" : "分类"}`}</span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        showModelDropdown && "rotate-180"
                      )}
                    />
                  </button>
                  {showModelDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-neutral-200 shadow-lg z-20 max-h-48 overflow-y-auto animate-fade-in">
                      {(models[category][brand] || []).map((m) => (
                        <button
                          key={m}
                          onClick={() => {
                            setModel(m);
                            setShowModelDropdown(false);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2.5 text-sm hover:bg-eco-50 transition-colors",
                            model === m && "text-eco-600 font-medium bg-eco-50"
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="label-base !mb-0">物品成色</label>
                <span className="text-eco-600 font-semibold text-sm">
                  {getConditionLabel(condition)} · {condition}/10
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={condition}
                onChange={(e) => setCondition(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-eco-500"
              />
              <div className="flex justify-between mt-1.5 text-xs text-neutral-400">
                <span>损坏</span>
                <span>一般</span>
                <span>良好</span>
                <span>全新</span>
              </div>
            </div>

            <div>
              <label className="label-base">
                {category === "clothes"
                  ? "预估重量"
                  : category === "books"
                  ? "图书数量"
                  : "数量"}
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors text-xl font-medium"
                >
                  −
                </button>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="input-base text-center text-lg font-semibold"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                    {category === "clothes" ? "kg" : category === "books" ? "本" : "件"}
                  </span>
                </div>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-xl bg-eco-100 flex items-center justify-center text-eco-600 hover:bg-eco-200 transition-colors text-xl font-medium"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <div className="card p-5 bg-gradient-to-br from-eco-50 to-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-eco-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-neutral-800">实时估价结果</h3>
          </div>

          <div className="text-center py-3">
            <p className="text-sm text-neutral-500">预估回收价格区间</p>
            <div className="mt-2 flex items-end justify-center gap-1">
              <span className="text-eco-600 text-4xl font-bold tracking-tight">
                ¥{minPrice.toFixed(category === "phones" ? 0 : 2)}
              </span>
              <span className="text-neutral-400 text-lg mb-1.5 mx-1">~</span>
              <span className="text-eco-700 text-4xl font-bold tracking-tight">
                ¥{maxPrice.toFixed(category === "phones" ? 0 : 2)}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-2 flex items-center justify-center gap-1">
              <Info className="w-3 h-3" />
              最终价格以质检结果为准
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-eco-100 space-y-2.5">
            {priceDetails.map((d) => (
              <div key={d.label} className="flex justify-between text-sm">
                <span className="text-neutral-500 flex items-center gap-1.5">
                  {d.label === "品类单价" && <Scale className="w-3.5 h-3.5" />}
                  {d.label === "数量/重量" && <Package className="w-3.5 h-3.5" />}
                  {d.label}
                </span>
                <span className="text-neutral-700 font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 px-4 max-w-2xl mx-auto w-full">
        <button
          onClick={() =>
            navigate("/user/booking", {
              state: { category, brand, model, condition, quantity, estimatedPrice: maxPrice },
            })
          }
          className="w-full btn-primary text-base gap-2"
        >
          立即预约上门
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
