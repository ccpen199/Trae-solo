import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Shirt,
  BookOpen,
  Smartphone,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Star,
  Truck,
  Plus,
  X,
  Check,
  Calendar,
  User,
  Phone,
  Sparkles,
  ArrowRight,
  Info,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import type { Category, Address, TimeWindow, Courier, Order } from "../../../shared/types";
import dayjs from "dayjs";

type MaterialType = "纯棉" | "涤纶" | "羊毛" | "真丝" | "牛仔" | "混纺" | "羽绒" | "其他";
type SeasonType = "春夏" | "秋冬" | "四季";
type BookCondition = "全新" | "九成新" | "七成新" | "五成新" | "残损";
type WarrantyStatus = "在保" | "过保";
type ScreenCondition = "完好" | "轻微划痕" | "碎屏";
type BatteryHealth = ">80%" | "50-80%" | "<50%";

const materials: MaterialType[] = ["纯棉", "涤纶", "羊毛", "真丝", "牛仔", "混纺", "羽绒", "其他"];
const seasons: SeasonType[] = ["春夏", "秋冬", "四季"];
const bookConditions: BookCondition[] = ["全新", "九成新", "七成新", "五成新", "残损"];
const warrantyStatuses: WarrantyStatus[] = ["在保", "过保"];
const screenConditions: ScreenCondition[] = ["完好", "轻微划痕", "碎屏"];
const batteryHealths: BatteryHealth[] = [">80%", "50-80%", "<50%"];
const bookCategories: string[] = [
  "文学小说",
  "经管励志",
  "科技计算机",
  "童书绘本",
  "教材教辅",
  "人文社科",
  "生活艺术",
  "外文原版",
];

const brands: Record<Category, string[]> = {
  clothing: ["优衣库", "Nike", "Adidas", "ZARA", "H&M", "无印良品", "李宁", "其他"],
  books: ["人民文学", "商务印书馆", "中信出版社", "机械工业", "中华书局", "其他"],
  phones: ["Apple", "华为", "小米", "OPPO", "vivo", "三星", "荣耀", "其他"],
};

