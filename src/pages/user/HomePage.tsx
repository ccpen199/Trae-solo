import { motion } from "framer-motion";
import {
  Heart,
  Briefcase,
  Landmark,
  Car,
  FileText,
  HelpCircle,
  ArrowRight,
  MessageSquare,
  Users,
  Star,
  Clock,
  ChevronRight,
  Scale,
  Shield,
  Archive,
  Sparkles,
  BarChart3,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAdminStore } from "@/stores/admin.store";
import { cn } from "@/lib/utils";

const categories = [
  {
    icon: Heart,
    name: "婚姻家庭",
    desc: "离婚、财产分割、子女抚养等家事纠纷",
    color: "from-rose-50 to-pink-50",
    iconColor: "text-rose-500",
  },
  {
    icon: Briefcase,
    name: "劳动纠纷",
    desc: "劳动合同、工资社保、工伤赔偿等争议",
    color: "from-amber-50 to-orange-50",
    iconColor: "text-amber-600",
  },
  {
    icon: Landmark,
    name: "债务债权",
    desc: "借贷纠纷、追讨欠款、担保责任等问题",
    color: "from-emerald-50 to-teal-50",
    iconColor: "text-emerald-600",
  },
  {
    icon: Car,
    name: "交通事故",
    desc: "责任认定、保险理赔、伤残赔偿等事项",
    color: "from-sky-50 to-blue-50",
    iconColor: "text-sky-600",
  },
  {
    icon: FileText,
    name: "合同纠纷",
    desc: "合同违约、解除终止、损害赔偿等案件",
    color: "from-violet-50 to-purple-50",
    iconColor: "text-violet-600",
  },
  {
    icon: HelpCircle,
    name: "其他",
    desc: "刑事辩护、行政诉讼、知识产权等",
    color: "from-slate-50 to-gray-50",
    iconColor: "text-slate-600",
  },
];

const processSteps = [
  {
    icon: MessageSquare,
    title: "提交咨询",
    desc: "详细描述您的法律问题",
  },
  {
    icon: Sparkles,
    title: "智能分派",
    desc: "AI匹配最适合的专业律师",
  },
  {
    icon: Shield,
    title: "加密咨询",
    desc: "端到端加密保护您的隐私",
  },
  {
    icon: Archive,
    title: "结案归档",
    desc: "服务完成后永久保存记录",
  },
];



