import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Scale,
  FileText,
  ChevronRight,
  FileBadge,
  BriefcaseMedical,
  ClipboardList,
  AlertTriangle,
  BookOpen,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const services = [
  {
    icon: ShieldCheck,
    title: "社保查询",
    desc: "参保信息、缴费记录、待遇发放",
    to: "/social-insurance",
    gradient: "from-blue-500 to-primary-600",
  },
  {
    icon: Briefcase,
    title: "就业服务",
    desc: "岗位推荐、就业登记、失业保障",
    to: "/employment",
    gradient: "from-emerald-500 to-green-600",
  },
  {
    icon: GraduationCap,
    title: "人才服务",
    desc: "职称评审、技能鉴定、人才认定",
    to: "/talent",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Scale,
    title: "劳动维权",
    desc: "欠薪举报、仲裁申请、监察投诉",
    to: "/labor",
    gradient: "from-amber-500 to-orange-500",
  },
];

const announcements = [
  { title: "关于调整2026年度社会保险缴费基数的通知", date: "2026-01-15", dept: "社会保险基金管理局" },
  { title: "广东省就业困难人员认定管理办法（2026年修订）", date: "2026-02-20", dept: "就业促进处" },
  { title: "广东省职称评审管理服务实施办法", date: "2026-03-10", dept: "专业技术人员管理处" },
  { title: "广东省劳动保障监察条例（2026年修正）", date: "2026-04-05", dept: "劳动保障监察局" },
  { title: "关于进一步做好高校毕业生就业创业工作的通知", date: "2026-05-08", dept: "就业促进处" },
];

const quickServices = [
  { icon: ShieldCheck, label: "参保查询", to: "/social-insurance" },
  { icon: FileBadge, label: "证明生成", to: "/social-insurance" },
  { icon: BriefcaseMedical, label: "岗位推荐", to: "/employment" },
  { icon: ClipboardList, label: "职称申报", to: "/talent" },
  { icon: AlertTriangle, label: "欠薪直报", to: "/labor" },
  { icon: BookOpen, label: "政策检索", to: "/admin/policy" },
];

export default function Home() {
  const navigate = useNavigate();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [keyword, setKeyword] = useState('社保 政策');

  const advanceCarousel = useCallback(() => {
    setCarouselIndex((i) => (i + 1) % announcements.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(advanceCarousel, 5000);
    return () => clearInterval(timer);
  }, [advanceCarousel]);

  const visibleAnnouncements = [
    announcements[carouselIndex % announcements.length],
    announcements[(carouselIndex + 1) % announcements.length],
    announcements[(carouselIndex + 2) % announcements.length],
  ];

  return (
    <div className="min-h-screen bg-gov-bg">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 to-primary-600 text-white">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative max-w-5xl mx-auto px-6 py-14 text-center animate-fade-in">
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-wide mb-3">
            广东省人力资源和社会保障厅
          </h1>
          <p className="text-primary-200 text-base md:text-lg tracking-widest">
            移动政务中台 — 一网通办 掌上可办
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 -mt-8 relative z-10">
        <div className="gov-card p-4 mb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gov-muted" />
              <input
                type="text"
                placeholder="请输入搜索关键词"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="gov-input pl-10"
              />
            </div>
            <button
              type="button"
              onClick={() => navigate(`/admin/policy?q=${encodeURIComponent(keyword.trim() || '政策')}`)}
              className="px-5 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              搜索
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="px-5 py-2.5 rounded-lg border border-primary-200 text-primary-600 text-sm font-medium hover:bg-primary-50 transition-colors"
            >
              后台管理
            </button>
          </div>
          <p className="text-xs text-gov-muted mt-3">
            搜索结果：社保查询、就业服务、政策文件和后台管理数据已接入本地服务。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {services.map((s, i) => (
            <button
              key={s.title}
              onClick={() => navigate(s.to)}
              className={cn(
                "gov-card p-5 text-left group cursor-pointer animate-slide-up",
                "hover:scale-[1.03] hover:shadow-elevated"
              )}
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
            >
              <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-sm", s.gradient)}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-gov-text font-semibold text-base mb-1">{s.title}</h3>
              <p className="text-gov-muted text-xs leading-relaxed">{s.desc}</p>
              <ChevronRight className="w-4 h-4 text-gov-muted absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 mt-8">
        <h2 className="gov-section-title mb-5">政策公告</h2>
        <div className="gov-card overflow-hidden">
          <div className="divide-y divide-gov-border">
            {visibleAnnouncements.map((a, i) => (
              <div
                key={`${a.date}-${i}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-primary-50/40 transition-colors cursor-pointer animate-fade-in"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gov-text font-medium truncate">{a.title}</p>
                  <p className="text-xs text-gov-muted mt-0.5">{a.dept}</p>
                </div>
                <span className="flex-shrink-0 text-xs text-gov-muted">{a.date}</span>
                <ChevronRight className="w-4 h-4 text-gov-muted flex-shrink-0" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 py-3 bg-primary-50/30">
            {announcements.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-300",
                  i === carouselIndex ? "bg-primary-500 w-4" : "bg-primary-200"
                )}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 mt-8 pb-10">
        <h2 className="gov-section-title mb-5">快捷服务</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {quickServices.map((q, i) => (
            <button
              key={q.label}
              onClick={() => navigate(q.to)}
              className={cn(
                "gov-card flex flex-col items-center justify-center py-5 px-2 cursor-pointer group",
                "hover:scale-[1.05] hover:shadow-card-hover animate-slide-up"
              )}
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center mb-2 group-hover:from-primary-100 group-hover:to-primary-200 transition-colors">
                <q.icon className="w-4.5 h-4.5 text-primary-500" />
              </div>
              <span className="text-xs text-gov-text font-medium">{q.label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
