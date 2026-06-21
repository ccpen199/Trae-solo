import { useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Banknote,
  Clock,
  ChevronRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ShieldCheck,
  FileText,
  AlertCircle,
  CheckCircle2,
  Info,
  RefreshCw,
  QrCode,
  Plus,
  BarChart3,
  Zap,
  Calendar,
  ArrowLeft,
  MoreHorizontal,
} from "lucide-react";
import { Tabs, Badge, Toast, Modal } from "antd-mobile";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/appStore";

type TxTab = "all" | "income" | "withdraw" | "prepay";

interface Transaction {
  id: string;
  type: "income" | "withdraw" | "prepay" | "refund" | "fuel" | "etc";
  title: string;
  subtitle: string;
  amount: number;
  time: string;
  date: string;
  status: "success" | "pending" | "failed";
  orderNo?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

const transactions: Transaction[] = [
  {
    id: "TX001",
    type: "income",
    title: "运单收入 · OD20240620001",
    subtitle: "上海→杭州 · 电子产品运输",
    amount: 2800,
    time: "16:42",
    date: "2024-06-21",
    status: "success",
    orderNo: "FY202406200001",
    icon: <ArrowDownLeft size={16} />,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    id: "TX002",
    type: "prepay",
    title: "装车预支放款",
    subtitle: "运单 OD20240621008 · 额度 50%",
    amount: 840,
    time: "14:20",
    date: "2024-06-21",
    status: "success",
    icon: <Zap size={16} />,
    iconBg: "bg-orange-50",
    iconColor: "text-primary-orange",
  },
  {
    id: "TX003",
    type: "withdraw",
    title: "提现到银行卡(尾号6688)",
    subtitle: "招商银行储蓄卡",
    amount: -5000,
    time: "11:08",
    date: "2024-06-21",
    status: "success",
    icon: <ArrowUpRight size={16} />,
    iconBg: "bg-blue-50",
    iconColor: "text-deep-blue",
  },
  {
    id: "TX004",
    type: "fuel",
    title: "加油消费 · 中石化真北路站",
    subtitle: "0#柴油 180L · 优惠 ¥81",
    amount: -1269,
    time: "09:35",
    date: "2024-06-21",
    status: "success",
    icon: <CreditCard size={16} />,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
  },
  {
    id: "TX005",
    type: "income",
    title: "运单收入 · OD20240619003",
    subtitle: "苏州→上海 · 快消品运输",
    amount: 980,
    time: "20:15",
    date: "2024-06-20",
    status: "success",
    orderNo: "FY202406190003",
    icon: <ArrowDownLeft size={16} />,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    id: "TX006",
    type: "prepay",
    title: "预支申请审核中",
    subtitle: "运单 OD20240621015 · 风控模型评分 88分",
    amount: 1425,
    time: "18:30",
    date: "2024-06-20",
    status: "pending",
    icon: <Clock size={16} />,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    id: "TX007",
    type: "etc",
    title: "ETC高速通行费",
    subtitle: "G60沪昆高速 · 上海-杭州段",
    amount: -185,
    time: "15:22",
    date: "2024-06-20",
    status: "success",
    icon: <BarChart3 size={16} />,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    id: "TX008",
    type: "income",
    title: "运单收入 · OD20240618011",
    subtitle: "杭州→宁波 · 外贸集装箱",
    amount: 2480,
    time: "22:00",
    date: "2024-06-19",
    status: "success",
    icon: <ArrowDownLeft size={16} />,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
];

const statusMap: Record<Transaction["status"], { label: string; color: string; bg: string }> = {
  success: { label: "成功", color: "text-emerald-600", bg: "bg-emerald-50" },
  pending: { label: "处理中", color: "text-amber-600", bg: "bg-amber-50" },
  failed: { label: "失败", color: "text-red-500", bg: "bg-red-50" },
};

export default function DriverWallet() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [tab, setTab] = useState<TxTab>("all");
  const [showPrepayModal, setShowPrepayModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const filtered = transactions.filter((t) => {
    if (tab === "all") return true;
    if (tab === "income") return t.type === "income";
    if (tab === "withdraw") return t.type === "withdraw";
    if (tab === "prepay") return t.type === "prepay";
    return true;
  });

  const totalIncome = transactions
    .filter((t) => t.type === "income" || t.type === "prepay")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const handleWithdraw = () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) {
      Toast.show({ icon: "fail", content: "请输入提现金额" });
      return;
    }
    if (amt > 28650.42) {
      Toast.show({ icon: "fail", content: "提现金额超出余额" });
      return;
    }
    setShowWithdrawModal(false);
    Toast.show({
      icon: "success",
      content: `提现 ¥${amt.toFixed(2)} 申请已提交，预计 T+1 到账`,
    });
    setWithdrawAmount("");
  };