const lawyers = [
  {
    name: "张明远",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    specialty: "婚姻家庭、遗产继承",
    rating: 4.9,
    years: 12,
    cases: 856,
  },
  {
    name: "李淑芬",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face",
    specialty: "劳动纠纷、合同争议",
    rating: 4.8,
    years: 8,
    cases: 523,
  },
  {
    name: "王建国",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    specialty: "交通事故、人身损害",
    rating: 4.9,
    years: 15,
    cases: 1024,
  },
  {
    name: "陈雨晴",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face",
    specialty: "债务债权、公司法务",
    rating: 4.7,
    years: 6,
    cases: 342,
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

function getSaturationColor(saturation: number) {
  if (saturation >= 85) return { bg: "bg-red-500/20", text: "text-red-400", icon: AlertTriangle };
  if (saturation >= 60) return { bg: "bg-accent-gold/20", text: "text-accent-gold", icon: Activity };
  return { bg: "bg-emerald-500/20", text: "text-emerald-400", icon: Activity };
}

function getSaturationStatus(saturation: number) {
  if (saturation >= 85) return "过载";
  if (saturation >= 60) return "饱和";
  return "正常";
}

export default function HomePage() {
  const navigate = useNavigate();
  const { monitorStats, fetchMonitorStats } = useAdminStore();

  useEffect(() => {
    fetchMonitorStats();
  }, [fetchMonitorStats]);

  const baseStats = [
    {
      icon: MessageSquare,
      value: "12,847+",
      label: "累计咨询",
      isRegulatory: false,
    },
    {
      icon: Users,
      value: "326+",
      label: "服务律师",
      isRegulatory: false,
    },
    {
      icon: Star,
      value: "98.6%",
      label: "满意度",
      isRegulatory: false,
    },
    {
      icon: Clock,
      value: "15分钟",
      label: "平均响应",
      isRegulatory: false,
    },
    {
      icon: BarChart3,
      value: `${monitorStats?.consultationsPerLawyer ?? 8.2} 条/律师`,
      label: "人均咨询量",
      isRegulatory: true,
    },
    {
      icon: Activity,
      value: `${monitorStats?.serviceSaturation ?? 72}%`,
      label: "服务饱和度",
      isRegulatory: true,
      saturation: monitorStats?.serviceSaturation ?? 72,
    },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative min-h-screen overflow-hidden bg-hero-gradient">
        <div className="absolute inset-0 pattern-grid opacity-30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-teal/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <motion.line
            x1="0" y1="120" x2="100%" y2="120"
            stroke="#c9a962" strokeWidth="1" strokeDasharray="8 8" opacity="0.3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.3 }}
          />
          <motion.line
            x1="0" y1="140" x2="100%" y2="140"
            stroke="#c9a962" strokeWidth="1" strokeDasharray="4 4" opacity="0.15"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.5, delay: 0.5 }}
          />
        </svg>

        <div className="relative z-10 container mx-auto px-4 pt-20 pb-32 min-h-screen flex items-center">
          <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Scale className="w-4 h-4 text-accent-gold" />
                <span className="text-sm text-white/80">公益法律服务 · 全免费咨询</span>
              </motion.div>

              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                让法律的阳光
                <br />
                <span className="text-gradient-gold">照亮每一个人</span>
              </h1>

              <p className="text-lg text-white/70 mb-10 max-w-lg">
                专业公益律师，为您免费答疑解惑。300+资深律师在线，全程加密保护您的隐私。
              </p>

              <motion.div
                className="flex flex-wrap gap-4"
                variants={stagger}
                initial="initial"
                animate="animate"
              >
                <motion.button
                  variants={fadeInUp}
                  className="btn-gold px-8 py-3.5 text-base"
                  onClick={() => navigate("/submit")}
                >
                  立即咨询
                  <ArrowRight className="w-5 h-5 ml-2" />
                </motion.button>
                <motion.button
                  variants={fadeInUp}
                  className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-8 py-3.5 text-base font-medium text-white transition-all duration-200 hover:bg-white/20 hover:-translate-y-0.5 backdrop-blur-sm"
                >
                  了解更多
                </motion.button>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative hidden lg:block"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <motion.div
                className="glass rounded-2xl p-6 shadow-xl animate-float"
                style={{ animationDelay: "0s" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-accent-gold/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-accent-gold" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">累计咨询</p>
                    <p className="text-white/60 text-xs">截至今日</p>
                  </div>
                </div>
                <p className="text-4xl font-serif font-bold text-white">
                  12,847<span className="text-accent-gold">+</span>
                </p>
              </motion.div>

              <motion.div
                className="glass rounded-2xl p-6 shadow-xl absolute top-32 right-4 w-56 animate-float"
                style={{ animationDelay: "1.5s" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-accent-teal/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent-teal" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">公益律师</p>
                    <p className="text-white/60 text-xs">持证执业</p>
                  </div>
                </div>
                <p className="text-4xl font-serif font-bold text-white">
                  326<span className="text-accent-teal">+</span>
                </p>
              </motion.div>

              <motion.div
                className="glass rounded-2xl p-6 shadow-xl absolute bottom-0 left-8 w-56 animate-float"
                style={{ animationDelay: "3s" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Star className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">用户满意度</p>
                    <p className="text-white/60 text-xs">真实评价</p>
                  </div>
                </div>
                <p className="text-4xl font-serif font-bold text-white">
                  98.6<span className="text-green-400">%</span>
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/60"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-sm">向下滚动</span>
          <ChevronRight className="w-5 h-5 rotate-90" />
        </motion.div>
      </section>

      <section className="py-20 bg-neutral-warm">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="section-title">常见案由分类</h2>
            <p className="section-subtitle">选择您遇到的法律问题类型，获取专业解答</p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <motion.div
                  key={cat.name}
                  variants={fadeInUp}
                  className="card card-hover p-6 group cursor-pointer relative overflow-hidden"
                  whileHover={{ y: -4 }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative z-10">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-7 h-7 ${cat.iconColor}`} />
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-primary-800 mb-2">{cat.name}</h3>
                    <p className="text-sm text-primary-500">{cat.desc}</p>
                    <div className="mt-4 flex items-center text-accent-gold text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      立即咨询 <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 pattern-grid opacity-50" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="section-title">服务流程</h2>
            <p className="section-subtitle">四步完成专业法律咨询，简单高效</p>
          </motion.div>

          <motion.div
            className="relative"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            <div className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-0.5 bg-primary-100" />
            <div className="hidden md:block absolute top-7 left-[12.5%] h-0.5 bg-gradient-to-r from-accent-gold to-accent-teal"
              style={{ width: "75%" }}
            />

            <div className="grid md:grid-cols-4 gap-8">
              {processSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    variants={fadeInUp}
                    className="relative text-center"
                  >
                    <div className="relative z-10 w-14 h-14 mx-auto rounded-full bg-gold-gradient flex items-center justify-center shadow-gold mb-6">
                      <Icon className="w-6 h-6 text-primary-900" />
                      <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary-700 text-white text-xs font-medium flex items-center justify-center border-2 border-white">
                        {index + 1}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-primary-800 mb-2">{step.title}</h3>
                    <p className="text-sm text-primary-500">{step.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 pattern-grid opacity-30" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center sm:text-left">
              <h2 className="font-serif text-2xl md:text-3xl font-semibold text-white mb-2">公益数据</h2>
              <p className="text-sm md:text-base text-white/60">用数据证明我们的专业与温度</p>
            </div>
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/30 bg-white/10 text-sm font-medium text-white transition-all duration-200 hover:bg-white/20 hover:-translate-y-0.5 backdrop-blur-sm mx-auto sm:mx-0"
              onClick={() => navigate("/admin/monitor")}
            >
              <BarChart3 className="w-4 h-4" />
              查看监管看板
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {baseStats.map((stat) => {
              const isSaturation = stat.label === "服务饱和度";
              const saturationValue = (stat as { saturation?: number }).saturation ?? 72;
              const saturationStyle = isSaturation ? getSaturationColor(saturationValue) : null;
              const Icon = isSaturation && saturationStyle ? saturationStyle.icon : stat.icon;
              const iconBgClass = isSaturation && saturationStyle ? saturationStyle.bg : "bg-accent-gold/20";
              const iconTextClass = isSaturation && saturationStyle ? saturationStyle.text : "text-accent-gold";

              return (
                <motion.div
                  key={stat.label}
                  variants={fadeInUp}
                  className="glass rounded-2xl p-6 text-center backdrop-blur-md"
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className={cn("w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4", iconBgClass)}>
                    <Icon className={cn("w-6 h-6", iconTextClass)} />
                  </div>
                  <p className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">{stat.value}</p>
                  <p className="text-sm text-white/60">{stat.label}</p>
                  {stat.isRegulatory && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      {isSaturation ? (
                        <p className={cn("text-xs font-medium", saturationStyle?.text ?? "text-white/50")}>
                          监管指标 · {getSaturationStatus(saturationValue)}
                        </p>
                      ) : (
                        <p className="text-xs text-white/50">监管指标</p>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-neutral-warm">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="section-title">律师风采</h2>
            <p className="section-subtitle">专业、敬业、公益心 — 我们的律师团队</p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {lawyers.map((lawyer) => (
              <motion.div
                key={lawyer.name}
                variants={fadeInUp}
                className="card card-hover p-6 text-center group"
                whileHover={{ y: -4 }}
              >
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-gold-gradient p-0.5">
                    <img
                      src={lawyer.avatar}
                      alt={lawyer.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
                <h3 className="font-serif text-lg font-semibold text-primary-800 mb-1">{lawyer.name}</h3>
                <p className="text-sm text-primary-500 mb-3">{lawyer.specialty}</p>
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-accent-gold fill-accent-gold" />
                    <span className="font-medium text-primary-700">{lawyer.rating}</span>
                  </div>
                  <div className="text-primary-400">|</div>
                  <span className="text-primary-500">{lawyer.years}年执业</span>
                </div>
                <div className="mt-3 pt-3 border-t border-primary-100/50">
                  <span className="text-xs text-primary-400">已服务 {lawyer.cases} 位用户</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <button className="btn-gold px-8 py-3" onClick={() => navigate("/submit")}>
              立即开始咨询
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
