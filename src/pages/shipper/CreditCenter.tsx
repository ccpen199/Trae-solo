import { useEffect, useState } from "react";
import {
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Award,
  BarChart3,
  History,
} from "lucide-react";
import { apiClient } from "@/api/client";

interface CreditRecord {
  id: string;
  type: string;
  score: number;
  description: string;
  createdAt: string;
}

export default function CreditCenter() {
  const [creditInfo, setCreditInfo] = useState<any>(null);
  const [records, setRecords] = useState<CreditRecord[]>([]);

  useEffect(() => {
    apiClient.get<any>("/risk/credit?shipperId=u_shipper_001").then((data) => {
      setCreditInfo(data);
      setRecords([
        { id: "1", type: "履约完成", score: 5, description: "运单 WB20240115001 准时完成", createdAt: "2024-01-15 14:30" },
        { id: "2", type: "按时发货", score: 3, description: "货物按时交付装货", createdAt: "2024-01-15 08:15" },
        { id: "3", type: "信息真实", score: 10, description: "货源信息与实际货物一致", createdAt: "2024-01-14 16:45" },
        { id: "4", type: "付款及时", score: 8, description: "运单完成后2小时内支付运费", createdAt: "2024-01-13 20:00" },
        { id: "5", type: "违约扣分", score: -15, description: "临时取消已确认订单", createdAt: "2024-01-10 09:20" },
      ]);
    });
  }, []);

  const score = creditInfo?.score || 820;
  const level = score >= 900 ? "AAA" : score >= 800 ? "AA" : score >= 700 ? "A" : score >= 600 ? "B" : "C";
  const levelColors: Record<string, string> = {
    AAA: "from-yellow-400 to-amber-500",
    AA: "from-purple-400 to-indigo-500",
    A: "from-blue-400 to-cyan-500",
    B: "from-green-400 to-emerald-500",
    C: "from-slate-400 to-slate-500",
  };

  const dimensions = [
    { label: "履约记录", value: 95, color: "bg-primary-500" },
    { label: "付款及时性", value: 88, color: "bg-blue-500" },
    { label: "信息真实性", value: 92, color: "bg-green-500" },
    { label: "投诉率", value: 78, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">信用中心</h1>
        <p className="text-slate-500 text-sm mt-1">查看您的信用评分与信用权益</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className={`card p-6 lg:col-span-2 bg-gradient-to-br ${levelColors[level]} text-white border-0 relative overflow-hidden`}>
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute right-20 -bottom-16 w-56 h-56 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-sm">货主信用等级</p>
                <div className="flex items-baseline gap-3 mt-2">
                  <span className="text-6xl font-bold font-display">{score}</span>
                  <div className={`px-3 py-1 rounded-lg bg-white/20 backdrop-blur-sm`}>
                    <span className="text-2xl font-bold">{level}</span>
                    <span className="text-xs ml-1 opacity-80">级</span>
                  </div>
                </div>
                <p className="text-white/70 mt-2">全国排名前 12% 的优质货主</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Award className="w-8 h-8" />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <p className="text-2xl font-bold">128</p>
                <p className="text-white/70 text-sm">累计发货</p>
              </div>
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <p className="text-2xl font-bold">98.5%</p>
                <p className="text-white/70 text-sm">履约率</p>
              </div>
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <p className="text-2xl font-bold">1.2h</p>
                <p className="text-white/70 text-sm">平均付款</p>
              </div>
              <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <p className="text-2xl font-bold">3次</p>
                <p className="text-white/70 text-sm">投诉记录</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">信用权益</h3>
            <Shield className="w-5 h-5 text-primary-500" />
          </div>
          <div className="space-y-3">
            {[
              { label: "优先匹配金牌司机", desc: "履约分>98%司机优先推荐", enabled: true },
              { label: "运费垫付服务", desc: "最高¥50,000运费垫付额度", enabled: true },
              { label: "专属客服", desc: "7x24小时一对一服务", enabled: true },
              { label: "保险费率优惠", desc: "货物保险8.5折优惠", enabled: score >= 800 },
              { label: "账期服务", desc: "月结30天付款账期", enabled: score >= 900 },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.enabled ? "bg-green-100" : "bg-slate-100"}`}>
                  {item.enabled ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className={`font-medium text-sm ${item.enabled ? "text-slate-800" : "text-slate-400"}`}>{item.label}</p>
                  <p className={`text-xs mt-0.5 ${item.enabled ? "text-slate-500" : "text-slate-300"}`}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-slate-800">信用维度分析</h3>
            <BarChart3 className="w-5 h-5 text-primary-500" />
          </div>
          <div className="space-y-4">
            {dimensions.map((dim, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">{dim.label}</span>
                  <span className="text-sm font-bold text-slate-800">{dim.value}分</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full ${dim.color} rounded-full transition-all duration-1000`}
                    style={{ width: `${dim.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-slate-800">信用变动记录</h3>
            <History className="w-5 h-5 text-primary-500" />
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto">
            {records.map((record) => (
              <div key={record.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${record.score > 0 ? "bg-green-100" : "bg-red-100"}`}>
                  {record.score > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-slate-800">{record.type}</p>
                    <span className={`text-sm font-bold ${record.score > 0 ? "text-green-600" : "text-red-600"}`}>
                      {record.score > 0 ? "+" : ""}{record.score}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{record.description}</p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {record.createdAt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