  return (
    <div className="pb-4">
      <div className="relative px-4 pt-3 pb-28">
        <div className="absolute inset-0 bg-gradient-to-b from-deep-blue-900 via-deep-blue-800 to-blue-600" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(255,107,26,0.3) 0%, transparent 40%), radial-gradient(circle at 80% 0%, rgba(59,130,246,0.2) 0%, transparent 50%)`,
        }} />

        <div className="relative flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/driver/home")}
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur border border-white/15 flex items-center justify-center text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-white font-bold text-lg">我的钱包</h2>
          <button className="w-9 h-9 rounded-full bg-white/10 backdrop-blur border border-white/15 flex items-center justify-center text-white">
            <MoreHorizontal size={18} />
          </button>
        </div>

        <div className="relative">
          <div className="text-white/60 text-xs mb-1.5 flex items-center gap-1">
            <Wallet size={12} />
            账户可用余额(元)
          </div>
          <div className="flex items-end gap-2 mb-5">
            <span className="text-5xl font-bold text-white tracking-tight">
              28,650
            </span>
            <span className="text-2xl font-bold text-white/80 mb-1">.42</span>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-5">
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white/10 backdrop-blur hover:bg-white/15 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center">
                <Banknote size={20} className="text-amber-200" />
              </div>
              <span className="text-xs font-semibold text-white">提现</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white/10 backdrop-blur hover:bg-white/15 transition-colors">
              <div className="w-10 h-10 rounded-full bg-emerald-400/20 flex items-center justify-center">
                <TrendingUp size={20} className="text-emerald-300" />
              </div>
              <span className="text-xs font-semibold text-white">充值</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white/10 backdrop-blur hover:bg-white/15 transition-colors">
              <div className="w-10 h-10 rounded-full bg-blue-400/20 flex items-center justify-center">
                <QrCode size={20} className="text-blue-300" />
              </div>
              <span className="text-xs font-semibold text-white">收款码</span>
            </button>
            <button
              onClick={() => navigate("/driver/profile")}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white/10 backdrop-blur hover:bg-white/15 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-purple-400/20 flex items-center justify-center">
                <CreditCard size={20} className="text-purple-300" />
              </div>
              <span className="text-xs font-semibold text-white">银行卡</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/8 backdrop-blur border border-white/10 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={12} className="text-emerald-300" />
                <span className="text-xs text-white/60">本月收入</span>
              </div>
              <div className="text-2xl font-bold text-white">¥38,560</div>
              <div className="text-[10px] text-emerald-300 mt-0.5 flex items-center gap-0.5">
                <TrendingUp size={10} />
                较上月 +18.5%
              </div>
            </div>
            <div className="rounded-2xl bg-white/8 backdrop-blur border border-white/10 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown size={12} className="text-red-300" />
                <span className="text-xs text-white/60">本月支出</span>
              </div>
              <div className="text-2xl font-bold text-white">¥9,910</div>
              <div className="text-[10px] text-white/50 mt-0.5 flex items-center gap-0.5">
                油费 + ETC + 其他
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative px-4 -mt-16">
        <div className="rounded-2xl bg-white p-4 shadow-xl border border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                <Zap size={22} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-deep-blue-900 flex items-center gap-1">
                  装车预支额度
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-orange-50 text-primary-orange text-[10px] font-bold">
                    T+0 到账
                  </span>
                </div>
                <div className="text-[11px] text-gray-400">
                  基于信用评分 · 最高 50% 运费预付
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowPrepayModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary-orange to-orange-500 text-white text-xs font-bold shadow-md flex items-center gap-1"
            >
              <Plus size={12} />
              申请预支
            </button>
          </div>

          <div className="mb-2 flex items-end justify-between">
            <div>
              <span className="text-2xl font-bold text-deep-blue-900">¥35,000</span>
              <span className="text-xs text-gray-400 ml-1">/ 50,000 可用</span>
            </div>
            <div className="text-xs text-gray-500">
              已使用 <span className="font-bold text-primary-orange">30%</span>
            </div>
          </div>

          <div className="relative h-3 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary-orange via-orange-400 to-amber-400 shadow-sm"
              style={{ width: "30%" }}
            />
            <div
              className="absolute inset-y-0 w-px bg-white/50"
              style={{ left: "30%" }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-50">
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-600">12</div>
              <div className="text-[10px] text-gray-400">累计成功</div>
            </div>
            <div className="text-center border-x border-gray-50">
              <div className="text-lg font-bold text-primary-orange">88</div>
              <div className="text-[10px] text-gray-400">风控评分</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-deep-blue-700">0</div>
              <div className="text-[10px] text-gray-400">当前逾期</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: <FileText size={20} />, label: "对账单", color: "bg-blue-50 text-deep-blue" },
            { icon: <Calendar size={20} />, label: "结算周期", color: "bg-purple-50 text-purple-600" },
            { icon: <BarChart3 size={20} />, label: "收入分析", color: "bg-emerald-50 text-emerald-600" },
            { icon: <ShieldCheck size={20} />, label: "资金安全", color: "bg-amber-50 text-amber-600" },
          ].map((item) => (
            <button
              key={item.label}
              className="rounded-2xl bg-white p-3 shadow-sm border border-gray-100 flex flex-col items-center gap-1.5 hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                {item.icon}
              </div>
              <span className="text-[11px] font-medium text-gray-600">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-deep-blue-900 text-base">收支明细</h3>
          <button className="flex items-center gap-0.5 text-xs text-gray-500">
            导出账单
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <Tabs
            activeKey={tab}
            onChange={(k) => setTab(k as TxTab)}
            style={{
              "--tab-line-color": "#FF6B1A",
              "--active-title-color": "#FF6B1A",
              "--title-font-size": "13px",
            } as React.CSSProperties}
          >
            <Tabs.Tab title="全部" key="all" />
            <Tabs.Tab title="收入" key="income" />
            <Tabs.Tab title="提现" key="withdraw" />
            <Tabs.Tab title="预支" key="prepay" />
          </Tabs>

          <div className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-50 mb-3">
                  <Info size={24} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">暂无相关记录</p>
              </div>
            ) : (
              filtered.map((tx) => {
                const s = statusMap[tx.status];
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.iconBg} ${tx.iconColor}`}>
                      {tx.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm font-semibold text-deep-blue-900 truncate">
                          {tx.title}
                        </span>
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-px rounded text-[10px] ${s.bg} ${s.color}`}>
                          {tx.status === "pending" ? <Clock size={9} /> : tx.status === "success" ? <CheckCircle2 size={9} /> : <AlertCircle size={9} />}
                          {s.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 truncate">
                        {tx.subtitle} · {tx.date} {tx.time}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-base font-bold ${tx.amount > 0 ? "text-emerald-600" : "text-deep-blue-900"}`}>
                        {tx.amount > 0 ? "+" : ""}
                        ¥{Math.abs(tx.amount).toLocaleString()}
                      </div>
                      {tx.orderNo && (
                        <div className="text-[10px] text-gray-300 mt-0.5">{tx.orderNo}</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <Modal
        visible={showPrepayModal}
        onClose={() => setShowPrepayModal(false)}
        content={
          <div className="py-2">
            <div className="text-center mb-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg mb-3">
                <Zap size={26} className="text-white" />
              </div>
              <div className="text-lg font-bold text-deep-blue-900">申请装车预支</div>
              <div className="text-xs text-gray-400 mt-1">基于运单运费 · 最高 50% · T+0 到账</div>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="text-xs text-gray-500 mb-1">可申请额度</div>
                <div className="text-2xl font-bold text-primary-orange">¥35,000</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-500 leading-relaxed">
                <div className="flex items-start gap-1.5">
                  <Info size={14} className="text-deep-blue shrink-0 mt-0.5" />
                  <span>请在运单详情页针对具体运单发起预支申请，系统将根据风控模型自动核定额度并放款至您的钱包账户。</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPrepayModal(false);
                  navigate("/driver/orders/list");
                  Toast.show({ icon: "success", content: "请选择运单后申请预支" });
                }}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-primary-orange to-orange-500 text-white font-bold text-sm shadow-lg"
              >
                前往运单中心申请
              </button>
            </div>
          </div>
        }
      />

      <Modal
        visible={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        content={
          <div className="py-2">
            <div className="text-center mb-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-deep-blue to-blue-600 flex items-center justify-center shadow-lg mb-3">
                <Banknote size={26} className="text-white" />
              </div>
              <div className="text-lg font-bold text-deep-blue-900">提现到银行卡</div>
              <div className="text-xs text-gray-400 mt-1">招商银行储蓄卡(尾号 6688)</div>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="text-xs text-gray-500 mb-1">可用余额</div>
                <div className="text-2xl font-bold text-deep-blue-900">¥28,650.42</div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">提现金额(元)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="请输入金额"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-primary-orange outline-none text-lg font-bold"
                />
                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={() => setWithdrawAmount("1000")}
                    className="px-3 py-1 rounded-lg bg-gray-50 text-xs text-gray-500"
                  >
                    ¥1,000
                  </button>
                  <button
                    onClick={() => setWithdrawAmount("5000")}
                    className="px-3 py-1 rounded-lg bg-gray-50 text-xs text-gray-500"
                  >
                    ¥5,000
                  </button>
                  <button
                    onClick={() => setWithdrawAmount("10000")}
                    className="px-3 py-1 rounded-lg bg-gray-50 text-xs text-gray-500"
                  >
                    ¥10,000
                  </button>
                  <button
                    onClick={() => setWithdrawAmount("28650.42")}
                    className="px-3 py-1 rounded-lg bg-orange-50 text-xs text-primary-orange font-medium"
                  >
                    全部提现
                  </button>
                </div>
              </div>
              <div className="text-[11px] text-gray-400 flex items-center gap-1">
                <Info size={12} />
                预计 T+1 工作日到账，平台不收取手续费
              </div>
              <button
                onClick={handleWithdraw}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-deep-blue to-blue-600 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-1"
              >
                <RefreshCw size={14} />
                确认提现
              </button>
            </div>
          </div>
        }
      />
    </div>
  );
}
