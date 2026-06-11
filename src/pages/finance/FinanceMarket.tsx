import { useState, useEffect } from "react";
import {
  Wallet,
  ShieldCheck,
  ArrowRightLeft,
  Search,
  Filter,
  Star,
  TrendingUp,
  ShieldAlert,
  Clock,
  Info,
  CheckCircle2,
  X,
  FileText,
  Signature,
  Shield,
  Banknote,
  Calculator,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  FileCheck,
  ChevronRight,
} from "lucide-react";
import { useApi } from "@/utils/api";
import { formatMoney } from "@/utils/format";
import { useNavigate } from "react-router-dom";

interface FinanceProduct {
  id: string;
  name: string;
  type: "wealth" | "insurance" | "loan";
  riskLevel: "R1" | "R2" | "R3" | "R4" | "R5";
  annualRate: string;
  term: string;
  minAmount: number;
  maxAmount: number;
  description: string;
  tags: string[];
}

const TYPES = [
  { k: "wealth", l: "理财", icon: Wallet, color: "text-brand-500 bg-brand-50" },
  { k: "insurance", l: "保险", icon: ShieldCheck, color: "text-emerald-500 bg-emerald-50" },
  { k: "loan", l: "贷款", icon: ArrowRightLeft, color: "text-gold-500 bg-gold-50" },
];

const RISK_COLOR: Record<string, string> = {
  R1: "tag-success",
  R2: "tag-info",
  R3: "tag-gold",
  R4: "tag-warning",
  R5: "tag-danger",
};

const RISK_LABEL: Record<string, string> = {
  R1: "R1 保守型",
  R2: "R2 稳健型",
  R3: "R3 平衡型",
  R4: "R4 进取型",
  R5: "R5 激进型",
};

