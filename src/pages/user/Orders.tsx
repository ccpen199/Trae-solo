import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shirt,
  BookOpen,
  Smartphone,
  Package,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Empty from "@/components/Empty";

type TabKey = "all" | "pending" | "completed";

const tabs: { key: TabKey; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pending", label: "进行中" },
  { key: "completed", label: "已完成" },
];

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

type OrderStatus =
  | "预约成功"
  | "快递员已接单"
  | "已取件"
  | "质检中"
  | "已估价"
  | "已打款"
  | "已完成";

const allOrders = [
  {
    id: "RC20260618001",
    category: "clothes",
    status: "质检中" as OrderStatus,
    price: 45.0,
    time: "今天 10:30",
    quantity: "5.2kg",
  },
  {
    id: "RC20260617003",
    category: "phones",
    status: "已打款" as OrderStatus,
    price: 1280,
    time: "昨天 15:20",
    quantity: "1件",
  },
  {
    id: "RC20260615005",
    category: "books",
    status: "快递员已接单" as OrderStatus,
    price: 36.0,
    time: "6月15日 09:15",
    quantity: "18本",
  },
  {
    id: "RC20260610002",
    category: "clothes",
    status: "已完成" as OrderStatus,
    price: 78.5,
    time: "6月10日 14:00",
    quantity: "8.5kg",
  },
  {
    id: "RC20260605004",
    category: "books",
    status: "已完成" as OrderStatus,
    price: 52.0,
    time: "6月5日 11:30",
    quantity: "26本",
  },
];

const statusBadgeClass: Record<OrderStatus, string> = {
  预约成功: "bg-blue-100 text-blue-700",
  快递员已接单: "bg-cyan-100 text-cyan-700",
  已取件: "bg-amber-100 text-amber-700",
  质检中: "bg-purple-100 text-purple-700",
  已估价: "bg-indigo-100 text-indigo-700",
  已打款: "bg-eco-100 text-eco-700",
  已完成: "bg-neutral-100 text-neutral-600",
};

export default function Orders() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const filteredOrders = allOrders.filter((o) => {
    if (activeTab === "all") return true;
    if (activeTab === "completed") return o.status === "已完成";
    return o.status !== "已完成";
  });

  return (
    <div className="pb-6 animate-fade-in">
      <div className="sticky top-14 z-30 bg-neutral-50 pt-3 px-4">
        <div className="card p-1 flex">
          {tabs.map(({ key, label }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative",
                  isActive
                    ? "bg-gradient-to-r from-eco-500 to-eco-600 text-white shadow-md"
                    : "text-neutral-500 hover:text-neutral-700"
                )}
              >
                {label}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-eco-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 mt-4">
        {filteredOrders.length === 0 ? (
          <div className="py-20">
            <Empty />
            <p className="text-center text-neutral-400 text-sm mt-2">暂无订单</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order, idx) => {
              const CatIcon = categoryIconMap[order.category] || Package;
              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/user/orders/${order.id}`)}
                  className="card p-4 cursor-pointer active:scale-[0.99] animate-slide-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-eco-100 to-emerald-100 flex items-center justify-center">
                        <CatIcon className="w-5.5 h-5.5 text-eco-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-800">
                            {categoryLabelMap[order.category]}回收
                          </span>
                          <span
                            className={cn("badge", statusBadgeClass[order.status])}
                          >
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          #{order.id} · {order.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-neutral-400">{order.time}</p>
                      <p className="text-eco-600 text-xl font-bold mt-0.5">
                        ¥{order.price.toFixed(order.category === "phones" ? 0 : 2)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3.5 pt-3.5 border-t border-neutral-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-neutral-400">
                      <ClipboardList className="w-3.5 h-3.5" />
                      查看订单详情
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-300" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
