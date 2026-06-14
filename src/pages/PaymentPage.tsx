import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { paymentApi } from "@/api";
import type {
  PaymentCategory,
  PaymentAccount,
  PaymentRecord,
  PaymentStatus,
} from "../../shared/types";
import { cn } from "@/lib/utils";
import { formatMoney, formatDate, formatDateTime } from "@/utils/format";

interface ToastState {
  show: boolean;
  type: "success" | "error";
  message: string;
}

const categoryConfig: Record<
  PaymentCategory,
  {
    label: string;
    icon: typeof Droplets;
    gradient: string;
    activeGradient: string;
  }
> = {
  water: {
    label: "水费",
    icon: Droplets,
    gradient: "from-sky-400 to-blue-500",
    activeGradient: "from-sky-500 to-blue-600",
  },
  electric: {
    label: "电费",
    icon: Zap,
    gradient: "from-yellow-400 to-amber-500",
    activeGradient: "from-yellow-500 to-amber-600",
  },
  gas: {
    label: "燃气费",
    icon: Flame,
    gradient: "from-orange-400 to-orange-500",
    activeGradient: "from-orange-500 to-orange-600",
  },
  heating: {
    label: "供暖费",
    icon: ThermometerSun,
    gradient: "from-rose-400 to-red-500",
    activeGradient: "from-rose-500 to-red-600",
  },
  broadband: {
    label: "宽带费",
    icon: Wifi,
    gradient: "from-violet-400 to-purple-500",
    activeGradient: "from-violet-500 to-purple-600",
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

export default function PaymentPage() {
  const [selectedCategory, setSelectedCategory] = useState<PaymentCategory | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<PaymentAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<PaymentAccount | null>(null);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    type: "success",
    message: "",
  });

  const handleSearch = useCallback(async () => {
    if (!searchKeyword.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const data = await paymentApi.searchAccounts(searchKeyword);
      const filtered = selectedCategory
        ? data.filter((a) => a.category === selectedCategory)
        : data;
      setSearchResults(filtered);
      setShowDropdown(true);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setSearchLoading(false);
    }
  }, [searchKeyword, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchKeyword, handleSearch]);

  useEffect(() => {
    if (selectedCategory) {
      handleSearch();
    }
  }, [selectedCategory]);

  const fetchRecords = useCallback(async (accountId: string) => {
    try {
      const records = await paymentApi.getRecords(accountId);
      setPaymentRecords(records);
    } catch (error) {
      console.error("Fetch records failed:", error);
    }
  }, []);

  const handleSelectCategory = (category: PaymentCategory) => {
    const newCategory = selectedCategory === category ? null : category;
    setSelectedCategory(newCategory);
    setSelectedAccount(null);
    setSearchKeyword("");
    setSearchResults([]);
    setPaymentRecords([]);
  };

  const handleSelectAccount = (account: PaymentAccount) => {
    setSelectedAccount(account);
    setSearchKeyword(account.accountNumber);
    setSearchResults([]);
    setShowDropdown(false);
    fetchRecords(account.id);
  };

  const handlePay = async () => {
    if (!selectedAccount || selectedAccount.amountDue <= 0) return;
    setPayLoading(true);
    try {
      await paymentApi.pay(selectedAccount.id, selectedAccount.amountDue);
      setToast({
        show: true,
        type: "success",
        message: `缴费成功！已支付 ${formatMoney(selectedAccount.amountDue)}`,
      });
      setSelectedAccount({
        ...selectedAccount,
        status: "paid",
      });
      fetchRecords(selectedAccount.id);
    } catch (error) {
      setToast({
        show: true,
        type: "error",
        message: "缴费失败，请稍后重试",
      });
    } finally {
      setPayLoading(false);
    }
  };

  const closeToast = () => setToast((t) => ({ ...t, show: false }));

  const categories = Object.entries(categoryConfig) as [
    PaymentCategory,
    (typeof categoryConfig)[PaymentCategory]
  ][];

  return (
    <AppLayout title="便民缴费">
      <Toast toast={toast} onClose={closeToast} />

      <div className="mb-5">
        <h2 className="section-title mb-3">选择缴费类型</h2>
        <div className="grid grid-cols-5 gap-3">
          {categories.map(([key, config]) => {
            const isActive = selectedCategory === key;
            const Icon = config.icon;
            return (
              <button
                key={key}
                onClick={() => handleSelectCategory(key)}
                className={cn(
                  "flex flex-col items-center justify-center py-4 rounded-2xl transition-all duration-300",
                  isActive
                    ? cn(
                        "bg-gradient-to-br text-white shadow-lg scale-105",
                        config.activeGradient
                      )
                    : cn(
                        "bg-gradient-to-br text-white/90 hover:scale-105 opacity-90 hover:opacity-100",
                        config.gradient
                      )
                )}
              >
                <Icon size={28} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs font-medium mt-2">{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-5">
        <h2 className="section-title mb-3">户号查询</h2>
        <div className="relative">
          <div
            className={cn(
              "card flex items-center gap-3 px-4 py-3",
              showDropdown && searchResults.length > 0 && "rounded-b-none"
            )}
          >
            <Search size={18} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder={selectedCategory ? `输入${categoryConfig[selectedCategory].label}户号或户名` : "输入户号或户名搜索"}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              className="flex-1 outline-none text-sm bg-transparent placeholder:text-slate-400"
            />
            {searchLoading && (
              <Loader2 size={18} className="text-brand-500 animate-spin flex-shrink-0" />
            )}
          </div>
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-30 left-0 right-0 top-full bg-white border border-t-0 border-slate-100 rounded-b-2xl shadow-lg overflow-hidden animate-slide-down">
              {searchResults.slice(0, 5).map((account) => {
                const accConfig = categoryConfig[account.category];
                const AccIcon = accConfig.icon;
                return (
                  <button
                    key={account.id}
                    onClick={() => handleSelectAccount(account)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0 text-left"
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br text-white",
                        accConfig.gradient
                      )}
                    >
                      <AccIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800">
                        {account.accountName}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {account.accountNumber}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {account.categoryName}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedAccount && (
        <div className="animate-fade-in-up">
          <div className="card p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
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
                <div>
                  <div className="font-semibold text-slate-800">
                    {selectedAccount.categoryName}
                  </div>
                  <span
                    className={cn(
                      "chip mt-1",
                      statusConfig[selectedAccount.status].className
                    )}
                  >
                    {statusConfig[selectedAccount.status].label}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <User size={16} className="text-slate-400 flex-shrink-0" />
                <span className="text-slate-500">户名：</span>
                <span className="text-slate-800 font-medium">
                  {selectedAccount.accountName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard size={16} className="text-slate-400 flex-shrink-0" />
                <span className="text-slate-500">户号：</span>
                <span className="text-slate-800 font-medium tabular-nums">
                  {selectedAccount.accountNumber}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm col-span-2">
                <MapPin size={16} className="text-slate-400 flex-shrink-0" />
                <span className="text-slate-500">地址：</span>
                <span className="text-slate-800">{selectedAccount.district}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={16} className="text-slate-400 flex-shrink-0" />
                <span className="text-slate-500">截止日期：</span>
                <span className="text-slate-800">{selectedAccount.dueDate}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-end justify-between">
              <div>
                <div className="text-sm text-slate-500 mb-1">应缴金额</div>
                <div className="text-3xl font-bold text-brand-600 tabular-nums">
                  {formatMoney(selectedAccount.amountDue)}
                </div>
              </div>
              <button
                onClick={handlePay}
                disabled={payLoading || selectedAccount.status === "paid" || selectedAccount.amountDue <= 0}
                className={cn(
                  "btn-primary px-8 py-3 text-base",
                  (payLoading || selectedAccount.status === "paid" || selectedAccount.amountDue <= 0) &&
                    "opacity-50 cursor-not-allowed"
                )}
              >
                {payLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    缴费中...
                  </>
                ) : selectedAccount.status === "paid" ? (
                  <>
                    <CheckCircle2 size={18} />
                    已缴费
                  </>
                ) : (
                  "立即缴费"
                )}
              </button>
            </div>
          </div>

          <div>
            <h2 className="section-title mb-3">最近缴费记录</h2>
            {paymentRecords.length === 0 ? (
              <div className="card p-8 text-center text-slate-500 text-sm">
                暂无缴费记录
              </div>
            ) : (
              <div className="card divide-y divide-slate-100 overflow-hidden">
                {paymentRecords.slice(0, 5).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center",
                          record.status === "success"
                            ? "bg-green-50"
                            : record.status === "failed"
                            ? "bg-red-50"
                            : "bg-yellow-50"
                        )}
                      >
                        {record.status === "success" ? (
                          <CheckCircle2 size={18} className="text-green-600" />
                        ) : record.status === "failed" ? (
                          <XCircle size={18} className="text-red-600" />
                        ) : (
                          <Clock size={18} className="text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800">
                          {selectedAccount.categoryName}缴费
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          订单号 {record.orderNo}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-800 tabular-nums">
                        {formatMoney(record.amount)}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {record.paidAt
                          ? formatDateTime(record.paidAt, "MM-DD HH:mm")
                          : formatDateTime(record.createdAt, "MM-DD HH:mm")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
