import { useNavigate } from "react-router-dom";
import { Building2, User, ShieldCheck, FileCheck, Sparkles, Shield } from "lucide-react";
import { useStore } from "@/store";
import { mockJobs } from "@/mock/data";
import JobCard from "@/components/business/JobCard";

const stats = [
  { label: "累计匹配", value: "128,456+" },
  { label: "入驻企业", value: "8,234+" },
  { label: "求职者满意度", value: "96.8%" },
  { label: "合同签约成功率", value: "89.2%" },
];

const features = [
  {
    icon: ShieldCheck,
    title: "AI智能风控",
    description: "营业执照OCR识别+司法风险扫描，保障用工安全",
  },
  {
    icon: FileCheck,
    title: "双重审核体系",
    description: "AI初审+人工复审，确保岗位信息真实可靠",
  },
  {
    icon: Sparkles,
    title: "智能匹配引擎",
    description: "技能+通勤+时段多维匹配，精准对接供需",
  },
  {
    icon: Shield,
    title: "全流程保障",
    description: "脱敏投递+电子签约+争议调解，全程权益保障",
  },
];

const popularJobs = mockJobs.filter((job) => job.status === "published").slice(0, 8);

export default function PlatformHomePage() {
  const navigate = useNavigate();
  const { setActiveRole, setCurrentUser } = useStore();

  const handleRoleSelect = (role: "employer" | "jobseeker") => {
    setActiveRole(role);
    setCurrentUser({
      id: `user-${Date.now()}`,
      phone: "13800000000",
      role,
      name: role === "employer" ? "雇主用户" : "求职者用户",
      createdAt: new Date().toISOString(),
    });
    navigate(role === "employer" ? "/employer/dashboard" : "/jobseeker/home");
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <section
        className="relative min-h-[70vh] overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1E3A5F 0%, #2d4a6f 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
          <div className="text-center">
            <h1 className="font-serif text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              城市服务业人力资源匹配平台
            </h1>
            <p className="mt-6 text-lg text-white/80 md:text-xl">
              AI智能风控 · 求职者权益保障 · 高效用工匹配
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8">
            <div
              onClick={() => handleRoleSelect("employer")}
              className="group cursor-pointer rounded-3xl border-4 border-[#FF6B35]/30 bg-white/10 p-8 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#FF6B35] hover:bg-white/15 hover:shadow-2xl"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#FF6B35]/20 transition-transform duration-300 group-hover:scale-110">
                <Building2 className="h-10 w-10 text-[#FF6B35]" />
              </div>
              <h2 className="mt-6 font-serif text-2xl font-bold text-white md:text-3xl">
                我是雇主
              </h2>
              <p className="mt-3 text-white/70">
                发布岗位、智能匹配人才、高效管理招聘流程
              </p>
              <button className="mt-8 w-full rounded-xl bg-[#FF6B35] py-4 text-base font-semibold text-white transition-all duration-300 hover:bg-[#FF5A20] hover:shadow-lg">
                进入雇主中心
              </button>
            </div>

            <div
              onClick={() => handleRoleSelect("jobseeker")}
              className="group cursor-pointer rounded-3xl border-4 border-[#3B82F6]/30 bg-white/10 p-8 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#3B82F6] hover:bg-white/15 hover:shadow-2xl"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#1E3A5F]/50 transition-transform duration-300 group-hover:scale-110">
                <User className="h-10 w-10 text-white" />
              </div>
              <h2 className="mt-6 font-serif text-2xl font-bold text-white md:text-3xl">
                我是求职者
              </h2>
              <p className="mt-3 text-white/70">
                智能推荐岗位、一键投递、保障求职权益
              </p>
              <button className="mt-8 w-full rounded-xl bg-[#1E3A5F] py-4 text-base font-semibold text-white transition-all duration-300 hover:bg-[#1a3352] hover:shadow-lg">
                进入求职者中心
              </button>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="glass rounded-2xl p-6 text-center transition-all duration-300 hover:bg-white/20"
              >
                <div className="font-serif text-2xl font-bold text-white md:text-3xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-bold text-primary md:text-4xl">
              热门岗位推荐
            </h2>
            <p className="mt-3 text-gray-600">
              精选城市服务业优质岗位，一键投递
            </p>
          </div>

          <div className="mt-12 -mx-4 overflow-x-auto px-4 pb-4">
            <div className="flex gap-6" style={{ minWidth: "max-content" }}>
              {popularJobs.map((job) => (
                <div key={job.id} className="w-80 flex-shrink-0">
                  <JobCard job={job} showApplyButton />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-bold text-primary md:text-4xl">
              核心服务能力
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-gray-100 bg-gray-50 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:bg-white hover:shadow-xl"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/15">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mt-6 font-serif text-xl font-bold text-primary">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent font-serif text-lg font-bold text-white">
                匹
              </div>
              <span className="font-serif text-xl font-bold tracking-wide text-primary">
                智聘匹配
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="transition-colors hover:text-primary">
                关于我们
              </a>
              <a href="#" className="transition-colors hover:text-primary">
                使用条款
              </a>
              <a href="#" className="transition-colors hover:text-primary">
                隐私政策
              </a>
              <a href="#" className="transition-colors hover:text-primary">
                联系客服
              </a>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-8 text-center text-sm text-gray-400">
            © 2026 智聘匹配 · 城市服务业人力资源匹配平台 · 沪ICP备XXXXXXXX号
          </div>
        </div>
      </footer>
    </div>
  );
}
