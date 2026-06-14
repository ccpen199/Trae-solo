import { MapPin, User, Wifi, WifiOff } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

export default function AppHeader() {
  const { user, userLocation, isOnline } = useAppStore();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-xl border-b border-slate-100">
      <div className="container mx-auto h-14 md:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <span className="text-white font-bold text-sm md:text-base">青</span>
          </div>
          <div className="flex flex-col leading-tight">
            <h1 className="text-base md:text-lg font-semibold text-slate-900 tracking-tight">
              青岛市民通
            </h1>
            <span className="hidden md:block text-[11px] text-slate-500">
              Qingdao Citizen Service
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-full bg-slate-50 border border-slate-100">
            <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-500" />
            <span className="text-xs md:text-sm font-medium text-slate-700 max-w-[80px] md:max-w-none truncate">
              {userLocation?.district ?? "定位中"}
            </span>
          </div>

          <div
            className={cn(
              "hidden md:flex items-center gap-1.5 px-3 py-2 rounded-full",
              isOnline
                ? "bg-emerald-50 border border-emerald-100"
                : "bg-amber-50 border border-amber-100"
            )}
          >
            {isOnline ? (
              <Wifi className="w-4 h-4 text-emerald-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-500" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                isOnline ? "text-emerald-700" : "text-amber-700"
              )}
            >
              {isOnline ? "在线" : "离线"}
            </span>
          </div>

          <button className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-50 border border-slate-100 hover:bg-brand-50 hover:border-brand-100 transition-colors">
            <User className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
          </button>
        </div>
      </div>
    </header>
  );
}
