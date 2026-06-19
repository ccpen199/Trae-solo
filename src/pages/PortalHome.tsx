import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import {
  Shirt,
  BookOpen,
  Smartphone,
  Leaf,
  ArrowRight,
  Users,
  ClipboardCheck,
  TrendingUp,
  Truck,
  Recycle,
  Heart,
  Calculator,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const categories = [
  {
    key: "clothing",
    icon: Shirt,
    title: "旧衣回收",
    desc: "闲置衣物循环再生，环保从每一件开始",
    gradient: "from-eco-400 to-emerald-500",
    bg: "bg-eco-50",
    highlights: ["按件估价", "上门取件", "公益捐赠通道"],
  },
  {
    key: "books",
    icon: BookOpen,
    title: "图书回收",
    desc: "让闲置书籍漂流到下一位读者手中",
    gradient: "from-teal-400 to-cyan-500",
    bg: "bg-teal-50",
    highlights: ["按品相定级", "正版保障", "乡村图书室捐赠"],
  },
  {
    key: "phones",
    icon: Smartphone,
    title: "手机回收",
    desc: "专业数据清除，旧机焕发新生价值",
    gradient: "from-accent-orange to-amber-500",
    bg: "bg-orange-50",
    highlights: ["品牌型号精准定价", "AI智能质检", "高额回收价"],
  },
];

const features = [
  {
    icon: Calculator,
    title: "智能估价预填",
    desc: "基于品类/品牌/成色多维模型，价格透明可见",
  },
  {
    icon: Truck,
    title: "LBS就近派单",
    desc: "智能匹配附近快递员，最快2小时上门",
  },
  {
    icon: ClipboardCheck,
    title: "标准化质检SOP",
    desc: "AI初筛+人工复核，每一步有据可依",
  },
  {
    icon: ShieldCheck,
    title: "T+0极速分账",
    desc: "质检完成立即打款至微信零钱/银行卡",
  },
];

const processSteps = [
  { step: 1, title: "在线预约", desc: "选择品类，智能估价，预约时间" },
  { step: 2, title: "上门取件", desc: "快递员上门，免费取件" },
  { step: 3, title: "专业质检", desc: "AI+人工，标准化流程" },
  { step: 4, title: "确认打款", desc: "T+0分账，实时到账" },
  { step: 5, title: "流向追溯", desc: "公益/环保，全程可查" },
];

const animatedCache: Record<string, string> = {};

function AnimatedNumber({ value }: { value: string }) {
  const cacheKey = `num-${value}`;
  const [display, setDisplay] = useState(animatedCache[cacheKey] || "0");
  const hasAnimated = useRef(!!animatedCache[cacheKey]);

  useEffect(() => {
    if (hasAnimated.current) {
      setDisplay(value);
      return;
    }
    const target = parseInt(value.replace(/,/g, ""));
    const duration = 1500;
    const start = performance.now();
    let frame: number;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(target * eased).toLocaleString();
      setDisplay(current);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setDisplay(value);
        animatedCache[cacheKey] = value;
        hasAnimated.current = true;
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, cacheKey]);

  return <span>{display}</span>;
}

export default function PortalHome() {
  const navigate = useNavigate();
  const overview = useStore((s) => s.analytics.overview);

  const stats = [
    {
      icon: Recycle,
      label: "累计回收",
      value: Math.round(overview.totalRecycledKg).toLocaleString(),
      unit: "吨",
      color: "text-eco-600",
      bg: "bg-eco-50",
    },
    {
      icon: Users,
      label: "服务用户",
      value: overview.totalUsers.toLocaleString(),
      unit: "人",
      color: "text-accent-blue",
      bg: "bg-blue-50",
    },
    {
      icon: Heart,
      label: "公益捐赠",
      value: Math.round(overview.totalDonation).toLocaleString(),
      unit: "次",
      color: "text-accent-orange",
      bg: "bg-orange-50",
    },
    {
      icon: TrendingUp,
      label: "减少碳排放",
      value: Math.round(overview.totalCarbonSavedKg).toLocaleString(),
      unit: "吨",
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-eco-50/30">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-neutral-200/60">
        <div className="container max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-eco-500 to-eco-600 flex items-center justify-center shadow-card">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-800 leading-tight">绿回收</h1>
              <p className="text-[11px] text-neutral-500 leading-tight">C2B旧物回收履约中台</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#categories" className="text-sm font-medium text-neutral-600 hover:text-eco-600 transition-colors">回收品类</a>
            <a href="#process" className="text-sm font-medium text-neutral-600 hover:text-eco-600 transition-colors">履约流程</a>
            <a href="#features" className="text-sm font-medium text-neutral-600 hover:text-eco-600 transition-colors">平台优势</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/user")}
              className="btn-secondary !px-4 !py-2 text-sm"
            >
              <Users className="w-4 h-4 mr-1.5" />
              用户入口
            </button>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="btn-primary !px-4 !py-2 text-sm"
            >
              <ClipboardCheck className="w-4 h-4 mr-1.5" />
              运营后台
            </button>
          </div>
        </div>
      </header>

      <section className="container max-w-7xl mx-auto px-6 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-eco-100 text-eco-700 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              让每一件旧物，找到下一个价值
            </div>
            <h2 className="text-5xl font-bold leading-[1.1] mb-6">
              <span className="bg-gradient-to-r from-eco-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                专业 · 透明 · 高效
              </span>
              <br />
              <span className="text-neutral-800">的旧物回收履约平台</span>
            </h2>
            <p className="text-lg text-neutral-600 mb-8 leading-relaxed">
              聚焦衣服、图书、手机三大品类，从预约、上门、质检、估价、打款全链路线上化。智能估价预填 · LBS就近派单 · T+0极速分账，赋能循环经济新价值。
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <button
                onClick={() => navigate("/user/estimate")}
                className="btn-primary text-base !px-7"
              >
                <Calculator className="w-5 h-5 mr-2" />
                立即估价预约
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button
                onClick={() => navigate("/user")}
                className="btn-secondary text-base !px-7"
              >
                <Shirt className="w-5 h-5 mr-2" />
                进入用户端
              </button>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex -space-x-3">
                {[
                  "bg-gradient-to-br from-eco-400 to-eco-600",
                  "bg-gradient-to-br from-teal-400 to-teal-600",
                  "bg-gradient-to-br from-amber-400 to-orange-500",
                  "bg-gradient-to-br from-blue-400 to-indigo-500",
                ].map((c, i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-full ${c} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}
                  >
                    {["张", "李", "王", "陈"][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-800">38万+ 用户信赖之选</div>
                <div className="text-xs text-neutral-500">满意度 4.9 · 好评率 99.2%</div>
              </div>
            </div>
          </div>

          <div className="relative animate-slide-up">
            <div className="absolute -top-10 -left-10 w-72 h-72 rounded-full bg-eco-200/40 blur-3xl" />
            <div className="absolute -bottom-10 -right-10 w-72 h-72 rounded-full bg-teal-200/40 blur-3xl" />
            <div className="relative card !p-8">
              <div className="space-y-5">
              {categories.map((cat, idx) => (
                <div
                  key={cat.key}
                  onClick={() => navigate(`/user/estimate?category=${cat.key}`)}
                  className={`group relative overflow-hidden rounded-2xl p-5 ${cat.bg} border border-transparent hover:border-eco-300 hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1`}
                >
                  <div className="flex items-start gap-5">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-card group-hover:scale-110 transition-transform duration-300`}>
                      <cat.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-bold text-neutral-800">{cat.title}</h3>
                        <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-eco-600 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-sm text-neutral-500 mb-3">{cat.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {cat.highlights.map((h) => (
                          <span key={h} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/80 text-xs font-medium text-neutral-600 border border-white">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {idx === 0 && (
                    <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-gradient-to-r from-eco-500 to-eco-600 text-white text-[10px] font-bold shadow">
                      热门
                    </div>
                  )}
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={s.label} className="card !p-6 animate-fade-in hover:!bg-gradient-to-br transition-colors" style={{ animationDelay: `${i * 80}ms` }}>
              <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center mb-4`}>
                <s.icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-neutral-800">
                  <AnimatedNumber value={s.value} />
                </span>
                <span className={`text-sm font-semibold ${s.color}`}>{s.unit}</span>
              </div>
              <div className="text-sm text-neutral-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="categories" className="container max-w-7xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-neutral-800 mb-3">三大回收品类</h3>
          <p className="text-neutral-500">专业回收解决方案，覆盖主流旧物品类</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {categories.map((cat, idx) => (
            <div
              key={cat.key}
              className="group relative overflow-hidden rounded-3xl p-8 border border-neutral-200 bg-white hover:border-eco-300 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 animate-fade-in"
              style={{ animationDelay: `${idx * 120}ms` }}
            >
              <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                <cat.icon className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-neutral-800 mb-3">{cat.title}</h4>
              <p className="text-neutral-500 mb-6 leading-relaxed">{cat.desc}</p>
              <ul className="space-y-3 mb-8">
                {cat.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-3 text-sm text-neutral-600">
                  <div className="w-5 h-5 rounded-full bg-eco-100 flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="w-3 h-3 text-eco-600" />
                    </div>
                    {h}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate(`/user/estimate?category=${cat.key}`)}
                className="w-full btn-primary !py-3 text-sm group-hover:shadow-lg transition-shadow"
              >
                立即估价
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section id="process" className="bg-gradient-to-br from-eco-50 to-teal-50/50 py-20 -mx-6">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h3 className="text-3xl font-bold text-neutral-800 mb-3">全链路履约流程</h3>
            <p className="text-neutral-500">五步闭环，每一步都标准化线上化</p>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-eco-200 via-eco-400 to-teal-300 -translate-y-1/2 mx-16 rounded-full" />
            <div className="grid lg:grid-cols-5 gap-6">
              {processSteps.map((p, idx) => (
                <div key={p.step} className="relative text-center animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="relative z-10 w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-eco-500 to-eco-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                    {p.step}
                  </div>
                  <h4 className="text-lg font-bold text-neutral-800 mb-2">{p.title}</h4>
                  <p className="text-sm text-neutral-500">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
          </div>
      </section>

      <section id="features" className="container max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-neutral-800 mb-3">平台核心能力</h3>
          <p className="text-neutral-500">专业履约中台，为回收保驾护航</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, idx) => (
            <div key={f.title} className="card !p-6 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: `${idx * 80}ms` }}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-eco-50 to-eco-100 flex items-center justify-center mb-5">
                <f.icon className="w-7 h-7 text-eco-600" />
              </div>
              <h4 className="text-lg font-bold text-neutral-800 mb-2">{f.title}</h4>
              <p className="text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container max-w-7xl mx-auto px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-eco-600 via-eco-700 to-teal-600 p-10 lg:p-14">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative grid lg:grid-cols-2 gap-10 items-center">
            <div className="text-white">
              <h3 className="text-4xl font-bold mb-4">立即开启绿色回收之旅</h3>
              <p className="text-eco-100 text-lg leading-relaxed mb-8">
                不管是个人用户处理闲置物品，还是企业开展回收业务合作，绿回收都能为您提供专业的一站式解决方案。
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate("/user/estimate")}
                  className="!bg-white !text-eco-700 hover:!bg-eco-50 inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  免费智能估价
                </button>
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="!bg-white/10 !border !border-white/30 !text-white hover:!bg-white/20 inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-semibold backdrop-blur transition-all duration-300"
                >
                  <ClipboardCheck className="w-5 h-5 mr-2" />
                  进入运营中台
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "最快上门", value: "2小时" },
                { label: "质检时效", value: "24h内" },
                { label: "打款时效", value: "T+0秒" },
                { label: "服务覆盖", value: "300+城" },
              ].map((item) => (
                <div key={item.label} className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/15">
                  <div className="text-3xl font-bold text-white mb-1">{item.value}</div>
                  <div className="text-eco-100 text-sm">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-200 bg-white/50">
        <div className="container max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-eco-500 to-eco-600 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-neutral-800">绿回收 · C2B旧物回收履约中台</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-neutral-500">
              <span>© 2026 绿回收科技</span>
              <span>让闲置循环 · 让价值再生</span>
            </div>
          </div>
          </div>
      </footer>
    </div>
  );
}
