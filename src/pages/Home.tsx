import { Link, useNavigate } from "react-router-dom";
import {
  HeartHandshake,
  FileCheck,
  Stethoscope,
  Car,
  GraduationCap,
  Coffee,
  ArrowRight,
  Clock,
  Star,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Search,
} from "lucide-react";
import { useAppStore } from "@/store";
import { serviceDomains, statusTextMap } from "@/data/mockData";
import type { ServiceDomain } from "@/types";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  HeartHandshake,
  FileCheck,
  Stethoscope,
  Car,
  GraduationCap,
  Coffee,
};

export default function Home() {
  const navigate = useNavigate();
  const { services, cases, isLoggedIn } = useAppStore();
  const setSelectedDomain = useAppStore((s) => s.setSelectedDomain);
  const setSearchKeyword = useAppStore((s) => s.setSearchKeyword);

  const hotServices = [...services]
    .sort((a, b) => b.applyCount - a.applyCount)
    .slice(0, 10);

  const activeCases = cases.filter((c) =>
    ["processing", "accepted", "submitted", "pending_material"].includes(c.status)
  );

  const handleDomainClick = (code: ServiceDomain) => {
    setSelectedDomain(code);
    setSearchKeyword("");
    navigate("/services");
  };

  const handleSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSearchKeyword((e.target as HTMLInputElement).value);
      navigate("/services");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gov-gradient opacity-95" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-ink-bg to-transparent" />

        <div className="relative container py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              已接入 486 项政务服务 · 覆盖全市 12 个区县
            </div>
            <h1 className="font-serif text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              昆山市政务服务统一工作台
            </h1>
            <p className="text-lg lg:text-xl text-white/85 mb-8">
              让数据多跑路 · 让群众少跑腿 · 一网通办 · 全城通办
            </p>

            <div className="max-w-2xl mx-auto">
              <div className="relative flex items-center bg-white rounded-xl shadow-2xl p-2">
                <Search className="w-5 h-5 text-ink-light ml-4" />
                <input
                  type="text"
                  onKeyDown={handleSearchEnter}
                  placeholder="搜索您需要办理的服务事项，如：身份证补办、社保缴纳..."
                  className="flex-1 px-4 py-3 text-ink outline-none rounded-lg"
                />
                <button
                  onClick={() => navigate("/services")}
                  className="btn-primary !py-3 !px-6 whitespace-nowrap"
                >
                  搜索服务
                </button>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4 text-sm text-white/70">
                <span>热门搜索：</span>
                {["社保卡申领", "身份证补办", "预约挂号", "营业执照", "驾驶证换证"].map(
                  (kw) => (
                    <button
                      key={kw}
                      onClick={() => {
                        setSearchKeyword(kw);
                        navigate("/services");
                      }}
                      className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-colors"
                    >
                      {kw}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container -mt-8 relative z-10 pb-16">
        {/* 六大服务域 */}
        <section className="mb-12">
          <div className="card p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title !mb-0">
                <div className="w-1 h-6 bg-gov-600 rounded-full" />
                六大服务域
              </h2>
              <Link
                to="/services"
                className="text-sm text-gov-600 hover:text-gov-700 flex items-center gap-1"
              >
                全部服务 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {serviceDomains.map((domain, idx) => {
                const IconComp = iconMap[domain.icon];
                const count = services.filter((s) => s.category === domain.code).length;
                return (
                  <button
                    key={domain.code}
                    onClick={() => handleDomainClick(domain.code)}
                    className="group flex flex-col items-center gap-3 p-5 rounded-xl border border-transparent hover:border-gov-100 hover:bg-gov-50/50 transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div
                      className={cn(
                        "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md group-hover:scale-110 group-hover:shadow-lg transition-transform duration-300",
                        domain.color
                      )}
                    >
                      {IconComp && <IconComp className="w-7 h-7 text-white" />}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-ink">{domain.name}</p>
                      <p className="text-xs text-ink-light mt-0.5">{count} 项服务</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 我的办件进度 */}
          <section className="lg:col-span-2">
            <div className="card p-6 h-full">
              <div className="flex items-center justify-between mb-5">
                <h2 className="section-title !mb-0">
                  <div className="w-1 h-6 bg-warning-500 rounded-full" />
                  我的办件进度
                </h2>
                {isLoggedIn && (
                  <Link
                    to="/cases"
                    className="text-sm text-gov-600 hover:text-gov-700 flex items-center gap-1"
                  >
                    全部办件 <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              {!isLoggedIn ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-ink-bg flex items-center justify-center">
                    <Clock className="w-8 h-8 text-ink-light" />
                  </div>
                  <p className="text-ink-light mb-4">登录后查看您的办件进度</p>
                  <Link to="/login" className="btn-primary">
                    立即登录
                  </Link>
                </div>
              ) : activeCases.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-50 flex items-center justify-center">
                    <Star className="w-8 h-8 text-success-500" />
                  </div>
                  <p className="text-ink-light">暂无进行中的办件</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeCases.map((c) => {
                    const statusInfo = statusTextMap[c.status];
                    const total = c.timeline.length;
                    const done = c.timeline.filter((t) => t.status === "completed").length;
                    const progress = Math.round((done / total) * 100);

                    return (
                      <Link
                        key={c.id}
                        to={`/cases/${c.id}`}
                        className="block p-4 rounded-lg border border-ink-border hover:border-gov-200 hover:bg-gov-50/30 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-ink group-hover:text-gov-700 transition-colors">
                              {c.serviceName}
                            </h3>
                            <p className="text-xs text-ink-light mt-1">
                              办件编号：{c.caseNo} · 提交于 {c.applyTime.split(" ")[0]}
                            </p>
                          </div>
                          <span className={cn("shrink-0", statusInfo.badge)}>
                            {statusInfo.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-ink-bg rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                c.status === "pending_material"
                                  ? "bg-danger-500"
                                  : "bg-gov-500"
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-ink shrink-0">
                            {done}/{total}
                          </span>
                        </div>
                        <p className="text-xs text-ink-light mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 当前节点：{c.currentNode}
                          {c.estimatedFinishTime && ` · 预计 ${c.estimatedFinishTime} 完成`}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* 快捷入口 */}
          <section>
            <div className="card p-6 h-full">
              <h2 className="section-title !mb-5">
                <div className="w-1 h-6 bg-success-500 rounded-full" />
                常用快捷入口
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "办事预约", icon: Clock, color: "bg-gov-50 text-gov-600" },
                  { name: "进度查询", icon: TrendingUp, color: "bg-success-50 text-success-600" },
                  { name: "电子证照", icon: FileCheck, color: "bg-warning-50 text-warning-600" },
                  { name: "办事指南", icon: GraduationCap, color: "bg-violet-50 text-violet-600" },
                ].map((item) => (
                  <button
                    key={item.name}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border border-ink-border hover:border-gov-200 hover:shadow-card-hover transition-all"
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", item.color)}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-ink">{item.name}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-gov-50 to-gov-100 border border-gov-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gov-600 text-white flex items-center justify-center">
                    <Star className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-ink">满意度评价</p>
                    <p className="text-xs text-ink-light">您的反馈是我们前进的动力</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gov-700 mt-3 text-center">
                  96.8<span className="text-sm font-normal text-ink-light">/100分</span>
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* 热门服务推荐 */}
        <section className="mt-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title !mb-0">
                <div className="w-1 h-6 bg-danger-500 rounded-full" />
                热门服务推荐
                <span className="ml-2 text-sm font-normal text-ink-light">（本月办理量最高）</span>
              </h2>
              <Link
                to="/services"
                className="text-sm text-gov-600 hover:text-gov-700 flex items-center gap-1"
              >
                查看更多 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {hotServices.slice(0, 10).map((svc, idx) => {
                const domain = serviceDomains.find((d) => d.code === svc.category);
                return (
                  <Link
                    key={svc.id}
                    to={`/services/${svc.id}`}
                    className="card-hover p-4 animate-fade-in"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
                          domain?.color || "from-gov-500 to-gov-700"
                        )}
                      >
                        {domain && iconMap[domain.icon] && (
                          (() => {
                            const Ic = iconMap[domain.icon];
                            return <Ic className="w-5 h-5 text-white" />;
                          })()
                        )}
                      </div>
                      <span className="text-xs font-bold text-danger-500">
                        TOP{idx + 1}
                      </span>
                    </div>
                    <h3 className="font-medium text-ink mb-1 line-clamp-1">{svc.name}</h3>
                    <p className="text-xs text-ink-light line-clamp-2 mb-3">
                      {svc.subCategory} · {svc.department}
                    </p>
                    <div className="flex items-center justify-between text-xs text-ink-light">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-success-500" />
                        {svc.applyCount.toLocaleString()} 人办理
                      </span>
                      <span className="flex items-center gap-1 text-warning-600">
                        <Star className="w-3 h-3 fill-current" />
                        {svc.satisfactionRate.toFixed(1)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gov-800 text-white/80 py-8">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-serif text-lg font-bold text-white mb-3">
                昆山市政务服务统一工作台
              </h3>
              <p className="text-sm leading-relaxed">
                主办单位：昆山市数据局<br />
                技术支持：昆山市大数据中心
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-3">联系我们</h4>
              <p className="text-sm">服务热线：12345</p>
              <p className="text-sm">工作时间：周一至周五 9:00-17:00</p>
              <p className="text-sm">现场地址：昆山市前进中路219号政务服务中心</p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-3">友情链接</h4>
              <div className="flex flex-wrap gap-3 text-sm">
                <a href="#" className="hover:text-white">江苏省政务服务网</a>
                <a href="#" className="hover:text-white">苏州市人民政府</a>
                <a href="#" className="hover:text-white">昆山市人民政府</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-6 text-center text-xs text-white/50">
            © 2024 昆山市数据局 版权所有 · 苏ICP备XXXXXXXX号 · 苏公网安备XXXXXXXXXXXXX号
          </div>
        </div>
      </footer>
    </div>
  );
}
