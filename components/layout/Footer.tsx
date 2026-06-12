import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  Mail,
  Github,
  Twitter,
  Linkedin,
  Shield,
  Zap,
  Users,
  Building2,
  Radio,
  Eye,
  DollarSign,
  CalendarDays,
  Brain,
  Video,
  Briefcase,
  BarChart3,
  UserCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";

type FooterLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string;
};

export function Footer() {
  const footerLinks: Record<string, FooterLink[]> = {
    求职者服务: [
      { label: "AI简历解析", href: "/resume/ai", icon: <Brain className="h-3.5 w-3.5" />, badge: "NEW" },
      { label: "职位搜索", href: "/jobs", icon: <Briefcase className="h-3.5 w-3.5" /> },
      { label: "一键投递", href: "/jobs", icon: <Briefcase className="h-3.5 w-3.5" /> },
      { label: "视频面试预约", href: "/interviews", icon: <Video className="h-3.5 w-3.5" /> },
      { label: "面试录制回放", href: "/interviews?tab=completed", icon: <Video className="h-3.5 w-3.5" /> },
      { label: "直播带岗", href: "/live", icon: <Radio className="h-3.5 w-3.5" />, badge: "热门" },
      { label: "招聘会日历", href: "/employer/fairs", icon: <CalendarDays className="h-3.5 w-3.5" /> },
      { label: "能力画像", href: "/profile", icon: <UserCircle className="h-3.5 w-3.5" /> },
    ],
    企业服务: [
      { label: "企业数据看板", href: "/employer/dashboard", icon: <BarChart3 className="h-3.5 w-3.5" /> },
      { label: "直播招聘后台", href: "/employer/live", icon: <Radio className="h-3.5 w-3.5" />, badge: "直播中" },
      { label: "推流与连麦", href: "/employer/live", icon: <Radio className="h-3.5 w-3.5" /> },
      { label: "弹幕审核", href: "/employer/live#moderation", icon: <Shield className="h-3.5 w-3.5" /> },
      { label: "岗位挂载", href: "/employer/live#jobs", icon: <Briefcase className="h-3.5 w-3.5" /> },
      { label: "雇主品牌主页", href: "/employer/brand", icon: <Building2 className="h-3.5 w-3.5" /> },
      { label: "VR导览维护", href: "/employer/brand#vr", icon: <Building2 className="h-3.5 w-3.5" /> },
      { label: "团队Vlog上传", href: "/employer/brand#vlog", icon: <Video className="h-3.5 w-3.5" /> },
    ],
    数据分析: [
      { label: "谁看过我", href: "/employer/views", icon: <Eye className="h-3.5 w-3.5" />, badge: "NEW" },
      { label: "HR活跃度排行", href: "/employer/views#activity", icon: <Users className="h-3.5 w-3.5" /> },
      { label: "岗位点击热区", href: "/employer/views#heatmap", icon: <BarChart3 className="h-3.5 w-3.5" /> },
      { label: "简历打开率分析", href: "/employer/views#openrate", icon: <Eye className="h-3.5 w-3.5" /> },
      { label: "薪酬分位报告", href: "/employer/salary", icon: <DollarSign className="h-3.5 w-3.5" />, badge: "P25/P50/P75" },
      { label: "薪酬城市对比", href: "/employer/salary#compare", icon: <DollarSign className="h-3.5 w-3.5" /> },
      { label: "AI薪酬建议", href: "/employer/salary#advice", icon: <Brain className="h-3.5 w-3.5" /> },
    ],
    招聘会系统: [
      { label: "线上展位搭建", href: "/employer/fairs#booths", icon: <Building2 className="h-3.5 w-3.5" /> },
      { label: "简历自动归集", href: "/employer/fairs#resumes", icon: <Briefcase className="h-3.5 w-3.5" /> },
      { label: "AI初筛配置", href: "/employer/fairs#screening", icon: <Brain className="h-3.5 w-3.5" /> },
      { label: "JD关键词匹配", href: "/employer/fairs#screening", icon: <Brain className="h-3.5 w-3.5" /> },
      { label: "扫码签到管理", href: "/employer/fairs#checkin", icon: <CalendarDays className="h-3.5 w-3.5" /> },
      { label: "求职者注册", href: "/auth/register?role=jobseeker" },
      { label: "企业HR注册", href: "/auth/register?role=employer" },
      { label: "登录账号", href: "/auth/login" },
    ],
  };

  return (
    <footer className="border-t bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                智聘OS
              </span>
            </Link>
            <p className="text-sm text-slate-600 mb-4 max-w-xs leading-relaxed">
              融合直播招聘、视频面试、AI简历解析、雇主品牌可视化的新一代智能招聘操作系统。
            </p>

            <div className="space-y-2 mb-6">
              <Link
                href="/dashboard"
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  求职者工作台
                </span>
                <span className="text-xs opacity-70">进入 →</span>
              </Link>
              <Link
                href="/employer/dashboard"
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 text-sm font-medium hover:from-indigo-100 hover:to-purple-100 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  企业管理后台
                </span>
                <span className="text-xs opacity-70">进入 →</span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="mailto:contact@zhipin-os.com"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
                title="邮件联系"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold text-slate-900 mb-4 text-sm flex items-center gap-2">
                {title === "求职者服务" && <UserCircle className="h-4 w-4 text-blue-500" />}
                {title === "企业服务" && <Building2 className="h-4 w-4 text-indigo-500" />}
                {title === "数据分析" && <BarChart3 className="h-4 w-4 text-purple-500" />}
                {title === "招聘会系统" && <CalendarDays className="h-4 w-4 text-amber-500" />}
                {title}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="group flex items-center justify-between gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors py-1"
                    >
                      <span className="flex items-center gap-1.5">
                        {link.icon}
                        {link.label}
                      </span>
                      <div className="flex items-center gap-1">
                        {link.badge && (
                          <Badge
                            variant={
                              link.badge === "直播中"
                                ? "destructive"
                                : link.badge.length > 5
                                ? "outline"
                                : "info"
                            }
                            size="sm"
                            className="text-[9px] px-1.5 py-0"
                          >
                            {link.badge}
                          </Badge>
                        )}
                        <span className="opacity-0 group-hover:opacity-100 text-xs transition-opacity text-blue-500">
                          →
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-slate-500">
            <p>
              © {new Date().getFullYear()} 智聘OS · 智能招聘操作系统. 保留所有权利.
            </p>
            <Link href="/privacy" className="hover:text-slate-700">
              隐私政策
            </Link>
            <Link href="/terms" className="hover:text-slate-700">
              服务条款
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100/50">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              <span>等保三级</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100/50">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>毫秒响应</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100/50">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              <span>500万+ 用户</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100/50">
              <Building2 className="h-3.5 w-3.5 text-indigo-500" />
              <span>10万+ 企业</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
