import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Droplets,
  Zap,
  Flame,
  ThermometerSun,
  Wifi,
  Search,
  MapPin,
  Calendar,
  User,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Plus,
  Star,
  Edit3,
  Trash2,
  FileText,
  Receipt,
  ArrowRight,
  ChevronRight,
  Building2,
  History,
  Sparkles,
  X,
  Check,
  RefreshCw,
  UserPlus,
  Download,
  Eye,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { paymentApi } from "@/api";
import type {
  PaymentCategory,
  PaymentAccount,
  PaymentRecord,
  PaymentStatus,
  PaymentAccountWithMatch,
} from "../../shared/types";
import { cn } from "@/lib/utils";
import { formatMoney, formatDate, formatDateTime } from "@/utils/format";

interface ToastState {
  show: boolean;
  type: "success" | "error";
  message: string;
}

interface ExtendedPaymentAccount extends PaymentAccount {
  sourceSystem: string;
  fullAddress: string;
  isDefault?: boolean;
  lastPaidAt?: string;
}

interface SearchHistoryItem {
  keyword: string;
  timestamp: number;
}

interface AccountHistoryItem {
  accountNumber: string;
  accountName: string;
  category: PaymentCategory;
  timestamp: number;
}

interface PaymentSuccessData {
  showReceipt: boolean;
  receiptData: {
    orderNo: string;
    amount: number;
    paidAt: string;
    accountName: string;
    accountNumber: string;
    category: string;
    serialNo: string;
  } | null;
}

interface SavedAccount {
  id: string;
  category: PaymentCategory;
  categoryName: string;
  accountNumber: string;
  accountName: string;
  district: string;
  sourceSystem: string;
  fullAddress: string;
  isDefault: boolean;
  lastPaidAt?: string;
  lastAmount?: number;
}

type PaymentStep = "search" | "confirm" | "paying" | "success";
type PageTab = "pay" | "my-accounts";

const categoryConfig: Record<
  PaymentCategory,
  {
    label: string;
    icon: typeof Droplets;
    gradient: string;
    activeGradient: string;
    bgLight: string;
    textColor: string;
  }
> = {
  water: {
    label: "水费",
    icon: Droplets,
    gradient: "from-sky-400 to-blue-500",
    activeGradient: "from-sky-500 to-blue-600",
    bgLight: "bg-sky-50",
    textColor: "text-sky-600",
  },
  electric: {
    label: "电费",
    icon: Zap,
    gradient: "from-yellow-400 to-amber-500",
    activeGradient: "from-yellow-500 to-amber-600",
    bgLight: "bg-amber-50",
    textColor: "text-amber-600",
  },
  gas: {
    label: "燃气费",
    icon: Flame,
    gradient: "from-orange-400 to-orange-500",
    activeGradient: "from-orange-500 to-orange-600",
    bgLight: "bg-orange-50",
    textColor: "text-orange-600",
  },
  heating: {
    label: "供暖费",
    icon: ThermometerSun,
    gradient: "from-rose-400 to-red-500",
    activeGradient: "from-rose-500 to-red-600",
    bgLight: "bg-rose-50",
    textColor: "text-rose-600",
  },
  broadband: {
    label: "宽带费",
    icon: Wifi,
    gradient: "from-violet-400 to-purple-500",
    activeGradient: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50",
    textColor: "text-violet-600",
  },
};

const statusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  unpaid: {
    label: "待缴费",
    className: "bg-amber-100 text-amber-700",
  },
  paid: {
    label: "已缴费",
    className: "bg-green-100 text-green-700",
  },
  overdue: {
    label: "已逾期",
    className: "bg-red-100 text-red-700",
  },
};

const districtSourceMap: Record<string, Record<PaymentCategory, string>> = {
  市南区: {
    water: "青岛市水务集团市南区营业厅",
    electric: "青岛供电公司市南供电中心",
    gas: "青岛能源集团市南区燃气公司",
    heating: "青岛热电集团市南区供热公司",
    broadband: "中国联通青岛市南区分公司",
  },
  市北区: {
    water: "青岛市水务集团市北区营业厅",
    electric: "青岛供电公司市北供电中心",
    gas: "青岛能源集团市北区燃气公司",
    heating: "青岛热电集团市北区供热公司",
    broadband: "中国联通青岛市北区分公司",
  },
  李沧区: {
    water: "青岛市水务集团李沧区营业厅",
    electric: "青岛供电公司李沧供电中心",
    gas: "青岛能源集团李沧区燃气公司",
    heating: "青岛热电集团李沧区供热公司",
    broadband: "中国联通青岛李沧区分公司",
  },
  崂山区: {
    water: "青岛市水务集团崂山区营业厅",
    electric: "青岛供电公司崂山供电中心",
    gas: "青岛能源集团崂山区燃气公司",
    heating: "青岛热电集团崂山区供热公司",
    broadband: "中国联通青岛崂山区分公司",
  },
  黄岛区: {
    water: "青岛市水务集团黄岛区营业厅",
    electric: "青岛供电公司黄岛供电中心",
    gas: "青岛能源集团黄岛区燃气公司",
    heating: "青岛热电集团黄岛区供热公司",
    broadband: "中国联通青岛黄岛区分公司",
  },
  城阳区: {
    water: "青岛市水务集团城阳区营业厅",
    electric: "青岛供电公司城阳供电中心",
    gas: "青岛能源集团城阳区燃气公司",
    heating: "青岛热电集团城阳区供热公司",
    broadband: "中国联通青岛城阳区分公司",
  },
};

