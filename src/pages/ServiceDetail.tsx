import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
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
  MessageSquare,
  Bell,
  Route,
  FileEdit,
  CalendarCheck,
  Send,
  X,
} from "lucide-react";
import { useAppStore } from "@/store";
import { serviceDomains, statusTextMap } from "@/data/mockData";
import { cn } from "@/lib/utils";

type LifecycleTab =
  | "intro"
  | "appointment"
  | "apply"
  | "materials"
  | "progress"
  | "result"
  | "evaluate";

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const services = useAppStore((s) => s.services);
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const user = useAppStore((s) => s.user);
  const service = services.find((s) => s.id === id);
  const paramTab = searchParams.get("tab") as LifecycleTab | null;

  const validTabs: LifecycleTab[] = [
    "intro",
    "appointment",
    "apply",
    "materials",
    "progress",
    "result",
    "evaluate",
  ];
  const [activeTab, setActiveTab] = useState<LifecycleTab>(
    paramTab && validTabs.includes(paramTab) ? paramTab : "intro"
  );
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    if (paramTab && validTabs.includes(paramTab)) {
      setActiveTab(paramTab);
    }
  }, [paramTab]);

  const handleTabChange = (t: LifecycleTab) => {
    setActiveTab(t);
    setSearchParams({ tab: t });
  };

  const tabConfig = useMemo(
    () => [
      { k: "intro", label: "服务介绍", icon: FileCheck },
      { k: "appointment", label: "在线预约", icon: CalendarCheck },
      { k: "apply", label: "在线申办", icon: FileEdit },
      { k: "materials", label: "材料上传", icon: Upload },
      { k: "progress", label: "进度追踪", icon: Route },
      { k: "result", label: "结果推送", icon: Bell },
      { k: "evaluate", label: "服务评价", icon: MessageSquare },
    ],
    []
  );

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
  const isOffline = service.status !== "online";

  const handleApply = () => {
    if (!isLoggedIn) {
      navigate("/login", { state: { redirect: `/services/${service.id}?tab=apply` } });
    } else {
      setActiveTab("apply");
      setSearchParams({ tab: "apply" });
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
                      <span className="badge-warning">维护中·暂停服务</span>
                    )}
                    {service.onlineAvailable && service.status === "online" && (
                      <span className="badge-success">支持在线办理</span>
                    )}
                    {service.appointmentAvailable && service.status === "online" && (
                      <span className="badge-primary">支持预约</span>
                    )}
                    {service.fee === "免费" && <span className="badge-gray">免费办理</span>}
                  </div>
                  <h1 className="font-serif text-2xl font-bold text-ink mb-3">{service.name}</h1>
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
                  disabled={isOffline}
                  className="btn-primary !px-6 !py-2.5"
                >
                  <FileCheck className="w-4 h-4" /> 立即办理
                </button>
                {service.appointmentAvailable && (
                  <button
                    onClick={() => handleTabChange("appointment")}
                    disabled={isOffline}
                    className={cn("btn-secondary !px-6 !py-2.5", isOffline && "opacity-50 cursor-not-allowed")}
                  >
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

            {/* Tab切换 - 扩展为7个生命周期Tab */}
            <div className="card">
              <div className="flex border-b border-ink-border px-4 overflow-x-auto">
                {tabConfig.map((t) => {
                  const Ic = t.icon;
                  const disabled = isOffline && t.k !== "intro";
                  return (
                    <button
                      key={t.k}
                      onClick={() => !disabled && handleTabChange(t.k as LifecycleTab)}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-4 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                        activeTab === t.k
                          ? "text-gov-600 border-gov-600"
                          : disabled
                          ? "text-gray-300 border-transparent cursor-not-allowed"
                          : "text-ink-light border-transparent hover:text-ink"
                      )}
                    >
                      <Ic className="w-4 h-4" /> {t.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-6">
                {/* 服务介绍 */}
                {activeTab === "intro" && (
                  <div className="animate-fade-in space-y-6">
                    <div>
                      <h3 className="font-medium text-ink mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-gov-600" /> 服务概述
                      </h3>
                      <p className="text-ink leading-relaxed">{service.description}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-ink mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-success-600" /> 办理条件
                      </h3>
                      <ul className="space-y-2 text-ink">
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
                    </div>
                    <div>
                      <h3 className="font-medium text-ink mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-warning-600" /> 收费标准
                      </h3>
                      <div className="p-4 bg-warning-50 rounded-lg border border-warning-100">
                        <p className="text-ink">
                          办理费用：<span className="font-semibold text-warning-700">{service.fee || "详见办理窗口"}</span>
                        </p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-ink mb-3 flex items-center gap-2">
                        <Building className="w-5 h-5 text-violet-600" /> 办理机构
                      </h3>
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
                  </div>
                )}

                {/* 在线预约 */}
                {activeTab === "appointment" && (
                  <div className="animate-fade-in space-y-5">
                    <div className="p-4 rounded-lg bg-gov-50 border border-gov-100">
                      <h3 className="font-medium text-gov-800 mb-2 flex items-center gap-2">
                        <CalendarCheck className="w-5 h-5" /> 预约窗口办理
                      </h3>
                      <p className="text-sm text-gov-700/80">
                        可提前预约未来7个工作日的办理窗口，支持上午（9:00-11:30）和下午（13:30-16:30）两个时段。
                      </p>
                    </div>
                    {isLoggedIn ? (
                      <>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-ink-light mb-1.5 block">预约日期</label>
                            <input
                              type="date"
                              defaultValue={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                              className="w-full px-4 py-2.5 border border-ink-border rounded-lg text-ink focus:border-gov-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-ink-light mb-1.5 block">办理时段</label>
                            <select className="w-full px-4 py-2.5 border border-ink-border rounded-lg text-ink focus:border-gov-500 focus:outline-none">
                              <option>上午 9:00-11:30（剩余15号）</option>
                              <option>下午 13:30-16:30（剩余20号）</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm text-ink-light mb-1.5 block">办理人</label>
                          <input
                            defaultValue={user?.name || "张三"}
                            className="w-full px-4 py-2.5 border border-ink-border rounded-lg text-ink focus:border-gov-500 focus:outline-none bg-gray-50"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="text-sm text-ink-light mb-1.5 block">
                            备注说明 <span className="text-ink-lighter">（选填）</span>
                          </label>
                          <textarea
                            rows={3}
                            placeholder="如有特殊需求请填写..."
                            className="w-full px-4 py-2.5 border border-ink-border rounded-lg text-ink focus:border-gov-500 focus:outline-none resize-none"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button className="btn-primary flex-1 justify-center">
                            <CalendarCheck className="w-4 h-4" /> 提交预约
                          </button>
                          <button onClick={() => handleTabChange("intro")} className="btn-ghost justify-center">
                            取消
                          </button>
                        </div>
                        <p className="text-xs text-ink-light pt-2">
                          提交后将通过短信发送预约确认，您也可以在"我的办件"中查看和管理预约。
                        </p>
                      </>
                    ) : (
                      <div className="text-center py-10">
                        <User className="w-12 h-12 text-ink-lighter mx-auto mb-4" />
                        <p className="text-ink-light mb-4">请先登录后进行预约</p>
                        <button
                          onClick={() => navigate("/login", { state: { redirect: `/services/${service.id}?tab=appointment` } })}
                          className="btn-primary justify-center"
                        >
                          登录并预约
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 在线申办 */}
                {activeTab === "apply" && (
                  <div className="animate-fade-in space-y-5">
                    <div className="p-4 rounded-lg bg-gov-50 border border-gov-100">
                      <h3 className="font-medium text-gov-800 mb-2 flex items-center gap-2">
                        <FileEdit className="w-5 h-5" /> 在线申办信息
                      </h3>
                      <p className="text-sm text-gov-700/80">
                        请如实填写申请信息，系统将自动关联您的电子证照，部分材料无需重复上传。
                      </p>
                    </div>
                    {isLoggedIn ? (
                      <>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-ink-light mb-1.5 block">
                              申请人姓名 <span className="text-danger-500">*</span>
                            </label>
                            <input
                              defaultValue={user?.name || "张三"}
                              className="w-full px-4 py-2.5 border border-ink-border rounded-lg text-ink bg-gray-50"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="text-sm text-ink-light mb-1.5 block">
                              身份证号 <span className="text-danger-500">*</span>
                            </label>
                            <input
                              defaultValue="320583********0001"
                              className="w-full px-4 py-2.5 border border-ink-border rounded-lg text-ink bg-gray-50"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="text-sm text-ink-light mb-1.5 block">
                              联系手机 <span className="text-danger-500">*</span>
                            </label>
                            <input
                              defaultValue="138****8888"
                              className="w-full px-4 py-2.5 border border-ink-border rounded-lg text-ink focus:border-gov-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-ink-light mb-1.5 block">
                              送达方式 <span className="text-danger-500">*</span>
                            </label>
                            <select className="w-full px-4 py-2.5 border border-ink-border rounded-lg text-ink focus:border-gov-500 focus:outline-none">
                              <option>电子证照（推荐，立即可用）</option>
                              <option>邮寄送达（3个工作日内，邮费到付）</option>
                              <option>窗口自取（凭身份证领取）</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-success-50 rounded-lg border border-success-100">
                          <CheckCircle2 className="w-5 h-5 text-success-600 mt-0.5 shrink-0" />
                          <div className="text-sm text-success-700">
                            已为您自动关联电子证照：居民身份证、居民户口簿，无需重复上传。
                          </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => handleTabChange("materials")}
                            className="btn-primary flex-1 justify-center"
                          >
                            <FileCheck className="w-4 h-4" /> 下一步 · 上传材料
                          </button>
                          <button onClick={() => handleTabChange("intro")} className="btn-ghost justify-center">
                            取消
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-10">
                        <User className="w-12 h-12 text-ink-lighter mx-auto mb-4" />
                        <p className="text-ink-light mb-4">请先实名认证后进行申办</p>
                        <button
                          onClick={() => navigate("/login", { state: { redirect: `/services/${service.id}?tab=apply` } })}
                          className="btn-primary justify-center"
                        >
                          实名认证登录
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 材料上传 */}
                {activeTab === "materials" && (
                  <div className="animate-fade-in space-y-5">
                    <div className="p-4 rounded-lg bg-gov-50 border border-gov-100">
                      <h3 className="font-medium text-gov-800 mb-2 flex items-center gap-2">
                        <Upload className="w-5 h-5" /> 申请材料清单
                      </h3>
                      <p className="text-sm text-gov-700/80">
                        请上传以下材料，支持 JPG、PNG、PDF 格式，单个文件不超过 10MB。
                      </p>
                    </div>
                    <div className="space-y-3">
                      {service.materials.map((m, idx) => (
                        <div
                          key={m.id}
                          className="p-4 rounded-lg border border-ink-border hover:border-gov-200 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-4 mb-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gov-50 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5 text-gov-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-ink">{m.name}</h4>
                                  {m.required ? (
                                    <span className="badge-danger">必填</span>
                                  ) : (
                                    <span className="badge-gray">选填</span>
                                  )}
                                  <span className="badge-primary">{m.format.toUpperCase()}</span>
                                </div>
                                <p className="text-xs text-ink-light">{m.description}</p>
                              </div>
                            </div>
                            {idx < 2 ? (
                              <span className="badge-success shrink-0">✓ 已关联电子证照</span>
                            ) : (
                              <button className="btn-secondary !py-1.5 !px-3 !text-xs shrink-0">
                                <Upload className="w-3 h-3" /> 上传
                              </button>
                            )}
                          </div>
                          {idx >= 2 && (
                            <div className="ml-13 pl-13">
                              <div className="p-3 border border-dashed border-ink-border rounded-lg text-center hover:border-gov-300 hover:bg-gov-50/50 transition-colors cursor-pointer">
                                <Upload className="w-6 h-6 text-ink-lighter mx-auto mb-1" />
                                <p className="text-xs text-ink-light">
                                  点击或拖拽文件至此处上传 · 支持 JPG/PNG/PDF
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleTabChange("progress")}
                        className="btn-primary flex-1 justify-center"
                      >
                        <Send className="w-4 h-4" /> 提交申请 · 进入追踪
                      </button>
                      <button onClick={() => handleTabChange("apply")} className="btn-ghost justify-center">
                        返回上一步
                      </button>
                    </div>
                  </div>
                )}

                {/* 进度追踪 */}
                {activeTab === "progress" && (
                  <div className="animate-fade-in space-y-5">
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                      <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                        <Route className="w-5 h-5" /> 办件进度追踪
                      </h3>
                      <p className="text-sm text-amber-700/80">
                        当前办件编号：B20260619{service.id.toUpperCase()} · 受理时间：2026-06-19 09:15
                      </p>
                    </div>
                    <div className="relative py-2">
                      {service.processSteps.map((step, idx) => {
                        const status = idx <= 1 ? "done" : idx === 2 ? "doing" : "todo";
                        return (
                          <div key={step.id} className="flex gap-4 pb-8 last:pb-0">
                            <div className="flex flex-col items-center">
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-full text-white flex items-center justify-center font-semibold shrink-0",
                                  status === "done"
                                    ? "bg-success-500"
                                    : status === "doing"
                                    ? "gov-gradient animate-pulse"
                                    : "bg-gray-300"
                                )}
                              >
                                {status === "done" ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                              </div>
                              {idx < service.processSteps.length - 1 && (
                                <div
                                  className={cn(
                                    "w-0.5 flex-1 mt-2",
                                    status === "done" ? "bg-success-400" : "bg-gray-200"
                                  )}
                                />
                              )}
                            </div>
                            <div className="flex-1 pb-2">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-ink">{step.name}</h4>
                                {status === "done" && (
                                  <span className="badge-success">已完成</span>
                                )}
                                {status === "doing" && <span className="badge-primary">办理中</span>}
                                {status === "todo" && <span className="badge-gray">待办理</span>}
                              </div>
                              <p className="text-sm text-ink-light mb-2">{step.description}</p>
                              <div className="flex items-center gap-4 text-xs text-ink-light">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> 预计 {step.estimatedDays} 个工作日
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" /> {step.department}
                                </span>
                                {status === "done" && (
                                  <span className="text-success-600">办结时间：2026-06-19 14:22</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Link to="/cases" className="btn-secondary flex-1 justify-center">
                        <Route className="w-4 h-4" /> 在"我的办件"查看全部
                      </Link>
                      <button onClick={() => handleTabChange("result")} className="btn-ghost justify-center">
                        查看结果
                      </button>
                    </div>
                  </div>
                )}

                {/* 结果推送 */}
                {activeTab === "result" && (
                  <div className="animate-fade-in space-y-5">
                    <div className="p-6 rounded-lg bg-gradient-to-br from-success-50 to-gov-50 border border-success-200 text-center">
                      <div className="w-16 h-16 rounded-full bg-success-500 text-white flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <h3 className="font-serif text-xl font-bold text-ink mb-2">办件已完成</h3>
                      <p className="text-ink-light mb-4">
                        办件编号 B20260619{service.id.toUpperCase()} 已审批通过
                      </p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-success-200">
                        <Bell className="w-4 h-4 text-success-600" />
                        <span className="text-sm text-success-700">结果已于 2026-06-19 16:42 通过短信、App推送同步送达</span>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border border-ink-border">
                        <h4 className="font-medium text-ink mb-3 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-gov-600" /> 电子证照
                        </h4>
                        <p className="text-sm text-ink-light mb-3">
                          办理结果已生成电子证照，可在"电子证照"中查看、下载、亮证使用：
                        </p>
                        <Link to="/certificates" className="btn-primary !py-2 !text-sm justify-center">
                          <FileCheck className="w-4 h-4" /> 查看我的电子证照
                        </Link>
                      </div>
                      <div className="p-4 rounded-lg border border-ink-border">
                        <h4 className="font-medium text-ink mb-3 flex items-center gap-2">
                          <Send className="w-5 h-5 text-violet-600" /> 送达方式
                        </h4>
                        <ul className="text-sm text-ink space-y-2">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-success-600" />
                            <span>短信通知（138****8888）已送达</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-success-600" />
                            <span>App推送已送达</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-success-600" />
                            <span>电子证照已入库</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => handleTabChange("evaluate")} className="btn-primary flex-1 justify-center">
                        <MessageSquare className="w-4 h-4" /> 对本次服务进行评价
                      </button>
                      <button onClick={() => handleTabChange("progress")} className="btn-ghost justify-center">
                        返回进度
                      </button>
                    </div>
                  </div>
                )}

                {/* 服务评价 */}
                {activeTab === "evaluate" && (
                  <div className="animate-fade-in space-y-5">
                    <div className="p-4 rounded-lg bg-gov-50 border border-gov-100">
                      <h3 className="font-medium text-gov-800 mb-2 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" /> 服务评价
                      </h3>
                      <p className="text-sm text-gov-700/80">
                        您的评价是我们改进政务服务的重要依据，感谢您的参与！
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-ink-light mb-3 block">整体满意度</label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} className="group">
                            <Star
                              className={cn(
                                "w-8 h-8 transition-colors",
                                n <= 5 ? "text-warning-500 fill-warning-500" : "text-ink-lighter group-hover:text-warning-400"
                              )}
                            />
                          </button>
                        ))}
                        <span className="text-sm text-warning-600 ml-2 font-medium">5.0 非常满意</span>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {[
                        { label: "办理便捷度", value: 5 },
                        { label: "材料清晰度", value: 5 },
                        { label: "时效满意度", value: 5 },
                        { label: "窗口态度", value: 5 },
                        { label: "结果满意度", value: 5 },
                        { label: "线上体验", value: 5 },
                      ].map((d) => (
                        <div key={d.label} className="p-3 rounded-lg border border-ink-border">
                          <p className="text-xs text-ink-light mb-1.5">{d.label}</p>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star
                                key={n}
                                className={cn(
                                  "w-4 h-4",
                                  n <= d.value ? "text-warning-500 fill-warning-500" : "text-ink-lighter"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="text-sm text-ink-light mb-1.5 block">意见建议 <span className="text-ink-lighter">（选填）</span></label>
                      <textarea
                        rows={4}
                        placeholder="您的宝贵建议..."
                        className="w-full px-4 py-2.5 border border-ink-border rounded-lg text-ink focus:border-gov-500 focus:outline-none resize-none"
                      />
                    </div>
                    <div className="flex items-start gap-2 text-xs text-ink-light">
                      <X className="w-3.5 h-3.5 mt-0.5" />
                      <span>评价提交后将计入政务服务"好差评"系统，您的个人信息将严格保密。</span>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button className="btn-primary flex-1 justify-center">
                        <Star className="w-4 h-4" /> 提交评价
                      </button>
                      <button onClick={() => handleTabChange("result")} className="btn-ghost justify-center">
                        暂不评价
                      </button>
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
                    { k: "intro", label: "服务介绍", icon: FileCheck },
                    { k: "appointment", label: "预约", icon: CalendarCheck },
                    { k: "apply", label: "申办", icon: FileEdit },
                    { k: "materials", label: "材料上传", icon: Upload },
                    { k: "progress", label: "进度追踪", icon: Route },
                    { k: "result", label: "结果推送", icon: Bell },
                    { k: "evaluate", label: "服务评价", icon: Star },
                  ].map((s) => {
                    const Ic = s.icon;
                    const idx = tabConfig.findIndex((t) => t.k === s.k);
                    const activeIdx = tabConfig.findIndex((t) => t.k === activeTab);
                    const isDone = idx < activeIdx;
                    const isActive = idx === activeIdx;
                    return (
                      <button
                        key={s.label}
                        onClick={() => !isOffline && handleTabChange(s.k as LifecycleTab)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg border p-2 transition-colors text-left",
                          isActive
                            ? "border-gov-400 bg-gov-600 text-white"
                            : isDone
                            ? "border-gov-200 bg-white text-gov-700 hover:bg-gov-50"
                            : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
                        )}
                      >
                        <Ic className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-medium whitespace-nowrap text-[11px]">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2.5">
                <button
                  onClick={handleApply}
                  disabled={isOffline}
                  className="w-full btn-primary justify-center"
                >
                  <FileCheck className="w-4 h-4" /> 立即在线办理
                </button>
                {service.appointmentAvailable && (
                  <button
                    onClick={() => handleTabChange("appointment")}
                    disabled={isOffline}
                    className={cn("w-full btn-secondary justify-center", isOffline && "opacity-50 cursor-not-allowed")}
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