export default function FinanceMarket() {
  const navigate = useNavigate();
  const [type, setType] = useState<string>("wealth");
  const [risk, setRisk] = useState<string>("all");
  const [keyword, setKeyword] = useState("");
  const { data: products } = useApi<FinanceProduct[]>(
    `/api/finance/products?type=${type}`,
  );

  const [buyModal, setBuyModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FinanceProduct | null>(null);
  const [buyStep, setBuyStep] = useState(1);
  const [amount, setAmount] = useState<number>(0);
  const [agreed, setAgreed] = useState(false);
  const [signed, setSigned] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [progress, setProgress] = useState(90);
  const [orderNo, setOrderNo] = useState("");

  useEffect(() => {
    if (selectedProduct && amount === 0) {
      setAmount(selectedProduct.minAmount);
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (buyStep === 3 && buyModal) {
      setProgress(90);
      const timer = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(timer);
            return 100;
          }
          return p + 2;
        });
      }, 80);
      return () => clearInterval(timer);
    }
  }, [buyStep, buyModal]);

  const calcDays = (term: string) => {
    const m = term.match(/(\d+)/);
    const n = m ? parseInt(m[1]) : 90;
    if (term.includes("年")) return n * 365;
    if (term.includes("月")) return n * 30;
    return n;
  };

  const expectedReturn = selectedProduct
    ? (amount * parseFloat(selectedProduct.annualRate) / 100 * calcDays(selectedProduct.term) / 365)
    : 0;

  const fee = amount * 0.001;
  const actualTransfer = amount - fee;

  const filtered = (products || []).filter((p) => {
    if (risk !== "all" && p.riskLevel !== risk) return false;
    if (keyword && !p.name.includes(keyword)) return false;
    return true;
  });

  const genOrderNo = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `FI${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${Math.floor(Math.random() * 9000 + 1000)}`;
  };

  const handleCompleteTransfer = () => {
    setTransferring(true);
    setTimeout(() => {
      setTransferring(false);
      setOrderNo(genOrderNo());
      setBuyStep(4);
    }, 2000);
  };

  const closeModal = () => {
    setBuyModal(false);
    setSelectedProduct(null);
    setBuyStep(1);
    setAmount(0);
    setAgreed(false);
    setSigned(false);
    setTransferring(false);
    setProgress(90);
    setOrderNo("");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TYPES.map((t) => {
          const Icon = t.icon;
          const active = type === t.k;
          return (
            <div
              key={t.k}
              onClick={() => setType(t.k)}
              className={`card card-hover cursor-pointer border-2 transition ${
                active ? "border-brand-400" : "border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${t.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-brand-700">{t.l}产品</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {t.k === "wealth" && "稳健增值，多元选择"}
                    {t.k === "insurance" && "全面保障，安心守护"}
                    {t.k === "loan" && "快速审批，利率优惠"}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500">风险等级：</span>
            <div className="flex flex-wrap gap-1">
              {["all", "R1", "R2", "R3", "R4", "R5"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRisk(r)}
                  className={`px-3 py-1 text-xs rounded-full transition ${
                    risk === r
                      ? "bg-brand-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {r === "all" ? "全部" : r}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索产品名称"
              className="input pl-9 w-60"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((p) => (
          <div key={p.id} className="card card-hover flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-brand-700">{p.name}</h4>
                  <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
              </div>
              <span className={`${RISK_COLOR[p.riskLevel]} shrink-0`}>{RISK_LABEL[p.riskLevel]}</span>
            </div>

            <div className="flex items-end gap-6 py-4 border-y border-slate-100 my-3">
              <div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  {p.type === "loan" ? "年化利率" : "预期年化"}
                  <Info className="w-3 h-3" />
                </div>
                <div className="text-3xl font-bold text-rose-600">{p.annualRate}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 期限
                </div>
                <div className="text-lg font-semibold text-brand-700">{p.term}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> 起投
                </div>
                <div className="text-lg font-semibold text-slate-700">{formatMoney(p.minAmount)}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {p.tags.map((t) => (
                <span key={t} className="text-[11px] px-2 py-0.5 rounded bg-brand-50 text-brand-600">
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-auto flex gap-2">
              {p.type === "loan" ? (
                <button
                  onClick={() => navigate("/finance/calculator")}
                  className="flex-1 btn-secondary text-sm"
                >
                  额度试算
                </button>
              ) : (
                <button
                  onClick={() => navigate("/finance/risk-assessment")}
                  className="flex-1 btn-secondary text-sm"
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> 风险测评
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedProduct(p);
                  setBuyModal(true);
                }}
                className="flex-1 btn-primary text-sm"
              >
                立即购买
              </button>
            </div>
          </div>
        ))}
      </div>

      {buyModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            {buyStep < 4 && (
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3].map((s) => (
                      <div key={s} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          s < buyStep ? "bg-emerald-500 text-white" :
                          s === buyStep ? "bg-brand-500 text-white" :
                          "bg-slate-100 text-slate-400"
                        }`}>
                          {s < buyStep ? <CheckCircle2 className="w-4 h-4" /> : s}
                        </div>
                        {s < 3 && <div className={`w-8 h-0.5 ${s < buyStep ? "bg-emerald-400" : "bg-slate-200"}`} />}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-slate-500 ml-2">
                    {buyStep === 1 && "金额试算"}
                    {buyStep === 2 && "合同签署"}
                    {buyStep === 3 && "资金监管"}
                  </span>
                </div>
                <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {buyStep === 1 && (
              <div className="p-5 space-y-5">
                <div className="p-4 rounded-xl bg-gradient-to-br from-brand-50 to-gold-50 border border-brand-100/60">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-brand-700">{selectedProduct.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{selectedProduct.description}</p>
                    </div>
                    <span className={RISK_COLOR[selectedProduct.riskLevel]}>{RISK_LABEL[selectedProduct.riskLevel]}</span>
                  </div>
                  <div className="flex items-end gap-6 mt-4">
                    <div>
                      <div className="text-xs text-slate-500">预期年化</div>
                      <div className="text-2xl font-bold text-rose-600">{selectedProduct.annualRate}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">期限</div>
                      <div className="text-lg font-semibold text-brand-700">{selectedProduct.term}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">起投</div>
                      <div className="text-lg font-semibold text-slate-700">{formatMoney(selectedProduct.minAmount)}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-brand-500" /> 购买金额
                  </label>
                  <div className="relative mt-2">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        const v = Math.max(
                          selectedProduct.minAmount,
                          Math.min(selectedProduct.maxAmount, parseInt(e.target.value) || 0)
                        );
                        setAmount(v);
                      }}
                      className="input pl-9 w-full text-xl font-bold text-brand-700"
                    />
                  </div>
                  <input
                    type="range"
                    min={selectedProduct.minAmount}
                    max={selectedProduct.maxAmount}
                    step={1000}
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value))}
                    className="w-full mt-4 accent-brand-500"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{formatMoney(selectedProduct.minAmount)}</span>
                    <span>{formatMoney(selectedProduct.maxAmount)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-rose-500" /> 到期预期收益
                    </span>
                    <span className="text-2xl font-bold text-rose-600">¥{formatMoney(expectedReturn)}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    = {formatMoney(amount)} × {selectedProduct.annualRate} × {calcDays(selectedProduct.term)}/365
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50 border border-sky-100">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-500" /> 已完成风险测评等级
                  </span>
                  <span className="tag-info">R2 稳健型</span>
                </div>

                <button
                  onClick={() => setBuyStep(2)}
                  disabled={amount < selectedProduct.minAmount}
                  className="w-full btn-primary"
                >
                  下一步：签署合同 <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {buyStep === 2 && (
              <div className="p-5 space-y-5">
                <div>
                  <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-brand-500" /> 待签署文件
                  </h5>
                  <div className="space-y-2">
                    {[
                      { n: "《产品认购协议》", d: "约定产品认购条款与双方权利义务" },
                      { n: "《风险揭示书》", d: "揭示产品投资风险与注意事项" },
                      { n: "《资金监管协议》", d: "约定资金存管与监管机制" },
                    ].map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div>
                          <div className="text-sm font-semibold text-slate-700">{doc.n}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{doc.d}</div>
                        </div>
                        <button className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-0.5">
                          查看 <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                    <Signature className="w-4 h-4 text-brand-500" /> 电子签名
                  </h5>
                  <div className="relative">
                    <div className="h-32 rounded-xl border-2 border-dashed border-slate-200 bg-white flex items-center justify-center">
                      {signed ? (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            张 明
                          </div>
                          <div className="text-xs text-slate-500 mt-1 font-mono">2026.06.11</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">点击下方按钮生成签名</span>
                      )}
                    </div>
                    {!signed && (
                      <button
                        onClick={() => setSigned(true)}
                        className="mt-2 w-full py-2 rounded-xl border-2 border-brand-200 text-brand-600 hover:bg-brand-50 text-sm font-semibold"
                      >
                        <Signature className="w-4 h-4 inline mr-1.5" /> 点击生成电子签名
                      </button>
                    )}
                  </div>
                </div>

                <label className="flex items-start gap-2 cursor-pointer p-3 rounded-xl bg-slate-50">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-brand-500"
                  />
                  <span className="text-sm text-slate-600">
                    我已阅读并同意以上全部协议内容，确认产品风险等级匹配本人风险承受能力
                  </span>
                </label>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setBuyStep(1)} className="flex-1 btn-secondary">
                    <ArrowLeft className="w-4 h-4" /> 上一步
                  </button>
                  <button
                    onClick={() => setBuyStep(3)}
                    disabled={!agreed || !signed}
                    className={`flex-1 btn-primary ${(!agreed || !signed) ? "opacity-50 cursor-not-allowed bg-slate-300 border-slate-300 hover:bg-slate-300" : ""}`}
                  >
                    确认签署并划转
                  </button>
                </div>
              </div>
            )}

            {buyStep === 3 && (
              <div className="p-5 space-y-5">
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-sky-50 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-emerald-700">光大银行 资金监管</div>
                      <div className="text-xs text-slate-500">银行级监管，保障资金安全</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">监管账户名</span>
                      <span className="text-slate-700 font-medium">XX资管计划监管专户</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">监管机构</span>
                      <span className="text-slate-700 font-medium">中国光大银行上海分行</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">监管流水号</span>
                      <span className="text-slate-700 font-mono font-medium">GD{Date.now().toString().slice(-12)}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500">划转进度</span>
                      <span className="text-emerald-600 font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-300 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
                  <h5 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                    <Banknote className="w-4 h-4 text-brand-500" /> 资金去向明细
                  </h5>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">购买金额</span>
                    <span className="text-slate-700 font-semibold">¥{formatMoney(amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">手续费 (0.1%)</span>
                    <span className="text-slate-700 font-semibold">-¥{formatMoney(fee)}</span>
                  </div>
                  <div className="border-t border-slate-200 my-1" />
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-slate-700">实际划转金额</span>
                    <span className="text-lg font-bold text-brand-700">¥{formatMoney(actualTransfer)}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setBuyStep(2)} className="flex-1 btn-secondary">
                    <ArrowLeft className="w-4 h-4" /> 上一步
                  </button>
                  <button
                    onClick={handleCompleteTransfer}
                    disabled={transferring || progress < 100}
                    className={`flex-1 btn-primary ${(transferring || progress < 100) ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    {transferring ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> 划转中...
                      </span>
                    ) : "完成划转"}
                  </button>
                </div>
              </div>
            )}

            {buyStep === 4 && (
              <div className="p-6 text-center space-y-5">
                <button onClick={closeModal} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
                <div className="relative">
                  <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                  </div>
                  <Sparkles className="w-5 h-5 text-gold-400 absolute top-0 right-1/3" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-brand-800">购买成功</h3>
                  <p className="text-sm text-slate-500 mt-1">资金已由光大银行完成监管划转</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 text-left space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">订单号</span>
                    <span className="text-slate-700 font-mono font-medium">{orderNo}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">产品名称</span>
                    <span className="text-slate-700 font-semibold">{selectedProduct.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">购买金额</span>
                    <span className="text-slate-700 font-semibold">¥{formatMoney(amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">预期收益</span>
                    <span className="text-rose-600 font-bold">¥{formatMoney(expectedReturn)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">到期日期</span>
                    <span className="text-slate-700 font-semibold">
                      {(() => {
                        const d = new Date();
                        d.setDate(d.getDate() + calcDays(selectedProduct.term));
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                      })()}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 my-1" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" /> 监管状态
                    </span>
                    <span className="tag-success">光大银行存管中</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex gap-2">
                    <button className="flex-1 btn-secondary text-sm">
                      <FileCheck className="w-4 h-4" /> 查看合同
                    </button>
                    <button className="flex-1 btn-secondary text-sm">
                      <Wallet className="w-4 h-4" /> 去资金监管
                    </button>
                  </div>
                  <button onClick={closeModal} className="w-full btn-primary">
                    完成
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