const districtColors: Record<string, string> = {
  市南区: "bg-sky-100 text-sky-700",
  市北区: "bg-indigo-100 text-indigo-700",
  李沧区: "bg-emerald-100 text-emerald-700",
  崂山区: "bg-teal-100 text-teal-700",
  黄岛区: "bg-amber-100 text-amber-700",
  城阳区: "bg-rose-100 text-rose-700",
};

function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber || accountNumber.length <= 6) return accountNumber;
  const start = accountNumber.slice(0, 3);
  const end = accountNumber.slice(-3);
  const middle = "*".repeat(Math.min(accountNumber.length - 6, 8));
  return `${start}${middle}${end}`;
}

function extendAccount(account: PaymentAccount): ExtendedPaymentAccount {
  const district = account.district || "市南区";
  const sourceMap = districtSourceMap[district] || districtSourceMap["市南区"];
  const sourceSystem = sourceMap[account.category] || "青岛市缴费系统";
  return {
    ...account,
    sourceSystem,
    fullAddress: `${district}${account.district || ""}街道XX路XX号`,
    isDefault: false,
  };
}

function highlightMatch(text: string, keyword: string): React.ReactNode {
  if (!keyword.trim()) return text;
  
  const lowerText = text.toLowerCase();
  const lowerKw = keyword.toLowerCase();
  const index = lowerText.indexOf(lowerKw);
  
  if (index === -1) return text;
  
  const before = text.slice(0, index);
  const match = text.slice(index, index + keyword.length);
  const after = text.slice(index + keyword.length);
  
  return (
    <>
      {before}
      <span className="font-bold text-brand-600 bg-brand-50 px-0.5 rounded">{match}</span>
      {after}
    </>
  );
}

function getMatchDegree(score: number): number {
  return Math.min(98, Math.max(75, score));
}

const initialSavedAccounts: SavedAccount[] = [
  {
    id: "saved-001",
    category: "water",
    categoryName: "水费",
    accountNumber: "QD202010012345",
    accountName: "张三",
    district: "市南区",
    sourceSystem: "青岛市水务集团市南区营业厅",
    fullAddress: "市南区香港中路12号3号楼2单元501室",
    isDefault: true,
    lastPaidAt: "2026-05-20T10:30:00+08:00",
    lastAmount: 56.8,
  },
  {
    id: "saved-002",
    category: "electric",
    categoryName: "电费",
    accountNumber: "3702020010012345",
    accountName: "张三",
    district: "市南区",
    sourceSystem: "青岛供电公司市南供电中心",
    fullAddress: "市南区香港中路12号3号楼2单元501室",
    isDefault: false,
    lastPaidAt: "2026-05-15T14:20:00+08:00",
    lastAmount: 192.5,
  },
  {
    id: "saved-003",
    category: "gas",
    categoryName: "燃气费",
    accountNumber: "QD-GAS-88123456",
    accountName: "张三",
    district: "市南区",
    sourceSystem: "青岛能源集团市南区燃气公司",
    fullAddress: "市南区香港中路12号3号楼2单元501室",
    isDefault: false,
    lastPaidAt: "2026-05-10T09:15:00+08:00",
    lastAmount: 88.0,
  },
  {
    id: "saved-004",
    category: "broadband",
    categoryName: "宽带费",
    accountNumber: "100100123456789",
    accountName: "李四",
    district: "市北区",
    sourceSystem: "中国联通青岛市北区分公司",
    fullAddress: "市北区辽宁路56号科技广场B座1203室",
    isDefault: false,
    lastPaidAt: "2026-04-28T16:45:00+08:00",
    lastAmount: 120.0,
  },
];

const hotAccounts: ExtendedPaymentAccount[] = [
  {
    id: "hot-001",
    category: "water",
    categoryName: "水费",
    district: "市南区",
    accountNumber: "QD202010099999",
    accountName: "王阿姨",
    amountDue: 45.0,
    dueDate: "2026-06-22",
    status: "unpaid",
    sourceSystem: "青岛市水务集团市南区营业厅",
    fullAddress: "市南区五四广场附近小区",
  },
  {
    id: "hot-002",
    category: "electric",
    categoryName: "电费",
    district: "市南区",
    accountNumber: "3702020010088888",
    accountName: "刘先生",
    amountDue: 156.8,
    dueDate: "2026-06-25",
    status: "unpaid",
    sourceSystem: "青岛供电公司市南供电中心",
    fullAddress: "市南区香港中路沿线",
  },
];

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(onClose, 2500);
      return () => clearTimeout(timer);
    }
  }, [toast.show, onClose]);

  if (!toast.show) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div
        className={cn(
          "flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-white",
          toast.type === "success" ? "bg-green-500" : "bg-red-500"
        )}
      >
        {toast.type === "success" ? (
          <CheckCircle2 size={18} />
        ) : (
          <XCircle size={18} />
        )}
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  );
}

