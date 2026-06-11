import { useEffect, useState } from "react";
import {
  Package,
  MapPin,
  ArrowUpRight,
  MessageSquare,
  Send,
  Clock,
  Weight,
  Maximize2,
  Truck,
  Shield,
  Star,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  History,
} from "lucide-react";
import { apiClient } from "@/api/client";
import { useParams, useNavigate } from "react-router-dom";

interface NegotiationRecord {
  id: string;
  role: "shipper" | "driver";
  type: "price" | "message";
  content: string;
  price?: number;
  createdAt: string;
}

export default function Negotiation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cargo, setCargo] = useState<any>(null);
  const [records, setRecords] = useState<NegotiationRecord[]>([]);
  const [message, setMessage] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [activeTab, setActiveTab] = useState<"negotiate" | "history">("negotiate");

  useEffect(() => {
    apiClient.get<any>(`/cargo/${id || "cargo_001"}`).then(setCargo);
    setRecords([
      { id: "1", role: "shipper", type: "price", content: "货主首次报价", price: 1200, createdAt: "10:15" },
      { id: "2", role: "driver", type: "price", content: "报价过低，考虑到过路费和油费", price: 1400, createdAt: "10:18" },
      { id: "3", role: "shipper", type: "message", content: "师傅，这个价格是公司预算，您看1300能走吗？", createdAt: "10:20" },
      { id: "4", role: "driver", type: "message", content: "1300可以，不过需要先付30%定金", createdAt: "10:22" },
    ]);
  }, [id]);

  const submitPrice = () => {
    if (!offerPrice) return;
    const newRecord: NegotiationRecord = {
      id: Date.now().toString(),
      role: "driver",
      type: "price",
      content: "司机报价",
      price: parseInt(offerPrice),
      createdAt: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    };
    setRecords([...records, newRecord]);
    setOfferPrice("");
  };

  const submitMessage = () => {
    if (!message.trim()) return;
    const newRecord: NegotiationRecord = {
      id: Date.now().toString(),
      role: "driver",
      type: "message",
      content: message,
      createdAt: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    };
    setRecords([...records, newRecord]);
    setMessage("");
  };

  const acceptCurrent = () => {
    apiClient.post("/negotiation/accept", { cargoId: id, driverId: "driver_001" });
    navigate("/driver/dashboard");
  };

  if (!cargo) return <div className="p-8 text-center text-slate-500">加载中...</div>;

  const lastPrice = [...records].reverse().find((r) => r.type === "price");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">议价中心</h1>
          <p className="text-slate-500 text-sm mt-1">与货主沟通价格和运输细节</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary"
        >
          返回货源大厅
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-800">{cargo.title}</h3>
                  <span className="badge bg-blue-100 text-blue-600">待议价</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs">
                    <MapPin className="w-3 h-3" />
                    {cargo.origin}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-50 text-primary-600 text-xs">
                    <MapPin className="w-3 h-3" />
                    {cargo.destination}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">货主期望价</p>
                <p className="text-2xl font-bold text-primary-600 font-display">¥{cargo.expectedPrice}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100">
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <Weight className="w-4 h-4 mx-auto text-slate-500 mb-1" />
                <p className="text-xs text-slate-700 font-medium">{cargo.weight || "5"}吨</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <Maximize2 className="w-4 h-4 mx-auto text-slate-500 mb-1" />
                <p className="text-xs text-slate-700 font-medium">{cargo.volume || "15"}方</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <Truck className="w-4 h-4 mx-auto text-slate-500 mb-1" />
                <p className="text-xs text-slate-700 font-medium">{cargo.vehicleType || "厢式"}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                <Clock className="w-4 h-4 mx-auto text-slate-500 mb-1" />
                <p className="text-xs text-slate-700 font-medium">约300km</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                  顺
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-sm">上海顺达物流</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    信用分 820 · AA级货主
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-600 text-xs">
                <Shield className="w-3 h-3" />
                已认证
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("negotiate")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "negotiate"
                  ? "bg-primary-500 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-1.5" />
              实时议价
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "history"
                  ? "bg-primary-500 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              <History className="w-4 h-4 inline mr-1.5" />
              报价历史
            </button>
          </div>

          <div className="card p-5 min-h-[400px] flex flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[380px]">
              {records.map((record) => (
                <div
                  key={record.id}
                  className={`flex ${record.role === "driver" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[70%] ${record.role === "driver" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <p className={`text-xs text-slate-400 ${record.role === "driver" ? "text-right" : ""}`}>
                      {record.role === "driver" ? "我" : "货主"} · {record.createdAt}
                    </p>
                    {record.type === "price" ? (
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          record.role === "driver"
                            ? "bg-primary-500 text-white rounded-br-md"
                            : "bg-slate-100 text-slate-800 rounded-bl-md"
                        }`}
                      >
                        <p className={`text-xs ${record.role === "driver" ? "text-white/70" : "text-slate-500"}`}>
                          {record.content}
                        </p>
                        <p className="text-xl font-bold font-display flex items-center gap-1 mt-1">
                          <DollarSign className="w-4 h-4" />
                          ¥{record.price}
                        </p>
                      </div>
                    ) : (
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          record.role === "driver"
                            ? "bg-primary-500 text-white rounded-br-md"
                            : "bg-slate-100 text-slate-800 rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm">{record.content}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {activeTab === "negotiate" && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      placeholder="输入您的报价..."
                      className="input-field pl-10"
                    />
                  </div>
                  <button
                    onClick={submitPrice}
                    className="btn-primary"
                    disabled={!offerPrice}
                  >
                    发送报价
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitMessage()}
                    placeholder="输入消息..."
                    className="input-field flex-1"
                  />
                  <button
                    onClick={submitMessage}
                    className="btn-secondary"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">当前价格参考</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between">
                <span className="text-sm text-slate-600">货主报价</span>
                <span className="font-bold text-slate-800">¥{cargo.expectedPrice}</span>
              </div>
              {lastPrice && (
                <div className="p-3 rounded-xl bg-primary-50 flex items-center justify-between border border-primary-100">
                  <span className="text-sm text-primary-700">
                    {lastPrice.role === "driver" ? "司机报价" : "货主还价"}
                  </span>
                  <span className="font-bold text-primary-600">¥{lastPrice.price}</span>
                </div>
              )}
              <div className="p-3 rounded-xl bg-blue-50 flex items-center justify-between">
                <span className="text-sm text-blue-700 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  平台指导价
                </span>
                <span className="font-bold text-blue-600">¥1,280 - ¥1,450</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-3">
                <Shield className="w-3.5 h-3.5 inline mr-1" />
                议价记录已区块链存证，不可篡改
              </p>
              <button
                onClick={acceptCurrent}
                className="w-full btn-primary justify-center py-3"
              >
                <CheckCircle2 className="w-5 h-5" />
                确认当前价格并接单
              </button>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">温馨提示</h3>
            <div className="space-y-2.5">
              {[
                "议价过程请使用平台内沟通，避免线下交易风险",
                "确认价格后请在30分钟内完成接单，超时自动取消",
                "如有疑问可联系平台客服介入调解",
                "所有议价记录将作为纠纷仲裁依据",
              ].map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-600">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
