import { useState, useEffect } from "react";
import {
  Scale,
  Stethoscope,
  Star,
  Briefcase,
  CheckCircle2,
  RefreshCw,
  Users,
  Clock,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HealthCheckupPackage } from "@/types";

interface Lawyer {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  firm: string;
  availableSlots: string[];
}

export default function Life() {
  const [packages, setPackages] = useState<HealthCheckupPackage[]>([]);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);

  const [enrollDate, setEnrollDate] = useState<Record<string, string>>({});
  const [enrollTime, setEnrollTime] = useState<Record<string, string>>({});
  const [enrollMsg, setEnrollMsg] = useState("");

  const [selectedLawyer, setSelectedLawyer] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [lawyerMsg, setLawyerMsg] = useState("");

  const memberId = "mem-1";

  const fetchPackages = async () => {
    try {
      const res = await fetch("/api/services/health-packages");
      const json = await res.json();
      if (json.success) setPackages(json.data);
    } catch {}
  };

  const fetchLawyers = async () => {
    try {
      const res = await fetch("/api/services/lawyers");
      const json = await res.json();
      if (json.success) setLawyers(json.data);
    } catch {}
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchPackages(), fetchLawyers()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleEnroll = async (pkgId: string) => {
    const date = enrollDate[pkgId];
    if (!date) return;
    try {
      const res = await fetch(`/api/services/health-packages/${pkgId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, bookingDate: date, bookingTime: enrollTime[pkgId] || "09:00" }),
      });
      const json = await res.json();
      setEnrollMsg(json.message || (json.success ? "报名成功" : "报名失败"));
    } catch {
      setEnrollMsg("网络错误");
    }
    setTimeout(() => setEnrollMsg(""), 3000);
  };

  const handleLawyerBooking = async () => {
    if (!selectedLawyer || !selectedSlot) return;
    const [bookingDate, bookingTime] = selectedSlot.split(" ");
    try {
      const res = await fetch(`/api/services/lawyers/${selectedLawyer}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, bookingDate, bookingTime }),
      });
      const json = await res.json();
      setLawyerMsg(json.message || (json.success ? "预约成功" : "预约失败"));
      if (json.success) {
        setSelectedLawyer("");
        setSelectedSlot("");
      }
    } catch {
      setLawyerMsg("网络错误");
    }
    setTimeout(() => setLawyerMsg(""), 3000);
  };

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.5;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            className={cn(
              i < full
                ? "fill-union-gold text-union-gold"
                : i === full && hasHalf
                ? "fill-union-gold/50 text-union-gold"
                : "text-gray-200"
            )}
          />
        ))}
        <span className="text-xs text-gray-500 ml-1">{rating}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="animate-spin text-union-red" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Stethoscope size={22} className="text-union-red" />
          <h2 className="text-xl font-bold">体检套餐团购</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map((pkg) => {
            const progress = (pkg.enrolledCount / pkg.maxCount) * 100;
            const isFull = pkg.enrolledCount >= pkg.maxCount;
            return (
              <div key={pkg.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">{pkg.providerName}</p>
                    <h4 className="font-bold text-gray-900">{pkg.name}</h4>
                  </div>
                  <Tag size={16} className="text-union-red shrink-0 mt-1" />
                </div>

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold text-union-red font-serif">¥{pkg.groupPrice}</span>
                  <span className="text-sm text-gray-400 line-through">¥{pkg.originalPrice}</span>
                  <span className="px-1.5 py-0.5 bg-union-red/10 text-union-red text-xs rounded font-medium">
                    省¥{pkg.originalPrice - pkg.groupPrice}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {pkg.items.map((item) => (
                    <span key={item} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      报名进度
                    </span>
                    <span>{pkg.enrolledCount}/{pkg.maxCount}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all",
                        isFull ? "bg-red-500" : progress >= 80 ? "bg-orange-500" : "bg-union-red"
                      )}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">预约日期</label>
                    <input
                      type="date"
                      value={enrollDate[pkg.id] || ""}
                      onChange={(e) =>
                        setEnrollDate((prev) => ({ ...prev, [pkg.id]: e.target.value }))
                      }
                      className="input-field text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">预约时间</label>
                    <input
                      type="time"
                      value={enrollTime[pkg.id] || "09:00"}
                      onChange={(e) =>
                        setEnrollTime((prev) => ({ ...prev, [pkg.id]: e.target.value }))
                      }
                      className="input-field text-sm"
                    />
                  </div>
                  <button
                    onClick={() => handleEnroll(pkg.id)}
                    disabled={isFull || !enrollDate[pkg.id]}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0",
                      isFull || !enrollDate[pkg.id]
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "btn-primary"
                    )}
                  >
                    {isFull ? "已满" : "立即报名"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {enrollMsg && (
          <p className="mt-3 text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 size={14} />
            {enrollMsg}
          </p>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-5">
          <Scale size={22} className="text-union-red" />
          <h2 className="text-xl font-bold">法律咨询预约</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lawyers.map((lawyer) => {
            const isSelected = selectedLawyer === lawyer.id;
            return (
              <div
                key={lawyer.id}
                className={cn(
                  "card cursor-pointer transition-all",
                  isSelected && "ring-2 ring-union-red"
                )}
                onClick={() => {
                  setSelectedLawyer(lawyer.id);
                  setSelectedSlot("");
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900">{lawyer.name}</h4>
                      <span className="px-2 py-0.5 bg-union-red/10 text-union-red text-xs rounded-full font-medium">
                        {lawyer.specialty}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Briefcase size={12} />
                        {lawyer.experience}年经验
                      </span>
                      <span>{lawyer.firm}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-3">{renderStars(lawyer.rating)}</div>

                <div>
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Clock size={12} />
                    可预约时段
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {lawyer.availableSlots.map((slot) => {
                      const slotKey = `${lawyer.id}-${slot}`;
                      const isSlotSelected = selectedSlot === slot && selectedLawyer === lawyer.id;
                      return (
                        <button
                          key={slotKey}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLawyer(lawyer.id);
                            setSelectedSlot(slot);
                          }}
                          className={cn(
                            "px-3 py-1.5 text-xs rounded-full font-medium transition-all border",
                            isSlotSelected
                              ? "bg-union-red text-white border-union-red"
                              : "bg-white text-gray-700 border-gray-200 hover:border-union-red hover:text-union-red"
                          )}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedLawyer && selectedSlot && (
          <div className="card mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  预约确认：{lawyers.find((l) => l.id === selectedLawyer)?.name} - {selectedSlot}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {lawyers.find((l) => l.id === selectedLawyer)?.specialty} · {lawyers.find((l) => l.id === selectedLawyer)?.firm}
                </p>
              </div>
              <button onClick={handleLawyerBooking} className="btn-primary flex items-center gap-2">
                <CheckCircle2 size={16} />
                确认预约
              </button>
            </div>
          </div>
        )}

        {lawyerMsg && (
          <p className="mt-3 text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 size={14} />
            {lawyerMsg}
          </p>
        )}
      </section>
    </div>
  );
}