function CategorySearchCard({
  category,
  config,
  isActive,
  searchValue,
  onSearchChange,
  onSearchFocus,
  recentAccounts,
  onSelectRecent,
  onAddAccount,
  onCardClick,
  showDropdown,
  searchResults,
  onSelectResult,
  searchLoading,
  accountHistory,
  onSelectHistory,
  showAccountHistory,
}: {
  category: PaymentCategory;
  config: (typeof categoryConfig)[PaymentCategory];
  isActive: boolean;
  searchValue: string;
  onSearchChange: (val: string) => void;
  onSearchFocus: () => void;
  recentAccounts: SavedAccount[];
  onSelectRecent: (acc: SavedAccount) => void;
  onAddAccount: () => void;
  onCardClick: () => void;
  showDropdown: boolean;
  searchResults: ExtendedPaymentAccount[];
  onSelectResult: (acc: ExtendedPaymentAccount) => void;
  searchLoading: boolean;
  accountHistory: AccountHistoryItem[];
  onSelectHistory: (item: AccountHistoryItem) => void;
  showAccountHistory: boolean;
}) {
  const Icon = config.icon;
  const district = recentAccounts[0]?.district || "市南区";
  const sourceSystem =
    districtSourceMap[district]?.[category] || "青岛市缴费系统";
  const systemOnline = true;

  return (
    <div
      className={cn(
        "card overflow-hidden transition-all duration-300",
        isActive ? "ring-2 ring-brand-400 shadow-lg" : ""
      )}
    >
      <div
        className={cn(
          "p-4 cursor-pointer",
          isActive ? "" : ""
        )}
        onClick={onCardClick}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-md",
              config.gradient
            )}
          >
            <Icon size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-slate-800">{config.label}</span>
              <span
                className={cn(
                  "chip text-[10px] flex-shrink-0",
                  districtColors[district] || "bg-slate-100 text-slate-600"
                )}
              >
                {district}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <Building2 size={12} className="text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-500 truncate">
                  {sourceSystem}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={`w-2 h-2 rounded-full ${systemOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                <span className="text-[10px] text-slate-500">
                  缴费系统状态：{systemOnline ? "在线" : "离线"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors",
              showDropdown && searchResults.length > 0
                ? "border-brand-300 bg-brand-50/50"
                : "border-slate-200 bg-slate-50 hover:border-slate-300"
            )}
          >
            <Search size={16} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder={`输入${config.label}户号/户名`}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={onSearchFocus}
              className="flex-1 outline-none text-sm bg-transparent placeholder:text-slate-400 min-w-0"
            />
            {searchLoading && (
              <Loader2
                size={16}
                className="text-brand-500 animate-spin flex-shrink-0"
              />
            )}
          </div>

          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden animate-slide-down">
              {searchResults.slice(0, 4).map((account) => {
                const accWithMatch = account as unknown as PaymentAccountWithMatch;
                const matchDegree = getMatchDegree(accWithMatch.matchDegree || 85);
                return (
                  <button
                    key={account.id}
                    onClick={() => onSelectResult(account)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0 text-left"
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        config.bgLight
                      )}
                    >
                      <Icon size={16} className={config.textColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
                        <span className="truncate font-mono">
                          {highlightMatch(maskAccountNumber(account.accountNumber), searchValue)}
                        </span>
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          匹配度：{matchDegree}%
                        </span>
                        {account.status === "unpaid" && account.amountDue > 0 && (
                          <span className="text-xs text-red-500 flex-shrink-0">
                            待缴
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1.5">
                        <span>{highlightMatch(account.accountName, searchValue)}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <span
                            className={cn(
                              "text-[10px] px-1 py-0.5 rounded",
                              districtColors[account.district] || "bg-slate-100 text-slate-600"
                            )}
                          >
                            {account.district}
                          </span>
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-slate-300 flex-shrink-0"
                    />
                  </button>
                );
              })}
            </div>
          )}

          {showAccountHistory && accountHistory.length > 0 && !showDropdown && (
            <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden animate-slide-down">
              <div className="px-3 py-2 border-b border-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <History size={12} />
                  历史户号
                </span>
                <span className="text-[10px] text-slate-400">最近3条</span>
              </div>
              {accountHistory.slice(0, 3).map((item, idx) => (
                <button
                  key={`${item.accountNumber}-${idx}`}
                  onClick={() => onSelectHistory(item)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0 text-left"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      categoryConfig[item.category].bgLight
                    )}
                  >
                    <Icon size={16} className={config.textColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate font-mono">
                      {maskAccountNumber(item.accountNumber)}
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      {item.accountName}
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-slate-300 flex-shrink-0"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {recentAccounts.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
              <History size={12} />
              最近使用
            </div>
            <div className="flex gap-2 flex-wrap">
              {recentAccounts.slice(0, 2).map((acc) => (
                <button
                  key={acc.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRecent(acc);
                  }}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors",
                    config.bgLight,
                    config.textColor,
                    "hover:opacity-80"
                  )}
                >
                  <User size={12} />
                  <span className="truncate max-w-[100px]">
                    {acc.accountName}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddAccount();
          }}
          className="w-full mt-3 py-2 rounded-lg border border-dashed border-slate-200 text-slate-400 text-xs flex items-center justify-center gap-1 hover:border-brand-300 hover:text-brand-500 transition-colors"
        >
          <Plus size={14} />
          添加户号
        </button>
      </div>
    </div>
  );
}

function SourceBadge({
  district,
  sourceSystem,
}: {
  district: string;
  sourceSystem: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "chip text-xs",
          districtColors[district] || "bg-slate-100 text-slate-600"
        )}
      >
        {district}
      </span>
      <span className="text-xs text-slate-400">数据来源：{sourceSystem} 实时同步</span>
    </div>
  );
}

export default function PaymentPage() {
  const [activeTab, setActiveTab] = useState<PageTab>("pay");
  const [selectedCategory, setSelectedCategory] = useState<PaymentCategory | null>(null);
  const [categorySearchValues, setCategorySearchValues] = useState<Record<PaymentCategory, string>>({
    water: "",
    electric: "",
    gas: "",
    heating: "",
    broadband: "",
  });
  const [activeSearchCategory, setActiveSearchCategory] = useState<PaymentCategory | null>(null);
  const [searchResults, setSearchResults] = useState<ExtendedPaymentAccount[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ExtendedPaymentAccount | null>(null);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(initialSavedAccounts);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [paymentStep, setPaymentStep] = useState<PaymentStep>("search");
  const [payLoading, setPayLoading] = useState(false);
  const [isOtherPay, setIsOtherPay] = useState(false);
  const [payerName, setPayerName] = useState("");
  const [successRecord, setSuccessRecord] = useState<PaymentRecord | null>(null);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    type: "success",
    message: "",
  });
  const [accountHistory, setAccountHistory] = useState<AccountHistoryItem[]>([
    { accountNumber: "QD202010012345", accountName: "张三", category: "water", timestamp: Date.now() - 86400000 },
    { accountNumber: "3702020010012345", accountName: "张三", category: "electric", timestamp: Date.now() - 172800000 },
    { accountNumber: "QD-GAS-88123456", accountName: "张三", category: "gas", timestamp: Date.now() - 259200000 },
  ]);
  const [activeHistoryCategory, setActiveHistoryCategory] = useState<PaymentCategory | null>(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState<PaymentSuccessData>({
    showReceipt: false,
    receiptData: null,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const categories = Object.entries(categoryConfig) as [
    PaymentCategory,
    (typeof categoryConfig)[PaymentCategory]
  ][];

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ show: true, type, message });
  };

  const closeToast = () => setToast((t) => ({ ...t, show: false }));

  const getRecentAccountsByCategory = (category: PaymentCategory): SavedAccount[] => {
    return savedAccounts.filter((acc) => acc.category === category).slice(0, 2);
  };

  const handleCategorySearchChange = (category: PaymentCategory, value: string) => {
    setCategorySearchValues((prev) => ({ ...prev, [category]: value }));
    setActiveSearchCategory(category);
    setSelectedAccount(null);
    setPaymentStep("search");
  };

  const handleSearchFocus = (category: PaymentCategory) => {
    setActiveSearchCategory(category);
    setActiveHistoryCategory(category);
    const keyword = categorySearchValues[category];
    if (keyword.trim()) {
      performSearch(keyword, category);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setActiveHistoryCategory(null);
    }, 200);
  };

  const handleSelectHistory = (item: AccountHistoryItem) => {
    setCategorySearchValues((prev) => ({
      ...prev,
      [item.category]: item.accountNumber,
    }));
    setActiveHistoryCategory(null);
    performSearch(item.accountNumber, item.category);
  };

  const addToAccountHistory = (account: { accountNumber: string; accountName: string; category: PaymentCategory }) => {
    setAccountHistory((prev) => {
      const filtered = prev.filter(
        (h) => !(h.accountNumber === account.accountNumber && h.category === account.category)
      );
      const newItem: AccountHistoryItem = {
        ...account,
        timestamp: Date.now(),
      };
      return [newItem, ...filtered].slice(0, 10);
    });
  };

  const performSearch = useCallback(async (keyword: string, category?: PaymentCategory) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const data = await paymentApi.searchAccounts(keyword);
      let filtered = data;
      if (category) {
        filtered = filtered.filter((a) => a.category === category);
      }
      const extended = filtered.map((acc) => extendAccount(acc));

      const scored = extended.map((acc) => {
        let score = 0;
        const kw = keyword.toLowerCase();
        if (acc.accountNumber.toLowerCase().includes(kw)) score += 10;
        if (acc.accountName.toLowerCase().includes(kw)) score += 7;
        if (acc.district.toLowerCase().includes(kw)) score += 3;
        if (acc.accountNumber.toLowerCase().startsWith(kw)) score += 5;
        if (acc.accountName.toLowerCase().startsWith(kw)) score += 3;
        return { ...acc, score };
      });
      scored.sort((a, b) => b.score - a.score);

      setSearchResults(scored);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const activeCategory = activeSearchCategory;
    const keyword = activeCategory ? categorySearchValues[activeCategory] : "";

    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(keyword, activeCategory || undefined);
      addToSearchHistory(keyword);
    }, 300);

    return () => clearTimeout(timer);
  }, [categorySearchValues, activeSearchCategory, performSearch]);

  const addToSearchHistory = (keyword: string) => {
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.keyword !== keyword);
      const newItem: SearchHistoryItem = {
        keyword,
        timestamp: Date.now(),
      };
      return [newItem, ...filtered].slice(0, 5);
    });
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  const handleSelectResult = (account: ExtendedPaymentAccount) => {
    setSelectedAccount(account);
    setCategorySearchValues((prev) => ({
      ...prev,
      [account.category]: account.accountNumber,
    }));
    setSearchResults([]);
    setActiveSearchCategory(null);
    setActiveHistoryCategory(null);
    addToAccountHistory({
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      category: account.category,
    });
    setPaymentStep("confirm");
    fetchRecords(account.id);
  };

  const handleSelectRecent = (saved: SavedAccount) => {
    const extended: ExtendedPaymentAccount = {
      id: saved.id,
      category: saved.category,
      categoryName: saved.categoryName,
      district: saved.district,
      accountNumber: saved.accountNumber,
      accountName: saved.accountName,
      amountDue: saved.lastAmount || 0,
      dueDate: "2026-06-30",
      status: saved.lastAmount ? "unpaid" : "paid",
      sourceSystem: saved.sourceSystem,
      fullAddress: saved.fullAddress,
      isDefault: saved.isDefault,
      lastPaidAt: saved.lastPaidAt,
    };
    setSelectedAccount(extended);
    setCategorySearchValues((prev) => ({
      ...prev,
      [saved.category]: saved.accountNumber,
    }));
    setSearchResults([]);
    setActiveSearchCategory(null);
    setActiveHistoryCategory(null);
    addToAccountHistory({
      accountNumber: saved.accountNumber,
      accountName: saved.accountName,
      category: saved.category,
    });
    setPaymentStep("confirm");
    fetchRecords(saved.id);
  };

  const fetchRecords = useCallback(async (accountId: string) => {
    try {
      const records = await paymentApi.getRecords(accountId);
      setPaymentRecords(records);
    } catch (error) {
      console.error("Fetch records failed:", error);
    }
  }, []);

  const handleAddAccount = () => {
    showToast("success", "添加户号功能即将开放");
  };

  const handleCardClick = (category: PaymentCategory) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const handleConfirmPay = () => {
    if (!selectedAccount || selectedAccount.amountDue <= 0) return;
    setPaymentStep("paying");
    handlePay();
  };

  const handlePay = async () => {
    if (!selectedAccount) return;
    setPayLoading(true);
    try {
      const record = await paymentApi.pay(selectedAccount.id, selectedAccount.amountDue);
      setSuccessRecord(record);
      setSelectedAccount({
        ...selectedAccount,
        status: "paid",
      });
      const serialNo = `PAY-SD-${Date.now()}${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
      setPaymentSuccessData({
        showReceipt: true,
        receiptData: {
          orderNo: record.orderNo,
          amount: selectedAccount.amountDue,
          paidAt: record.paidAt || new Date().toISOString(),
          accountName: selectedAccount.accountName,
          accountNumber: selectedAccount.accountNumber,
          category: selectedAccount.categoryName,
          serialNo,
        },
      });
      setPaymentStep("success");
      fetchRecords(selectedAccount.id);
    } catch (error) {
      setPaymentStep("confirm");
      showToast("error", "缴费失败，请稍后重试");
    } finally {
      setPayLoading(false);
    }
  };

  const handleViewPaymentCert = () => {
    showToast("success", "缴费凭证功能即将开放");
  };

  const handleBackToSearch = () => {
    setPaymentStep("search");
    setSelectedAccount(null);
    setIsOtherPay(false);
    setPayerName("");
    setSuccessRecord(null);
  };

  const handleSetDefault = (accountId: string) => {
    setSavedAccounts((prev) =>
      prev.map((acc) => ({
        ...acc,
        isDefault: acc.id === accountId,
      }))
    );
    showToast("success", "已设为默认户号");
  };

  const handleDeleteAccount = (accountId: string) => {
    setSavedAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
    showToast("success", "户号已删除");
  };

  const handleEditAccount = (accountId: string) => {
    showToast("success", "编辑功能即将开放");
  };

  const totalDistrictSystems = useMemo(() => {
    const districts = new Set(savedAccounts.map((a) => a.district));
    return districts.size * 5;
  }, [savedAccounts]);

  const showDropdown = searchResults.length > 0 && activeSearchCategory !== null;

  const groupedSavedAccounts = useMemo(() => {
    const groups: Record<PaymentCategory, SavedAccount[]> = {
      water: [],
      electric: [],
      gas: [],
      heating: [],
      broadband: [],
    };
    savedAccounts.forEach((acc) => {
      groups[acc.category].push(acc);
    });
    return groups;
  }, [savedAccounts]);

  return (
    <AppLayout title="便民缴费">
      <Toast toast={toast} onClose={closeToast} />

      <div className="flex border-b border-slate-100 bg-white sticky top-12 z-10">
        <button
          onClick={() => setActiveTab("pay")}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors relative",
            activeTab === "pay"
              ? "text-brand-600"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          缴费
          {activeTab === "pay" && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-brand-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("my-accounts")}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors relative",
            activeTab === "my-accounts"
              ? "text-brand-600"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          我的户号
          {activeTab === "my-accounts" && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-brand-500 rounded-full" />
          )}
        </button>
      </div>

      <div className="p-4">
        {activeTab === "pay" && (
          <>
            {paymentStep === "search" && (
              <>
                <div className="mb-4">
                  <h2 className="section-title mb-3">选择缴费类型</h2>
                  <div className="space-y-3">
                    {categories.map(([key, config]) => {
                      const recent = getRecentAccountsByCategory(key);
                      const isActive = selectedCategory === key;
                      const showThisDropdown =
                        showDropdown && activeSearchCategory === key;

                      return (
                        <CategorySearchCard
                          key={key}
                          category={key}
                          config={config}
                          isActive={isActive}
                          searchValue={categorySearchValues[key]}
                          onSearchChange={(val) =>
                            handleCategorySearchChange(key, val)
                          }
                          onSearchFocus={() => handleSearchFocus(key)}
                          recentAccounts={recent}
                          onSelectRecent={handleSelectRecent}
                          onAddAccount={handleAddAccount}
                          onCardClick={() => handleCardClick(key)}
                          showDropdown={showThisDropdown}
                          searchResults={searchResults.filter(
                            (a) => a.category === key
                          )}
                          onSelectResult={handleSelectResult}
                          searchLoading={searchLoading}
                          accountHistory={accountHistory.filter((h) => h.category === key)}
                          onSelectHistory={handleSelectHistory}
                          showAccountHistory={activeHistoryCategory === key && !categorySearchValues[key].trim()}
                        />
                      );
                    })}
                  </div>
                </div>

                {searchHistory.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                        <History size={15} className="text-slate-400" />
                        搜索历史
                      </h3>
                      <button
                        onClick={clearSearchHistory}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        清空
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {searchHistory.map((item) => (
                        <button
                          key={item.timestamp}
                          onClick={() => {
                            const waterIdx = item.keyword.indexOf("水");
                            const category: PaymentCategory =
                              waterIdx >= 0
                                ? "water"
                                : item.keyword.includes("电")
                                ? "electric"
                                : item.keyword.includes("燃") ||
                                  item.keyword.includes("气")
                                ? "gas"
                                : "water";
                            setCategorySearchValues((prev) => ({
                              ...prev,
                              [category]: item.keyword,
                            }));
                            setActiveSearchCategory(category);
                            performSearch(item.keyword, category);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-xs text-slate-600 transition-colors"
                        >
                          {item.keyword}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Sparkles size={15} className="text-amber-500" />
                    <h3 className="text-sm font-medium text-slate-700">
                      附近热门户号
                    </h3>
                  </div>
                  <div className="card divide-y divide-slate-50 overflow-hidden">
                    {hotAccounts.map((account) => {
                      const accConfig = categoryConfig[account.category];
                      const AccIcon = accConfig.icon;
                      return (
                        <button
                          key={account.id}
                          onClick={() => handleSelectResult(account)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br text-white flex-shrink-0",
                              accConfig.gradient
                            )}
                          >
                            <AccIcon size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-800">
                                {account.accountName}
                              </span>
                              {account.status === "unpaid" &&
                                account.amountDue > 0 && (
                                  <span className="text-xs text-red-500 font-medium">
                                    待缴{formatMoney(account.amountDue)}
                                  </span>
                                )}
                            </div>
                            <div className="text-xs text-slate-500 truncate mt-0.5">
                              {maskAccountNumber(account.accountNumber)} ·{" "}
                              {account.district}
                            </div>
                          </div>
                          <ChevronRight
                            size={16}
                            className="text-slate-300 flex-shrink-0"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="text-center py-4 text-xs text-slate-400 border-t border-slate-100">
                  <div className="flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={14} className="text-green-500" />
                    已接入 {totalDistrictSystems} 个区县缴费系统，数据实时同步
                  </div>
                </div>
              </>
            )}

            {paymentStep === "confirm" && selectedAccount && (
              <div className="animate-fade-in-up">
                <button
                  onClick={handleBackToSearch}
                  className="flex items-center gap-1 text-sm text-slate-500 mb-4 hover:text-slate-700"
                >
                  <ArrowRight
                    size={16}
                    className="rotate-180"
                  />
                  返回搜索
                </button>

                <div className="card p-5 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full bg-brand-500"
                      )}
                    />
                    <span className="text-sm font-medium text-slate-700">
                      确认账单信息
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br text-white",
                        categoryConfig[selectedAccount.category].gradient
                      )}
                    >
                      {(() => {
                        const Icon = categoryConfig[selectedAccount.category].icon;
                        return <Icon size={24} />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800">
                        {selectedAccount.categoryName}
                      </div>
                      <SourceBadge
                        district={selectedAccount.district}
                        sourceSystem={selectedAccount.sourceSystem}
                      />
                    </div>
                    <span
                      className={cn(
                        "chip",
                        statusConfig[selectedAccount.status].className
                      )}
                    >
                      {statusConfig[selectedAccount.status].label}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">缴费系统</span>
                      <span className="text-sm text-slate-700">
                        {selectedAccount.sourceSystem}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">户名</span>
                      <span className="text-sm font-medium text-slate-800">
                        {selectedAccount.accountName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">户号</span>
                      <span className="text-sm font-medium text-slate-800 tabular-nums">
                        {selectedAccount.accountNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">缴费地址</span>
                      <span className="text-sm text-slate-700 text-right max-w-[200px]">
                        {selectedAccount.fullAddress}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">截止日期</span>
                      <span className="text-sm text-slate-700">
                        {selectedAccount.dueDate}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-sm text-slate-500 mb-1">
                          应缴金额
                        </div>
                        <div className="text-3xl font-bold text-brand-600 tabular-nums">
                          {formatMoney(selectedAccount.amountDue)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                      <FileText size={15} className="text-slate-400" />
                      电子发票
                    </span>
                    <button className="text-xs text-brand-500 flex items-center gap-1">
                      <Eye size={12} />
                      预览
                    </button>
                  </div>
                  <div className="text-xs text-slate-400">
                    缴费成功后可申请开具电子发票，发票抬头默认与户名一致
                  </div>
                </div>

                <div className="card p-4 mb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                        <UserPlus size={15} className="text-slate-400" />
                        为他人代缴
                      </span>
                      <div className="text-xs text-slate-400 mt-0.5">
                        可帮家人朋友代缴费用
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsOtherPay(!isOtherPay);
                        if (!isOtherPay) {
                          setPayerName("");
                        }
                      }}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        isOtherPay ? "bg-brand-500" : "bg-slate-200"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                          isOtherPay ? "left-6" : "left-0.5"
                        )}
                      />
                    </button>
                  </div>
                  {isOtherPay && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <input
                        type="text"
                        placeholder="请输入代缴人姓名"
                        value={payerName}
                        onChange={(e) => setPayerName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={handleConfirmPay}
                  disabled={
                    payLoading ||
                    selectedAccount.status === "paid" ||
                    selectedAccount.amountDue <= 0
                  }
                  className={cn(
                    "btn-primary w-full py-3.5 text-base",
                    (payLoading ||
                      selectedAccount.status === "paid" ||
                      selectedAccount.amountDue <= 0) &&
                      "opacity-50 cursor-not-allowed"
                  )}
                >
                  {payLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      缴费处理中...
                    </>
                  ) : selectedAccount.status === "paid" ? (
                    <>
                      <CheckCircle2 size={18} />
                      已缴费
                    </>
                  ) : (
                    `确认缴费 ${formatMoney(selectedAccount.amountDue)}`
                  )}
                </button>
              </div>
            )}

            {paymentStep === "success" && selectedAccount && successRecord && paymentSuccessData.receiptData && (
              <div className="animate-fade-in-up pt-4">
                <div className="text-center mb-6">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-30" />
                    <div className="relative w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
                      <CheckCircle2 size={48} className="text-green-500" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">
                    缴费成功
                  </h2>
                  <p className="text-sm text-slate-500 mb-2">
                    {selectedAccount.categoryName}已支付
                  </p>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-xs px-2.5 py-1 rounded-full">
                    <Clock size={12} />
                    预计1分钟内到账
                  </div>
                </div>

                {paymentSuccessData.showReceipt && (
                  <div className="card p-5 mb-4 overflow-hidden relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-brand-500 to-blue-500" />
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-dashed border-slate-200">
                      <div>
                        <div className="text-sm text-slate-500 mb-1">支付金额</div>
                        <div className="text-3xl font-bold text-brand-600 tabular-nums">
                          {formatMoney(selectedAccount.amountDue)}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br text-white",
                          categoryConfig[selectedAccount.category].gradient
                        )}
                      >
                        {(() => {
                          const Icon =
                            categoryConfig[selectedAccount.category].icon;
                          return <Icon size={24} />;
                        })()}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">缴费流水号</span>
                        <span className="text-sm font-medium font-mono text-slate-700 tabular-nums">
                          {paymentSuccessData.receiptData.serialNo}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">订单号</span>
                        <span className="text-sm text-slate-700 tabular-nums">
                          {successRecord.orderNo}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">缴费项目</span>
                        <span className="text-sm text-slate-700">
                          {paymentSuccessData.receiptData.category}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">户名</span>
                        <span className="text-sm text-slate-700">
                          {paymentSuccessData.receiptData.accountName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">户号</span>
                        <span className="text-sm text-slate-700 tabular-nums">
                          {maskAccountNumber(paymentSuccessData.receiptData.accountNumber)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">缴费时间</span>
                        <span className="text-sm text-slate-700">
                          {formatDateTime(paymentSuccessData.receiptData.paidAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">预计到账</span>
                        <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 size={14} />
                          1分钟内到账
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">所属区县</span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          districtColors[selectedAccount.district] || "bg-slate-100 text-slate-600"
                        )}>
                          {selectedAccount.district}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
                      <div className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                        <Receipt size={12} />
                        电子收据预览
                      </div>
                      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200">
                        <div className="text-center mb-3">
                          <div className="text-xs text-slate-500">青岛市财政局电子收据</div>
                          <div className="text-lg font-bold text-slate-800 mt-1" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                            缴费凭证
                          </div>
                        </div>
                        <div className="text-xs space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-slate-500">收据编号</span>
                            <span className="font-mono text-slate-700">{paymentSuccessData.receiptData.serialNo}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">校验码</span>
                            <span className="font-mono text-slate-700">{Math.random().toString(36).slice(2, 10).toUpperCase()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">开具时间</span>
                            <span className="text-slate-700">{formatDateTime(new Date())}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200 flex justify-end">
                          <div className="text-right">
                            <div className="text-red-600 text-[10px] font-bold">青岛市</div>
                            <div className="text-red-600 text-xs font-bold">财政电子章</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 mb-5">
                  <button onClick={handleViewPaymentCert} className="card p-4 flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <FileText size={20} className="text-blue-500" />
                    </div>
                    <span className="text-xs text-slate-700">缴费凭证</span>
                  </button>
                  <button className="card p-4 flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Receipt size={20} className="text-emerald-500" />
                    </div>
                    <span className="text-xs text-slate-700">电子收据</span>
                  </button>
                  <button className="card p-4 flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                      <FileText size={20} className="text-purple-500" />
                    </div>
                    <span className="text-xs text-slate-700">申请发票</span>
                  </button>
                </div>

                <button
                  onClick={handleBackToSearch}
                  className="btn-secondary w-full py-3"
                >
                  继续缴费
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === "my-accounts" && (
          <div className="animate-fade-in">
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="section-title">我的户号</h2>
                <button
                  onClick={handleAddAccount}
                  className="text-sm text-brand-500 flex items-center gap-1 font-medium"
                >
                  <Plus size={16} />
                  添加
                </button>
              </div>
              <p className="text-xs text-slate-400">
                共 {savedAccounts.length} 个户号，已接入 {totalDistrictSystems} 个区县缴费系统
              </p>
            </div>

            <div className="space-y-5">
              {categories.map(([category, config]) => {
                const accounts = groupedSavedAccounts[category];
                if (accounts.length === 0) return null;

                const CatIcon = config.icon;

                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center",
                          config.bgLight
                        )}
                      >
                        <CatIcon size={15} className={config.textColor} />
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        {config.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({accounts.length})
                      </span>
                    </div>

                    <div className="space-y-3">
                      {accounts.map((account) => (
                        <div key={account.id} className="card p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br text-white",
                                  config.gradient
                                )}
                              >
                                <CatIcon size={18} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-slate-800">
                                    {account.accountName}
                                  </span>
                                  {account.isDefault && (
                                    <span className="chip bg-brand-100 text-brand-700 text-xs">
                                      <Star size={10} className="mr-0.5" />
                                      默认
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                                  {maskAccountNumber(account.accountNumber)}
                                </div>
                              </div>
                            </div>
                            <span
                              className={cn(
                                "chip text-xs flex-shrink-0",
                                districtColors[account.district] ||
                                  "bg-slate-100 text-slate-600"
                              )}
                            >
                              {account.district}
                            </span>
                          </div>

                          <div className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
                            <Building2 size={12} />
                            {account.sourceSystem}
                          </div>

                          <div className="text-xs text-slate-500 mb-3 line-clamp-1">
                            <MapPin size={12} className="inline mr-1" />
                            {account.fullAddress}
                          </div>

                          {account.lastPaidAt && (
                            <div className="flex items-center justify-between text-xs text-slate-400 mb-3 pb-3 border-b border-slate-50">
                              <span>最近缴费</span>
                              <span>
                                {formatDate(account.lastPaidAt)} ·{" "}
                                {formatMoney(account.lastAmount || 0)}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSetDefault(account.id)}
                              className={cn(
                                "flex-1 py-2 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors",
                                account.isDefault
                                  ? "bg-brand-50 text-brand-600"
                                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                              )}
                            >
                              <Star size={14} />
                              {account.isDefault ? "默认户号" : "设为默认"}
                            </button>
                            <button
                              onClick={() => handleEditAccount(account.id)}
                              className="flex-1 py-2 rounded-lg text-xs flex items-center justify-center gap-1 bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
                            >
                              <Edit3 size={14} />
                              编辑
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(account.id)}
                              className="flex-1 py-2 rounded-lg text-xs flex items-center justify-center gap-1 bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                              删除
                            </button>
                          </div>

                          <button
                            onClick={() => handleSelectRecent(account)}
                            className="w-full mt-3 py-2 rounded-xl bg-gradient-to-r text-white text-sm font-medium flex items-center justify-center gap-1.5"
                            style={{
                              background:
                                "linear-gradient(135deg, #4E96FF 0%, #1E6FFF 100%)",
                            }}
                          >
                            <CreditCard size={15} />
                            立即缴费
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {savedAccounts.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <CreditCard size={28} className="text-slate-300" />
                </div>
                <p className="text-slate-500 text-sm mb-4">暂无保存的户号</p>
                <button
                  onClick={handleAddAccount}
                  className="btn-primary px-6 py-2.5 text-sm"
                >
                  <Plus size={16} />
                  添加户号
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
