import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft,
  Building,
  Clock,
  Star,
  TrendingUp,
  FileCheck,
  Calendar,
  Heart,
  Share2,
  ChevronRight,
  CheckCircle2,
  FileText,
  Upload,
  User,
} from "lucide-react";
import { useAppStore } from "@/store";
import { serviceDomains, statusTextMap } from "@/data/mockData";
import { cn } from "@/lib/utils";

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const services = useAppStore((s) => s.services);
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const service = services.find((s) => s.id === id);
  const [activeTab, setActiveTab] = useState<"intro" | "materials" | "process" | "dept">("intro");
  const [favorited, setFavorited] = useState(false);

  if (!service) {
    return (
      <div className="container py-16 text-center">
        <p className="text-ink-light">服务不存在</p>
        <Link to="/services" className="btn-primary mt-4">
          返回服务列表
        </Link>
      </div>
    );
  }

  const domain = serviceDomains.find((d) => d.code === service.category);

  const handleApply = () => {
    if (!isLoggedIn) {
      navigate("/login", { state: { redirect: `/apply/${service.id}` } });
    } else {
      navigate(`/apply/${service.id}`);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-ink-light hover:text-gov-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 主内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 服务头部信息 */}
            <div className="card p-6">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br shadow-lg",
                    domain?.color || "from-gov-500 to-gov-700"
                  )}
                >
                  <FileCheck className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="badge-primary">{domain?.name}</span>
                    <span className="badge-gray">{service.subCategory}</span>
                    {service.status === "online" ? (
                      <span className="badge-success">服务中</span>
                    ) : (
                      <span className="badge-warning">维护中</span>
                    )}
                  </div>
                  <h1 className="font-serif text-2xl font-bold text-ink mb-3">
                    {service.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-light">
                    <span className="flex items-center gap-1">
                      <Building className="w-4 h-4" /> {service.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> 承诺期限：{service.handlingTime}
                    </span>
                    <span className="flex items-center gap-1 text-warning-600">
                      <Star className="w-4 h-4 fill-current" /> 好评率 {service.satisfactionRate.toFixed(1)}%
                    </span>
                    <span className="flex items-center gap-1 text-success-600">
                      <TrendingUp className="w-4 h-4" /> 已有 {service.applyCount.toLocaleString()} 人办理
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-ink-border">
                <button
                  onClick={handleApply}
                  disabled={service.status !== "online"}
                  className="btn-primary !px-6 !py-2.5"
                >
                  <FileCheck className="w-4 h-4" /> 立即办理
                </button>
                {service.appointmentAvailable && (
                  <button className="btn-secondary !px-6 !py-2.5">
                    <Calendar className="w-4 h-4" /> 预约办理
                  </button>
                )}
                <button
                  onClick={() => setFavorited(!favorited)}
                  className={cn(
                    "btn-secondary !px-4 !py-2.5",
                    favorited && "text-danger-600 border-danger-200 hover:bg-danger-50"
                  )}
                >
                  <Heart className={cn("w-4 h-4", favorited && "fill-current")} />
                  {favorited ? "已收藏" : "收藏"}
                </button>
                <button className="btn-ghost !px-4 !py-2.5">
                  <Share2 className="w-4 h-4" /> 分享
                </button>
              </div>
            </div>

            {/* Tab切换 */}
            <div className="card">
              <div className="flex border-b border-ink-border px-6">
                {[
                  { k: "intro", label: "服务介绍" },
                  { k: "materials", label: "所需材料" },
                  { k: "process", label: "办理流程" },
                  { k: "dept", label: "办理机构" },
                ].map((t) => (
                  <button
                    key={t.k}
                    onClick={() => setActiveTab(t.k as typeof activeTab)}
                    className={cn(
                      "px-5 py-4 text-sm font-medium border-b-2 -mb-px transition-colors",
                      activeTab === t.k
                        ? "text-gov-600 border-gov-600"
                        : "text-ink-light border-transparent hover:text-ink"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === "intro" && (
                  <div className="animate-fade-in">
                    <h3 className="font-medium text-ink mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-gov-600" /> 服务概述
                    </h3>
                    <p className="text-ink leading-relaxed mb-6">{service.description}</p>

                    <h3 className="font-medium text-ink mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-success-600" /> 办理条件
                    </h3>
                    <ul className="space-y-2 text-ink mb-6">
                      {[
                        "具有昆山市户籍或在本市居住、工作的公民",
                        "符合相关法律法规规定的申请条件",
                        "申请材料真实、完整、有效",
                        "未处于法律法规限制办理的情形",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 text-gov-600 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <h3 className="font-medium text-ink mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-warning-600" /> 收费标准
                    </h3>
                    <div className="p-4 bg-warning-50 rounded-lg border border-warning-100">
                      <p className="text-ink">
                        办理费用：<span className="font-semibold text-warning-700">{service.fee || "详见办理窗口"}</span>
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "materials" && (
                  <div className="animate-fade-in">
                    <div className="space-y-4">
                      {service.materials.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-start gap-4 p-4 rounded-lg border border-ink-border hover:border-gov-200 transition-colors"
                        >
                          <div className="w-12 h-12 rounded-lg bg-gov-50 flex items-center justify-center shrink-0">
                            <Upload className="w-6 h-6 text-gov-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-ink">{m.name}</h4>
                              {m.required ? (
                                <span className="badge-danger">必填</span>
                              ) : (
                                <span className="badge-gray">选填</span>
                              )}
                              <span className="badge-primary">{m.format.toUpperCase()}</span>
                            </div>
                            <p className="text-sm text-ink-light">{m.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-gov-50 rounded-lg border border-gov-100">
                      <h4 className="font-medium text-gov-700 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> 温馨提示
                      </h4>
                      <ul className="text-sm text-gov-700/80 space-y-1">
                        <li>• 支持上传的电子证照可自动关联，无需重复提交</li>
                        <li>• 所有上传材料请确保清晰可辨</li>
                        <li>• 材料提交后可在我的办件中查看审核状态</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === "process" && (
                  <div className="animate-fade-in">
                    <div className="relative">
                      {service.processSteps.map((step, idx) => (
                        <div key={step.id} className="flex gap-4 pb-8 last:pb-0">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full gov-gradient text-white flex items-center justify-center font-semibold shrink-0">
                              {idx + 1}
                            </div>
                            {idx < service.processSteps.length - 1 && (
                              <div className="w-0.5 flex-1 bg-gov-200 mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-2">
                            <h4 className="font-medium text-ink mb-1">{step.name}</h4>
                            <p className="text-sm text-ink-light mb-2">{step.description}</p>
                            <div className="flex items-center gap-4 text-xs text-ink-light">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> 预计 {step.estimatedDays} 个工作日
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" /> {step.department}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "dept" && (
                  <div className="animate-fade-in">
                    <div className="p-6 rounded-lg bg-ink-bg">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-xl bg-gov-100 flex items-center justify-center">
                          <Building className="w-7 h-7 text-gov-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-ink text-lg">{service.department}</h3>
                          <p className="text-sm text-ink-light">主办单位</p>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-ink-light mb-1">办理地点</p>
                          <p className="text-ink">昆山市前进中路219号政务服务中心3楼</p>
                        </div>
                        <div>
                          <p className="text-ink-light mb-1">联系电话</p>
                          <p className="text-ink">0512-57300000 转 {service.departmentId.slice(-3)}</p>
                        </div>
                        <div>
                          <p className="text-ink-light mb-1">办公时间</p>
                          <p className="text-ink">周一至周五 9:00-17:00（法定节假日除外）</p>
                        </div>
                        <div>
                          <p className="text-ink-light mb-1">咨询方式</p>
                          <p className="text-ink">在线咨询 · 电话咨询 · 现场咨询</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 侧边栏 */}
          <aside className="space-y-6">
            <div className="card p-5 overflow-hidden">
              <h3 className="font-serif font-semibold text-ink mb-3 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-gov-600" /> 事项全生命周期
              </h3>
              <div className="rounded-xl border border-gov-100 bg-gov-50/50 p-3 mb-4">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {[
                    { label: "预约", icon: Calendar, status: "ready" },
                    { label: "申办", icon: FileCheck, status: "ready" },
                    { label: "材料上传", icon: Upload, status: "ready" },
                    { label: "进度追踪", icon: Clock, status: "ready" },
                    { label: "结果推送", icon: CheckCircle2, status: "pending" },
                    { label: "服务评价", icon: Star, status: "pending" },
                  ].map((s, i) => {
                    const Ic = s.icon;
                    return (
                      <div
                        key={s.label}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg border p-2",
                          s.status === "ready"
                            ? "border-gov-200 bg-white text-gov-700"
                            : "border-gray-200 bg-gray-50 text-gray-500"
                        )}
                      >
                        <Ic className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-medium whitespace-nowrap">
                          {i + 1}.{s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2.5">
                <button
                  onClick={handleApply}
                  disabled={service.status !== "online"}
                  className="w-full btn-primary justify-center"
                >
                  <FileCheck className="w-4 h-4" /> 立即在线办理
                </button>
                {service.appointmentAvailable && (
                  <button
                    onClick={handleApply}
                    className="w-full btn-secondary justify-center"
                  >
                    <Calendar className="w-4 h-4" /> 预约窗口办理
                  </button>
                )}
                <Link to="/cases" className="w-full btn-ghost justify-center">
                  <CheckCircle2 className="w-4 h-4" /> 查询我的办件
                </Link>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-serif font-semibold text-ink mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-warning-500" /> 相关服务推荐
              </h3>
              <div className="space-y-2">
                {services
                  .filter((s) => s.category === service.category && s.id !== service.id)
                  .slice(0, 5)
                  .map((s) => (
                    <Link
                      key={s.id}
                      to={`/services/${s.id}`}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gov-50 transition-colors group"
                    >
                      <span className="text-sm text-ink group-hover:text-gov-700 line-clamp-1">
                        {s.name}
                      </span>
                      <ChevronRight className="w-4 h-4 text-ink-lighter group-hover:text-gov-600 shrink-0" />
                    </Link>
                  ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
