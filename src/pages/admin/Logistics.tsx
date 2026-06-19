import { Search, MapPin, Phone, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

const statusMap: Record<string, { label: string; className: string; icon: typeof MapPin }> = {
  online: { label: "在线", className: "bg-eco-100 text-eco-700", icon: CheckCircle },
  busy: { label: "忙碌中", className: "bg-amber-100 text-amber-700", icon: AlertCircle },
  offline: { label: "离线", className: "bg-neutral-100 text-neutral-600", icon: XCircle },
};

export default function Logistics() {
  const couriers = useStore((s) => s.couriers);
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-neutral-500">在线快递员</p>
          <p className="mt-1 text-2xl font-bold text-eco-600">
            {couriers.filter((c) => c.status === "online").length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-neutral-500">忙碌中</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {couriers.filter((c) => c.status === "busy").length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-neutral-500">今日总接单量</p>
          <p className="mt-1 text-2xl font-bold text-neutral-800">
            {couriers.reduce((s, c) => s + c.orderCount, 0)}
          </p>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input type="text" placeholder="搜索快递员姓名/手机号..." className="input-base pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {couriers.map((courier) => {
          const status = statusMap[courier.status];
          const StatusIcon = status.icon;
          return (
            <div key={courier.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-eco-100 flex items-center justify-center">
                    <span className="text-eco-700 font-bold text-lg">{courier.name.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-neutral-800">{courier.name}</h4>
                      <span className={cn("badge", status.className)}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5" />
                      {courier.phone}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-500">历史接单</p>
                  <p className="text-lg font-bold text-eco-600">{courier.orderCount}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-neutral-600">服务区域</p>
                    <p className="text-neutral-500">{courier.serviceArea}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-amber-500">★</span>
                    <span className="font-semibold text-neutral-800">{courier.rating}</span>
                  </div>
                  <button className="text-sm text-eco-600 hover:text-eco-700 font-medium">
                    查看详情 →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
