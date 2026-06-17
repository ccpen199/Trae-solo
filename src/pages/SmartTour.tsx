import { useState } from "react";
import { mockScenicSpots, mockTourRoutes, mockComplaints } from "@/data/mock";
import StatusBadge from "@/components/StatusBadge";
import { Mountain, Route, MessageSquareWarning, Clock, Users, MapPin, Sparkles, Send } from "lucide-react";
import { clsx } from "clsx";

type Tab = "spots" | "routes" | "complaints";

const heatColors: Record<string, string> = {
  low: "text-emerald-600 bg-emerald-50",
  medium: "text-blue-600 bg-blue-50",
  high: "text-amber-600 bg-amber-50",
  full: "text-red-600 bg-red-50",
};

export default function SmartTour() {
  const [tab, setTab] = useState<Tab>("spots");
  const [selectedSpot, setSelectedSpot] = useState(mockScenicSpots[0]);
  const [complaintTitle, setComplaintTitle] = useState("");
  const [complaintContent, setComplaintContent] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleComplaintSubmit = () => {
    if (complaintTitle && complaintContent) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setComplaintTitle("");
        setComplaintContent("");
      }, 2000);
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold text-gray-900 mb-1">智游八桂</h2>
        <p className="text-sm text-gray-500">景区预约限流预警 · 小众路线AI规划 · 文旅投诉直连</p>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { key: "spots" as Tab, label: "景区预约限流", icon: Mountain },
          { key: "routes" as Tab, label: "AI路线规划", icon: Route },
          { key: "complaints" as Tab, label: "文旅投诉直连", icon: MessageSquareWarning },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
              tab === item.key ? "bg-emerald-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      {tab === "spots" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            {mockScenicSpots.map((spot) => {
              const occupancy = Math.round((spot.currentVisitors / spot.maxCapacity) * 100);
              return (
                <button
                  key={spot.id}
                  onClick={() => setSelectedSpot(spot)}
                  className={clsx(
                    "w-full text-left rounded-xl border p-4 transition-all hover-lift",
                    selectedSpot.id === spot.id ? "border-emerald-300 bg-emerald-50/50" : "border-gray-100 bg-white"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <img src={spot.image} alt={spot.name} className="w-16 h-12 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-gray-900 truncate">{spot.name}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-50 text-gold-700 font-medium">{spot.level}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={spot.heatLevel} />
                        <span className="text-xs text-gray-500">{occupancy}%</span>
                      </div>
                      <div className="w-full h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                        <div className={clsx(
                          "h-full rounded-full transition-all",
                          spot.heatLevel === "low" ? "bg-emerald-500" : spot.heatLevel === "medium" ? "bg-blue-500" : spot.heatLevel === "high" ? "bg-amber-500" : "bg-red-500"
                        )} style={{ width: `${occupancy}%` }} />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl overflow-hidden border border-gray-100">
              <img src={selectedSpot.image} alt={selectedSpot.name} className="w-full h-48 object-cover" />
              <div className="bg-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-display font-bold text-lg text-gray-900">{selectedSpot.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-gold-50 text-gold-700 font-medium">{selectedSpot.level}景区</span>
                      <span className={clsx("text-xs px-2 py-0.5 rounded font-medium", heatColors[selectedSpot.heatLevel])}>
                        {selectedSpot.heatLevel === "low" ? "空闲" : selectedSpot.heatLevel === "medium" ? "适中" : selectedSpot.heatLevel === "high" ? "较忙" : "限流中"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{selectedSpot.currentVisitors.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">/ {selectedSpot.maxCapacity.toLocaleString()} 人</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                可预约时段
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {selectedSpot.availableSlots.map((slot) => (
                  <div key={slot.time} className={clsx(
                    "rounded-lg border p-3 text-center transition-all cursor-pointer",
                    slot.remaining === 0 ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed" : "border-emerald-200 bg-emerald-50/30 hover:border-emerald-400 hover:bg-emerald-50"
                  )}>
                    <p className="text-xs font-medium text-gray-700">{slot.time}</p>
                    <p className={clsx("text-sm font-bold mt-1", slot.remaining === 0 ? "text-gray-400" : "text-emerald-600")}>
                      {slot.remaining === 0 ? "已满" : `余${slot.remaining}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {selectedSpot.heatLevel === "full" && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center alert-pulse">
                  <Users className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-700">限流预警</p>
                  <p className="text-xs text-red-500">{selectedSpot.name}当前已达最大承载量，建议选择其他时段或其他景区游览</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "routes" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-2">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-sm text-gray-900">AI路线规划</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {["轻松休闲", "深度探索", "户外挑战", "文化体验"].map((pref) => (
                <button key={pref} className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors">
                  {pref}
                </button>
              ))}
            </div>
          </div>
          {mockTourRoutes.map((route) => (
            <div key={route.id} className="bg-white rounded-xl border border-gray-100 p-5 hover-lift">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg gradient-emerald flex items-center justify-center text-white">
                    <Route className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{route.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{route.duration}</span>
                      <span>·</span>
                      <span className={clsx(
                        "px-1.5 py-0.5 rounded",
                        route.difficulty === "easy" ? "bg-emerald-50 text-emerald-600" : route.difficulty === "moderate" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                      )}>
                        {route.difficulty === "easy" ? "轻松" : route.difficulty === "moderate" ? "适中" : "挑战"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI推荐
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{route.description}</p>
              <div className="flex items-center gap-2">
                {route.spots.map((spot, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{spot}</span>
                    {i < route.spots.length - 1 && <span className="text-gray-300">→</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "complaints" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-display font-bold text-base text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquareWarning className="w-5 h-5 text-gold-600" />
              提交投诉
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">投诉标题</label>
                <input
                  value={complaintTitle}
                  onChange={(e) => setComplaintTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                  placeholder="请输入投诉标题"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">详细描述</label>
                <textarea
                  value={complaintContent}
                  onChange={(e) => setComplaintContent(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-28 resize-none focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                  placeholder="请详细描述您的问题，我们将直连文旅局处理"
                />
              </div>
              <button
                onClick={handleComplaintSubmit}
                className={clsx(
                  "w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all",
                  submitted ? "bg-emerald-100 text-emerald-700" : "bg-emerald-600 text-white hover:bg-emerald-700"
                )}
              >
                {submitted ? (
                  <>✓ 提交成功</>
                ) : (
                  <><Send className="w-4 h-4" />直连提交</>
                )}
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-display font-bold text-base text-gray-900">投诉追踪</h3>
            {mockComplaints.map((complaint) => (
              <div key={complaint.id} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm text-gray-900">{complaint.title}</h4>
                  <StatusBadge status={complaint.status} />
                </div>
                <p className="text-xs text-gray-500 mb-2">{complaint.content}</p>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <Clock className="w-3 h-3" />
                  {complaint.createdAt}
                </div>
                {complaint.reply && (
                  <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                    <p className="text-xs text-emerald-600 font-medium mb-1">文旅局回复：</p>
                    <p className="text-xs text-gray-600">{complaint.reply}</p>
                  </div>
                )}
                <div className="flex items-center gap-1 mt-3">
                  {["已提交", "处理中", "已解决"].map((step, i) => {
                    const isActive = (complaint.status === "submitted" && i === 0) || (complaint.status === "processing" && i <= 1) || (complaint.status === "resolved" && i <= 2);
                    return (
                      <span key={step} className="flex items-center gap-1">
                        <span className={clsx("text-[10px]", isActive ? "text-emerald-600 font-medium" : "text-gray-300")}>{step}</span>
                        {i < 2 && <span className="text-gray-200 mx-1">→</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