const models: Record<Category, Record<string, string[]>> = {
  clothing: {
    优衣库: ["T恤", "卫衣", "羽绒服", "牛仔裤", "外套", "衬衫"],
    Nike: ["运动鞋", "T恤", "卫衣", "外套", "运动裤"],
    Adidas: ["运动鞋", "T恤", "卫衣", "外套", "运动裤"],
    ZARA: ["连衣裙", "外套", "衬衫", "裤子", "西装"],
    "H&M": ["T恤", "连衣裙", "外套", "牛仔裤"],
    无印良品: ["衬衫", "外套", "裤子", "毛衣"],
    李宁: ["运动鞋", "T恤", "卫衣", "外套"],
    其他: ["上衣", "下装", "外套", "鞋靴", "配饰"],
  },
  books: {
    人民文学: ["小说", "散文", "诗歌", "经典名著"],
    商务印书馆: ["工具书", "学术著作", "译著", "词典"],
    中信出版社: ["商业", "经济", "科普", "传记", "心理学"],
    机械工业: ["计算机", "工程", "技术", "管理"],
    中华书局: ["古籍", "历史", "哲学", "国学"],
    其他: ["文学", "教育", "科技", "艺术", "儿童"],
  },
  phones: {
    Apple: ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15", "iPhone 14 Pro", "iPhone 14", "iPhone 13", "iPhone 12"],
    华为: ["Mate 60 Pro+", "Mate 60 Pro", "Mate 60", "P60 Pro", "P60", "Nova 12", "Mate X5"],
    小米: ["小米14 Ultra", "小米14 Pro", "小米14", "小米13", "Redmi K70 Pro", "Redmi K70"],
    OPPO: ["Find X7 Ultra", "Find X7", "Find X6 Pro", "Reno 11 Pro", "Reno 11"],
    vivo: ["X100 Pro", "X100", "X90 Pro", "S18 Pro", "S18"],
    三星: ["Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", "Galaxy Z Fold5", "Galaxy A54"],
    荣耀: ["Magic6 Pro", "Magic6", "Magic5 Pro", "荣耀100 Pro", "荣耀100"],
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

interface ClothingFields {
  material: MaterialType | "";
  season: SeasonType | "";
  style: string;
  weightKg: number;
}

interface BookFields {
  isbn: string;
  bookCondition: BookCondition | "";
  hasNotes: boolean;
  isGenuine: boolean;
  publisher: string;
  bookCategory: string;
  quantity: number;
}

interface PhoneFields {
  purchaseYear: number;
  purchaseMonth: number;
  warrantyStatus: WarrantyStatus | "";
  screenCondition: ScreenCondition | "";
  batteryHealth: BatteryHealth | "";
  hasWaterDamage: boolean;
  hasRepaired: boolean;
  quantity: number;
}

interface PriceBreakdownItem {
  description: string;
  amount: number;
  isAdd: boolean;
}

interface MatchedCourier extends Courier {
  distanceKm: number;
  etaMinutes: number;
  todayOrders: number;
  isRecommended: boolean;
}

const getConditionLabel = (v: number): string => {
  const keys = Object.keys(conditionLabels)
    .map(Number)
    .sort((a, b) => a - b);
  let label = conditionLabels[keys[0]];
  for (const k of keys) {
    if (v >= k) label = conditionLabels[k];
  }
  return label;
};

const categoryOptions: { key: Category; label: string; icon: typeof Shirt }[] = [
  { key: "clothing", label: "衣服", icon: Shirt },
  { key: "books", label: "图书", icon: BookOpen },
  { key: "phones", label: "手机", icon: Smartphone },
];

const basePrices: Record<Category, number> = {
  clothing: 2.5,
  books: 1.5,
  phones: 400,
};

const brandFactors: Record<string, number> = {
  Nike: 1.08,
  Adidas: 1.06,
  Apple: 1.2,
  华为: 1.15,
  三星: 1.1,
  ZARA: 1.04,
  优衣库: 1.03,
  李宁: 1.05,
  中信出版社: 1.02,
  商务印书馆: 1.03,
  人民文学: 1.02,
  中华书局: 1.04,
};

export default function Estimate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { addresses, timeWindows, couriers, addOrder, currentUser } = useStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [category, setCategory] = useState<Category>(
    (params.get("category") as Category) || "clothing"
  );
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [condition, setCondition] = useState(7);

  const [clothingFields, setClothingFields] = useState<ClothingFields>({
    material: "",
    season: "",
    style: "",
    weightKg: 1,
  });

  const [bookFields, setBookFields] = useState<BookFields>({
    isbn: "",
    bookCondition: "",
    hasNotes: false,
    isGenuine: true,
    publisher: "",
    bookCategory: "",
    quantity: 1,
  });

  const [phoneFields, setPhoneFields] = useState<PhoneFields>({
    purchaseYear: new Date().getFullYear(),
    purchaseMonth: new Date().getMonth() + 1,
    warrantyStatus: "",
    screenCondition: "",
    batteryHealth: "",
    hasWaterDamage: false,
    hasRepaired: false,
    quantity: 1,
  });

  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<TimeWindow | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(
    addresses.find((a) => a.isDefault) || addresses[0] || null
  );
  const [selectedCourier, setSelectedCourier] = useState<MatchedCourier | null>(null);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    province: "",
    city: "",
    district: "",
    detail: "",
    contactName: "",
    contactPhone: "",
  });

  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  useEffect(() => {
    setBrand("");
    setModel("");
    setClothingFields({ material: "", season: "", style: "", weightKg: 1 });
    setBookFields({
      isbn: "",
      bookCondition: "",
      hasNotes: false,
      isGenuine: true,
      publisher: "",
      bookCategory: "",
      quantity: 1,
    });
    setPhoneFields({
      purchaseYear: new Date().getFullYear(),
      purchaseMonth: new Date().getMonth() + 1,
      warrantyStatus: "",
      screenCondition: "",
      batteryHealth: "",
      hasWaterDamage: false,
      hasRepaired: false,
      quantity: 1,
    });
    setCondition(7);
  }, [category]);

  useEffect(() => {
    setModel("");
  }, [brand]);

  const availableDates = useMemo(() => {
    const dates: { date: string; label: string; weekday: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = dayjs().add(i, "day");
      dates.push({
        date: d.format("YYYY-MM-DD"),
        label: d.format("MM/DD"),
        weekday: i === 0 ? "今天" : i === 1 ? "明天" : ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d.day()],
      });
    }
    return dates;
  }, []);

  const availableTimeWindows = useMemo(() => {
    const slots = timeWindows.filter((tw) => tw.date === selectedDate);
    if (slots.length > 0) return slots;
    return [
      { id: `${selectedDate}-1`, date: selectedDate, startTime: "09:00", endTime: "11:00", available: true },
      { id: `${selectedDate}-2`, date: selectedDate, startTime: "11:00", endTime: "13:00", available: true },
      { id: `${selectedDate}-3`, date: selectedDate, startTime: "14:00", endTime: "16:00", available: Math.random() > 0.3 },
      { id: `${selectedDate}-4`, date: selectedDate, startTime: "16:00", endTime: "18:00", available: true },
      { id: `${selectedDate}-5`, date: selectedDate, startTime: "18:00", endTime: "20:00", available: Math.random() > 0.5 },
    ];
  }, [selectedDate, timeWindows]);

  const matchedCouriers = useMemo<MatchedCourier[]>(() => {
    if (!selectedDate || !selectedTimeWindow || !selectedAddress) return [];
    const onlineCouriers = couriers.filter((c) => c.status === "online");
    return onlineCouriers
      .map((c, idx) => ({
        ...c,
        distanceKm: Number((0.5 + Math.random() * 4.5).toFixed(1)),
        etaMinutes: Math.floor(15 + Math.random() * 45),
        todayOrders: Math.floor(3 + Math.random() * 15),
        isRecommended: idx === 0,
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [selectedDate, selectedTimeWindow, selectedAddress, couriers]);

  useEffect(() => {
    if (matchedCouriers.length > 0 && !selectedCourier) {
      setSelectedCourier(matchedCouriers[0]);
    }
    if (matchedCouriers.length === 0) {
      setSelectedCourier(null);
    }
  }, [matchedCouriers, selectedCourier]);

  const { priceBreakdown, minPrice, maxPrice, totalPrice } = useMemo(() => {
    const breakdown: PriceBreakdownItem[] = [];
    let baseAmount = 0;

    if (category === "clothing") {
      const weight = clothingFields.weightKg || 1;
      baseAmount = basePrices.clothing * weight;
      breakdown.push({
        description: `衣物基础定价 ${basePrices.clothing.toFixed(1)}元/kg × ${weight.toFixed(1)}kg`,
        amount: baseAmount,
        isAdd: true,
      });
    } else if (category === "books") {
      const qty = bookFields.quantity || 1;
      const perBook = basePrices.books;
      baseAmount = perBook * qty;
      breakdown.push({
        description: `图书基础定价 ${perBook.toFixed(1)}元/本 × ${qty}本`,
        amount: baseAmount,
        isAdd: true,
      });
    } else {
      const qty = phoneFields.quantity || 1;
      baseAmount = basePrices.phones * qty;
      breakdown.push({
        description: `手机基础估价 ${basePrices.phones}元/件 × ${qty}件`,
        amount: baseAmount,
        isAdd: true,
      });
    }

    const conditionFactor = 1 + (condition - 7) * 0.05;
    if (conditionFactor !== 1) {
      const delta = baseAmount * (conditionFactor - 1);
      breakdown.push({
        description: `成色${condition > 7 ? "加成" : "扣减"} ×${conditionFactor.toFixed(2)}`,
        amount: Number(Math.abs(delta).toFixed(2)),
        isAdd: condition > 7,
      });
    }

    const brandFactor = brandFactors[brand] || 1;
    if (brandFactor !== 1) {
      const delta = baseAmount * (brandFactor - 1);
      breakdown.push({
        description: `品牌加成 ${brand} ×${brandFactor.toFixed(2)}`,
        amount: Number(delta.toFixed(2)),
        isAdd: true,
      });
    }

    if (category === "clothing") {
      if (clothingFields.material === "真丝" || clothingFields.material === "羊毛") {
        const delta = baseAmount * 0.1;
        breakdown.push({
          description: `贵重材质加成 ${clothingFields.material} +10%`,
          amount: Number(delta.toFixed(2)),
          isAdd: true,
        });
      }
      if (clothingFields.material === "羽绒") {
        const delta = baseAmount * 0.15;
        breakdown.push({
          description: `羽绒材质加成 +15%`,
          amount: Number(delta.toFixed(2)),
          isAdd: true,
        });
      }
    }

    if (category === "books") {
      if (bookFields.bookCondition === "全新") {
        const delta = baseAmount * 0.2;
        breakdown.push({
          description: `全新品相加成 +20%`,
          amount: Number(delta.toFixed(2)),
          isAdd: true,
        });
      } else if (bookFields.bookCondition === "九成新") {
        const delta = baseAmount * 0.1;
        breakdown.push({
          description: `九成新品相加成 +10%`,
          amount: Number(delta.toFixed(2)),
          isAdd: true,
        });
      } else if (bookFields.bookCondition === "残损") {
        const delta = baseAmount * 0.4;
        breakdown.push({
          description: `残损品相扣减 -40%`,
          amount: Number(delta.toFixed(2)),
          isAdd: false,
        });
      }
      if (bookFields.hasNotes) {
        const delta = baseAmount * 0.05;
        breakdown.push({
          description: `有笔记/画线扣减 -5%`,
          amount: Number(delta.toFixed(2)),
          isAdd: false,
        });
      }
      if (!bookFields.isGenuine) {
        const delta = baseAmount * 0.3;
        breakdown.push({
          description: `非正版扣减 -30%`,
          amount: Number(delta.toFixed(2)),
          isAdd: false,
        });
      }
    }

    if (category === "phones") {
      if (phoneFields.screenCondition === "完好") {
        const delta = baseAmount * 0.1;
        breakdown.push({
          description: `屏幕完好加成 +10%`,
          amount: Number(delta.toFixed(2)),
          isAdd: true,
        });
      } else if (phoneFields.screenCondition === "碎屏") {
        const delta = baseAmount * 0.3;
        breakdown.push({
          description: `碎屏扣减 -30%`,
          amount: Number(delta.toFixed(2)),
          isAdd: false,
        });
      }
      if (phoneFields.batteryHealth === ">80%") {
        const delta = baseAmount * 0.08;
        breakdown.push({
          description: `电池健康 ${phoneFields.batteryHealth} 加成 +8%`,
          amount: Number(delta.toFixed(2)),
          isAdd: true,
        });
      } else if (phoneFields.batteryHealth === "<50%") {
        const delta = baseAmount * 0.2;
        breakdown.push({
          description: `电池健康 ${phoneFields.batteryHealth} 扣减 -20%`,
          amount: Number(delta.toFixed(2)),
          isAdd: false,
        });
      }
      if (phoneFields.warrantyStatus === "在保") {
        const delta = baseAmount * 0.05;
        breakdown.push({
          description: `在保加成 +5%`,
          amount: Number(delta.toFixed(2)),
          isAdd: true,
        });
      }
      if (phoneFields.hasWaterDamage) {
        const delta = baseAmount * 0.4;
        breakdown.push({
          description: `进水扣减 -40%`,
          amount: Number(delta.toFixed(2)),
          isAdd: false,
        });
      }
      if (phoneFields.hasRepaired) {
        const delta = baseAmount * 0.15;
        breakdown.push({
          description: `拆修扣减 -15%`,
          amount: Number(delta.toFixed(2)),
          isAdd: false,
        });
      }
    }

    breakdown.push({
      description: "顺丰上门免运费",
      amount: 0,
      isAdd: true,
    });
    breakdown.push({
      description: "预估税费",
      amount: 0,
      isAdd: true,
    });

    const total = breakdown.reduce((sum, item) => (item.isAdd ? sum + item.amount : sum - item.amount), 0);
    const min = Number((total * 0.85).toFixed(2));
    const max = Number((total * 1.1).toFixed(2));

    return {
      priceBreakdown: breakdown,
      minPrice: min,
      maxPrice: max,
      totalPrice: Number(total.toFixed(2)),
    };
  }, [category, condition, brand, clothingFields, bookFields, phoneFields]);

  const canProceedStep1 = useMemo(() => {
    if (!brand) return false;
    if (category === "clothing") {
      return !!clothingFields.material && !!clothingFields.season && clothingFields.weightKg > 0;
    }
    if (category === "books") {
      return bookFields.quantity > 0;
    }
    if (category === "phones") {
      return (
        !!phoneFields.warrantyStatus &&
        !!phoneFields.screenCondition &&
        !!phoneFields.batteryHealth &&
        phoneFields.quantity > 0
      );
    }
    return false;
  }, [category, brand, clothingFields, bookFields, phoneFields]);

  const canProceedStep2 = useMemo(() => {
    return !!selectedDate && !!selectedTimeWindow && !!selectedAddress && !!selectedCourier;
  }, [selectedDate, selectedTimeWindow, selectedAddress, selectedCourier]);

  const handleNext = () => {
    if (step === 1 && canProceedStep1) {
      setStep(2);
    } else if (step === 2 && canProceedStep2) {
      setStep(3);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3);
    }
  };

  const handleConfirm = () => {
    if (!currentUser || !selectedAddress || !selectedTimeWindow) return;

    const now = dayjs();
    const orderItems = [
      {
        id: `item-${now.valueOf()}`,
        name:
          category === "clothing"
            ? `${clothingFields.season}${clothingFields.material}${brand}${model || "衣物"}`
            : category === "books"
            ? `${bookFields.bookCategory || bookFields.publisher || brand}图书`
            : `${brand} ${model || "手机"}`,
        quantity:
          category === "clothing"
            ? Math.ceil(clothingFields.weightKg)
            : category === "books"
            ? bookFields.quantity
            : phoneFields.quantity,
        condition,
        estimatedPrice: totalPrice,
        brand,
        model,
      },
    ];

    const order: Order = {
      id: `order-${now.valueOf()}`,
      orderNo: `RC${now.format("YYYYMMDDHHmmss")}`,
      userId: currentUser.id,
      category,
      items: orderItems,
      estimatedPrice: totalPrice,
      status: "pending",
      pickupTime: `${selectedDate} ${selectedTimeWindow.startTime}:00`,
      address: selectedAddress,
      courierId: selectedCourier?.id,
      createdAt: now.format("YYYY-MM-DD HH:mm:ss"),
      timeline: [
        {
          status: "pending",
          time: now.format("YYYY-MM-DD HH:mm:ss"),
          description: "订单已创建，等待快递员接单",
        },
      ],
      weightKg: category === "clothing" ? clothingFields.weightKg : undefined,
    };

    addOrder(order);
    navigate(`/user/orders/${order.id}`);
  };

  const handleAddAddress = () => {
    if (
      !newAddress.province ||
      !newAddress.city ||
      !newAddress.district ||
      !newAddress.detail ||
      !newAddress.contactName ||
      !newAddress.contactPhone
    ) {
      return;
    }
    const addr: Address = {
      id: `addr-${Date.now()}`,
      province: newAddress.province,
      city: newAddress.city,
      district: newAddress.district,
      detail: newAddress.detail,
      contactName: newAddress.contactName,
      contactPhone: newAddress.contactPhone,
    };
    setSelectedAddress(addr);
    setShowAddressModal(false);
    setNewAddress({
      province: "",
      city: "",
      district: "",
      detail: "",
      contactName: "",
      contactPhone: "",
    });
  };

  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="pb-32 min-h-screen bg-neutral-50">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {categoryOptions.map(({ key, label, icon: Icon }) => {
            const idx = categoryOptions.findIndex((c) => c.key === key);
            const isActive = key === category;
            const isPast = categoryOptions.findIndex((c) => c.key === category) > idx;
            return (
              <button
                key={key}
                onClick={() => {
                  if (step === 1) setCategory(key);
                }}
                disabled={step !== 1}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm font-medium",
                  isActive && "bg-eco-100 text-eco-700",
                  !isActive && !isPast && "text-neutral-400",
                  isPast && "text-eco-500",
                  step !== 1 && "cursor-default opacity-70"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-2 mt-3 max-w-2xl mx-auto">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  step >= s
                    ? "bg-gradient-to-br from-eco-500 to-eco-600 text-white shadow-card"
                    : "bg-neutral-100 text-neutral-400"
                )}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    "w-12 sm:w-20 h-1 mx-1 rounded-full transition-all",
                    step > s ? "bg-gradient-to-r from-eco-400 to-eco-500" : "bg-neutral-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-8 mt-2 text-xs">
          <span className={cn("font-medium", step === 1 ? "text-eco-600" : "text-neutral-400")}>物品信息</span>
          <span className={cn("font-medium", step === 2 ? "text-eco-600" : "text-neutral-400")}>上门信息</span>
          <span className={cn("font-medium", step === 3 ? "text-eco-600" : "text-neutral-400")}>确认预约</span>
        </div>
      </div>

      <div className="px-4 pt-5 max-w-2xl mx-auto space-y-5">
        {step === 1 && (
          <div className="card p-5 animate-slide-up space-y-5">
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
                          if (category === "books") {
                            setBookFields((prev) => ({ ...prev, publisher: b }));
                          }
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

            {brand && (
              <div className="animate-slide-up">
                <label className="label-base">
                  {category === "phones" ? "型号" : category === "books" ? "图书分类" : "款式"}
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className={cn(
                      "input-base text-left flex items-center justify-between",
                      !model && "text-neutral-400"
                    )}
                  >
                    <span>{model || `请选择${category === "phones" ? "型号" : category === "books" ? "分类" : "款式"}`}</span>
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
                            if (category === "books") {
                              setBookFields((prev) => ({ ...prev, bookCategory: m }));
                            }
                            if (category === "clothing") {
                              setClothingFields((prev) => ({ ...prev, style: m }));
                            }
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

            {category === "clothing" && (
              <>
                <div>
                  <label className="label-base">材质</label>
                  <div className="grid grid-cols-4 gap-2">
                    {materials.map((m) => (
                      <button
                        key={m}
                        onClick={() => setClothingFields((prev) => ({ ...prev, material: m }))}
                        className={cn(
                          "py-2 px-2 rounded-xl text-sm font-medium border transition-all",
                          clothingFields.material === m
                            ? "bg-eco-500 text-white border-eco-500 shadow-card"
                            : "bg-white text-neutral-600 border-neutral-200 hover:border-eco-300 hover:text-eco-600"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label-base">季节</label>
                  <div className="grid grid-cols-3 gap-2">
                    {seasons.map((s) => (
                      <button
                        key={s}
                        onClick={() => setClothingFields((prev) => ({ ...prev, season: s }))}
                        className={cn(
                          "py-2.5 px-2 rounded-xl text-sm font-medium border transition-all",
                          clothingFields.season === s
                            ? "bg-eco-500 text-white border-eco-500 shadow-card"
                            : "bg-white text-neutral-600 border-neutral-200 hover:border-eco-300 hover:text-eco-600"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {category === "books" && (
              <>
                <div>
                  <label className="label-base">ISBN（选填）</label>
                  <input
                    type="text"
                    value={bookFields.isbn}
                    onChange={(e) => setBookFields((prev) => ({ ...prev, isbn: e.target.value }))}
                    placeholder="请输入图书ISBN编号"
                    className="input-base"
                  />
                </div>

                <div>
                  <label className="label-base">品相分级</label>
                  <div className="grid grid-cols-5 gap-2">
                    {bookConditions.map((c) => (
                      <button
                        key={c}
                        onClick={() => setBookFields((prev) => ({ ...prev, bookCondition: c }))}
                        className={cn(
                          "py-2 px-1 rounded-xl text-xs font-medium border transition-all",
                          bookFields.bookCondition === c
                            ? "bg-eco-500 text-white border-eco-500 shadow-card"
                            : "bg-white text-neutral-600 border-neutral-200 hover:border-eco-300 hover:text-eco-600"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-neutral-200 cursor-pointer hover:border-eco-300 transition-all">
                    <input
                      type="checkbox"
                      checked={bookFields.hasNotes}
                      onChange={(e) => setBookFields((prev) => ({ ...prev, hasNotes: e.target.checked }))}
                      className="w-4 h-4 rounded accent-eco-500"
                    />
                    <span className="text-sm font-medium text-neutral-700">有笔记/画线</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-neutral-200 cursor-pointer hover:border-eco-300 transition-all">
                    <input
                      type="checkbox"
                      checked={bookFields.isGenuine}
                      onChange={(e) => setBookFields((prev) => ({ ...prev, isGenuine: e.target.checked }))}
                      className="w-4 h-4 rounded accent-eco-500"
                    />
                    <span className="text-sm font-medium text-neutral-700">正版图书</span>
                  </label>
                </div>

                {!bookFields.bookCategory && (
                  <div>
                    <label className="label-base">图书分类</label>
                    <div className="grid grid-cols-4 gap-2">
                      {bookCategories.slice(0, 8).map((c) => (
                        <button
                          key={c}
                          onClick={() => setBookFields((prev) => ({ ...prev, bookCategory: c }))}
                          className={cn(
                            "py-2 px-1 rounded-xl text-xs font-medium border transition-all",
                            bookFields.bookCategory === c
                              ? "bg-eco-500 text-white border-eco-500 shadow-card"
                              : "bg-white text-neutral-600 border-neutral-200 hover:border-eco-300 hover:text-eco-600"
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {category === "phones" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-base">购买年份</label>
                    <select
                      value={phoneFields.purchaseYear}
                      onChange={(e) => setPhoneFields((prev) => ({ ...prev, purchaseYear: Number(e.target.value) }))}
                      className="input-base appearance-none pr-8 bg-no-repeat bg-right"
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>{y}年</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label-base">购买月份</label>
                    <select
                      value={phoneFields.purchaseMonth}
                      onChange={(e) => setPhoneFields((prev) => ({ ...prev, purchaseMonth: Number(e.target.value) }))}
                      className="input-base appearance-none pr-8 bg-no-repeat bg-right"
                    >
                      {months.map((m) => (
                        <option key={m} value={m}>{m}月</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label-base">保修状态</label>
                  <div className="grid grid-cols-2 gap-2">
                    {warrantyStatuses.map((s) => (
                      <button
                        key={s}
                        onClick={() => setPhoneFields((prev) => ({ ...prev, warrantyStatus: s }))}
                        className={cn(
                          "py-2.5 rounded-xl text-sm font-medium border transition-all",
                          phoneFields.warrantyStatus === s
                            ? "bg-eco-500 text-white border-eco-500 shadow-card"
                            : "bg-white text-neutral-600 border-neutral-200 hover:border-eco-300 hover:text-eco-600"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label-base">屏幕状况</label>
                  <div className="grid grid-cols-3 gap-2">
                    {screenConditions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setPhoneFields((prev) => ({ ...prev, screenCondition: s }))}
                        className={cn(
                          "py-2.5 rounded-xl text-sm font-medium border transition-all",
                          phoneFields.screenCondition === s
                            ? "bg-eco-500 text-white border-eco-500 shadow-card"
                            : "bg-white text-neutral-600 border-neutral-200 hover:border-eco-300 hover:text-eco-600"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label-base">电池健康</label>
                  <div className="grid grid-cols-3 gap-2">
                    {batteryHealths.map((b) => (
                      <button
                        key={b}
                        onClick={() => setPhoneFields((prev) => ({ ...prev, batteryHealth: b }))}
                        className={cn(
                          "py-2.5 rounded-xl text-sm font-medium border transition-all",
                          phoneFields.batteryHealth === b
                            ? "bg-eco-500 text-white border-eco-500 shadow-card"
                            : "bg-white text-neutral-600 border-neutral-200 hover:border-eco-300 hover:text-eco-600"
                        )}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-neutral-200 cursor-pointer hover:border-eco-300 transition-all">
                    <input
                      type="checkbox"
                      checked={phoneFields.hasWaterDamage}
                      onChange={(e) => setPhoneFields((prev) => ({ ...prev, hasWaterDamage: e.target.checked }))}
                      className="w-4 h-4 rounded accent-eco-500"
                    />
                    <span className="text-sm font-medium text-neutral-700">是否进水</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-neutral-200 cursor-pointer hover:border-eco-300 transition-all">
                    <input
                      type="checkbox"
                      checked={phoneFields.hasRepaired}
                      onChange={(e) => setPhoneFields((prev) => ({ ...prev, hasRepaired: e.target.checked }))}
                      className="w-4 h-4 rounded accent-eco-500"
                    />
                    <span className="text-sm font-medium text-neutral-700">是否拆修</span>
                  </label>
                </div>
              </>
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
                {category === "clothing"
                  ? "预估重量"
                  : category === "books"
                  ? "图书数量"
                  : "数量"}
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (category === "clothing") {
                      setClothingFields((prev) => ({
                        ...prev,
                        weightKg: Math.max(0.1, Number((prev.weightKg - 0.1).toFixed(1))),
                      }));
                    } else if (category === "books") {
                      setBookFields((prev) => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }));
                    } else {
                      setPhoneFields((prev) => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }));
                    }
                  }}
                  className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors text-xl font-medium"
                >
                  −
                </button>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    step={category === "clothing" ? 0.1 : 1}
                    min={category === "clothing" ? 0.1 : 1}
                    value={
                      category === "clothing"
                        ? clothingFields.weightKg
                        : category === "books"
                        ? bookFields.quantity
                        : phoneFields.quantity
                    }
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (category === "clothing") {
                        setClothingFields((prev) => ({ ...prev, weightKg: Math.max(0.1, val || 0.1) }));
                      } else if (category === "books") {
                        setBookFields((prev) => ({ ...prev, quantity: Math.max(1, val || 1) }));
                      } else {
                        setPhoneFields((prev) => ({ ...prev, quantity: Math.max(1, val || 1) }));
                      }
                    }}
                    className="input-base text-center text-lg font-semibold"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                    {category === "clothing" ? "kg" : category === "books" ? "本" : "件"}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (category === "clothing") {
                      setClothingFields((prev) => ({
                        ...prev,
                        weightKg: Number((prev.weightKg + 0.1).toFixed(1)),
                      }));
                    } else if (category === "books") {
                      setBookFields((prev) => ({ ...prev, quantity: prev.quantity + 1 }));
                    } else {
                      setPhoneFields((prev) => ({ ...prev, quantity: prev.quantity + 1 }));
                    }
                  }}
                  className="w-11 h-11 rounded-xl bg-eco-100 flex items-center justify-center text-eco-600 hover:bg-eco-200 transition-colors text-xl font-medium"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-slide-up">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-eco-100 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-eco-600" />
                </div>
                <h3 className="font-bold text-neutral-800">选择日期</h3>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2 -mx-1 px-1">
                {availableDates.map((d) => (
                  <button
                    key={d.date}
                    onClick={() => {
                      setSelectedDate(d.date);
                      setSelectedTimeWindow(null);
                    }}
                    className={cn(
                      "flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl border transition-all min-w-[72px]",
                      selectedDate === d.date
                        ? "bg-gradient-to-br from-eco-500 to-eco-600 text-white border-eco-500 shadow-card"
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-eco-300"
                    )}
                  >
                    <span className={cn("text-xs font-medium", selectedDate === d.date ? "text-eco-100" : "text-neutral-400")}>
                      {d.weekday}
                    </span>
                    <span className="text-lg font-bold mt-1">{d.label.split("/")[1]}</span>
                    <span className={cn("text-xs mt-0.5", selectedDate === d.date ? "text-eco-100" : "text-neutral-400")}>
                      {d.label.split("/")[0]}月
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-eco-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-eco-600" />
                </div>
                <h3 className="font-bold text-neutral-800">选择时间段</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {availableTimeWindows.map((tw) => (
                  <button
                    key={tw.id}
                    disabled={!tw.available}
                    onClick={() => setSelectedTimeWindow(tw)}
                    className={cn(
                      "py-3 px-4 rounded-xl text-sm font-medium border transition-all",
                      !tw.available && "opacity-50 cursor-not-allowed bg-neutral-50 border-neutral-100",
                      tw.available &&
                        selectedTimeWindow?.id !== tw.id &&
                        "bg-white text-neutral-600 border-neutral-200 hover:border-eco-300 hover:text-eco-600",
                      selectedTimeWindow?.id === tw.id &&
                        "bg-gradient-to-br from-eco-500 to-eco-600 text-white border-eco-500 shadow-card"
                    )}
                  >
                    <div className="font-semibold">
                      {tw.startTime} - {tw.endTime}
                    </div>
                    <div
                      className={cn(
                        "text-xs mt-0.5",
                        selectedTimeWindow?.id === tw.id ? "text-eco-100" : tw.available ? "text-eco-500" : "text-neutral-400"
                      )}
                    >
                      {tw.available ? "可预约" : "已满"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-eco-100 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-eco-600" />
                  </div>
                  <h3 className="font-bold text-neutral-800">选择地址</h3>
                </div>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="flex items-center gap-1 text-sm font-medium text-eco-600 hover:text-eco-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  新增
                </button>
              </div>
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all",
                      selectedAddress?.id === addr.id
                        ? "border-eco-500 bg-eco-50 shadow-card"
                        : "border-neutral-200 bg-white hover:border-eco-300"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all",
                          selectedAddress?.id === addr.id ? "border-eco-500 bg-eco-500" : "border-neutral-300"
                        )}
                      >
                        {selectedAddress?.id === addr.id && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-800">{addr.contactName}</span>
                          <span className="text-sm text-neutral-500">{addr.contactPhone}</span>
                          {addr.isDefault && (
                            <span className="badge-success text-[10px] px-1.5 py-px">默认</span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                          {addr.province}{addr.city}{addr.district}{addr.detail}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
                {selectedAddress && !addresses.find((a) => a.id === selectedAddress.id) && (
                  <button
                    onClick={() => setSelectedAddress(selectedAddress)}
                    className="w-full text-left p-4 rounded-xl border border-eco-500 bg-eco-50 shadow-card"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full border-2 border-eco-500 bg-eco-500 flex-shrink-0 mt-0.5 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-800">{selectedAddress.contactName}</span>
                          <span className="text-sm text-neutral-500">{selectedAddress.contactPhone}</span>
                          <span className="badge-success text-[10px] px-1.5 py-px">新地址</span>
                        </div>
                        <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                          {selectedAddress.province}{selectedAddress.city}{selectedAddress.district}{selectedAddress.detail}
                        </p>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {selectedDate && selectedTimeWindow && selectedAddress && (
              <div className="card p-5 animate-slide-up">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-eco-100 flex items-center justify-center">
                    <Truck className="w-4 h-4 text-eco-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-800">为您匹配的快递员</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">基于LBS智能派单，就近推荐</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {matchedCouriers.slice(0, 4).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCourier(c)}
                      className={cn(
                        "w-full text-left p-3.5 rounded-xl border transition-all",
                        selectedCourier?.id === c.id
                          ? "border-eco-500 bg-eco-50 shadow-card"
                          : "border-neutral-200 bg-white hover:border-eco-300"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-eco-400 to-eco-600 flex items-center justify-center text-white font-bold text-lg shadow-card">
                            {c.name.charAt(0)}
                          </div>
                          <div
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white",
                              c.status === "online" ? "bg-eco-500" : c.status === "busy" ? "bg-amber-500" : "bg-neutral-400"
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-neutral-800">{c.name}</span>
                            {c.isRecommended && (
                              <span className="badge bg-amber-100 text-amber-700 text-[10px] px-1.5 py-px">
                                ⭐ 推荐
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />
                              {c.distanceKm.toFixed(1)}km
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              {c.rating.toFixed(1)}
                            </span>
                            <span>今日{c.todayOrders}单</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-eco-600">
                            预计{c.etaMinutes}分钟
                          </div>
                          <div className="text-xs text-neutral-400 mt-0.5">到达</div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {matchedCouriers.length === 0 && (
                    <div className="text-center py-8 text-neutral-400">
                      <Truck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">暂无可用快递员</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-slide-up">
            <div className="card overflow-hidden bg-gradient-to-br from-eco-500 via-eco-500 to-eco-700 text-white">
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold">预估回收价格</h3>
                </div>
                <div className="text-center py-3">
                  <p className="text-sm text-eco-100">预估回收价格区间</p>
                  <div className="mt-2 flex items-end justify-center gap-1">
                    <span className="text-4xl font-bold tracking-tight">¥{minPrice.toFixed(category === "phones" ? 0 : 2)}</span>
                    <span className="text-lg mb-1.5 mx-1 text-eco-200">~</span>
                    <span className="text-4xl font-bold tracking-tight">¥{maxPrice.toFixed(category === "phones" ? 0 : 2)}</span>
                  </div>
                  <p className="text-xs text-eco-100 mt-2 flex items-center justify-center gap-1">
                    <Info className="w-3 h-3" />
                    最终价格以质检结果为准
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-eco-100 flex items-center justify-center">
                  <Package className="w-4 h-4 text-eco-600" />
                </div>
                <h3 className="font-bold text-neutral-800">价格明细</h3>
              </div>
              <div className="space-y-2.5">
                {priceBreakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex justify-between items-center py-2",
                      idx < priceBreakdown.length - 1 && "border-b border-neutral-100"
                    )}
                  >
                    <span className="text-sm text-neutral-600">{item.description}</span>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        item.amount === 0
                          ? "text-neutral-400"
                          : item.isAdd
                          ? "text-neutral-800"
                          : "text-red-500"
                      )}
                    >
                      {item.amount === 0
                        ? "¥0.00"
                        : `${item.isAdd ? "+" : "-"}¥${item.amount.toFixed(category === "phones" ? 0 : 2)}`}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-4 mt-3 border-t border-eco-100 bg-eco-50/50 -mx-5 -mb-5 px-5 py-4 rounded-b-2xl">
                <span className="font-semibold text-neutral-800">预估合计</span>
                <span className="text-2xl font-bold text-eco-600">
                  ¥{totalPrice.toFixed(category === "phones" ? 0 : 2)}
                </span>
              </div>
            </div>

            <div className="card p-5 space-y-4">
              <h3 className="font-bold text-neutral-800">预约信息确认</h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-neutral-500" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">物品信息</p>
                    <p className="text-sm font-medium text-neutral-800 mt-0.5">
                      {category === "clothing" &&
                        `${clothingFields.season} ${clothingFields.material} ${brand}${model ? " " + model : ""} ${clothingFields.weightKg}kg`}
                      {category === "books" &&
                        `${bookFields.bookCategory || bookFields.publisher || brand}${bookFields.bookCondition ? " · " + bookFields.bookCondition : ""} ${bookFields.quantity}本`}
                      {category === "phones" &&
                        `${brand} ${model || ""}${phoneFields.screenCondition ? " · " + phoneFields.screenCondition : ""} ${phoneFields.quantity}件`}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      成色: {getConditionLabel(condition)} ({condition}/10)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-neutral-500" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">上门时间</p>
                    <p className="text-sm font-medium text-neutral-800 mt-0.5">
                      {selectedDate} {selectedTimeWindow?.startTime}-{selectedTimeWindow?.endTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-neutral-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-500">取件地址</p>
                    <p className="text-sm font-medium text-neutral-800 mt-0.5">
                      {selectedAddress?.contactName} {selectedAddress?.contactPhone}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {selectedAddress?.province}{selectedAddress?.city}{selectedAddress?.district}{selectedAddress?.detail}
                    </p>
                  </div>
                </div>

                {selectedCourier && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-4 h-4 text-neutral-500" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">取件快递员</p>
                      <p className="text-sm font-medium text-neutral-800 mt-0.5">
                        {selectedCourier.name} · 评分{selectedCourier.rating.toFixed(1)}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        距离{selectedCourier.distanceKm.toFixed(1)}km · 预计{selectedCourier.etaMinutes}分钟到达
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-white/95 backdrop-blur-md border-t border-neutral-100 z-20">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 1 && (
            <button
              onClick={handlePrev}
              className="btn-secondary flex-1 text-base"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              上一步
            </button>
          )}
          {step < 3 && (
            <button
              onClick={handleNext}
              disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
              className={cn(
                "btn-primary flex-1 text-base gap-2",
                ((step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)) &&
                  "opacity-50 cursor-not-allowed hover:translate-y-0"
              )}
            >
              下一步
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
          {step === 3 && (
            <button
              onClick={handleConfirm}
              className="btn-primary flex-1 text-base gap-2"
            >
              确认预约
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setShowAddressModal(false)}
          />
          <div className="relative bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-neutral-800">新增地址</h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">
                    <User className="w-3.5 h-3.5 inline mr-1" />
                    联系人
                  </label>
                  <input
                    type="text"
                    value={newAddress.contactName || ""}
                    onChange={(e) =>
                      setNewAddress((prev) => ({ ...prev, contactName: e.target.value }))
                    }
                    placeholder="请输入姓名"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="label-base">
                    <Phone className="w-3.5 h-3.5 inline mr-1" />
                    手机号
                  </label>
                  <input
                    type="tel"
                    value={newAddress.contactPhone || ""}
                    onChange={(e) =>
                      setNewAddress((prev) => ({ ...prev, contactPhone: e.target.value }))
                    }
                    placeholder="请输入手机号"
                    className="input-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="label-base">省份</label>
                  <input
                    type="text"
                    value={newAddress.province || ""}
                    onChange={(e) =>
                      setNewAddress((prev) => ({ ...prev, province: e.target.value }))
                    }
                    placeholder="广东省"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="label-base">城市</label>
                  <input
                    type="text"
                    value={newAddress.city || ""}
                    onChange={(e) =>
                      setNewAddress((prev) => ({ ...prev, city: e.target.value }))
                    }
                    placeholder="深圳市"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="label-base">区县</label>
                  <input
                    type="text"
                    value={newAddress.district || ""}
                    onChange={(e) =>
                      setNewAddress((prev) => ({ ...prev, district: e.target.value }))
                    }
                    placeholder="南山区"
                    className="input-base"
                  />
                </div>
              </div>

              <div>
                <label className="label-base">
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  详细地址
                </label>
                <textarea
                  value={newAddress.detail || ""}
                  onChange={(e) =>
                    setNewAddress((prev) => ({ ...prev, detail: e.target.value }))
                  }
                  placeholder="街道、门牌号等详细信息"
                  rows={3}
                  className="input-base resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleAddAddress}
                  className="btn-primary flex-1 gap-1"
                >
                  <Check className="w-4 h-4" />
                  保存地址
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
